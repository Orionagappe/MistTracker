/**
 * Jest Setup File
 * Initializes test environment and global configurations
 * 
 * @file tests/setup.js
 * @version 1.0.0
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Mock timers configuration
jest.useRealTimers();

// Global test timeout
jest.setTimeout(30000);

// Mock console methods (optional - uncomment to reduce noise)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };

// Global test utilities
global.testUtils = {
  /**
   * Generate random webhook ID
   */
  generateWebhookId: () => `wh_${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Generate test metrics
   */
  generateMetrics: (override = {}) => ({
    webhookId: global.testUtils.generateWebhookId(),
    timestamp: Date.now(),
    eventVolume: 1000 + Math.random() * 200,
    successRate: 98 + Math.random() * 2,
    avgLatency: 250 + Math.random() * 100,
    errorRate: Math.random() * 5,
    ...override,
  }),

  /**
   * Generate historical data
   */
  generateHistoricalData: (points = 30, type = 'volume') => {
    return Array(points).fill(null).map((_, i) => {
      if (type === 'volume') {
        return {
          timestamp: Date.now() - (points - i) * 86400000,
          value: 1000 + Math.random() * 300,
        };
      } else if (type === 'rate') {
        return {
          timestamp: Date.now() - (points - i) * 86400000,
          rate: 95 + Math.random() * 5,
        };
      }
      return { timestamp: Date.now(), value: 0 };
    });
  },

  /**
   * Wait for condition
   */
  waitFor: async (condition, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (condition()) return true;
      await new Promise(r => setTimeout(r, 50));
    }
    return false;
  },

  /**
   * Create mock webhook
   */
  createMockWebhook: (override = {}) => ({
    id: global.testUtils.generateWebhookId(),
    name: 'Test Webhook',
    endpoint: 'https://example.com/webhook',
    status: 'active',
    successRate: 99,
    eventVolume: 1000,
    avgLatency: 250,
    errorRate: 1,
    lastTriggered: Date.now() - 60000,
    ...override,
  }),

  /**
   * Create mock dashboard
   */
  createMockDashboard: (override = {}) => ({
    id: Math.floor(Math.random() * 10000),
    userId: 'user_123',
    name: 'Test Dashboard',
    layout: 'grid-12',
    widgets: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...override,
  }),

  /**
   * Create mock query
   */
  createMockQuery: (override = {}) => ({
    field: 'avgLatency',
    operator: '>',
    value: 500,
    ...override,
  }),

  /**
   * Create mock anomaly
   */
  createMockAnomaly: (override = {}) => ({
    type: 'SPIKE',
    severity: 'WARNING',
    value: 5000,
    threshold: 2000,
    message: 'Unexpected spike detected',
    timestamp: Date.now(),
    ...override,
  }),

  /**
   * Create mock forecast
   */
  createMockForecast: (override = {}) => ({
    forecast: Array(24).fill(1000 + Math.random() * 200),
    confidence: 0.85,
    trend: 'increasing',
    ...override,
  }),
};

// Before all tests
beforeAll(() => {
  console.log('🚀 Jest Test Suite Starting...\n');
});

// After all tests
afterAll(() => {
  console.log('\n✅ Jest Test Suite Complete\n');
});

// Before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
});

// After each test
afterEach(() => {
  // Clean up
  jest.clearAllMocks();
});

// Export setup
module.exports = global;
