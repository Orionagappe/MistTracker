/**
 * Phase 58: End-of-Life (EOL) Database and Update Center Integration
 * 
 * Maintains comprehensive EOL database with:
 * - Known EOL dates for software versions
 * - Network-based update center connections
 * - Version lifecycle tracking
 * - Support status determination
 */

const EventEmitter = require('events');

/**
 * EndOfLifeDatabase: Comprehensive EOL information storage
 */
class EndOfLifeDatabase extends EventEmitter {
  constructor() {
    super();
    this.eolDatabase = new Map();
    this.updateCenterUrl = 'https://endoflife.date/api';
    this.lastUpdateTime = null;
    this.cacheTimeout = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.initializeBuiltInDatabase();
  }

  /**
   * Initialize built-in EOL database with common software
   */
  initializeBuiltInDatabase() {
    const eolData = {
      'node.js': [
        { version: '18', eol: '2025-04-30', lts: true, active: false },
        { version: '20', eol: '2026-04-30', lts: true, active: true },
        { version: '22', eol: '2027-10-18', lts: false, active: true },
        { version: '16', eol: '2023-09-11', lts: true, active: false }
      ],
      'python': [
        { version: '3.8', eol: '2024-10-07', lts: false, active: false },
        { version: '3.9', eol: '2025-10-05', lts: false, active: false },
        { version: '3.10', eol: '2026-10-04', lts: false, active: true },
        { version: '3.11', eol: '2027-10-24', lts: false, active: true },
        { version: '3.12', eol: '2028-10-02', lts: false, active: true }
      ],
      'java': [
        { version: '8', eol: '2030-12-31', lts: true, active: true },
        { version: '11', eol: '2026-09-30', lts: true, active: true },
        { version: '17', eol: '2029-09-30', lts: true, active: true },
        { version: '21', eol: '2031-09-30', lts: true, active: true }
      ],
      '.net': [
        { version: '5.0', eol: '2022-05-10', lts: false, active: false },
        { version: '6.0', eol: '2024-11-12', lts: true, active: false },
        { version: '7.0', eol: '2024-05-14', lts: false, active: false },
        { version: '8.0', eol: '2026-11-10', lts: true, active: true }
      ],
      'windows': [
        { version: '7', eol: '2020-01-14', lts: false, active: false },
        { version: '10', eol: '2025-10-14', lts: false, active: true },
        { version: '11', eol: '2031-10-13', lts: false, active: true }
      ],
      'ubuntu': [
        { version: '18.04', eol: '2028-04-02', lts: true, active: true },
        { version: '20.04', eol: '2030-04-23', lts: true, active: true },
        { version: '22.04', eol: '2032-04-21', lts: true, active: true }
      ],
      'postgresql': [
        { version: '12', eol: '2024-10-08', lts: false, active: false },
        { version: '13', eol: '2025-11-13', lts: false, active: false },
        { version: '14', eol: '2026-11-12', lts: false, active: true },
        { version: '15', eol: '2027-11-11', lts: false, active: true }
      ],
      'mysql': [
        { version: '5.7', eol: '2023-09-21', lts: false, active: false },
        { version: '8.0', eol: '2026-04-21', lts: false, active: true },
        { version: '8.4', eol: '2032-04-18', lts: false, active: true }
      ],
      'nginx': [
        { version: '1.24', eol: '2025-06-10', lts: false, active: true },
        { version: '1.26', eol: '2026-11-24', lts: false, active: true }
      ],
      'docker': [
        { version: '20.10', eol: '2023-12-07', lts: false, active: false },
        { version: '24.0', eol: '2025-06-30', lts: false, active: true }
      ]
    };

    for (const [software, versions] of Object.entries(eolData)) {
      this.eolDatabase.set(software.toLowerCase(), {
        software,
        versions,
        lastUpdated: new Date().toISOString(),
        source: 'built-in'
      });
    }
  }

  /**
   * Check if software version is end-of-life
   */
  isEndOfLife(softwareName, version) {
    const key = softwareName.toLowerCase();
    const record = this.eolDatabase.get(key);

    if (!record) {
      return { known: false, eol: null, daysUntilEol: null };
    }

    // Try to match version
    for (const versionRecord of record.versions) {
      if (this.versionMatches(version, versionRecord.version)) {
        const eolDate = new Date(versionRecord.eol);
        const today = new Date();
        const isEol = today > eolDate;
        const daysUntilEol = Math.ceil((eolDate - today) / (1000 * 60 * 60 * 24));

        return {
          known: true,
          eol: isEol,
          eolDate: versionRecord.eol,
          daysUntilEol: isEol ? null : daysUntilEol,
          lts: versionRecord.lts,
          active: versionRecord.active,
          supportStatus: this.determineSupportStatus(versionRecord)
        };
      }
    }

    return { known: true, eol: null, daysUntilEol: null, reason: 'Version not found' };
  }

  /**
   * Determine support status
   */
  determineSupportStatus(versionRecord) {
    const today = new Date();
    const eolDate = new Date(versionRecord.eol);

    if (today < eolDate) {
      const daysLeft = Math.ceil((eolDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysLeft > 365) {
        return 'long-term-support';
      } else if (daysLeft > 90) {
        return 'active-support';
      } else if (daysLeft > 0) {
        return 'maintenance-only';
      }
    }

    return 'end-of-life';
  }

  /**
   * Match version strings (handle various formats)
   */
  versionMatches(installedVersion, dbVersion) {
    if (!installedVersion || !dbVersion) return false;

    const normalize = (v) => v.split('.')[0].toLowerCase();
    
    return normalize(installedVersion) === normalize(dbVersion) ||
           installedVersion.toLowerCase().includes(dbVersion.toLowerCase()) ||
           dbVersion.toLowerCase().includes(installedVersion.toLowerCase());
  }

  /**
   * Get all versions for a software
   */
  getVersions(softwareName) {
    const key = softwareName.toLowerCase();
    const record = this.eolDatabase.get(key);
    return record ? record.versions : [];
  }

  /**
   * Get recommended versions for a software
   */
  getRecommendedVersions(softwareName) {
    const versions = this.getVersions(softwareName);
    return versions
      .filter(v => v.active && v.lts)
      .sort((a, b) => new Date(b.eol) - new Date(a.eol));
  }

  /**
   * Add or update EOL information
   */
  addEolInformation(softwareName, versionRecords) {
    this.eolDatabase.set(softwareName.toLowerCase(), {
      software: softwareName,
      versions: versionRecords,
      lastUpdated: new Date().toISOString(),
      source: 'custom'
    });

    this.emit('eol-data-updated', { software: softwareName, count: versionRecords.length });
  }

  /**
   * Query network-based update center (simulated)
   */
  async queryUpdateCenter(softwareName) {
    console.log(`Querying update center for: ${softwareName}`);

    return new Promise((resolve) => {
      // Simulate network request
      setTimeout(() => {
        const record = this.eolDatabase.get(softwareName.toLowerCase());
        
        if (record) {
          this.lastUpdateTime = new Date().toISOString();
          this.emit('update-center-query-success', { software: softwareName });
          resolve(record);
        } else {
          this.emit('update-center-query-failed', { software: softwareName });
          resolve(null);
        }
      }, 100);
    });
  }

  /**
   * Get EOL summary for multiple software
   */
  getEolSummary(softwareList) {
    const summary = {
      timestamp: new Date().toISOString(),
      checked: softwareList.length,
      results: []
    };

    for (const { name, version } of softwareList) {
      const result = this.isEndOfLife(name, version);
      summary.results.push({
        software: name,
        version,
        ...result
      });
    }

    // Count by status
    const byStatus = {};
    for (const result of summary.results) {
      const status = result.supportStatus || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    }
    summary.byStatus = byStatus;

    return summary;
  }
}

/**
 * NetworkUpdateCenter: Fetch EOL data from network source
 */
class NetworkUpdateCenter extends EventEmitter {
  constructor(dbInstance) {
    super();
    this.db = dbInstance;
    this.updateHistory = [];
    this.failureCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Sync all software data with update center
   */
  async syncWithUpdateCenter() {
    console.log('Syncing EOL data with network update center...');
    const syncResult = {
      timestamp: new Date().toISOString(),
      synced: [],
      failed: []
    };

    const softwareList = Array.from(this.db.eolDatabase.keys());

    for (const software of softwareList) {
      try {
        const record = await this.db.queryUpdateCenter(software);
        
        if (record) {
          syncResult.synced.push(software);
          this.failureCount = 0;
        } else {
          syncResult.failed.push(software);
          this.failureCount++;
        }
      } catch (error) {
        console.error(`Sync error for ${software}:`, error);
        syncResult.failed.push(software);
        this.failureCount++;
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.updateHistory.push(syncResult);
    this.emit('sync-complete', syncResult);
    
    return syncResult;
  }

  /**
   * Get latest version for a software
   */
  getLatestVersion(softwareName) {
    const versions = this.db.getVersions(softwareName);
    if (versions.length === 0) return null;

    return versions.reduce((latest, current) => {
      const latestEol = new Date(latest.eol);
      const currentEol = new Date(current.eol);
      return currentEol > latestEol ? current : latest;
    });
  }

  /**
   * Check for available upgrades
   */
  checkUpgrades(softwareName, currentVersion) {
    const versions = this.db.getVersions(softwareName);
    if (versions.length === 0) return [];

    const currentEol = this.db.isEndOfLife(softwareName, currentVersion);
    
    return versions.filter(v => {
      // Newer versions
      return v.active || (new Date(v.eol) > new Date());
    }).sort((a, b) => new Date(b.eol) - new Date(a.eol));
  }

  /**
   * Get update center status
   */
  getStatus() {
    return {
      connected: this.failureCount < this.maxRetries,
      failureCount: this.failureCount,
      lastUpdate: this.updateHistory.length > 0 
        ? this.updateHistory[this.updateHistory.length - 1].timestamp 
        : null,
      recordCount: this.db.eolDatabase.size
    };
  }
}

/**
 * Export
 */
module.exports = {
  EndOfLifeDatabase,
  NetworkUpdateCenter
};
