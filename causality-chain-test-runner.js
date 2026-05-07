/**
 * Causality Chain Validation Test Runner
 * Executes all validation rules and generates reports
 * Date: April 21, 2026
 */

import { 
  CausalityChainCompletion, 
  CAUSALITY_CHAIN,
  VALIDATION_RULES 
} from './causality-chain-completion.js';
import fs from 'fs';
import path from 'path';

/**
 * Test Runner Class
 * Orchestrates validation testing across the entire chain
 */
class CausalityChainTestRunner {
  constructor(outputDir = './causality-test-results') {
    this.completion = new CausalityChainCompletion();
    this.outputDir = outputDir;
    this.results = [];
    this.ensureOutputDir();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Run all validations for a specific phase
   * @param {string} phaseKey - Phase to validate
   * @returns {Promise<Object>} Test results
   */
  async runPhaseValidations(phaseKey) {
    console.log(`\n📋 Running validations for: ${phaseKey}`);
    
    const validation = await this.completion.validatePhase(phaseKey);
    this.results.push(validation);
    
    // Print results
    if (validation.blocked) {
      console.log(`  ⛔ BLOCKED by: ${validation.blockedBy.join(', ')}`);
      return validation;
    }

    validation.validations.forEach(v => {
      const icon = v.passed ? '✅' : '❌';
      console.log(`  ${icon} ${v.rule}: ${v.passed ? 'PASS' : 'FAIL'}`);
      if (v.details) {
        console.log(`     ${v.details}`);
      }
    });

    const percent = validation.totalValidations > 0 
      ? Math.round((validation.passedValidations / validation.totalValidations) * 100)
      : 0;
    console.log(`  📊 Result: ${validation.passedValidations}/${validation.totalValidations} (${percent}%)`);

    return validation;
  }

  /**
   * Run all phase validations sequentially
   * @returns {Promise<Array>} All results
   */
  async runAllPhaseValidations() {
    console.log('=== CAUSALITY CHAIN VALIDATION TEST SUITE ===');
    console.log(`Started: ${new Date().toISOString()}\n`);

    const phases = Object.keys(CAUSALITY_CHAIN);
    
    for (const phaseKey of phases) {
      await this.runPhaseValidations(phaseKey);
    }

    return this.results;
  }

  /**
   * Generate comprehensive test report
   * @returns {Object} Test report
   */
  generateTestReport() {
    const totalPhases = this.results.length;
    const passedPhases = this.results.filter(r => !r.blocked && r.allPassed).length;
    const blockedPhases = this.results.filter(r => r.blocked).length;
    const failedPhases = this.results.filter(r => !r.blocked && !r.allPassed).length;

    let totalValidations = 0;
    let passedValidations = 0;

    this.results.forEach(r => {
      if (!r.blocked) {
        totalValidations += r.totalValidations || 0;
        passedValidations += r.passedValidations || 0;
      }
    });

    const successRate = totalValidations > 0 
      ? Math.round((passedValidations / totalValidations) * 100)
      : 0;

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalPhases,
        passedPhases,
        failedPhases,
        blockedPhases,
        successRate: `${successRate}%`,
        totalValidations,
        passedValidations
      },
      phases: this.results,
      recommendations: this.generateRecommendations(),
      nextActions: this.completion.identifyNextSteps()
    };
  }

  /**
   * Generate recommendations based on test results
   * @returns {Array} Recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    this.results.forEach(result => {
      if (result.blocked) {
        recommendations.push({
          severity: 'CRITICAL',
          phase: result.phase,
          recommendation: `Resolve blocking dependencies: ${result.blockedBy.join(', ')}`,
          action: 'Address blocking phases first'
        });
      } else if (!result.allPassed) {
        const failed = result.validations.filter(v => !v.passed);
        recommendations.push({
          severity: 'HIGH',
          phase: result.phase,
          recommendation: `Fix failing validations: ${failed.map(f => f.rule).join(', ')}`,
          action: 'Review and fix validation failures'
        });
      }
    });

    // Check critical path
    const criticalPath = this.completion.identifyCriticalPath();
    const criticalResults = this.results.filter(r => criticalPath.includes(r.phase));
    const criticalBlocked = criticalResults.some(r => r.blocked);
    
    if (criticalBlocked) {
      recommendations.unshift({
        severity: 'CRITICAL',
        phase: 'CRITICAL_PATH',
        recommendation: 'Critical path contains blocked phases',
        action: 'Unblock critical path phases to enable Q3 2026 deployment'
      });
    }

    return recommendations;
  }

  /**
   * Save test results to file
   * @returns {string} File path
   */
  saveResults() {
    const report = this.generateTestReport();
    const filename = path.join(
      this.outputDir,
      `causality-validation-${new Date().toISOString().split('T')[0]}.json`
    );
    
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    return filename;
  }

  /**
   * Generate human-readable test report markdown
   * @returns {string} Markdown report
   */
  generateMarkdownReport() {
    const report = this.generateTestReport();
    let markdown = `# Causality Chain Validation Test Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n\n`;

    markdown += `## Summary\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Phases | ${report.summary.totalPhases} |\n`;
    markdown += `| Passed Phases | ${report.summary.passedPhases} |\n`;
    markdown += `| Failed Phases | ${report.summary.failedPhases} |\n`;
    markdown += `| Blocked Phases | ${report.summary.blockedPhases} |\n`;
    markdown += `| Overall Success Rate | ${report.summary.successRate} |\n`;
    markdown += `| Total Validations | ${report.summary.totalValidations} |\n`;
    markdown += `| Passed Validations | ${report.summary.passedValidations} |\n\n`;

    markdown += `## Detailed Phase Results\n`;
    report.phases.forEach(phase => {
      markdown += `### ${phase.phase}\n`;
      markdown += `**Status:** ${phase.status}\n`;
      
      if (phase.blocked) {
        markdown += `⛔ **BLOCKED** by: ${phase.blockedBy.join(', ')}\n\n`;
      } else {
        markdown += `✅ **Validations:** ${phase.passedValidations}/${phase.totalValidations}\n\n`;
        phase.validations.forEach(v => {
          const icon = v.passed ? '✅' : '❌';
          markdown += `${icon} **${v.rule}**\n`;
          markdown += `   - ${v.description}\n`;
          if (v.details) {
            markdown += `   - ${v.details}\n`;
          }
        });
      }
      markdown += `\n`;
    });

    markdown += `## Recommendations\n`;
    report.recommendations.forEach(rec => {
      const icon = rec.severity === 'CRITICAL' ? '🔴' : '🟡';
      markdown += `${icon} **${rec.severity}** - ${rec.phase}\n`;
      markdown += `   - Recommendation: ${rec.recommendation}\n`;
      markdown += `   - Action: ${rec.action}\n\n`;
    });

    markdown += `## Next Steps\n`;
    report.nextActions.forEach((step, i) => {
      markdown += `${i + 1}. [${step.priority}] ${step.action}\n`;
    });

    return markdown;
  }

  /**
   * Save markdown report
   * @returns {string} File path
   */
  saveMarkdownReport() {
    const markdown = this.generateMarkdownReport();
    const filename = path.join(
      this.outputDir,
      `causality-validation-${new Date().toISOString().split('T')[0]}.md`
    );
    
    fs.writeFileSync(filename, markdown);
    return filename;
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const report = this.generateTestReport();
    
    console.log('\n=== TEST RESULTS SUMMARY ===\n');
    console.log(`Total Phases: ${report.summary.totalPhases}`);
    console.log(`✅ Passed: ${report.summary.passedPhases}`);
    console.log(`❌ Failed: ${report.summary.failedPhases}`);
    console.log(`⛔ Blocked: ${report.summary.blockedPhases}`);
    console.log(`📊 Overall Success Rate: ${report.summary.successRate}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n=== RECOMMENDATIONS ===\n');
      report.recommendations.forEach(rec => {
        console.log(`[${rec.severity}] ${rec.phase}`);
        console.log(`  → ${rec.recommendation}`);
      });
    }
    
    console.log('\n=== NEXT ACTIONS ===\n');
    report.nextActions.forEach((action, i) => {
      console.log(`${i + 1}. [${action.priority}] ${action.action}`);
    });
  }
}

/**
 * Run complete test suite
 */
async function runCompleteSuite() {
  const runner = new CausalityChainTestRunner();
  
  // Run all validations
  await runner.runAllPhaseValidations();
  
  // Save results
  const jsonPath = runner.saveResults();
  const mdPath = runner.saveMarkdownReport();
  
  // Print summary
  runner.printSummary();
  
  console.log(`\n📁 Results saved to:`);
  console.log(`  - JSON: ${jsonPath}`);
  console.log(`  - Markdown: ${mdPath}`);
  
  return runner;
}

// Export
export { CausalityChainTestRunner, runCompleteSuite };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteSuite().catch(console.error);
}
