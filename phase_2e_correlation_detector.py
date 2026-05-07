"""
Phase 2e: Multi-Domain Correlation Detector
MistTracker Emergence Detection Framework

Detects patterns and correlations across physical domains.

Insight from Phase 0:
- Each domain has unique physics (no universal laws)
- BUT correlations between domains reveal system-wide emergent events

Example:
- Solar wind emergence → ionospheric disturbance → network latency spike
- Seismic emergence → magnetospheric fluctuation → potential atmospheric impact
"""

import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import json

logger = logging.getLogger(__name__)


class CorrelationType(str, Enum):
    """Types of correlations detected"""
    TEMPORAL = "temporal"          # Simultaneous events
    SEQUENTIAL = "sequential"      # Events in sequence
    MAGNITUDE_CORRELATED = "magnitude"  # Magnitude relationship
    INVERSE = "inverse"            # Anti-correlated
    CAUSAL_HYPOTHESIS = "causal"   # Possible causal relationship


@dataclass
class DomainEvent:
    """Single domain emergence event"""
    domain: str
    job_id: str
    analysis_type: str
    verdict: str
    confidence: float
    primary_metric: float
    timestamp: str  # ISO format
    
    # Additional context
    false_positive_risk: float = 0.0
    false_negative_risk: float = 0.0
    signal_strength: Optional[str] = None  # weak, moderate, strong


@dataclass
class CorrelationPattern:
    """Detected correlation between domains"""
    pattern_id: str
    domains: List[str]  # Participating domains
    correlation_type: CorrelationType
    time_lag: float  # Seconds between events
    
    events: List[DomainEvent] = None
    correlation_strength: float = 0.0  # 0-1, confidence in correlation
    
    # Interpretation
    description: str = ""
    hypothesis: str = ""
    requires_review: bool = False
    
    # Metadata
    detected_at: str = None
    
    def __post_init__(self):
        if self.events is None:
            self.events = []
        if self.detected_at is None:
            self.detected_at = datetime.now(timezone.utc).isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary"""
        data = asdict(self)
        data['correlation_type'] = self.correlation_type.value
        data['events'] = [asdict(e) for e in self.events]
        return data


class CorrelationDetector:
    """
    Detects multi-domain correlations and emergent patterns.
    
    Workflow:
    1. Receive domain event (Bayesian result)
    2. Store in event window (last N minutes)
    3. Check for correlations with other domains
    4. Generate correlation patterns
    5. Rank by strength and significance
    """
    
    def __init__(self, window_size_minutes: int = 60):
        """
        Initialize correlation detector.
        
        Args:
            window_size_minutes: Look back window for correlations
        """
        self.window_size = timedelta(minutes=window_size_minutes)
        self.event_history: List[DomainEvent] = []
        self.detected_patterns: List[CorrelationPattern] = []
        
        # Correlation thresholds
        self.temporal_window = timedelta(seconds=300)  # 5 minutes
        self.min_correlation_strength = 0.6  # 0-1
    
    def process_event(self, event: DomainEvent) -> List[CorrelationPattern]:
        """
        Process new domain event and check for correlations.
        
        Args:
            event: New DomainEvent from Bayesian analysis
        
        Returns:
            List of new correlation patterns detected
        """
        # Store event
        self.event_history.append(event)
        
        # Remove old events outside window
        cutoff = datetime.now(timezone.utc) - self.window_size
        self.event_history = [
            e for e in self.event_history
            if datetime.fromisoformat(e.timestamp) > cutoff
        ]
        
        # Look for correlations
        new_patterns = []
        
        # Check with all other recent domains
        for other_event in self.event_history:
            if other_event.domain == event.domain:
                continue  # Skip same domain
            
            if not self._should_correlate(event, other_event):
                continue  # Confidence or verdict not worthy of correlation
            
            # Check for temporal correlation
            temporal_pattern = self._check_temporal_correlation(event, other_event)
            if temporal_pattern:
                new_patterns.append(temporal_pattern)
            
            # Check for sequential correlation
            sequential_pattern = self._check_sequential_correlation(event, other_event)
            if sequential_pattern:
                new_patterns.append(sequential_pattern)
            
            # Check for magnitude correlation
            magnitude_pattern = self._check_magnitude_correlation(event, other_event)
            if magnitude_pattern:
                new_patterns.append(magnitude_pattern)
        
        self.detected_patterns.extend(new_patterns)
        
        if new_patterns:
            logger.info(
                f"[Correlation] Detected {len(new_patterns)} patterns for "
                f"domain={event.domain}, job_id={event.job_id}"
            )
        
        return new_patterns
    
    def get_active_patterns(self) -> List[CorrelationPattern]:
        """Get patterns within time window"""
        cutoff = datetime.now(timezone.utc) - self.window_size
        return [
            p for p in self.detected_patterns
            if datetime.fromisoformat(p.detected_at) > cutoff
        ]
    
    def get_high_confidence_patterns(
        self,
        min_strength: float = 0.75
    ) -> List[CorrelationPattern]:
        """Get patterns with high confidence"""
        return [
            p for p in self.get_active_patterns()
            if p.correlation_strength >= min_strength
        ]
    
    def rank_patterns_by_significance(self) -> List[Tuple[CorrelationPattern, float]]:
        """
        Rank patterns by scientific significance.
        
        Factors:
        - Correlation strength
        - Confidence in individual events
        - Rarity of pattern
        - Whether pattern is known vs novel
        """
        ranked = []
        
        for pattern in self.get_active_patterns():
            # Base score from correlation strength
            score = pattern.correlation_strength
            
            # Boost for high-confidence events
            avg_confidence = sum(e.confidence for e in pattern.events) / len(pattern.events)
            score *= (0.5 + 0.5 * avg_confidence)
            
            # Boost for unusual patterns
            if pattern.requires_review:
                score *= 1.5
            
            ranked.append((pattern, score))
        
        # Sort by score descending
        ranked.sort(key=lambda x: x[1], reverse=True)
        return ranked
    
    def generate_narrative(self, pattern: CorrelationPattern) -> str:
        """
        Generate human-readable description of correlation.
        
        Example:
        "Solar wind emergence detected at 2026-04-21T10:00:00Z (confidence: 99%)
         temporally correlated with seismic activity detection at 2026-04-21T10:02:30Z
         (confidence: 87%). Time lag: 150 seconds. Correlation strength: 0.82.
         Hypothesis: Solar wind particle flux may modulate ionospheric conductivity,
         affecting vertical current flows and potentially influencing lithospheric stress."
        """
        domains_str = " + ".join(pattern.domains)
        times = [e.timestamp for e in pattern.events]
        confidences = [f"{e.confidence:.0%}" for e in pattern.events]
        
        narrative = (
            f"Correlation detected between {domains_str}. "
            f"Time lag: {pattern.time_lag:.0f}s. "
            f"Strength: {pattern.correlation_strength:.2f}. "
            f"Events: {' → '.join(confidences)}. "
        )
        
        if pattern.hypothesis:
            narrative += f"Hypothesis: {pattern.hypothesis}"
        
        return narrative
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get correlation detection statistics"""
        active = self.get_active_patterns()
        high_conf = self.get_high_confidence_patterns()
        
        by_type = {}
        for pattern in active:
            corr_type = pattern.correlation_type.value
            by_type[corr_type] = by_type.get(corr_type, 0) + 1
        
        unique_domains = set()
        for pattern in active:
            unique_domains.update(pattern.domains)
        
        return {
            "total_patterns_detected": len(self.detected_patterns),
            "active_patterns": len(active),
            "high_confidence_patterns": len(high_conf),
            "patterns_by_type": by_type,
            "domains_involved": list(unique_domains),
            "unique_domain_pairs": len(set(
                tuple(sorted(p.domains)) for p in active
            )),
        }
    
    # Private correlation detection methods
    
    def _should_correlate(self, event1: DomainEvent, event2: DomainEvent) -> bool:
        """Check if events are worth correlating"""
        # Both must be confirmed/strong
        min_confidence = 0.6
        return (
            event1.confidence >= min_confidence and
            event2.confidence >= min_confidence and
            event1.verdict not in ['falsified'] and
            event2.verdict not in ['falsified']
        )
    
    def _check_temporal_correlation(
        self,
        event1: DomainEvent,
        event2: DomainEvent
    ) -> Optional[CorrelationPattern]:
        """Check if events are simultaneous"""
        time1 = datetime.fromisoformat(event1.timestamp)
        time2 = datetime.fromisoformat(event2.timestamp)
        
        time_diff = abs((time1 - time2).total_seconds())
        
        if time_diff <= self.temporal_window.total_seconds():
            strength = 1.0 - (time_diff / self.temporal_window.total_seconds())
            
            if strength >= self.min_correlation_strength:
                import uuid
                pattern = CorrelationPattern(
                    pattern_id=f"corr-{uuid.uuid4().hex[:8]}",
                    domains=[event1.domain, event2.domain],
                    correlation_type=CorrelationType.TEMPORAL,
                    time_lag=time_diff,
                    events=[event1, event2],
                    correlation_strength=strength,
                    description=f"Simultaneous emergence in {event1.domain} and {event2.domain}",
                )
                return pattern
        
        return None
    
    def _check_sequential_correlation(
        self,
        event1: DomainEvent,
        event2: DomainEvent
    ) -> Optional[CorrelationPattern]:
        """Check if events are sequential (one follows other)"""
        time1 = datetime.fromisoformat(event1.timestamp)
        time2 = datetime.fromisoformat(event2.timestamp)
        
        # event1 should come before event2
        if time2 < time1:
            event1, event2 = event2, event1
        
        time_diff = (datetime.fromisoformat(event2.timestamp) - 
                     datetime.fromisoformat(event1.timestamp)).total_seconds()
        
        # Sequential window: 30 seconds to 30 minutes
        if 30 < time_diff < 1800:
            strength = 1.0 - (time_diff / 1800)
            
            if strength >= self.min_correlation_strength:
                import uuid
                pattern = CorrelationPattern(
                    pattern_id=f"corr-{uuid.uuid4().hex[:8]}",
                    domains=[event1.domain, event2.domain],
                    correlation_type=CorrelationType.SEQUENTIAL,
                    time_lag=time_diff,
                    events=[event1, event2],
                    correlation_strength=strength,
                    description=f"{event1.domain} emergence followed by {event2.domain}",
                    hypothesis="Possible causal relationship: emergence in first domain triggers second",
                    requires_review=True,
                )
                return pattern
        
        return None
    
    def _check_magnitude_correlation(
        self,
        event1: DomainEvent,
        event2: DomainEvent
    ) -> Optional[CorrelationPattern]:
        """Check if event magnitudes are correlated"""
        # Only meaningful if events are close in time
        time1 = datetime.fromisoformat(event1.timestamp)
        time2 = datetime.fromisoformat(event2.timestamp)
        time_diff = abs((time1 - time2).total_seconds())
        
        if time_diff > 600:  # 10 minutes apart
            return None
        
        # Normalize metrics to 0-1 scale
        m1 = min(1.0, event1.primary_metric / 10.0)
        m2 = min(1.0, event2.primary_metric / 10.0)
        
        # Compute magnitude correlation
        correlation = 1.0 - abs(m1 - m2)
        
        if correlation >= self.min_correlation_strength:
            import uuid
            pattern = CorrelationPattern(
                pattern_id=f"corr-{uuid.uuid4().hex[:8]}",
                domains=[event1.domain, event2.domain],
                correlation_type=CorrelationType.MAGNITUDE_CORRELATED,
                time_lag=time_diff,
                events=[event1, event2],
                correlation_strength=correlation,
                description=f"Magnitude correlation: {event1.domain}({m1:.2f}) ↔ {event2.domain}({m2:.2f})",
            )
            return pattern
        
        return None


# Global correlation detector
_correlation_detector: Optional[CorrelationDetector] = None


def get_correlation_detector() -> CorrelationDetector:
    """Get or create global correlation detector"""
    global _correlation_detector
    if _correlation_detector is None:
        _correlation_detector = CorrelationDetector()
    return _correlation_detector


if __name__ == "__main__":
    """Test correlation detector"""
    logging.basicConfig(level=logging.INFO)
    
    print("Phase 2e Multi-Domain Correlation Detector Test")
    print("=" * 70)
    
    detector = get_correlation_detector()
    
    # Test 1: Process events from different domains
    print("\nTest 1: Process Multi-Domain Events")
    print("-" * 70)
    
    now = datetime.utcnow()
    
    event1 = DomainEvent(
        domain="solar_wind",
        job_id="job-1",
        analysis_type="emergence_detection",
        verdict="strongly_confirmed",
        confidence=0.99,
        primary_metric=0.12,
        timestamp=now.isoformat(),
        signal_strength="strong"
    )
    
    patterns1 = detector.process_event(event1)
    print(f"Solar wind event processed. Patterns: {len(patterns1)}")
    
    # Seismic event 2 minutes later
    event2_time = now + timedelta(seconds=120)
    event2 = DomainEvent(
        domain="earthquakes",
        job_id="job-2",
        analysis_type="scale_invariance",
        verdict="confirmed",
        confidence=0.87,
        primary_metric=0.45,
        timestamp=event2_time.isoformat(),
        signal_strength="moderate"
    )
    
    patterns2 = detector.process_event(event2)
    print(f"Earthquake event processed. Patterns: {len(patterns2)}")
    
    # Test 2: Get active patterns
    print("\nTest 2: Active Correlation Patterns")
    print("-" * 70)
    
    active = detector.get_active_patterns()
    print(f"Active patterns: {len(active)}")
    for pattern in active:
        narrative = detector.generate_narrative(pattern)
        print(f"  - {pattern.correlation_type.value}: {narrative}")
    
    # Test 3: Statistics
    print("\nTest 3: Correlation Statistics")
    print("-" * 70)
    
    stats = detector.get_statistics()
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    print("\nPhase 2e Multi-Domain Correlation Detector Ready ✅")
