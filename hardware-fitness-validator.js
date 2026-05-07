/**
 * MistTracker Hardware Fitness Validator
 * 
 * Tests performance against assumptions:
 * - Normal hardware: 16GB RAM, modern CPU, SSD storage
 * - Degraded hardware: 6.7GB usable RAM, possible CPU throttling, potential I/O issues
 * 
 * Usage: node hardware-fitness-validator.js [test-name]
 */

const { performance } = require('perf_hooks');
const os = require('os');
const { NetworkDevicePredictor } = require('./phase-17-5-beta-network-predictor');
const { ExtendedPredictionAggregator } = require('./phase-17-5-beta-extended-aggregator');

/**
 * Hardware Fitness Validator
 */
class HardwareFitnessValidator {
  constructor() {
    this.results = {
      hardware: {},
      benchmarks: {},
      fitness: {}
    };
    this.predictor = new NetworkDevicePredictor();
    this.aggregator = new ExtendedPredictionAggregator();
  }

  /**
   * Profile system hardware
   */
  profileHardware() {
    console.log('\n[HARDWARE PROFILE]');
    console.log('='.repeat(50));

    const hardware = {
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),
      usableMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),
      nodeVersion: process.version,
      uptime: Math.floor(os.uptime() / 3600)
    };

    console.log(`Platform: ${hardware.platform} ${hardware.arch}`);
    console.log(`CPUs: ${hardware.cpuCount}x ${hardware.cpuModel}`);
    console.log(`Total Memory: ${hardware.totalMemory}GB`);
    console.log(`Free Memory: ${hardware.freeMemory}GB`);
    console.log(`Usable Memory: ${hardware.usableMemory}GB`);
    console.log(`Node.js: ${hardware.nodeVersion}`);
    console.log(`System Uptime: ${hardware.uptime} hours`);

    this.results.hardware = hardware;
    return hardware;
  }

  /**
   * Benchmark: Single device prediction
   */
  benchmarkDevicePrediction(iterations = 1000) {
    console.log('\n[BENCHMARK: Device Prediction]');
    console.log('-'.repeat(50));

    const device = {
      name: 'Test Device',
      model: 'Motorola MB8621',
      type: 'modem',
      location: 'Test',
      ageYears: 3,
      currentTemp: 48,
      bandwidth: 800,
      maxBandwidth: 1000,
      criticality: 'CRITICAL'
    };

    const memBefore = process.memoryUsage().heapUsed;
    const timeBefore = performance.now();

    let successCount = 0;
    for (let i = 0; i < iterations; i++) {
      try {
        this.predictor.predictDeviceHealth(device);
        successCount++;
      } catch (e) {
        console.error(`Iteration ${i} failed: ${e.message}`);
      }
    }

    const timeAfter = performance.now();
    const memAfter = process.memoryUsage().heapUsed;

    const duration = timeAfter - timeBefore;
    const avgTime = duration / iterations;
    const memUsed = Math.round((memAfter - memBefore) / 1024);

    console.log(`Iterations: ${iterations}`);
    console.log(`Successful: ${successCount}/${iterations}`);
    console.log(`Total Time: ${duration.toFixed(2)}ms`);
    console.log(`Avg per iteration: ${avgTime.toFixed(3)}ms`);
    console.log(`Memory used: ${memUsed}KB`);

    const benchmark = {
      name: 'devicePrediction',
      iterations,
      successCount,
      totalTime: duration,
      avgTime,
      memoryUsed: memUsed,
      throughput: Math.round(iterations / (duration / 1000))
    };

    this.results.benchmarks.devicePrediction = benchmark;
    return benchmark;
  }

  /**
   * Benchmark: Mesh topology analysis
   */
  benchmarkMeshTopology(deviceCount = 8, iterations = 100) {
    console.log('\n[BENCHMARK: Mesh Topology Analysis]');
    console.log('-'.repeat(50));

    // Generate test devices
    const devices = [];
    for (let i = 0; i < deviceCount; i++) {
      devices.push({
        name: `Device ${i + 1}`,
        model: 'Test Model',
        type: ['router', 'modem', 'switch', 'wifiap', 'moca'][i % 5],
        location: `Location ${i}`,
        ageYears: 2 + (i % 3),
        currentTemp: 45 + (i % 15),
        bandwidth: 500 + (i * 100),
        maxBandwidth: 1000 + (i * 200),
        criticality: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'][i % 4]
      });
    }

    const memBefore = process.memoryUsage().heapUsed;
    const timeBefore = performance.now();

    let successCount = 0;
    for (let i = 0; i < iterations; i++) {
      try {
        this.predictor.analyzeMeshTopology(devices);
        successCount++;
      } catch (e) {
        console.error(`Iteration ${i} failed: ${e.message}`);
      }
    }

    const timeAfter = performance.now();
    const memAfter = process.memoryUsage().heapUsed;

    const duration = timeAfter - timeBefore;
    const avgTime = duration / iterations;
    const memUsed = Math.round((memAfter - memBefore) / 1024);

    console.log(`Devices: ${deviceCount}`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Successful: ${successCount}/${iterations}`);
    console.log(`Total Time: ${duration.toFixed(2)}ms`);
    console.log(`Avg per iteration: ${avgTime.toFixed(3)}ms`);
    console.log(`Memory used: ${memUsed}KB`);

    const benchmark = {
      name: 'meshTopology',
      deviceCount,
      iterations,
      successCount,
      totalTime: duration,
      avgTime,
      memoryUsed: memUsed,
      throughput: Math.round(iterations / (duration / 1000))
    };

    this.results.benchmarks.meshTopology = benchmark;
    return benchmark;
  }

  /**
   * Benchmark: Portfolio aggregation
   */
  benchmarkPortfolioAggregation(deviceCount = 8, softwareCount = 5, iterations = 50) {
    console.log('\n[BENCHMARK: Portfolio Aggregation]');
    console.log('-'.repeat(50));

    // Generate test devices
    const devices = [];
    for (let i = 0; i < deviceCount; i++) {
      devices.push({
        name: `Device ${i}`,
        model: 'Test Model',
        type: ['router', 'modem', 'switch', 'wifiap', 'moca'][i % 5],
        location: `Location ${i}`,
        ageYears: 2,
        currentTemp: 50,
        bandwidth: 700,
        maxBandwidth: 1000,
        criticality: 'HIGH'
      });
    }

    // Generate test software
    const software = [];
    for (let i = 0; i < softwareCount; i++) {
      software.push({
        name: `Software ${i}`,
        version: '1.0.0',
        eolDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        criticality: 'HIGH'
      });
    }

    const memBefore = process.memoryUsage().heapUsed;
    const timeBefore = performance.now();

    let successCount = 0;
    for (let i = 0; i < iterations; i++) {
      try {
        this.aggregator.aggregateExtendedPortfolio(software, devices);
        successCount++;
      } catch (e) {
        console.error(`Iteration ${i} failed: ${e.message}`);
      }
    }

    const timeAfter = performance.now();
    const memAfter = process.memoryUsage().heapUsed;

    const duration = timeAfter - timeBefore;
    const avgTime = duration / iterations;
    const memUsed = Math.round((memAfter - memBefore) / 1024);

    console.log(`Software: ${softwareCount}, Devices: ${deviceCount}`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Successful: ${successCount}/${iterations}`);
    console.log(`Total Time: ${duration.toFixed(2)}ms`);
    console.log(`Avg per iteration: ${avgTime.toFixed(3)}ms`);
    console.log(`Memory used: ${memUsed}KB`);

    const benchmark = {
      name: 'portfolioAggregation',
      softwareCount,
      deviceCount,
      iterations,
      successCount,
      totalTime: duration,
      avgTime,
      memoryUsed: memUsed,
      throughput: Math.round(iterations / (duration / 1000))
    };

    this.results.benchmarks.portfolioAggregation = benchmark;
    return benchmark;
  }

  /**
   * Benchmark: Memory stability under load
   */
  benchmarkMemoryStability(duration = 30000) {
    console.log('\n[BENCHMARK: Memory Stability]');
    console.log('-'.repeat(50));
    console.log(`Duration: ${duration}ms`);

    const device = {
      name: 'Test',
      model: 'Motorola MB8621',
      type: 'modem',
      location: 'Test',
      ageYears: 3,
      currentTemp: 48,
      bandwidth: 800,
      maxBandwidth: 1000
    };

    const memSamples = [];
    const startTime = performance.now();
    let iterations = 0;

    while (performance.now() - startTime < duration) {
      try {
        this.predictor.predictDeviceHealth(device);
        iterations++;

        // Sample memory every 1000 iterations
        if (iterations % 1000 === 0) {
          const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
          memSamples.push(memUsage);
        }
      } catch (e) {
        console.error(`Error at iteration ${iterations}: ${e.message}`);
        break;
      }
    }

    const elapsedTime = performance.now() - startTime;
    const avgMemory = memSamples.reduce((a, b) => a + b, 0) / memSamples.length;
    const maxMemory = Math.max(...memSamples);
    const minMemory = Math.min(...memSamples);

    console.log(`Iterations: ${iterations}`);
    console.log(`Elapsed: ${elapsedTime.toFixed(0)}ms`);
    console.log(`Throughput: ${Math.round(iterations / (elapsedTime / 1000))} ops/sec`);
    console.log(`Avg Memory: ${avgMemory.toFixed(2)}MB`);
    console.log(`Min Memory: ${minMemory.toFixed(2)}MB`);
    console.log(`Max Memory: ${maxMemory.toFixed(2)}MB`);
    console.log(`Memory Variance: ${(maxMemory - minMemory).toFixed(2)}MB`);

    const benchmark = {
      name: 'memoryStability',
      duration,
      iterations,
      elapsedTime,
      avgMemory,
      maxMemory,
      minMemory,
      variance: maxMemory - minMemory,
      throughput: Math.round(iterations / (elapsedTime / 1000))
    };

    this.results.benchmarks.memoryStability = benchmark;
    return benchmark;
  }

  /**
   * Assess fitness against assumptions
   */
  assessFitness() {
    console.log('\n[FITNESS ASSESSMENT]');
    console.log('='.repeat(50));

    const hw = this.results.hardware;
    const benchmarks = this.results.benchmarks;

    const fitness = {
      cpu: 'UNKNOWN',
      memory: 'UNKNOWN',
      performance: 'UNKNOWN',
      overall: 'UNKNOWN'
    };

    // Memory fitness
    if (hw.usableMemory >= 8) {
      fitness.memory = 'EXCELLENT';
    } else if (hw.usableMemory >= 4) {
      fitness.memory = 'GOOD';
    } else if (hw.usableMemory >= 2) {
      fitness.memory = 'FAIR';
    } else {
      fitness.memory = 'POOR';
    }

    console.log(`Memory Fitness: ${fitness.memory}`);
    console.log(`  Usable: ${hw.usableMemory}GB`);

    // CPU fitness
    if (hw.cpuCount >= 4) {
      fitness.cpu = 'EXCELLENT';
    } else if (hw.cpuCount >= 2) {
      fitness.cpu = 'GOOD';
    } else {
      fitness.cpu = 'FAIR';
    }

    console.log(`CPU Fitness: ${fitness.cpu}`);
    console.log(`  Cores: ${hw.cpuCount}`);

    // Performance fitness
    if (benchmarks.devicePrediction?.avgTime < 0.5) {
      fitness.performance = 'EXCELLENT';
    } else if (benchmarks.devicePrediction?.avgTime < 1.0) {
      fitness.performance = 'GOOD';
    } else if (benchmarks.devicePrediction?.avgTime < 5.0) {
      fitness.performance = 'FAIR';
    } else {
      fitness.performance = 'POOR';
    }

    console.log(`Performance Fitness: ${fitness.performance}`);
    console.log(`  Device prediction: ${benchmarks.devicePrediction?.avgTime.toFixed(3)}ms`);

    // Overall fitness
    if (fitness.memory === 'EXCELLENT' && fitness.cpu === 'EXCELLENT' && fitness.performance === 'EXCELLENT') {
      fitness.overall = 'PRODUCTION_READY';
    } else if (
      (fitness.memory === 'EXCELLENT' || fitness.memory === 'GOOD') &&
      (fitness.cpu === 'EXCELLENT' || fitness.cpu === 'GOOD') &&
      (fitness.performance === 'EXCELLENT' || fitness.performance === 'GOOD')
    ) {
      fitness.overall = 'ACCEPTABLE';
    } else if (fitness.memory === 'POOR' || fitness.performance === 'POOR') {
      fitness.overall = 'LIMITED';
    } else {
      fitness.overall = 'MARGINAL';
    }

    console.log(`\nOverall Fitness: ${fitness.overall}`);

    this.results.fitness = fitness;
    return fitness;
  }

  /**
   * Compare against assumptions
   */
  compareAgainstAssumptions() {
    console.log('\n[COMPARISON AGAINST ASSUMPTIONS]');
    console.log('='.repeat(50));

    const assumptions = {
      normal: {
        memory: 16,
        cpuCount: 4,
        devicePredictionTime: 0.3,
        meshTopologyTime: 5.0,
        description: 'Normal Hardware (16GB RAM, 4+ CPUs)'
      },
      degraded: {
        memory: 6.7,
        cpuCount: 2,
        devicePredictionTime: 2.0,
        meshTopologyTime: 15.0,
        description: 'Degraded Hardware (6.7GB usable, potential throttling)'
      }
    };

    console.log(`Current Hardware:`);
    console.log(`  Memory: ${this.results.hardware.usableMemory}GB`);
    console.log(`  CPUs: ${this.results.hardware.cpuCount}`);
    console.log(`  Device Prediction: ${this.results.benchmarks.devicePrediction?.avgTime.toFixed(3)}ms`);
    console.log(`  Mesh Topology: ${this.results.benchmarks.meshTopology?.avgTime.toFixed(3)}ms`);

    console.log(`\nExpected (Normal Hardware):`);
    console.log(`  Memory: ${assumptions.normal.memory}GB`);
    console.log(`  Device Prediction: ${assumptions.normal.devicePredictionTime}ms`);
    console.log(`  Mesh Topology: ${assumptions.normal.meshTopologyTime}ms`);

    console.log(`\nExpected (Degraded Hardware):`);
    console.log(`  Memory: ${assumptions.degraded.memory}GB`);
    console.log(`  Device Prediction: ${assumptions.degraded.devicePredictionTime}ms`);
    console.log(`  Mesh Topology: ${assumptions.degraded.meshTopologyTime}ms`);

    // Performance delta
    const memDelta = this.results.hardware.usableMemory / assumptions.normal.memory;
    const cpuDelta = this.results.hardware.cpuCount / assumptions.normal.cpuCount;
    const predictionDelta = this.results.benchmarks.devicePrediction?.avgTime / assumptions.normal.devicePredictionTime || 1;

    console.log(`\nPerformance Delta:`);
    console.log(`  Memory vs Normal: ${(memDelta * 100).toFixed(1)}%`);
    console.log(`  CPUs vs Normal: ${(cpuDelta * 100).toFixed(1)}%`);
    console.log(`  Prediction Time vs Normal: ${(predictionDelta * 100).toFixed(1)}%`);

    // Impact assessment
    let impact = 'MINIMAL';
    if (predictionDelta > 2.0 || memDelta < 0.5) {
      impact = 'SIGNIFICANT';
    } else if (predictionDelta > 1.5 || memDelta < 0.7) {
      impact = 'MODERATE';
    }

    console.log(`\nImpact Assessment: ${impact}`);

    return {
      assumptions,
      current: {
        memory: this.results.hardware.usableMemory,
        cpuCount: this.results.hardware.cpuCount,
        devicePredictionTime: this.results.benchmarks.devicePrediction?.avgTime
      },
      deltas: {
        memory: memDelta,
        cpu: cpuDelta,
        prediction: predictionDelta
      },
      impact
    };
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         HARDWARE FITNESS VALIDATION REPORT                 ║');
    console.log('║        MistTracker Server on Degraded Hardware             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const timestamp = new Date().toISOString();
    console.log(`Generated: ${timestamp}`);
    console.log(`System: ${this.results.hardware.platform} ${this.results.hardware.arch}`);
    console.log(`Node.js: ${this.results.hardware.nodeVersion}`);

    console.log('\n[SUMMARY]');
    console.log('-'.repeat(50));
    console.log(`Overall Fitness: ${this.results.fitness.overall}`);
    console.log(`Memory Fitness: ${this.results.fitness.memory} (${this.results.hardware.usableMemory}GB)`);
    console.log(`CPU Fitness: ${this.results.fitness.cpu} (${this.results.hardware.cpuCount} cores)`);
    console.log(`Performance Fitness: ${this.results.fitness.performance}`);

    console.log('\n[RECOMMENDATIONS]');
    console.log('-'.repeat(50));

    if (this.results.fitness.overall === 'PRODUCTION_READY') {
      console.log('✓ System is ready for production deployment');
    } else if (this.results.fitness.overall === 'ACCEPTABLE') {
      console.log('✓ System acceptable for most workloads');
      console.log('  - Monitor memory usage under load');
      console.log('  - Consider gradual deployment');
    } else if (this.results.fitness.overall === 'LIMITED') {
      console.log('⚠ System has limitations:');
      console.log('  - Limited by degraded RAM');
      console.log('  - Use conservative configuration');
      console.log('  - Monitor performance metrics');
    } else {
      console.log('✗ System marginally suitable:');
      console.log('  - Not recommended for high-traffic scenarios');
      console.log('  - Address hardware issues before scaling');
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Run full validation suite
   */
  async runFullValidation() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║    MistTracker Hardware Fitness Validation Suite           ║');
    console.log('║           Testing Against Hardware Assumptions             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    this.profileHardware();
    this.benchmarkDevicePrediction(1000);
    this.benchmarkMeshTopology(8, 100);
    this.benchmarkPortfolioAggregation(8, 5, 50);
    this.benchmarkMemoryStability(20000);
    this.assessFitness();
    this.compareAgainstAssumptions();
    this.generateReport();

    return this.results;
  }
}

/**
 * Export
 */
module.exports = { HardwareFitnessValidator };

/**
 * Run if executed directly
 */
if (require.main === module) {
  const validator = new HardwareFitnessValidator();
  validator.runFullValidation()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}
