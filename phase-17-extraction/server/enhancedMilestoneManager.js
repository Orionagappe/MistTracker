/**
 * Enhanced Milestone Manager & Validator (Phase 16.1)
 * Provides comprehensive milestone tracking across Phases 17-25+
 * 
 * Features:
 * - Domain-specific milestone validation
 * - Cross-domain emergence tracking
 * - Uncertainty propagation
 * - Proxy model integration
 * - Session-based research tracking
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ALL_PHASE_MILESTONES,
  getMilestonesForPhase,
  getMilestoneById
} from './phaseMilestones.js';

export class EnhancedMilestoneManager {
  constructor(dbConnection = null) {
    this.db = dbConnection;
    this.localMilestones = new Map();
  }

  /**
   * Create a new milestone with full validation
   * @param {Object} params - {phase, sessionId, type, description, metadata, stats}
   * @returns {Promise<Object>} - Created milestone object
   */
  async createMilestone(params) {
    const {
      phase,
      sessionId,
      type,
      description = '',
      metadata = {},
      stats = {},
      domain = null
    } = params;

    // Validate phase and milestone type
    const phaseMilestones = getMilestonesForPhase(phase);
    if (!phaseMilestones || Object.keys(phaseMilestones).length === 0) {
      throw new Error(`Invalid phase: ${phase}. Supported phases: 17-25+`);
    }

    // Find milestone definition
    let milestoneDefinition = null;
    for (const key in phaseMilestones) {
      if (phaseMilestones[key].name === type || phaseMilestones[key].id === type) {
        milestoneDefinition = phaseMilestones[key];
        break;
      }
    }

    if (!milestoneDefinition) {
      throw new Error(
        `Unknown milestone type '${type}' for phase ${phase}. ` +
        `Available: ${Object.keys(phaseMilestones).map(k => phaseMilestones[k].name).join(', ')}`
      );
    }

    // Validate metadata against milestone schema
    const validationErrors = this.validateMetadata(milestoneDefinition, metadata);
    if (validationErrors.length > 0) {
      throw new Error(`Metadata validation failed:\n${validationErrors.join('\n')}`);
    }

    // Create milestone record
    const milestoneId = `${phase}-${type}-${uuidv4()}`;
    const milestone = {
      milestone_id: milestoneId,
      session_id: sessionId,
      type_id: milestoneDefinition.id,
      phase: phase,
      domain: milestoneDefinition.domain,
      status: 'draft',
      description: description,
      metadata: metadata,
      stats_snapshot: stats,
      validation_result: null,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Store locally
    this.localMilestones.set(milestoneId, milestone);

    // Store in database if connected
    if (this.db) {
      await this.db.query(
        `INSERT INTO milestones 
        (milestone_id, session_id, type_id, phase, domain_id, status, description, metadata, stats_snapshot, timestamp)
        VALUES (?, ?, ?, ?, (SELECT id FROM research_domains WHERE domain_name = ?), ?, ?, ?, ?, NOW())`,
        [
          milestoneId,
          sessionId,
          milestoneDefinition.id,
          phase,
          milestoneDefinition.domain,
          'draft',
          description,
          JSON.stringify(metadata),
          JSON.stringify(stats)
        ]
      );
    }

    return milestone;
  }

  /**
   * Validate metadata against milestone schema
   * @param {Object} definition - Milestone type definition
   * @param {Object} metadata - Metadata to validate
   * @returns {Array} - Array of error messages (empty if valid)
   */
  validateMetadata(definition, metadata = {}) {
    const errors = [];
    const rules = definition.validation_rules || {};
    const requiredFields = rules.required_fields || [];

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in metadata)) {
        errors.push(`Missing required field: '${field}'`);
      }
    }

    // Check field-specific constraints
    if (rules.atom_types && metadata.atom_type) {
      if (!rules.atom_types.includes(metadata.atom_type)) {
        errors.push(
          `Invalid atom type '${metadata.atom_type}'. ` +
          `Must be one of: ${rules.atom_types.join(', ')}`
        );
      }
    }

    if (rules.convergence_threshold !== undefined && metadata.convergence !== undefined) {
      if (metadata.convergence < rules.convergence_threshold) {
        errors.push(
          `Convergence ${metadata.convergence} below threshold ${rules.convergence_threshold}`
        );
      }
    }

    if (rules.accuracy_min !== undefined && metadata.accuracy !== undefined) {
      if (metadata.accuracy < rules.accuracy_min) {
        errors.push(
          `Accuracy ${metadata.accuracy} below minimum ${rules.accuracy_min}`
        );
      }
    }

    if (rules.speedup_min !== undefined && metadata.speedup !== undefined) {
      if (metadata.speedup < rules.speedup_min) {
        errors.push(
          `Speedup ${metadata.speedup}x below minimum ${rules.speedup_min}x`
        );
      }
    }

    if (rules.residual_error_max !== undefined && metadata.residual_error !== undefined) {
      if (metadata.residual_error > rules.residual_error_max) {
        errors.push(
          `Residual error ${metadata.residual_error} exceeds maximum ${rules.residual_error_max}`
        );
      }
    }

    if (rules.error_percent_max !== undefined && metadata.error_percent !== undefined) {
      if (metadata.error_percent > rules.error_percent_max) {
        errors.push(
          `Error percentage ${metadata.error_percent}% exceeds maximum ${rules.error_percent_max}%`
        );
      }
    }

    if (rules.agreement_error_max !== undefined && metadata.agreement_error !== undefined) {
      if (metadata.agreement_error > rules.agreement_error_max) {
        errors.push(
          `Agreement error ${metadata.agreement_error}% exceeds maximum ${rules.agreement_error_max}%`
        );
      }
    }

    return errors;
  }

  /**
   * Complete a milestone and update status
   * @param {String} milestoneId - Milestone ID
   * @param {String} status - New status (completed, validated, failed)
   * @param {Object} validationResult - Validation details
   * @returns {Promise<Object>} - Updated milestone
   */
  async completeMilestone(milestoneId, status = 'completed', validationResult = null) {
    const milestone = this.localMilestones.get(milestoneId);
    if (!milestone) {
      throw new Error(`Milestone not found: ${milestoneId}`);
    }

    milestone.status = status;
    milestone.validation_result = validationResult;
    milestone.updated_at = new Date().toISOString();

    // Update in database
    if (this.db) {
      await this.db.query(
        `UPDATE milestones SET status = ?, validation_result = ?, updated_at = NOW() WHERE milestone_id = ?`,
        [status, JSON.stringify(validationResult), milestoneId]
      );
    }

    return milestone;
  }

  /**
   * Get milestone by ID
   * @param {String} milestoneId - Milestone ID
   * @returns {Object} - Milestone object
   */
  getMilestone(milestoneId) {
    return this.localMilestones.get(milestoneId) || null;
  }

  /**
   * Get all milestones for a session
   * @param {String} sessionId - Session ID
   * @returns {Array} - Array of milestone objects
   */
  getSessionMilestones(sessionId) {
    const milestones = [];
    for (const [id, milestone] of this.localMilestones) {
      if (milestone.session_id === sessionId) {
        milestones.push(milestone);
      }
    }
    return milestones;
  }

  /**
   * Get all completed milestones for a session
   * @param {String} sessionId - Session ID
   * @returns {Array} - Array of completed milestone objects
   */
  getCompletedMilestones(sessionId) {
    return this.getSessionMilestones(sessionId).filter(m => m.status === 'completed' || m.status === 'validated');
  }

  /**
   * Calculate uncertainty propagation from source phase to target phase
   * @param {Number} sourcePhase - Source phase
   * @param {Number} targetPhase - Target phase
   * @param {Number} sourceUncertainty - Uncertainty in source (0-1)
   * @returns {Number} - Propagated uncertainty
   */
  propagateUncertainty(sourcePhase, targetPhase, sourceUncertainty) {
    if (sourcePhase >= targetPhase) {
      return sourceUncertainty;
    }

    // Default uncertainty factor per phase: 1.5x growth
    const phaseDifference = targetPhase - sourcePhase;
    const uncertaintyGrowthFactor = Math.pow(1.5, phaseDifference);
    const propagatedUncertainty = Math.min(sourceUncertainty * uncertaintyGrowthFactor, 1.0);

    return propagatedUncertainty;
  }

  /**
   * Create emergence chain between domains
   * @param {Number} fromPhase - Source phase
   * @param {Number} toPhase - Target phase
   * @param {String} emergenceRule - Description of emergence logic
   * @param {Number} uncertaintyFactor - How uncertainty propagates (0-1 per level)
   * @returns {Promise<Object>} - Emergence chain object
   */
  async createEmergenceChain(fromPhase, toPhase, emergenceRule, uncertaintyFactor = 1.5) {
    const chainId = `emergence-${fromPhase}-to-${toPhase}-${uuidv4()}`;
    const chain = {
      id: chainId,
      from_phase: fromPhase,
      to_phase: toPhase,
      emergence_rule: emergenceRule,
      uncertainty_factor: uncertaintyFactor,
      validation_status: 'pending',
      created_at: new Date().toISOString()
    };

    if (this.db) {
      const fromDomain = this.getDomainForPhase(fromPhase);
      const toDomain = this.getDomainForPhase(toPhase);

      await this.db.query(
        `INSERT INTO emergence_chains 
        (from_domain_id, to_domain_id, emergence_rule, uncertainty_factor, validation_status)
        VALUES (
          (SELECT id FROM research_domains WHERE domain_name = ?),
          (SELECT id FROM research_domains WHERE domain_name = ?),
          ?,
          ?,
          'pending'
        )`,
        [fromDomain, toDomain, emergenceRule, uncertaintyFactor]
      );
    }

    return chain;
  }

  /**
   * Get domain name for phase
   * @param {Number} phase - Phase number
   * @returns {String} - Domain name
   */
  getDomainForPhase(phase) {
    const phaseMap = {
      17: 'Atomic',
      18: 'Subatomic',
      19: 'Chemistry',
      20: 'Chemistry',
      21: 'Materials',
      22: 'Materials',
      23: 'Astrophysics',
      24: 'Astrophysics',
      25: 'Cosmology'
    };
    return phaseMap[phase] || 'Unknown';
  }

  /**
   * Generate phase progress report
   * @param {String} sessionId - Session ID (optional)
   * @returns {Object} - Progress report
   */
  generateProgressReport(sessionId = null) {
    const milestones = sessionId
      ? this.getSessionMilestones(sessionId)
      : Array.from(this.localMilestones.values());

    const report = {
      total_milestones: milestones.length,
      completed: milestones.filter(m => m.status === 'completed').length,
      validated: milestones.filter(m => m.status === 'validated').length,
      failed: milestones.filter(m => m.status === 'failed').length,
      draft: milestones.filter(m => m.status === 'draft').length,
      by_phase: {},
      by_domain: {},
      completion_percentage: 0
    };

    // Group by phase and domain
    for (const milestone of milestones) {
      const phase = milestone.phase;
      const domain = milestone.domain;

      if (!report.by_phase[phase]) {
        report.by_phase[phase] = { total: 0, completed: 0, validated: 0 };
      }
      if (!report.by_domain[domain]) {
        report.by_domain[domain] = { total: 0, completed: 0, validated: 0 };
      }

      report.by_phase[phase].total++;
      report.by_domain[domain].total++;

      if (milestone.status === 'completed' || milestone.status === 'validated') {
        report.by_phase[phase].completed++;
        report.by_domain[domain].completed++;
        if (milestone.status === 'validated') {
          report.by_phase[phase].validated++;
          report.by_domain[domain].validated++;
        }
      }
    }

    // Calculate completion percentage
    if (report.total_milestones > 0) {
      report.completion_percentage =
        ((report.completed + report.validated) / report.total_milestones) * 100;
    }

    return report;
  }

  /**
   * Export milestones to JSON
   * @param {String} sessionId - Session ID (optional)
   * @returns {Object} - Serialized milestones
   */
  exportToJSON(sessionId = null) {
    const milestones = sessionId
      ? this.getSessionMilestones(sessionId)
      : Array.from(this.localMilestones.values());

    return {
      export_date: new Date().toISOString(),
      total_milestones: milestones.length,
      milestones: milestones
    };
  }

  /**
   * Import milestones from JSON
   * @param {Object} data - Serialized milestone data
   * @returns {Number} - Number of imported milestones
   */
  async importFromJSON(data) {
    if (!data.milestones || !Array.isArray(data.milestones)) {
      throw new Error('Invalid import data: missing milestones array');
    }

    let importedCount = 0;
    for (const milestone of data.milestones) {
      this.localMilestones.set(milestone.milestone_id, milestone);
      importedCount++;
    }

    return importedCount;
  }
}

/**
 * Helper: Create a research session
 */
export async function createResearchSession(dbConnection, params) {
  const {
    phase,
    domain,
    userId = null,
    targetObject,
    theoryModel
  } = params;

  const sessionId = `session-${phase}-${uuidv4()}`;
  const session = {
    session_id: sessionId,
    phase: phase,
    domain: domain,
    user_id: userId,
    target_object: targetObject,
    theory_model: theoryModel,
    status: 'active',
    started_at: new Date().toISOString()
  };

  if (dbConnection) {
    await dbConnection.query(
      `INSERT INTO research_sessions (session_id, phase, domain_id, user_id, target_object, theory_model, status, started_at)
       VALUES (?, ?, (SELECT id FROM research_domains WHERE domain_name = ?), ?, ?, ?, 'active', NOW())`,
      [sessionId, phase, domain, userId, targetObject, theoryModel]
    );
  }

  return session;
}

/**
 * Helper: Get phase information
 */
export function getPhaseInfo(phase) {
  const phaseInfo = {
    17: {
      domain: 'Atomic',
      scale: 'Electron scale',
      milestone_count: 12,
      description: 'Validating individual atoms from H to Ar'
    },
    18: {
      domain: 'Subatomic',
      scale: 'Quark scale',
      milestone_count: 8,
      description: 'Validating quark models for nucleons'
    },
    19: {
      domain: 'Chemistry',
      scale: 'Molecular scale',
      milestone_count: 5,
      description: 'Validating chemical bonding from atomic physics'
    },
    20: {
      domain: 'Chemistry',
      scale: 'Molecular scale',
      milestone_count: 5,
      description: 'Validating complex reactions and spectra'
    },
    21: {
      domain: 'Materials',
      scale: 'Crystal scale',
      milestone_count: 4,
      description: 'Validating crystal structure and properties'
    },
    22: {
      domain: 'Materials',
      scale: 'Crystal scale',
      milestone_count: 4,
      description: 'Validating optical and defect properties'
    },
    23: {
      domain: 'Astrophysics',
      scale: 'Stellar scale',
      milestone_count: 5,
      description: 'Validating stellar fusion and evolution'
    },
    24: {
      domain: 'Astrophysics',
      scale: 'Stellar scale',
      milestone_count: 3,
      description: 'Validating stellar structure and oscillations'
    },
    25: {
      domain: 'Cosmology',
      scale: 'Universe scale',
      milestone_count: 8,
      description: 'Validating Big Bang nucleosynthesis and structure formation'
    }
  };

  return phaseInfo[phase] || null;
}

export default {
  EnhancedMilestoneManager,
  createResearchSession,
  getPhaseInfo
};
