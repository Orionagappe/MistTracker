/**
 * THE GAME - Validator Dashboard UI Controller
 * 
 * Purpose: Validator interface for reviewing claims and issuing verdicts
 * Integrates with: game-mechanics.js, reputation-system.js
 */

class ValidatorUIController {
  constructor() {
    this.validatorId = this.generateValidatorId();
    this.reputation = 50;
    this.verdicts = [];
    this.pendingClaims = [];
    this.leaderboardRank = null;
    this.stats = {
      verdicts_issued: 0,
      verdicts_correct: 0,
      verdicts_incorrect: 0,
      approved_count: 0,
      rejected_count: 0,
    };
  }

  /**
   * Generate unique validator ID
   */
  generateValidatorId() {
    return `validator-${Math.floor(Math.random() * 50) + 1}`;
  }

  /**
   * Initialize validator dashboard
   */
  async initialize() {
    console.log('⚖️ Initializing Validator Dashboard...');

    // Update header with validator info
    document.getElementById('header-reputation').textContent = `${this.reputation}%`;

    // Load sample claims and stats
    this.loadSampleData();

    // Attach event listeners
    this.attachEventListeners();

    console.log(`✅ Validator ${this.validatorId} ready`);
  }

  /**
   * Load sample data for demo
   */
  loadSampleData() {
    // Sample pending claims (waiting for verdict)
    this.pendingClaims = [
      {
        id: 'claim-nitrogen-001',
        element: 'Nitrogen',
        measurement: 'Ionization Energy',
        domain: 'atomic',
        reference_value: 14.53,
        measured_value: 14.52,
        error_pct: 0.069,
        causality: 99.3,
        submitted_by: 'player-123456789',
        submitted_at: new Date(Date.now() - 10 * 60000).toISOString(),
        quorum: [this.validatorId, 'validator-15', 'validator-24'],
      },
      {
        id: 'claim-lambda-001',
        element: 'Lambda',
        measurement: 'Decay Lifetime',
        domain: 'baryon',
        reference_value: 2.6e-10,
        measured_value: 2.598e-10,
        error_pct: 0.077,
        causality: 99.2,
        submitted_by: 'player-987654321',
        submitted_at: new Date(Date.now() - 5 * 60000).toISOString(),
        quorum: [this.validatorId, 'validator-42', 'validator-11'],
      },
      {
        id: 'claim-silicon-001',
        element: 'Silicon',
        measurement: 'Ground State Energy',
        domain: 'atomic',
        reference_value: -385.8,
        measured_value: -385.7,
        error_pct: 0.026,
        causality: 99.7,
        submitted_by: 'player-555555555',
        submitted_at: new Date(Date.now() - 2 * 60000).toISOString(),
        quorum: [this.validatorId, 'validator-7', 'validator-33'],
      },
    ];

    // Sample verdict history
    this.verdicts = [
      {
        claim_id: 'claim-carbon-001',
        verdict: 'approved',
        reasoning: 'Measurement within tolerance, causality 95.5/100',
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        outcome: 'correct',
      },
      {
        claim_id: 'claim-proton-001',
        verdict: 'approved',
        reasoning: 'PDG reference verified, causality 99.8/100',
        timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
        outcome: 'correct',
      },
      {
        claim_id: 'claim-oxygen-001',
        verdict: 'rejected',
        reasoning: 'Measurement outside tolerance window',
        timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
        outcome: 'incorrect',
      },
    ];

    // Update stats
    this.stats.verdicts_issued = this.verdicts.length;
    this.stats.verdicts_correct = this.verdicts.filter(v => v.outcome === 'correct').length;
    this.stats.verdicts_incorrect = this.verdicts.filter(v => v.outcome === 'incorrect').length;
    this.stats.approved_count = this.verdicts.filter(v => v.verdict === 'approved').length;
    this.stats.rejected_count = this.verdicts.filter(v => v.verdict === 'rejected').length;

    // Simulate reputation changes
    this.reputation = 50 + (this.stats.verdicts_correct * 8) - (this.stats.verdicts_incorrect * 15);
    this.reputation = Math.max(0, Math.min(100, this.reputation));

    // Simulate leaderboard rank
    this.leaderboardRank = Math.floor(Math.random() * 50) + 1;
  }

  /**
   * Attach DOM event listeners
   */
  attachEventListeners() {
    // Render UI elements
    this.updateStats();
    this.renderPendingClaims();
    this.renderVerdictHistory();
  }

  /**
   * Update statistics display
   */
  updateStats() {
    document.getElementById('stat-verdicts').textContent = this.stats.verdicts_issued;
    document.getElementById('stat-correct').textContent = this.stats.verdicts_correct;

    const accuracy = this.stats.verdicts_issued > 0
      ? ((this.stats.verdicts_correct / this.stats.verdicts_issued) * 100).toFixed(1)
      : 0;
    document.getElementById('stat-accuracy').textContent = `${accuracy}%`;
    document.getElementById('stat-rank').textContent = `#${this.leaderboardRank}`;

    document.getElementById('header-verdicts').textContent = this.stats.verdicts_issued;
    document.getElementById('header-pending').textContent = this.pendingClaims.length;

    document.getElementById('reputation-value').textContent = Math.round(this.reputation);
    document.getElementById('reputation-circle').textContent = `${Math.round(this.reputation)}%`;

    const reputationStatus = this.reputation >= 75 ? 'EXCELLENT' : this.reputation >= 50 ? 'GOOD' : 'AT RISK';
    const reputationColor = this.reputation >= 75 ? '#00ff00' : this.reputation >= 50 ? '#ffaa00' : '#ff4444';
    const statusEl = document.getElementById('reputation-status');
    statusEl.textContent = reputationStatus;
    statusEl.style.color = reputationColor;

    document.getElementById('stat-approved-count').textContent = this.stats.approved_count;
    document.getElementById('stat-rejected-count').textContent = this.stats.rejected_count;
  }

  /**
   * Render pending claims for verdict
   */
  renderPendingClaims() {
    const container = document.getElementById('pending-claims-container');

    if (this.pendingClaims.length === 0) {
      container.innerHTML = '<div style="color: #888; text-align: center; padding: 30px;">No claims waiting for your verdict</div>';
      return;
    }

    container.innerHTML = this.pendingClaims
      .map((claim, idx) => `
        <div class="claim-card">
          <div class="claim-card-header">
            <div>
              <div class="claim-element">${claim.element} — ${claim.measurement}</div>
              <div class="claim-measurement">${claim.domain.toUpperCase()} Domain</div>
            </div>
            <div class="claim-causality">${claim.causality.toFixed(1)}/100</div>
          </div>

          <div class="claim-data">
            <div class="claim-data-item">
              <div class="claim-data-label">Reference</div>
              <div class="claim-data-value">${claim.reference_value}</div>
            </div>
            <div class="claim-data-item">
              <div class="claim-data-label">Measured</div>
              <div class="claim-data-value">${claim.measured_value}</div>
            </div>
            <div class="claim-data-item">
              <div class="claim-data-label">Error</div>
              <div class="claim-data-value">${claim.error_pct.toFixed(3)}%</div>
            </div>
            <div class="claim-data-item">
              <div class="claim-data-label">Valid?</div>
              <div class="claim-data-value" style="color: ${claim.causality >= 75 ? '#00ff00' : '#ff4444'};">
                ${claim.causality >= 75 ? 'YES' : 'NO'}
              </div>
            </div>
          </div>

          <div class="verdict-buttons">
            <button class="btn-approve" onclick="validatorUI.issueVerdict('${claim.id}', 'approved')">
              ✓ Approve
            </button>
            <button class="btn-reject" onclick="validatorUI.issueVerdict('${claim.id}', 'rejected')">
              ✗ Reject
            </button>
          </div>
        </div>
      `)
      .join('');
  }

  /**
   * Issue verdict on claim
   */
  async issueVerdict(claimId, verdict) {
    const claim = this.pendingClaims.find(c => c.id === claimId);
    if (!claim) return;

    // Determine if verdict is correct (matches baseline causality check)
    const isCorrect = (verdict === 'approved' && claim.causality >= 75) ||
                      (verdict === 'rejected' && claim.causality < 75);

    // Update reputation
    const reputationChange = isCorrect ? 8 : -15;
    this.reputation = Math.max(0, Math.min(100, this.reputation + reputationChange));

    // Record verdict
    const verdictRecord = {
      claim_id: claimId,
      verdict,
      reasoning: `Claim evaluation by ${this.validatorId}`,
      timestamp: new Date().toISOString(),
      outcome: isCorrect ? 'correct' : 'incorrect',
    };

    this.verdicts.unshift(verdictRecord);
    this.stats.verdicts_issued += 1;

    if (isCorrect) {
      this.stats.verdicts_correct += 1;
    } else {
      this.stats.verdicts_incorrect += 1;
    }

    if (verdict === 'approved') {
      this.stats.approved_count += 1;
    } else {
      this.stats.rejected_count += 1;
    }

    // Remove from pending
    this.pendingClaims = this.pendingClaims.filter(c => c.id !== claimId);

    // Show feedback
    const message = isCorrect 
      ? `✅ Correct verdict! (${verdict === 'approved' ? '+8' : '-15'} reputation)`
      : `❌ Incorrect verdict (${verdict === 'approved' ? '-15' : '+8'} reputation)`;

    this.showMessage(message, isCorrect ? 'success' : 'error');

    // Update UI
    this.updateStats();
    this.renderPendingClaims();
    this.renderVerdictHistory();
  }

  /**
   * Render verdict history
   */
  renderVerdictHistory() {
    const container = document.getElementById('verdict-history');

    if (this.verdicts.length === 0) {
      container.innerHTML = '<div style="color: #888; text-align: center; padding: 30px;">No verdicts yet</div>';
      return;
    }

    container.innerHTML = this.verdicts
      .slice(0, 20)
      .map(v => {
        const verdictClass = v.verdict === 'approved' ? 'verdict-approved' : 'verdict-rejected';
        const resultText = v.verdict === 'approved' ? '✓ APPROVED' : '✗ REJECTED';
        return `
          <div class="verdict-item">
            <div class="verdict-claim">
              <strong>${v.claim_id}</strong><br>
              <small style="color: #666;">${new Date(v.timestamp).toLocaleTimeString()}</small>
            </div>
            <div class="verdict-result ${verdictClass}">
              ${resultText}
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Show message notification
   */
  showMessage(text, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = text;

    container.appendChild(messageEl);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      messageEl.style.opacity = '0';
      setTimeout(() => messageEl.remove(), 300);
    }, 4000);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

let validatorUI;

document.addEventListener('DOMContentLoaded', async () => {
  validatorUI = new ValidatorUIController();
  await validatorUI.initialize();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidatorUIController;
}
