/**
 * Alerts Panel Component
 * Phase 17.2.7: Real-time Analytics UI Components
 * 
 * Displays active alerts and anomalies
 */

import React, { useState, useCallback } from 'react';
import axios from 'axios';

export default function AlertsPanel({ alerts = [] }) {
  const [acknowledging, setAcknowledging] = useState(new Set());

  const handleAcknowledge = useCallback(async (webhookId) => {
    setAcknowledging((prev) => new Set(prev).add(webhookId));

    try {
      await axios.post(
        `/api/v1/analytics/webhooks/alerts/${webhookId}/acknowledge`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setAcknowledging((prev) => {
        const next = new Set(prev);
        next.delete(webhookId);
        return next;
      });
    }
  }, []);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🚨</span>
        <h2 className="text-xl font-bold text-red-700">
          {alerts.length} Active Alert{alerts.length !== 1 ? 's' : ''}
        </h2>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <AlertItem
            key={alert.webhook_id}
            alert={alert}
            onAcknowledge={() => handleAcknowledge(alert.webhook_id)}
            isAcknowledging={acknowledging.has(alert.webhook_id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual Alert Item
 */
function AlertItem({ alert, onAcknowledge, isAcknowledging }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'warning':
        return 'bg-orange-100 border-orange-300 text-orange-900';
      case 'info':
        return 'bg-blue-100 border-blue-300 text-blue-900';
      default:
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟠';
      case 'info':
        return '🔵';
      default:
        return '🟡';
    }
  };

  const anomalies = Array.isArray(alert.anomalies) 
    ? alert.anomalies 
    : [alert];

  return (
    <div className={`p-4 rounded-lg border-2 ${getSeverityColor(anomalies[0]?.severity || 'warning')}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getSeverityIcon(anomalies[0]?.severity || 'warning')}</span>
            <h4 className="font-semibold text-lg">
              {alert.webhook_id}
            </h4>
          </div>

          <div className="mt-2 space-y-1">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className="text-sm">
                <p className="font-medium">{anomaly.type?.replace(/_/g, ' ')}</p>
                <p className="opacity-90">{anomaly.message}</p>

                {anomaly.yesterday !== undefined && anomaly.today !== undefined && (
                  <p className="text-xs opacity-75 mt-1">
                    Changed from {anomaly.yesterday}% to {anomaly.today}%
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs opacity-75 mt-2">
            Detected: {new Date(alert.detected_at).toLocaleTimeString()}
          </p>
        </div>

        <button
          onClick={onAcknowledge}
          disabled={isAcknowledging}
          className="px-4 py-2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded font-medium text-sm transition disabled:opacity-50"
        >
          {isAcknowledging ? '✓ Acknowledging...' : 'Acknowledge'}
        </button>
      </div>
    </div>
  );
}
