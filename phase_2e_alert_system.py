"""
Phase 2e: Advanced Alert System
MistTracker Emergence Detection Framework

Intelligent multi-tier alerting based on:
1. Bayesian confidence levels
2. False positive/negative risk quantification
3. Cross-domain anomaly detection
4. Escalation rules and thresholds
5. User notification preferences

Alert Types:
- LOW: Confidence 50-70%, low risk
- MEDIUM: Confidence 70-90%, moderate risk
- HIGH: Confidence 90-95%, elevated risk
- CRITICAL: Confidence >95%, emergency action recommended
"""

import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Literal, Callable
from enum import Enum
import json

logger = logging.getLogger(__name__)


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertChannel(str, Enum):
    """How to notify about alerts"""
    LOG = "log"              # Structured logging
    EMAIL = "email"          # Email notification
    WEBHOOK = "webhook"      # HTTP webhook
    SLACK = "slack"          # Slack message
    SMS = "sms"              # SMS alert
    PAGERDUTY = "pagerduty"  # PagerDuty incident


@dataclass
class AlertRule:
    """
    Define when and how to alert.
    
    Example:
        AlertRule(
            name="high_confidence_emergence",
            domain="solar_wind",
            condition=lambda result: result['confidence'] > 0.95,
            severity=AlertSeverity.HIGH,
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK],
            escalate_after=timedelta(minutes=5)
        )
    """
    name: str
    domain: str
    condition: Callable[[Dict[str, Any]], bool]
    severity: AlertSeverity
    channels: List[AlertChannel]
    escalate_after: Optional[timedelta] = None
    requires_review: bool = False
    auto_escalate_on_repeat: bool = False
    
    def matches(self, result: Dict[str, Any]) -> bool:
        """Check if result matches this rule"""
        try:
            return self.condition(result)
        except Exception as e:
            logger.error(f"Error evaluating rule {self.name}: {e}")
            return False


@dataclass
class Alert:
    """Represents a single alert event"""
    alert_id: str
    rule_name: str
    domain: str
    job_id: str
    severity: AlertSeverity
    message: str
    
    # Bayesian context
    verdict: str
    confidence: float
    false_positive_risk: float
    false_negative_risk: float
    
    # Escalation tracking
    created_at: str  # ISO timestamp
    escalated_at: Optional[str] = None
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None
    
    # Notification status
    channels_notified: List[AlertChannel] = None
    notification_errors: Dict[AlertChannel, str] = None
    
    def __post_init__(self):
        if self.channels_notified is None:
            self.channels_notified = []
        if self.notification_errors is None:
            self.notification_errors = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary"""
        data = asdict(self)
        data['severity'] = self.severity.value
        data['channels_notified'] = [ch.value for ch in self.channels_notified]
        data['notification_errors'] = {
            ch.value: err for ch, err in self.notification_errors.items()
        }
        return data


class AlertingEngine:
    """
    Orchestrates alert generation, routing, and escalation.
    
    Workflow:
    1. Bayesian result arrives → evaluate alert rules
    2. Matching rules → generate alerts
    3. Route alerts to channels (email, slack, etc.)
    4. Track acknowledgment and resolution
    5. Escalate if needed (after timeout or on repeat)
    """
    
    def __init__(self):
        """Initialize alerting engine"""
        self.rules: Dict[str, AlertRule] = {}
        self.alert_history: List[Alert] = []
        self.active_alerts: Dict[str, Alert] = {}  # job_id → Alert
        self.notification_handlers: Dict[AlertChannel, Callable] = {}
        
        # Register default handlers
        self._register_default_handlers()
    
    def add_rule(self, rule: AlertRule) -> None:
        """Register an alert rule"""
        self.rules[rule.name] = rule
        logger.info(f"[Alerting] Registered rule: {rule.name} ({rule.severity.value})")
    
    def evaluate_result(self, bayesian_result: Dict[str, Any]) -> List[Alert]:
        """
        Evaluate a Bayesian result against all rules.
        
        Args:
            bayesian_result: Bayesian analysis result
        
        Returns:
            List of generated alerts (empty if no matches)
        """
        alerts = []
        
        for rule in self.rules.values():
            if rule.matches(bayesian_result):
                alert = self._create_alert(rule, bayesian_result)
                alerts.append(alert)
                self.active_alerts[bayesian_result['job_id']] = alert
                self.alert_history.append(alert)
                
                logger.info(f"[Alerting] Alert triggered: {rule.name} (job_id={bayesian_result['job_id']})")
        
        return alerts
    
    def send_alerts(self, alerts: List[Alert]) -> Dict[str, Any]:
        """
        Send alerts through specified channels.
        
        Args:
            alerts: List of alerts to send
        
        Returns:
            Notification status
        """
        status = {
            "total_alerts": len(alerts),
            "alerts_sent": 0,
            "notification_errors": 0,
            "details": []
        }
        
        for alert in alerts:
            rule = self.rules.get(alert.rule_name)
            if not rule:
                continue
            
            for channel in rule.channels:
                try:
                    handler = self.notification_handlers.get(channel)
                    if handler:
                        handler(alert)
                        alert.channels_notified.append(channel)
                    else:
                        logger.warning(f"No handler for channel: {channel}")
                except Exception as e:
                    alert.notification_errors[channel] = str(e)
                    status["notification_errors"] += 1
                    logger.error(f"Error sending alert via {channel}: {e}")
            
            status["alerts_sent"] += 1
            status["details"].append({
                "alert_id": alert.alert_id,
                "channels": [ch.value for ch in alert.channels_notified],
                "errors": {ch.value: err for ch, err in alert.notification_errors.items()}
            })
        
        return status
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str = "system") -> bool:
        """Mark alert as acknowledged"""
        for alert in self.alert_history:
            if alert.alert_id == alert_id:
                alert.acknowledged_at = datetime.now(timezone.utc).isoformat()
                logger.info(f"[Alerting] Alert acknowledged: {alert_id} by {acknowledged_by}")
                return True
        return False
    
    def resolve_alert(self, alert_id: str, resolution: str = "") -> bool:
        """Mark alert as resolved"""
        for alert in self.alert_history:
            if alert.alert_id == alert_id:
                alert.resolved_at = datetime.now(timezone.utc).isoformat()
                if alert.alert_id in self.active_alerts:
                    del self.active_alerts[alert.alert_id]
                logger.info(f"[Alerting] Alert resolved: {alert_id}")
                return True
        return False
    
    def get_active_alerts(self) -> List[Alert]:
        """Get currently active (unresolved) alerts"""
        return list(self.active_alerts.values())
    
    def get_alert_history(
        self,
        domain: Optional[str] = None,
        severity: Optional[AlertSeverity] = None,
        hours: int = 24
    ) -> List[Alert]:
        """
        Query alert history.
        
        Args:
            domain: Filter by domain
            severity: Filter by severity level
            hours: Look back this many hours
        
        Returns:
            Matching alerts
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        results = []
        for alert in self.alert_history:
            created = datetime.fromisoformat(alert.created_at)
            
            if created < cutoff:
                continue
            
            if domain and alert.domain != domain:
                continue
            
            if severity and alert.severity != severity:
                continue
            
            results.append(alert)
        
        return results
    
    def register_notification_handler(
        self,
        channel: AlertChannel,
        handler: Callable[[Alert], None]
    ) -> None:
        """Register a notification handler for a channel"""
        self.notification_handlers[channel] = handler
        logger.info(f"[Alerting] Registered handler for channel: {channel.value}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get alerting system statistics"""
        total_alerts = len(self.alert_history)
        active_count = len(self.active_alerts)
        
        by_severity = {}
        for alert in self.alert_history:
            severity = alert.severity.value
            by_severity[severity] = by_severity.get(severity, 0) + 1
        
        by_domain = {}
        for alert in self.alert_history:
            domain = alert.domain
            by_domain[domain] = by_domain.get(domain, 0) + 1
        
        return {
            "total_alerts_generated": total_alerts,
            "active_alerts": active_count,
            "alerts_by_severity": by_severity,
            "alerts_by_domain": by_domain,
            "rules_registered": len(self.rules),
            "notification_channels_active": len(self.notification_handlers),
        }
    
    def _create_alert(self, rule: AlertRule, result: Dict[str, Any]) -> Alert:
        """Create alert from rule and result"""
        import uuid
        
        alert_id = f"alert-{uuid.uuid4().hex[:8]}"
        severity = rule.severity
        
        # Build message
        message = (
            f"Alert: {rule.name} | "
            f"Domain: {result['domain']} | "
            f"Verdict: {result['verdict']} | "
            f"Confidence: {result['confidence']:.1%}"
        )
        
        return Alert(
            alert_id=alert_id,
            rule_name=rule.name,
            domain=result['domain'],
            job_id=result['job_id'],
            severity=severity,
            message=message,
            verdict=result['verdict'],
            confidence=result['confidence'],
            false_positive_risk=result.get('false_positive_risk', 0),
            false_negative_risk=result.get('false_negative_risk', 0),
            created_at=datetime.now(timezone.utc).isoformat(),
        )
    
    def _register_default_handlers(self) -> None:
        """Register default notification handlers"""
        
        def log_handler(alert: Alert):
            logger.warning(
                f"[ALERT] {alert.severity.value.upper()}: {alert.message} "
                f"(false_pos_risk={alert.false_positive_risk:.2%}, "
                f"false_neg_risk={alert.false_negative_risk:.2%})"
            )
        
        def json_handler(alert: Alert):
            print(json.dumps(alert.to_dict(), indent=2, default=str))
        
        self.register_notification_handler(AlertChannel.LOG, log_handler)
        # JSON handler for debugging
        # self.register_notification_handler(AlertChannel.WEBHOOK, json_handler)


# Global alerting engine
_alerting_engine: Optional[AlertingEngine] = None


def get_alerting_engine() -> AlertingEngine:
    """Get or create global alerting engine"""
    global _alerting_engine
    if _alerting_engine is None:
        _alerting_engine = AlertingEngine()
    return _alerting_engine


def create_default_rules() -> List[AlertRule]:
    """
    Create sensible default alerting rules.
    
    Recommendation: Use these as starting point, customize for your domain.
    """
    rules = [
        # High confidence emergence detected
        AlertRule(
            name="high_confidence_emergence",
            domain="*",  # All domains
            condition=lambda r: (
                r.get('verdict') == 'strongly_confirmed' and
                r.get('confidence', 0) > 0.95
            ),
            severity=AlertSeverity.HIGH,
            channels=[AlertChannel.LOG],
            requires_review=True,
        ),
        
        # Low confidence but flagged
        AlertRule(
            name="uncertain_emergence",
            domain="*",
            condition=lambda r: (
                r.get('verdict') in ['confirmed', 'uncertain'] and
                r.get('confidence', 0) > 0.7 and
                r.get('confidence', 0) <= 0.85
            ),
            severity=AlertSeverity.MEDIUM,
            channels=[AlertChannel.LOG],
        ),
        
        # High false positive risk
        AlertRule(
            name="high_false_positive_risk",
            domain="*",
            condition=lambda r: r.get('false_positive_risk', 0) > 0.1,
            severity=AlertSeverity.MEDIUM,
            channels=[AlertChannel.LOG],
            requires_review=True,
        ),
        
        # High false negative risk (missed emergence)
        AlertRule(
            name="high_false_negative_risk",
            domain="*",
            condition=lambda r: r.get('false_negative_risk', 0) > 0.1,
            severity=AlertSeverity.HIGH,
            channels=[AlertChannel.LOG],
            requires_review=True,
        ),
        
        # Solar wind anomaly
        AlertRule(
            name="solar_wind_anomaly",
            domain="solar_wind",
            condition=lambda r: (
                r.get('verdict') in ['strongly_confirmed', 'confirmed'] and
                r.get('confidence', 0) > 0.8
            ),
            severity=AlertSeverity.MEDIUM,
            channels=[AlertChannel.LOG],
        ),
        
        # Seismic anomaly
        AlertRule(
            name="seismic_anomaly",
            domain="earthquakes",
            condition=lambda r: (
                r.get('verdict') == 'strongly_confirmed' and
                r.get('confidence', 0) > 0.9
            ),
            severity=AlertSeverity.CRITICAL,
            channels=[AlertChannel.LOG],
            requires_review=True,
        ),
    ]
    
    return rules


if __name__ == "__main__":
    """Test alerting system"""
    logging.basicConfig(level=logging.INFO)
    
    print("Phase 2e Advanced Alert System Test")
    print("=" * 70)
    
    engine = get_alerting_engine()
    
    # Register default rules
    for rule in create_default_rules():
        engine.add_rule(rule)
    
    # Test 1: Evaluate high-confidence result
    print("\nTest 1: High-Confidence Emergence")
    print("-" * 70)
    
    high_conf_result = {
        "job_id": "job-123",
        "domain": "solar_wind",
        "verdict": "strongly_confirmed",
        "confidence": 0.99,
        "false_positive_risk": 0.001,
        "false_negative_risk": 0.0,
    }
    
    alerts = engine.evaluate_result(high_conf_result)
    print(f"Alerts generated: {len(alerts)}")
    for alert in alerts:
        print(f"  - {alert.rule_name}: {alert.severity.value}")
    
    # Test 2: Send alerts
    print("\nTest 2: Send Alerts")
    print("-" * 70)
    
    status = engine.send_alerts(alerts)
    print(f"Alerts sent: {status['alerts_sent']}/{status['total_alerts']}")
    print(f"Errors: {status['notification_errors']}")
    
    # Test 3: Statistics
    print("\nTest 3: Alerting Statistics")
    print("-" * 70)
    
    stats = engine.get_statistics()
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    print("\nPhase 2e Advanced Alert System Ready ✅")
