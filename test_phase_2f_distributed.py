"""
Phase 2f Distributed Storage - Comprehensive Test Suite

Tests for:
- Distributed storage and replication
- Consensus mechanisms
- Multi-node coordination
- Failover and recovery
- Data consistency
"""

import logging
import sys
from datetime import datetime, timezone
from typing import List
import os

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

from phase_2f_distributed_storage import (
    initialize_storage, DataCategory, DataRecord, DistributedStorageEngine
)
from phase_2f_consensus_engine import (
    initialize_consensus, ConsensusProposal, DistributedConsensusEngine,
    QuorumDecisionMaker
)
from phase_2f_node_manager import (
    initialize_node_manager, MultiNodeManager, ReplicationStrategy
)

print("\n" + "="*70)
print("PHASE 2F: DISTRIBUTED STORAGE SYSTEM - TEST SUITE")
print("="*70)

# ============================================================================
# Test 1: Distributed Storage Initialization
# ============================================================================

def test_1_storage_initialization():
    """Test 1: Distributed Storage Initialization"""
    print("\n" + "="*70)
    print("TEST 1: Distributed Storage Initialization")
    print("="*70)
    
    try:
        # Clean up old database
        if os.path.exists("test_node_1.db"):
            os.remove("test_node_1.db")
        
        # Initialize storage for node 1
        storage = initialize_storage("node_1", "us-west", "test_node_1.db")
        
        print(f"✓ Storage initialized for 'node_1'")
        print(f"  Region: us-west")
        print(f"  Database: test_node_1.db")
        
        # Check system status
        status = storage.get_system_status()
        print(f"✓ System status:")
        print(f"  Total nodes: {status['total_nodes']}")
        print(f"  Healthy nodes: {status['healthy_nodes']}")
        print(f"  Total records: {status['total_records']}")
        
        return True
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False


# ============================================================================
# Test 2: Multi-Node Replication
# ============================================================================

def test_2_multi_node_replication():
    """Test 2: Multi-Node Replication"""
    print("\n" + "="*70)
    print("TEST 2: Multi-Node Replication")
    print("="*70)
    
    try:
        # Clean up
        for db in ["test_storage_1.db", "test_storage_2.db", "test_storage_3.db"]:
            if os.path.exists(db):
                os.remove(db)
        
        # Create 3-node cluster
        storage_1 = initialize_storage("node_1", "us-west", "test_storage_1.db")
        storage_2 = DistributedStorageEngine("node_2", "us-east", "test_storage_2.db")
        storage_3 = DistributedStorageEngine("node_3", "eu-west", "test_storage_3.db")
        
        # Register nodes with each other
        storage_1.register_node("node_2", "us-east", "node_2:8001")
        storage_1.register_node("node_3", "eu-west", "node_3:8002")
        
        print(f"✓ Created 3-node cluster:")
        print(f"  Node 1: us-west")
        print(f"  Node 2: us-east")
        print(f"  Node 3: eu-west")
        
        # Create and store records on node 1
        record_1 = DataRecord(
            record_id="feedback_001",
            category=DataCategory.EXPERT_FEEDBACK,
            data={"expert_id": "dr_smith", "rating": "correct"},
            timestamp=datetime.now(timezone.utc),
            source_node="node_1"
        )
        
        stored = storage_1.store_record(record_1)
        assert stored, "Failed to store record"
        print(f"✓ Stored record 'feedback_001' on node_1")
        
        # Simulate replication to other nodes
        sync_1 = storage_1.sync_with_node("node_2", DataCategory.EXPERT_FEEDBACK)
        sync_2 = storage_1.sync_with_node("node_3", DataCategory.EXPERT_FEEDBACK)
        
        print(f"✓ Replicated to node_2: {sync_1.records_synced} records")
        print(f"✓ Replicated to node_3: {sync_2.records_synced} records")
        
        # Check replication status
        repl_status = storage_1.get_replication_status("feedback_001")
        print(f"✓ Replication status for 'feedback_001':")
        print(f"  Version: {repl_status['version']}")
        print(f"  Replicated to: {repl_status['replicated_to']}")
        print(f"  Replication factor: {repl_status['replication_factor']:.1f}%")
        
        return True
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


# ============================================================================
# Test 3: Distributed Consensus Voting
# ============================================================================

def test_3_consensus_voting():
    """Test 3: Distributed Consensus Voting"""
    print("\n" + "="*70)
    print("TEST 3: Distributed Consensus Voting")
    print("="*70)
    
    try:
        # Initialize consensus for a 3-node cluster
        all_nodes = ["node_1", "node_2", "node_3"]
        consensus = initialize_consensus("node_1", all_nodes)
        
        print(f"✓ Initialized consensus for {len(all_nodes)}-node cluster")
        print(f"  Quorum size: {consensus.quorum_size}")
        
        # Submit a proposal
        proposal = consensus.submit_proposal(
            "prop_alert_001",
            "alert",
            "trigger_critical",
            {"severity": "critical", "domain": "solar_wind"}
        )
        
        print(f"✓ Submitted proposal 'prop_alert_001'")
        print(f"  Category: {proposal.category}")
        print(f"  Required votes: {proposal.required_votes}")
        
        # Simulate voting
        votes = {"node_1": True, "node_2": True, "node_3": False}
        
        for voter, vote in votes.items():
            consensus.vote_on_proposal("prop_alert_001", voter, vote)
        
        print(f"✓ Recorded votes from 3 nodes:")
        print(f"  node_1: YES")
        print(f"  node_2: YES")
        print(f"  node_3: NO")
        
        # Check proposal status
        status = consensus.get_proposal_status("prop_alert_001")
        print(f"✓ Proposal status:")
        print(f"  Status: {status['status']}")
        print(f"  Approved votes: {status['votes']['approved']}")
        print(f"  Rejected votes: {status['votes']['rejected']}")
        print(f"  Approval %: {status['votes']['approval_percentage']:.1f}%")
        
        assert status['status'] == 'approved', "Proposal should be approved"
        print(f"✓ Proposal correctly APPROVED with quorum")
        
        return True
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


# ============================================================================
# Test 4: Quorum-Based Alert Decision Making
# ============================================================================

def test_4_quorum_alert_decision():
    """Test 4: Quorum-Based Alert Decision Making"""
    print("\n" + "="*70)
    print("TEST 4: Quorum-Based Alert Decision Making")
    print("="*70)
    
    try:
        # Create quorum decision maker for 5-node cluster
        quorum = QuorumDecisionMaker(cluster_size=5)
        
        print(f"✓ Created QuorumDecisionMaker for 5-node cluster")
        print(f"  Quorum size: {quorum.quorum_size}")
        
        # Require quorum for alert
        alert_id = "alert_001"
        alert_data = {
            "domain": "earthquakes",
            "severity": "high",
            "confidence": 0.92
        }
        
        quorum.require_quorum_for_alert(alert_id, alert_data)
        print(f"✓ Alert 'alert_001' requires quorum approval")
        
        # Simulate voting
        nodes = ["node_1", "node_2", "node_3", "node_4", "node_5"]
        votes = {
            "node_1": True,
            "node_2": True,
            "node_3": True,
            "node_4": False,
            "node_5": False
        }
        
        decision = None
        for node, vote in votes.items():
            decision = quorum.vote_on_alert(alert_id, node, vote)
            print(f"  {node}: {'APPROVED' if vote else 'REJECTED'}")
        
        print(f"✓ All votes recorded")
        
        # Check decision
        status = quorum.get_decision_status(alert_id)
        print(f"✓ Alert decision status:")
        print(f"  Approved votes: {status['approved_votes']}")
        print(f"  Quorum required: {status['quorum_required']}")
        print(f"  Status: {status['status']}")
        
        assert status['status'] == 'approved', "Alert should be approved"
        print(f"✓ Alert correctly approved (3 >= {quorum.quorum_size})")
        
        return True
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


# ============================================================================
# Test 5: Multi-Node Health Monitoring
# ============================================================================

def test_5_node_health_monitoring():
    """Test 5: Multi-Node Health Monitoring"""
    print("\n" + "="*70)
    print("TEST 5: Multi-Node Health Monitoring")
    print("="*70)
    
    try:
        # Initialize node manager
        node_mgr = initialize_node_manager("node_1", ReplicationStrategy.EVENTUAL_CONSISTENCY)
        
        print(f"✓ Initialized node manager")
        print(f"  Replication strategy: EVENTUAL_CONSISTENCY")
        
        # Register nodes
        node_mgr.register_node("node_1", "us-west", "node_1:8000")
        node_mgr.register_node("node_2", "us-east", "node_2:8001")
        node_mgr.register_node("node_3", "eu-west", "node_3:8002", is_backup=True, primary_node="node_2")
        
        print(f"✓ Registered 3 nodes:")
        print(f"  node_1: us-west (primary)")
        print(f"  node_2: us-east (primary)")
        print(f"  node_3: eu-west (backup for node_2)")
        
        # Start health monitoring
        node_mgr.start_health_monitoring(check_interval_seconds=1)
        print(f"✓ Started health monitoring")
        
        # Wait for health checks
        import time
        time.sleep(2)
        
        # Get cluster status
        cluster_status = node_mgr.get_cluster_status()
        print(f"✓ Cluster status:")
        print(f"  Total nodes: {cluster_status['total_nodes']}")
        print(f"  Healthy nodes: {cluster_status['healthy_nodes']}")
        print(f"  Regions:")
        for region, counts in cluster_status['regions'].items():
            print(f"    {region}: {counts['healthy']}/{counts['total']}")
        
        # Stop monitoring
        node_mgr.stop_health_monitoring()
        print(f"✓ Stopped health monitoring")
        
        return True
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


# ============================================================================
# Test 6: Data Replication Scheduling
# ============================================================================

def test_6_data_replication_scheduling():
    """Test 6: Data Replication Scheduling"""
    print("\n" + "="*70)
    print("TEST 6: Data Replication Scheduling")
    print("="*70)
    
    try:
        # Initialize node manager
        node_mgr = initialize_node_manager("node_1", ReplicationStrategy.STRONG_CONSISTENCY)
        
        # Register nodes
        node_mgr.register_node("node_1", "us-west", "node_1:8000")
        node_mgr.register_node("node_2", "us-east", "node_2:8001")
        node_mgr.register_node("node_3", "eu-west", "node_3:8002")
        
        # Start health monitoring to mark nodes as healthy
        node_mgr.start_health_monitoring(check_interval_seconds=1)
        
        print(f"✓ Initialized replication system")
        
        # Schedule replication
        data = {
            "expert_id": "dr_smith",
            "feedback": "correct",
            "confidence": 0.95
        }
        
        replications = node_mgr.replicate_to_healthy_nodes(
            "data_001",
            data,
            region=None  # replicate to all regions
        )
        
        print(f"✓ Scheduled replication:")
        print(f"  Data ID: data_001")
        print(f"  Target nodes: {replications}")
        
        # Check replication status
        repl_status = node_mgr.get_replication_status()
        print(f"✓ Replication status:")
        print(f"  Pending: {repl_status['pending_replications']}")
        print(f"  Completed: {repl_status['completed_replications']}")
        
        # Mark replications as complete
        node_mgr.mark_replication_complete("data_001", "node_2")
        print(f"✓ Marked replication complete: data_001 -> node_2")
        
        node_mgr.stop_health_monitoring()
        
        return True
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


# ============================================================================
# Test 7: Conflict Detection and Resolution
# ============================================================================

def test_7_conflict_resolution():
    """Test 7: Conflict Detection and Resolution"""
    print("\n" + "="*70)
    print("TEST 7: Conflict Detection and Resolution")
    print("="*70)
    
    try:
        # Clean up
        if os.path.exists("test_conflict.db"):
            os.remove("test_conflict.db")
        
        storage = initialize_storage("node_1", "us-west", "test_conflict.db")
        
        # Create initial record
        record_v1 = DataRecord(
            record_id="feedback_conflict",
            category=DataCategory.EXPERT_FEEDBACK,
            data={"expert_id": "dr_smith", "rating": "correct"},
            timestamp=datetime.now(timezone.utc),
            source_node="node_1",
            version=1
        )
        
        storage.store_record(record_v1)
        print(f"✓ Stored initial record (v1)")
        
        # Attempt to store conflicting version
        record_v1_conflict = DataRecord(
            record_id="feedback_conflict",
            category=DataCategory.EXPERT_FEEDBACK,
            data={"expert_id": "dr_jones", "rating": "incorrect"},
            timestamp=datetime.now(timezone.utc),
            source_node="node_2",
            version=1  # same version, conflict!
        )
        
        success = storage.store_record(record_v1_conflict)
        assert not success, "Conflicting record should not be stored"
        print(f"✓ Detected and rejected conflicting record (v1 from different source)")
        
        # Check conflicts
        conflict_count = len(storage.conflicts)
        print(f"✓ Conflict recorded:")
        print(f"  Conflicts tracked: {conflict_count}")
        
        # Resolve conflict (newer version wins)
        record_v2_resolved = DataRecord(
            record_id="feedback_conflict",
            category=DataCategory.EXPERT_FEEDBACK,
            data={"expert_id": "dr_smith", "rating": "correct", "reviewed": True},
            timestamp=datetime.now(timezone.utc),
            source_node="node_1",
            version=2
        )
        
        resolved = storage.resolve_conflict("feedback_conflict", record_v2_resolved)
        assert resolved, "Conflict resolution failed"
        print(f"✓ Resolved conflict - stored v2")
        
        # Verify resolution
        final_record = storage.get_record("feedback_conflict")
        assert final_record.version == 2, "Should have v2"
        print(f"✓ Verified: current version is v2")
        
        return True
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


# ============================================================================
# Test Suite Execution
# ============================================================================

def run_all_tests() -> int:
    """Run all tests and return pass count"""
    tests = [
        test_1_storage_initialization,
        test_2_multi_node_replication,
        test_3_consensus_voting,
        test_4_quorum_alert_decision,
        test_5_node_health_monitoring,
        test_6_data_replication_scheduling,
        test_7_conflict_resolution,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"\n✗ Test crashed: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    return passed, failed


if __name__ == "__main__":
    passed, failed = run_all_tests()
    
    print("\n" + "="*70)
    print("TEST SUITE SUMMARY")
    print("="*70)
    print(f"Passed: {passed}/7")
    print(f"Failed: {failed}/7")
    print(f"Success Rate: {passed/7*100:.1f}%")
    print("="*70 + "\n")
    
    sys.exit(0 if failed == 0 else 1)
