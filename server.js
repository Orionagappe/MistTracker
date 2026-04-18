#!/usr/bin/env node
// --- MistTracker REST API + WebSocket Server (Sprint 3 + Phase 1) ---
// Expose MistTracker functionality via HTTP endpoints and real-time WebSocket sync

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mysql from 'mysql2/promise';
import * as MistTrackerVulkan from './MistTrackerVulkan.js';
import { ConflictResolver } from './ConflictResolver.js';
import { ConflictHandler } from './conflict-handler.js';
import { RateLimiter } from './RateLimiter.js';
import { EnhancedProvenanceTracker } from './EnhancedProvenanceTracker.js';
import { P2PHandler } from './p2p-handler.js';
import { GeometryHandler } from './MistGeometry.js';
import { GeometryHandler as SceneGeometryHandler } from './geometry-handler.js';
import { MistPhysicsEngine } from './physics-engine.js';
import { MessageTypes, parseMessage, validateMessage, createPingMessage, createPongMessage, createHelloMessage, ConflictMessage } from './websocket-protocol.js';
import { validateBuilderConfig } from './builder-config-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 's3cur3_9a`55w04d';
const DB_PORT = parseInt(process.env.DB_PORT) || 3306;

// Global database connection
let dbConnection = null;

// WebSocket Services (Sprint 5 + Phase 3)
const conflictResolver = new ConflictResolver();
const conflictHandler = new ConflictHandler(conflictResolver);
const rateLimiter = new RateLimiter(50000, 1000); // 50 KBps per user, 1s window
const provenanceTracker = new EnhancedProvenanceTracker();
const p2pHandler = new P2PHandler(); // Phase 3: P2P encryption & collaboration
const geometryHandler = new GeometryHandler(); // Phase 4: 3D Geometry Visualization (general)
const sceneGeometryHandler = new SceneGeometryHandler(); // Phase 4: item-centric scene geometry
const physicsEngine = new MistPhysicsEngine({ // Phase 5: Physics simulation with wave-based interactions
  timeStep: 0.016, // ~60fps
  gravityStrength: 0.1,
  dimensionalCouplingStrength: 0.5
});

// Physics simulation state
let physicsSimulationActive = true;
let lastPhysicsUpdateTime = Date.now();
let physicsUpdateInterval = 16; // milliseconds (~60fps)

// WebSocket Connection Tracking
let wss = null;
const clientConnections = new Map(); // userId -> { ws, sessionToken, lastSeen }

// Initialize database at startup
async function initializeDatabase() {
  try {
    dbConnection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT
    });
    
    // Ensure database is selected (from MistCausality.js pattern)
    await dbConnection.query('CREATE DATABASE IF NOT EXISTS mist');
    await dbConnection.query('USE mist');

    // Ensure builder_configs table exists
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS builder_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timeline_id INT NOT NULL,
        config JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_timeline_config (timeline_id)
      )
    `);

    // Phase 15: ML Proxy Framework tables
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS simulation_proxies (
        proxyId VARCHAR(36) PRIMARY KEY,
        sessionId VARCHAR(36) NOT NULL,
        type ENUM('algebraic', 'lookup_table', 'neural_network', 'geometric_transform'),
        inputs JSON,
        outputs JSON,
        version INT,
        accuracy_metric FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS proxy_versions (
        versionId INT AUTO_INCREMENT PRIMARY KEY,
        proxyId VARCHAR(36) NOT NULL,
        version INT,
        parentProxyId VARCHAR(36),
        trainingData JSON,
        modelWeights LONGBLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proxyId) REFERENCES simulation_proxies(proxyId)
      )
    `);

    // Phase 16: Milestone & Versioning tables
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS simulation_milestones (
        milestoneId VARCHAR(36) PRIMARY KEY,
        sessionId VARCHAR(36) NOT NULL,
        type ENUM('data-collected', 'proxy-generated', 'validation-passed', 'sim-evolved'),
        timestamp TIMESTAMP,
        stats_snapshot JSON,
        proxyVersionsAtMilestone JSON,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS version_graph (
        versionId VARCHAR(36) PRIMARY KEY,
        sessionId VARCHAR(36) NOT NULL,
        parentVersionId VARCHAR(36),
        mutations JSON,
        branchName VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Phase 16: Checkpoint table for state serialization
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS simulation_checkpoints (
        checkpointId VARCHAR(36) PRIMARY KEY,
        sessionId VARCHAR(36) NOT NULL,
        milestoneId VARCHAR(36),
        checkpoint_data LONGBLOB,
        compressed TINYINT(1) DEFAULT 0,
        size_bytes INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (milestoneId) REFERENCES simulation_milestones(milestoneId)
      )
    `);

    // Phase 16: Metadata table for tracking simulation context
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS simulation_metadata (
        metadataId VARCHAR(36) PRIMARY KEY,
        sessionId VARCHAR(36) NOT NULL,
        milestoneId VARCHAR(36),
        tags JSON,
        description TEXT,
        hypothesis TEXT,
        author VARCHAR(255),
        runtimeMetrics JSON,
        customFields JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (milestoneId) REFERENCES simulation_milestones(milestoneId),
        INDEX idx_author (author),
        INDEX idx_session (sessionId)
      )
    `);
    
    console.log('✓ Database initialized successfully (Phase 14/15/16 tables)');
    return dbConnection;
  } catch (err) {
    console.error('✗ Failed to initialize database:', err.message);
    throw err;
  }
}

function getDatabase() {
  return dbConnection;
}

// Helper: Create fresh database connection for request (works like test-sprint2.js)
async function getRequestConnection() {
  const db = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT
  });
  
  await db.query('USE mist');
  return db;
}

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- Helper: JWT Token Generation ---
function generateToken(userId, accountId) {
  return jwt.sign(
    { userId, accountId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// --- Helper: Token verification ---
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.accountId = decoded.accountId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Authentication Endpoints ---

app.post('/auth/register', async (req, res) => {
  try {
    const { userName, accountId, password } = req.body;
    
    if (!userName || !accountId || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create fresh connection for this request
    const db = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT
    });
    
    await db.query('USE mist');
    const user = await MistTrackerVulkan.createUser(userName, accountId, password, db);
    await db.end();
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: { id: user.id, userName, accountId }
    });
  } catch (err) {
    console.error('[/auth/register] Error:', err.message, err.stack);
    res.status(400).json({ error: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { accountId, password } = req.body;
    
    if (!accountId || !password) {
      return res.status(400).json({ error: 'Missing accountId or password' });
    }
    
    // Create fresh connection for this request (works like test-sprint2.js)
    const db = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT
    });
    
    await db.query('USE mist');
    const user = await MistTrackerVulkan.authenticateUser(accountId, password, db);
    await db.end();
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user.id || user.accountId, accountId);
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, userName: user.userName, accountId: user.accountId }
    });
  } catch (err) {
    console.error('[/auth/login] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/logout', verifyToken, (req, res) => {
  // Token-based auth: logout is just on client side (discard token)
  res.json({ message: 'Logout successful' });
});

app.get('/auth/verify', verifyToken, (req, res) => {
  // verifyToken middleware already validated, just return user info
  res.json({ 
    valid: true, 
    userId: req.userId,
    accountId: req.accountId
  });
});

// --- User Management Endpoints ---

app.get('/users/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const database = await getRequestConnection();
    const users = await MistTrackerVulkan.getAllUsers(database);
    const foundUser = users.find(u => u.accountId === accountId);
    await database.end();
    
    if (!foundUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(foundUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/:accountId/stats', async (req, res) => {
  try {
    const { accountId } = req.params;
    const database = await getRequestConnection();
    const stats = await MistTrackerVulkan.getUserStats(accountId, database);
    await database.end();
    
    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const database = await getRequestConnection();
    const users = await MistTrackerVulkan.getAllUsers(database);
    await database.end();
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Session Endpoints ---

app.post('/sessions', verifyToken, async (req, res) => {
  try {
    const { state, timeline } = req.body;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const database = await getRequestConnection();
    
    await MistTrackerVulkan.persistSession(sessionId, req.accountId, state || {}, timeline || 1, database);
    await database.end();
    
    res.status(201).json({
      message: 'Session created',
      sessionId,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/sessions/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const database = await getRequestConnection();
    const session = await MistTrackerVulkan.loadSession(sessionId, database);
    await database.end();
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/sessions/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state } = req.body;
    const database = await getRequestConnection();
    
    // Update session state in CurrentState table
    await database.query(
      'INSERT INTO CurrentState (sessionId, state, timestamp) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE state=?, timestamp=?',
      [sessionId, JSON.stringify(state), new Date(), JSON.stringify(state), new Date()]
    );
    await database.end();
    
    res.json({ 
      message: 'Session updated',
      sessionId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/sessions/:sessionId/restore', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const database = await getRequestConnection();
    const session = await MistTrackerVulkan.loadSession(sessionId, database);
    await database.end();
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      message: 'Session restored',
      session
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Timeline Endpoints (Protected) ---

app.post('/timelines', verifyToken, async (req, res) => {
  try {
    const { value } = req.body;
    
    if (!value) {
      return res.status(400).json({ error: 'Timeline value required' });
    }
    
    const database = await getRequestConnection();
    
    // Add primary line (timeline entry)
    await database.query(
      'INSERT INTO PrimaryLine (value) VALUES (?)',
      [value]
    );
    
    const [result] = await database.query(
      'SELECT LAST_INSERT_ID() as id'
    );

    const timelineId = result[0].id;

    // Phase 14: Initialize builder config for new timeline
    // Empty atoms/emitters by default, client can populate
    const initialConfig = {
      atoms: [],
      emitters: [],
      simulationParams: {}
    };

    try {
      await database.query(
        `INSERT INTO builder_configs (timeline_id, config) 
         VALUES (?, ?)`,
        [timelineId, JSON.stringify(initialConfig)]
      );
      console.log(`✓ Initialized builder_config for timeline ${timelineId}`);
    } catch (configErr) {
      console.warn(`Failed to initialize builder_config: ${configErr.message}`);
      // Don't fail timeline creation if config initialization fails
    }

    await database.end();
    
    res.status(201).json({
      message: 'Timeline created',
      timeline: { id: timelineId, value }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/timelines', verifyToken, async (req, res) => {
  try {
    const database = await getRequestConnection();
    
    // List all timelines
    const [rows] = await database.query('SELECT * FROM PrimaryLine');
    await database.end();
    
    res.json({ 
      count: rows.length,
      timelines: rows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/timelines/:timelineId', verifyToken, async (req, res) => {
  try {
    const { timelineId } = req.params;
    const database = await getRequestConnection();
    
    const [rows] = await database.query(
      'SELECT * FROM PrimaryLine WHERE id = ?',
      [timelineId]
    );
    await database.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Timeline not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Builder Config Endpoints (Protected) ---

// Get config version history
app.get('/timelines/:id/builder-config/versions', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;
    
    const versions = await provenanceTracker.getConfigVersionHistory(id, limit ? parseInt(limit) : 50);
    
    res.json({
      timelineId: id,
      versions: versions.map(v => ({
        versionId: v.versionId,
        timestamp: v.timestamp,
        userId: v.userId,
        changeReason: v.changeReason,
        diff: v.diff
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore builder config to previous version
app.post('/timelines/:id/builder-config/restore', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { versionId } = req.body;
    
    if (!versionId) {
      return res.status(400).json({ error: 'versionId required' });
    }
    
    const userId = req.user ? req.user.id : 'anonymous';
    const restoredConfig = await provenanceTracker.restoreConfigVersion(id, versionId, userId);
    
    const database = await getRequestConnection();
    await database.query(
      'UPDATE builder_configs SET config = ? WHERE timeline_id = ?',
      [JSON.stringify(restoredConfig), id]
    );
    await database.end();
    
    res.json({
      message: 'Config restored successfully',
      timelineId: id,
      restoredTo: versionId,
      config: restoredConfig
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/timelines/:id/builder-config', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const database = await getRequestConnection();
    
    // Verify timeline exists
    const [timelineRows] = await database.query(
      'SELECT id FROM PrimaryLine WHERE id = ?',
      [id]
    );
    
    if (timelineRows.length === 0) {
      await database.end();
      return res.status(404).json({ error: 'Timeline not found' });
    }
    
    // Get builder config for this timeline
    const [configRows] = await database.query(
      'SELECT config, updated_at FROM builder_configs WHERE timeline_id = ?',
      [id]
    );

    if (configRows.length === 0) {
      await database.end();
      return res.status(404).json({ error: 'No builder config found for this timeline' });
    }
    
    const configRow = configRows[0];
    let parsedConfig = {};
    
    try {
      parsedConfig = typeof configRow.config === 'string' 
        ? JSON.parse(configRow.config) 
        : configRow.config;
    } catch (parseErr) {
      console.warn(`Failed to parse builder config for timeline ${id}:`, parseErr.message);
      parsedConfig = {
        atoms: [],
        emitters: [],
        simulationParams: {}
      };
    }

    await database.end();
    
    res.json({
      timelineId: id,
      config: parsedConfig,
      updatedAt: configRow.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/timelines/:id/builder-config', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({ error: 'config required in request body' });
    }
    
    // Validate builder config schema
    const validation = validateBuilderConfig(config);
    if (!validation.valid) {
      console.error(`❌ Builder config validation failed for timeline ${id}:`, validation.errors);
      return res.status(400).json({
        error: 'Builder config validation failed',
        details: validation.errors
      });
    }
    
    const database = await getRequestConnection();
    
    // Verify timeline exists
    const [timelineRows] = await database.query(
      'SELECT id FROM PrimaryLine WHERE id = ?',
      [id]
    );
    
    if (timelineRows.length === 0) {
      await database.end();
      return res.status(404).json({ error: 'Timeline not found' });
    }
    
    // Get previous config for version history
    const [prevConfigRows] = await database.query(
      'SELECT config FROM builder_configs WHERE timeline_id = ?',
      [id]
    );
    
    const previousConfig = prevConfigRows.length > 0 
      ? prevConfigRows[0].config  // mysql2 already parses JSON columns into objects
      : null;
    
    // Upsert builder config
    const configJSON = JSON.stringify(config);
    await database.query(
      `INSERT INTO builder_configs (timeline_id, config, created_at, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE config = VALUES(config), updated_at = CURRENT_TIMESTAMP`,
      [id, configJSON]
    );
    
    // Record config change in provenance tracker
    const userId = req.user ? req.user.id : 'anonymous';
    const configVersion = await provenanceTracker.recordConfigChange(
      id,
      userId,
      previousConfig,
      config,
      'rest_api_update'
    );
    
    const [result] = await database.query(
      'SELECT updated_at FROM builder_configs WHERE timeline_id = ?',
      [id]
    );
    await database.end();
    
    res.status(200).json({
      message: 'Builder config saved successfully',
      timelineId: id,
      updatedAt: result[0]?.updated_at || new Date().toISOString(),
      versionId: configVersion.versionId,
      changesSummary: configVersion.diff
    });
  } catch (err) {
    console.error(`❌ Builder config PUT 500 error for timeline ${req.params?.id}:`, err.message, err.stack?.split('\n').slice(0,3));
    res.status(500).json({ error: err.message });
  }
});

// --- Category Endpoints (Protected) ---

app.post('/categories', verifyToken, async (req, res) => {
  try {
    const { timelineId, category } = req.body;
    
    if (!timelineId || !category) {
      return res.status(400).json({ error: 'timelineId and category required' });
    }
    
    const database = await getRequestConnection();
    
    // Add category to timeline
    await database.query(
      'INSERT INTO CategoryLine (primaryLineId, category) VALUES (?, ?)',
      [timelineId, category]
    );
    
    const [result] = await database.query(
      'SELECT LAST_INSERT_ID() as id'
    );
    await database.end();
    
    res.status(201).json({
      message: 'Category created',
      category: { id: result[0].id, timelineId, category }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/categories/:timelineId', verifyToken, async (req, res) => {
  try {
    const { timelineId } = req.params;
    const database = await getRequestConnection();
    
    const [rows] = await database.query(
      'SELECT * FROM CategoryLine WHERE primaryLineId = ?',
      [timelineId]
    );
    await database.end();
    
    res.json({ 
      count: rows.length,
      categories: rows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Item Endpoints (Protected) ---

app.post('/items', verifyToken, async (req, res) => {
  try {
    const { categoryId, itemValue } = req.body;
    
    if (!categoryId || !itemValue) {
      return res.status(400).json({ error: 'categoryId and itemValue required' });
    }
    
    const database = await getRequestConnection();
    
    // Add item to category
    await database.query(
      'INSERT INTO ItemLine (categoryLineId, itemValue) VALUES (?, ?)',
      [categoryId, itemValue]
    );
    
    const [result] = await database.query(
      'SELECT LAST_INSERT_ID() as id'
    );
    await database.end();
    
    res.status(201).json({
      message: 'Item created',
      item: { id: result[0].id, categoryId, itemValue }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/items/:categoryId', verifyToken, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const database = await getRequestConnection();
    
    const [rows] = await database.query(
      'SELECT * FROM ItemLine WHERE categoryLineId = ?',
      [categoryId]
    );
    await database.end();
    
    res.json({ 
      count: rows.length,
      items: rows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Data Analysis Endpoints ---

app.get('/anomalies/:timelineId', verifyToken, async (req, res) => {
  try {
    const { timelineId } = req.params;
    const database = await getRequestConnection();
    
    // Simple anomaly detection: look for items with unusual patterns
    const [items] = await database.query(`
      SELECT i.*, c.category, p.value as timeline
      FROM ItemLine i
      JOIN CategoryLine c ON i.categoryLineId = c.id
      JOIN PrimaryLine p ON c.primaryLineId = p.id
      WHERE c.primaryLineId = ?
      ORDER BY i.id DESC
    `, [timelineId]);
    await database.end();
    
    // Basic anomaly detection (simplified)
    const anomalies = items.filter((item, idx) => {
      if (item.itemValue && item.itemValue.length > 500) {
        return true; // Unusually long item
      }
      if (idx > 0 && Math.abs(item.id - items[idx - 1].id) > 100) {
        return true; // Large gap in IDs
      }
      return false;
    });
    
    res.json({ 
      timelineId,
      totalItems: items.length,
      anomalies: anomalies,
      anomalyCount: anomalies.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/milestones/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const database = await getRequestConnection();
    
    // Get user milestones
    const [rows] = await database.query(
      'SELECT * FROM user_milestones WHERE user_id = ?',
      [userId]
    );
    await database.end();
    
    let milestones = [];
    if (rows.length > 0 && rows[0].milestone_data) {
      try {
        milestones = JSON.parse(rows[0].milestone_data);
      } catch (e) {
        // Milestone data not valid JSON
      }
    }
    
    res.json({
      userId,
      milestones,
      count: milestones.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Error Handling ---

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Server Startup ---

async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Create HTTP server for both REST API and WebSocket
    const httpServer = createServer(app);
    
    // Create WebSocket server
    wss = new WebSocketServer({ noServer: true });
    
    // WebSocket connection handling
    httpServer.on('upgrade', (request, socket, head) => {
      try {
        // Verify JWT token from query string or headers
        const url = new URL(request.url, `http://${request.headers.host}`);
        const token = url.searchParams.get('token');
        
        if (!token) {
          socket.destroy();
          return;
        }
        
        // Verify JWT token
        let decoded;
        try {
          decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
          console.error('✗ WebSocket auth failed:', err.message);
          socket.destroy();
          return;
        }
        
        // Accept the connection
        wss.handleUpgrade(request, socket, head, (ws) => {
          const userId = decoded.userId;
          const connectionId = `${userId}-${Date.now()}`;
          
          // Attach metadata to WebSocket connection
          ws.userId = userId;
          ws.sessionToken = token;
          ws.connectionId = connectionId;
          ws.isAlive = true;
          
          // Track connection
          clientConnections.set(userId, {
            ws,
            sessionToken: token,
            lastSeen: Date.now()
          });
          
          console.log(`✓ WebSocket client connected: ${userId} (${connectionId})`);
          
          // Send hello message
          ws.send(JSON.stringify(createHelloMessage(userId, connectionId)));
          
          // Broadcast presence to all clients
          broadcastPresence(userId, 'online');
          
          // Message handler
          ws.on('message', async (data) => {
            try {
              const parsed = parseMessage(data);
              if (!parsed.success) {
                ws.send(JSON.stringify({
                  type: MessageTypes.ERROR,
                  errorCode: 'PARSE_ERROR',
                  errorMessage: parsed.error,
                  timestamp: Date.now()
                }));
                return;
              }
              
              const validation = validateMessage(parsed.data);
              if (!validation.isValid) {
                ws.send(JSON.stringify({
                  type: MessageTypes.ERROR,
                  errorCode: 'VALIDATION_ERROR',
                  errorMessage: 'Message validation failed',
                  details: validation.errors,
                  timestamp: Date.now()
                }));
                return;
              }
              
              const message = parsed.data;
              
              // Record in provenance tracker BEFORE processing (captures accurate timing)
              const messageReceivedTime = new Date().toISOString();
              await provenanceTracker.recordAction(
                message.type,
                userId,
                token,
                { messageType: message.type, itemId: message.itemId },
                messageReceivedTime
              );
              
              // Rate limiting
              const messageSize = JSON.stringify(message).length;
              const rateLimitCheck = rateLimiter.canSendMessage(userId, messageSize);
              if (!rateLimitCheck.allowed) {
                ws.send(JSON.stringify({
                  type: MessageTypes.RATE_LIMIT,
                  userId: userId,
                  retryAfterMs: rateLimitCheck.retryAfterMs,
                  currentUsage: rateLimitCheck.usage.bytesSent,
                  limit: rateLimitCheck.limit,
                  timestamp: Date.now()
                }));
                return;
              }
              
              // Handle different message types
              await handleWebSocketMessage(message, ws);
              
              // Broadcast to all other clients except sender
              broadcastToOthers(ws, message);
              
            } catch (err) {
              console.error('✗ WebSocket message error:', err.message);
              ws.send(JSON.stringify({
                type: MessageTypes.ERROR,
                errorCode: 'PROCESSING_ERROR',
                errorMessage: err.message,
                timestamp: Date.now()
              }));
            }
          });
          
          // Keepalive
          ws.on('pong', () => {
            ws.isAlive = true;
          });
          
          // Disconnection
          ws.on('close', () => {
            console.log(`✓ WebSocket client disconnected: ${userId}`);
            clientConnections.delete(userId);
            
            // Remove from P2P mesh
            p2pHandler.removePeer(userId);
            
            broadcastPresence(userId, 'offline');
          });
          
          // Error handling
          ws.on('error', (err) => {
            console.error(`✗ WebSocket error for ${userId}:`, err.message);
          });
        });
        
      } catch (err) {
        console.error('✗ WebSocket upgrade error:', err.message);
        socket.destroy();
      }
    });
    
    // Keepalive interval
    const keepaliveInterval = setInterval(() => {
      if (wss) {
        wss.clients.forEach((ws) => {
          if (ws.isAlive === false) {
            return ws.terminate();
          }
          ws.isAlive = false;
          ws.ping();
        });
      }
    }, 30000);
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`\n=== MistTracker REST API + WebSocket Server (Sprint 3 + Phase 1) ===`);
      console.log(`✓ HTTP Server running on http://localhost:${PORT}`);
      console.log(`✓ WebSocket Server ready at ws://localhost:${PORT}`);
      console.log(`✓ Database: Connected and initialized`);
      console.log(`✓ Health check: GET http://localhost:${PORT}/health`);
      console.log(`✓ Real-time sync enabled with conflict resolution`);
      console.log(`✓ Physics Engine: Wave-based simulation with dimensional coupling (Phase 5)`);
      console.log(`\nAPI Documentation: See README-SPRINT3.md\n`);
    });

    // Physics simulation loop (runs every 16ms ~60fps)
    const physicsLoopInterval = setInterval(() => {
      if (!physicsSimulationActive || !wss) return;

      try {
        // Run physics simulation step
        const stepResult = physicsEngine.simulateStep(physicsEngine.config.timeStep);

        // Broadcast physics updates to all connected clients
        const physicsUpdate = {
          type: MessageTypes.PHYSICS_UPDATE,
          geometryUpdates: stepResult.geometryUpdates,
          tensorUpdates: stepResult.tensorUpdates,
          statistics: physicsEngine.getStatistics(),
          timestamp: Date.now()
        };

        const updateMessage = JSON.stringify(physicsUpdate);
        wss.clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(updateMessage);
          }
        });

        lastPhysicsUpdateTime = Date.now();
      } catch (err) {
        console.error(`❌ Physics simulation error: ${err.message}`);
      }
    }, physicsUpdateInterval);

    // Cleanup on shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      clearInterval(keepaliveInterval);
      clearInterval(physicsLoopInterval);
      physicsSimulationActive = false;
      if (wss) wss.close();
      httpServer.close();
    });
    
  } catch (err) {
    console.error('✗ Failed to start server:', err.message);
    process.exit(1);
  }
}

/**
 * Handle different WebSocket message types
 */
async function handleWebSocketMessage(message, ws) {
  switch (message.type) {
    case MessageTypes.MUTATION:
      // Handle mutation with conflict detection
      try {
        const conflictResult = conflictHandler.handleMutation({
          itemId: message.itemId,
          userId: message.userId,
          action: message.action,
          value: message.value,
          timestamp: message.timestamp || Date.now()
        });
        
        if (conflictResult.hasConflict) {
          console.log(`⚠️  CONFLICT DETECTED: ${conflictResult.conflicts} concurrent edit(s) on item ${message.itemId}`);
          console.log(`   Resolution: ${conflictResult.resolution.reason}`);
          console.log(`   Winner: ${conflictResult.resolution.winner === 'local' ? message.userId : 'remote'}`);
          
          // Broadcast conflict notification to all clients
          const conflictMessage = new ConflictMessage(
            message.itemId,
            conflictResult.resolution.change,
            conflictResult.conflictingMutations[0],
            'concurrent-edit'
          );
          
          wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify(conflictMessage));
            }
          });
          
          // Log to provenance tracker (already recorded at message entry)
        } else {
          console.log(`📝 Mutation: ${message.action} on item ${message.itemId}`);
        }
        
        // Broadcast mutation to all clients regardless of conflict
        broadcastToOthers(ws, message);
        
        // Log to provenance tracker
        provenanceTracker.recordAction('MUTATION', ws.userId, ws.sessionToken, {
          itemId: message.itemId,
          action: message.action,
          value: message.value
        });

        // Update item-centric scene geometry based on the mutation
        try {
          if (message.action === 'delete') {
            sceneGeometryHandler.updateGeometryFromMutation(message.itemId, { action: 'delete', value: null });
            // Remove from physics engine
            physicsEngine.removeGeometry(message.itemId);
            physicsEngine.removeTensorField(message.itemId);
          } else {
            // Auto-create geometry if it doesn't exist yet
            if (!sceneGeometryHandler.geometries.has(message.itemId)) {
              sceneGeometryHandler.createGeometry(message.itemId, {
                type: 'box',
                position: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                rotation: { x: 0, y: 0, z: 0 },
                color: '#FF6B6B'
              });

              // Register with physics engine for simulation
              physicsEngine.registerGeometry(message.itemId, {
                position: [0, 0, 0],
                mass: 1.0,
                isWaveEmitter: false,
                isWaveAbsorber: true
              });

              // Register coupled tensor field
              physicsEngine.registerTensorField(message.itemId, {
                d0: 0.5,
                d1: 0.5,
                intensity: 1.0,
                frequency: 440,
                geometryItemId: message.itemId
              });
            } else {
              sceneGeometryHandler.updateGeometryFromMutation(message.itemId, {
                action: message.action,
                value: message.value
              });

              // Update physics geometry
              physicsEngine.updateGeometry(message.itemId, {
                position: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1]
              });
            }
          }

          // Broadcast updated scene state to all clients
          const sceneState = sceneGeometryHandler.getSceneState();
          const sceneStateMsg = JSON.stringify({
            type: MessageTypes.SCENE_STATE,
            ...sceneState
          });
          wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
              client.send(sceneStateMsg);
            }
          });
        } catch (geomErr) {
          console.warn(`⚠️  Scene geometry update skipped: ${geomErr.message}`);
        }
      } catch (err) {
        console.error(`❌ Error handling mutation: ${err.message}`);
        const errorMessage = {
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.MUTATION
        };
        ws.send(JSON.stringify(errorMessage));
      }
      break;
      
    case MessageTypes.PRESENCE:
      // Update presence tracking and broadcast to all
      try {
        console.log(`👤 Presence update: ${message.userId} - ${message.status}`);
        
        // Broadcast presence to all clients
        broadcastToOthers(ws, message);
        
        // Log to provenance tracker
        provenanceTracker.recordAction('PRESENCE', ws.userId, ws.sessionToken, {
          status: message.status,
          view: message.currentView
        });
        
        // Send ACK
        ws.send(JSON.stringify({
          type: MessageTypes.ACK,
          messageType: MessageTypes.PRESENCE,
          messageId: message.userId,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error(`❌ Error handling presence: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.PRESENCE
        }));
      }
      break;
      
    case MessageTypes.SYNC_REQUEST:
      // Handle full state sync request
      console.log(`🔄 Sync requested for timeline ${message.timelineId || 'all'}`);
      // TODO: Implement full state sync response
      break;
      
    case MessageTypes.PING:
      // Respond to ping
      ws.send(JSON.stringify(createPongMessage()));
      break;
      
    case MessageTypes.P2P_DISCOVERY:
      // Handle P2P peer discovery
      try {
        // Get list of online users (excluding self)
        const onlineUsers = Array.from(clientConnections.values())
          .map(conn => ({
            userId: conn.ws.userId,
            status: 'online',
            currentView: 'item-editor'
          }))
          .filter(u => u.userId !== message.userId);
        
        // Initialize P2P for this user
        const discovery = p2pHandler.discoverPeer(
          message.userId,
          ws.sessionToken,
          onlineUsers
        );
        
        console.log(`🔐 P2P Discovery: ${discovery.userId} discovered ${discovery.discoveredPeers.length} peers`);
        
        // Send discovery response
        ws.send(JSON.stringify({
          type: MessageTypes.P2P_DISCOVERY,
          userId: message.userId,
          discoveredPeers: discovery.discoveredPeers,
          meshSize: discovery.meshSize,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error(`❌ P2P Discovery error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.P2P_DISCOVERY
        }));
      }
      break;
      
    case MessageTypes.P2P_ENCRYPTED:
      // Handle encrypted P2P message routing
      try {
        const toUserId = message.to;
        const toConnection = Array.from(clientConnections.values())
          .find(conn => conn.ws.userId === toUserId);
        
        if (!toConnection) {
          throw new Error(`Recipient ${toUserId} not connected`);
        }
        
        console.log(`🔒 P2P Encrypted: Message from ${message.from} to ${message.to}`);
        
        // Forward encrypted message to recipient
        toConnection.ws.send(JSON.stringify({
          type: MessageTypes.P2P_ENCRYPTED,
          from: message.from,
          to: message.to,
          encrypted: message.encrypted,
          timestamp: Date.now()
        }));
        
        // Send ACK back to sender
        ws.send(JSON.stringify({
          type: MessageTypes.ACK,
          messageType: MessageTypes.P2P_ENCRYPTED,
          messageId: message.to,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error(`❌ P2P Routing error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.P2P_ENCRYPTED
        }));
      }
      break;
      
    case MessageTypes.P2P_MESH:
      // Get mesh topology for user
      try {
        const topology = p2pHandler.getMeshTopology(message.userId);
        
        console.log(`📡 P2P Mesh: ${topology.userId} has ${topology.meshSize} connected peers (${topology.stability}% stable)`);
        
        ws.send(JSON.stringify({
          type: MessageTypes.P2P_MESH,
          ...topology,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error(`❌ P2P Mesh error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.P2P_MESH
        }));
      }
      break;
      
    case MessageTypes.GEOMETRY_CREATE:
      // Create new 3D geometry
      try {
        const geometry = geometryHandler.createGeometry(
          message.name,
          message.geometryType,
          message.data,
          message.properties
        );
        
        console.log(`🎨 Geometry Created: ${geometry.id} (${message.geometryType})`);
        
        // Send creation response
        ws.send(JSON.stringify({
          type: MessageTypes.GEOMETRY_CREATE,
          geometryId: geometry.id,
          name: geometry.name,
          geometryType: geometry.geometryType,
          timestamp: Date.now()
        }));
        
        // Broadcast creation to all clients
        broadcastToOthers(ws, {
          type: MessageTypes.GEOMETRY_CREATE,
          geometryId: geometry.id,
          name: geometry.name,
          geometryType: message.geometryType,
          data: message.data,
          properties: message.properties,
          createdBy: ws.userId,
          timestamp: Date.now()
        });
        
        // Record in provenance
        provenanceTracker.recordAction('GEOMETRY_CREATE', ws.userId, ws.sessionToken, {
          geometryId: geometry.id,
          geometryType: message.geometryType
        });
      } catch (err) {
        console.error(`❌ Geometry Creation error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.GEOMETRY_CREATE
        }));
      }
      break;
      
    case MessageTypes.GEOMETRY_UPDATE:
      // Update existing 3D geometry
      try {
        const updated = geometryHandler.updateGeometry(
          message.geometryId,
          message.data,
          message.properties
        );
        
        console.log(`🎨 Geometry Updated: ${message.geometryId}`);
        
        // Send update ACK
        ws.send(JSON.stringify({
          type: MessageTypes.ACK,
          messageType: MessageTypes.GEOMETRY_UPDATE,
          geometryId: message.geometryId,
          timestamp: Date.now()
        }));
        
        // Broadcast update to all clients
        broadcastToOthers(ws, {
          type: MessageTypes.GEOMETRY_UPDATE,
          geometryId: message.geometryId,
          data: message.data,
          properties: message.properties,
          updatedBy: ws.userId,
          timestamp: Date.now()
        });
        
        // Record in provenance
        provenanceTracker.recordAction('GEOMETRY_UPDATE', ws.userId, ws.sessionToken, {
          geometryId: message.geometryId,
          updates: Object.keys(message.properties || {})
        });
      } catch (err) {
        console.error(`❌ Geometry Update error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.GEOMETRY_UPDATE
        }));
      }
      break;
      
    case MessageTypes.GEOMETRY_QUERY:
      // Query geometries (filter by type, bounds, etc.)
      try {
        const results = geometryHandler.queryGeometries({
          geometryType: message.geometryType,
          bounds: message.bounds,
          properties: message.properties,
          limit: message.limit || 100
        });
        
        console.log(`🔍 Geometry Query: Found ${results.length} geometries`);
        
        // Send query results
        ws.send(JSON.stringify({
          type: MessageTypes.GEOMETRY_QUERY,
          queryId: message.queryId,
          results: results,
          count: results.length,
          timestamp: Date.now()
        }));
        
        // Record in provenance
        provenanceTracker.recordAction('GEOMETRY_QUERY', ws.userId, ws.sessionToken, {
          geometryType: message.geometryType,
          resultCount: results.length
        });
      } catch (err) {
        console.error(`❌ Geometry Query error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.GEOMETRY_QUERY
        }));
      }
      break;
      
    case MessageTypes.GEOMETRY_DELETE:
      // Delete geometry
      try {
        const deleted = geometryHandler.deleteGeometry(message.geometryId);
        
        console.log(`🗑️  Geometry Deleted: ${message.geometryId}`);
        
        // Send delete ACK
        ws.send(JSON.stringify({
          type: MessageTypes.ACK,
          messageType: MessageTypes.GEOMETRY_DELETE,
          geometryId: message.geometryId,
          timestamp: Date.now()
        }));
        
        // Broadcast deletion to all clients
        broadcastToOthers(ws, {
          type: MessageTypes.GEOMETRY_DELETE,
          geometryId: message.geometryId,
          deletedBy: ws.userId,
          timestamp: Date.now()
        });
        
        // Record in provenance
        provenanceTracker.recordAction('GEOMETRY_DELETE', ws.userId, ws.sessionToken, {
          geometryId: message.geometryId
        });
      } catch (err) {
        console.error(`❌ Geometry Delete error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.GEOMETRY_DELETE
        }));
      }
      break;

    case MessageTypes.TENSOR_CREATE:
      // Create 4D tensor space for a timeline item
      try {
        const tensor = sceneGeometryHandler.createTensorSpace(message.itemId, {
          dimension0: message.d0,
          dimension1: message.d1,
          intensity: message.intensity || 1.0,
          frequency: message.frequency || 1.0,
          phase: message.phase || 0
        });

        console.log(`🌀 Tensor Created: ${message.itemId}`);

        ws.send(JSON.stringify({
          type: MessageTypes.TENSOR_CREATE,
          itemId: message.itemId,
          tensor,
          timestamp: Date.now()
        }));

        // Broadcast to other clients
        broadcastToOthers(ws, {
          type: MessageTypes.TENSOR_CREATE,
          itemId: message.itemId,
          d0: message.d0,
          d1: message.d1,
          intensity: message.intensity,
          frequency: message.frequency,
          phase: message.phase,
          createdBy: ws.userId,
          timestamp: Date.now()
        });

        provenanceTracker.recordAction('TENSOR_CREATE', ws.userId, ws.sessionToken, {
          itemId: message.itemId
        });
      } catch (err) {
        console.error(`❌ Tensor Create error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.TENSOR_CREATE
        }));
      }
      break;

    case MessageTypes.SCENE_STATE:
      // Respond with full scene state snapshot
      try {
        const sceneState = sceneGeometryHandler.getSceneState();

        console.log(`🎬 Scene State requested by ${ws.userId}: ${sceneState.totalItems} items`);

        ws.send(JSON.stringify({
          type: MessageTypes.SCENE_STATE,
          ...sceneState
        }));

        provenanceTracker.recordAction('SCENE_STATE_REQUEST', ws.userId, ws.sessionToken, {
          totalItems: sceneState.totalItems
        });
      } catch (err) {
        console.error(`❌ Scene State error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.SCENE_STATE
        }));
      }
      break;

    case MessageTypes.PHYSICS_CONFIG:
      // Configure physics engine parameters
      try {
        const config = {
          timeStep: message.timeStep,
          gravityStrength: message.gravityStrength,
          lightSpeed: message.lightSpeed,
          waveSpeedMultiplier: message.waveSpeedMultiplier,
          dimensionalCouplingStrength: message.dimensionalCouplingStrength
        };

        // Filter out undefined values
        Object.keys(config).forEach(key => config[key] === undefined && delete config[key]);

        physicsEngine.setConfig(config);
        console.log(`⚙️  Physics Config updated: ${JSON.stringify(config)}`);

        ws.send(JSON.stringify({
          type: MessageTypes.ACK,
          messageType: MessageTypes.PHYSICS_CONFIG,
          config: physicsEngine.getConfig(),
          timestamp: Date.now()
        }));

        provenanceTracker.recordAction('PHYSICS_CONFIG', ws.userId, ws.sessionToken, { config });
      } catch (err) {
        console.error(`❌ Physics Config error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.PHYSICS_CONFIG
        }));
      }
      break;

    case MessageTypes.WAVE_EMITTER:
      // Create or update a wave emitter (light, gravity, quantum)
      try {
        const emitter = physicsEngine.createWaveEmitter(message.emitterId, {
          type: message.emitterType || 'light',
          position: message.position || [0, 0, 0],
          frequency: message.frequency || 440,
          amplitude: message.amplitude || 1.0,
          intensity: message.intensity || 1.0,
          isActive: message.isActive !== false
        });

        console.log(`🌊 Wave Emitter created: ${message.emitterId} (${message.emitterType})`);

        // Broadcast to all clients
        broadcastToOthers(ws, {
          type: MessageTypes.WAVE_EMITTER,
          emitterId: message.emitterId,
          emitterType: message.emitterType,
          position: message.position,
          frequency: message.frequency,
          amplitude: message.amplitude,
          intensity: message.intensity,
          timestamp: Date.now()
        });

        ws.send(JSON.stringify({
          type: MessageTypes.ACK,
          messageType: MessageTypes.WAVE_EMITTER,
          emitterId: message.emitterId,
          timestamp: Date.now()
        }));

        provenanceTracker.recordAction('WAVE_EMITTER_CREATE', ws.userId, ws.sessionToken, {
          emitterId: message.emitterId,
          type: message.emitterType
        });
      } catch (err) {
        console.error(`❌ Wave Emitter error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.WAVE_EMITTER
        }));
      }
      break;

    case MessageTypes.DIMENSIONAL_COUPLING:
      // Enable/disable dimensional coupling between 3D and 4D
      try {
        physicsEngine.setCouplingEnabled(message.enabled);
        physicsEngine.config.dimensionalCouplingStrength = message.couplingStrength || 0.5;

        console.log(`🔗 Dimensional Coupling: ${message.enabled ? 'ENABLED' : 'DISABLED'} (strength: ${message.couplingStrength})`);

        // Broadcast to all clients
        broadcastToOthers(ws, {
          type: MessageTypes.DIMENSIONAL_COUPLING,
          enabled: message.enabled,
          couplingStrength: message.couplingStrength,
          timestamp: Date.now()
        });

        ws.send(JSON.stringify({
          type: MessageTypes.ACK,
          messageType: MessageTypes.DIMENSIONAL_COUPLING,
          enabled: message.enabled,
          timestamp: Date.now()
        }));

        provenanceTracker.recordAction('DIMENSIONAL_COUPLING_CHANGE', ws.userId, ws.sessionToken, {
          enabled: message.enabled,
          strength: message.couplingStrength
        });
      } catch (err) {
        console.error(`❌ Dimensional Coupling error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.DIMENSIONAL_COUPLING
        }));
      }
      break;

    case MessageTypes.PHYSICS_STATE:
      // Respond with full physics state snapshot
      try {
        const physicsState = physicsEngine.getCoupledState();

        console.log(`📊 Physics State requested: ${physicsState.geometries.length} geometries, ${physicsState.tensorFields.length} tensors`);

        ws.send(JSON.stringify({
          type: MessageTypes.PHYSICS_STATE,
          geometries: physicsState.geometries,
          tensorFields: physicsState.tensorFields,
          waveEmitters: physicsState.waveEmitters,
          statistics: physicsState.stats,
          simulationTime: physicsState.simulationTime,
          timestamp: Date.now()
        }));

        provenanceTracker.recordAction('PHYSICS_STATE_REQUEST', ws.userId, ws.sessionToken, {
          geometryCount: physicsState.geometries.length,
          tensorCount: physicsState.tensorFields.length
        });
      } catch (err) {
        console.error(`❌ Physics State error: ${err.message}`);
        ws.send(JSON.stringify({
          type: MessageTypes.ERROR,
          error: err.message,
          originalType: MessageTypes.PHYSICS_STATE
        }));
      }
      break;

    case 'registerAtom': {
      // Phase 5.3: Register timeline item as atom in physics engine
      try {
        const atomConfig = message.data;
        if (!atomConfig || !atomConfig.atomType) {
          throw new Error('Invalid atom configuration: missing atomType');
        }

        const itemId = `atom-${atomConfig.name}-${Date.now()}`;
        
        // Register geometry with electron cloud configuration
        physicsEngine.registerGeometry(
          itemId,
          {
            position: [0, 0, 0],
            mass: 1.0,
            amplitude: 1.0,
            frequency: 440,
            isWaveEmitter: false,
            isWaveAbsorber: false
          },
          atomConfig  // Pass electron cloud configuration
        );

        console.log(`⚛️  Physics: Registered ${atomConfig.name} atom (${itemId}) with ${atomConfig.electronClouds?.length || 0} electron clouds`);

        // Send confirmation to client
        ws.send(JSON.stringify({
          type: 'atomRegistered',
          itemId: itemId,
          atomType: atomConfig.atomType,
          name: atomConfig.name,
          timestamp: Date.now()
        }));

        // Record action for provenance
        provenanceTracker.recordAction('ATOM_REGISTERED', ws.userId, ws.sessionToken, {
          itemId: itemId,
          atomType: atomConfig.atomType,
          electronClouds: atomConfig.electronClouds?.length || 0
        });
      } catch (err) {
        console.error(`❌ Atom registration error: ${err.message}`);
        ws.send(JSON.stringify({
          type: 'error',
          message: `Failed to register atom: ${err.message}`,
          originalType: 'registerAtom'
        }));
      }
      break;
    }

  }
}

/**
 * Broadcast presence change to all connected clients
 */
function broadcastPresence(userId, status) {
  if (!wss) return;
  
  const presenceMessage = {
    type: MessageTypes.PRESENCE,
    userId: userId,
    status: status,
    timestamp: Date.now()
  };
  
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(presenceMessage));
    }
  });
}

/**
 * Broadcast message to all clients except the sender
 */
function broadcastToOthers(senderWs, message) {
  if (!wss) return;
  
  const messageStr = JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === client.OPEN) {
      client.send(messageStr);
    }
  });
}

startServer();

export default app;
