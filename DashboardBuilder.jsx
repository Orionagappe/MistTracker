/**
 * Dashboard Builder - Drag-and-drop custom dashboard creation
 * Allows users to create personalized dashboards with configurable widgets
 * 
 * @file client/src/components/DashboardBuilder.jsx
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

export default function DashboardBuilder() {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState(null);

  // Available widget types
  const widgetTypes = {
    summary_card: {
      name: 'Summary Card',
      icon: '📊',
      description: 'Single metric display',
      defaultConfig: {
        title: 'Metric',
        metric: 'totalEvents',
        period: '7d',
      }
    },
    trend_chart: {
      name: 'Trend Chart',
      icon: '📈',
      description: 'Time series visualization',
      defaultConfig: {
        title: 'Trends',
        metric: 'eventVolume',
        period: '30d',
        chartType: 'area',
      }
    },
    alert_panel: {
      name: 'Alert Panel',
      icon: '🚨',
      description: 'Recent alerts and anomalies',
      defaultConfig: {
        title: 'Alerts',
        severity: 'all',
        maxItems: 10,
      }
    },
    performance_metrics: {
      name: 'Performance Metrics',
      icon: '⚡',
      description: 'Key performance indicators',
      defaultConfig: {
        title: 'Performance',
        metrics: ['successRate', 'avgLatency', 'errorRate'],
      }
    },
    heatmap: {
      name: 'Heatmap',
      icon: '🔥',
      description: 'Webhook performance heatmap',
      defaultConfig: {
        title: 'Performance Heatmap',
        metric: 'successRate',
      }
    },
    real_time_feed: {
      name: 'Real-Time Feed',
      icon: '⚙️',
      description: 'Live event stream',
      defaultConfig: {
        title: 'Live Events',
        limit: 20,
        eventType: 'all',
      }
    },
    custom_text: {
      name: 'Custom Text',
      icon: '📝',
      description: 'Notes and documentation',
      defaultConfig: {
        title: 'Notes',
        content: 'Add your notes here...',
      }
    },
  };

  // Fetch dashboards
  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/analytics/dashboards');
      setDashboards(response.data || []);
    } catch (error) {
      console.error('Failed to load dashboards:', error);
    }
  }, []);

  // Create new dashboard
  const createDashboard = useCallback(async () => {
    if (!newDashboardName) {
      alert('Please enter a dashboard name');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/v1/analytics/dashboards', {
        name: newDashboardName,
        layout: 'grid-12',
        widgets: [],
      });

      setDashboards([...dashboards, response.data]);
      setSelectedDashboard(response.data);
      setWidgets([]);
      setNewDashboardName('');
      setShowCreateForm(false);
      setEditMode(true);
    } catch (error) {
      alert(`Failed to create dashboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [newDashboardName, dashboards]);

  // Select dashboard
  const selectDashboard = useCallback((dashboard) => {
    setSelectedDashboard(dashboard);
    setWidgets(dashboard.widgets || []);
    setEditMode(false);
  }, []);

  // Add widget
  const addWidget = useCallback((widgetType) => {
    const widget = {
      id: Date.now(),
      type: widgetType,
      config: { ...widgetTypes[widgetType].defaultConfig },
      size: { w: 6, h: 4 }, // 6 columns wide, 4 rows tall
    };

    setWidgets([...widgets, widget]);
  }, [widgets, widgetTypes]);

  // Update widget
  const updateWidget = useCallback((id, updates) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  }, [widgets]);

  // Remove widget
  const removeWidget = useCallback((id) => {
    setWidgets(widgets.filter(w => w.id !== id));
  }, [widgets]);

  // Save dashboard
  const saveDashboard = useCallback(async () => {
    if (!selectedDashboard) return;

    setLoading(true);
    try {
      await axios.put(`/api/v1/analytics/dashboards/${selectedDashboard.id}`, {
        name: selectedDashboard.name,
        layout: 'grid-12',
        widgets,
      });

      alert('Dashboard saved successfully');
      setEditMode(false);
      await loadDashboards();
    } catch (error) {
      alert(`Failed to save dashboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedDashboard, widgets, loadDashboards]);

  // Delete dashboard
  const deleteDashboard = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) return;

    try {
      await axios.delete(`/api/v1/analytics/dashboards/${id}`);
      setDashboards(dashboards.filter(d => d.id !== id));
      if (selectedDashboard?.id === id) {
        setSelectedDashboard(null);
        setWidgets([]);
      }
    } catch (error) {
      alert(`Failed to delete dashboard: ${error.message}`);
    }
  }, [dashboards, selectedDashboard]);

  // Share dashboard
  const shareDashboard = useCallback(async () => {
    if (!selectedDashboard) return;

    const email = prompt('Enter email to share with:');
    if (!email) return;

    try {
      await axios.post(`/api/v1/analytics/dashboards/${selectedDashboard.id}/share`, {
        email,
      });
      alert('Dashboard shared successfully');
    } catch (error) {
      alert(`Failed to share dashboard: ${error.message}`);
    }
  }, [selectedDashboard]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📊 Dashboard Builder</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          + New Dashboard
        </button>
      </div>

      {/* Create Dashboard Form */}
      {showCreateForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="Dashboard name..."
            value={newDashboardName}
            onChange={(e) => setNewDashboardName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={createDashboard}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dashboard List */}
      {!selectedDashboard ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Dashboards</h3>
          {dashboards.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No dashboards yet. Create your first one!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => selectDashboard(dashboard)}
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{dashboard.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {dashboard.widgets?.length || 0} widgets
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectDashboard(dashboard);
                        setEditMode(true);
                      }}
                      className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDashboard(dashboard.id);
                      }}
                      className="flex-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Dashboard Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedDashboard(null);
                  setEditMode(false);
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                ← Back
              </button>
              <h3 className="text-xl font-bold text-gray-900">{selectedDashboard.name}</h3>
            </div>

            {editMode ? (
              <div className="flex gap-2">
                <button
                  onClick={saveDashboard}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
                >
                  💾 Save
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={shareDashboard}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200"
                >
                  👥 Share
                </button>
              </div>
            )}
          </div>

          {/* Edit Mode */}
          {editMode && (
            <div className="space-y-4">
              {/* Widget Palette */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Available Widgets</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(widgetTypes).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => addWidget(key)}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center transition"
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs font-medium text-gray-700">{type.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Grid */}
          <div className={`space-y-4 ${editMode ? 'bg-gray-50 p-4 rounded-lg border-2 border-dashed border-blue-300' : ''}`}>
            {widgets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {editMode ? 'Add widgets from the palette above' : 'This dashboard has no widgets'}
              </p>
            ) : (
              <div className="grid grid-cols-12 gap-4">
                {widgets.map((widget) => (
                  <DashboardWidget
                    key={widget.id}
                    widget={widget}
                    widgetTypes={widgetTypes}
                    editMode={editMode}
                    isEditing={editingWidgetId === widget.id}
                    onUpdate={(updates) => updateWidget(widget.id, updates)}
                    onRemove={() => removeWidget(widget.id)}
                    onEdit={() => setEditingWidgetId(widget.id)}
                    onStopEdit={() => setEditingWidgetId(null)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Dashboard Widget Component
 */
function DashboardWidget({
  widget,
  widgetTypes,
  editMode,
  isEditing,
  onUpdate,
  onRemove,
  onEdit,
  onStopEdit,
}) {
  const type = widgetTypes[widget.type];

  return (
    <div
      className={`col-span-${widget.size.w} row-span-${widget.size.h} bg-white border rounded-lg p-4 transition ${
        editMode ? 'border-blue-300 cursor-move' : 'border-gray-200'
      } ${isEditing ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{type?.icon}</span>
          <h4 className="font-semibold text-gray-900">{widget.config.title}</h4>
        </div>

        {editMode && (
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit widget"
            >
              ⚙️
            </button>
            <button
              onClick={onRemove}
              className="p-1 hover:bg-red-100 rounded text-red-700"
              title="Remove widget"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Widget Config */}
      {isEditing && (
        <div className="bg-gray-50 -mx-4 -mb-4 p-4 rounded-b-lg space-y-3">
          <WidgetConfigForm
            config={widget.config}
            type={widget.type}
            onChange={(config) => {
              onUpdate({ config });
              onStopEdit();
            }}
          />
        </div>
      )}

      {/* Widget Content */}
      {!isEditing && (
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
          {widget.type === 'custom_text' ? (
            <p className="p-4 text-gray-700">{widget.config.content}</p>
          ) : (
            `${type?.name} Preview`
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Widget Configuration Form
 */
function WidgetConfigForm({ config, type, onChange }) {
  const [localConfig, setLocalConfig] = React.useState(config);

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Widget title"
        value={localConfig.title}
        onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
      />

      {type === 'custom_text' && (
        <textarea
          placeholder="Content"
          value={localConfig.content}
          onChange={(e) => setLocalConfig({ ...localConfig, content: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          rows="3"
        />
      )}

      {(type === 'summary_card' || type === 'trend_chart') && (
        <select
          value={localConfig.period || '7d'}
          onChange={(e) => setLocalConfig({ ...localConfig, period: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      )}

      <button
        onClick={() => onChange(localConfig)}
        className="w-full px-2 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
      >
        Done
      </button>
    </div>
  );
}
