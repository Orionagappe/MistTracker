// ProvenanceTracker.js
// Tracks action history and maintains audit log for compliance

import { hostname } from 'os';

export class ProvenanceTracker {
  constructor(db = null) {
    this.db = db;
    this.localLog = []; // In-memory log
    this.maxLocalEntries = 10000;
  }

  // Record an action
  async recordAction(actionType, userId, sessionToken, context = {}) {
    const provenance = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      actionType,
      userId,
      sessionToken,
      timestamp: new Date().toISOString(),
      context,
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        hostname: hostname()
      }
    };

    // Store in local log
    this.localLog.push(provenance);
    if (this.localLog.length > this.maxLocalEntries) {
      this.localLog = this.localLog.slice(-this.maxLocalEntries);
    }

    // Store in database if available
    if (this.db) {
      try {
        await this.db.query(
          `INSERT INTO ProvenanceLog 
           (actionType, userId, sessionToken, timestamp, context, metadata) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            provenance.actionType,
            provenance.userId,
            provenance.sessionToken,
            provenance.timestamp,
            JSON.stringify(provenance.context),
            JSON.stringify(provenance.metadata)
          ]
        );
      } catch (err) {
        console.error('Database provenance recording failed:', err);
        // Continue even if database fails
      }
    }

    return provenance;
  }

  // Get audit trail for a timeline
  async getTimelineAuditTrail(timelineId, options = {}) {
    const { startTime, endTime, userId, actionType } = options;

    let results = this.localLog;

    // Filter by timeline context
    results = results.filter(log =>
      log.context.timelineId === timelineId ||
      log.context.itemId // Items belong to timelines
    );

    // Filter by time range
    if (startTime) {
      results = results.filter(log =>
        new Date(log.timestamp) >= new Date(startTime)
      );
    }
    if (endTime) {
      results = results.filter(log =>
        new Date(log.timestamp) <= new Date(endTime)
      );
    }

    // Filter by user
    if (userId) {
      results = results.filter(log => log.userId === userId);
    }

    // Filter by action type
    if (actionType) {
      results = results.filter(log => log.actionType === actionType);
    }

    // If database available, also query database
    if (this.db && (startTime || endTime)) {
      try {
        const params = [];
        let query = `
          SELECT * FROM ProvenanceLog 
          WHERE context LIKE ?
        `;
        params.push(`%"timelineId":"${timelineId}"%`);

        if (startTime) {
          query += ' AND timestamp >= ?';
          params.push(startTime);
        }
        if (endTime) {
          query += ' AND timestamp <= ?';
          params.push(endTime);
        }
        if (userId) {
          query += ' AND userId = ?';
          params.push(userId);
        }
        if (actionType) {
          query += ' AND actionType = ?';
          params.push(actionType);
        }

        query += ' ORDER BY timestamp DESC LIMIT 1000';

        const [dbResults] = await this.db.query(query, params);
        results = results.concat(dbResults || []);

        // Remove duplicates
        const seen = new Set();
        results = results.filter(log => {
          const key = `${log.id || log.timestamp}-${log.userId}-${log.actionType}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      } catch (err) {
        console.error('Database audit trail query failed:', err);
      }
    }

    // Sort by timestamp descending
    results.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    return results;
  }

  // Get user action history
  async getUserActions(userId, limit = 100) {
    let results = this.localLog
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    // If database available, merge with database results
    if (this.db) {
      try {
        const [dbResults] = await this.db.query(
          'SELECT * FROM ProvenanceLog WHERE userId = ? ORDER BY timestamp DESC LIMIT ?',
          [userId, limit]
        );
        
        if (dbResults && dbResults.length > 0) {
          results = results.concat(dbResults);
          
          // Remove duplicates and limit
          const seen = new Set();
          results = results
            .filter(log => {
              const key = `${log.id || log.timestamp}-${log.actionType}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .slice(0, limit);
        }
      } catch (err) {
        console.error('Database user actions query failed:', err);
      }
    }

    return results;
  }

  // Get action summary by type
  getActionSummary(timeRange = 86400000) { // Default: 24 hours
    const now = Date.now();
    const startTime = now - timeRange;

    const recentActions = this.localLog.filter(log =>
      new Date(log.timestamp).getTime() >= startTime
    );

    const summary = {};
    for (const action of recentActions) {
      summary[action.actionType] = (summary[action.actionType] || 0) + 1;
    }

    return {
      period: `${timeRange / 1000}s`,
      totalActions: recentActions.length,
      summary,
      breakdown: Object.entries(summary).map(([type, count]) => ({
        actionType: type,
        count,
        percentage: (count / recentActions.length * 100).toFixed(2)
      }))
    };
  }

  // Export audit trail as JSON
  exportAuditTrail(options = {}) {
    const { format = 'json', startTime, endTime } = options;

    let results = this.localLog;

    if (startTime) {
      results = results.filter(log =>
        new Date(log.timestamp) >= new Date(startTime)
      );
    }
    if (endTime) {
      results = results.filter(log =>
        new Date(log.timestamp) <= new Date(endTime)
      );
    }

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['timestamp', 'actionType', 'userId', 'sessionToken', 'context'];
      const rows = results.map(log => [
        log.timestamp,
        log.actionType,
        log.userId,
        log.sessionToken,
        JSON.stringify(log.context)
      ]);

      return {
        headers,
        rows,
        text: [headers, ...rows].map(r => r.join(',')).join('\n')
      };
    }

    return results;
  }

  // Get provenance for specific item
  async getItemProvenance(itemId) {
    const results = this.localLog.filter(log =>
      log.context.itemId === itemId ||
      (log.context.changes && log.context.changes.itemId === itemId)
    );

    return {
      itemId,
      history: results.sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
      ),
      firstCreated: results.length > 0 ? results[0].timestamp : null,
      lastModified: results.length > 0 ? results[results.length - 1].timestamp : null,
      editCount: results.filter(log => log.actionType === 'item-update').length,
      authors: [...new Set(results.map(log => log.userId))]
    };
  }

  // Clear old entries
  cleanup(maxAge = 86400000) { // Default: 24 hours
    const now = Date.now();
    this.localLog = this.localLog.filter(log =>
      Date.now() - new Date(log.timestamp).getTime() < maxAge
    );
  }
}

export default ProvenanceTracker;
