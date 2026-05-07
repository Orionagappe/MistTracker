/**
 * Model Persistence Layer - Dashboard and query template persistence
 * Handles storage, retrieval, and management of user configurations
 * 
 * @file services/modelPersistence.js
 * @version 1.0.0
 */

const redisCache = require('./redisCache');

class ModelPersistence {
  constructor() {
    this.db = null;
    this.cache = redisCache;
  }

  /**
   * Initialize with database connection
   */
  initialize(connection) {
    this.db = connection;
  }

  // ============= DASHBOARD OPERATIONS =============

  /**
   * Create dashboard
   * @param {Object} dashboard - Dashboard data
   * @returns {Promise<Object>} Created dashboard with ID
   */
  async createDashboard(userId, dashboard) {
    if (!this.db) throw new Error('Database not initialized');

    const { name, layout, widgets = [] } = dashboard;

    try {
      const result = await this.db.query(
        `INSERT INTO dashboards (userId, name, layout, widgets, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [userId, name, layout, JSON.stringify(widgets)]
      );

      const dashboardId = result.insertId;

      // Clear cache
      await this.cache.delete(`dashboards:${userId}`);

      return {
        id: dashboardId,
        userId,
        name,
        layout,
        widgets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Dashboard creation error:', error);
      throw error;
    }
  }

  /**
   * Get all dashboards for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of dashboards
   */
  async getDashboards(userId) {
    if (!this.db) throw new Error('Database not initialized');

    const cacheKey = `dashboards:${userId}`;

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const dashboards = await this.db.query(
        `SELECT id, userId, name, layout, widgets, createdAt, updatedAt
         FROM dashboards 
         WHERE userId = ?
         ORDER BY updatedAt DESC`,
        [userId]
      );

      // Parse widgets JSON
      const parsed = dashboards.map(d => ({
        ...d,
        widgets: JSON.parse(d.widgets || '[]'),
      }));

      // Cache for 20 minutes
      await this.cache.set(cacheKey, parsed, 1200);

      return parsed;
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      throw error;
    }
  }

  /**
   * Get single dashboard
   * @param {string} dashboardId - Dashboard ID
   * @param {string} userId - User ID for authorization
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboard(dashboardId, userId) {
    if (!this.db) throw new Error('Database not initialized');

    const cacheKey = `dashboard:${dashboardId}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.db.query(
        `SELECT id, userId, name, layout, widgets, createdAt, updatedAt
         FROM dashboards 
         WHERE id = ? AND userId = ?`,
        [dashboardId, userId]
      );

      if (result.length === 0) {
        throw new Error('Dashboard not found');
      }

      const dashboard = result[0];
      dashboard.widgets = JSON.parse(dashboard.widgets || '[]');

      await this.cache.set(cacheKey, dashboard, 600);

      return dashboard;
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      throw error;
    }
  }

  /**
   * Update dashboard
   * @param {string} dashboardId - Dashboard ID
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated dashboard
   */
  async updateDashboard(dashboardId, userId, updates) {
    if (!this.db) throw new Error('Database not initialized');

    const { name, layout, widgets } = updates;

    try {
      await this.db.query(
        `UPDATE dashboards 
         SET name = ?, layout = ?, widgets = ?, updatedAt = NOW()
         WHERE id = ? AND userId = ?`,
        [name, layout, JSON.stringify(widgets), dashboardId, userId]
      );

      // Clear cache
      await this.cache.delete(`dashboard:${dashboardId}`);
      await this.cache.delete(`dashboards:${userId}`);

      return {
        id: dashboardId,
        userId,
        name,
        layout,
        widgets,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Dashboard update error:', error);
      throw error;
    }
  }

  /**
   * Delete dashboard
   * @param {string} dashboardId - Dashboard ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteDashboard(dashboardId, userId) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.query(
        `DELETE FROM dashboards WHERE id = ? AND userId = ?`,
        [dashboardId, userId]
      );

      // Clear cache
      await this.cache.delete(`dashboard:${dashboardId}`);
      await this.cache.delete(`dashboards:${userId}`);

      return true;
    } catch (error) {
      console.error('Dashboard deletion error:', error);
      throw error;
    }
  }

  /**
   * Share dashboard with another user
   * @param {string} dashboardId - Dashboard ID
   * @param {string} ownerId - Owner user ID
   * @param {string} targetUserId - User to share with
   * @param {string} permission - Permission level (view/edit)
   * @returns {Promise<Object>} Share record
   */
  async shareDashboard(dashboardId, ownerId, targetUserId, permission = 'view') {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.query(
        `INSERT INTO dashboard_shares (dashboardId, ownerId, sharedWithUserId, permission, sharedAt)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE permission = ?, sharedAt = NOW()`,
        [dashboardId, ownerId, targetUserId, permission, permission]
      );

      // Clear cache for target user
      await this.cache.delete(`dashboards:${targetUserId}`);

      return {
        dashboardId,
        sharedWithUserId: targetUserId,
        permission,
        sharedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Dashboard share error:', error);
      throw error;
    }
  }

  /**
   * Remove dashboard share
   * @param {string} dashboardId - Dashboard ID
   * @param {string} targetUserId - User to revoke access
   * @returns {Promise<boolean>} Success status
   */
  async unshareDb(dashboardId, targetUserId) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.query(
        `DELETE FROM dashboard_shares 
         WHERE dashboardId = ? AND sharedWithUserId = ?`,
        [dashboardId, targetUserId]
      );

      await this.cache.delete(`dashboards:${targetUserId}`);

      return true;
    } catch (error) {
      console.error('Dashboard unshare error:', error);
      throw error;
    }
  }

  // ============= QUERY TEMPLATE OPERATIONS =============

  /**
   * Save query template
   * @param {Object} template - Template data
   * @returns {Promise<Object>} Saved template with ID
   */
  async saveTemplate(userId, template) {
    if (!this.db) throw new Error('Database not initialized');

    const { name, filters, description = '' } = template;

    try {
      const result = await this.db.query(
        `INSERT INTO query_templates (userId, name, description, filters, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [userId, name, description, JSON.stringify(filters)]
      );

      // Clear cache
      await this.cache.delete(`templates:${userId}`);

      return {
        id: result.insertId,
        userId,
        name,
        description,
        filters,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Template save error:', error);
      throw error;
    }
  }

  /**
   * Get user's query templates
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of templates
   */
  async getTemplates(userId) {
    if (!this.db) throw new Error('Database not initialized');

    const cacheKey = `templates:${userId}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const templates = await this.db.query(
        `SELECT id, userId, name, description, filters, createdAt, updatedAt
         FROM query_templates 
         WHERE userId = ?
         ORDER BY updatedAt DESC`,
        [userId]
      );

      const parsed = templates.map(t => ({
        ...t,
        filters: JSON.parse(t.filters || '[]'),
      }));

      // Cache for 30 minutes
      await this.cache.set(cacheKey, parsed, 1800);

      return parsed;
    } catch (error) {
      console.error('Templates fetch error:', error);
      throw error;
    }
  }

  /**
   * Get single template
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Template data
   */
  async getTemplate(templateId, userId) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.query(
        `SELECT id, userId, name, description, filters, createdAt, updatedAt
         FROM query_templates 
         WHERE id = ? AND userId = ?`,
        [templateId, userId]
      );

      if (result.length === 0) {
        throw new Error('Template not found');
      }

      const template = result[0];
      template.filters = JSON.parse(template.filters || '[]');

      return template;
    } catch (error) {
      console.error('Template fetch error:', error);
      throw error;
    }
  }

  /**
   * Update template
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(templateId, userId, updates) {
    if (!this.db) throw new Error('Database not initialized');

    const { name, description, filters } = updates;

    try {
      await this.db.query(
        `UPDATE query_templates 
         SET name = ?, description = ?, filters = ?, updatedAt = NOW()
         WHERE id = ? AND userId = ?`,
        [name, description, JSON.stringify(filters), templateId, userId]
      );

      // Clear cache
      await this.cache.delete(`templates:${userId}`);

      return {
        id: templateId,
        userId,
        name,
        description,
        filters,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Template update error:', error);
      throw error;
    }
  }

  /**
   * Delete template
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTemplate(templateId, userId) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.query(
        `DELETE FROM query_templates WHERE id = ? AND userId = ?`,
        [templateId, userId]
      );

      // Clear cache
      await this.cache.delete(`templates:${userId}`);

      return true;
    } catch (error) {
      console.error('Template deletion error:', error);
      throw error;
    }
  }

  /**
   * Get popular templates
   * @param {number} limit - Number of templates
   * @returns {Promise<Array>} Popular templates
   */
  async getPopularTemplates(limit = 10) {
    if (!this.db) throw new Error('Database not initialized');

    const cacheKey = 'templates:popular';

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const templates = await this.db.query(
        `SELECT id, name, description, filters, usageCount
         FROM query_templates 
         WHERE isPublic = 1
         ORDER BY usageCount DESC
         LIMIT ?`,
        [limit]
      );

      const parsed = templates.map(t => ({
        ...t,
        filters: JSON.parse(t.filters || '[]'),
      }));

      await this.cache.set(cacheKey, parsed, 3600); // 1 hour

      return parsed;
    } catch (error) {
      console.error('Popular templates fetch error:', error);
      return [];
    }
  }

  // ============= SAVED QUERIES =============

  /**
   * Save query execution
   * @param {string} userId - User ID
   * @param {Object} query - Query data
   * @param {Array} results - Query results
   * @returns {Promise<Object>} Saved query record
   */
  async saveQueryExecution(userId, query, results) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.query(
        `INSERT INTO saved_queries (userId, name, query, resultCount, executedAt)
         VALUES (?, ?, ?, ?, NOW())`,
        [userId, `Query ${Date.now()}`, JSON.stringify(query), results.length]
      );

      return {
        id: result.insertId,
        userId,
        query,
        resultCount: results.length,
        executedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Query save error:', error);
      throw error;
    }
  }

  /**
   * Get saved queries
   * @param {string} userId - User ID
   * @param {number} limit - Maximum queries to return
   * @returns {Promise<Array>} Saved queries
   */
  async getSavedQueries(userId, limit = 50) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const queries = await this.db.query(
        `SELECT id, userId, name, query, resultCount, executedAt
         FROM saved_queries 
         WHERE userId = ?
         ORDER BY executedAt DESC
         LIMIT ?`,
        [userId, limit]
      );

      return queries.map(q => ({
        ...q,
        query: JSON.parse(q.query || '{}'),
      }));
    } catch (error) {
      console.error('Saved queries fetch error:', error);
      throw error;
    }
  }

  /**
   * Delete saved query
   * @param {string} queryId - Query ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteSavedQuery(queryId, userId) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.query(
        `DELETE FROM saved_queries WHERE id = ? AND userId = ?`,
        [queryId, userId]
      );

      return true;
    } catch (error) {
      console.error('Saved query deletion error:', error);
      throw error;
    }
  }
}

module.exports = new ModelPersistence();
