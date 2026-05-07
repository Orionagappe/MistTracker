#!/usr/bin/env node

/**
 * Phase 16.4.1: Complex Feature Extractor
 * 
 * Generates 20-dimensional complex-valued feature vectors representing
 * quantum orbital basis functions for the hydrogen atom.
 * 
 * Each feature is a complex exponential matching hydrogen orbital structure:
 * - Real components: Radial decay (e.g., exp(-r), exp(-r/2))
 * - Imaginary components: Angular phase (e.g., e^(imθ))
 */

import * as Complex from '../SymbolicExpression.js';

/**
 * Extract 20-dimensional complex feature vector
 * 
 * Features designed to span the space of hydrogen orbitals:
 * Ψ_nlm(r,θ) = R_nl(r) * e^(imθ)
 * 
 * @param {number} r - Radial coordinate (distance from nucleus, 0 < r < ∞)
 * @param {number} theta - Angular coordinate (0 ≤ θ ≤ 2π)
 * @returns {Array<Array>} Array of 20 complex numbers [type, real, imag, form]
 */
export function extractComplexFeatures(r, theta = 0) {
  const features = [];
  
  // Guard against invalid inputs
  if (r <= 0) r = 0.001;  // Avoid singularity at r=0
  r = Math.min(r, 20);     // Clip at large r (physics decays)
  
  // ========================================================================
  // GROUP 1: Ground State & Excited States - Core Basis (8 features)
  // ========================================================================
  
  // Feature 0: 1s orbital - exp(-r) * e^(i*0) = exp(-r)
  // Ground state with no angular dependence
  const exp_r = Math.exp(-r);
  features.push(Complex.makeComplex(exp_r, 0));
  
  // Feature 1: 2s orbital - (1/√2) * exp(-r/2) * e^(i*0)
  // First excited radial state
  const exp_r_2 = Math.exp(-r / 2) / Math.sqrt(2);
  features.push(Complex.makeComplex(exp_r_2, 0));
  
  // Feature 2: 2p with m=0 - (1/(2√6)) * r * exp(-r/2) * e^(i*0)
  // First p-orbital
  const r_exp_r_2 = (r * Math.exp(-r / 2)) / (2 * Math.sqrt(6));
  features.push(Complex.makeComplex(r_exp_r_2, 0));
  
  // Feature 3: 2p with phase - (1/(2√6)) * r * exp(-r/2) * e^(i*θ)
  // Angular dependence m=1
  const real_3 = r_exp_r_2 * Math.cos(theta);
  const imag_3 = r_exp_r_2 * Math.sin(theta);
  features.push(Complex.makeComplex(real_3, imag_3));
  
  // Feature 4: 3s orbital - (2/(3√3)) * exp(-r/3) * e^(i*0)
  const exp_r_3 = (2 * Math.exp(-r / 3)) / (3 * Math.sqrt(3));
  features.push(Complex.makeComplex(exp_r_3, 0));
  
  // Feature 5: 3p orbital - (4/(27√30)) * r * exp(-r/3) * e^(i*0)
  const r_exp_r_3 = (4 * r * Math.exp(-r / 3)) / (27 * Math.sqrt(30));
  features.push(Complex.makeComplex(r_exp_r_3, 0));
  
  // Feature 6: 3p with phase - 3p angular component
  const real_6 = r_exp_r_3 * Math.cos(theta);
  const imag_6 = r_exp_r_3 * Math.sin(theta);
  features.push(Complex.makeComplex(real_6, imag_6));
  
  // Feature 7: 4s orbital - exp(-r/4)
  const exp_r_4 = Math.exp(-r / 4);
  features.push(Complex.makeComplex(exp_r_4, 0));
  
  // ========================================================================
  // GROUP 2: Radial Modulation - Interactions (6 features)
  // ========================================================================
  
  // Feature 8: r * exp(-r) - radial scaling of ground state
  const r_exp_r = r * Math.exp(-r);
  features.push(Complex.makeComplex(r_exp_r, 0));
  
  // Feature 9: r * exp(-r/2) - radial scaling of 2s basis
  const r_exp_r_2_plain = r * Math.exp(-r / 2);
  features.push(Complex.makeComplex(r_exp_r_2_plain, 0));
  
  // Feature 10: r² * exp(-r) - quadratic radial enhancement
  const r2_exp_r = r * r * Math.exp(-r);
  features.push(Complex.makeComplex(r2_exp_r, 0));
  
  // Feature 11: exp(-2r) - double decay
  const exp_2r = Math.exp(-2 * r);
  features.push(Complex.makeComplex(exp_2r, 0));
  
  // Feature 12: exp(-r) * sin(r/2) - oscillating ground state
  const osc_1 = Math.exp(-r) * Math.sin(r / 2);
  features.push(Complex.makeComplex(osc_1, 0));
  
  // Feature 13: exp(-r/2) * cos(r) - oscillating 2s basis
  const osc_2 = Math.exp(-r / 2) * Math.cos(r);
  features.push(Complex.makeComplex(osc_2, 0));
  
  // ========================================================================
  // GROUP 3: Angular Components - Magnetic States (4 features)
  // ========================================================================
  
  // Feature 14: e^(i*θ) - magnetic quantum number m=1
  const e_i_theta = Complex.makeComplex(Math.cos(theta), Math.sin(theta));
  features.push(e_i_theta);
  
  // Feature 15: e^(i*2θ) - m=2 state
  const e_i_2theta = Complex.makeComplex(Math.cos(2 * theta), Math.sin(2 * theta));
  features.push(e_i_2theta);
  
  // Feature 16: exp(-r) * e^(i*θ) - ground + angular
  const real_16 = exp_r * Math.cos(theta);
  const imag_16 = exp_r * Math.sin(theta);
  features.push(Complex.makeComplex(real_16, imag_16));
  
  // Feature 17: exp(-r/2) * e^(i*θ/2) - 2s + fractional phase
  const real_17 = exp_r_2 * Math.cos(theta / 2);
  const imag_17 = exp_r_2 * Math.sin(theta / 2);
  features.push(Complex.makeComplex(real_17, imag_17));
  
  // ========================================================================
  // GROUP 4: Hybrid Features - Cross Terms (2 features)
  // ========================================================================
  
  // Feature 18: (r * exp(-r)) * e^(i*θ) - radial + angular
  const real_18 = r_exp_r * Math.cos(theta);
  const imag_18 = r_exp_r * Math.sin(theta);
  features.push(Complex.makeComplex(real_18, imag_18));
  
  // Feature 19: Normalization indicator - constant bias
  // Set magnitude to 1, phase varies with r (energy-like behavior)
  const phase_19 = r / (1 + r);  // Smooth function from 0 to 1
  features.push(Complex.makeComplex(Math.cos(phase_19), Math.sin(phase_19)));
  
  return features;
}

/**
 * Verify feature extraction produces valid complex numbers
 * @param {Array} features - Feature array
 * @returns {boolean} True if all features are valid complex numbers
 */
export function validateFeatures(features) {
  if (!Array.isArray(features) || features.length !== 20) {
    return false;
  }
  
  for (const feature of features) {
    if (!Array.isArray(feature) || feature.length !== 4) {
      return false;
    }
    const [type, real, imag] = feature;
    if (typeof real !== 'number' || typeof imag !== 'number') {
      return false;
    }
  }
  
  return true;
}

/**
 * Convert feature vector to magnitude and phase arrays for debugging
 * @param {Array} features - Feature array
 * @returns {Object} {magnitudes, phases}
 */
export function featureMetrics(features) {
  const magnitudes = [];
  const phases = [];
  
  for (const feature of features) {
    const magnitude = Complex.modulusComplex(feature);
    const phase = Complex.argumentComplex(feature);
    magnitudes.push(magnitude);
    phases.push(phase);
  }
  
  return { magnitudes, phases };
}

/**
 * Display features in human-readable format
 * @param {Array} features - Feature array
 * @param {number} decimals - Decimal places for formatting
 */
export function displayFeatures(features, decimals = 4) {
  console.log('\nComplex Features Extracted:');
  console.log('=' .repeat(80));
  console.log('Index | Real Part        | Imaginary Part   | Magnitude  | Phase (rad)');
  console.log('-'.repeat(80));
  
  for (let i = 0; i < features.length; i++) {
    const result = Complex.evaluateComplex(features[i]);
    const real = result.real.toFixed(decimals);
    const imag = result.imag.toFixed(decimals);
    const mag = result.magnitude.toFixed(decimals);
    const phase = result.phase.toFixed(decimals);
    
    console.log(`${i.toString().padEnd(5)} | ${real.padEnd(16)} | ${imag.padEnd(16)} | ${mag.padEnd(10)} | ${phase}`);
  }
  
  console.log('-'.repeat(80));
}

// ============================================================================
// USAGE & TESTING
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  // Run as standalone script for testing
  
  console.log('Phase 16.4.1: Complex Feature Extractor - Test');
  console.log('='.repeat(80));
  
  // Test 1: Extract features for ground state
  console.log('\n[TEST 1] Ground state: r=1.0, θ=0');
  const features_1 = extractComplexFeatures(1.0, 0);
  console.log(`✓ Extracted ${features_1.length} features`);
  console.log(`✓ Valid: ${validateFeatures(features_1) ? 'YES' : 'NO'}`);
  displayFeatures(features_1, 4);
  
  // Test 2: Extract features with angular dependence
  console.log('\n[TEST 2] Angular state: r=2.0, θ=π/4');
  const features_2 = extractComplexFeatures(2.0, Math.PI / 4);
  console.log(`✓ Extracted ${features_2.length} features`);
  console.log(`✓ Valid: ${validateFeatures(features_2) ? 'YES' : 'NO'}`);
  
  // Test 3: Feature metrics
  const metrics = featureMetrics(features_2);
  console.log('\nFeature Magnitude Statistics:');
  const magMean = metrics.magnitudes.reduce((a, b) => a + b) / metrics.magnitudes.length;
  const magMax = Math.max(...metrics.magnitudes);
  const magMin = Math.min(...metrics.magnitudes);
  console.log(`  Mean: ${magMean.toFixed(6)}`);
  console.log(`  Min:  ${magMin.toFixed(6)}`);
  console.log(`  Max:  ${magMax.toFixed(6)}`);
  
  // Test 4: Boundary conditions
  console.log('\n[TEST 4] Boundary condition: r→0');
  const features_small = extractComplexFeatures(0.001, 0);
  const metrics_small = featureMetrics(features_small);
  console.log(`✓ Ground state feature (1s): ${metrics_small.magnitudes[0].toFixed(6)}`);
  console.log(`  (Should be close to 1.0 from exp(-0.001) ≈ 0.999)`);
  
  console.log('\n[TEST 5] Boundary condition: r→∞');
  const features_large = extractComplexFeatures(20, 0);
  const metrics_large = featureMetrics(features_large);
  console.log(`✓ Ground state feature (1s): ${metrics_large.magnitudes[0].toFixed(6)}`);
  console.log(`  (Should be close to 0.0 from exp(-20) ≈ 2e-9)`);
  
  console.log('\n✅ All extraction tests complete');
}
