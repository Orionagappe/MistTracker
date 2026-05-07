/**
 * Database Schema Definitions
 * Phase 17.2.4: Database Integration
 * 
 * Defines MongoDB/PostgreSQL schemas for:
 * - Milestones persistence
 * - Training sessions
 * - Users and authentication
 * - API keys and access control
 */

// ============================================================================
// MILESTONE SCHEMA
// ============================================================================

export const milestoneSchema = {
  _id: { type: String, primary: true },           // UUID
  node_id: { type: String, required: true },      // node-1, node-2, etc.
  session_id: { type: String, required: true, index: true },
  atom: { type: String, required: true, index: true }, // H, He, Li, Be, B
  epoch: { type: Number, required: true },
  loss: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  timestamp: { type: Date, required: true, index: true, default: () => new Date() },
  metadata: {
    training_elapsed_ms: Number,
    batch_count: Number,
    learning_rate: Number,
    batch_size: Number,
    custom_fields: Object,
  },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
};

// Indexes for optimal query performance
export const milestoneIndexes = [
  { fields: { session_id: 1 } },
  { fields: { session_id: 1, atom: 1 } },
  { fields: { session_id: 1, epoch: 1 } },
  { fields: { timestamp: 1 } },
  { fields: { atom: 1, timestamp: 1 } },
];

// ============================================================================
// TRAINING SESSION SCHEMA
// ============================================================================

export const trainingSessionSchema = {
  _id: { type: String, primary: true },           // UUID
  user_id: { type: String, required: true, index: true },
  coordinator_id: { type: String, required: true },
  atoms: { type: Array, required: true },         // ["H", "He", "Li", "Be", "B"]
  config: {
    epochs: { type: Number, default: 100 },
    batch_size: { type: Number, default: 32 },
    learning_rate: { type: Number, default: 0.001 },
    validation_split: { type: Number, default: 0.2 },
    custom_config: Object,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'stopped', 'failed'],
    default: 'pending',
    index: true,
  },
  metrics: {
    total_epochs_completed: { type: Number, default: 0 },
    final_accuracy: Number,
    final_loss: Number,
    avg_accuracy: Number,
    avg_loss: Number,
    best_accuracy: Number,
    worst_accuracy: Number,
    convergence_epoch: Number,
    convergence_time_ms: Number,
  },
  node_statuses: {
    type: Object,
    default: {},
  },
  started_at: { type: Date, required: true, index: true },
  ended_at: Date,
  duration_ms: Number,
  milestone_count: { type: Number, default: 0 },
  error_message: String,
  tags: { type: Array, default: [] },             // For organization/filtering
  notes: String,
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
};

export const trainingSessionIndexes = [
  { fields: { user_id: 1 } },
  { fields: { user_id: 1, status: 1 } },
  { fields: { user_id: 1, started_at: 1 } },
  { fields: { status: 1 } },
  { fields: { started_at: 1 } },
];

// ============================================================================
// USER SCHEMA
// ============================================================================

export const userSchema = {
  _id: { type: String, primary: true },           // UUID
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'developer', 'viewer', 'analyst'],
    default: 'developer',
    index: true,
  },
  permissions: {
    type: Array,
    default: ['read:metrics', 'read:sessions', 'read:milestones'],
    // admin gets all
    // developer gets: create_session, read_*, write_own_sessions
    // viewer gets: read_*
    // analyst gets: read_*, analyze_*
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  api_keys: { type: Array, default: [] },        // Array of key IDs
  settings: {
    theme: { type: String, default: 'dark' },
    notifications_enabled: { type: Boolean, default: true },
    email_on_convergence: { type: Boolean, default: true },
    email_on_error: { type: Boolean, default: true },
    custom_settings: Object,
  },
  last_login: Date,
  login_count: { type: Number, default: 0 },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
};

export const userIndexes = [
  { fields: { username: 1 }, unique: true },
  { fields: { email: 1 }, unique: true },
  { fields: { role: 1 } },
];

// ============================================================================
// API KEY SCHEMA
// ============================================================================

export const apiKeySchema = {
  _id: { type: String, primary: true },           // UUID
  user_id: { type: String, required: true, index: true },
  key_hash: { type: String, required: true, unique: true }, // Hashed key
  key_prefix: { type: String, required: true },   // First 8 chars, shown to user
  name: { type: String, required: true },
  description: String,
  permissions: { type: Array, default: [] },
  rate_limit_per_hour: { type: Number, default: 1000 },
  last_used: Date,
  usage_count: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive', 'revoked'],
    default: 'active',
  },
  expires_at: Date,
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
};

export const apiKeyIndexes = [
  { fields: { user_id: 1 } },
  { fields: { key_hash: 1 }, unique: true },
  { fields: { status: 1 } },
];

// ============================================================================
// EXPORT RECORD SCHEMA
// ============================================================================

export const exportRecordSchema = {
  _id: { type: String, primary: true },           // UUID
  user_id: { type: String, required: true, index: true },
  session_id: { type: String, required: true },
  export_type: {
    type: String,
    enum: ['csv', 'pdf', 'json', 'excel'],
    required: true,
  },
  format_options: {
    include_metadata: { type: Boolean, default: true },
    include_statistics: { type: Boolean, default: true },
    atom_filter: Array,                            // Array of atoms to include
    date_range: {
      start: Date,
      end: Date,
    },
  },
  file_path: String,
  file_size_bytes: Number,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  download_count: { type: Number, default: 0 },
  expires_at: Date,
  error_message: String,
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
};

export const exportRecordIndexes = [
  { fields: { user_id: 1 } },
  { fields: { user_id: 1, created_at: 1 } },
  { fields: { status: 1 } },
  { fields: { expires_at: 1 } },
];

// ============================================================================
// AUDIT LOG SCHEMA
// ============================================================================

export const auditLogSchema = {
  _id: { type: String, primary: true },           // UUID
  user_id: { type: String, required: true, index: true },
  action: { type: String, required: true },       // 'CREATE_SESSION', 'DELETE_SESSION', etc.
  resource_type: String,                          // 'session', 'export', 'user', etc.
  resource_id: String,
  changes: {
    before: Object,
    after: Object,
  },
  ip_address: String,
  user_agent: String,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
  error_message: String,
  timestamp: { type: Date, default: () => new Date(), index: true },
  created_at: { type: Date, default: () => new Date() },
};

export const auditLogIndexes = [
  { fields: { user_id: 1 } },
  { fields: { user_id: 1, timestamp: 1 } },
  { fields: { action: 1 } },
  { fields: { resource_type: 1 } },
  { fields: { timestamp: 1 } },
];

// ============================================================================
// SCHEMA MIGRATIONS
// ============================================================================

export const schemaMigrations = [
  {
    version: 1,
    name: 'initial_schema',
    collections: ['milestones', 'training_sessions', 'users', 'api_keys', 'exports', 'audit_logs'],
    description: 'Initial database schema creation',
    up: async (db) => {
      // Create collections with schema validation
      // Implementation in database provider
    },
    down: async (db) => {
      // Drop collections
      // Implementation in database provider
    },
  },
];

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export function validateMilestoneData(data) {
  if (!data.node_id || !data.session_id || !data.atom) {
    throw new Error('Missing required milestone fields');
  }
  if (typeof data.epoch !== 'number' || data.epoch < 0) {
    throw new Error('Invalid epoch number');
  }
  if (typeof data.loss !== 'number' || data.loss < 0) {
    throw new Error('Invalid loss value');
  }
  if (typeof data.accuracy !== 'number' || data.accuracy < 0 || data.accuracy > 1) {
    throw new Error('Invalid accuracy value (must be 0-1)');
  }
  return true;
}

export function validateSessionData(data) {
  if (!data.user_id || !Array.isArray(data.atoms)) {
    throw new Error('Missing required session fields');
  }
  if (!Array.isArray(data.atoms) || data.atoms.length === 0) {
    throw new Error('Session must have at least one atom');
  }
  return true;
}

export function validateUserData(data) {
  if (!data.username || !data.email || !data.password_hash) {
    throw new Error('Missing required user fields');
  }
  if (data.username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  if (!data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const allSchemas = {
  milestone: milestoneSchema,
  trainingSession: trainingSessionSchema,
  user: userSchema,
  apiKey: apiKeySchema,
  exportRecord: exportRecordSchema,
  auditLog: auditLogSchema,
};

export const allIndexes = {
  milestone: milestoneIndexes,
  trainingSession: trainingSessionIndexes,
  user: userIndexes,
  apiKey: apiKeyIndexes,
  exportRecord: exportRecordIndexes,
  auditLog: auditLogIndexes,
};
