/**
 * Prediction Engine - Time series forecasting and anomaly probability calculation
 * Predicts future webhook performance and detects early warning signals
 * 
 * @file services/predictionEngine.js
 * @version 1.0.0
 */

const MIN_HISTORY_POINTS = 20;
const FORECAST_PERIODS = 24; // Hours to forecast

/**
 * Prediction Engine Service
 * Provides forecasting and predictive analytics for webhook metrics
 */
class PredictionEngine {
  constructor() {
    this.cache = new Map();
    this.models = new Map();
  }

  /**
   * Forecast event volume using ARIMA model
   * @param {string} webhookId - Webhook identifier
   * @param {Array<{timestamp: number, value: number}>} historicalData - Time series data
   * @returns {{forecast: number[], confidence: number[], trend: string}}
   */
  forecastEventVolume(webhookId, historicalData) {
    if (!historicalData || historicalData.length < MIN_HISTORY_POINTS) {
      return { forecast: [], confidence: [], trend: 'insufficient_data', error: 'Not enough historical data' };
    }

    const values = historicalData.map(d => d.value);
    const timestamps = historicalData.map(d => d.timestamp);

    // ARIMA(1,1,1) parameters
    const diff = this._differenceTimeSeries(values);
    const ar = this._calculateAR(diff, 1);
    const ma = this._calculateMA(diff, 1);

    // Generate forecast
    const forecast = [];
    const confidence = [];
    let lastValue = values[values.length - 1];

    for (let i = 0; i < FORECAST_PERIODS; i++) {
      // Simplified ARIMA forecast
      const prediction = lastValue * (1 + ar[0] * 0.01) + ma[0];
      const ci = this._calculateConfidenceInterval(diff, prediction);

      forecast.push(Math.round(Math.max(0, prediction)));
      confidence.push(ci);
      lastValue = prediction;
    }

    // Determine trend
    const trend = this._calculateTrend(forecast);

    return {
      forecast,
      confidence,
      trend,
      modelId: webhookId,
    };
  }

  /**
   * Forecast success rate
   * @param {string} webhookId - Webhook identifier
   * @param {Array<{timestamp: number, rate: number}>} historicalData - Historical success rates
   * @returns {{forecast: number[], degradationRisk: number, recommendation: string}}
   */
  forecastSuccessRate(webhookId, historicalData) {
    if (!historicalData || historicalData.length < MIN_HISTORY_POINTS) {
      return { forecast: [], degradationRisk: 0, recommendation: 'insufficient_data' };
    }

    const values = historicalData.map(d => d.rate);

    // Calculate linear regression for trend
    const regression = this._linearRegression(values);
    const slope = regression.slope;

    // Generate forecast
    const forecast = [];
    const lastValue = values[values.length - 1];

    for (let i = 0; i < FORECAST_PERIODS; i++) {
      const predicted = lastValue + (slope * (i + 1));
      forecast.push(Math.round(Math.max(0, Math.min(100, predicted))));
    }

    // Calculate degradation risk
    const degradationRisk = slope < -0.5 ? Math.abs(slope) * 10 : 0;
    const avgPredicted = forecast.reduce((a, b) => a + b, 0) / forecast.length;

    let recommendation = 'stable';
    if (avgPredicted < 90) recommendation = 'investigate_high_risk';
    if (avgPredicted < 95) recommendation = 'monitor_closely';
    if (degradationRisk > 20) recommendation = 'immediate_action_needed';

    return {
      forecast,
      degradationRisk: Math.min(100, degradationRisk),
      trend: slope > 0 ? 'improving' : slope < 0 ? 'degrading' : 'stable',
      recommendation,
      confidence: 0.85,
    };
  }

  /**
   * Calculate anomaly probability for upcoming period
   * @param {string} webhookId - Webhook identifier
   * @param {Array<{timestamp: number, value: number}>} historicalData - Historical values
   * @param {number} lookAheadHours - Hours to look ahead (default: 24)
   * @returns {{probability: number, expectedRange: {min: number, max: number}, signals: Array}}
   */
  calculateAnomalyProbability(webhookId, historicalData, lookAheadHours = 24) {
    if (!historicalData || historicalData.length < MIN_HISTORY_POINTS) {
      return { probability: 0, expectedRange: { min: 0, max: 0 }, signals: [] };
    }

    const values = historicalData.map(d => d.value);
    const stats = this._calculateStats(values);

    // Calculate expected range
    const z = 1.96; // 95% confidence
    const expectedRange = {
      min: Math.round(Math.max(0, stats.mean - (z * stats.stdDev))),
      max: Math.round(stats.mean + (z * stats.stdDev)),
    };

    // Detect warning signals
    const signals = [];

    // Signal 1: Increasing variance
    if (this._detectIncreasingVariance(values)) {
      signals.push({
        type: 'increasing_variance',
        severity: 'warning',
        message: 'Data volatility is increasing',
      });
    }

    // Signal 2: Trend change
    const trendChange = this._detectTrendChange(values);
    if (trendChange) {
      signals.push({
        type: 'trend_change',
        severity: 'warning',
        message: `Trend changing to ${trendChange}`,
      });
    }

    // Signal 3: Cyclical pattern breaking
    if (this._detectCyclicPatternBreak(values)) {
      signals.push({
        type: 'pattern_break',
        severity: 'critical',
        message: 'Expected cyclical pattern is breaking',
      });
    }

    // Signal 4: Distribution shift
    if (this._detectDistributionShift(values)) {
      signals.push({
        type: 'distribution_shift',
        severity: 'warning',
        message: 'Data distribution is shifting',
      });
    }

    // Calculate probability based on signals
    let probability = 0.1; // Base probability
    probability += signals.filter(s => s.severity === 'warning').length * 0.2;
    probability += signals.filter(s => s.severity === 'critical').length * 0.4;

    return {
      probability: Math.min(1, probability),
      expectedRange,
      signals,
      forecastPeriod: lookAheadHours,
    };
  }

  /**
   * Generate recommended actions based on predictions
   * @param {Object} forecasts - Combined forecast data
   * @returns {Array<{action: string, priority: string, reasoning: string}>}
   */
  generateRecommendedActions(forecasts) {
    const actions = [];

    // Check event volume forecast
    if (forecasts.volumeForecast?.forecast) {
      const avgForecast = this._arrayMean(forecasts.volumeForecast.forecast);
      const historicalAvg = forecasts.volumeForecast.historicalAvg || 0;

      if (avgForecast > historicalAvg * 1.5) {
        actions.push({
          action: 'Scale up webhook processors',
          priority: 'high',
          reasoning: `Expected 50%+ increase in event volume (${Math.round(avgForecast)} vs ${Math.round(historicalAvg)})`,
        });
      }
    }

    // Check success rate forecast
    if (forecasts.successForecast) {
      if (forecasts.successForecast.recommendation === 'immediate_action_needed') {
        actions.push({
          action: 'Urgent: Investigate webhook configuration',
          priority: 'critical',
          reasoning: `Success rate degradation detected. Trend: ${forecasts.successForecast.trend}`,
        });
      } else if (forecasts.successForecast.recommendation === 'investigate_high_risk') {
        actions.push({
          action: 'Review webhook implementation',
          priority: 'high',
          reasoning: 'Success rate forecast below 90%',
        });
      }
    }

    // Check anomaly probability
    if (forecasts.anomalyProbability?.probability > 0.6) {
      actions.push({
        action: 'Increase monitoring sensitivity',
        priority: 'medium',
        reasoning: `High anomaly probability (${Math.round(forecasts.anomalyProbability.probability * 100)}%)`,
      });
    }

    return actions;
  }

  /**
   * Get prediction summary for webhook
   * @param {string} webhookId - Webhook identifier
   * @param {Object} metrics - Current metrics
   * @param {Array} historicalData - Historical data
   * @returns {Object} Comprehensive prediction summary
   */
  getPredictionSummary(webhookId, metrics, historicalData) {
    const volumeForecast = this.forecastEventVolume(webhookId, historicalData.volume);
    const successForecast = this.forecastSuccessRate(webhookId, historicalData.success);
    const anomalyProb = this.calculateAnomalyProbability(webhookId, historicalData.volume);

    const forecasts = {
      volumeForecast: volumeForecast.forecast[0],
      successForecast: successForecast.forecast[0],
      anomalyProbability: anomalyProb.probability,
    };

    const actions = this.generateRecommendedActions({
      volumeForecast,
      successForecast,
      anomalyProbability: anomalyProb,
    });

    return {
      webhookId,
      timestamp: new Date().toISOString(),
      forecast: forecasts,
      anomalySignals: anomalyProb.signals,
      recommendations: actions,
      confidence: 0.85,
      nextUpdate: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    };
  }

  // ============= Private Statistical Methods =============

  /**
   * Calculate mean of array
   */
  _arrayMean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Calculate standard deviation
   */
  _arrayStdDev(arr) {
    const mean = this._arrayMean(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate basic statistics
   */
  _calculateStats(values) {
    const mean = this._arrayMean(values);
    const stdDev = this._arrayStdDev(values);
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return { mean, stdDev, median };
  }

  /**
   * Linear regression
   */
  _linearRegression(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Difference time series (for ARIMA)
   */
  _differenceTimeSeries(values, periods = 1) {
    const diff = [];
    for (let i = periods; i < values.length; i++) {
      diff.push(values[i] - values[i - periods]);
    }
    return diff;
  }

  /**
   * Calculate AR coefficient
   */
  _calculateAR(values, lag) {
    const mean = this._arrayMean(values);
    const centered = values.map(v => v - mean);
    let numerator = 0;
    let denominator = 0;

    for (let i = lag; i < centered.length; i++) {
      numerator += centered[i] * centered[i - lag];
      denominator += centered[i - lag] * centered[i - lag];
    }

    return [denominator > 0 ? numerator / denominator : 0];
  }

  /**
   * Calculate MA coefficient
   */
  _calculateMA(values, lag) {
    const mean = this._arrayMean(values);
    let numerator = 0;
    let denominator = 0;

    for (let i = lag; i < values.length; i++) {
      numerator += (values[i] - mean) * (values[i - lag] - mean);
      denominator += Math.pow(values[i] - mean, 2);
    }

    return [denominator > 0 ? numerator / denominator : 0];
  }

  /**
   * Calculate confidence interval
   */
  _calculateConfidenceInterval(values, prediction) {
    const stdDev = this._arrayStdDev(values);
    const z = 1.96; // 95% CI
    const margin = z * stdDev;

    return {
      lower: Math.round(Math.max(0, prediction - margin)),
      upper: Math.round(prediction + margin),
    };
  }

  /**
   * Calculate trend from forecast
   */
  _calculateTrend(forecast) {
    if (forecast.length < 2) return 'stable';

    const firstHalf = forecast.slice(0, Math.floor(forecast.length / 2));
    const secondHalf = forecast.slice(Math.floor(forecast.length / 2));

    const avgFirst = this._arrayMean(firstHalf);
    const avgSecond = this._arrayMean(secondHalf);

    const change = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Detect increasing variance
   */
  _detectIncreasingVariance(values) {
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);

    const var1 = Math.pow(this._arrayStdDev(firstHalf), 2);
    const var2 = Math.pow(this._arrayStdDev(secondHalf), 2);

    return var2 > var1 * 1.5;
  }

  /**
   * Detect trend change
   */
  _detectTrendChange(values) {
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);

    const reg1 = this._linearRegression(firstHalf);
    const reg2 = this._linearRegression(secondHalf);

    const changeInSlope = Math.abs(reg2.slope - reg1.slope);

    if (changeInSlope > 2) {
      return reg2.slope > 0 ? 'upward' : 'downward';
    }
    return null;
  }

  /**
   * Detect cyclical pattern break
   */
  _detectCyclicPatternBreak(values) {
    if (values.length < 48) return false; // Need at least 2 days

    // Check for 24-hour periodicity
    const correlations = [];
    for (let lag = 20; lag < 28; lag++) {
      const corr = this._calculateAutoCorrelation(values, lag);
      correlations.push(corr);
    }

    const avgCorr = this._arrayMean(correlations);
    const recent = values.slice(-24);
    const recentCorr = this._calculateAutoCorrelation(recent, 12);

    return recentCorr < avgCorr * 0.5;
  }

  /**
   * Detect distribution shift
   */
  _detectDistributionShift(values) {
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);

    const stats1 = this._calculateStats(firstHalf);
    const stats2 = this._calculateStats(secondHalf);

    const meanShift = Math.abs(stats2.mean - stats1.mean) / stats1.stdDev;
    const varShift = Math.abs(stats2.stdDev - stats1.stdDev) / stats1.stdDev;

    return meanShift > 1 || varShift > 0.5;
  }

  /**
   * Calculate autocorrelation
   */
  _calculateAutoCorrelation(values, lag) {
    const mean = this._arrayMean(values);
    let numerator = 0;
    let denominator = 0;

    for (let i = lag; i < values.length; i++) {
      numerator += (values[i] - mean) * (values[i - lag] - mean);
      denominator += Math.pow(values[i] - mean, 2);
    }

    return denominator > 0 ? numerator / denominator : 0;
  }
}

module.exports = new PredictionEngine();
