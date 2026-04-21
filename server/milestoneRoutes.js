/**
 * Milestone API Endpoints (Phase 16.1)
 * Express router for comprehensive milestone tracking across Phases 17-25+
 */

import express from 'express';
import {
  EnhancedMilestoneManager,
  createResearchSession,
  getPhaseInfo
} from './enhancedMilestoneManager.js';
import { getMilestonesForPhase } from './phaseMilestones.js';

const router = express.Router();

// Initialize milestone manager (typically injected from server.js)
let milestoneManager = null;

/**
 * Middleware: Initialize milestone manager with database connection
 */
export function initMilestoneManager(dbConnection) {
  milestoneManager = new EnhancedMilestoneManager(dbConnection);
  return milestoneManager;
}

// ============================================================================
// RESEARCH SESSION ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/research-sessions
 * Create new research session
 */
router.post('/research-sessions', async (req, res) => {
  try {
    const { phase, targetObject, theoryModel, userId } = req.body;

    if (!phase || !targetObject || !theoryModel) {
      return res.status(400).json({
        error: 'Missing required fields: phase, targetObject, theoryModel'
      });
    }

    const domain = getPhaseInfo(phase)?.domain;
    if (!domain) {
      return res.status(400).json({
        error: `Invalid phase: ${phase}. Supported: 17-25`
      });
    }

    const session = await createResearchSession(null, {
      phase,
      domain,
      userId,
      targetObject,
      theoryModel
    });

    res.status(201).json({
      success: true,
      session: session
    });
  } catch (error) {
    res.status(500).json({
      error: `Failed to create research session: ${error.message}`
    });
  }
});

/**
 * GET /api/v1/phases
 * Get information about all phases
 */
router.get('/phases', (req, res) => {
  const phases = {};
  for (let p = 17; p <= 25; p++) {
    const info = getPhaseInfo(p);
    if (info) {
      phases[p] = info;
    }
  }

  res.json({
    total_phases: Object.keys(phases).length,
    phases: phases
  });
});

/**
 * GET /api/v1/phases/:phase
 * Get information about a specific phase
 */
router.get('/phases/:phase', (req, res) => {
  const phase = parseInt(req.params.phase);
  const info = getPhaseInfo(phase);

  if (!info) {
    return res.status(404).json({
      error: `Phase ${phase} not found. Supported: 17-25`
    });
  }

  // Get milestone types
  const milestoneDefs = getMilestonesForPhase(phase);
  const milestoneTypes = Object.keys(milestoneDefs).map(key => ({
    name: milestoneDefs[key].name,
    id: milestoneDefs[key].id,
    phase_category: milestoneDefs[key].phase_category,
    description: milestoneDefs[key].description
  }));

  res.json({
    phase: phase,
    ...info,
    milestone_types: milestoneTypes
  });
});

// ============================================================================
// MILESTONE ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/milestones
 * Create new milestone
 */
router.post('/milestones', async (req, res) => {
  try {
    if (!milestoneManager) {
      return res.status(500).json({
        error: 'Milestone manager not initialized'
      });
    }

    const { phase, sessionId, type, description, metadata, stats } = req.body;

    if (!phase || !sessionId || !type) {
      return res.status(400).json({
        error: 'Missing required fields: phase, sessionId, type'
      });
    }

    const milestone = await milestoneManager.createMilestone({
      phase,
      sessionId,
      type,
      description,
      metadata,
      stats
    });

    res.status(201).json({
      success: true,
      milestone: milestone
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * GET /api/v1/milestones/:milestoneId
 * Get specific milestone
 */
router.get('/milestones/:milestoneId', (req, res) => {
  try {
    if (!milestoneManager) {
      return res.status(500).json({
        error: 'Milestone manager not initialized'
      });
    }

    const milestone = milestoneManager.getMilestone(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({
        error: `Milestone not found: ${req.params.milestoneId}`
      });
    }

    res.json({
      success: true,
      milestone: milestone
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/v1/milestones/session/:sessionId
 * Get all milestones for a session
 */
router.get('/sessions/:sessionId/milestones', (req, res) => {
  try {
    if (!milestoneManager) {
      return res.status(500).json({
        error: 'Milestone manager not initialized'
      });
    }

    const milestones = milestoneManager.getSessionMilestones(req.params.sessionId);
    const completed = milestones.filter(m => m.status === 'completed' || m.status === 'validated').length;

    res.json({
      session_id: req.params.sessionId,
      total_milestones: milestones.length,
      completed_milestones: completed,
      milestones: milestones
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/milestones/:milestoneId/complete
 * Complete a milestone
 */
router.put('/milestones/:milestoneId/complete', async (req, res) => {
  try {
    if (!milestoneManager) {
      return res.status(500).json({
        error: 'Milestone manager not initialized'
      });
    }

    const { status = 'completed', validationResult } = req.body;

    if (!['completed', 'validated', 'failed'].includes(status)) {
      return res.status(400).json({
        error: `Invalid status: ${status}. Must be: completed, validated, or failed`
      });
    }

    const milestone = await milestoneManager.completeMilestone(
      req.params.milestoneId,
      status,
      validationResult
    );

    res.json({
      success: true,
      milestone: milestone
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// ============================================================================
// VALIDATION ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/milestones/:milestoneId/validate
 * Validate milestone data
 */
router.post('/milestones/:milestoneId/validate', async (req, res) => {
  try {
    if (!milestoneManager) {
      return res.status(500).json({
        error: 'Milestone manager not initialized'
      });
    }

    const milestone = milestoneManager.getMilestone(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({
        error: `Milestone not found: ${req.params.milestoneId}`
      });
    }

    // For now, validation is handled during creation
    // This endpoint can trigger re-validation or full validation suite
    const validationResult = {
      milestone_id: milestone.milestone_id,
      status: 'valid',
      passed_checks: [],
      failed_checks: [],
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      validation: validationResult
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /api/v1/phases/:phase/milestone-types
 * Get available milestone types for a phase
 */
router.get('/phases/:phase/milestone-types', (req, res) => {
  try {
    const phase = parseInt(req.params.phase);
    const milestoneDefs = getMilestonesForPhase(phase);

    if (!milestoneDefs || Object.keys(milestoneDefs).length === 0) {
      return res.status(404).json({
        error: `No milestone types found for phase ${phase}`
      });
    }

    const milestoneTypes = [];
    for (const key in milestoneDefs) {
      const def = milestoneDefs[key];
      milestoneTypes.push({
        name: def.name,
        id: def.id,
        phase_category: def.phase_category,
        description: def.description,
        required_metadata_fields: def.validation_rules?.required_fields || [],
        constraints: def.validation_rules || {}
      });
    }

    res.json({
      phase: phase,
      milestone_count: milestoneTypes.length,
      milestone_types: milestoneTypes
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ============================================================================
// PROGRESS & REPORTING ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/progress
 * Get overall progress across all sessions
 */
router.get('/progress', (req, res) => {
  try {
    if (!milestoneManager) {
      return res.status(500).json({
        error: 'Milestone manager not initialized'
      });
    }

    const report = milestoneManager.generateProgressReport();

    res.json({
      success: true,
      report: report
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/v1/sessions/:sessionId/progress
 * Get progress for specific session
 */
router.get('/sessions/:sessionId/progress', (req, res) => {
  try {
    if (!milestoneManager) {
      return res.status(500).json({
        error: 'Milestone manager not initialized'
      });
    }

    const report = milestoneManager.generateProgressReport(req.params.sessionId);

    res.json({
      success: true,
      session_id: req.params.sessionId,
      report: report
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/v1/sessions/:sessionId/export
 * Export session milestones as JSON
 */
router.get('/sessions/:sessionId/export', (req, res) => {
  try {
    if (!milestoneManager) {
      return res.status(500).json({
        error: 'Milestone manager not initialized'
      });
    }

    const data = milestoneManager.exportToJSON(req.params.sessionId);

    res.json({
      success: true,
      export: data
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ============================================================================
// EMERGENCE & UNCERTAINTY ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/emergence-chains
 * Create emergence chain between phases
 */
router.post('/emergence-chains', async (req, res) => {
  try {
    if (!milestoneManager) {
      return res.status(500).json({
        error: 'Milestone manager not initialized'
      });
    }

    const { fromPhase, toPhase, emergenceRule, uncertaintyFactor = 1.5 } = req.body;

    if (!fromPhase || !toPhase || !emergenceRule) {
      return res.status(400).json({
        error: 'Missing required fields: fromPhase, toPhase, emergenceRule'
      });
    }

    const chain = await milestoneManager.createEmergenceChain(
      fromPhase,
      toPhase,
      emergenceRule,
      uncertaintyFactor
    );

    res.status(201).json({
      success: true,
      chain: chain
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /api/v1/uncertainty-propagation
 * Calculate uncertainty propagation
 */
router.post('/uncertainty-propagation', (req, res) => {
  try {
    if (!milestoneManager) {
      return res.status(500).json({
        error: 'Milestone manager not initialized'
      });
    }

    const { sourcePhase, targetPhase, sourceUncertainty } = req.body;

    if (sourcePhase === undefined || targetPhase === undefined || sourceUncertainty === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: sourcePhase, targetPhase, sourceUncertainty'
      });
    }

    const propagatedUncertainty = milestoneManager.propagateUncertainty(
      sourcePhase,
      targetPhase,
      sourceUncertainty
    );

    res.json({
      success: true,
      source_phase: sourcePhase,
      target_phase: targetPhase,
      source_uncertainty: sourceUncertainty,
      propagated_uncertainty: propagatedUncertainty,
      growth_factor: (targetPhase - sourcePhase > 0)
        ? propagatedUncertainty / sourceUncertainty
        : 1.0
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/v1/milestones/health
 * Health check for milestone system
 */
router.get('/health', (req, res) => {
  const status = {
    service: 'Milestone System (Phase 16.1)',
    status: milestoneManager ? 'operational' : 'not_initialized',
    phases_supported: [17, 18, 19, 20, 21, 22, 23, 24, 25],
    domains_supported: ['Atomic', 'Subatomic', 'Chemistry', 'Materials', 'Astrophysics', 'Cosmology'],
    timestamp: new Date().toISOString()
  };

  res.json(status);
});

export default {
  router,
  initMilestoneManager
};
