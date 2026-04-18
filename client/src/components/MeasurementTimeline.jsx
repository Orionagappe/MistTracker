/**
 * MeasurementTimeline.jsx
 * Phase 9.5: Measurement timeline visualization
 * 
 * Displays chronological measurement events with:
 * - Timeline visualization
 * - Event filtering
 * - Time range selection
 * - Event details display
 */

import React, { useMemo, useState, useCallback } from 'react';
import '../styles/Analytics.css';

function MeasurementTimeline({
  events = [],
  onEventClick,
  onTimeRangeChange,
  filterByType = null,
  aggregated = false,
  showDetails = true,
  maxVisibleEvents = 50
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [timeRange, setTimeRangeFull] = useState({ start: null, end: null });

  /**
   * Filter and organize events
   */
  const processedEvents = useMemo(() => {
    let filtered = events;

    if (filterByType) {
      filtered = filtered.filter(e => e.type === filterByType);
    }

    if (timeRange.start || timeRange.end) {
      filtered = filtered.filter(e => {
        if (timeRange.start && e.timestamp < timeRange.start) return false;
        if (timeRange.end && e.timestamp > timeRange.end) return false;
        return true;
      });
    }

    return filtered;
  }, [events, filterByType, timeRange]);

  /**
   * Calculate timeline statistics
   */
  const stats = useMemo(() => {
    if (processedEvents.length === 0) {
      return {
        totalEvents: 0,
        timeSpan: 0,
        earliest: null,
        latest: null,
        eventsByType: {}
      };
    }

    const earliest = Math.min(...processedEvents.map(e => e.timestamp));
    const latest = Math.max(...processedEvents.map(e => e.timestamp));
    const timeSpan = latest - earliest;

    const eventsByType = {};
    for (const event of processedEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    }

    return {
      totalEvents: processedEvents.length,
      timeSpan,
      earliest,
      latest,
      eventsByType,
      averageEventsPerSecond: processedEvents.length / (timeSpan / 1000)
    };
  }, [processedEvents]);

  /**
   * Handle event selection
   */
  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
    onEventClick?.(event);
  }, [onEventClick]);

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  /**
   * Format duration
   */
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  /**
   * Get event color by type
   */
  const getEventColor = (type) => {
    const colors = {
      distance: '#00d4ff',
      angle: '#00ff00',
      area: '#ffaa00',
      volume: '#ff3366'
    };
    return colors[type] || '#00d4ff';
  };

  /**
   * Get visual position for event in timeline
   */
  const getEventPosition = (event) => {
    if (stats.timeSpan === 0) return 0;
    return ((event.timestamp - stats.earliest) / stats.timeSpan) * 100;
  };

  /**
   * Handle time range change
   */
  const handleTimeRangeChange = useCallback((start, end) => {
    setTimeRangeFull({ start, end });
    onTimeRangeChange?.({ start, end });
  }, [onTimeRangeChange]);

  if (processedEvents.length === 0) {
    return (
      <div className="timeline-container empty">
        <div className="timeline-empty-state">
          <p>📭 No measurement events to display</p>
          <small>Start measuring to populate the timeline</small>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {/* Header Stats */}
      <div className="timeline-header">
        <h3>📊 Measurement Timeline</h3>
        <div className="timeline-stats">
          <div className="stat">
            <span className="label">Events:</span>
            <span className="value">{stats.totalEvents}</span>
          </div>
          <div className="stat">
            <span className="label">Duration:</span>
            <span className="value">{formatDuration(stats.timeSpan)}</span>
          </div>
          <div className="stat">
            <span className="label">Rate:</span>
            <span className="value">{stats.averageEventsPerSecond?.toFixed(1)}/s</span>
          </div>
        </div>
      </div>

      {/* Type Distribution */}
      <div className="type-distribution">
        {Object.entries(stats.eventsByType).map(([type, count]) => (
          <div key={type} className="type-badge">
            <span className="dot" style={{ backgroundColor: getEventColor(type) }}></span>
            <span className="type-name">{type}</span>
            <span className="type-count">{count}</span>
          </div>
        ))}
      </div>

      {/* Visual Timeline */}
      <div className="timeline-visual">
        <div className="timeline-track">
          {processedEvents.map((event, idx) => (
            <div
              key={event.id || idx}
              className="timeline-event-marker"
              style={{
                left: `${getEventPosition(event)}%`,
                backgroundColor: getEventColor(event.type)
              }}
              onClick={() => handleEventClick(event)}
              title={`${event.type}: ${event.measurement.value}`}
            />
          ))}
        </div>
        <div className="timeline-labels">
          <div className="label">{formatTime(stats.earliest)}</div>
          <div className="label">Mid</div>
          <div className="label">{formatTime(stats.latest)}</div>
        </div>
      </div>

      {/* Events List */}
      <div className="timeline-events-list">
        <div className="list-header">
          <h4>Events ({processedEvents.length})</h4>
          <div className="list-controls">
            <button 
              className="btn-small"
              onClick={() => handleTimeRangeChange(null, null)}
              title="Clear filters"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="events-scroll">
          {processedEvents.slice(0, maxVisibleEvents).map((event, idx) => (
            <div
              key={event.id || idx}
              className={`timeline-event-item ${selectedEvent?.id === event.id ? 'selected' : ''}`}
              onClick={() => handleEventClick(event)}
            >
              <div className="event-marker">
                <div
                  className="marker-dot"
                  style={{ backgroundColor: getEventColor(event.type) }}
                />
              </div>

              <div className="event-content">
                <div className="event-header">
                  <span className="event-type badge" style={{
                    backgroundColor: getEventColor(event.type) + '30',
                    color: getEventColor(event.type),
                    borderColor: getEventColor(event.type)
                  }}>
                    {event.type.toUpperCase()}
                  </span>
                  <span className="event-time">{formatTime(event.timestamp)}</span>
                </div>

                <div className="event-value">
                  <strong>{event.measurement.label}</strong>
                  <span className="value-numeric">{event.measurement.value.toFixed(2)}</span>
                  <span className="value-units">{event.measurement.units}</span>
                </div>

                {showDetails && selectedEvent?.id === event.id && (
                  <div className="event-details" onClick={e => e.stopPropagation()}>
                    <div className="detail-row">
                      <span className="key">ID:</span>
                      <span className="value" style={{ fontFamily: 'monospace' }}>
                        {event.id}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="key">Points:</span>
                      <span className="value">
                        {event.metadata.points?.length || 0} points
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="key">Session:</span>
                      <span className="value">
                        {event.metadata.sessionId?.substring(0, 8)}...
                      </span>
                    </div>
                    {event.metadata.raw && (
                      <div className="detail-row">
                        <span className="key">Raw Value:</span>
                        <span className="value">
                          {event.metadata.raw.value?.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="event-actions" onClick={e => e.stopPropagation()}>
                <button className="action-btn" title="Copy value">
                  📋
                </button>
                <button className="action-btn" title="Details">
                  ℹ
                </button>
              </div>
            </div>
          ))}

          {processedEvents.length > maxVisibleEvents && (
            <div className="events-overflow">
              <p>... and {processedEvents.length - maxVisibleEvents} more events</p>
            </div>
          )}
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="timeline-filters">
        <h4>Filters</h4>
        <div className="filter-row">
          <label>
            <span>Start Time:</span>
            <input
              type="datetime-local"
              onChange={(e) => {
                if (e.target.value) {
                  const start = new Date(e.target.value).getTime();
                  handleTimeRangeChange(start, timeRange.end);
                }
              }}
            />
          </label>
          <label>
            <span>End Time:</span>
            <input
              type="datetime-local"
              onChange={(e) => {
                if (e.target.value) {
                  const end = new Date(e.target.value).getTime();
                  handleTimeRangeChange(timeRange.start, end);
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default MeasurementTimeline;
