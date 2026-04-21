/**
 * Chart Components
 * Phase 17.2.7: Real-time Analytics UI Components
 * 
 * Visualization components using Recharts
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

// ============================================================================
// EVENT TRENDS CHART
// ============================================================================

export function EventTrendsChart({ data = [] }) {
  const COLORS = ['#3B82F6', '#10B981'];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 Event Volume Trend (7 Days)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          <Area
            type="monotone"
            dataKey="events"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorEvents)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {data.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Events</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.reduce((sum, d) => sum + d.events, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Avg Daily</p>
            <p className="text-lg font-semibold text-gray-900">
              {Math.round(data.reduce((sum, d) => sum + d.events, 0) / data.length).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Peak Day</p>
            <p className="text-lg font-semibold text-gray-900">
              {Math.max(...data.map(d => d.events)).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EVENT TYPE BREAKDOWN
// ============================================================================

export function EventTypeBreakdown({ data = [] }) {
  const COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
  ];

  const topEvents = data.slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 Top Event Types
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={topEvents}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="total_count"
          >
            {topEvents.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {topEvents.map((event, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{
                  backgroundColor: COLORS[idx % COLORS.length],
                }}
              />
              <span className="text-gray-700">{event.event_type}</span>
            </div>
            <span className="font-semibold text-gray-900">
              {event.total_count?.toLocaleString() || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export function PerformanceMetrics({ summary = {} }) {
  const metrics = [
    {
      label: 'Success Rate',
      value: `${summary.success_rate?.toFixed(1) || 0}%`,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Avg Latency',
      value: `${summary.avg_latency_ms || 0}ms`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'P95 Latency',
      value: `${summary.p95_latency_ms || 0}ms`,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Error Rate',
      value: `${summary.error_rate?.toFixed(1) || 0}%`,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        ⚡ Performance Metrics
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className={`p-4 rounded-lg ${metric.bg}`}>
            <p className="text-gray-600 text-sm">{metric.label}</p>
            <p className={`text-2xl font-bold ${metric.color} mt-2`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// FORECAST CHART
// ============================================================================

export function ForecastChart({ forecast = [] }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔮 Event Forecast (7 Days)
      </h3>

      {forecast.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={forecast}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="day"
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                label={{ value: 'Days Ahead', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="predicted_events"
                fill="#3B82F6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Confidence Level:{' '}
              <span className="font-semibold text-gray-900">
                {forecast[0]?.confidence || 'N/A'}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Based on linear regression of historical data
            </p>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 py-8">
          Insufficient data for forecasting
        </p>
      )}
    </div>
  );
}

// ============================================================================
// HOURLY PATTERN CHART
// ============================================================================

export function HourlyPatternChart({ data = [], eventType = '' }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🕐 Hourly Pattern: {eventType}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="hour"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name="Event Count"
          />
          <Line
            type="monotone"
            dataKey="success_rate"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            yAxisId="right"
            name="Success Rate %"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// WEBHOOK COMPARISON CHART
// ============================================================================

export function WebhookComparisonChart({ webhooks = [] }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔗 Webhook Success Rates
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={webhooks}
          margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="webhook_id"
            angle={-45}
            textAnchor="end"
            height={100}
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="success_rate" fill="#10B981" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  EventTrendsChart,
  EventTypeBreakdown,
  PerformanceMetrics,
  ForecastChart,
  HourlyPatternChart,
  WebhookComparisonChart,
};
