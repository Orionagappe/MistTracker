/**
 * Database Connection and Utilities
 * Phase 17.2.4: Database Integration
 * 
 * Handles:
 * - Database connection (MongoDB and PostgreSQL support)
 * - Connection pooling
 * - Migration management
 * - Query utilities
 * - Transaction support
 */

import { MongoClient, Db } from 'mongodb';
import { Client } from 'pg';
import * as schema from './schema.js';

// ============================================================================
// DATABASE FACTORY
// ============================================================================

class DatabaseProvider {
  constructor(config) {
    this.config = config;
    this.provider = config.provider || 'mongodb'; // mongodb or postgresql
    this.connection = null;
    this.db = null;
  }

  async connect() {
    if (this.provider === 'mongodb') {
      await this.connectMongoDB();
    } else if (this.provider === 'postgresql') {
      await this.connectPostgreSQL();
    } else {
      throw new Error(`Unsupported database provider: ${this.provider}`);
    }

    console.log(`✅ Connected to ${this.provider} database`);
  }

  async connectMongoDB() {
    const uri = this.config.uri || 'mongodb://localhost:27017';
    const dbName = this.config.database || 'misttracker';

    this.connection = new MongoClient(uri);
    await this.connection.connect();
    this.db = this.connection.db(dbName);

    // Create indexes
    await this.createIndexes();
  }

  async connectPostgreSQL() {
    this.connection = new Client({
      host: this.config.host || 'localhost',
      port: this.config.port || 5432,
      database: this.config.database || 'misttracker',
      user: this.config.user || 'postgres',
      password: this.config.password || 'password',
    });

    await this.connection.connect();
    this.db = this.connection;

    // Create tables
    await this.createTables();
  }

  async disconnect() {
    if (this.connection) {
      if (this.provider === 'mongodb') {
        await this.connection.close();
      } else if (this.provider === 'postgresql') {
        await this.connection.end();
      }
      console.log(`✅ Disconnected from ${this.provider} database`);
    }
  }

  async createIndexes() {
    if (this.provider !== 'mongodb') return;

    for (const [collectionName, indexes] of Object.entries(schema.allIndexes)) {
      const collection = this.db.collection(collectionName);
      for (const indexSpec of indexes) {
        await collection.createIndex(indexSpec.fields, {
          unique: indexSpec.unique || false,
        });
      }
      console.log(`✅ Created indexes for ${collectionName}`);
    }
  }

  async createTables() {
    if (this.provider !== 'postgresql') return;

    const tables = [
      `CREATE TABLE IF NOT EXISTS milestones (
        id VARCHAR(36) PRIMARY KEY,
        node_id VARCHAR(50) NOT NULL,
        session_id VARCHAR(36) NOT NULL,
        atom VARCHAR(5) NOT NULL,
        epoch INTEGER NOT NULL,
        loss DECIMAL(10, 8) NOT NULL,
        accuracy DECIMAL(10, 8) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS training_sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        coordinator_id VARCHAR(36) NOT NULL,
        atoms TEXT[] NOT NULL,
        config JSONB NOT NULL,
        status VARCHAR(20) NOT NULL,
        metrics JSONB,
        started_at TIMESTAMP NOT NULL,
        ended_at TIMESTAMP,
        duration_ms INTEGER,
        milestone_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        permissions TEXT[] NOT NULL,
        status VARCHAR(20) NOT NULL,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS api_keys (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        key_hash VARCHAR(255) UNIQUE NOT NULL,
        key_prefix VARCHAR(20) NOT NULL,
        name VARCHAR(255) NOT NULL,
        permissions TEXT[] NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS exports (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        session_id VARCHAR(36) NOT NULL,
        export_type VARCHAR(20) NOT NULL,
        file_path VARCHAR(500),
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(36),
        status VARCHAR(20),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const sql of tables) {
      await this.connection.query(sql);
    }

    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_milestones_session ON milestones(session_id)`,
      `CREATE INDEX IF NOT EXISTS idx_milestones_timestamp ON milestones(timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user ON training_sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_status ON training_sessions(status)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_apikeys_user ON api_keys(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_exports_user ON exports(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)`,
    ];

    for (const sql of indexes) {
      await this.connection.query(sql);
    }

    console.log('✅ Created PostgreSQL tables and indexes');
  }

  // ========================================================================
  // MILESTONE OPERATIONS
  // ========================================================================

  async insertMilestone(milestoneData) {
    schema.validateMilestoneData(milestoneData);

    if (this.provider === 'mongodb') {
      const collection = this.db.collection('milestones');
      const result = await collection.insertOne(milestoneData);
      return result.insertedId;
    } else if (this.provider === 'postgresql') {
      const result = await this.connection.query(
        `INSERT INTO milestones (id, node_id, session_id, atom, epoch, loss, accuracy, timestamp, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          milestoneData._id,
          milestoneData.node_id,
          milestoneData.session_id,
          milestoneData.atom,
          milestoneData.epoch,
          milestoneData.loss,
          milestoneData.accuracy,
          milestoneData.timestamp,
          JSON.stringify(milestoneData.metadata),
        ]
      );
      return milestoneData._id;
    }
  }

  async getMilestones(query = {}) {
    const { session_id, atom, epoch_min, epoch_max, date_from, date_to, limit = 1000, skip = 0 } = query;

    if (this.provider === 'mongodb') {
      const collection = this.db.collection('milestones');
      const filter = {};

      if (session_id) filter.session_id = session_id;
      if (atom) filter.atom = atom;
      if (epoch_min || epoch_max) {
        filter.epoch = {};
        if (epoch_min) filter.epoch.$gte = epoch_min;
        if (epoch_max) filter.epoch.$lte = epoch_max;
      }
      if (date_from || date_to) {
        filter.timestamp = {};
        if (date_from) filter.timestamp.$gte = new Date(date_from);
        if (date_to) filter.timestamp.$lte = new Date(date_to);
      }

      return await collection
        .find(filter)
        .sort({ timestamp: 1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    } else if (this.provider === 'postgresql') {
      let sql = 'SELECT * FROM milestones WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (session_id) {
        sql += ` AND session_id = $${paramCount++}`;
        params.push(session_id);
      }
      if (atom) {
        sql += ` AND atom = $${paramCount++}`;
        params.push(atom);
      }
      if (epoch_min) {
        sql += ` AND epoch >= $${paramCount++}`;
        params.push(epoch_min);
      }
      if (epoch_max) {
        sql += ` AND epoch <= $${paramCount++}`;
        params.push(epoch_max);
      }
      if (date_from) {
        sql += ` AND timestamp >= $${paramCount++}`;
        params.push(new Date(date_from));
      }
      if (date_to) {
        sql += ` AND timestamp <= $${paramCount++}`;
        params.push(new Date(date_to));
      }

      sql += ` ORDER BY timestamp ASC LIMIT $${paramCount++} OFFSET $${paramCount}`;
      params.push(limit, skip);

      const result = await this.connection.query(sql, params);
      return result.rows;
    }
  }

  // ========================================================================
  // SESSION OPERATIONS
  // ========================================================================

  async insertSession(sessionData) {
    schema.validateSessionData(sessionData);

    if (this.provider === 'mongodb') {
      const collection = this.db.collection('training_sessions');
      const result = await collection.insertOne(sessionData);
      return result.insertedId;
    } else if (this.provider === 'postgresql') {
      const result = await this.connection.query(
        `INSERT INTO training_sessions (id, user_id, coordinator_id, atoms, config, status, started_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          sessionData._id,
          sessionData.user_id,
          sessionData.coordinator_id,
          sessionData.atoms,
          JSON.stringify(sessionData.config),
          sessionData.status,
          sessionData.started_at,
        ]
      );
      return sessionData._id;
    }
  }

  async updateSession(sessionId, updates) {
    if (this.provider === 'mongodb') {
      const collection = this.db.collection('training_sessions');
      updates.updated_at = new Date();
      await collection.updateOne({ _id: sessionId }, { $set: updates });
    } else if (this.provider === 'postgresql') {
      const fields = Object.keys(updates)
        .filter(k => k !== '_id')
        .map((k, i) => `${k} = $${i + 1}`)
        .join(', ');

      const values = Object.values(updates).filter((_, i) => Object.keys(updates)[i] !== '_id');
      values.push(sessionId);

      await this.connection.query(
        `UPDATE training_sessions SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`,
        values
      );
    }
  }

  async getSessions(query = {}) {
    const { user_id, status, date_from, date_to, limit = 100, skip = 0 } = query;

    if (this.provider === 'mongodb') {
      const collection = this.db.collection('training_sessions');
      const filter = {};

      if (user_id) filter.user_id = user_id;
      if (status) filter.status = status;
      if (date_from || date_to) {
        filter.started_at = {};
        if (date_from) filter.started_at.$gte = new Date(date_from);
        if (date_to) filter.started_at.$lte = new Date(date_to);
      }

      return await collection
        .find(filter)
        .sort({ started_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    } else if (this.provider === 'postgresql') {
      let sql = 'SELECT * FROM training_sessions WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (user_id) {
        sql += ` AND user_id = $${paramCount++}`;
        params.push(user_id);
      }
      if (status) {
        sql += ` AND status = $${paramCount++}`;
        params.push(status);
      }
      if (date_from) {
        sql += ` AND started_at >= $${paramCount++}`;
        params.push(new Date(date_from));
      }
      if (date_to) {
        sql += ` AND started_at <= $${paramCount++}`;
        params.push(new Date(date_to));
      }

      sql += ` ORDER BY started_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
      params.push(limit, skip);

      const result = await this.connection.query(sql, params);
      return result.rows;
    }
  }

  // ========================================================================
  // USER OPERATIONS
  // ========================================================================

  async insertUser(userData) {
    schema.validateUserData(userData);

    if (this.provider === 'mongodb') {
      const collection = this.db.collection('users');
      const result = await collection.insertOne(userData);
      return result.insertedId;
    } else if (this.provider === 'postgresql') {
      await this.connection.query(
        `INSERT INTO users (id, username, email, password_hash, role, permissions, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userData._id,
          userData.username,
          userData.email,
          userData.password_hash,
          userData.role,
          userData.permissions,
          userData.status,
        ]
      );
      return userData._id;
    }
  }

  async getUser(query) {
    if (this.provider === 'mongodb') {
      const collection = this.db.collection('users');
      return await collection.findOne(query);
    } else if (this.provider === 'postgresql') {
      let sql = 'SELECT * FROM users WHERE 1=1';
      const params = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(query)) {
        sql += ` AND ${key} = $${paramCount++}`;
        params.push(value);
      }

      const result = await this.connection.query(sql, params);
      return result.rows[0] || null;
    }
  }

  // ========================================================================
  // EXPORT OPERATIONS
  // ========================================================================

  async insertExport(exportData) {
    if (this.provider === 'mongodb') {
      const collection = this.db.collection('exports');
      const result = await collection.insertOne(exportData);
      return result.insertedId;
    } else if (this.provider === 'postgresql') {
      await this.connection.query(
        `INSERT INTO exports (id, user_id, session_id, export_type, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [exportData._id, exportData.user_id, exportData.session_id, exportData.export_type, exportData.status]
      );
      return exportData._id;
    }
  }

  // ========================================================================
  // AUDIT LOGGING
  // ========================================================================

  async logAudit(auditData) {
    if (this.provider === 'mongodb') {
      const collection = this.db.collection('audit_logs');
      await collection.insertOne(auditData);
    } else if (this.provider === 'postgresql') {
      await this.connection.query(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, status, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          auditData._id,
          auditData.user_id,
          auditData.action,
          auditData.resource_type,
          auditData.resource_id,
          auditData.status,
          auditData.timestamp,
        ]
      );
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let databaseInstance = null;

export async function initializeDatabase(config) {
  if (databaseInstance) {
    return databaseInstance;
  }

  databaseInstance = new DatabaseProvider(config);
  await databaseInstance.connect();
  return databaseInstance;
}

export function getDatabase() {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return databaseInstance;
}

export async function closeDatabaseConnection() {
  if (databaseInstance) {
    await databaseInstance.disconnect();
    databaseInstance = null;
  }
}

export default DatabaseProvider;
