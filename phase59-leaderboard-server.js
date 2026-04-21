#!/usr/bin/env node
/**
 * PHASE 59: INTRUSION CHALLENGE 2026 - LEADERBOARD SERVER
 * 
 * Real-time leaderboard, scoring, and results aggregation for competitive
 * AI security testing event using Phase 17.5 defense models.
 * 
 * Classification: Research Only
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  port: process.env.PHASE59_PORT || 8059,
  resultsDir: path.join(__dirname, 'test-env', 'phase59-results'),
  maxCompetitors: 100,
  scoringWindow: 300000, // 5 minutes between updates
  competitionDuration: 8 * 7 * 24 * 60 * 60 * 1000, // 8 weeks
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  competitors: new Map(),
  attacks: [],
  leaderboard: [],
  scoringMetrics: {
    detectionAccuracy: 0.4,     // 40% weight
    efficiency: 0.2,             // 20% weight
    novelty: 0.2,               // 20% weight
    robustness: 0.2,            // 20% weight
  },
  phase59Stats: {
    totalAttackAttempts: 0,
    successfulDetections: 0,
    falsePositives: 0,
    competitorCount: 0,
    averageResponseTime: 0,
  },
};

// ============================================================================
// COMPETITOR MANAGEMENT
// ============================================================================

class Competitor {
  constructor(competitorId, name, modelType) {
    this.id = competitorId;
    this.name = name;
    this.modelType = modelType; // e.g., 'neural-network', 'random-forest', 'llm-based'
    this.joinedAt = new Date();
    this.totalAttacksSent = 0;
    this.successfulDetections = 0;
    this.falsePositives = 0;
    this.falseNegatives = 0;
    this.uniqueVectorsDiscovered = [];
    this.responseTime = {
      min: Infinity,
      max: 0,
      average: 0,
      samples: [],
    };
    this.scores = {
      detectionAccuracy: 0,
      efficiency: 0,
      novelty: 0,
      robustness: 0,
      composite: 0,
    };
  }

  updateDetectionMetrics(detected, wasRelevant, responseTimeMs) {
    this.totalAttacksSent++;
    this.responseTime.samples.push(responseTimeMs);

    if (responseTimeMs < this.responseTime.min) {
      this.responseTime.min = responseTimeMs;
    }
    if (responseTimeMs > this.responseTime.max) {
      this.responseTime.max = responseTimeMs;
    }

    this.responseTime.average =
      this.responseTime.samples.reduce((a, b) => a + b, 0) /
      this.responseTime.samples.length;

    if (detected && wasRelevant) {
      this.successfulDetections++;
    } else if (detected && !wasRelevant) {
      this.falsePositives++;
    } else if (!detected && wasRelevant) {
      this.falseNegatives++;
    }
  }

  calculateScores() {
    const tp = this.successfulDetections;
    const fp = this.falsePositives;
    const fn = this.falseNegatives;
    const total = this.totalAttacksSent;

    // Detection Accuracy: (TP) / (TP + FN)
    this.scores.detectionAccuracy = total > 0 ? tp / (tp + fn || 1) : 0;

    // Efficiency: inverse of false positive rate + speed bonus
    const fpRate = fp / (fp + tp || 1);
    const speedBonus = Math.max(0, 1 - this.responseTime.average / 5000); // 5s baseline
    this.scores.efficiency = (1 - fpRate) * 0.7 + speedBonus * 0.3;

    // Novelty: unique attack vectors discovered
    this.scores.novelty = Math.min(1, this.uniqueVectorsDiscovered.length / 50); // 50 vectors = 1.0

    // Robustness: consistency across different attack types
    const variance =
      this.responseTime.samples.length > 1
        ? this.responseTime.samples.reduce(
            (sum, rt) => sum + Math.pow(rt - this.responseTime.average, 2),
            0
          ) / this.responseTime.samples.length
        : 0;
    const stdDev = Math.sqrt(variance);
    const robustnessPenalty = Math.min(1, stdDev / 1000); // 1s std dev = full penalty
    this.scores.robustness = 1 - robustnessPenalty;

    // Composite Score
    this.scores.composite =
      this.scores.detectionAccuracy * state.scoringMetrics.detectionAccuracy +
      this.scores.efficiency * state.scoringMetrics.efficiency +
      this.scores.novelty * state.scoringMetrics.novelty +
      this.scores.robustness * state.scoringMetrics.robustness;

    return this.scores;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      modelType: this.modelType,
      joinedAt: this.joinedAt,
      statistics: {
        totalAttacks: this.totalAttacksSent,
        detections: this.successfulDetections,
        falsePositives: this.falsePositives,
        falseNegatives: this.falseNegatives,
        detectionRate: (this.successfulDetections / (this.totalAttacksSent || 1)).toFixed(3),
        falsePositiveRate: (this.falsePositives / (this.totalAttacksSent || 1)).toFixed(3),
      },
      responseTime: {
        min: this.responseTime.min === Infinity ? null : this.responseTime.min,
        max: this.responseTime.max,
        average: this.responseTime.average.toFixed(0),
      },
      scores: {
        detectionAccuracy: this.scores.detectionAccuracy.toFixed(3),
        efficiency: this.scores.efficiency.toFixed(3),
        novelty: this.scores.novelty.toFixed(3),
        robustness: this.scores.robustness.toFixed(3),
        composite: this.scores.composite.toFixed(3),
      },
      uniqueVectors: this.uniqueVectorsDiscovered.length,
    };
  }
}

// ============================================================================
// ATTACK SIMULATION & DETECTION
// ============================================================================

class AttackSimulator {
  static generateAttackVector() {
    const vectors = [
      { type: 'SSH_BRUTE_FORCE', payload: 'ssh_attempt', severity: 'medium' },
      { type: 'SQL_INJECTION', payload: 'select * from users', severity: 'high' },
      { type: 'PRIVILEGE_ESCALATION', payload: 'sudo -s', severity: 'high' },
      { type: 'NETWORK_SCAN', payload: 'nmap_scan', severity: 'low' },
      { type: 'BUFFER_OVERFLOW', payload: 'overflow_payload', severity: 'critical' },
      { type: 'XSS_INJECTION', payload: '<script>alert(1)</script>', severity: 'medium' },
      { type: 'COMMAND_INJECTION', payload: 'ping; cat /etc/passwd', severity: 'high' },
      { type: 'PATH_TRAVERSAL', payload: '../../etc/passwd', severity: 'medium' },
      { type: 'ZERO_DAY_VARIANT', payload: 'unknown_exploit', severity: 'critical' },
      { type: 'TIMING_ATTACK', payload: 'delayed_response', severity: 'low' },
    ];

    return vectors[Math.floor(Math.random() * vectors.length)];
  }

  static recordAttack(competitorId, vector, detected, responseTimeMs) {
    const attack = {
      timestamp: new Date(),
      competitorId,
      vector,
      detected,
      responseTimeMs,
    };

    state.attacks.push(attack);
    state.phase59Stats.totalAttackAttempts++;

    if (detected) {
      state.phase59Stats.successfulDetections++;
    } else {
      state.phase59Stats.falsePositives++;
    }

    return attack;
  }
}

// ============================================================================
// LEADERBOARD CALCULATION
// ============================================================================

function calculateLeaderboard() {
  const competitors = Array.from(state.competitors.values());

  competitors.forEach((comp) => {
    comp.calculateScores();
  });

  const leaderboard = competitors
    .sort((a, b) => b.scores.composite - a.scores.composite)
    .map((comp, index) => ({
      rank: index + 1,
      ...comp.toJSON(),
    }));

  state.leaderboard = leaderboard;
  return leaderboard;
}

// ============================================================================
// HTTP REQUEST HANDLERS
// ============================================================================

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // ========== COMPETITOR REGISTRATION ==========
  if (pathname === '/api/competitors/register' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const competitorId = `competitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const competitor = new Competitor(competitorId, data.name, data.modelType);

        state.competitors.set(competitorId, competitor);
        state.phase59Stats.competitorCount++;

        res.writeHead(201);
        res.end(JSON.stringify({ success: true, competitorId, competitor: competitor.toJSON() }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // ========== ATTACK SUBMISSION ==========
  if (pathname === '/api/attacks/submit' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const competitor = state.competitors.get(data.competitorId);

        if (!competitor) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Competitor not found' }));
          return;
        }

        const vector = data.vector || AttackSimulator.generateAttackVector();
        const responseTimeMs = Math.random() * 5000 + 100; // 100-5100ms
        const detected = Math.random() > 0.3; // 70% detection rate baseline

        const attack = AttackSimulator.recordAttack(
          data.competitorId,
          vector,
          detected,
          responseTimeMs
        );

        competitor.updateDetectionMetrics(
          detected,
          vector.severity !== 'low',
          responseTimeMs
        );

        // Track unique vectors
        if (!competitor.uniqueVectorsDiscovered.includes(vector.type)) {
          competitor.uniqueVectorsDiscovered.push(vector.type);
        }

        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            attack,
            detection: detected,
            responseTime: responseTimeMs,
          })
        );
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // ========== LEADERBOARD ==========
  if (pathname === '/api/leaderboard' && method === 'GET') {
    const leaderboard = calculateLeaderboard();
    res.writeHead(200);
    res.end(JSON.stringify({ leaderboard, stats: state.phase59Stats }));
    return;
  }

  // ========== COMPETITOR STATS ==========
  if (pathname.match(/^\/api\/competitors\/[^/]+$/) && method === 'GET') {
    const competitorId = pathname.split('/').pop();
    const competitor = state.competitors.get(competitorId);

    if (!competitor) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Competitor not found' }));
      return;
    }

    competitor.calculateScores();
    res.writeHead(200);
    res.end(JSON.stringify({ competitor: competitor.toJSON() }));
    return;
  }

  // ========== DASHBOARD ==========
  if (pathname === '/dashboard' && method === 'GET') {
    const leaderboard = calculateLeaderboard();
    const html = generateDashboardHTML(leaderboard);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // ========== HEALTH CHECK ==========
  if (pathname === '/health' && method === 'GET') {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: 'healthy',
        competitors: state.competitors.size,
        attacks: state.attacks.length,
      })
    );
    return;
  }

  // ========== 404 ==========
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

// ============================================================================
// DASHBOARD HTML
// ============================================================================

function generateDashboardHTML(leaderboard) {
  const rows = leaderboard
    .slice(0, 50)
    .map(
      (comp, i) => `
    <tr>
      <td>#${comp.rank}</td>
      <td>${comp.name}</td>
      <td>${comp.modelType}</td>
      <td>${comp.statistics.totalAttacks}</td>
      <td>${(parseFloat(comp.statistics.detectionRate) * 100).toFixed(1)}%</td>
      <td>${comp.responseTime.average}ms</td>
      <td>${comp.scores.composite}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <title>The Intrusion Challenge 2026 - Live Leaderboard</title>
    <style>
        body { font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }
        h1 { color: #00ffff; text-align: center; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th { background: #003300; padding: 10px; text-align: left; border: 1px solid #00ff00; }
        td { padding: 8px; border: 1px solid #003300; }
        tr:hover { background: #002200; }
        .stats { background: #001a1a; padding: 10px; margin: 10px 0; border: 1px solid #00ff00; }
        .rank-1 { background: #1a1a00; }
        .rank-2 { background: #0a1a0a; }
        .rank-3 { background: #001a1a; }
    </style>
</head>
<body>
    <h1>🎯 THE INTRUSION CHALLENGE 2026</h1>
    <h2>Live Leaderboard</h2>
    <div class="stats">
        <p>Total Competitors: <strong>${leaderboard.length}</strong></p>
        <p>Total Attacks: <strong>${state.phase59Stats.totalAttackAttempts}</strong></p>
        <p>Detection Success Rate: <strong>${((state.phase59Stats.successfulDetections / state.phase59Stats.totalAttackAttempts) * 100).toFixed(1)}%</strong></p>
    </div>
    <table>
        <thead>
            <tr>
                <th>Rank</th>
                <th>Competitor</th>
                <th>Model Type</th>
                <th>Attacks</th>
                <th>Detection Rate</th>
                <th>Avg Response</th>
                <th>Score</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
    <p style="text-align: center; font-size: 0.8em;">Last updated: ${new Date().toISOString()}</p>
    <script>
        setTimeout(() => location.reload(), 5000);
    </script>
</body>
</html>
  `;
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = http.createServer(handleRequest);

server.listen(CONFIG.port, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  PHASE 59: INTRUSION CHALLENGE 2026 - LEADERBOARD SERVER  ║
╠════════════════════════════════════════════════════════════╣
║ Status: ACTIVE                                             ║
║ Port: ${CONFIG.port}                                               ║
║ Endpoint: http://localhost:${CONFIG.port}/dashboard                  ║
║ API: http://localhost:${CONFIG.port}/api/*                          ║
║ Max Competitors: ${CONFIG.maxCompetitors}                                      ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Phase 59] Shutdown signal received');
  server.close(() => {
    console.log('[Phase 59] Server closed');
    process.exit(0);
  });
});

module.exports = { state, Competitor, AttackSimulator, calculateLeaderboard };
