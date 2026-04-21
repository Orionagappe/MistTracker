/**
 * Analytics Dashboard Components
 * Phase 17.2.7: Real-time Analytics UI Components
 * 
 * Main dashboard component with health overview, alerts, and charts
 */

import React, { useState, useEffect } from 'react';
import {
  useDashboard,
  useRealtimeAlerts,
  useAutoRefresh,
} from '../hooks/useAnalytics';
import HealthOverview from './HealthOverview';
import AlertsPanel from './AlertsPanel';
import EventTrendsChart from './EventTrendsChart';
import PerformanceMetrics from './PerformanceMetrics';
import EventTypeBreakdown from './EventTypeBreakdown';
import ForecastChart from './ForecastChart';

/**
 * Main Analytics Dashboard Component
 */
export default function AnalyticsDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(60000);  // 1 minute
  const [selectedPeriod, setSelectedPeriod] = useState(7);  // 7 days

  // Fetch dashboard data with auto-refresh
  const {
    data: dashboardData,
    loading,
    error,
    refetch,
  } = useAutoRefresh(
    async () => {
      const response = await fetch('/api/v1/analytics/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      return response.json();
    },
    refreshInterval,
    [refreshInterval]
  );

  // Get real-time alerts from WebSocket
  const { alerts } = useRealtimeAlerts();

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error Loading Dashboard</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Real-time webhook performance monitoring
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={30000}>Refresh every 30s</option>
            <option value={60000}>Refresh every 1m</option>
            <option value={300000}>Refresh every 5m</option>
          </select>

          <button
            onClick={refetch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Real-time Alerts */}
      {alerts.length > 0 && (
        <AlertsPanel alerts={alerts} />
      )}

      {/* Health Overview */}
      {dashboardData?.health_summary && (
        <HealthOverview
          summary={dashboardData.health_summary}
          webhooks={dashboardData.charts?.webhooks}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          title="Total Events (7d)"
          value={dashboardData?.summary?.total_events?.toLocaleString() || '0'}
          icon="📊"
          trend={dashboardData?.summary?.daily_trend}
        />
        <SummaryCard
          title="Avg Daily Events"
          value={dashboardData?.summary?.avg_daily_events?.toLocaleString() || '0'}
          icon="📈"
        />
        <SummaryCard
          title="Active Webhooks"
          value={dashboardData?.health_summary?.excellent + dashboardData?.health_summary?.good || '0'}
          icon="🔗"
        />
        <SummaryCard
          title="Health Score"
          value={`${dashboardData?.health_summary?.avg_health_score || '0'}/100`}
          icon="❤️"
          status={dashboardData?.health_summary?.overall_health}
        />
      </div>

      {/* Charts Row 1: Trends and Breakdown */}
      <div className="grid grid-cols-3 gap-6">
        {/* Event Trends */}
        {dashboardData?.charts?.daily_volume && (
          <div className="col-span-2">
            <EventTrendsChart data={dashboardData.charts.daily_volume} />
          </div>
        )}

        {/* Event Type Breakdown */}
        {dashboardData?.charts?.event_types && (
          <div>
            <EventTypeBreakdown data={dashboardData.charts.event_types} />
          </div>
        )}
      </div>

      {/* Charts Row 2: Performance and Forecast */}
      <div className="grid grid-cols-2 gap-6">
        {/* Performance Metrics */}
        {dashboardData?.summary && (
          <PerformanceMetrics summary={dashboardData.summary} />
        )}

        {/* Forecast */}
        {dashboardData?.forecast && (
          <ForecastChart forecast={dashboardData.forecast} />
        )}
      </div>

      {/* Top Errors */}
      {dashboardData?.top_errors && dashboardData.top_errors.length > 0 && (
        <TopErrorsPanel errors={dashboardData.top_errors} />
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

/**
 * Summary Card Component
 */
function SummaryCard({ title, value, icon, trend, status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'bg-green-50 border-green-200';
      case 'fair':
        return 'bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'bg-orange-50 border-orange-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={`p-6 rounded-lg border ${
        status ? getStatusColor(status) : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-2 ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend > 0 ? '📈' : '📉'} {Math.abs(trend).toFixed(1)}%
            </p>
          )}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

/**
 * Top Errors Panel
 */
function TopErrorsPanel({ errors }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🚨 Top Errors (Last 7 Days)
      </h3>

      <div className="space-y-3">
        {errors.slice(0, 5).map((error, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-200"
          >
            <div>
              <p className="font-medium text-red-900">{error.error}</p>
              <p className="text-sm text-red-700">
                {error.message || 'Check webhook configuration'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-red-600">{error.count}</p>
              <p className="text-xs text-red-500">occurrences</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
