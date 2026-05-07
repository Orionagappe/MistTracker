/**
 * Advanced Feature Engineer
 * Generates domain-specific features for ML models
 * 
 * @file feature-engineer.js
 * @version 1.0.0
 */

class FeatureEngineer {
  constructor(options = {}) {
    this.lookback = options.lookback || 24; // Hours to look back
    this.featureGroups = {
      lags: true,
      rolling: true,
      trend: true,
      seasonality: true,
      domain: true,
    };
    this.featureImportance = {};
  }

  /**
   * Generate all features for a dataset
   * @param {Array} dataPoints - Time series data
   * @returns {Object} Features and metadata
   */
  generateFeatures(dataPoints) {
    if (dataPoints.length < this.lookback) {
      throw new Error(`Minimum ${this.lookback} data points required`);
    }

    const features = [];

    dataPoints.forEach((point, index) => {
      if (index < this.lookback) return;

      const feature = {
        timestamp: point.timestamp,
        value: point.value,
      };

      // Generate lag features
      if (this.featureGroups.lags) {
        Object.assign(feature, this.generateLagFeatures(dataPoints, index));
      }

      // Generate rolling statistics
      if (this.featureGroups.rolling) {
        Object.assign(feature, this.generateRollingFeatures(dataPoints, index));
      }

      // Generate trend features
      if (this.featureGroups.trend) {
        Object.assign(feature, this.generateTrendFeatures(dataPoints, index));
      }

      // Generate seasonality features
      if (this.featureGroups.seasonality) {
        Object.assign(feature, this.generateSeasonalityFeatures(point.timestamp));
      }

      // Generate domain-specific features
      if (this.featureGroups.domain) {
        Object.assign(feature, this.generateDomainFeatures(dataPoints, index));
      }

      features.push(feature);
    });

    return {
      features,
      featureCount: Object.keys(features[0]).length - 2, // Exclude timestamp and value
      featureNames: features.length > 0 ? Object.keys(features[0]) : [],
      dataPoints: features.length,
    };
  }

  /**
   * Generate lag features (t-1, t-2, t-7, t-24)
   * @param {Array} dataPoints - All data
   * @param {number} index - Current index
   * @returns {Object} Lag features
   */
  generateLagFeatures(dataPoints, index) {
    const lags = {
      lag_1h: dataPoints[index - 1]?.value || 0,
      lag_2h: dataPoints[index - 2]?.value || 0,
      lag_4h: dataPoints[index - 4]?.value || 0,
      lag_12h: dataPoints[index - 12]?.value || 0,
      lag_24h: dataPoints[index - 24]?.value || 0,
      lag_48h: dataPoints[index - 48]?.value || 0,
      lag_7d: dataPoints[index - 168]?.value || 0,
    };

    return lags;
  }

  /**
   * Generate rolling statistics
   * @param {Array} dataPoints - All data
   * @param {number} index - Current index
   * @returns {Object} Rolling features
   */
  generateRollingFeatures(dataPoints, index) {
    const windows = {
      hourly: 3,
      short: 6,
      medium: 12,
      long: 24,
    };

    const rolling = {};

    Object.entries(windows).forEach(([name, size]) => {
      const windowData = [];
      for (let i = index - size; i < index; i++) {
        if (i >= 0 && dataPoints[i]) {
          windowData.push(dataPoints[i].value);
        }
      }

      if (windowData.length > 0) {
        rolling[`rolling_mean_${name}`] = this.calculateMean(windowData);
        rolling[`rolling_std_${name}`] = this.calculateStd(windowData);
        rolling[`rolling_max_${name}`] = Math.max(...windowData);
        rolling[`rolling_min_${name}`] = Math.min(...windowData);
        rolling[`rolling_range_${name}`] = rolling[`rolling_max_${name}`] - rolling[`rolling_min_${name}`];

        // Exponential moving average
        rolling[`ema_${name}`] = this.calculateEMA(windowData, 2 / (size + 1));
      }
    });

    return rolling;
  }

  /**
   * Generate trend features
   * @param {Array} dataPoints - All data
   * @param {number} index - Current index
   * @returns {Object} Trend features
   */
  generateTrendFeatures(dataPoints, index) {
    const trends = {};

    // Linear trend over different windows
    const windows = {
      short: 6,
      medium: 12,
      long: 24,
    };

    Object.entries(windows).forEach(([name, size]) => {
      const values = [];
      for (let i = index - size; i < index; i++) {
        if (i >= 0 && dataPoints[i]) {
          values.push(dataPoints[i].value);
        }
      }

      if (values.length > 1) {
        const trend = this.calculateLinearTrend(values);
        trends[`trend_slope_${name}`] = trend.slope;
        trends[`trend_strength_${name}`] = trend.strength;
      }
    });

    // Momentum (rate of change)
    trends.momentum_1h = dataPoints[index].value - (dataPoints[index - 1]?.value || 0);
    trends.momentum_6h =
      dataPoints[index].value -
      (dataPoints[index - 6]?.value || 0);
    trends.momentum_24h =
      dataPoints[index].value -
      (dataPoints[index - 24]?.value || 0);

    // Rate of change percentage
    trends.roc_1h =
      dataPoints[index - 1] && dataPoints[index - 1].value > 0
        ? ((dataPoints[index].value - dataPoints[index - 1].value) /
            dataPoints[index - 1].value) *
          100
        : 0;

    return trends;
  }

  /**
   * Generate seasonality features
   * @param {number} timestamp - Timestamp
   * @returns {Object} Seasonality features
   */
  generateSeasonalityFeatures(timestamp) {
    const date = new Date(timestamp);

    const hourOfDay = date.getHours();
    const dayOfWeek = date.getDay();
    const monthOfYear = date.getMonth();
    const dayOfMonth = date.getDate();

    return {
      hour_of_day: hourOfDay,
      is_business_hours: hourOfDay >= 9 && hourOfDay < 17 ? 1 : 0,
      is_night: hourOfDay >= 22 || hourOfDay < 6 ? 1 : 0,
      is_weekend: dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0,
      day_of_week: dayOfWeek,
      is_monday: dayOfWeek === 1 ? 1 : 0,
      is_friday: dayOfWeek === 5 ? 1 : 0,
      month_of_year: monthOfYear,
      day_of_month: dayOfMonth,
      is_month_start: dayOfMonth <= 3 ? 1 : 0,
      is_month_end: dayOfMonth >= 28 ? 1 : 0,
      quarter: Math.floor(monthOfYear / 3),
      // Cyclical encoding for hour
      hour_sin: Math.sin((2 * Math.PI * hourOfDay) / 24),
      hour_cos: Math.cos((2 * Math.PI * hourOfDay) / 24),
      // Cyclical encoding for day of week
      dow_sin: Math.sin((2 * Math.PI * dayOfWeek) / 7),
      dow_cos: Math.cos((2 * Math.PI * dayOfWeek) / 7),
    };
  }

  /**
   * Generate domain-specific features
   * @param {Array} dataPoints - All data
   * @param {number} index - Current index
   * @returns {Object} Domain features
   */
  generateDomainFeatures(dataPoints, index) {
    const domain = {};

    const currentValue = dataPoints[index].value;
    const window24h = [];

    for (let i = Math.max(0, index - 24); i < index; i++) {
      window24h.push(dataPoints[i].value);
    }

    // Volatility (coefficient of variation)
    const mean24h = this.calculateMean(window24h);
    const std24h = this.calculateStd(window24h);
    domain.volatility_24h = mean24h > 0 ? (std24h / mean24h) * 100 : 0;

    // Anomaly score (deviation from rolling median)
    const sorted = [...window24h].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    domain.deviation_from_median = median > 0 ? ((currentValue - median) / median) * 100 : 0;

    // Spike detection
    const recentValues = window24h.slice(-6);
    const avgRecent = this.calculateMean(recentValues);
    const maxRecent = Math.max(...recentValues);
    domain.spike_ratio = avgRecent > 0 ? maxRecent / avgRecent : 1;

    // Consistency score (how consistent are last 6 values)
    domain.consistency_6h = this.calculateConsistency(recentValues);

    // Is peak hour based on historical pattern
    domain.is_peak_hour = this.isPeakHour(dataPoints, index);

    // Error rate equivalent (webhook specific)
    domain.recent_trend_direction = currentValue > mean24h ? 1 : -1;

    return domain;
  }

  /**
   * Calculate mean
   * @param {Array} values - Numbers
   * @returns {number} Mean
   */
  calculateMean(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   * @param {Array} values - Numbers
   * @returns {number} Std dev
   */
  calculateStd(values) {
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate exponential moving average
   * @param {Array} values - Numbers
   * @param {number} alpha - Smoothing factor
   * @returns {number} EMA
   */
  calculateEMA(values, alpha) {
    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
      ema = alpha * values[i] + (1 - alpha) * ema;
    }
    return ema;
  }

  /**
   * Calculate linear trend
   * @param {Array} values - Numbers
   * @returns {Object} Slope and strength
   */
  calculateLinearTrend(values) {
    const n = values.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    values.forEach((val, idx) => {
      sumX += idx;
      sumY += val;
      sumXY += idx * val;
      sumX2 += idx * idx;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const strength = Math.abs(slope) / (this.calculateStd(values) || 1);

    return { slope: Number(slope.toFixed(4)), strength: Number(strength.toFixed(2)) };
  }

  /**
   * Calculate consistency of values
   * @param {Array} values - Numbers
   * @returns {number} Consistency score (0-1)
   */
  calculateConsistency(values) {
    if (values.length < 2) return 1;

    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(Math.abs(values[i] - values[i - 1]));
    }

    const avgDiff = this.calculateMean(diffs);
    const avgValue = this.calculateMean(values);

    return Math.max(0, Math.min(1, 1 - avgDiff / (avgValue || 1)));
  }

  /**
   * Detect if current hour is peak hour
   * @param {Array} dataPoints - All data
   * @param {number} index - Current index
   * @returns {number} 1 if peak, 0 otherwise
   */
  isPeakHour(dataPoints, index) {
    const currentDate = new Date(dataPoints[index].timestamp);
    const currentHour = currentDate.getHours();

    // Get values for same hour across last 7 days
    const hourlyValues = [];
    for (let i = index - 168; i >= 0 && i < index; i += 24) {
      if (i >= 0 && dataPoints[i]) {
        hourlyValues.push(dataPoints[i].value);
      }
    }

    if (hourlyValues.length === 0) return 0;

    const hourMean = this.calculateMean(hourlyValues);
    const allMean = this.calculateMean(dataPoints.slice(Math.max(0, index - 168), index).map((d) => d.value));

    return hourMean > allMean * 1.1 ? 1 : 0;
  }

  /**
   * Get feature importance ranking
   * @returns {Object} Feature importance scores
   */
  getFeatureImportance() {
    return this.featureImportance;
  }

  /**
   * Select top N features
   * @param {Array} features - All features
   * @param {number} topN - Number to select
   * @returns {Array} Top features
   */
  selectTopFeatures(features, topN = 20) {
    const featureNames = Object.keys(features[0]).filter((f) => f !== 'timestamp' && f !== 'value');

    // Calculate variance for each feature
    const variances = {};
    featureNames.forEach((fname) => {
      const values = features.map((f) => f[fname]);
      variances[fname] = this.calculateStd(values);
    });

    // Sort by variance and return top N
    const sorted = Object.entries(variances).sort((a, b) => b[1] - a[1]);

    return sorted.slice(0, topN).map((entry) => entry[0]);
  }

  /**
   * Get feature summary
   * @param {Array} features - All features
   * @returns {Object} Feature summary
   */
  getFeatureSummary(features) {
    if (features.length === 0) {
      return { error: 'No features generated' };
    }

    const summary = {
      totalFeatures: Object.keys(features[0]).length,
      featureCount: Object.keys(features[0]).length - 2, // Exclude timestamp and value
      featureGroups: this.featureGroups,
      topFeatures: this.selectTopFeatures(features, 10),
      dataPoints: features.length,
    };

    return summary;
  }
}

module.exports = FeatureEngineer;
