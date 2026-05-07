"""
Phase 2f: Multi-Node Manager

Orchestrates communication and coordination between distributed nodes.
Manages failover, health checking, and data sync across the cluster.

Features:
- Health monitoring and heartbeats
- Automatic failover detection
- Data replication across regions
- Node discovery and registration
"""

import logging
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
import threading
import asyncio
from enum import Enum
import json

logger = logging.getLogger(__name__)

# ============================================================================
# Node Manager Models
# ============================================================================

class ReplicationStrategy(Enum):
    """Data replication strategy"""
    EVENTUAL_CONSISTENCY = "eventual_consistency"
    STRONG_CONSISTENCY = "strong_consistency"
    READ_REPAIR = "read_repair"


@dataclass
class HealthCheckResult:
    """Result of a health check"""
    node_id: str
    timestamp: datetime
    is_healthy: bool
    response_time_ms: float
    error_message: Optional[str] = None


@dataclass
class FailoverEvent:
    """Record of a failover event"""
    event_id: str
    timestamp: datetime
    failed_node: str
    backup_node: str
    category: str  # what data was affected
    status: str = "pending"  # pending, success, rollback


# ============================================================================
# Multi-Node Manager
# ============================================================================

class MultiNodeManager:
    """
    Manages a cluster of distributed nodes.
    
    Responsibilities:
    - Monitor node health
    - Detect failures and trigger failover
    - Coordinate data replication
    - Route requests to healthy nodes
    """
    
    def __init__(self, local_node_id: str, replication_strategy: ReplicationStrategy = ReplicationStrategy.EVENTUAL_CONSISTENCY):
        self.local_node_id = local_node_id
        self.replication_strategy = replication_strategy
        
        # Node tracking
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.node_regions: Dict[str, List[str]] = {}  # region -> node_ids
        
        # Health monitoring
        self.health_checks: Dict[str, List[HealthCheckResult]] = {}
        self.last_heartbeat: Dict[str, datetime] = {}
        self.failure_threshold_seconds = 30
        
        # Failover tracking
        self.failover_events: List[FailoverEvent] = []
        self.primary_backups: Dict[str, str] = {}  # primary_node -> backup_node
        
        # Replication tasks
        self.pending_replications: Dict[str, List[Dict[str, Any]]] = {}
        
        # Thread safety
        self.lock = threading.RLock()
        
        # Background health checker
        self.health_check_thread: Optional[threading.Thread] = None
        self.running = False
        
        logger.info(f"[Multi-Node Manager] Initialized for '{local_node_id}' with {replication_strategy.value}")
    
    def register_node(self, node_id: str, region: str, endpoint: str, 
                     is_backup: bool = False, primary_node: Optional[str] = None) -> bool:
        """Register a node in the cluster"""
        with self.lock:
            if node_id in self.nodes:
                logger.warning(f"[Multi-Node Manager] Node '{node_id}' already registered")
                return False
            
            self.nodes[node_id] = {
                "node_id": node_id,
                "region": region,
                "endpoint": endpoint,
                "is_backup": is_backup,
                "primary_node": primary_node,
                "registered_at": datetime.now(timezone.utc)
            }
            
            # Track by region
            if region not in self.node_regions:
                self.node_regions[region] = []
            self.node_regions[region].append(node_id)
            
            # Track backup relationships
            if is_backup and primary_node:
                self.primary_backups[primary_node] = node_id
            
            logger.info(f"[Multi-Node Manager] Registered node '{node_id}' in region '{region}'")
            return True
    
    def start_health_monitoring(self, check_interval_seconds: int = 10):
        """Start background health monitoring"""
        with self.lock:
            if self.running:
                logger.warning("[Multi-Node Manager] Health monitoring already running")
                return
            
            self.running = True
            self.health_check_thread = threading.Thread(
                target=self._health_check_loop,
                args=(check_interval_seconds,),
                daemon=True
            )
            self.health_check_thread.start()
            logger.info(f"[Multi-Node Manager] Started health monitoring (interval: {check_interval_seconds}s)")
    
    def stop_health_monitoring(self):
        """Stop health monitoring"""
        with self.lock:
            self.running = False
        
        if self.health_check_thread:
            self.health_check_thread.join(timeout=5)
        
        logger.info("[Multi-Node Manager] Stopped health monitoring")
    
    def _health_check_loop(self, interval_seconds: int):
        """Background health check loop"""
        while self.running:
            try:
                with self.lock:
                    for node_id in list(self.nodes.keys()):
                        if node_id == self.local_node_id:
                            continue
                        
                        result = self._perform_health_check(node_id)
                        
                        if node_id not in self.health_checks:
                            self.health_checks[node_id] = []
                        
                        self.health_checks[node_id].append(result)
                        
                        # Keep only last 100 checks
                        if len(self.health_checks[node_id]) > 100:
                            self.health_checks[node_id] = self.health_checks[node_id][-100:]
                        
                        # Check for failure
                        if not result.is_healthy:
                            self._handle_node_failure(node_id)
                        else:
                            self.last_heartbeat[node_id] = datetime.now(timezone.utc)
            
            except Exception as e:
                logger.error(f"[Multi-Node Manager] Health check loop error: {e}")
            
            threading.Event().wait(interval_seconds)
    
    def _perform_health_check(self, node_id: str) -> HealthCheckResult:
        """Perform health check on a node (simulated)"""
        start_time = datetime.now(timezone.utc)
        
        try:
            # In production, this would make actual HTTP requests
            # For now, simulate based on last heartbeat
            if node_id not in self.last_heartbeat:
                self.last_heartbeat[node_id] = start_time
            
            time_since_heartbeat = (start_time - self.last_heartbeat[node_id]).total_seconds()
            is_healthy = time_since_heartbeat < self.failure_threshold_seconds
            
            response_time_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            return HealthCheckResult(
                node_id=node_id,
                timestamp=start_time,
                is_healthy=is_healthy,
                response_time_ms=response_time_ms
            )
        except Exception as e:
            return HealthCheckResult(
                node_id=node_id,
                timestamp=start_time,
                is_healthy=False,
                response_time_ms=-1,
                error_message=str(e)
            )
    
    def _handle_node_failure(self, failed_node_id: str):
        """Handle detected node failure"""
        logger.warning(f"[Multi-Node Manager] Node '{failed_node_id}' detected as failed")
        
        # Check if this node has a backup
        if failed_node_id in self.primary_backups:
            backup_node = self.primary_backups[failed_node_id]
            
            # Trigger failover
            failover = FailoverEvent(
                event_id=f"failover_{failed_node_id}_{datetime.now(timezone.utc).timestamp()}",
                timestamp=datetime.now(timezone.utc),
                failed_node=failed_node_id,
                backup_node=backup_node,
                category="primary_failure"
            )
            
            self.failover_events.append(failover)
            logger.info(f"[Multi-Node Manager] Triggered failover: {failed_node_id} -> {backup_node}")
    
    def get_healthy_nodes(self, region: Optional[str] = None) -> List[str]:
        """Get list of healthy nodes, optionally filtered by region"""
        with self.lock:
            healthy = []
            
            for node_id, last_hb in self.last_heartbeat.items():
                if node_id == self.local_node_id:
                    continue
                
                time_since_heartbeat = (datetime.now(timezone.utc) - last_hb).total_seconds()
                if time_since_heartbeat < self.failure_threshold_seconds:
                    if region is None or self.nodes[node_id]["region"] == region:
                        healthy.append(node_id)
            
            return healthy
    
    def get_nodes_by_region(self, region: str) -> List[str]:
        """Get all nodes in a specific region"""
        with self.lock:
            return self.node_regions.get(region, [])
    
    def replicate_to_healthy_nodes(self, data_id: str, data: Dict[str, Any], 
                                    region: Optional[str] = None) -> int:
        """Schedule data replication to healthy nodes"""
        with self.lock:
            healthy_nodes = self.get_healthy_nodes(region)
            
            if data_id not in self.pending_replications:
                self.pending_replications[data_id] = []
            
            for node_id in healthy_nodes:
                self.pending_replications[data_id].append({
                    "target_node": node_id,
                    "data": data,
                    "status": "pending",
                    "timestamp": datetime.now(timezone.utc)
                })
            
            logger.info(f"[Multi-Node Manager] Scheduled replication of '{data_id}' to {len(healthy_nodes)} nodes")
            return len(healthy_nodes)
    
    def mark_replication_complete(self, data_id: str, target_node: str) -> bool:
        """Mark a replication as complete"""
        with self.lock:
            if data_id not in self.pending_replications:
                return False
            
            for replication in self.pending_replications[data_id]:
                if replication["target_node"] == target_node:
                    replication["status"] = "complete"
                    logger.debug(f"[Multi-Node Manager] Replication complete: {data_id} -> {target_node}")
                    return True
            
            return False
    
    def get_replication_status(self) -> Dict[str, Any]:
        """Get overall replication status"""
        with self.lock:
            pending_count = 0
            complete_count = 0
            
            for replications in self.pending_replications.values():
                for repl in replications:
                    if repl["status"] == "pending":
                        pending_count += 1
                    elif repl["status"] == "complete":
                        complete_count += 1
            
            return {
                "pending_replications": pending_count,
                "completed_replications": complete_count,
                "total_data_items": len(self.pending_replications)
            }
    
    def get_cluster_status(self) -> Dict[str, Any]:
        """Get overall cluster status"""
        with self.lock:
            total_nodes = len(self.nodes)
            healthy_nodes = len(self.get_healthy_nodes())
            
            nodes_by_region = {}
            for region, nodes in self.node_regions.items():
                healthy_in_region = [n for n in nodes if n in self.get_healthy_nodes()]
                nodes_by_region[region] = {
                    "total": len(nodes),
                    "healthy": len(healthy_in_region)
                }
            
            return {
                "local_node": self.local_node_id,
                "total_nodes": total_nodes,
                "healthy_nodes": healthy_nodes,
                "replication_strategy": self.replication_strategy.value,
                "regions": nodes_by_region,
                "failover_events": len(self.failover_events),
                "pending_replications": self.get_replication_status()
            }
    
    def get_node_info(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed info about a node"""
        with self.lock:
            if node_id not in self.nodes:
                return None
            
            node = self.nodes[node_id].copy()
            node["is_healthy"] = node_id in self.get_healthy_nodes()
            
            if node_id in self.health_checks:
                recent_checks = self.health_checks[node_id][-10:]
                node["recent_health_checks"] = [
                    {
                        "timestamp": check.timestamp.isoformat(),
                        "healthy": check.is_healthy,
                        "response_time_ms": check.response_time_ms
                    }
                    for check in recent_checks
                ]
            
            return node


# ============================================================================
# Global Node Manager Instance
# ============================================================================

_node_manager: Optional[MultiNodeManager] = None


def initialize_node_manager(local_node_id: str, 
                            strategy: ReplicationStrategy = ReplicationStrategy.EVENTUAL_CONSISTENCY) -> MultiNodeManager:
    """Initialize the global node manager"""
    global _node_manager
    _node_manager = MultiNodeManager(local_node_id, strategy)
    return _node_manager


def get_node_manager() -> MultiNodeManager:
    """Get the global node manager"""
    if _node_manager is None:
        raise RuntimeError("Node manager not initialized. Call initialize_node_manager() first.")
    return _node_manager
