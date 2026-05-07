/**
 * Authentication Endpoints
 * Phase 17.2.4: Auth Integration
 * 
 * Provides:
 * - User registration
 * - Login with JWT
 * - Token refresh
 * - API key management
 * - User profile endpoints
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  hashPassword,
  verifyPassword,
  authenticateUser,
  generateTokenPair,
  refreshAccessToken,
  generateApiKey,
  getDatabase,
  verifyRefreshToken,
  authMiddleware,
  requirePermission,
  requireRole,
} from '../middleware/auth.js';

const router = Router();

// ============================================================================
// USER REGISTRATION
// ============================================================================

/**
 * POST /auth/register
 * 
 * Register a new user
 * 
 * Request Body:
 * {
 *   "username": "john_doe",
 *   "email": "john@example.com",
 *   "password": "secure_password"
 * }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: username, email, password',
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username must be at least 3 characters',
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 8 characters',
      });
    }

    // Check if user exists
    const db = getDatabase();
    const existingUser = await db.getUser({ username });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Username already exists',
      });
    }

    const existingEmail = await db.getUser({ email });
    if (existingEmail) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already in use',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = uuidv4();
    const userData = {
      _id: userId,
      username,
      email,
      password_hash: passwordHash,
      role: 'developer', // Default role
      permissions: ['read:metrics', 'read:sessions', 'read:milestones', 'create:session', 'export:data'],
      status: 'active',
      settings: {
        theme: 'dark',
        notifications_enabled: true,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.insertUser(userData);

    // Log audit
    await db.logAudit({
      _id: uuidv4(),
      user_id: userId,
      action: 'USER_REGISTERED',
      resource_type: 'user',
      resource_id: userId,
      status: 'success',
      timestamp: new Date(),
    });

    // Generate tokens
    const tokens = generateTokenPair(userId, userData.role, userData.permissions);

    res.status(201).json({
      user: {
        id: userId,
        username,
        email,
        role: userData.role,
      },
      ...tokens,
    });
  } catch (err) {
    console.error('Error in user registration:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// LOGIN
// ============================================================================

/**
 * POST /auth/login
 * 
 * Authenticate user and return JWT tokens
 * 
 * Request Body:
 * {
 *   "username": "john_doe",
 *   "password": "secure_password"
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing username or password',
      });
    }

    const db = getDatabase();

    // Authenticate
    const user = await authenticateUser(username, password);

    // Generate tokens
    const tokens = generateTokenPair(user._id || user.id, user.role, user.permissions);

    // Update last login
    if (db.provider === 'mongodb') {
      await db.db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: { last_login: new Date() },
          $inc: { login_count: 1 },
        }
      );
    } else {
      await db.connection.query(
        `UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = $1`,
        [user.id]
      );
    }

    // Log audit
    await db.logAudit({
      _id: uuidv4(),
      user_id: user._id || user.id,
      action: 'USER_LOGIN',
      resource_type: 'user',
      status: 'success',
      timestamp: new Date(),
    });

    res.json({
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (err) {
    console.error('Error in login:', err);

    // Log failed attempt
    try {
      const db = getDatabase();
      await db.logAudit({
        _id: uuidv4(),
        user_id: 'unknown',
        action: 'LOGIN_FAILED',
        resource_type: 'auth',
        status: 'failed',
        timestamp: new Date(),
      });
    } catch (auditErr) {
      console.error('Error logging failed login:', auditErr);
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
  }
});

// ============================================================================
// TOKEN REFRESH
// ============================================================================

/**
 * POST /auth/refresh
 * 
 * Refresh access token using refresh token
 * 
 * Request Body:
 * {
 *   "refresh_token": "jwt_refresh_token"
 * }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing refresh_token',
      });
    }

    const tokens = await refreshAccessToken(refresh_token);

    res.json(tokens);
  } catch (err) {
    console.error('Error in token refresh:', err);
    res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
  }
});

// ============================================================================
// LOGOUT
// ============================================================================

/**
 * POST /auth/logout
 * 
 * Logout user (client should discard tokens)
 * In a production system, could invalidate tokens in a blacklist
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();

    // Log audit
    await db.logAudit({
      _id: uuidv4(),
      user_id: req.user.id,
      action: 'USER_LOGOUT',
      resource_type: 'user',
      status: 'success',
      timestamp: new Date(),
    });

    res.json({
      message: 'Successfully logged out',
    });
  } catch (err) {
    console.error('Error in logout:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// USER PROFILE
// ============================================================================

/**
 * GET /auth/profile
 * 
 * Get current user profile
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();

    let user;
    if (db.provider === 'mongodb') {
      user = await db.db.collection('users').findOne({ _id: req.user.id });
    } else {
      const result = await db.connection.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      user = result.rows[0];
    }

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    res.json({
      id: user._id || user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      settings: user.settings,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

/**
 * PUT /auth/profile
 * 
 * Update user profile settings
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    const { email, settings } = req.body;

    const updates = {};
    if (email) updates.email = email;
    if (settings) updates.settings = settings;
    updates.updated_at = new Date();

    await db.updateSession(req.user.id, updates);

    res.json({
      message: 'Profile updated successfully',
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

/**
 * POST /auth/api-keys
 * 
 * Generate new API key
 * 
 * Request Body:
 * {
 *   "name": "Production API Key",
 *   "permissions": ["read:metrics", "export:data"]
 * }
 */
router.post('/api-keys', authMiddleware, async (req, res) => {
  try {
    const { name, permissions = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'API key name is required',
      });
    }

    const apiKey = await generateApiKey(req.user.id, name, permissions);

    res.status(201).json(apiKey);
  } catch (err) {
    console.error('Error generating API key:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

/**
 * GET /auth/api-keys
 * 
 * List all API keys for current user
 */
router.get('/api-keys', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();

    let apiKeys;
    if (db.provider === 'mongodb') {
      apiKeys = await db.db
        .collection('api_keys')
        .find({ user_id: req.user.id })
        .project({ key_hash: 0 }) // Never return full key
        .sort({ created_at: -1 })
        .toArray();
    } else {
      const result = await db.connection.query(
        'SELECT id, user_id, key_prefix, name, status, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user.id]
      );
      apiKeys = result.rows;
    }

    res.json({
      api_keys: apiKeys.map(k => ({
        id: k._id || k.id,
        prefix: k.key_prefix,
        name: k.name,
        status: k.status,
        created_at: k.created_at,
      })),
      count: apiKeys.length,
    });
  } catch (err) {
    console.error('Error listing API keys:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

/**
 * DELETE /auth/api-keys/:key_id
 * 
 * Revoke an API key
 */
router.delete('/api-keys/:key_id', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    const { key_id } = req.params;

    // Verify ownership
    let apiKey;
    if (db.provider === 'mongodb') {
      apiKey = await db.db.collection('api_keys').findOne({ _id: key_id });
    } else {
      const result = await db.connection.query(
        'SELECT * FROM api_keys WHERE id = $1',
        [key_id]
      );
      apiKey = result.rows[0];
    }

    if (!apiKey || apiKey.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'API key not found',
      });
    }

    // Revoke key
    if (db.provider === 'mongodb') {
      await db.db.collection('api_keys').updateOne(
        { _id: key_id },
        { $set: { status: 'revoked', updated_at: new Date() } }
      );
    } else {
      await db.connection.query(
        'UPDATE api_keys SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['revoked', key_id]
      );
    }

    res.json({
      message: 'API key revoked successfully',
    });
  } catch (err) {
    console.error('Error revoking API key:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// ADMIN USER MANAGEMENT
// ============================================================================

/**
 * GET /auth/users
 * 
 * List all users (admin only)
 */
router.get('/users', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const db = getDatabase();
    const { limit = 100, offset = 0 } = req.query;

    let users;
    if (db.provider === 'mongodb') {
      users = await db.db
        .collection('users')
        .find({})
        .project({ password_hash: 0 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .sort({ created_at: -1 })
        .toArray();
    } else {
      const result = await db.connection.query(
        'SELECT id, username, email, role, status, created_at FROM users LIMIT $1 OFFSET $2',
        [parseInt(limit), parseInt(offset)]
      );
      users = result.rows;
    }

    res.json({
      users: users.map(u => ({
        id: u._id || u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        created_at: u.created_at,
      })),
      count: users.length,
    });
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

/**
 * PUT /auth/users/:user_id/role
 * 
 * Update user role (admin only)
 */
router.put('/users/:user_id/role', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const db = getDatabase();
    const { user_id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'developer', 'analyst', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    await db.updateSession(user_id, { role, updated_at: new Date() });

    // Log audit
    await db.logAudit({
      _id: uuidv4(),
      user_id: req.user.id,
      action: 'USER_ROLE_CHANGED',
      resource_type: 'user',
      resource_id: user_id,
      status: 'success',
      timestamp: new Date(),
    });

    res.json({
      message: 'User role updated successfully',
      user_id,
      new_role: role,
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

export default router;
