"""
Phase 2f: Distributed Consensus Engine

Implements consensus protocols for critical decisions across distributed nodes.
Ensures data consistency and majority-based decision making for Phase 2e operations.

Protocols:
- Raft-inspired consensus for state machine replication
- Quorum-based voting for alert decisions
- Eventual consistency for feedback aggregation
"""

import logging
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timezone
from dataclasses import dataclass, field
from enum import Enum
import threading
import random
from collections import defaultdict

logger = logging.getLogger(__name__)

# ============================================================================
# Consensus Models
# ============================================================================

class ConsensusState(Enum):
    """State of a consensus participant"""
    FOLLOWER = "follower"
    CANDIDATE = "candidate"
    LEADER = "leader"


class VoteDecision(Enum):
    """Decision outcome from consensus voting"""
    APPROVED = "approved"
    REJECTED = "rejected"
    UNDECIDED = "undecided"


@dataclass
class ConsensusProposal:
    """Proposal for distributed consensus voting"""
    proposal_id: str
    category: str  # "alert", "correlation", "threshold"
    action: str  # what to do
    data: Dict[str, Any]
    proposer_node: str
    timestamp: datetime
    required_votes: int = 0  # quorum size
    votes: Dict[str, bool] = field(default_factory=dict)  # node_id -> vote
    
    def is_approved(self) -> bool:
        """Check if proposal has quorum approval"""
        approved_votes = sum(1 for v in self.votes.values() if v)
        return approved_votes >= self.required_votes
    
    def is_rejected(self) -> bool:
        """Check if proposal is rejected (majority against)"""
        total_voters = len(self.votes)
        approved_votes = sum(1 for v in self.votes.values() if v)
        if total_voters == 0:
            return False
        return (total_voters - approved_votes) > (total_voters / 2)
    
    def vote_status(self) -> Dict[str, Any]:
        """Get voting status"""
        total = len(self.votes)
        approved = sum(1 for v in self.votes.values() if v)
        return {
            "total_votes": total,
            "approved": approved,
            "rejected": total - approved,
            "approval_percentage": (approved / total * 100) if total > 0 else 0,
            "quorum_required": self.required_votes,
            "has_quorum": self.is_approved()
        }


@dataclass
class LogEntry:
    """Entry in the distributed log"""
    term: int
    index: int
    command: str
    data: Dict[str, Any]
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================================================
# Consensus Engine
# ============================================================================

class DistributedConsensusEngine:
    """
    Manages distributed consensus for critical Phase 2e decisions.
    
    Capabilities:
    - Quorum-based voting
    - Leader election
    - Log replication
    - Majority-based decisions
    """
    
    def __init__(self, node_id: str, all_node_ids: List[str]):
        self.node_id = node_id
        self.all_node_ids = all_node_ids
        self.cluster_size = len(all_node_ids)
        self.quorum_size = (self.cluster_size // 2) + 1
        
        # Consensus state
        self.state = ConsensusState.FOLLOWER
        self.current_term = 0
        self.voted_for: Optional[str] = None
        self.leader_id: Optional[str] = None
        
        # Log replication
        self.log: List[LogEntry] = []
        self.commit_index = 0
        self.last_applied = 0
        
        # Proposals under voting
        self.active_proposals: Dict[str, ConsensusProposal] = {}
        
        # Vote tracking
        self.received_votes: Dict[str, Dict[str, bool]] = defaultdict(dict)
        
        # Thread safety
        self.lock = threading.RLock()
        
        logger.info(f"[Consensus] Initialized for node '{node_id}' in cluster of {self.cluster_size}")
    
    def submit_proposal(self, proposal_id: str, category: str, action: str, 
                        data: Dict[str, Any]) -> ConsensusProposal:
        """Submit a proposal for distributed consensus voting"""
        with self.lock:
            proposal = ConsensusProposal(
                proposal_id=proposal_id,
                category=category,
                action=action,
                data=data,
                proposer_node=self.node_id,
                timestamp=datetime.now(timezone.utc),
                required_votes=self.quorum_size
            )
            
            self.active_proposals[proposal_id] = proposal
            logger.info(f"[Consensus] Submitted proposal '{proposal_id}' (requires {self.quorum_size} votes)")
            
            return proposal
    
    def vote_on_proposal(self, proposal_id: str, voter_node: str, vote: bool) -> bool:
        """Record a vote on a proposal"""
        with self.lock:
            if proposal_id not in self.active_proposals:
                logger.warning(f"[Consensus] Vote for unknown proposal '{proposal_id}'")
                return False
            
            proposal = self.active_proposals[proposal_id]
            proposal.votes[voter_node] = vote
            
            logger.debug(f"[Consensus] {voter_node} voted {'YES' if vote else 'NO'} on '{proposal_id}'")
            
            # Check if decision is final
            if proposal.is_approved():
                logger.info(f"[Consensus] Proposal '{proposal_id}' APPROVED (has quorum)")
                return True
            elif proposal.is_rejected():
                logger.info(f"[Consensus] Proposal '{proposal_id}' REJECTED (lost majority)")
                return False
            
            return None  # Still voting
    
    def get_proposal_status(self, proposal_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific proposal"""
        proposal = self.active_proposals.get(proposal_id)
        if not proposal:
            return None
        
        return {
            "proposal_id": proposal_id,
            "category": proposal.category,
            "action": proposal.action,
            "status": "approved" if proposal.is_approved() else 
                     ("rejected" if proposal.is_rejected() else "voting"),
            "votes": proposal.vote_status(),
            "timestamp": proposal.timestamp.isoformat()
        }
    
    def append_log_entry(self, command: str, data: Dict[str, Any]) -> LogEntry:
        """Append an entry to the distributed log"""
        with self.lock:
            index = len(self.log)
            entry = LogEntry(
                term=self.current_term,
                index=index,
                command=command,
                data=data
            )
            self.log.append(entry)
            logger.debug(f"[Consensus] Appended log entry {index}: {command}")
            return entry
    
    def apply_committed_entries(self, callback: Callable[[LogEntry], None]):
        """Apply committed log entries (after they're replicated to quorum)"""
        with self.lock:
            while self.last_applied < self.commit_index:
                self.last_applied += 1
                if self.last_applied - 1 < len(self.log):
                    entry = self.log[self.last_applied - 1]
                    try:
                        callback(entry)
                        logger.debug(f"[Consensus] Applied log entry {self.last_applied - 1}")
                    except Exception as e:
                        logger.error(f"[Consensus] Failed to apply entry: {e}")
    
    def request_leadership(self) -> bool:
        """Request to become leader (election proposal)"""
        with self.lock:
            self.current_term += 1
            self.state = ConsensusState.CANDIDATE
            self.voted_for = self.node_id
            
            # Create leadership election as a proposal
            election_proposal = self.submit_proposal(
                proposal_id=f"election_{self.node_id}_{self.current_term}",
                category="election",
                action="elect_leader",
                data={"candidate": self.node_id, "term": self.current_term}
            )
            
            logger.info(f"[Consensus] Started election for term {self.current_term}")
            return True
    
    def grant_leadership(self, leader_id: str, term: int) -> bool:
        """Grant leadership to a node"""
        with self.lock:
            if term < self.current_term:
                return False
            
            self.current_term = term
            self.leader_id = leader_id
            self.state = ConsensusState.FOLLOWER
            self.voted_for = leader_id
            
            logger.info(f"[Consensus] Granted leadership to '{leader_id}' for term {term}")
            return True
    
    def become_leader(self):
        """Transition to leader state"""
        with self.lock:
            self.state = ConsensusState.LEADER
            self.leader_id = self.node_id
            logger.info(f"[Consensus] Node '{self.node_id}' became leader for term {self.current_term}")
    
    def get_consensus_status(self) -> Dict[str, Any]:
        """Get overall consensus engine status"""
        with self.lock:
            return {
                "node_id": self.node_id,
                "state": self.state.value,
                "current_term": self.current_term,
                "leader_id": self.leader_id,
                "cluster_size": self.cluster_size,
                "quorum_size": self.quorum_size,
                "log_length": len(self.log),
                "commit_index": self.commit_index,
                "last_applied": self.last_applied,
                "active_proposals": len(self.active_proposals),
                "proposals": [
                    self.get_proposal_status(p_id) 
                    for p_id in self.active_proposals.keys()
                ]
            }


# ============================================================================
# Quorum-Based Decision Maker
# ============================================================================

class QuorumDecisionMaker:
    """
    Makes decisions based on quorum voting from distributed nodes.
    Used for critical Phase 2e operations (alerts, thresholds).
    """
    
    def __init__(self, cluster_size: int):
        self.cluster_size = cluster_size
        self.quorum_size = (cluster_size // 2) + 1
        self.decisions: Dict[str, Dict[str, Any]] = {}
        self.lock = threading.RLock()
    
    def require_quorum_for_alert(self, alert_id: str, alert_data: Dict[str, Any]) -> bool:
        """
        Require quorum approval before triggering alert.
        Critical for false positive reduction in distributed system.
        """
        with self.lock:
            decision_id = f"alert_{alert_id}"
            self.decisions[decision_id] = {
                "type": "alert",
                "data": alert_data,
                "votes": {},
                "timestamp": datetime.now(timezone.utc),
                "status": "pending"
            }
            logger.info(f"[Quorum] Alert '{alert_id}' requires {self.quorum_size} approvals")
            return True
    
    def vote_on_alert(self, alert_id: str, voter_node: str, approved: bool) -> Optional[bool]:
        """Vote on alert approval"""
        with self.lock:
            decision_id = f"alert_{alert_id}"
            if decision_id not in self.decisions:
                return None
            
            decision = self.decisions[decision_id]
            decision["votes"][voter_node] = approved
            
            approved_votes = sum(1 for v in decision["votes"].values() if v)
            total_votes = len(decision["votes"])
            
            # Check for quorum
            if approved_votes >= self.quorum_size:
                decision["status"] = "approved"
                logger.info(f"[Quorum] Alert '{alert_id}' APPROVED (quorum reached)")
                return True
            elif (total_votes - approved_votes) > (self.cluster_size - self.quorum_size):
                decision["status"] = "rejected"
                logger.info(f"[Quorum] Alert '{alert_id}' REJECTED (quorum impossible)")
                return False
            
            return None  # Still voting
    
    def get_decision_status(self, alert_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a quorum decision"""
        with self.lock:
            decision_id = f"alert_{alert_id}"
            decision = self.decisions.get(decision_id)
            if not decision:
                return None
            
            return {
                "alert_id": alert_id,
                "status": decision["status"],
                "votes": decision["votes"],
                "approved_votes": sum(1 for v in decision["votes"].values() if v),
                "quorum_required": self.quorum_size,
                "timestamp": decision["timestamp"].isoformat()
            }


# ============================================================================
# Global Consensus Instance
# ============================================================================

_consensus_engine: Optional[DistributedConsensusEngine] = None


def initialize_consensus(node_id: str, all_node_ids: List[str]) -> DistributedConsensusEngine:
    """Initialize the global consensus engine"""
    global _consensus_engine
    _consensus_engine = DistributedConsensusEngine(node_id, all_node_ids)
    return _consensus_engine


def get_consensus() -> DistributedConsensusEngine:
    """Get the global consensus engine"""
    if _consensus_engine is None:
        raise RuntimeError("Consensus engine not initialized. Call initialize_consensus() first.")
    return _consensus_engine
