/**
 * THE GAME - Frontend UI Controller
 * 
 * Purpose: Dashboard interaction, claim submission, real-time updates
 * Integrates with: game-initialization.js, game-mechanics.js (backend)
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

class GameUIController {
  constructor() {
    this.playerId = this.generatePlayerId();
    this.claims = [];
    this.validators = [];
    this.auditEntries = [];
    this.gameState = {
      claims_processed: 0,
      claims_approved: 0,
      validators_active: 50,
    };
    this.systemReady = false;
  }

  /**
   * Generate unique player ID
   */
  generatePlayerId() {
    return `player-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * Initialize UI and load game state
   */
  async initialize() {
    console.log('🎮 Initializing Game UI...');
    
    // Update header
    document.getElementById('player-id').textContent = this.playerId.substring(0, 15);
    
    // Load sample data
    this.loadSampleData();
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Update status
    this.systemReady = true;
    this.updateSystemStatus();
    
    console.log('✅ Game UI Ready');
  }

  /**
   * Load sample/demo data
   */
  loadSampleData() {
    // Sample validators (top 10)
    this.validators = [
      { id: 'validator-1', reputation: 100, verdicts: 10 },
      { id: 'validator-3', reputation: 71, verdicts: 10 },
      { id: 'validator-2', reputation: 61, verdicts: 10 },
      { id: 'validator-15', reputation: 58, verdicts: 9 },
      { id: 'validator-24', reputation: 56, verdicts: 8 },
      { id: 'validator-7', reputation: 54, verdicts: 8 },
      { id: 'validator-33', reputation: 52, verdicts: 7 },
      { id: 'validator-11', reputation: 51, verdicts: 7 },
      { id: 'validator-42', reputation: 50, verdicts: 6 },
      { id: 'validator-19', reputation: 49, verdicts: 6 },
    ];

    // Sample claims
    this.claims = [
      {
        id: 'claim-carbon-001',
        element: 'Carbon',
        measurement: 'Bohr Radius',
        causality: 95.5,
        status: 'approved',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: 'claim-proton-001',
        element: 'Proton',
        measurement: 'Rest Mass',
        causality: 99.8,
        status: 'approved',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      },
      {
        id: 'claim-nitrogen-001',
        element: 'Nitrogen',
        measurement: 'Ionization Energy',
        causality: 99.3,
        status: 'pending',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 'claim-neutron-001',
        element: 'Neutron',
        measurement: 'Charge Radius',
        causality: 99.8,
        status: 'approved',
        timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
      },
      {
        id: 'claim-oxygen-001',
        element: 'Oxygen',
        measurement: 'Ground State Energy',
        causality: 100.0,
        status: 'rejected',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      },
    ];

    // Sample audit entries
    this.auditEntries = [
      {
        sequence: 25,
        event_type: 'claim_finalized',
        claim_id: 'claim-oxygen-001',
        hash: '8a4c7e2f9b1d',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        data: { consensus: 'rejected', approved_votes: 1, rejected_votes: 2 },
      },
      {
        sequence: 24,
        event_type: 'verdict_recorded',
        claim_id: 'claim-neutron-001',
        hash: '3f9d2c7a5e1b',
        timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
        data: { validator_id: 'validator-3', verdict: 'approved', reputation_after: 71 },
      },
      {
        sequence: 23,
        event_type: 'claim_submitted',
        claim_id: 'claim-proton-001',
        hash: '7e2f9b1d4c8a',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        data: { domain: 'baryon', causality: 99.8, valid: true },
      },
      {
        sequence: 22,
        event_type: 'claim_finalized',
        claim_id: 'claim-carbon-001',
        hash: '1d4c8a7e2f9b',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        data: { consensus: 'approved', approved_votes: 3, rejected_votes: 0 },
      },
    ];

    // Update game state
    this.gameState.claims_processed = this.claims.length;
    this.gameState.claims_approved = this.claims.filter(c => c.status === 'approved').length;
  }

  /**
   * Attach DOM event listeners
   */
  attachEventListeners() {
    const claimForm = document.getElementById('claim-form');
    if (claimForm) {
      claimForm.addEventListener('submit', (e) => this.handleClaimSubmission(e));
    }

    // Load initial data
    this.renderValidators();
    this.renderClaims();
    this.renderAuditChain();
    this.updateSystemStats();
  }

  /**
   * Handle claim form submission
   */
  async handleClaimSubmission(e) {
    e.preventDefault();

    const domain = document.getElementById('claim-domain').value;
    const element = document.getElementById('claim-element').value;
    const measurement = document.getElementById('claim-measurement').value;
    const reference = parseFloat(document.getElementById('claim-reference').value);
    const measured = parseFloat(document.getElementById('claim-measured').value);
    const notes = document.getElementById('claim-notes').value;

    if (!domain || !element || !measurement) {
      this.showMessage('Please fill all required fields', 'error');
      return;
    }

    // Calculate error percentage
    const errorPct = ((Math.abs(measured - reference) / reference) * 100).toFixed(3);
    const causality = Math.max(0, Math.min(100, 100 - (errorPct * 10))).toFixed(1);

    // Create claim object
    const claim = {
      id: `claim-${domain}-${Date.now()}`,
      domain,
      element,
      measurement,
      reference_value: reference,
      measured_value: measured,
      error_pct: parseFloat(errorPct),
      causality: parseFloat(causality),
      status: parseFloat(causality) >= 75 ? 'pending' : 'invalid',
      timestamp: new Date().toISOString(),
      player_id: this.playerId,
      notes: notes,
    };

    // Add to claims list
    this.claims.unshift(claim);
    this.gameState.claims_processed += 1;

    // Display success message
    this.showMessage(
      `✅ Claim submitted: ${element} (${measurement})<br>Causality: ${causality}/100 | Error: ${errorPct}%`,
      'success'
    );

    // Reset form
    document.getElementById('claim-form').reset();

    // Update UI
    this.updateSystemStats();
    this.renderClaims();

    // Create audit entry
    this.createAuditEntry('claim_submitted', claim.id, {
      domain,
      causality: parseFloat(causality),
      valid: claim.status !== 'invalid',
    });
  }

  /**
   * Render validator leaderboard
   */
  renderValidators() {
    const validatorsList = document.getElementById('validators-list');
    if (!validatorsList) return;

    const sorted = [...this.validators].sort((a, b) => b.reputation - a.reputation);

    validatorsList.innerHTML = sorted
      .slice(0, 10)
      .map((v, idx) => `
        <div class="validator-row">
          <div class="validator-name">
            <span style="color: #00d4ff; font-weight: bold;">#${idx + 1}</span> ${v.id}
          </div>
          <div class="reputation-bar">
            <div class="reputation-fill" style="width: ${v.reputation}%"></div>
          </div>
          <div class="reputation-value">${v.reputation}%</div>
        </div>
      `)
      .join('');
  }

  /**
   * Render recent claims
   */
  renderClaims() {
    const claimsList = document.getElementById('claims-list');
    if (!claimsList) return;

    if (this.claims.length === 0) {
      claimsList.innerHTML = '<div style="color: #888; text-align: center; padding: 30px;">No claims submitted yet</div>';
      return;
    }

    claimsList.innerHTML = this.claims
      .slice(0, 10)
      .map(c => {
        const statusClass = c.status === 'approved' ? 'status-approved' : c.status === 'rejected' ? 'status-rejected' : 'status-pending';
        return `
          <div class="claim-item">
            <div class="claim-info">
              <div class="claim-type">${c.domain}</div>
              <div class="claim-element">${c.element} — ${c.measurement}</div>
              <div class="claim-status">
                Causality: <span style="color: ${c.causality >= 75 ? '#00d4ff' : '#ff6666'}">${c.causality.toFixed(1)}/100</span> | 
                Error: ${c.error_pct.toFixed(3)}% | 
                Status: <span class="${statusClass}">${c.status.toUpperCase()}</span>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Render audit chain
   */
  renderAuditChain() {
    const auditLog = document.getElementById('audit-log');
    if (!auditLog) return;

    if (this.auditEntries.length === 0) {
      auditLog.innerHTML = '<div style="color: #888; text-align: center; padding: 30px;">No audit entries yet</div>';
      return;
    }

    auditLog.innerHTML = this.auditEntries
      .reverse()
      .slice(0, 10)
      .map(e => `
        <div class="audit-entry">
          <div class="audit-timestamp">${new Date(e.timestamp).toLocaleTimeString()} — Seq: ${e.sequence}</div>
          <div class="audit-event">${e.event_type.toUpperCase()}</div>
          <div style="margin-bottom: 5px; color: #a0a0a0;">Claim: ${e.claim_id}</div>
          <div class="audit-hash">Hash: ${e.hash}</div>
        </div>
      `)
      .join('');
  }

  /**
   * Update system stats display
   */
  updateSystemStats() {
    const statClaims = document.getElementById('stat-claims');
    const statApproved = document.getElementById('stat-approved');

    if (statClaims) statClaims.textContent = this.gameState.claims_processed;
    if (statApproved) statApproved.textContent = this.gameState.claims_approved;
  }

  /**
   * Update system status header
   */
  updateSystemStatus() {
    const statusLabel = document.getElementById('status-label');
    const statusValue = document.getElementById('status-value');

    if (statusValue) {
      statusValue.textContent = this.systemReady ? '✅ ONLINE' : '⏳ Initializing...';
      statusValue.style.color = this.systemReady ? '#00ff00' : '#ffaa00';
    }
  }

  /**
   * Show message notification
   */
  showMessage(text, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.innerHTML = text;

    container.appendChild(messageEl);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageEl.style.opacity = '0';
      setTimeout(() => messageEl.remove(), 300);
    }, 5000);
  }

  /**
   * Create audit chain entry
   */
  createAuditEntry(eventType, claimId, data) {
    const sequence = this.auditEntries.length;
    const entry = {
      sequence,
      event_type: eventType,
      claim_id: claimId,
      hash: this.generateHash(eventType + claimId + sequence),
      timestamp: new Date().toISOString(),
      data,
    };

    this.auditEntries.push(entry);
    this.renderAuditChain();
  }

  /**
   * Generate hash (simple SHA-like)
   */
  generateHash(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 12);
  }

  /**
   * Verify audit chain integrity
   */
  verifyAuditChain() {
    let valid = true;
    for (let i = 1; i < this.auditEntries.length; i++) {
      if (this.auditEntries[i].sequence !== i) {
        valid = false;
        break;
      }
    }

    const message = valid ? '✅ Audit chain integrity verified' : '❌ Audit chain integrity violation detected';
    this.showMessage(message, valid ? 'success' : 'error');
  }

  /**
   * Load recent claims from API (future)
   */
  async loadRecentClaims() {
    this.showMessage('Loading claims...', 'info');
    // This will connect to game-api.js in production
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

let gameUI;

document.addEventListener('DOMContentLoaded', async () => {
  gameUI = new GameUIController();
  await gameUI.initialize();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameUIController;
}
