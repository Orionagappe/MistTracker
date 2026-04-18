/**
 * AnalyticsPanel.jsx
 * Phase 9.5: Main analytics container component
 * 
 * Orchestrates all analytics features:
 * - Timeline visualization
 * - Trend analysis
 * - Statistical reporting
 * - Comparative analysis
 * - Data export
 */

import React, { useState, useCallback, useEffect } from 'react';
import MeasurementTimeline from './MeasurementTimeline';
import TrendAnalysis from './TrendAnalysis';
import StatisticalReport from './StatisticalReport';
import ComparativeAnalysis from './ComparativeAnalysis';
import '../styles/Analytics.css';

/**
 * AnalyticsPanel Component
 * 
 * Props:
 * - analytics: {events, trends, statistics, report}
 * - onExport: (data, format) => void
 * - onSelectionChange: (type, data) => void
 * - defaultTab: 'timeline' | 'trends' | 'statistics' | 'comparison'
 */
export const AnalyticsPanel = ({
  analytics,
  onExport = () => {},
  onSelectionChange = () => {},
  defaultTab = 'timeline'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [timeRange, setTimeRange] = useState(null);
  const [selectedType, setSelectedType] = useState('distance');
  const [measurementTypes] = useState(['distance', 'angle', 'area', 'volume']);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [datasets, setDatasets] = useState([]);

  // Update filtered events based on time range
  useEffect(() => {
    if (!analytics?.events) {
      setFilteredEvents([]);
      return;
    }

    let events = analytics.events;
    if (timeRange?.start && timeRange?.end) {
      events = events.filter(e => {
        const time = new Date(e.timestamp).getTime();
        return time >= timeRange.start && time <= timeRange.end;
      });
    }

    setFilteredEvents(events);
  }, [analytics?.events, timeRange]);

  // Organize events by type for comparison datasets
  useEffect(() => {
    if (!analytics?.events) {
      setDatasets([]);
      return;
    }

    const typeGroups = {};
    measurementTypes.forEach(type => {
      const typeEvents = analytics.events.filter(e => e.type === type);
      if (typeEvents.length > 0) {
        typeGroups[type] = {
          id: `type-${type}`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Measurements`,
          type,
          data: typeEvents.map(e => e.value),
          color: getTypeColor(type)
        };
      }
    });

    setDatasets(Object.values(typeGroups));
  }, [analytics?.events, measurementTypes]);

  // Get color for measurement type
  const getTypeColor = (type) => {
    const colors = {
      distance: '#00d4ff',
      angle: '#00ff00',
      area: '#ff6666',
      volume: '#ffaa00'
    };
    return colors[type] || '#00d4ff';
  };

  // Get data for selected type
  const getTypeData = useCallback(() => {
    if (!analytics?.events) return [];
    return analytics.events
      .filter(e => e.type === selectedType)
      .map(e => e.value);
  }, [analytics?.events, selectedType]);

  // Render timeline tab
  const renderTimelineTab = () => (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '12px', fontWeight: 'bold' }}>
        Measurement Timeline
      </h3>
      {filteredEvents.length > 0 ? (
        <MeasurementTimeline
          events={filteredEvents}
          onEventClick={(event) => onSelectionChange('event', event)}
          onTimeRangeChange={setTimeRange}
          aggregated={false}
          showDetails={true}
          maxVisibleEvents={50}
        />
      ) : (
        <div style={{
          padding: '30px',
          textAlign: 'center',
          background: 'rgba(0, 212, 255, 0.05)',
          border: '1px dashed rgba(0, 212, 255, 0.2)',
          borderRadius: '4px',
          color: '#00d4ff'
        }}>
          <p>No events in selected time range</p>
        </div>
      )}
    </div>
  );

  // Render trends tab
  const renderTrendsTab = () => (
    <div style={{ marginTop: '20px' }}>
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', backgroundColor: 'rgba(0, 212, 255, 0.05)', padding: '10px', borderRadius: '4px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00d4ff', fontSize: '11px', fontWeight: 'bold' }}>
          Measurement Type:
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {measurementTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                padding: '4px 10px',
                background: selectedType === type ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 212, 255, 0.05)',
                border: selectedType === type 
                  ? `1px solid ${getTypeColor(type)}` 
                  : '1px solid rgba(0, 212, 255, 0.2)',
                color: getTypeColor(type),
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <TrendAnalysis
        data={getTypeData()}
        type={selectedType}
        showMovingAverage={true}
        movingAverageWindow={5}
        showProjection={true}
        projectionSteps={5}
        onTrendDetected={(trend) => onSelectionChange('trend', trend)}
      />
    </div>
  );

  // Render statistics tab
  const renderStatisticsTab = () => (
    <div style={{ marginTop: '20px' }}>
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', backgroundColor: 'rgba(0, 212, 255, 0.05)', padding: '10px', borderRadius: '4px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00d4ff', fontSize: '11px', fontWeight: 'bold' }}>
          Measurement Type:
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {measurementTypes.map(type => {
            const typeCount = analytics?.events?.filter(e => e.type === type).length || 0;
            return typeCount > 0 ? (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                style={{
                  padding: '4px 10px',
                  background: selectedType === type ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 212, 255, 0.05)',
                  border: selectedType === type 
                    ? `1px solid ${getTypeColor(type)}` 
                    : '1px solid rgba(0, 212, 255, 0.2)',
                  color: getTypeColor(type),
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}
              >
                {type}
                <span style={{ 
                  marginLeft: '6px', 
                  background: 'rgba(0, 255, 0, 0.2)', 
                  color: '#00ff00',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  fontSize: '9px'
                }}>
                  {typeCount}
                </span>
              </button>
            ) : null;
          })}
        </div>
      </div>

      {analytics?.statistics ? (
        <StatisticalReport
          data={analytics.statistics || {}}
          distributions={analytics.distributions || {}}
          onExport={(data, format) => onExport(data, format)}
          exportFormats={['json', 'csv']}
        />
      ) : (
        <div style={{
          padding: '30px',
          textAlign: 'center',
          background: 'rgba(0, 212, 255, 0.05)',
          border: '1px dashed rgba(0, 212, 255, 0.2)',
          borderRadius: '4px',
          color: '#00d4ff'
        }}>
          <p>No statistics available</p>
          <small>Run analysis to generate statistics</small>
        </div>
      )}
    </div>
  );

  // Render comparison tab
  const renderComparisonTab = () => (
    <div style={{ marginTop: '20px' }}>
      <ComparativeAnalysis
        datasets={datasets}
        onDatasetSelect={(id) => onSelectionChange('dataset', id)}
        onComparisonChange={(comparison) => onSelectionChange('comparison', comparison)}
        maxDatasets={4}
      />
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '2px solid #00d4ff',
        borderBottom: 'none',
        borderRadius: '8px 8px 0 0',
        padding: '20px',
        color: '#e0e0e0',
        fontFamily: "'Monaco', 'Menlo', monospace"
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{
            margin: 0,
            color: '#00ffff',
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Advanced Analytics
          </h2>
          <div style={{
            display: 'flex',
            gap: '8px',
            fontSize: '11px',
            color: '#00d4ff'
          }}>
            {analytics?.events && (
              <>
                <span>Events: <strong style={{ color: '#00ff00' }}>{analytics.events.length}</strong></span>
                <span>Types: <strong style={{ color: '#00ff00' }}>{measurementTypes.filter(t => 
                  analytics.events.some(e => e.type === t)
                ).length}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'timeline', label: 'Timeline', icon: '📊' },
            { id: 'trends', label: 'Trends', icon: '📈' },
            { id: 'statistics', label: 'Statistics', icon: '📉' },
            { id: 'comparison', label: 'Comparison', icon: '⚖' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                background: activeTab === tab.id 
                  ? 'rgba(0, 212, 255, 0.2)' 
                  : 'rgba(0, 212, 255, 0.05)',
                border: activeTab === tab.id 
                  ? '1px solid #00d4ff' 
                  : '1px solid rgba(0, 212, 255, 0.2)',
                color: activeTab === tab.id ? '#00d4ff' : '#7a9fb8',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                textTransform: 'uppercase'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '2px solid #00d4ff',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px',
        color: '#e0e0e0',
        fontFamily: "'Monaco', 'Menlo', monospace",
        minHeight: '400px'
      }}>
        {!analytics ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#00d4ff'
          }}>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>Loading analytics data...</p>
            <small style={{ opacity: '0.6' }}>Connect a measurement engine to begin</small>
          </div>
        ) : (
          <>
            {activeTab === 'timeline' && renderTimelineTab()}
            {activeTab === 'trends' && renderTrendsTab()}
            {activeTab === 'statistics' && renderStatisticsTab()}
            {activeTab === 'comparison' && renderComparisonTab()}
          </>
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        background: 'rgba(0, 212, 255, 0.05)',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        borderRadius: '0 0 8px 8px',
        padding: '10px 20px',
        color: '#00d4ff',
        fontSize: '10px',
        marginTop: '-1px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Active Tab: <strong style={{ color: '#00ff00', textTransform: 'uppercase' }}>{activeTab}</strong></span>
        <span style={{ opacity: '0.6' }}>Phase 9.5 • Advanced Analytics & Reporting</span>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
