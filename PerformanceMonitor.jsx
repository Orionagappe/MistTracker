/**
 * Performance Monitor - Real-time performance metrics dashboard
 * Displays API performance, cache hit rates, component rendering, memory usage
 * 
 * @file client/src/components/PerformanceMonitor.jsx
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { getPerformanceTracker } from '../services/performanceTracker';
import { getCacheManager } from '../services/cacheManager';

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState(null);
  const [cacheMetrics, setCacheMetrics] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [activeTab, setActiveTab] = useState('overview');
  const performanceTracker = getPerformanceTracker();
  const cacheManager = getCacheManager();

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const perfReport = performanceTracker.getPerformanceReport();
      setMetrics(perfReport);
      setCacheMetrics(cacheManager.getStats());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, performanceTracker, cacheManager]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-gray-500">Loading performance metrics...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">⚡ Performance Monitor</h2>
          <SystemHealthIndicator health={metrics.systemHealth} errorRate={metrics.errorRate} />
        </div>

        <div className="flex items-center gap-4">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
          >
            <option value={2000}>Every 2s</option>
            <option value={5000}>Every 5s</option>
            <option value={10000}>Every 10s</option>
            <option value={30000}>Every 30s</option>
          </select>
          <button
            onClick={() => performanceTracker.clear()}
            className="px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200"
          >
            Clear Metrics
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Total API Calls"
          value={metrics.summary.totalAPICalls}
          icon="📡"
          color="bg-blue-50"
        />
        <SummaryCard
          title="Component Renders"
          value={metrics.summary.totalComponentRenders}
          icon="⚙️"
          color="bg-green-50"
        />
        <SummaryCard
          title="Errors"
          value={metrics.summary.totalErrors}
          icon="❌"
          color="bg-red-50"
        />
        <SummaryCard
          title="Cache Hit Rate"
          value={`${cacheMetrics?.hitRate || 0}%`}
          icon="💾"
          color="bg-purple-50"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {['overview', 'api', 'cache', 'components', 'errors', 'memory'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm capitalize border-b-2 transition ${
              activeTab === tab
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && <OverviewTab metrics={metrics} />}
        {activeTab === 'api' && <APITab metrics={metrics} />}
        {activeTab === 'cache' && <CacheTab cacheMetrics={cacheMetrics} />}
        {activeTab === 'components' && <ComponentsTab metrics={metrics} />}
        {activeTab === 'errors' && <ErrorsTab metrics={metrics} />}
        {activeTab === 'memory' && <MemoryTab metrics={metrics} />}
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, icon, color }) {
  return (
    <div className={`${color} p-4 rounded-lg border border-gray-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

// System Health Indicator
function SystemHealthIndicator({ health, errorRate }) {
  const statusColor = {
    healthy: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
  }[health] || 'bg-gray-100 text-gray-800';

  const statusIcon = {
    healthy: '✓',
    warning: '⚠',
    critical: '✕',
  }[health] || '?';

  return (
    <div className={`${statusColor} px-3 py-1 rounded-full text-sm font-medium`}>
      {statusIcon} {health.charAt(0).toUpperCase() + health.slice(1)} ({errorRate}%)
    </div>
  );
}

// Overview Tab
function OverviewTab({ metrics }) {
  const slowestAPI = metrics.slowestEndpoints[0];
  const slowestComponent = metrics.slowestComponents[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <StatRow label="Avg API Response" value={`${metrics.slowestEndpoints[0]?.avgDuration.toFixed(0) || 0}ms`} />
            <StatRow label="Avg Component Render" value={`${metrics.slowestComponents[0]?.avgDuration.toFixed(0) || 0}ms`} />
            <StatRow label="Error Rate" value={`${metrics.errorRate}%`} />
            <StatRow label="Memory Usage" value={metrics.memory?.usagePercent + '%'} />
          </div>
        </div>

        {/* System Info */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Info</h3>
          <div className="space-y-3">
            {metrics.memory && (
              <>
                <StatRow label="Heap Used" value={metrics.memory.usedMB + ' MB'} />
                <StatRow label="Heap Total" value={metrics.memory.totalMB + ' MB'} />
                <StatRow label="Heap Limit" value={metrics.memory.limitMB + ' MB'} />
              </>
            )}
            {metrics.network && (
              <StatRow label="Connection" value={metrics.network.effectiveType} />
            )}
          </div>
        </div>
      </div>

      {/* Top Issues */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-3">Slowest Endpoint</h3>
          {slowestAPI ? (
            <div>
              <p className="text-sm text-red-700 mb-2">{slowestAPI.endpoint}</p>
              <p className="text-2xl font-bold text-red-900">{slowestAPI.avgDuration.toFixed(0)}ms</p>
              <p className="text-xs text-red-600 mt-2">P95: {slowestAPI.p95Duration?.toFixed(0) || 'N/A'}ms</p>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-lg font-semibold text-orange-900 mb-3">Slowest Component</h3>
          {slowestComponent ? (
            <div>
              <p className="text-sm text-orange-700 mb-2">{slowestComponent.component}</p>
              <p className="text-2xl font-bold text-orange-900">{slowestComponent.avgDuration.toFixed(0)}ms</p>
              <p className="text-xs text-orange-600 mt-2">Renders: {slowestComponent.renders}</p>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

// API Tab
function APITab({ metrics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slowest Endpoints Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Slowest Endpoints</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Endpoint</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Avg (ms)</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">P95 (ms)</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Calls</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slowestEndpoints.map((endpoint, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700 truncate">{endpoint.endpoint}</td>
                    <td className="px-4 py-2 text-right text-gray-900 font-medium">
                      {endpoint.avgDuration.toFixed(0)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900 font-medium">
                      {endpoint.p95Duration?.toFixed(0) || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">{endpoint.calls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error-Prone Endpoints */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error-Prone Endpoints</h3>
          <div className="space-y-3">
            {metrics.errorProneEndpoints.length > 0 ? (
              metrics.errorProneEndpoints.map((endpoint, idx) => (
                <div key={idx} className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-red-900">{endpoint.endpoint}</p>
                    <span className="text-sm font-bold text-red-700">{endpoint.errors} errors</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${(100 - endpoint.successRate)}%` }}
                    />
                  </div>
                  <p className="text-xs text-red-600 mt-2">Success Rate: {endpoint.successRate}%</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No error-prone endpoints</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Cache Tab
function CacheTab({ cacheMetrics }) {
  if (!cacheMetrics) {
    return <p className="text-gray-500">Cache metrics unavailable</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 mb-2">Cache Hits</p>
          <p className="text-3xl font-bold text-green-900">{cacheMetrics.hits}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-600 mb-2">Cache Misses</p>
          <p className="text-3xl font-bold text-orange-900">{cacheMetrics.misses}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 mb-2">Hit Rate</p>
          <p className="text-3xl font-bold text-blue-900">{cacheMetrics.hitRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-2">Cache Operations</p>
          <div className="space-y-2 text-sm">
            <StatRow label="Sets" value={cacheMetrics.sets} />
            <StatRow label="Deletes" value={cacheMetrics.deletes} />
            <StatRow label="Expirations" value={cacheMetrics.expirations} />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-2">Storage</p>
          <div className="space-y-2 text-sm">
            <StatRow label="Used" value={(cacheMetrics.size / 1024).toFixed(2) + ' KB'} />
            <StatRow label="Total Requests" value={cacheMetrics.totalRequests} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Components Tab
function ComponentsTab({ metrics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Slowest Components */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Slowest Components</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Component</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Avg (ms)</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Renders</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slowestComponents.map((comp, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{comp.component}</td>
                    <td className="px-4 py-2 text-right text-gray-900 font-medium">
                      {comp.avgDuration.toFixed(0)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">{comp.renders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Rendered Components */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Rendered</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Component</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Renders</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Slow</th>
                </tr>
              </thead>
              <tbody>
                {metrics.mostRenderedComponents.map((comp, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{comp.component}</td>
                    <td className="px-4 py-2 text-right text-gray-900 font-medium">{comp.renders}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-orange-600 font-medium">{comp.slowRenders}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Errors Tab
function ErrorsTab({ metrics }) {
  if (metrics.recentErrors.length === 0) {
    return <p className="text-gray-500">No errors recorded</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Recent Errors (Last 10)</h3>
      <div className="space-y-3">
        {metrics.recentErrors.map((error, idx) => (
          <div key={idx} className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start justify-between mb-2">
              <p className="font-medium text-red-900">{error.type}</p>
              <p className="text-xs text-red-600">
                {new Date(error.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <p className="text-sm text-red-700">{error.message}</p>
            {error.stack && (
              <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-auto max-h-32">
                {error.stack}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Memory Tab
function MemoryTab({ metrics }) {
  if (!metrics.memory) {
    return <p className="text-gray-500">Memory metrics unavailable</p>;
  }

  const usagePercent = parseFloat(metrics.memory.usagePercent);
  const memoryColor = usagePercent > 80 ? 'bg-red-600' : usagePercent > 60 ? 'bg-yellow-600' : 'bg-green-600';

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
        
        {/* Memory Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-gray-700">Heap Usage</p>
            <p className="text-xl font-bold text-gray-900">{metrics.memory.usagePercent}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className={`${memoryColor} h-3 rounded-full`} style={{ width: metrics.memory.usagePercent + '%' }} />
          </div>
        </div>

        {/* Memory Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 mb-2">Used</p>
            <p className="text-2xl font-bold text-blue-900">{metrics.memory.usedMB} MB</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 mb-2">Total</p>
            <p className="text-2xl font-bold text-green-900">{metrics.memory.totalMB} MB</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-600 mb-2">Limit</p>
            <p className="text-2xl font-bold text-purple-900">{metrics.memory.limitMB} MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component
function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-gray-600">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
