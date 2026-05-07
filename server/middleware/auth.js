/**
 * Authentication & Authorization Middleware
 * Phase 17.2.4: Authentication Integration
 * 
 * Provides:
 * - JWT token generation and validation
 * - API key authentication
 * - Role-based access control (RBAC)
 * - Permission checking
 * - Token refresh logic
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './connection.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
const BCRYPT_ROUNDS = 10;

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

const rolePermissions = {
  admin: [
    'read:metrics',
    'read:sessions',
    'read:milestones',
    'read:users',
    'create:session',
    'update:session',
    'delete:session',
    'manage:users',
    'manage:api_keys',
    'view:audit_logs',
    'export:data',
  ],
  developer: [
    'read:metrics',
    'read:sessions',
    'read:milestones',
    'create:session',
    'update:session:own',
    'delete:session:own',
    'manage:api_keys:own',
    'export:data',
  ],
  analyst: [
    'read:metrics',
    'read:sessions',
    'read:milestones',
    'analyze:data',
    'export:data',
    'view:reports',
  ],
  viewer: [
    'read:metrics',
    'read:sessions',
    'read:milestones',
  ],
};

// ============================================================================
// PASSWORD HASHING
// ============================================================================

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return await bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// ============================================================================
// JWT TOKEN MANAGEMENT
// ============================================================================

export function generateAccessToken(userId, role, permissions) {
  const payload = {
    sub: userId,
    role,
    permissions,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: 'misttracker',
    audience: 'misttracker-api',
  });
}

export function generateRefreshToken(userId) {
  const payload = {
    sub: userId,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'misttracker',
    audience: 'misttracker-api',
  });
}

export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'misttracker',
      audience: 'misttracker-api',
    });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (err) {
    throw new Error(`Token verification failed: ${err.message}`);
  }
}

export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'misttracker',
      audience: 'misttracker-api',
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (err) {
    throw new Error(`Token verification failed: ${err.message}`);
  }
}

export function decodeToken(token) {
  try {
    return jwt.decode(token, { complete: true });
  } catch (err) {
    return null;
  }
}

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

export async function generateApiKey(userId, name, permissions) {
  const db = getDatabase();
  
  // Generate random key
  const key = `mk_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const keyPrefix = key.substring(0, 8);

  const apiKeyData = {
    _id: uuidv4(),
    user_id: userId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name,
    permissions: permissions || [],
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  await db.insertApiKey ? 
    await db.insertApiKey(apiKeyData) : 
    await db.connection.query(
      `INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, permissions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [apiKeyData._id, userId, keyHash, keyPrefix, name, permissions, 'active']
    );

  return {
    id: apiKeyData._id,
    key: key, // Only shown once
    prefix: keyPrefix,
    name,
  };
}

export async function verifyApiKey(key) {
  const db = getDatabase();
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  // MongoDB query
  if (db.provider === 'mongodb') {
    const apiKeyDoc = await db.db.collection('api_keys').findOne({
      key_hash: keyHash,
      status: 'active',
    });

    if (!apiKeyDoc) {
      return null;
    }

    // Check expiration
    if (apiKeyDoc.expires_at && new Date() > apiKeyDoc.expires_at) {
      return null;
    }

    // Update last_used
    await db.db.collection('api_keys').updateOne(
      { _id: apiKeyDoc._id },
      {
        $set: { last_used: new Date() },
        $inc: { usage_count: 1 },
      }
    );

    return apiKeyDoc;
  }

  // PostgreSQL query
  const result = await db.connection.query(
    `SELECT * FROM api_keys WHERE key_hash = $1 AND status = 'active'`,
    [keyHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const apiKeyDoc = result.rows[0];

  // Update last_used
  await db.connection.query(
    `UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = $1`,
    [apiKeyDoc.id]
  );

  return apiKeyDoc;
}

export async function revokeApiKey(keyId) {
  const db = getDatabase();

  if (db.provider === 'mongodb') {
    await db.db.collection('api_keys').updateOne(
      { _id: keyId },
      { $set: { status: 'revoked', updated_at: new Date() } }
    );
  } else {
    await db.connection.query(
      `UPDATE api_keys SET status = 'revoked', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [keyId]
    );
  }
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

export function hasPermission(userPermissions, requiredPermission) {
  if (!Array.isArray(userPermissions)) {
    return false;
  }

  // Check for exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard permission
  if (userPermissions.includes('*')) {
    return true;
  }

  // Check for resource-level permission (e.g., "read:*" covers "read:sessions")
  const [action, resource] = requiredPermission.split(':');
  if (userPermissions.includes(`${action}:*`)) {
    return true;
  }

  return false;
}

export function canAccessResource(userPermissions, userRole, userId, resourceUserId, permission) {
  // Admin can access anything
  if (userRole === 'admin') {
    return true;
  }

  // Check if permission exists
  if (!hasPermission(userPermissions, permission)) {
    return false;
  }

  // Check for :own suffix (only own resources)
  if (permission.endsWith(':own')) {
    return userId === resourceUserId;
  }

  return true;
}

// ============================================================================
// EXPRESS MIDDLEWARE
// ============================================================================

export const authMiddleware = (req, res, next) => {
  try {
    // Try Bearer token first
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Try API key second
    if (!token) {
      const apiKey = req.headers['x-api-key'];
      if (apiKey) {
        req.apiKeyAuth = true;
        req.apiKey = apiKey;
        return next();
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing authentication token or API key',
      });
    }

    // Verify JWT token
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      permissions: decoded.permissions,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
  }
};

export const apiKeyAuthMiddleware = async (req, res, next) => {
  try {
    if (!req.apiKeyAuth) {
      return next();
    }

    const apiKeyDoc = await verifyApiKey(req.apiKey);
    if (!apiKeyDoc) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired API key',
      });
    }

    // Get user info for API key
    const db = getDatabase();
    let user;
    if (db.provider === 'mongodb') {
      user = await db.db.collection('users').findOne({ _id: apiKeyDoc.user_id });
    } else {
      const result = await db.connection.query('SELECT * FROM users WHERE id = $1', [apiKeyDoc.user_id]);
      user = result.rows[0];
    }

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    req.user = {
      id: user.id || user._id,
      role: user.role,
      permissions: apiKeyDoc.permissions || user.permissions,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    if (!hasPermission(req.user.permissions, permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Missing required permission: ${permission}`,
      });
    }

    next();
  };
};

// ============================================================================
// LOGIN ENDPOINT UTILITIES
// ============================================================================

export async function authenticateUser(username, password) {
  const db = getDatabase();

  let user;
  if (db.provider === 'mongodb') {
    user = await db.db.collection('users').findOne({ username });
  } else {
    const result = await db.connection.query('SELECT * FROM users WHERE username = $1', [username]);
    user = result.rows[0];
  }

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (user.status !== 'active') {
    throw new Error('User account is not active');
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    throw new Error('Invalid credentials');
  }

  return user;
}

export function generateTokenPair(userId, role, permissions) {
  return {
    access_token: generateAccessToken(userId, role, permissions),
    refresh_token: generateRefreshToken(userId),
    token_type: 'Bearer',
    expires_in: 86400, // 24 hours in seconds
  };
}

export async function refreshAccessToken(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  const db = getDatabase();

  let user;
  if (db.provider === 'mongodb') {
    user = await db.db.collection('users').findOne({ _id: decoded.sub });
  } else {
    const result = await db.connection.query('SELECT * FROM users WHERE id = $1', [decoded.sub]);
    user = result.rows[0];
  }

  if (!user || user.status !== 'active') {
    throw new Error('User not found or inactive');
  }

  return generateTokenPair(user._id || user.id, user.role, user.permissions);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { rolePermissions, JWT_SECRET, JWT_EXPIRY };
