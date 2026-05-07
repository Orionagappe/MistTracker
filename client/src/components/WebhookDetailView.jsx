/**
 * Webhook Details Component
 * Phase 17.2.7: Real-time Analytics UI Components
 * 
 * Detailed view of individual webhook analytics
 */

import React, { useState } from 'react';
import {
  useWebhookHealth,
  usePerformanceTrend,
  useRecommendations,
} from '../hooks/useAnalytics';
import {
  PerformanceMetrics,
  HourlyPatternChart,
  WebhookComparisonChart,
} from './AnalyticsCharts';

export default function WebhookDetailView({ webhookId }) {
  const [selectedDays, setSelectedDays] = useState(7);

  const {
    data: health,
    loading: healthLoading,
    error: healthError,
  } = useWebhookHealth(webhookId);

  const {
    data: trend,
    loading: trendLoading,
  } = usePerformanceTrend(webhookId, selectedDays);

  const {
    data: recommendations,
    loading: recLoading,
  } = useRecommendations(webhookId);

  if (healthError) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-700">Failed to load webhook details</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{webhookId}</h1>
          <p className="text-gray-500 mt-1">Detailed Performance Analytics</p>
        </div>
        <select
          value={selectedDays}
          onChange={(e) => setSelectedDays(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Status Card */}
      {health && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <p className="text-2xl font-bold mt-1">
                {health.status?.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Health Score</p>
              <div className="mt-1 flex items-center">
                <p className="text-2xl font-bold">{health.health_score}</p>
                <p className="text-gray-500 text-sm ml-1">/100</p>
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {health.metrics?.success_rate?.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Avg Latency</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {health.metrics?.avg_latency_ms}ms
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {health?.metrics && (
        <PerformanceMetrics summary={health.metrics} />
      )}

      {/* Performance Trend */}
      {trend && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📈 Performance Trend ({selectedDays} Days)
          </h3>

          <div className="space-y-4">
            {trend.map((day, idx) => (
              <TrendRow key={idx} day={day} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations?.recommendations && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            💡 Recommendations
          </h3>

          {recommendations.recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.recommendations.map((rec, idx) => (
                <RecommendationCard key={idx} recommendation={rec} />
              ))}
            </div>
          ) : (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-700">
              ✅ No issues detected! Webhook is performing well.
            </div>
          )}
        </div>
      )}

      {/* Error Breakdown */}
      {health?.top_errors && health.top_errors.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🚨 Recent Errors
          </h3>

          <div className="space-y-2">
            {health.top_errors.map((error, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-200"
              >
                <span className="font-medium text-red-900">{error.error}</span>
                <span className="text-sm text-red-600">{error.count} times</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Trend Row Component
 */
function TrendRow({ day }) {
  const getStatusColor = (rate) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-blue-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{day.date}</p>
        <div className="flex gap-6 mt-1 text-sm text-gray-600">
          <span>Success: {day.success_rate?.toFixed(1)}%</span>
          <span>Latency: {day.avg_response_time_ms}ms</span>
          <span>Deliveries: {day.total_deliveries}</span>
        </div>
      </div>
      <div className={`text-lg font-bold ${getStatusColor(day.success_rate)}`}>
        {day.success_rate?.toFixed(1)}%
      </div>
    </div>
  );
}

/**
 * Recommendation Card Component
 */
function RecommendationCard({ recommendation }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold mb-2">{recommendation.title}</h4>
          <p className="text-sm mb-3">{recommendation.message}</p>
          <ul className="text-sm space-y-1">
            {recommendation.actions?.map((action, idx) => (
              <li key={idx} className="flex gap-2">
                <span>•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
