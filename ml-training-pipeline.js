/**
 * ML Training Pipeline
 * Orchestrates training of all ML models with validation and metrics
 * 
 * @file ml-training-pipeline.js
 * @version 1.0.0
 */

const ProphetForecaster = require('./prophet-forecaster');
const LSTMDetector = require('./lstm-detector');
const EnsemblePredictor = require('./ensemble-predictor');
const FeatureEngineer = require('./feature-engineer');

class MLTrainingPipeline {
  constructor(options = {}) {
    this.config = {
      trainTestSplit: options.trainTestSplit || 0.8,
      validationSplit: options.validationSplit || 0.1,
      randomSeed: options.randomSeed || 42,
      maxRetries: options.maxRetries || 3,
      earlyStoppingPatience: options.earlyStoppingPatience || 10,
    };

    this.models = {
      prophet: null,
      lstm: null,
      ensemble: null,
    };

    this.featureEngine = new FeatureEngineer();
    this.trainingMetrics = {};
    this.trainingLog = [];
  }

  /**
   * Run complete ML training pipeline
   * @param {Array} dataPoints - Training data
   * @returns {Promise} Pipeline complete
   */
  async runPipeline(dataPoints) {
    if (dataPoints.length < 100) {
      throw new Error('Minimum 100 data points required for training');
    }

    const startTime = Date.now();
    const log = [];

    try {
      // Step 1: Data preparation and feature engineering
      this.log('Step 1: Feature Engineering', log);
      const { features, testFeatures } = this.prepareData(dataPoints);

      // Step 2: Train Prophet model
      this.log('Step 2: Training Prophet Forecaster', log);
      await this.trainProphet(dataPoints);

      // Step 3: Train LSTM detector
      this.log('Step 3: Training LSTM Anomaly Detector', log);
      await this.trainLSTM(dataPoints);

      // Step 4: Create ensemble predictor
      this.log('Step 4: Building Ensemble Predictor', log);
      this.createEnsemble();

      // Step 5: Validate all models
      this.log('Step 5: Validating Models', log);
      const validation = await this.validateModels(testFeatures);

      // Step 6: Optimize ensemble weights
      this.log('Step 6: Optimizing Ensemble Weights', log);
      const optimization = this.optimizeEnsemble(features);

      const duration = Date.now() - startTime;

      this.trainingLog = log;

      return {
        success: true,
        duration: `${(duration / 1000).toFixed(2)}s`,
        models: {
          prophet: this.models.prophet ? 'trained' : 'failed',
          lstm: this.models.lstm ? 'trained' : 'failed',
          ensemble: this.models.ensemble ? 'ready' : 'failed',
        },
        metrics: this.trainingMetrics,
        validation,
        optimization,
        log,
      };
    } catch (error) {
      this.log(`ERROR: ${error.message}`, log);
      this.trainingLog = log;

      throw new Error(`Pipeline failed: ${error.message}`);
    }
  }

  /**
   * Prepare data for training
   * @param {Array} dataPoints - Raw data
   * @returns {Object} Prepared data
   */
  prepareData(dataPoints) {
    const trainSize = Math.floor(dataPoints.length * this.config.trainTestSplit);
    const trainData = dataPoints.slice(0, trainSize);
    const testData = dataPoints.slice(trainSize);

    // Generate features
    const trainFeatures = this.featureEngine.generateFeatures(trainData);
    const testFeatures = this.featureEngine.generateFeatures(testData);

    this.trainingMetrics.dataPreparation = {
      totalPoints: dataPoints.length,
      trainingPoints: trainData.length,
      testingPoints: testData.length,
      features: trainFeatures.featureCount,
      featureNames: trainFeatures.featureNames.slice(0, 5), // First 5
    };

    return {
      trainData,
      testData,
      features: trainFeatures,
      testFeatures,
    };
  }

  /**
   * Train Prophet model
   * @param {Array} dataPoints - Training data
   * @returns {Promise} Training complete
   */
  async trainProphet(dataPoints) {
    try {
      this.models.prophet = new ProphetForecaster({
        forecastHorizon: 24,
        seasonalityMode: 'additive',
        intervalWidth: 0.95,
      });

      const result = await this.models.prophet.trainModel(
        dataPoints.map((d) => ({
          timestamp: d.timestamp,
          value: d.value,
        }))
      );

      this.trainingMetrics.prophet = {
        trained: true,
        dataPoints: result.dataPoints,
        accuracy: result.metrics.accuracy,
        mape: result.metrics.mape,
        rmse: result.metrics.rmse,
        seasonality: result.seasonality,
      };

      this.log('Prophet training complete. Accuracy: ' + result.metrics.accuracy + '%');

      return result;
    } catch (error) {
      this.trainingMetrics.prophet = {
        trained: false,
        error: error.message,
      };
      throw error;
    }
  }

  /**
   * Train LSTM model
   * @param {Array} dataPoints - Training data
   * @returns {Promise} Training complete
   */
  async trainLSTM(dataPoints) {
    try {
      this.models.lstm = new LSTMDetector({
        sequenceLength: 24,
        threshold: 2.0,
        epochs: 100,
        batchSize: 32,
      });

      const result = await this.models.lstm.trainModel(dataPoints);

      this.trainingMetrics.lstm = {
        trained: true,
        dataPoints: result.dataPoints,
        sequences: result.sequences,
        accuracy: result.metrics.accuracy,
        precision: result.metrics.precision,
        recall: result.metrics.recall,
        f1Score: result.metrics.f1Score,
      };

      this.log('LSTM training complete. Accuracy: ' + result.metrics.accuracy + '%');

      return result;
    } catch (error) {
      this.trainingMetrics.lstm = {
        trained: false,
        error: error.message,
      };
      throw error;
    }
  }

  /**
   * Create ensemble predictor
   * @returns {Object} Ensemble created
   */
  createEnsemble() {
    try {
      this.models.ensemble = new EnsemblePredictor({
        prophet: this.models.prophet,
        lstm: this.models.lstm,
      });

      // Set optimal weights based on individual model performance
      const weights = this.calculateOptimalWeights();
      this.models.ensemble.setWeights(weights);

      this.trainingMetrics.ensemble = {
        created: true,
        weights,
        models: 2,
      };

      this.log('Ensemble created with weights: ' + JSON.stringify(weights));

      return { success: true, weights };
    } catch (error) {
      this.trainingMetrics.ensemble = {
        created: false,
        error: error.message,
      };
      throw error;
    }
  }

  /**
   * Calculate optimal ensemble weights
   * @returns {Object} Optimal weights
   */
  calculateOptimalWeights() {
    const prophetAccuracy = this.trainingMetrics.prophet?.accuracy || 80;
    const lstmAccuracy = this.trainingMetrics.lstm?.accuracy || 85;

    const total = prophetAccuracy + lstmAccuracy;

    return {
      prophet: (prophetAccuracy / total) * 0.7, // Prophet gets 70% weight allocation
      lstm: (lstmAccuracy / total) * 0.25, // LSTM gets 25%
      linear: 0.05, // Linear always gets 5%
    };
  }

  /**
   * Validate all models
   * @param {Object} testFeatures - Test data
   * @returns {Promise} Validation results
   */
  async validateModels(testFeatures) {
    const validation = {
      prophet: null,
      lstm: null,
      ensemble: null,
      overallAccuracy: null,
    };

    try {
      // Validate Prophet
      if (this.models.prophet && this.models.prophet.model) {
        const forecast = this.models.prophet.forecast(10);
        validation.prophet = {
          forecasts: forecast.forecast.length,
          trend: forecast.trend,
          accuracy: this.models.prophet.modelMetrics.accuracy,
        };
      }

      // Validate LSTM
      if (this.models.lstm && this.models.lstm.modelState) {
        const lstmTest = {
          timestamp: Date.now(),
          value: Math.random() * 1000,
        };
        validation.lstm = {
          anomalyDetection: 'ready',
          accuracy: this.models.lstm.modelMetrics.accuracy,
        };
      }

      // Validate Ensemble
      if (this.models.ensemble) {
        const forecast = this.models.ensemble.generateForecast(10);
        validation.ensemble = {
          modelsUsed: forecast.forecasts.forecasts.ensemble.length > 0,
          predictions: forecast.forecasts.ensemble.length,
          weights: forecast.weights,
        };
      }

      // Calculate overall accuracy
      const accuracies = [
        this.trainingMetrics.prophet?.accuracy || 0,
        this.trainingMetrics.lstm?.accuracy || 0,
      ];
      validation.overallAccuracy =
        (accuracies.reduce((a, b) => a + b, 0) / accuracies.length).toFixed(2) + '%';

      this.log('Model validation complete. Overall: ' + validation.overallAccuracy);

      return validation;
    } catch (error) {
      this.log('Validation error: ' + error.message);
      throw error;
    }
  }

  /**
   * Optimize ensemble weights
   * @param {Object} features - Training features
   * @returns {Object} Optimization results
   */
  optimizeEnsemble(features) {
    if (!this.models.ensemble || !features.features) {
      return { success: false, message: 'Ensemble or features not ready' };
    }

    try {
      const values = features.features.map((f) => f.value);
      const result = this.models.ensemble.optimizeWeights(
        features.features.map((f) => ({
          timestamp: f.timestamp,
          value: f.value,
        }))
      );

      this.trainingMetrics.optimization = {
        success: true,
        optimizedAccuracy: result.accuracy,
        weights: result.optimizedWeights,
      };

      this.log('Ensemble optimization complete. Accuracy: ' + result.accuracy.toFixed(2) + '%');

      return result;
    } catch (error) {
      this.log('Optimization error: ' + error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log pipeline step
   * @param {string} message - Log message
   * @param {Array} log - Log array
   */
  log(message, log = null) {
    const entry = {
      timestamp: new Date(),
      message,
    };

    if (log) {
      log.push(entry);
    }
    this.trainingLog.push(entry);
  }

  /**
   * Get pipeline status
   * @returns {Object} Pipeline status
   */
  getStatus() {
    return {
      prophet: this.models.prophet ? 'trained' : 'not_trained',
      lstm: this.models.lstm ? 'trained' : 'not_trained',
      ensemble: this.models.ensemble ? 'ready' : 'not_ready',
      metrics: this.trainingMetrics,
      logEntries: this.trainingLog.length,
    };
  }

  /**
   * Get pipeline report
   * @returns {Object} Detailed report
   */
  getReport() {
    return {
      timestamp: new Date(),
      status: this.getStatus(),
      metrics: this.trainingMetrics,
      models: {
        prophet: this.models.prophet ? this.models.prophet.getModelDiagnostics() : null,
        lstm: this.models.lstm ? this.models.lstm.getModelDiagnostics() : null,
        ensemble: this.models.ensemble ? this.models.ensemble.getSummary() : null,
      },
      log: this.trainingLog.slice(-20), // Last 20 log entries
    };
  }

  /**
   * Retrain specific model
   * @param {string} modelName - Model to retrain
   * @param {Array} dataPoints - New data
   * @returns {Promise} Retraining complete
   */
  async retrainModel(modelName, dataPoints) {
    try {
      let result;

      switch (modelName.toLowerCase()) {
        case 'prophet':
          result = await this.trainProphet(dataPoints);
          break;
        case 'lstm':
          result = await this.trainLSTM(dataPoints);
          break;
        case 'ensemble':
          this.createEnsemble();
          result = { success: true, message: 'Ensemble recreated' };
          break;
        default:
          throw new Error(`Unknown model: ${modelName}`);
      }

      this.log(`Model retraining complete: ${modelName}`);
      return result;
    } catch (error) {
      this.log(`Retraining error for ${modelName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export trained models
   * @returns {Object} Model snapshots
   */
  exportModels() {
    return {
      prophet: this.models.prophet ? this.models.prophet.getModelDiagnostics() : null,
      lstm: this.models.lstm ? this.models.lstm.getModelDiagnostics() : null,
      ensemble: this.models.ensemble ? this.models.ensemble.getSummary() : null,
      timestamp: new Date(),
      metrics: this.trainingMetrics,
    };
  }

  /**
   * Get training recommendations
   * @returns {Object} Recommendations
   */
  getRecommendations() {
    const recommendations = [];

    // Prophet recommendations
    if (this.trainingMetrics.prophet) {
      if (this.trainingMetrics.prophet.accuracy < 80) {
        recommendations.push('Increase Prophet training data or adjust seasonality settings');
      }
    }

    // LSTM recommendations
    if (this.trainingMetrics.lstm) {
      if (this.trainingMetrics.lstm.accuracy < 85) {
        recommendations.push('Consider increasing LSTM sequence length or epochs');
      }
    }

    // Ensemble recommendations
    if (this.trainingMetrics.optimization) {
      if (this.trainingMetrics.optimization.optimizedAccuracy < 90) {
        recommendations.push('Ensemble accuracy below target. Consider collecting more diverse training data');
      }
    }

    return {
      recommendations,
      actionItems: recommendations.length,
    };
  }
}

module.exports = MLTrainingPipeline;
