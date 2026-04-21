/**
 * Phase 58: Upgrade Advisor Engine
 * 
 * Analyzes installed software and recommends upgrades based on:
 * - End-of-Life dates
 * - Security vulnerabilities
 * - Feature requirements
 * - Compatibility concerns
 * - Performance improvements
 */

const EventEmitter = require('events');

/**
 * UpgradeAdvisor: Intelligent upgrade recommendation engine
 */
class UpgradeAdvisor extends EventEmitter {
  constructor(scanner, eolDb) {
    super();
    this.scanner = scanner;
    this.eolDb = eolDb;
    this.recommendations = [];
    this.assessmentHistory = [];
  }

  /**
   * Analyze installed software and generate upgrade recommendations
   */
  async analyzeInstalled() {
    console.log('Analyzing installed software for upgrade recommendations...');

    const software = this.scanner.installedSoftware;
    this.recommendations = [];

    for (const app of software) {
      const recommendation = this.assessUpgradeNeed(app);
      if (recommendation) {
        this.recommendations.push(recommendation);
      }
    }

    // Sort by priority
    this.recommendations.sort((a, b) => b.priority - a.priority);

    const assessment = {
      timestamp: new Date().toISOString(),
      totalSoftware: software.length,
      recommendedUpgrades: this.recommendations.length,
      critical: this.recommendations.filter(r => r.severity === 'critical').length,
      high: this.recommendations.filter(r => r.severity === 'high').length,
      medium: this.recommendations.filter(r => r.severity === 'medium').length,
      low: this.recommendations.filter(r => r.severity === 'low').length,
      recommendations: this.recommendations
    };

    this.assessmentHistory.push(assessment);
    this.emit('assessment-complete', assessment);

    return assessment;
  }

  /**
   * Assess if a software needs upgrade
   */
  assessUpgradeNeed(software) {
    const eolInfo = this.eolDb.isEndOfLife(software.name, software.version);

    if (!eolInfo.known) {
      return null; // Can't assess unknown software
    }

    let severity = 'low';
    let reasons = [];
    let priority = 0;

    // Check if EOL
    if (eolInfo.eol) {
      severity = 'critical';
      reasons.push('Software has reached end-of-life');
      priority = 100;
    }

    // Check if approaching EOL
    if (!eolInfo.eol && eolInfo.daysUntilEol !== null) {
      if (eolInfo.daysUntilEol <= 30) {
        severity = 'critical';
        reasons.push(`Only ${eolInfo.daysUntilEol} days until end-of-life`);
        priority = 95;
      } else if (eolInfo.daysUntilEol <= 90) {
        severity = 'high';
        reasons.push(`${eolInfo.daysUntilEol} days until end-of-life`);
        priority = 80;
      } else if (eolInfo.daysUntilEol <= 180) {
        severity = 'medium';
        reasons.push(`${eolInfo.daysUntilEol} days until end-of-life`);
        priority = 50;
      }
    }

    // Check support status
    if (eolInfo.supportStatus === 'maintenance-only') {
      severity = severity === 'critical' ? 'critical' : 'high';
      if (!reasons.includes('In maintenance-only mode')) {
        reasons.push('In maintenance-only support mode');
        if (priority < 70) priority = 70;
      }
    }

    // Check if LTS version available
    if (eolInfo.lts === false) {
      const ltsVersions = this.eolDb.getRecommendedVersions(software.name);
      if (ltsVersions.length > 0) {
        if (!reasons.includes('LTS version available')) {
          reasons.push(`LTS version ${ltsVersions[0].version} available`);
          if (priority < 40) priority = 40;
        }
      }
    }

    if (reasons.length === 0) {
      return null; // No upgrade needed
    }

    // Find recommended upgrade path
    const recommendedVersions = this.findUpgradePath(software.name, software.version);

    return {
      name: software.name,
      currentVersion: software.version,
      publisher: software.publisher,
      installDate: software.installDate,
      severity,
      priority,
      reasons,
      recommendedVersions: recommendedVersions || this.eolDb.getRecommendedVersions(software.name),
      eolInfo,
      upgradeComplexity: this.assessUpgradeComplexity(software),
      estimatedDowntime: this.estimateDowntime(software),
      riskLevel: this.assessRiskLevel(software)
    };
  }

  /**
   * Find recommended upgrade path
   */
  findUpgradePath(softwareName, currentVersion) {
    const versions = this.eolDb.getVersions(softwareName);
    if (versions.length === 0) return null;

    // Get active, supported versions newer than current
    const candidates = versions.filter(v => {
      const versionNum = parseInt(v.version.split('.')[0]);
      const currentNum = parseInt(currentVersion.split('.')[0]);
      return versionNum >= currentNum && v.active;
    });

    if (candidates.length === 0) {
      // No newer active version, try any non-EOL version
      return versions.filter(v => new Date(v.eol) > new Date()).slice(0, 3);
    }

    // Sort by EOL date (newest first)
    return candidates.sort((a, b) => new Date(b.eol) - new Date(a.eol)).slice(0, 3);
  }

  /**
   * Assess upgrade complexity
   */
  assessUpgradeComplexity(software) {
    const complexPatterns = {
      critical: /database|server|runtime|framework|operating system/i,
      high: /middleware|compiler|sdk|development tool/i,
      medium: /utility|plugin|addon|extension/i,
      low: /application|tool/i
    };

    for (const [level, pattern] of Object.entries(complexPatterns)) {
      if (pattern.test(software.name) || pattern.test(software.publisher)) {
        return level;
      }
    }

    return 'medium';
  }

  /**
   * Estimate downtime for upgrade
   */
  estimateDowntime(software) {
    const complexity = this.assessUpgradeComplexity(software);

    const estimates = {
      critical: { min: 30, max: 120, unit: 'minutes' },
      high: { min: 15, max: 60, unit: 'minutes' },
      medium: { min: 5, max: 30, unit: 'minutes' },
      low: { min: 1, max: 10, unit: 'minutes' }
    };

    return estimates[complexity];
  }

  /**
   * Assess risk level of not upgrading
   */
  assessRiskLevel(software) {
    const securityCritical = /security|antivirus|firewall|defender/i.test(software.name);
    const coreSystem = /windows|system|kernel|runtime|framework|database/i.test(software.name);

    if (securityCritical) return 'critical';
    if (coreSystem) return 'high';
    if (this.assessUpgradeComplexity(software) === 'critical') return 'high';
    
    return 'medium';
  }

  /**
   * Get recommendations by severity
   */
  getByServerity(severity) {
    return this.recommendations.filter(r => r.severity === severity);
  }

  /**
   * Get critical recommendations
   */
  getCritical() {
    return this.getByServerity('critical');
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const critical = this.recommendations.filter(r => r.severity === 'critical');
    const high = this.recommendations.filter(r => r.severity === 'high');
    const medium = this.recommendations.filter(r => r.severity === 'medium');
    const low = this.recommendations.filter(r => r.severity === 'low');

    const estimatedMinutes = critical.reduce((sum, r) => sum + (r.estimatedDowntime?.max || 30), 0);

    return {
      totalRecommendations: this.recommendations.length,
      byServerity: {
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length
      },
      averagePriority: this.recommendations.length > 0
        ? this.recommendations.reduce((sum, r) => sum + r.priority, 0) / this.recommendations.length
        : 0,
      estimatedTotalDowntime: `${estimatedMinutes} minutes`,
      highRiskUpgrades: this.recommendations.filter(r => r.riskLevel === 'critical').length
    };
  }

  /**
   * Export recommendations as CSV
   */
  exportAsCSV() {
    let csv = 'Software,Current Version,Recommended Version,Severity,Priority,Reasons,Complexity,Downtime (min),Risk\n';

    for (const rec of this.recommendations) {
      const recommended = rec.recommendedVersions && rec.recommendedVersions.length > 0
        ? rec.recommendedVersions[0].version
        : 'Unknown';
      
      const reasons = rec.reasons.join('; ').replace(/,/g, ';');
      const downtime = `${rec.estimatedDowntime.min}-${rec.estimatedDowntime.max}`;

      csv += `"${rec.name}","${rec.currentVersion}","${recommended}",${rec.severity},${rec.priority},"${reasons}",${rec.upgradeComplexity},"${downtime}",${rec.riskLevel}\n`;
    }

    return csv;
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport() {
    const summary = this.getSummary();
    const timestamp = new Date().toISOString();

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Software Upgrade Recommendations Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-card { background: white; padding: 15px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-card.critical { border-left: 4px solid #e74c3c; }
    .stat-card.high { border-left: 4px solid #f39c12; }
    .stat-card.medium { border-left: 4px solid #f1c40f; }
    .stat-card.low { border-left: 4px solid #27ae60; }
    .stat-number { font-size: 32px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #7f8c8d; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th { background: #34495e; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ecf0f1; }
    tr:hover { background: #f9f9f9; }
    .severity-critical { color: #e74c3c; font-weight: bold; }
    .severity-high { color: #f39c12; font-weight: bold; }
    .severity-medium { color: #f1c40f; font-weight: bold; }
    .severity-low { color: #27ae60; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Software Upgrade Recommendations Report</h1>
    <p>Generated: ${timestamp}</p>
  </div>

  <div class="summary">
    <div class="stat-card critical">
      <div class="stat-number">${summary.byServerity.critical}</div>
      <div class="stat-label">Critical Upgrades</div>
    </div>
    <div class="stat-card high">
      <div class="stat-number">${summary.byServerity.high}</div>
      <div class="stat-label">High Priority</div>
    </div>
    <div class="stat-card medium">
      <div class="stat-number">${summary.byServerity.medium}</div>
      <div class="stat-label">Medium Priority</div>
    </div>
    <div class="stat-card low">
      <div class="stat-number">${summary.byServerity.low}</div>
      <div class="stat-label">Low Priority</div>
    </div>
  </div>

  <h2>Upgrade Recommendations</h2>
  <table>
    <thead>
      <tr>
        <th>Software</th>
        <th>Current Version</th>
        <th>Recommended Version</th>
        <th>Severity</th>
        <th>Reasons</th>
        <th>Downtime</th>
      </tr>
    </thead>
    <tbody>
`;

    for (const rec of this.recommendations) {
      const recommended = rec.recommendedVersions && rec.recommendedVersions.length > 0
        ? rec.recommendedVersions[0].version
        : 'Unknown';
      
      const downtime = `${rec.estimatedDowntime.min}-${rec.estimatedDowntime.max} min`;

      html += `
      <tr>
        <td>${rec.name}</td>
        <td>${rec.currentVersion}</td>
        <td>${recommended}</td>
        <td class="severity-${rec.severity}">${rec.severity.toUpperCase()}</td>
        <td>${rec.reasons.join('<br>')}</td>
        <td>${downtime}</td>
      </tr>
`;
    }

    html += `
    </tbody>
  </table>
</body>
</html>
`;

    return html;
  }
}

/**
 * UpgradeScheduler: Schedule upgrades strategically
 */
class UpgradeScheduler extends EventEmitter {
  constructor(advisor) {
    super();
    this.advisor = advisor;
    this.scheduledUpgrades = [];
    this.completedUpgrades = [];
  }

  /**
   * Schedule upgrades strategically
   */
  scheduleUpgrades(maintenanceWindow = null) {
    this.scheduledUpgrades = [];

    const critical = this.advisor.getCritical();
    const high = this.advisor.getByServerity('high');
    const medium = this.advisor.getByServerity('medium');
    const low = this.advisor.getByServerity('low');

    // Schedule in phases
    const phases = [
      { upgrades: critical, phase: 1, name: 'Critical Phase', daysFromNow: 1 },
      { upgrades: high, phase: 2, name: 'High Priority Phase', daysFromNow: 7 },
      { upgrades: medium, phase: 3, name: 'Medium Priority Phase', daysFromNow: 14 },
      { upgrades: low, phase: 4, name: 'Low Priority Phase', daysFromNow: 30 }
    ];

    for (const phaseInfo of phases) {
      for (const upgrade of phaseInfo.upgrades) {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + phaseInfo.daysFromNow);

        this.scheduledUpgrades.push({
          id: `upgrade-${Date.now()}-${Math.random()}`,
          software: upgrade.name,
          currentVersion: upgrade.currentVersion,
          targetVersion: upgrade.recommendedVersions[0]?.version || 'latest',
          phase: phaseInfo.phase,
          phaseName: phaseInfo.name,
          scheduledDate: scheduledDate.toISOString(),
          status: 'scheduled',
          severity: upgrade.severity,
          complexity: upgrade.upgradeComplexity,
          estimatedDowntime: upgrade.estimatedDowntime
        });
      }
    }

    this.emit('upgrades-scheduled', { count: this.scheduledUpgrades.length, phases: 4 });
    return this.scheduledUpgrades;
  }

  /**
   * Get upgrade schedule
   */
  getSchedule() {
    return this.scheduledUpgrades.sort((a, b) => 
      new Date(a.scheduledDate) - new Date(b.scheduledDate)
    );
  }

  /**
   * Mark upgrade as completed
   */
  markCompleted(upgradeId) {
    const upgrade = this.scheduledUpgrades.find(u => u.id === upgradeId);
    if (upgrade) {
      upgrade.status = 'completed';
      upgrade.completedDate = new Date().toISOString();
      this.completedUpgrades.push(upgrade);
      this.emit('upgrade-completed', upgrade);
    }
  }
}

/**
 * Export
 */
module.exports = {
  UpgradeAdvisor,
  UpgradeScheduler
};
