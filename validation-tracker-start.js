/**
 * Validation Tracker - Configuration & Startup
 * 
 * Automatically runs 3+ weekly validation attempts without manual observation
 * Logs results asynchronously for weekly reporting
 * 
 * Usage:
 *   node validation-tracker-start.js
 * 
 * Logs will be saved to:
 *   - ./validation-logs/ (JSON results)
 *   - ./validation-metrics/ (Weekly markdown reports)
 */

const { ValidationTracker, StandardValidators } = require('./validation-tracking-system');

// Create tracker instance
// Interval set to 8 hours = 3 attempts per 24-hour period
const tracker = new ValidationTracker({
  logDir: './validation-logs',
  metricsDir: './validation-metrics',
  interval: 8 * 60 * 60 * 1000, // 8 hours
  minWeekly: 3 // Minimum 3 attempts per week
});

// Register validators
tracker.registerValidator('System Health', StandardValidators.systemHealth);
tracker.registerValidator('Geometry Creation', StandardValidators.geometryCreation);
tracker.registerValidator('Physics Simulation', StandardValidators.physicsSimulation);
tracker.registerValidator('Data Persistence', StandardValidators.dataPersistence);

// Event listeners
tracker.on('validation-complete', (results) => {
  const status = results.summary.passed === results.summary.total ? '✅' : '⚠️';
  console.log(`${status} Attempt ${results.attemptId}: ${results.summary.passed}/${results.summary.total} passed`);
});

tracker.on('validator-error', (event) => {
  console.error(`❌ ${event.validator}: ${event.error}`);
});

tracker.on('started', () => {
  console.log('🚀 Validation tracker is now running');
  console.log('   - Interval: Every 8 hours');
  console.log('   - Target: 3+ attempts per week');
  console.log('   - Logs: ./validation-logs/');
  console.log('   - Reports: ./validation-metrics/');
});

tracker.on('stopped', () => {
  console.log('⛔ Validation tracker stopped');
});

// Start tracking
tracker.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down validation tracker...');
  tracker.stop();
  process.exit(0);
});

// Generate weekly report every Sunday at midnight
const scheduleWeeklyReport = () => {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(nextSunday.getDate() + (0 - nextSunday.getDay()) % 7);
  nextSunday.setHours(0, 0, 0, 0);

  const timeUntilSunday = nextSunday - now;

  console.log(`📅 Weekly report will be generated on Sunday at midnight`);

  setTimeout(() => {
    tracker.saveWeeklyMarkdown();
    // Then schedule for next week
    setInterval(() => {
      tracker.saveWeeklyMarkdown();
    }, 7 * 24 * 60 * 60 * 1000); // Every 7 days
  }, timeUntilSunday);
};

scheduleWeeklyReport();

// Export for programmatic access
module.exports = tracker;
