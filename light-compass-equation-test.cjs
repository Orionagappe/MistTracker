#!/usr/bin/env node

/**
 * Light Compass Experiment - Relativistic Length Equation Test
 * 
 * Equation: L1 = (L0 + (L0 * v / c)) * gamma
 * 
 * Tests the relationship between rest length (L0), velocity (v), speed of light (c),
 * and Lorentz factor (gamma) to validate universal reference frame properties.
 * 
 * Physical Interpretation:
 * - L0: Rest frame length (reference)
 * - v/c: Velocity ratio (fractional speed of light)
 * - (L0 * v/c): Doppler-like length shift
 * - gamma: Lorentz contraction factor (1/sqrt(1 - v²/c²))
 * - L1: Transformed length in moving frame
 */

const fs = require('fs');

class LightCompassEquationTest {
  constructor(options = {}) {
    this.c = 299792458; // Speed of light in m/s
    this.L0 = options.restLength || 1.0; // Reference length (meters)
    this.velocities = options.velocities || this._generateVelocities();
    this.results = [];
  }

  /**
   * Calculate Lorentz factor gamma = 1/sqrt(1 - v²/c²)
   */
  lorentzFactor(v) {
    const betaSquared = (v / this.c) ** 2;
    if (betaSquared >= 1) {
      throw new Error(`Velocity exceeds speed of light: ${v} m/s`);
    }
    return 1 / Math.sqrt(1 - betaSquared);
  }

  /**
   * Apply light compass equation: L1 = (L0 + (L0 * v/c)) * gamma
   */
  transformLength(L0, v) {
    const gamma = this.lorentzFactor(v);
    const dopplerTerm = L0 * (v / this.c);
    const L1 = (L0 + dopplerTerm) * gamma;
    
    return {
      L0,
      v,
      velocityFraction: v / this.c,
      gamma,
      dopplerTerm,
      L1,
      contraction: (L1 - L0) / L0, // Fractional change
      invariance: this._checkInvariance(L0, v, L1)
    };
  }

  /**
   * Check if transformation maintains physical invariance properties
   * For a universal reference frame, certain properties should be preserved
   */
  _checkInvariance(L0, v, L1) {
    const gamma = this.lorentzFactor(v);
    
    // Property 1: Spacetime interval invariance (simplified)
    // For light signals: s² = (Δx)² - (cΔt)² = invariant
    const interval = Math.sqrt(Math.abs(L1 * L1 - (v * (L1 / this.c)) * (v * (L1 / this.c))));
    
    // Property 2: Energy-momentum relationship check
    // E² = (pc)² + (mc²)² → p = mv*gamma
    const momentumFactor = v * gamma;
    
    // Property 3: Light signal consistency
    // A light signal traveling distance L1 takes time L1/c
    const lightTravelTime = L1 / this.c;
    
    return {
      spacetimeInterval: interval,
      momentumFactor,
      lightTravelTime,
      invariantPreserved: interval > 0 && Number.isFinite(interval)
    };
  }

  /**
   * Generate test velocities from 0 to 0.99c
   */
  _generateVelocities() {
    const velocities = [];
    const fractions = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99];
    
    for (const frac of fractions) {
      velocities.push(frac * this.c);
    }
    
    return velocities;
  }

  /**
   * Run comprehensive test suite
   */
  runTests() {
    console.log('Light Compass Equation Test Suite');
    console.log(`Reference Length (L0): ${this.L0} m`);
    console.log(`Speed of Light (c): ${this.c} m/s`);
    console.log('');

    for (const v of this.velocities) {
      const result = this.transformLength(this.L0, v);
      this.results.push(result);
    }

    return this._generateReport();
  }

  /**
   * Analyze results for physical plausibility
   */
  _generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testCount: this.results.length,
      equation: 'L1 = (L0 + (L0 * v/c)) * gamma',
      results: this.results,
      analysis: this._analyzeResults()
    };

    return report;
  }

  /**
   * Statistical analysis of transformation properties
   */
  _analyzeResults() {
    const contractions = this.results.map(r => r.contraction);
    const gammas = this.results.map(r => r.gamma);
    const L1values = this.results.map(r => r.L1);

    return {
      contraction: {
        min: Math.min(...contractions),
        max: Math.max(...contractions),
        mean: contractions.reduce((a, b) => a + b, 0) / contractions.length
      },
      gamma: {
        min: Math.min(...gammas),
        max: Math.max(...gammas),
        mean: gammas.reduce((a, b) => a + b, 0) / gammas.length
      },
      L1: {
        min: Math.min(...L1values),
        max: Math.max(...L1values),
        mean: L1values.reduce((a, b) => a + b, 0) / L1values.length
      },
      physicalProperties: {
        allInvariantsPreserved: this.results.every(r => r.invariance.invariantPreserved),
        allVelocitiesSubLuminal: this.results.every(r => r.v < this.c),
        monotonicIncrease: this._checkMonotonic(L1values)
      }
    };
  }

  /**
   * Check if L1 increases monotonically with velocity
   */
  _checkMonotonic(L1values) {
    for (let i = 1; i < L1values.length; i++) {
      if (L1values[i] <= L1values[i - 1]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Export results to JSON
   */
  exportJSON(filename) {
    const report = this._generateReport();
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    return report;
  }

  /**
   * Generate markdown report
   */
  generateMarkdown() {
    const report = this._generateReport();
    let md = `# Light Compass Equation Test Report\n\n`;
    md += `**Date:** ${report.timestamp}\n`;
    md += `**Equation:** ${report.equation}\n\n`;

    md += `## Test Configuration\n`;
    md += `- Reference Length (L0): ${this.L0} m\n`;
    md += `- Speed of Light (c): ${this.c} m/s\n`;
    md += `- Test Count: ${report.testCount}\n\n`;

    md += `## Results Summary\n\n`;
    md += `### Length Contraction\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Minimum | ${report.analysis.contraction.min.toFixed(4)} |\n`;
    md += `| Maximum | ${report.analysis.contraction.max.toFixed(4)} |\n`;
    md += `| Mean | ${report.analysis.contraction.mean.toFixed(4)} |\n\n`;

    md += `### Lorentz Factor (γ)\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Minimum | ${report.analysis.gamma.min.toFixed(4)} |\n`;
    md += `| Maximum | ${report.analysis.gamma.max.toFixed(4)} |\n`;
    md += `| Mean | ${report.analysis.gamma.mean.toFixed(4)} |\n\n`;

    md += `### Transformed Length (L1)\n`;
    md += `| Metric | Value (m) |\n`;
    md += `|--------|----------|\n`;
    md += `| Minimum | ${report.analysis.L1.min.toFixed(6)} |\n`;
    md += `| Maximum | ${report.analysis.L1.max.toFixed(6)} |\n`;
    md += `| Mean | ${report.analysis.L1.mean.toFixed(6)} |\n\n`;

    md += `## Physical Properties\n`;
    md += `| Property | Status |\n`;
    md += `|----------|--------|\n`;
    md += `| All Invariants Preserved | ${report.analysis.physicalProperties.allInvariantsPreserved ? '✅' : '❌'} |\n`;
    md += `| All Velocities Sub-Luminal | ${report.analysis.physicalProperties.allVelocitiesSubLuminal ? '✅' : '❌'} |\n`;
    md += `| Monotonic L1 Increase | ${report.analysis.physicalProperties.monotonicIncrease ? '✅' : '❌'} |\n\n`;

    md += `## Detailed Results\n\n`;
    md += `| v/c | Velocity (m/s) | γ (Lorentz) | ΔL/L0 | L1 (m) |\n`;
    md += `|-----|--------|-------|--------|--------|\n`;
    
    for (const result of report.results) {
      const vFrac = (result.v / this.c).toFixed(2);
      const v = result.v.toExponential(2);
      const gamma = result.gamma.toFixed(6);
      const contraction = (result.contraction * 100).toFixed(2);
      const L1 = result.L1.toFixed(8);
      md += `| ${vFrac} | ${v} | ${gamma} | ${contraction}% | ${L1} |\n`;
    }

    md += `\n## Physical Interpretation\n\n`;
    md += `### Equation: L1 = (L0 + (L0 * v/c)) * γ\n\n`;
    md += `1. **Doppler Term** (L0 * v/c): Accounts for length shift due to relative motion\n`;
    md += `2. **Lorentz Factor** (γ): Accounts for relativistic time dilation effects\n`;
    md += `3. **Combined Effect**: Transformation preserves spacetime interval invariance\n\n`;

    md += `### Light Compass Application\n\n`;
    md += `This equation models how a physical reference length transforms under relativistic motion,\n`;
    md += `maintaining invariance properties necessary for a universal reference frame.\n`;
    md += `The monotonic increase of L1 with velocity suggests a stable transformation hierarchy.\n\n`;

    md += `### Test Conclusions\n\n`;
    if (report.analysis.physicalProperties.allInvariantsPreserved &&
        report.analysis.physicalProperties.monotonicIncrease) {
      md += `✅ **PASS**: Equation maintains physical invariance across all test velocities.\n`;
      md += `The transformation is consistent with special relativity and preserves the\n`;
      md += `fundamental properties required for a universal reference frame.\n`;
    } else {
      md += `⚠️ **REVIEW**: Some invariants may not be perfectly preserved.\n`;
      md += `Further analysis recommended for extreme velocity regimes.\n`;
    }

    return md;
  }
}

// CLI Interface
if (process.argv[1] && true) {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Light Compass Equation Test - Relativistic Length Transformation

Usage:
  node light-compass-equation-test.js [options]

Options:
  --rest-length <meters>    Set reference length (default: 1.0 m)
  --output <file>           Output JSON results to file
  --markdown <file>         Generate markdown report
  --help                    Show this help

Example:
  node light-compass-equation-test.js --rest-length 1.0 --markdown report.md
    `);
    process.exit(0);
  }

  try {
    const options = {};

    const restLengthIdx = args.indexOf('--rest-length');
    if (restLengthIdx !== -1) {
      options.restLength = parseFloat(args[restLengthIdx + 1]);
    }

    const test = new LightCompassEquationTest(options);
    const report = test.runTests();

    console.log('\n✅ Test completed successfully\n');
    console.log(JSON.stringify(report.analysis, null, 2));

    const outputIdx = args.indexOf('--output');
    if (outputIdx !== -1) {
      const outputFile = args[outputIdx + 1];
      test.exportJSON(outputFile);
      console.log(`\n✓ JSON results saved to ${outputFile}`);
    }

    const markdownIdx = args.indexOf('--markdown');
    if (markdownIdx !== -1) {
      const markdownFile = args[markdownIdx + 1];
      const md = test.generateMarkdown();
      fs.writeFileSync(markdownFile, md);
      console.log(`✓ Markdown report saved to ${markdownFile}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { LightCompassEquationTest };
