/**
 * Phase 58: Software Lifecycle Compliance Engine
 * 
 * Ensures compliance with:
 * - Software support policies
 * - Security standards (CVE tracking)
 * - License compliance
 * - Industry regulations
 * - Internal policies
 */

const EventEmitter = require('events');

/**
 * LifecycleComplianceEngine: Comprehensive compliance tracking
 */
class LifecycleComplianceEngine extends EventEmitter {
  constructor(monitor) {
    super();
    this.monitor = monitor;
    this.compliancePolicies = new Map();
    this.licenseTracker = new Map();
    this.vulnerabilityDatabase = new Map();
    this.complianceReports = [];
  }

  /**
   * Define organization compliance policy
   */
  defineCompliancePolicy(name, policy) {
    this.compliancePolicies.set(name, {
      name,
      description: policy.description,
      rules: policy.rules,
      severity: policy.severity || 'high',
      createdAt: new Date().toISOString()
    });

    this.emit('policy-defined', { name, rules: policy.rules.length });
  }

  /**
   * POLICY: No EOL software
   */
  defineNoEolPolicy() {
    this.defineCompliancePolicy('no-eol-software', {
      description: 'All software must be within active support',
      severity: 'critical',
      rules: [
        {
          id: 'eol-check',
          check: (software) => !software.eolInfo?.eol,
          message: 'Software is end-of-life',
          action: 'require-immediate-upgrade'
        }
      ]
    });
  }

  /**
   * POLICY: Security software always updated
   */
  defineSecuritySoftwarePolicy() {
    this.defineCompliancePolicy('security-software-current', {
      description: 'Security software must always be current',
      severity: 'critical',
      rules: [
        {
          id: 'security-eol-check',
          check: (software) => {
            const isSecurity = /security|antivirus|firewall|defender/i.test(software.name);
            if (!isSecurity) return true;
            return !software.eolInfo?.eol && (!software.eolInfo?.daysUntilEol || software.eolInfo.daysUntilEol > 30);
          },
          message: 'Security software is not current',
          action: 'require-update-within-24h'
        }
      ]
    });
  }

  /**
   * POLICY: Runtime environments supported
   */
  defineRuntimeSupportPolicy() {
    this.defineCompliancePolicy('runtime-environments-supported', {
      description: 'Runtime environments must have active support',
      severity: 'high',
      rules: [
        {
          id: 'runtime-support-check',
          check: (software) => {
            const isRuntime = /node|python|java|\.net|ruby|go|php/i.test(software.name);
            if (!isRuntime) return true;
            return software.eolInfo?.supportStatus === 'active' || software.eolInfo?.supportStatus === 'long-term-support';
          },
          message: 'Runtime environment is not actively supported',
          action: 'require-upgrade-within-week'
        }
      ]
    });
  }

  /**
   * POLICY: 90-day advance warning
   */
  defineAdvanceWarningPolicy() {
    this.defineCompliancePolicy('advance-warning-90days', {
      description: 'Get 90-day advance warning before EOL',
      severity: 'medium',
      rules: [
        {
          id: 'warning-check',
          check: (software) => {
            if (!software.eolInfo?.daysUntilEol) return true;
            return software.eolInfo.daysUntilEol > 90;
          },
          message: 'Software EOL approaching within 90 days',
          action: 'notify-stakeholders'
        }
      ]
    });
  }

  /**
   * Check software against policy
   */
  checkAgainstPolicy(policyName, software) {
    const policy = this.compliancePolicies.get(policyName);
    if (!policy) {
      return { compliant: null, reason: 'Policy not found' };
    }

    const violations = [];

    for (const rule of policy.rules) {
      try {
        const passed = rule.check(software);
        if (!passed) {
          violations.push({
            ruleId: rule.id,
            message: rule.message,
            action: rule.action
          });
        }
      } catch (error) {
        console.error(`Error checking rule ${rule.id}:`, error);
      }
    }

    return {
      compliant: violations.length === 0,
      policy: policyName,
      violations,
      severity: policy.severity
    };
  }

  /**
   * Check all software against all policies
   */
  performComplianceAudit() {
    if (!this.monitor.lastFullScan) {
      return { error: 'No scan data available' };
    }

    const audit = {
      timestamp: new Date().toISOString(),
      software: [],
      policies: Array.from(this.compliancePolicies.keys()),
      violations: [],
      summary: {}
    };

    const softwareList = this.monitor.lastFullScan.eolSummary.results || [];

    for (const software of softwareList) {
      const softwareCompliance = {
        name: software.software,
        version: software.version,
        policyChecks: []
      };

      for (const policyName of audit.policies) {
        const result = this.checkAgainstPolicy(policyName, software);
        softwareCompliance.policyChecks.push(result);

        if (!result.compliant) {
          audit.violations.push({
            software: software.software,
            policy: policyName,
            violations: result.violations,
            severity: result.severity
          });
        }
      }

      audit.software.push(softwareCompliance);
    }

    // Summary statistics
    audit.summary = {
      totalSoftware: audit.software.length,
      compliantSoftware: audit.software.filter(s =>
        s.policyChecks.every(c => c.compliant)
      ).length,
      totalViolations: audit.violations.length,
      criticalViolations: audit.violations.filter(v => v.severity === 'critical').length,
      policies: audit.policies.length
    };

    this.complianceReports.push(audit);
    this.emit('compliance-audit-complete', audit.summary);

    return audit;
  }

  /**
   * Track software license compliance
   */
  trackLicense(software, license) {
    this.licenseTracker.set(software, {
      software,
      licenseType: license.type, // 'proprietary', 'open-source', 'freeware', 'trial'
      expiryDate: license.expiryDate,
      seats: license.seats || 1,
      compliance: license.compliance,
      status: this.determineLicenseStatus(license),
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Determine license status
   */
  determineLicenseStatus(license) {
    if (license.licenseType === 'freeware') return 'free';
    if (license.licenseType === 'open-source') return 'open-source';
    if (license.licenseType === 'trial') {
      const expiry = new Date(license.expiryDate);
      const today = new Date();
      if (today > expiry) return 'expired';
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return daysLeft > 30 ? 'active' : 'expiring-soon';
    }
    return 'licensed';
  }

  /**
   * Get license compliance status
   */
  getLicenseCompliance() {
    const status = {
      totalLicensed: this.licenseTracker.size,
      licenses: {}
    };

    for (const [software, license] of this.licenseTracker) {
      status.licenses[software] = {
        type: license.licenseType,
        status: license.status,
        expiryDate: license.expiryDate
      };
    }

    return status;
  }

  /**
   * Track CVE vulnerabilities
   */
  addVulnerability(software, version, cve, severity) {
    const key = `${software}@${version}`;
    
    if (!this.vulnerabilityDatabase.has(key)) {
      this.vulnerabilityDatabase.set(key, []);
    }

    this.vulnerabilityDatabase.get(key).push({
      cve,
      severity,
      discoveredDate: new Date().toISOString(),
      fixed: false
    });

    this.emit('vulnerability-detected', { software, version, cve, severity });
  }

  /**
   * Check for vulnerabilities
   */
  getVulnerabilities(software, version) {
    const key = `${software}@${version}`;
    return this.vulnerabilityDatabase.get(key) || [];
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport() {
    const latestAudit = this.complianceReports.length > 0
      ? this.complianceReports[this.complianceReports.length - 1]
      : null;

    return {
      reportType: 'software-lifecycle-compliance',
      generatedAt: new Date().toISOString(),
      auditSummary: latestAudit?.summary || null,
      licenseStatus: this.getLicenseCompliance(),
      vulnerabilityCount: this.vulnerabilityDatabase.size,
      policies: {
        total: this.compliancePolicies.size,
        active: Array.from(this.compliancePolicies.keys())
      },
      recommendations: this.generateRecommendations(latestAudit)
    };
  }

  /**
   * Generate compliance recommendations
   */
  generateRecommendations(audit) {
    const recommendations = [];

    if (!audit) return recommendations;

    // Critical violations
    if (audit.summary.criticalViolations > 0) {
      recommendations.push({
        priority: 'critical',
        title: 'Critical Policy Violations',
        description: `${audit.summary.criticalViolations} critical policy violations detected`,
        action: 'Address immediately to maintain compliance'
      });
    }

    // Non-compliant software
    const noncompliant = audit.software.filter(s =>
      s.policyChecks.some(c => !c.compliant)
    ).length;

    if (noncompliant > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Non-Compliant Software',
        description: `${noncompliant} software instances not compliant with policies`,
        action: 'Review and upgrade non-compliant software'
      });
    }

    // License expiring
    const expiringLicenses = Array.from(this.licenseTracker.values())
      .filter(l => l.status === 'expiring-soon').length;

    if (expiringLicenses > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Licenses Expiring Soon',
        description: `${expiringLicenses} licenses will expire within 30 days`,
        action: 'Renew licenses before expiration'
      });
    }

    return recommendations;
  }

  /**
   * Export compliance data
   */
  exportComplianceData() {
    return {
      policies: Array.from(this.compliancePolicies.entries()).map(([name, policy]) => ({
        name,
        ...policy
      })),
      licenses: Array.from(this.licenseTracker.entries()).map(([software, license]) => ({
        software,
        ...license
      })),
      vulnerabilities: Array.from(this.vulnerabilityDatabase.entries()).map(([key, vulns]) => ({
        software: key,
        vulnerabilities: vulns
      })),
      reports: this.complianceReports.slice(-10)
    };
  }
}

/**
 * Export
 */
module.exports = {
  LifecycleComplianceEngine
};
