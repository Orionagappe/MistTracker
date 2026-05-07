/**
 * Health Overview Component
 * Phase 17.2.7: Real-time Analytics UI Components
 * 
 * Displays webhook health status overview
 */

import React from 'react';

export default function HealthOverview({ summary, webhooks = [] }) {
  const getHealthColor = (status) => {
    switch (status) {
      case 'excellent':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
      case 'good':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' };
      case 'fair':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
      case 'poor':
        return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' };
      case 'critical':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent':
        return '✅';
      case 'good':
        return '✅';
      case 'fair':
        return '⚠️';
      case 'poor':
        return '⚠️';
      case 'critical':
        return '❌';
      default:
        return '❓';
    }
  };

  const colors = getHealthColor(summary?.overall_health);

  return (
    <div className="space-y-4">
      {/* Overall Health */}
      <div className={`p-6 rounded-lg border-2 ${colors.bg} ${colors.border}`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className={`text-2xl font-bold ${colors.text}`}>
              {getStatusIcon(summary?.overall_health)} Overall Health:{' '}
              {summary?.overall_health?.toUpperCase()}
            </h2>
            <p className={`${colors.text} mt-2`}>
              Average Health Score: <span className="font-semibold">{summary?.avg_health_score}/100</span>
            </p>
          </div>
          <div className="text-5xl">{getStatusIcon(summary?.overall_health)}</div>
        </div>
      </div>

      {/* Health Distribution */}
      <div className="grid grid-cols-5 gap-4">
        <HealthStat
          label="Excellent"
          count={summary?.excellent || 0}
          color="green"
        />
        <HealthStat
          label="Good"
          count={summary?.good || 0}
          color="blue"
        />
        <HealthStat
          label="Fair"
          count={summary?.fair || 0}
          color="yellow"
        />
        <HealthStat
          label="Poor"
          count={summary?.poor || 0}
          color="orange"
        />
        <HealthStat
          label="Critical"
          count={summary?.critical || 0}
          color="red"
        />
      </div>

      {/* Webhook List */}
      {webhooks && webhooks.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Webhook Status
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {webhooks.map((webhook) => (
              <WebhookRow key={webhook.webhook_id} webhook={webhook} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Health Stat Card
 */
function HealthStat({ label, count, color }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

/**
 * Webhook Row
 */
function WebhookRow({ webhook }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'fair':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{webhook.webhook_id}</p>
        <div className="flex gap-4 mt-1 text-xs text-gray-600">
          <span>Success: {webhook.metrics?.success_rate?.toFixed(1)}%</span>
          <span>Latency: {webhook.metrics?.avg_latency_ms}ms</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {webhook.health_score}/100
          </p>
          <p className="text-xs text-gray-600">
            {webhook.status?.toUpperCase()}
          </p>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(webhook.status)}`}>
          {webhook.status}
        </div>
      </div>
    </div>
  );
}
