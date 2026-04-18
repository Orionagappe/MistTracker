/**
 * Proxy Engine Index
 * Phase 15: ML Proxy Framework
 * 
 * Central export for all proxy engine components
 */

export { extractPatterns, compilePatternToProxy } from './dataPipeline.js';

export {
  ProxyDefinition,
  AlgebraicExpressionProxy,
  LookupTableProxy,
  NeuralNetworkProxy,
  GeometricTransformProxy,
  PROXY_TYPES,
  createProxy,
  validateProxyDefinition
} from './proxySchema.js';

export {
  ProxyConnection,
  CompositeProxy,
  ProxyComposer
} from './proxyComposer.js';

export {
  ProxyExecutionContext,
  RuntimeProxyEngine
} from './proxyRuntime.js';

export {
  ProxyExecutionTrace,
  TrainingDataset,
  ProxyVersionHistory,
  ProxyTrainer
} from './proxyTraining.js';
