/**
 * useDemoConfigs.js - Demo Physics Configuration Management Hook
 * Manages loading and applying demo configurations to AtomBuilder
 * Phase 11: Integrated with unified atom model
 */

import { useCallback, useState, useEffect } from 'react';
import * as DemoConfigs from '../config/DEMO_PHYSICS_CONFIGS.js';

/**
 * Hook for managing demo physics configurations
 * @param {function} onConfigLoaded - Callback when configuration is loaded
 * @returns {object} Configuration management interface
 */
export function useDemoConfigs(onConfigLoaded) {
  const [availableConfigs, setAvailableConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize available configurations
  useEffect(() => {
    try {
      const configNames = DemoConfigs.getDemoConfigNames();
      const configDetails = configNames.map(name => {
        const config = DemoConfigs.getDemoConfig(name);
        return {
          name,
          displayName: config.name,
          description: config.description,
          atomCount: config.atoms?.length || 0,
          emitterCount: config.waveEmitters?.length || 0
        };
      });
      setAvailableConfigs(configDetails);
    } catch (err) {
      console.error('Failed to initialize demo configs:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Load a demo configuration by name
   */
  const loadConfig = useCallback(
    (configName) => {
      setIsLoading(true);
      setError(null);

      try {
        const config = DemoConfigs.getDemoConfig(configName);
        if (!config) {
          throw new Error(`Configuration "${configName}" not found`);
        }

        // Convert to AtomBuilder format
        const builderConfig = DemoConfigs.exportAtomBuilderConfig(configName);

        setSelectedConfig({
          name: configName,
          config: builderConfig
        });

        // Notify parent component
        if (onConfigLoaded) {
          onConfigLoaded(builderConfig);
        }

        console.log(`✓ Loaded demo config: ${configName}`);
      } catch (err) {
        console.error('Failed to load config:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [onConfigLoaded]
  );

  /**
   * Get configuration details
   */
  const getConfigDetails = useCallback(
    (configName) => {
      const config = DemoConfigs.getDemoConfig(configName);
      if (!config) return null;

      return {
        name: config.name,
        description: config.description,
        atoms: config.atoms.map(a => ({
          id: a.id,
          name: a.orbital_name,
          type: `${a.orbital.n}${['s', 'p', 'd', 'f'][a.orbital.l]}`,
          position: a.position,
          orbitalFreq: `${(a.orbitalFrequency / 1e14).toFixed(1)}×10¹⁴ Hz`,
          nucleusFreq: `${(a.nucleusFrequency / 1e15).toFixed(2)}×10¹⁵ Hz`
        })),
        emitters: config.waveEmitters.map(e => ({
          id: e.id,
          position: e.position,
          frequency: `${e.frequency} Hz`,
          wavelength: `${e.wavelength} units`
        })),
        params: config.simulationParams
      };
    },
    []
  );

  /**
   * Export current configuration for physics engine
   */
  const exportForPhysicsEngine = useCallback(
    (configName) => {
      return DemoConfigs.exportPhysicsEngineConfig(configName);
    },
    []
  );

  /**
   * Get scenario description for UI display
   */
  const getScenarioInfo = useCallback(
    (configName) => {
      const config = DemoConfigs.getDemoConfig(configName);
      if (!config) return null;

      return {
        title: config.name,
        description: config.description,
        tests: getRecommendedTests(configName)
      };
    },
    []
  );

  /**
   * Get recommended tests for a configuration
   */
  const getRecommendedTests = (configName) => {
    const testMap = {
      HYDROGEN_SIMPLE: [
        'Single atom electron evolution',
        'Physics update frequency',
        'Particle generation'
      ],
      MULTI_ATOM: [
        'Multi-atom independence',
        'Separate electron evolution',
        'Frequency differentiation'
      ],
      WAVE_COUPLING: [
        'Wave-orbital coupling',
        'Particle generation at multiple sites',
        'Phase coherence'
      ],
      FREQUENCY_SWEEP: [
        'Frequency-dependent particle count',
        'Resonance detection',
        'Amplitude modulation'
      ],
      LONG_RANGE: [
        'Long-range wave propagation',
        'Metric tensor effects',
        'Amplitude falloff'
      ],
      AMPLITUDE_FALLOFF: [
        'Distance-based amplitude attenuation',
        'Metric propagation validation',
        'Wave intensity comparison'
      ],
      RESONANCE_CASCADE: [
        '3-atom resonance cascade',
        'Phase coherence across atoms',
        'Wave interference patterns'
      ],
      MULTI_FREQUENCY: [
        'Multi-frequency system stability',
        'Complex interference effects',
        'Element variation response'
      ]
    };

    return testMap[configName] || [];
  };

  return {
    // State
    availableConfigs,
    selectedConfig,
    isLoading,
    error,

    // Methods
    loadConfig,
    getConfigDetails,
    exportForPhysicsEngine,
    getScenarioInfo,

    // Utilities
    configCount: availableConfigs.length,
    hasError: !!error,
    isConfigSelected: !!selectedConfig
  };
}

export default useDemoConfigs;
