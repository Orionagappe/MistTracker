/**
 * THE GAME - Frontend API Integration Layer
 * 
 * Purpose: Connect dashboard UI to backend Game mechanics
 * Bridges: game-ui.js ↔ game-mechanics.js / game-initialization.js
 * 
 * API Endpoints (to be implemented in backend):
 * POST /api/claims/submit
 * GET /api/claims/recent
 * GET /api/verdicts/{claimId}
 * GET /api/validators/leaderboard
 * GET /api/audit-chain
 * POST /api/audit-chain/verify
 */

class GameAPI {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.timeout = 5000;
    this.apiKey = this.getOrCreateAPIKey();
  }

  /**
   * Get or create API key for player
   */
  getOrCreateAPIKey() {
    let key = localStorage.getItem('game-api-key');
    if (!key) {
      key = `key-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('game-api-key', key);
    }
    return key;
  }

  /**
   * Submit claim to backend
   */
  async submitClaim(domain, element, measurement, reference, measured, notes = '') {
    try {
      const response = await this.post('/api/claims/submit', {
        domain,
        element_or_particle: element,
        measurement_type: measurement,
        reference_value: reference,
        measured_value: measured,
        notes,
        player_id: localStorage.getItem('player-id') || 'anonymous',
      });

      return {
        success: true,
        claim_id: response.claim_id,
        causality: response.causality,
        error_pct: response.error_pct,
        validation: response.validation,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get recent claims
   */
  async getRecentClaims(limit = 20) {
    try {
      const response = await this.get(`/api/claims/recent?limit=${limit}`);
      return {
        success: true,
        claims: response.claims,
        total: response.total,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get verdict for specific claim
   */
  async getVerdict(claimId) {
    try {
      const response = await this.get(`/api/verdicts/${claimId}`);
      return {
        success: true,
        verdict: response.verdict,
        quorum: response.quorum,
        audit_entries: response.audit_entries,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get validator leaderboard
   */
  async getValidatorLeaderboard(limit = 50) {
    try {
      const response = await this.get(`/api/validators/leaderboard?limit=${limit}`);
      return {
        success: true,
        validators: response.validators,
        total_active: response.total_active,
        avg_reputation: response.avg_reputation,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get audit chain entries
   */
  async getAuditChain(limit = 50, startSequence = 0) {
    try {
      const response = await this.get(
        `/api/audit-chain?limit=${limit}&start_sequence=${startSequence}`
      );
      return {
        success: true,
        entries: response.entries,
        total: response.total,
        integrity_verified: response.integrity_verified,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify audit chain integrity
   */
  async verifyAuditChain() {
    try {
      const response = await this.post('/api/audit-chain/verify', {});
      return {
        success: response.valid,
        entries_verified: response.entries_verified,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus() {
    try {
      const response = await this.get('/api/system/status');
      return {
        success: true,
        status: response.status,
        validators_active: response.validators_active,
        claims_processed: response.claims_processed,
        audit_entries: response.audit_entries,
        uptime_ms: response.uptime_ms,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'offline',
      };
    }
  }

  /**
   * Initialize player session
   */
  async initializeSession(playerId) {
    try {
      const response = await this.post('/api/player/initialize', {
        player_id: playerId,
        api_key: this.apiKey,
      });

      localStorage.setItem('player-id', playerId);
      return {
        success: true,
        session_id: response.session_id,
        reputation_initial: response.reputation_initial,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * HTTP GET request
   */
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * HTTP POST request
   */
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Base request handler with timeout
   */
  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('API request timeout');
      }

      throw error;
    }
  }

  /**
   * Batch submit multiple claims
   */
  async submitBatchClaims(claims) {
    const results = [];

    for (const claim of claims) {
      const result = await this.submitClaim(
        claim.domain,
        claim.element,
        claim.measurement,
        claim.reference,
        claim.measured,
        claim.notes
      );

      results.push({
        ...claim,
        api_result: result,
      });

      // Small delay between requests to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Poll for verdict updates on pending claims
   */
  async pollClaimVerdicts(claimIds, intervalMs = 5000, maxAttempts = 60) {
    const verdicts = {};
    let attempts = 0;

    while (attempts < maxAttempts) {
      for (const claimId of claimIds) {
        if (!verdicts[claimId]) {
          const result = await this.getVerdict(claimId);

          if (result.success && result.verdict) {
            verdicts[claimId] = result.verdict;
          }
        }
      }

      if (Object.keys(verdicts).length === claimIds.length) {
        return {
          success: true,
          verdicts,
          attempts,
        };
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts += 1;
    }

    return {
      success: false,
      verdicts,
      attempts,
      error: 'Timeout waiting for verdicts',
    };
  }
}

/**
 * Cache layer for API responses
 */
class GameAPICache {
  constructor(api, ttlMs = 30000) {
    this.api = api;
    this.ttl = ttlMs;
    this.cache = new Map();
  }

  /**
   * Get cached or fetch fresh data
   */
  async getCached(key, fetchFn) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await fetchFn();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clear specific key
   */
  clearKey(key) {
    this.cache.delete(key);
  }
}

// ============================================================================
// EXPORTED SINGLETON
// ============================================================================

const gameAPI = new GameAPI();
const gameAPICache = new GameAPICache(gameAPI);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameAPI, GameAPICache, gameAPI, gameAPICache };
}
