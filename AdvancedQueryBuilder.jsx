/**
 * Advanced Query Builder - Powerful query construction interface
 * Allows users to build complex queries with filters, operators, and templates
 * 
 * @file client/src/components/AdvancedQueryBuilder.jsx
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import axios from 'axios';

export default function AdvancedQueryBuilder() {
  const [filters, setFilters] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [queryName, setQueryName] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [showPreview, setShowPreview] = useState(false);

  // Query templates
  const templates = {
    slow_webhooks: {
      name: 'Slow Webhooks',
      description: 'Webhooks with avg latency > 500ms',
      filters: [
        { field: 'avgLatency', operator: '>', value: 500 }
      ]
    },
    high_error_rate: {
      name: 'High Error Rates',
      description: 'Webhooks with error rate > 5%',
      filters: [
        { field: 'errorRate', operator: '>', value: 5 }
      ]
    },
    recent_failures: {
      name: 'Recently Failed',
      description: 'Webhooks failed in last 24 hours',
      filters: [
        { field: 'lastFailureTime', operator: 'last_24h', value: '' }
      ]
    },
    best_performers: {
      name: 'Best Performers',
      description: 'Webhooks with >98% success rate',
      filters: [
        { field: 'successRate', operator: '>', value: 98 }
      ]
    },
    degrading_performance: {
      name: 'Degrading Performance',
      description: 'Webhooks with declining success rate',
      filters: [
        { field: 'successRateTrend', operator: '<', value: -5 }
      ]
    },
  };

  // Available fields
  const availableFields = {
    'webhookId': { type: 'string', label: 'Webhook ID' },
    'webhookName': { type: 'string', label: 'Webhook Name' },
    'status': { type: 'select', label: 'Status', options: ['active', 'inactive', 'error'] },
    'eventType': { type: 'string', label: 'Event Type' },
    'successRate': { type: 'number', label: 'Success Rate (%)', min: 0, max: 100 },
    'errorRate': { type: 'number', label: 'Error Rate (%)', min: 0, max: 100 },
    'avgLatency': { type: 'number', label: 'Avg Latency (ms)', min: 0 },
    'p95Latency': { type: 'number', label: 'P95 Latency (ms)', min: 0 },
    'totalEvents': { type: 'number', label: 'Total Events', min: 0 },
    'lastFailureTime': { type: 'datetime', label: 'Last Failure' },
    'createdAt': { type: 'datetime', label: 'Created Date' },
    'updatedAt': { type: 'datetime', label: 'Last Updated' },
  };

  // Available operators
  const operatorsByType = {
    number: [
      { value: '>', label: 'Greater than' },
      { value: '<', label: 'Less than' },
      { value: '>=', label: 'Greater or equal' },
      { value: '<=', label: 'Less or equal' },
      { value: '==', label: 'Equal to' },
      { value: '!=', label: 'Not equal' },
      { value: 'between', label: 'Between' },
    ],
    string: [
      { value: 'contains', label: 'Contains' },
      { value: 'startsWith', label: 'Starts with' },
      { value: 'endsWith', label: 'Ends with' },
      { value: '==', label: 'Equals' },
      { value: '!=', label: 'Not equals' },
      { value: 'regex', label: 'Regex pattern' },
    ],
    datetime: [
      { value: 'last_24h', label: 'Last 24 hours' },
      { value: 'last_7d', label: 'Last 7 days' },
      { value: 'last_30d', label: 'Last 30 days' },
      { value: 'between', label: 'Between dates' },
      { value: 'before', label: 'Before' },
      { value: 'after', label: 'After' },
    ],
    select: [
      { value: '==', label: 'Equals' },
      { value: '!=', label: 'Not equals' },
      { value: 'in', label: 'In list' },
    ],
  };

  // Add filter
  const addFilter = useCallback(() => {
    setFilters([...filters, {
      id: Date.now(),
      field: '',
      operator: '',
      value: '',
      logicalOp: filters.length > 0 ? 'AND' : '',
    }]);
  }, [filters]);

  // Update filter
  const updateFilter = useCallback((id, updates) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  }, [filters]);

  // Remove filter
  const removeFilter = useCallback((id) => {
    setFilters(filters.filter(f => f.id !== id));
  }, [filters]);

  // Load template
  const loadTemplate = useCallback((templateKey) => {
    if (templates[templateKey]) {
      setSelectedTemplate(templateKey);
      setFilters(templates[templateKey].filters.map((f, i) => ({
        ...f,
        id: Date.now() + i,
        logicalOp: i > 0 ? 'AND' : '',
      })));
    }
  }, []);

  // Build query object
  const buildQueryObject = useCallback(() => {
    if (filters.length === 0) return null;

    if (filters.length === 1) {
      const f = filters[0];
      return {
        field: f.field,
        operator: f.operator,
        value: f.value,
      };
    }

    // Multiple filters
    return {
      operator: 'AND',
      conditions: filters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
      })),
    };
  }, [filters]);

  // Execute query
  const executeQuery = useCallback(async () => {
    const query = buildQueryObject();
    if (!query) {
      alert('Please add at least one filter');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        '/api/v1/analytics/query',
        query,
        { timeout: 10000 }
      );

      setResults({
        count: response.data.length || 0,
        data: response.data,
        executedAt: new Date().toISOString(),
      });
    } catch (error) {
      alert(`Query failed: ${error.message}`);
      console.error('Query error:', error);
    } finally {
      setLoading(false);
    }
  }, [buildQueryObject]);

  // Export results
  const exportResults = useCallback(() => {
    if (!results) return;

    let content, filename, mimeType;

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(results.data, null, 2);
        filename = `query-results-${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        const headers = Object.keys(results.data[0] || {});
        const csvContent = [
          headers.join(','),
          ...results.data.map(row =>
            headers.map(h => {
              const val = row[h];
              return typeof val === 'string' && val.includes(',')
                ? `"${val}"`
                : val;
            }).join(',')
          ),
        ].join('\n');
        content = csvContent;
        filename = `query-results-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;

      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [results, exportFormat]);

  // Save as template
  const saveCurrentAsTemplate = useCallback(async () => {
    if (!queryName) {
      alert('Please enter a template name');
      return;
    }

    try {
      await axios.post('/api/v1/analytics/query/templates', {
        name: queryName,
        filters,
      });
      alert('Template saved successfully');
      setQueryName('');
      setSaveAsTemplate(false);
    } catch (error) {
      alert(`Failed to save template: ${error.message}`);
    }
  }, [queryName, filters]);

  const query = buildQueryObject();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">🔍 Advanced Query Builder</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
          >
            {showPreview ? 'Hide' : 'Show'} JSON
          </button>
        </div>
      </div>

      {/* Query Preview */}
      {showPreview && query && (
        <div className="bg-gray-900 p-4 rounded-lg">
          <pre className="text-green-400 text-sm overflow-auto max-h-40">
            {JSON.stringify(query, null, 2)}
          </pre>
        </div>
      )}

      {/* Template Selection */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Templates</h3>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(templates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => loadTemplate(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                selectedTemplate === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={template.description}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🎯 Filters</h3>
          <button
            onClick={addFilter}
            className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200"
          >
            + Add Filter
          </button>
        </div>

        {filters.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No filters added. Click "Add Filter" to begin building your query.
          </p>
        ) : (
          <div className="space-y-3">
            {filters.map((filter, index) => (
              <FilterRow
                key={filter.id}
                filter={filter}
                index={index}
                availableFields={availableFields}
                operatorsByType={operatorsByType}
                onUpdate={(updates) => updateFilter(filter.id, updates)}
                onRemove={() => removeFilter(filter.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Query Execution */}
      <div className="border-t pt-6 flex gap-3">
        <button
          onClick={executeQuery}
          disabled={loading || filters.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Executing...' : '▶ Execute Query'}
        </button>

        <button
          onClick={() => setSaveAsTemplate(!saveAsTemplate)}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200"
        >
          💾 Save as Template
        </button>

        <button
          onClick={() => setFilters([])}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
        >
          🗑 Clear
        </button>
      </div>

      {/* Save as Template Form */}
      {saveAsTemplate && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="Template name..."
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={saveCurrentAsTemplate}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              Save
            </button>
            <button
              onClick={() => setSaveAsTemplate(false)}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              📊 Results ({results.count} records)
            </h3>
            <div className="flex gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={exportResults}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200"
              >
                ⬇ Export
              </button>
            </div>
          </div>

          {/* Results Table */}
          {results.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {Object.keys(results.data[0]).map((key) => (
                      <th
                        key={key}
                        className="px-4 py-2 text-left font-semibold text-gray-700"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.data.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      {Object.values(row).map((val, vidx) => (
                        <td key={vidx} className="px-4 py-2 text-gray-700">
                          {typeof val === 'object'
                            ? JSON.stringify(val)
                            : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {results.data.length > 50 && (
                <p className="text-gray-500 text-sm mt-2">
                  Showing 50 of {results.data.length} results
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No results found</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Filter Row Component
 */
function FilterRow({
  filter,
  index,
  availableFields,
  operatorsByType,
  onUpdate,
  onRemove,
}) {
  const selectedField = availableFields[filter.field];
  const fieldType = selectedField?.type || 'string';
  const operators = operatorsByType[fieldType] || [];

  return (
    <div className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Logical Operator */}
      {index > 0 && (
        <div className="flex-shrink-0">
          <select
            value={filter.logicalOp}
            onChange={(e) => onUpdate({ logicalOp: e.target.value })}
            className="px-2 py-2 border border-gray-300 rounded-md text-sm font-medium"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>
      )}

      {/* Field Selection */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Field
        </label>
        <select
          value={filter.field}
          onChange={(e) => onUpdate({ field: e.target.value, operator: '', value: '' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Select field...</option>
          {Object.entries(availableFields).map(([key, field]) => (
            <option key={key} value={key}>
              {field.label}
            </option>
          ))}
        </select>
      </div>

      {/* Operator Selection */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Operator
        </label>
        <select
          value={filter.operator}
          onChange={(e) => onUpdate({ operator: e.target.value })}
          disabled={!filter.field}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-200"
        >
          <option value="">Select operator...</option>
          {operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      {/* Value Input */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Value
        </label>
        {fieldType === 'select' && selectedField?.options ? (
          <select
            value={filter.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Select...</option>
            {selectedField.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : fieldType === 'number' ? (
          <input
            type="number"
            value={filter.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            min={selectedField?.min}
            max={selectedField?.max}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Enter value..."
          />
        ) : (
          <input
            type="text"
            value={filter.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Enter value..."
          />
        )}
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
