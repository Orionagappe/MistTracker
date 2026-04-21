/**
 * Milestone Aggregator
 * Phase 17.2.1: Aggregates and analyzes milestones from all cluster nodes
 * 
 * Responsibilities:
 * - Collect milestones from all nodes
 * - Perform cross-atom analysis
 * - Identify convergence patterns
 * - Calculate cluster-wide metrics
 * - Generate emergence chain analysis
 */

import fs from 'fs';
import path from 'path';

/**
 * Milestone Aggregator class
 */
export class MilestoneAggregator {
  constructor() {
    this.milestones = [];
    this.sessions = new Map();
    this.atom_progress = new Map();
    this.emergence_chains = [];
    this.convergence_analysis = {};
  }

  /**
   * Add a milestone from a worker node
   */
  addMilestone(milestone) {
    this.milestones.push({
      ...milestone,
      processed_at: new Date(),
    });

    // Update atom progress tracking
    this.updateAtomProgress(milestone);

    // Check for convergence
    this.checkConvergence(milestone);

    // Track session
    this.trackSession(milestone.session_id);
  }

  /**
   * Update progress for an atom
   */
  updateAtomProgress(milestone) {
    const key = `${milestone.atom}:${milestone.session_id}`;
    const current = this.atom_progress.get(key) || {
      atom: milestone.atom,
      session_id: milestone.session_id,
      epochs_completed: 0,
      best_accuracy: 0,
      final_loss: null,
      convergence_epoch: null,
      milestones_collected: 0,
    };

    current.epochs_completed = Math.max(current.epochs_completed, milestone.epoch);
    current.best_accuracy = Math.max(current.best_accuracy, milestone.accuracy);
    current.final_loss = milestone.loss;
    current.milestones_collected += 1;

    this.atom_progress.set(key, current);
  }

  /**
   * Check for convergence (accuracy plateaus or loss stabilizes)
   */
  checkConvergence(milestone) {
    const atom = milestone.atom;
    const session = milestone.session_id;
    const key = `${atom}:${session}`;

    if (!this.convergence_analysis[key]) {
      this.convergence_analysis[key] = {
        atom,
        session,
        loss_history: [],
        accuracy_history: [],
        convergence_point: null,
        convergence_epoch: null,
        convergence_time_ms: null,
      };
    }

    const analysis = this.convergence_analysis[key];
    analysis.loss_history.push(milestone.loss);
    analysis.accuracy_history.push(milestone.accuracy);

    // Check for convergence: if loss hasn't improved by 1% in last 5 epochs
    if (analysis.loss_history.length >= 5) {
      const recent_loss = analysis.loss_history.slice(-5);
      const min_loss = Math.min(...recent_loss);
      const improvement = (recent_loss[0] - min_loss) / recent_loss[0];

      if (improvement < 0.01 && !analysis.convergence_point) {
        analysis.convergence_point = milestone.loss;
        analysis.convergence_epoch = milestone.epoch;
        if (milestone.metadata?.training_elapsed_ms) {
          analysis.convergence_time_ms = milestone.metadata.training_elapsed_ms;
        }
      }
    }
  }

  /**
   * Track training session
   */
  trackSession(session_id) {
    if (!this.sessions.has(session_id)) {
      this.sessions.set(session_id, {
        session_id,
        started_at: new Date(),
        atoms_in_session: new Set(),
        total_milestones: 0,
        latest_update: new Date(),
      });
    }

    const session = this.sessions.get(session_id);
    session.total_milestones += 1;
    session.latest_update = new Date();
  }

  /**
   * Get summary of all atoms in a session
   */
  getSessionSummary(session_id) {
    const sessionMilestones = this.milestones.filter((m) => m.session_id === session_id);

    if (sessionMilestones.length === 0) {
      return null;
    }

    const atoms = [...new Set(sessionMilestones.map((m) => m.atom))];
    const summary = {
      session_id,
      total_milestones: sessionMilestones.length,
      atoms_trained: atoms,
      atom_metrics: {},
      cluster_metrics: {
        avg_accuracy: 0,
        avg_loss: 0,
        total_convergence_time_ms: 0,
      },
    };

    // Per-atom metrics
    for (const atom of atoms) {
      const atomMilestones = sessionMilestones.filter((m) => m.atom === atom);
      const accuracies = atomMilestones.map((m) => m.accuracy);
      const losses = atomMilestones.map((m) => m.loss);

      summary.atom_metrics[atom] = {
        milestones: atomMilestones.length,
        best_accuracy: Math.max(...accuracies),
        final_accuracy: accuracies[accuracies.length - 1],
        avg_loss: losses.reduce((a, b) => a + b, 0) / losses.length,
        final_loss: losses[losses.length - 1],
        convergence: this.convergence_analysis[`${atom}:${session_id}`] || null,
      };
    }

    // Cluster-wide metrics
    const allAccuracies = Object.values(summary.atom_metrics).map((m) => m.best_accuracy);
    const allLosses = Object.values(summary.atom_metrics).map((m) => m.final_loss);
    const convergenceTimes = Object.values(summary.atom_metrics)
      .map((m) => m.convergence?.convergence_time_ms || 0)
      .filter((t) => t > 0);

    summary.cluster_metrics.avg_accuracy = allAccuracies.reduce((a, b) => a + b, 0) / allAccuracies.length;
    summary.cluster_metrics.avg_loss = allLosses.reduce((a, b) => a + b, 0) / allLosses.length;
    summary.cluster_metrics.total_convergence_time_ms =
      convergenceTimes.length > 0 ? convergenceTimes.reduce((a, b) => a + b, 0) : 0;

    return summary;
  }

  /**
   * Analyze emergence chains between atoms (Phase 17.2.3)
   */
  analyzeEmergenceChains(session_id) {
    const atoms = ['H', 'He', 'Li', 'Be', 'B'];
    const chains = [];

    for (let i = 0; i < atoms.length - 1; i++) {
      const from_atom = atoms[i];
      const to_atom = atoms[i + 1];

      const from_milestones = this.milestones.filter(
        (m) => m.atom === from_atom && m.session_id === session_id
      );
      const to_milestones = this.milestones.filter(
        (m) => m.atom === to_atom && m.session_id === session_id
      );

      if (from_milestones.length > 0 && to_milestones.length > 0) {
        const from_final = from_milestones[from_milestones.length - 1];
        const to_final = to_milestones[to_milestones.length - 1];

        const chain = {
          from_atom,
          to_atom,
          from_accuracy: from_final.accuracy,
          to_accuracy: to_final.accuracy,
          accuracy_delta: to_final.accuracy - from_final.accuracy,
          from_loss: from_final.loss,
          to_loss: to_final.loss,
          loss_delta: to_final.loss - from_final.loss,
          emergence_pattern:
            to_final.accuracy > from_final.accuracy ? 'positive_emergence' : 'negative_emergence',
        };

        chains.push(chain);
      }
    }

    this.emergence_chains = chains;
    return chains;
  }

  /**
   * Get all milestones with optional filtering
   */
  getMilestones(filters = {}) {
    let filtered = this.milestones;

    if (filters.session_id) {
      filtered = filtered.filter((m) => m.session_id === filters.session_id);
    }

    if (filters.atom) {
      filtered = filtered.filter((m) => m.atom === filters.atom);
    }

    if (filters.min_epoch !== undefined) {
      filtered = filtered.filter((m) => m.epoch >= filters.min_epoch);
    }

    if (filters.max_epoch !== undefined) {
      filtered = filtered.filter((m) => m.epoch <= filters.max_epoch);
    }

    if (filters.min_accuracy !== undefined) {
      filtered = filtered.filter((m) => m.accuracy >= filters.min_accuracy);
    }

    return filtered;
  }

  /**
   * Export milestones to file (for analysis)
   */
  exportToFile(filename) {
    const data = {
      exported_at: new Date(),
      total_milestones: this.milestones.length,
      sessions: Array.from(this.sessions.values()),
      milestones: this.milestones,
      convergence_analysis: this.convergence_analysis,
      emergence_chains: this.emergence_chains,
    };

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`[Aggregator] Exported milestones to ${filename}`);
    return filename;
  }

  /**
   * Import milestones from file
   */
  importFromFile(filename) {
    const data = JSON.parse(fs.readFileSync(filename, 'utf-8'));
    this.milestones = data.milestones || [];
    this.convergence_analysis = data.convergence_analysis || {};
    this.emergence_chains = data.emergence_chains || [];
    console.log(`[Aggregator] Imported ${this.milestones.length} milestones from ${filename}`);
  }

  /**
   * Generate HTML report
   */
  generateReport(output_file = 'milestone-report.html') {
    const sessions = Array.from(this.sessions.values());
    const session_summaries = sessions.map((s) => this.getSessionSummary(s.session_id)).filter((s) => s);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Phase 17.2.1 Milestone Report</title>
  <style>
    body { font-family: monospace; background: #0f0f0f; color: #e0e0e0; margin: 2rem; }
    h1 { color: #00ff88; border-bottom: 2px solid #00ff88; padding-bottom: 0.5rem; }
    h2 { color: #00ff88; margin-top: 2rem; }
    .metric { background: #1a1a1a; padding: 1rem; margin: 0.5rem 0; border-left: 4px solid #00ff88; }
    .value { color: #00ff88; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #333; }
    th { background: #1a1a1a; color: #00ff88; }
    .atom-h { color: #ff6b6b; }
    .atom-he { color: #4ecdc4; }
    .atom-li { color: #ffe66d; }
    .atom-be { color: #95e1d3; }
    .atom-b { color: #f38181; }
  </style>
</head>
<body>
  <h1>Phase 17.2.1: Multi-Atom Cluster Training Report</h1>
  <div class="metric">
    <strong>Generated:</strong> ${new Date().toISOString()}
  </div>
  <div class="metric">
    <strong>Total Milestones:</strong> <span class="value">${this.milestones.length}</span>
  </div>
  <div class="metric">
    <strong>Sessions:</strong> <span class="value">${sessions.length}</span>
  </div>

  ${session_summaries
    .map(
      (summary) => `
  <h2>Session: ${summary.session_id.substring(0, 8)}</h2>
  <table>
    <tr>
      <th>Atom</th>
      <th>Best Accuracy</th>
      <th>Final Loss</th>
      <th>Milestones</th>
      <th>Convergence Time</th>
    </tr>
    ${Object.entries(summary.atom_metrics)
      .map(
        ([atom, metrics]) => `
    <tr>
      <td class="atom-${atom.toLowerCase()}">${atom}</td>
      <td>${(metrics.best_accuracy * 100).toFixed(2)}%</td>
      <td>${metrics.final_loss.toFixed(6)}</td>
      <td>${metrics.milestones}</td>
      <td>${metrics.convergence?.convergence_time_ms ? (metrics.convergence.convergence_time_ms / 1000).toFixed(1) + 's' : 'N/A'}</td>
    </tr>
    `
      )
      .join('')}
  </table>
  <div class="metric">
    <strong>Cluster Avg Accuracy:</strong> <span class="value">${(summary.cluster_metrics.avg_accuracy * 100).toFixed(2)}%</span>
  </div>
  `
    )
    .join('')}

  <h2>Emergence Chains</h2>
  ${this.emergence_chains.length > 0
    ? `
  <table>
    <tr>
      <th>From</th>
      <th>To</th>
      <th>Accuracy Δ</th>
      <th>Pattern</th>
    </tr>
    ${this.emergence_chains
      .map(
        (chain) => `
    <tr>
      <td class="atom-${chain.from_atom.toLowerCase()}">${chain.from_atom}</td>
      <td class="atom-${chain.to_atom.toLowerCase()}">${chain.to_atom}</td>
      <td>${(chain.accuracy_delta * 100).toFixed(2)}%</td>
      <td>${chain.emergence_pattern}</td>
    </tr>
    `
      )
      .join('')}
  </table>
  `
    : '<p>No emergence chains analyzed</p>'}
</body>
</html>
    `;

    fs.writeFileSync(output_file, html);
    console.log(`[Aggregator] Report generated: ${output_file}`);
    return output_file;
  }
}

/**
 * Create and export aggregator instance
 */
const aggregator = new MilestoneAggregator();

export default aggregator;
