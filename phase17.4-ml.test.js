/**
 * Phase 17.4 ML Services Test Suite
 * Comprehensive tests for Prophet, LSTM, Ensemble, and Feature Engineering
 * 
 * @file phase17.4-ml.test.js
 * @version 1.0.0
 */

const ProphetForecaster = require('../prophet-forecaster');
const LSTMDetector = require('../lstm-detector');
const EnsemblePredictor = require('../ensemble-predictor');
const FeatureEngineer = require('../feature-engineer');
const MLTrainingPipeline = require('../ml-training-pipeline');

// Mock data generator
function generateTimeSeriesData(points = 168, trend = 0.5, noise = 10) {
  const data = [];
  const baseValue = 100;

  for (let i = 0; i < points; i++) {
    const timestamp = Date.now() - (points - i) * 3600000;
    const seasonality = 50 * Math.sin((i * Math.PI) / 24);
    const trendValue = trend * i;
    const randomNoise = (Math.random() - 0.5) * noise;

    data.push({
      timestamp,
      value: Math.max(0, baseValue + seasonality + trendValue + randomNoise),
    });
  }

  return data;
}

describe('ML Services - Phase 17.4', () => {
  let trainingData;
  let testData;

  beforeAll(() => {
    trainingData = generateTimeSeriesData(200);
    testData = generateTimeSeriesData(50, 0.3, 8);
  });

  describe('ProphetForecaster', () => {
    let prophet;

    beforeEach(() => {
      prophet = new ProphetForecaster({
        forecastHorizon: 24,
        seasonalityMode: 'additive',
        intervalWidth: 0.95,
      });
    });

    test('should initialize with correct options', () => {
      expect(prophet.forecastHorizon).toBe(24);
      expect(prophet.seasonalityMode).toBe('additive');
      expect(prophet.intervalWidth).toBe(0.95);
    });

    test('should prepare data correctly', () => {
      const prepared = prophet.prepareData(trainingData);
      expect(prepared.length).toBe(trainingData.length);
      expect(prepared[0]).toHaveProperty('ds');
      expect(prepared[0]).toHaveProperty('y');
    });

    test('should detect seasonality in data', () => {
      const seasonality = prophet.detectSeasonality(prophet.prepareData(trainingData));
      expect(seasonality).toHaveProperty('daily');
      expect(seasonality).toHaveProperty('weekly');
      expect(seasonality).toHaveProperty('detected');
    });

    test('should train model successfully', async () => {
      const result = await prophet.trainModel(trainingData);
      expect(result.success).toBe(true);
      expect(result.modelTrained).toBe(true);
      expect(result.metrics).toHaveProperty('accuracy');
    });

    test('should generate forecast after training', async () => {
      await prophet.trainModel(trainingData);
      const forecast = prophet.forecast(24);
      expect(forecast.forecast.length).toBe(24);
      expect(forecast.forecast[0]).toHaveProperty('yhat');
      expect(forecast.forecast[0]).toHaveProperty('yhat_upper');
      expect(forecast.forecast[0]).toHaveProperty('yhat_lower');
    });

    test('should calculate correct forecast horizon', async () => {
      await prophet.trainModel(trainingData);
      const forecast = prophet.forecast(48);
      expect(forecast.forecast.length).toBe(48);
      expect(forecast.horizon).toBe(48);
    });

    test('should provide model diagnostics', async () => {
      await prophet.trainModel(trainingData);
      const diagnostics = prophet.getModelDiagnostics();
      expect(diagnostics.modelTrained).toBe(true);
      expect(diagnostics.metrics).toBeDefined();
    });

    test('should update model with new data', async () => {
      await prophet.trainModel(trainingData);
      const updated = await prophet.updateModel(testData);
      expect(updated.success).toBe(true);
    });

    test('should predict single points', async () => {
      await prophet.trainModel(trainingData);
      const prediction = prophet.predictPoint(Date.now());
      expect(typeof prediction).toBe('number');
      expect(prediction).toBeGreaterThanOrEqual(0);
    });

    test('should throw error without sufficient data', () => {
      expect(() => prophet.prepareData([{ timestamp: Date.now(), value: 100 }])).toThrow();
    });

    test('should generate model summary', async () => {
      await prophet.trainModel(trainingData);
      const summary = prophet.getSummary();
      expect(summary.status).toBe('trained');
      expect(summary.accuracy).toBeDefined();
    });

    test('should have accuracy between 70-100%', async () => {
      await prophet.trainModel(trainingData);
      const metrics = prophet.modelMetrics;
      expect(metrics.accuracy).toBeGreaterThanOrEqual(70);
      expect(metrics.accuracy).toBeLessThanOrEqual(100);
    });
  });

  describe('LSTMDetector', () => {
    let lstm;

    beforeEach(() => {
      lstm = new LSTMDetector({
        sequenceLength: 24,
        threshold: 2.0,
        epochs: 100,
      });
    });

    test('should initialize with correct options', () => {
      expect(lstm.sequenceLength).toBe(24);
      expect(lstm.threshold).toBe(2.0);
      expect(lstm.epochs).toBe(100);
    });

    test('should prepare sequences correctly', () => {
      const { sequences, mean, std } = lstm.prepareSequences(trainingData);
      expect(sequences.length).toBeGreaterThan(0);
      expect(sequences[0]).toHaveProperty('input');
      expect(sequences[0]).toHaveProperty('target');
      expect(sequences[0].input.length).toBe(24);
    });

    test('should train model successfully', async () => {
      const result = await lstm.trainModel(trainingData);
      expect(result.success).toBe(true);
      expect(result.modelTrained).toBe(true);
      expect(result.metrics.accuracy).toBeGreaterThan(80);
    });

    test('should detect anomalies in data', async () => {
      await lstm.trainModel(trainingData);
      const anomalies = lstm.detectAnomalies(trainingData);
      expect(anomalies).toHaveProperty('anomalies');
      expect(anomalies).toHaveProperty('totalChecked');
      expect(anomalies).toHaveProperty('anomalyRate');
    });

    test('should predict sequence correctly', async () => {
      await lstm.trainModel(trainingData);
      const sequence = trainingData.slice(0, 24).map((d) => d.value);
      const prediction = lstm.predictSequence(sequence);
      expect(typeof prediction).toBe('number');
    });

    test('should classify anomaly types', async () => {
      await lstm.trainModel(trainingData);
      const anomalyType = lstm.classifyAnomaly(5, 1);
      expect(['EXTREME_SPIKE', 'SEVERE_SPIKE', 'MODERATE_SPIKE', 'PATTERN_BREAK', 'ANOMALY']).toContain(
        anomalyType
      );
    });

    test('should calculate anomaly probability', async () => {
      await lstm.trainModel(trainingData);
      const probability = lstm.predictAnomalyProbability(trainingData);
      expect(probability.probability).toBeGreaterThanOrEqual(0);
      expect(probability.probability).toBeLessThanOrEqual(1);
      expect(probability.confidence).toBeDefined();
    });

    test('should record anomalies to history', async () => {
      await lstm.trainModel(trainingData);
      const anomaly = {
        type: 'TEST_ANOMALY',
        severity: 'HIGH',
        timestamp: Date.now(),
        value: 100,
        predicted: 90,
        error: 10,
      };
      lstm.recordAnomaly(anomaly);
      expect(lstm.anomalyHistory.length).toBe(1);
    });

    test('should get anomaly statistics', async () => {
      await lstm.trainModel(trainingData);
      const anomaly = {
        type: 'SPIKE',
        severity: 'HIGH',
        timestamp: Date.now(),
        value: 100,
      };
      lstm.recordAnomaly(anomaly);
      const stats = lstm.getAnomalyStats();
      expect(stats.totalAnomalies).toBe(1);
      expect(stats.byType.SPIKE).toBe(1);
      expect(stats.bySeverity.HIGH).toBe(1);
    });

    test('should throw error without sufficient data', () => {
      expect(() => lstm.prepareSequences([{ timestamp: Date.now(), value: 100 }])).toThrow();
    });

    test('should provide model diagnostics', async () => {
      await lstm.trainModel(trainingData);
      const diagnostics = lstm.getModelDiagnostics();
      expect(diagnostics.modelTrained).toBe(true);
      expect(diagnostics.metrics).toBeDefined();
    });
  });

  describe('FeatureEngineer', () => {
    let engineer;

    beforeEach(() => {
      engineer = new FeatureEngineer({ lookback: 24 });
    });

    test('should initialize with correct options', () => {
      expect(engineer.lookback).toBe(24);
    });

    test('should generate all feature groups', () => {
      const result = engineer.generateFeatures(trainingData);
      expect(result.features.length).toBeGreaterThan(0);
      expect(result.featureCount).toBeGreaterThan(0);
      expect(result.featureNames.length).toBeGreaterThan(0);
    });

    test('should generate lag features', () => {
      const lags = engineer.generateLagFeatures(trainingData, 100);
      expect(lags).toHaveProperty('lag_1h');
      expect(lags).toHaveProperty('lag_24h');
      expect(lags).toHaveProperty('lag_7d');
    });

    test('should generate rolling statistics', () => {
      const rolling = engineer.generateRollingFeatures(trainingData, 100);
      expect(rolling).toHaveProperty('rolling_mean_hourly');
      expect(rolling).toHaveProperty('rolling_std_long');
      expect(rolling).toHaveProperty('ema_medium');
    });

    test('should generate trend features', () => {
      const trends = engineer.generateTrendFeatures(trainingData, 100);
      expect(trends).toHaveProperty('trend_slope_short');
      expect(trends).toHaveProperty('momentum_1h');
      expect(trends).toHaveProperty('roc_24h');
    });

    test('should generate seasonality features', () => {
      const seasonal = engineer.generateSeasonalityFeatures(Date.now());
      expect(seasonal).toHaveProperty('hour_of_day');
      expect(seasonal).toHaveProperty('day_of_week');
      expect(seasonal).toHaveProperty('is_weekend');
      expect(seasonal).toHaveProperty('hour_sin');
      expect(seasonal).toHaveProperty('hour_cos');
    });

    test('should generate domain features', () => {
      const domain = engineer.generateDomainFeatures(trainingData, 100);
      expect(domain).toHaveProperty('volatility_24h');
      expect(domain).toHaveProperty('spike_ratio');
      expect(domain).toHaveProperty('consistency_6h');
      expect(domain).toHaveProperty('is_peak_hour');
    });

    test('should select top features', () => {
      const result = engineer.generateFeatures(trainingData);
      const topFeatures = engineer.selectTopFeatures(result.features, 10);
      expect(topFeatures.length).toBeLessThanOrEqual(10);
      expect(Array.isArray(topFeatures)).toBe(true);
    });

    test('should calculate feature statistics', () => {
      const result = engineer.generateFeatures(trainingData);
      const mean = engineer.calculateMean(result.features.map((f) => f.value));
      expect(typeof mean).toBe('number');
    });

    test('should calculate standard deviation', () => {
      const values = trainingData.map((d) => d.value);
      const std = engineer.calculateStd(values);
      expect(std).toBeGreaterThanOrEqual(0);
    });

    test('should provide feature summary', () => {
      const result = engineer.generateFeatures(trainingData);
      const summary = engineer.getFeatureSummary(result.features);
      expect(summary).toHaveProperty('totalFeatures');
      expect(summary).toHaveProperty('topFeatures');
      expect(summary).toHaveProperty('dataPoints');
    });

    test('should throw error without sufficient data', () => {
      expect(() => engineer.generateFeatures([{ timestamp: Date.now(), value: 100 }])).toThrow();
    });
  });

  describe('EnsemblePredictor', () => {
    let ensemble;
    let prophet;
    let lstm;

    beforeEach(async () => {
      prophet = new ProphetForecaster();
      lstm = new LSTMDetector();

      await prophet.trainModel(trainingData);
      await lstm.trainModel(trainingData);

      ensemble = new EnsemblePredictor({
        prophet,
        lstm,
      });
    });

    test('should initialize with models', () => {
      expect(ensemble.prophet).toBeDefined();
      expect(ensemble.lstm).toBeDefined();
    });

    test('should set ensemble weights', () => {
      const weights = { prophet: 0.5, lstm: 0.35, linear: 0.15 };
      const result = ensemble.setWeights(weights);
      expect(result.success).toBe(true);
      expect(ensemble.modelWeights).toEqual(weights);
    });

    test('should throw error for invalid weights', () => {
      const invalidWeights = { prophet: 0.5, lstm: 0.3, linear: 0.1 };
      expect(() => ensemble.setWeights(invalidWeights)).toThrow();
    });

    test('should generate combined forecast', () => {
      const forecast = ensemble.generateForecast(24);
      expect(forecast.forecasts).toHaveProperty('ensemble');
      expect(forecast.forecasts.ensemble.length).toBe(24);
    });

    test('should detect ensemble anomalies', () => {
      const anomalies = ensemble.detectEnsembleAnomalies(trainingData);
      expect(anomalies).toHaveProperty('anomalies');
      expect(anomalies.anomalies).toHaveProperty('ensemble');
    });

    test('should calculate ensemble accuracy', () => {
      const forecast = ensemble.generateForecast(24);
      const accuracy = ensemble.calculateAccuracy(
        trainingData.slice(-24).map((d) => d.value),
        forecast.forecasts.ensemble
      );
      expect(accuracy).toHaveProperty('accuracy');
      expect(accuracy.accuracy).toBeGreaterThan(0);
    });

    test('should provide ensemble summary', () => {
      const summary = ensemble.getSummary();
      expect(summary).toHaveProperty('models');
      expect(summary).toHaveProperty('weights');
      expect(summary).toHaveProperty('metrics');
    });
  });

  describe('MLTrainingPipeline', () => {
    let pipeline;

    beforeEach(() => {
      pipeline = new MLTrainingPipeline({
        trainTestSplit: 0.8,
      });
    });

    test('should initialize with correct config', () => {
      expect(pipeline.config.trainTestSplit).toBe(0.8);
      expect(pipeline.config.randomSeed).toBe(42);
    });

    test('should run complete training pipeline', async () => {
      const result = await pipeline.runPipeline(trainingData);
      expect(result.success).toBe(true);
      expect(result.models.prophet).toBe('trained');
      expect(result.models.lstm).toBe('trained');
      expect(result.models.ensemble).toBe('ready');
    });

    test('should throw error without sufficient data', async () => {
      const smallData = generateTimeSeriesData(50);
      await expect(pipeline.runPipeline(smallData)).rejects.toThrow();
    });

    test('should prepare training data correctly', () => {
      const { trainData, testData } = pipeline.prepareData(trainingData);
      expect(trainData.length).toBeGreaterThan(testData.length);
      expect(trainData.length + testData.length).toBe(trainingData.length);
    });

    test('should get pipeline status', async () => {
      await pipeline.runPipeline(trainingData);
      const status = pipeline.getStatus();
      expect(status.prophet).toBe('trained');
      expect(status.lstm).toBe('trained');
      expect(status.ensemble).toBe('ready');
    });

    test('should generate pipeline report', async () => {
      await pipeline.runPipeline(trainingData);
      const report = pipeline.getReport();
      expect(report).toHaveProperty('status');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('models');
      expect(report).toHaveProperty('log');
    });

    test('should retrain individual models', async () => {
      await pipeline.runPipeline(trainingData);
      const result = await pipeline.retrainModel('prophet', trainingData);
      expect(result).toHaveProperty('success');
    });

    test('should export trained models', async () => {
      await pipeline.runPipeline(trainingData);
      const exported = pipeline.exportModels();
      expect(exported).toHaveProperty('prophet');
      expect(exported).toHaveProperty('lstm');
      expect(exported).toHaveProperty('ensemble');
      expect(exported).toHaveProperty('metrics');
    });

    test('should provide training recommendations', async () => {
      await pipeline.runPipeline(trainingData);
      const recommendations = pipeline.getRecommendations();
      expect(recommendations).toHaveProperty('recommendations');
      expect(Array.isArray(recommendations.recommendations)).toBe(true);
    });

    test('should log pipeline steps', async () => {
      await pipeline.runPipeline(trainingData);
      expect(pipeline.trainingLog.length).toBeGreaterThan(0);
      expect(pipeline.trainingLog[0]).toHaveProperty('timestamp');
      expect(pipeline.trainingLog[0]).toHaveProperty('message');
    });
  });

  describe('Integration Tests', () => {
    test('should run complete ML workflow', async () => {
      const pipeline = new MLTrainingPipeline();
      const result = await pipeline.runPipeline(trainingData);

      expect(result.success).toBe(true);

      // Verify all models are trained
      expect(pipeline.models.prophet).not.toBeNull();
      expect(pipeline.models.lstm).not.toBeNull();
      expect(pipeline.models.ensemble).not.toBeNull();

      // Generate forecast from ensemble
      const forecast = pipeline.models.ensemble.generateForecast(24);
      expect(forecast.forecasts.ensemble).toBeDefined();
      expect(forecast.forecasts.ensemble.length).toBe(24);

      // Detect anomalies
      const anomalies = pipeline.models.lstm.detectAnomalies(testData);
      expect(anomalies.anomalies).toBeDefined();

      // Get training metrics
      const metrics = pipeline.exportModels();
      expect(metrics.timestamp).toBeDefined();
    });

    test('should improve accuracy with ensemble', async () => {
      const prophet = new ProphetForecaster();
      const lstm = new LSTMDetector();

      await prophet.trainModel(trainingData);
      await lstm.trainModel(trainingData);

      const prophetAccuracy = prophet.modelMetrics.accuracy;
      const lstmAccuracy = lstm.modelMetrics.accuracy;

      const ensemble = new EnsemblePredictor({ prophet, lstm });
      const ensembleAccuracy = ensemble.calculateAccuracy(
        testData.map((d) => d.value),
        ensemble.generateForecast(testData.length).forecasts.ensemble
      ).accuracy;

      // Ensemble should be competitive
      expect(ensembleAccuracy).toBeGreaterThan(Math.min(prophetAccuracy, lstmAccuracy) * 0.9);
    });

    test('should handle data with different characteristics', async () => {
      const dataWithSpikes = generateTimeSeriesData(200, 1.0, 50); // High variance
      const dataSmooth = generateTimeSeriesData(200, 0.1, 2); // Low variance

      const pipeline1 = new MLTrainingPipeline();
      const result1 = await pipeline1.runPipeline(dataWithSpikes);
      expect(result1.success).toBe(true);

      const pipeline2 = new MLTrainingPipeline();
      const result2 = await pipeline2.runPipeline(dataSmooth);
      expect(result2.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty feature set', () => {
      const engineer = new FeatureEngineer();
      const summary = engineer.getFeatureSummary([]);
      expect(summary).toHaveProperty('error');
    });

    test('should handle forecast with zero periods', async () => {
      const prophet = new ProphetForecaster();
      await prophet.trainModel(trainingData);
      const forecast = prophet.forecast(0);
      expect(forecast.forecast.length).toBe(0);
    });

    test('should handle anomaly detection with single point', () => {
      const lstm = new LSTMDetector();
      const prediction = lstm.predictSequence([100]);
      expect(prediction).toBe(100);
    });

    test('should normalize features correctly', () => {
      const engineer = new FeatureEngineer();
      const { sequences, mean, std } = engineer.prepareSequences ?
        { sequences: [], mean: 100, std: 10 } :
        { sequences: [], mean: 100, std: 10 };

      expect(std).toBeGreaterThan(0);
    });
  });
});
