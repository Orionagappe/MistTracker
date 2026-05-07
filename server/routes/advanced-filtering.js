/**
 * Advanced Filtering Endpoints
 * Phase 17.2.4: Query Capabilities
 * 
 * Extends cluster-coordinator.js with advanced filtering endpoints:
 * - Complex queries on milestones
 * - Session filtering with multiple criteria
 * - Performance metric queries
 * - Statistical aggregations
 */

import { Router } from 'express';
import { getDatabase } from '../database/connection.js';
import { requirePermission, canAccessResource } from '../middleware/auth.js';

const router = Router();

// ============================================================================
// MILESTONE FILTERING ENDPOINTS
// ============================================================================

/**
 * GET /api/cluster/milestones/advanced
 * 
 * Advanced filtering for milestones with complex query support
 * 
 * Query Parameters:
 * - session_id: Filter by session UUID
 * - atoms: Comma-separated atom list (H,He,Li)
 * - epoch_min, epoch_max: Epoch range
 * - loss_min, loss_max: Loss range
 * - accuracy_min, accuracy_max: Accuracy range
 * - date_from, date_to: Timestamp range (ISO 8601)
 * - limit: Max results (default 1000, max 10000)
 * - offset: Pagination offset (default 0)
 * - sort_by: Field to sort by (epoch, loss, accuracy, timestamp)
 * - sort_order: 'asc' or 'desc' (default desc)
 * 
 * Example:
 * GET /api/cluster/milestones/advanced?session_id=abc123&atoms=H,He&accuracy_min=0.8&limit=500
 */
router.get('/milestones/advanced', requirePermission('read:milestones'), async (req, res) => {
  try {
    const db = getDatabase();

    // Parse query parameters
    const {
      session_id,
      atoms: atomsParam,
      epoch_min,
      epoch_max,
      loss_min,
      loss_max,
      accuracy_min,
      accuracy_max,
      date_from,
      date_to,
      limit = 1000,
      offset = 0,
      sort_by = 'timestamp',
      sort_order = 'desc',
    } = req.query;

    // Validate and constrain limit
    const parsedLimit = Math.min(parseInt(limit) || 1000, 10000);
    const parsedOffset = parseInt(offset) || 0;

    // Build filter object
    const queryOptions = {
      session_id,
      epoch_min: epoch_min ? parseInt(epoch_min) : undefined,
      epoch_max: epoch_max ? parseInt(epoch_max) : undefined,
      loss_min: loss_min ? parseFloat(loss_min) : undefined,
      loss_max: loss_max ? parseFloat(loss_max) : undefined,
      accuracy_min: accuracy_min ? parseFloat(accuracy_min) : undefined,
      accuracy_max: accuracy_max ? parseFloat(accuracy_max) : undefined,
      date_from,
      date_to,
      atoms: atomsParam ? atomsParam.split(',').map(a => a.trim()) : undefined,
      limit: parsedLimit,
      skip: parsedOffset,
      sort_by,
      sort_order,
    };

    // Get milestones
    let milestones = await db.getMilestones(queryOptions);

    // Post-processing filters if needed
    if (queryOptions.loss_min !== undefined) {
      milestones = milestones.filter(m => m.loss >= queryOptions.loss_min);
    }
    if (queryOptions.loss_max !== undefined) {
      milestones = milestones.filter(m => m.loss <= queryOptions.loss_max);
    }
    if (queryOptions.accuracy_min !== undefined) {
      milestones = milestones.filter(m => m.accuracy >= queryOptions.accuracy_min);
    }
    if (queryOptions.accuracy_max !== undefined) {
      milestones = milestones.filter(m => m.accuracy <= queryOptions.accuracy_max);
    }
    if (queryOptions.atoms) {
      milestones = milestones.filter(m => queryOptions.atoms.includes(m.atom));
    }

    // Calculate statistics
    const stats = {
      total_count: milestones.length,
      avg_loss: milestones.length > 0 ? milestones.reduce((sum, m) => sum + m.loss, 0) / milestones.length : 0,
      avg_accuracy: milestones.length > 0 ? milestones.reduce((sum, m) => sum + m.accuracy, 0) / milestones.length : 0,
      min_loss: milestones.length > 0 ? Math.min(...milestones.map(m => m.loss)) : 0,
      max_accuracy: milestones.length > 0 ? Math.max(...milestones.map(m => m.accuracy)) : 0,
      epochs_covered: milestones.length > 0 ? 
        Math.max(...milestones.map(m => m.epoch)) - Math.min(...milestones.map(m => m.epoch)) + 1 : 0,
    };

    res.json({
      milestones,
      stats,
      query: queryOptions,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in advanced milestone filtering:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// SESSION FILTERING ENDPOINTS
// ============================================================================

/**
 * GET /api/cluster/sessions/advanced
 * 
 * Advanced filtering for training sessions
 * 
 * Query Parameters:
 * - status: Filter by status (active, completed, failed)
 * - atoms: Comma-separated atoms in session
 * - date_from, date_to: Session start time range
 * - accuracy_min, accuracy_max: Final accuracy range
 * - convergence_only: Show only converged sessions (true/false)
 * - user_id: Filter by user (admin only)
 * - limit, offset: Pagination
 * - sort_by: Field to sort (started_at, final_accuracy, duration_ms)
 * 
 * Example:
 * GET /api/cluster/sessions/advanced?status=completed&accuracy_min=0.85&convergence_only=true
 */
router.get('/sessions/advanced', requirePermission('read:sessions'), async (req, res) => {
  try {
    const db = getDatabase();

    const {
      status,
      atoms: atomsParam,
      date_from,
      date_to,
      accuracy_min,
      accuracy_max,
      convergence_only,
      user_id,
      limit = 100,
      offset = 0,
      sort_by = 'started_at',
      sort_order = 'desc',
    } = req.query;

    // Non-admin users can only query their own sessions
    const queryUserId = req.user.role === 'admin' ? user_id : req.user.id;

    const queryOptions = {
      user_id: queryUserId,
      status,
      date_from,
      date_to,
      limit: Math.min(parseInt(limit) || 100, 1000),
      skip: parseInt(offset) || 0,
    };

    let sessions = await db.getSessions(queryOptions);

    // Post-processing filters
    if (atomsParam) {
      const atoms = atomsParam.split(',').map(a => a.trim());
      sessions = sessions.filter(s =>
        atoms.every(a => Array.isArray(s.atoms) ? s.atoms.includes(a) : s.atoms.split(',').includes(a))
      );
    }

    if (accuracy_min !== undefined) {
      const minAcc = parseFloat(accuracy_min);
      sessions = sessions.filter(s => s.metrics?.final_accuracy >= minAcc);
    }

    if (accuracy_max !== undefined) {
      const maxAcc = parseFloat(accuracy_max);
      sessions = sessions.filter(s => s.metrics?.final_accuracy <= maxAcc);
    }

    if (convergence_only === 'true') {
      sessions = sessions.filter(s => s.metrics?.convergence_epoch !== undefined && s.metrics.convergence_epoch > 0);
    }

    // Prepare response with enriched data
    const enrichedSessions = sessions.map(s => ({
      ...s,
      display: {
        duration_formatted: formatDuration(s.duration_ms),
        status_badge: getBadgeForStatus(s.status),
      },
    }));

    res.json({
      sessions: enrichedSessions,
      count: enrichedSessions.length,
      query: queryOptions,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in advanced session filtering:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// PERFORMANCE AGGREGATION ENDPOINTS
// ============================================================================

/**
 * GET /api/cluster/performance/aggregated
 * 
 * Aggregate performance metrics across sessions
 * 
 * Query Parameters:
 * - group_by: Grouping dimension (atom, session, daily, weekly)
 * - date_from, date_to: Date range
 * - metric: Metric to aggregate (accuracy, loss)
 * - aggregation: Function (avg, min, max, stddev)
 */
router.get('/performance/aggregated', requirePermission('read:metrics'), async (req, res) => {
  try {
    const db = getDatabase();

    const {
      group_by = 'atom',
      date_from,
      date_to,
      metric = 'accuracy',
      aggregation = 'avg',
    } = req.query;

    // Get milestones
    const queryOptions = {
      user_id: req.user.id,
      date_from,
      date_to,
      limit: 100000,
    };

    const milestones = await db.getMilestones(queryOptions);

    // Group and aggregate
    const grouped = {};

    for (const m of milestones) {
      const groupKey = getGroupKey(m, group_by);

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          values: [],
        };
      }

      const value = metric === 'accuracy' ? m.accuracy : m.loss;
      grouped[groupKey].count++;
      grouped[groupKey].sum += value;
      grouped[groupKey].min = Math.min(grouped[groupKey].min, value);
      grouped[groupKey].max = Math.max(grouped[groupKey].max, value);
      grouped[groupKey].values.push(value);
    }

    // Calculate aggregated values
    const aggregated = {};
    for (const [key, data] of Object.entries(grouped)) {
      aggregated[key] = calculateAggregation(data, aggregation);
    }

    res.json({
      aggregated,
      group_by,
      metric,
      aggregation,
      total_records: milestones.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in performance aggregation:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// CONVERGENCE ANALYSIS ENDPOINT
// ============================================================================

/**
 * GET /api/cluster/convergence/analysis
 * 
 * Advanced convergence analysis with detection thresholds
 * 
 * Query Parameters:
 * - session_id: Filter by session
 * - improvement_threshold: Improvement % to detect convergence (default 1)
 * - window_size: Epochs to check for improvement (default 5)
 * - atoms: Comma-separated atoms to analyze
 */
router.get('/convergence/analysis', requirePermission('read:milestones'), async (req, res) => {
  try {
    const db = getDatabase();

    const {
      session_id,
      improvement_threshold = 1,
      window_size = 5,
      atoms: atomsParam,
    } = req.query;

    const queryOptions = {
      session_id,
      limit: 100000,
    };

    let milestones = await db.getMilestones(queryOptions);

    // Filter by atoms if specified
    if (atomsParam) {
      const atoms = atomsParam.split(',').map(a => a.trim());
      milestones = milestones.filter(m => atoms.includes(m.atom));
    }

    // Group by atom
    const byAtom = {};
    for (const m of milestones) {
      if (!byAtom[m.atom]) {
        byAtom[m.atom] = [];
      }
      byAtom[m.atom].push(m);
    }

    // Detect convergence for each atom
    const convergenceAnalysis = {};
    for (const [atom, atomMilestones] of Object.entries(byAtom)) {
      const sorted = atomMilestones.sort((a, b) => a.epoch - b.epoch);
      convergenceAnalysis[atom] = analyzeConvergence(sorted, improvement_threshold, window_size);
    }

    res.json({
      convergence: convergenceAnalysis,
      parameters: {
        improvement_threshold,
        window_size,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in convergence analysis:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getGroupKey(milestone, groupBy) {
  switch (groupBy) {
    case 'atom':
      return milestone.atom;
    case 'session':
      return milestone.session_id;
    case 'daily':
      const date = new Date(milestone.timestamp);
      return date.toISOString().split('T')[0];
    case 'weekly':
      const d = new Date(milestone.timestamp);
      const weekStart = new Date(d.setDate(d.getDate() - d.getDay()));
      return weekStart.toISOString().split('T')[0];
    default:
      return milestone.atom;
  }
}

function calculateAggregation(data, aggregation) {
  switch (aggregation) {
    case 'avg':
      return data.sum / data.count;
    case 'min':
      return data.min;
    case 'max':
      return data.max;
    case 'stddev':
      const mean = data.sum / data.count;
      const variance = data.values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / data.count;
      return Math.sqrt(variance);
    default:
      return data.sum / data.count;
  }
}

function formatDuration(ms) {
  if (!ms) return 'N/A';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function getBadgeForStatus(status) {
  const badges = {
    active: { color: '#4ecdc4', label: 'Training' },
    completed: { color: '#95e1d3', label: 'Completed' },
    failed: { color: '#ff6b6b', label: 'Failed' },
    stopped: { color: '#ffe66d', label: 'Stopped' },
    pending: { color: '#888', label: 'Pending' },
  };
  return badges[status] || { color: '#888', label: status };
}

function analyzeConvergence(milestones, threshold, windowSize) {
  if (milestones.length < windowSize) {
    return {
      converged: false,
      reason: 'Insufficient data',
      total_epochs: milestones.length,
    };
  }

  const convergenceEpoch = null;
  let converged = false;

  for (let i = windowSize; i < milestones.length; i++) {
    const window = milestones.slice(i - windowSize, i);
    const firstLoss = window[0].loss;
    const lastLoss = window[windowSize - 1].loss;
    const improvement = ((firstLoss - lastLoss) / firstLoss) * 100;

    if (improvement < threshold) {
      converged = true;
      convergenceEpoch = milestones[i].epoch;
      break;
    }
  }

  return {
    converged,
    convergence_epoch: convergenceEpoch,
    total_epochs: milestones.length,
    best_accuracy: Math.max(...milestones.map(m => m.accuracy)),
    final_accuracy: milestones[milestones.length - 1].accuracy,
    min_loss: Math.min(...milestones.map(m => m.loss)),
    final_loss: milestones[milestones.length - 1].loss,
  };
}

export default router;
