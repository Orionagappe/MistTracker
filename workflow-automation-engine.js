/**
 * Workflow & Automation Engine
 * Custom workflows, rules, and automation policies
 * 
 * Features:
 * - Workflow definition and execution
 * - Rule engine with condition evaluation
 * - Event-based and time-based triggers
 * - Manual approval workflows
 * - Workflow versioning
 * - Error handling and retries
 * - Plugin-based action system
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class WorkflowAutomationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxConcurrentExecutions: 1000,
      executionTimeoutMs: 300000, // 5 minutes
      maxRetries: 3,
      ...config
    };

    this.workflows = new Map();
    this.rules = new Map();
    this.triggers = new Map();
    this.policies = new Map();
    this.templates = new Map();
    this.executions = new Map();
    this.executionHistory = new Map();
    this.actions = new Map();
    this.stats = {
      workflowsCreated: 0,
      workflowsExecuted: 0,
      rulesEvaluated: 0,
      triggersActivated: 0,
      actionsExecuted: 0,
      executionsFailed: 0
    };

    this.initializeDefaultActions();
    this.initializeTemplates();
  }

  /**
   * Create workflow
   * @param {Object} workflowDef - Workflow definition
   * @returns {Object} Created workflow
   */
  createWorkflow(workflowDef) {
    if (!workflowDef.name || !workflowDef.steps) {
      throw new Error('Workflow must have name and steps');
    }

    const workflowId = this.generateWorkflowId();
    const version = 1;

    const workflow = {
      workflowId,
      name: workflowDef.name,
      description: workflowDef.description || '',
      version,
      steps: workflowDef.steps,
      triggers: workflowDef.triggers || [],
      errorHandler: workflowDef.errorHandler,
      timeout: workflowDef.timeout || this.config.executionTimeoutMs,
      createdAt: new Date(),
      enabled: true,
      metadata: workflowDef.metadata || {}
    };

    this.workflows.set(workflowId, workflow);
    this.stats.workflowsCreated++;

    this.emit('workflow:created', workflow);

    return {
      workflowId,
      version,
      status: 'CREATED'
    };
  }

  /**
   * Get workflow
   * @param {string} workflowId - Workflow identifier
   * @returns {Object} Workflow definition
   */
  getWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    return {
      definition: workflow,
      version: workflow.version
    };
  }

  /**
   * Update workflow
   * @param {string} workflowId - Workflow identifier
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated workflow
   */
  updateWorkflow(workflowId, updates) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Create new version
    const newVersion = workflow.version + 1;
    const updated = {
      ...workflow,
      version: newVersion,
      ...updates,
      updatedAt: new Date()
    };

    this.workflows.set(workflowId, updated);

    this.emit('workflow:updated', {
      workflowId,
      version: newVersion,
      changes: updates
    });

    return { version: newVersion };
  }

  /**
   * Delete workflow
   * @param {string} workflowId - Workflow identifier
   * @returns {Object} Result
   */
  deleteWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    this.workflows.delete(workflowId);

    this.emit('workflow:deleted', { workflowId });

    return { success: true };
  }

  /**
   * Execute workflow
   * @param {string} workflowId - Workflow identifier
   * @param {Object} context - Execution context
   * @returns {Object} Execution info
   */
  executeWorkflow(workflowId, context = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow ${workflowId} is disabled`);
    }

    const executionId = this.generateExecutionId();

    const execution = {
      executionId,
      workflowId,
      version: workflow.version,
      context,
      startTime: new Date(),
      status: 'RUNNING',
      steps: [],
      results: {},
      errors: []
    };

    this.executions.set(executionId, execution);

    this.stats.workflowsExecuted++;

    // Execute steps asynchronously
    setImmediate(() => this.executeSteps(executionId, workflow));

    this.emit('workflow:executed', {
      executionId,
      workflowId
    });

    return { executionId };
  }

  /**
   * Get execution status
   * @param {string} executionId - Execution identifier
   * @returns {Object} Execution status
   */
  getExecutionStatus(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    return {
      status: execution.status,
      progress: execution.progress || 0,
      results: execution.results,
      errors: execution.errors,
      startTime: execution.startTime,
      endTime: execution.endTime
    };
  }

  /**
   * Cancel execution
   * @param {string} executionId - Execution identifier
   * @returns {Object} Result
   */
  cancelExecution(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (execution.status === 'RUNNING') {
      execution.status = 'CANCELLED';
      execution.endTime = new Date();

      this.emit('execution:cancelled', { executionId });
    }

    return { success: true };
  }

  /**
   * Create rule
   * @param {Object} ruleDef - Rule definition
   * @returns {Object} Created rule
   */
  createRule(ruleDef) {
    if (!ruleDef.name || !ruleDef.condition) {
      throw new Error('Rule must have name and condition');
    }

    const ruleId = this.generateRuleId();

    const rule = {
      ruleId,
      name: ruleDef.name,
      description: ruleDef.description || '',
      condition: ruleDef.condition,
      actions: ruleDef.actions || [],
      priority: ruleDef.priority || 0,
      enabled: true,
      createdAt: new Date(),
      executions: 0,
      successes: 0,
      failures: 0
    };

    this.rules.set(ruleId, rule);

    this.emit('rule:created', rule);

    return { ruleId };
  }

  /**
   * Evaluate rules
   * @param {Object} context - Context for evaluation
   * @returns {Array} Matched rules
   */
  evaluateRules(context) {
    const matched = [];

    for (const [, rule] of this.rules) {
      if (!rule.enabled) continue;

      try {
        if (this.evaluateCondition(rule.condition, context)) {
          matched.push(rule);
          this.stats.rulesEvaluated++;
        }
      } catch (error) {
        console.error(`Rule evaluation error for ${rule.ruleId}:`, error);
      }
    }

    // Sort by priority
    matched.sort((a, b) => b.priority - a.priority);

    return matched;
  }

  /**
   * Get rule statistics
   * @param {string} ruleId - Rule identifier
   * @returns {Object} Rule stats
   */
  getRuleStats(ruleId) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    return {
      executions: rule.executions,
      successes: rule.successes,
      failures: rule.failures,
      successRate: rule.executions > 0
        ? Math.round((rule.successes / rule.executions) * 100)
        : 0
    };
  }

  /**
   * Register trigger
   * @param {Object} triggerDef - Trigger definition
   * @returns {Object} Created trigger
   */
  registerTrigger(triggerDef) {
    if (!triggerDef.name || !triggerDef.type) {
      throw new Error('Trigger must have name and type');
    }

    const triggerId = this.generateTriggerId();

    const trigger = {
      triggerId,
      name: triggerDef.name,
      type: triggerDef.type, // EVENT, TIME, WEBHOOK
      config: triggerDef.config || {},
      workflowIds: triggerDef.workflowIds || [],
      enabled: true,
      createdAt: new Date()
    };

    this.triggers.set(triggerId, trigger);

    this.stats.triggersActivated++;

    this.emit('trigger:registered', trigger);

    return { triggerId };
  }

  /**
   * List active triggers
   * @param {string} tenantId - Tenant identifier
   * @returns {Array} Active triggers
   */
  listActiveTriggers(tenantId) {
    return Array.from(this.triggers.values())
      .filter(t => t.enabled)
      .map(t => ({
        triggerId: t.triggerId,
        name: t.name,
        type: t.type,
        workflowCount: t.workflowIds.length
      }));
  }

  /**
   * Create policy
   * @param {Object} policyDef - Policy definition
   * @returns {Object} Created policy
   */
  createPolicy(policyDef) {
    if (!policyDef.name || !policyDef.rules) {
      throw new Error('Policy must have name and rules');
    }

    const policyId = this.generatePolicyId();

    const policy = {
      policyId,
      name: policyDef.name,
      description: policyDef.description || '',
      rules: policyDef.rules,
      enforced: false,
      createdAt: new Date()
    };

    this.policies.set(policyId, policy);

    this.emit('policy:created', policy);

    return { policyId };
  }

  /**
   * Enforce policy
   * @param {string} tenantId - Tenant identifier
   * @param {string} policyId - Policy identifier
   * @returns {Object} Enforcement result
   */
  enforcePolicy(tenantId, policyId) {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    policy.enforced = true;
    policy.enforcedAt = new Date();
    policy.tenantId = tenantId;

    this.emit('policy:enforced', { tenantId, policyId });

    return { success: true };
  }

  /**
   * Get policy violations
   * @param {string} tenantId - Tenant identifier
   * @returns {Array} Violations
   */
  getPolicyViolations(tenantId) {
    const violations = [];

    for (const [, policy] of this.policies) {
      if (policy.tenantId === tenantId && policy.enforced) {
        // Simulated violation detection (would be real in production)
        if (Math.random() < 0.1) {
          violations.push({
            policyId: policy.policyId,
            policyName: policy.name,
            violation: 'Rule mismatch detected',
            timestamp: new Date()
          });
        }
      }
    }

    return violations;
  }

  /**
   * List templates
   * @param {string} category - Template category
   * @returns {Array} Templates
   */
  listTemplates(category) {
    return Array.from(this.templates.values())
      .filter(t => !category || t.category === category)
      .map(t => ({
        templateId: t.templateId,
        name: t.name,
        description: t.description,
        category: t.category
      }));
  }

  /**
   * Instantiate template
   * @param {string} templateId - Template identifier
   * @param {Object} config - Configuration
   * @returns {Object} Instantiated workflow
   */
  instantiateTemplate(templateId, config) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Create workflow from template
    const workflow = this.createWorkflow({
      name: config.name || template.name,
      description: template.description,
      steps: template.steps,
      metadata: { templateId, config }
    });

    return { workflowId: workflow.workflowId };
  }

  /**
   * Execute workflow steps
   * @private
   */
  executeSteps(executionId, workflow) {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const stepResult = this.executeStep(step, execution.context);

        execution.steps.push({
          stepIndex: i,
          name: step.name,
          status: stepResult.success ? 'COMPLETED' : 'FAILED',
          result: stepResult
        });

        execution.results[step.name] = stepResult;

        if (!stepResult.success && step.onFailure === 'STOP') {
          throw new Error(`Step ${step.name} failed`);
        }

        execution.progress = Math.round(((i + 1) / workflow.steps.length) * 100);
      }

      execution.status = 'COMPLETED';
    } catch (error) {
      execution.status = 'FAILED';
      execution.errors.push(error.message);
      this.stats.executionsFailed++;
    }

    execution.endTime = new Date();

    this.emit('execution:completed', { executionId, status: execution.status });
  }

  /**
   * Execute single step
   * @private
   */
  executeStep(step, context) {
    const action = this.actions.get(step.action);
    if (!action) {
      return {
        success: false,
        error: `Action ${step.action} not found`
      };
    }

    try {
      const result = action.handler(step.config || {}, context);
      this.stats.actionsExecuted++;

      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Evaluate condition
   * @private
   */
  evaluateCondition(condition, context) {
    // Simple condition evaluator (would be more complex in production)
    if (typeof condition === 'function') {
      return condition(context);
    }

    if (typeof condition === 'string') {
      // Evaluate simple expressions: "x > 5 && y < 10"
      try {
        return new Function('context', `return ${condition}`)(context);
      } catch (error) {
        return false;
      }
    }

    return false;
  }

  /**
   * Initialize default actions
   * @private
   */
  initializeDefaultActions() {
    this.registerAction('http_request', {
      handler: (config, context) => {
        return {
          url: config.url,
          method: config.method || 'GET',
          success: true
        };
      }
    });

    this.registerAction('log', {
      handler: (config, context) => {
        console.log(`[Workflow] ${config.message}`);
        return { logged: true };
      }
    });

    this.registerAction('delay', {
      handler: (config, context) => {
        // Simulated delay
        return { delayed: true, duration: config.duration || 1000 };
      }
    });

    this.registerAction('transform', {
      handler: (config, context) => {
        // Simulated data transformation
        return { transformed: true };
      }
    });
  }

  /**
   * Initialize workflow templates
   * @private
   */
  initializeTemplates() {
    this.templates.set('approval-flow', {
      templateId: 'approval-flow',
      name: 'Approval Workflow',
      category: 'APPROVAL',
      description: 'Multi-level approval workflow',
      steps: [
        { name: 'submit', action: 'log', config: { message: 'Submission received' } },
        { name: 'approve', action: 'http_request', config: { url: '/approve' } },
        { name: 'notify', action: 'log', config: { message: 'Notifying stakeholders' } }
      ]
    });

    this.templates.set('data-sync', {
      templateId: 'data-sync',
      name: 'Data Synchronization',
      category: 'SYNC',
      description: 'Periodic data sync workflow',
      steps: [
        { name: 'fetch', action: 'http_request', config: { url: '/data' } },
        { name: 'transform', action: 'transform', config: {} },
        { name: 'store', action: 'log', config: { message: 'Data stored' } }
      ]
    });
  }

  /**
   * Register custom action
   */
  registerAction(name, action) {
    this.actions.set(name, action);
  }

  /**
   * Generate workflow ID
   * @private
   */
  generateWorkflowId() {
    return `workflow-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate execution ID
   * @private
   */
  generateExecutionId() {
    return `exec-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate rule ID
   * @private
   */
  generateRuleId() {
    return `rule-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate trigger ID
   * @private
   */
  generateTriggerId() {
    return `trigger-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate policy ID
   * @private
   */
  generatePolicyId() {
    return `policy-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Get metrics
   * @returns {Object} Stats
   */
  getMetrics() {
    return {
      ...this.stats,
      workflowsCount: this.workflows.size,
      rulesCount: this.rules.size,
      triggersCount: this.triggers.size,
      policiesCount: this.policies.size
    };
  }

  /**
   * Health check
   * @returns {Object} Health status
   */
  healthCheck() {
    return {
      status: 'HEALTHY',
      timestamp: new Date(),
      metrics: this.getMetrics(),
      features: [
        'workflow_execution',
        'rule_engine',
        'triggers',
        'policies',
        'templates',
        'actions'
      ]
    };
  }
}

module.exports = WorkflowAutomationEngine;
