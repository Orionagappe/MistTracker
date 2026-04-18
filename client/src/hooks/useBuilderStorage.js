import { useState, useCallback, useEffect } from 'react';
import { timelineAPI } from '../api';
import { perf } from '../utils/performanceMonitor';

/**
 * useBuilderStorage Hook
 * Phase 7.4: Manages persistent storage of builder configurations
 * Phase 8.2: Added performance monitoring for storage operations
 * 
 * Provides offline-first storage with optional server sync
 * Uses localStorage for immediate persistence, optional API sync
 */

// Storage keys
const STORAGE_KEYS = {
  configPrefix: 'atom_builder_config_',
  autoSavePrefix: 'atom_builder_unsaved_',
  lastSyncPrefix: 'atom_builder_sync_',
};

export function useBuilderStorage(timelineId) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Build storage keys for this timeline
  const storageKey = `${STORAGE_KEYS.configPrefix}${timelineId}`;
  const unsavedKey = `${STORAGE_KEYS.autoSavePrefix}${timelineId}`;
  const syncKey = `${STORAGE_KEYS.lastSyncPrefix}${timelineId}`;

  /**
   * Load configuration from localStorage or server
   */
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from localStorage first (offline-capable)
      const localConfig = localStorage.getItem(storageKey);
      if (localConfig) {
        setConfig(JSON.parse(localConfig));
        setIsDirty(false);
        setLoading(false);

        // Optionally sync with server in background
        // Only replace local config if the server version has actual content,
        // preventing a stale empty DB record from wiping locally-placed atoms.
        if (timelineId && timelineId !== 'demo') {
          try {
            const response = await timelineAPI.getBuilderConfig(timelineId);
            const serverConfig = response.data?.config;
            const serverHasContent = serverConfig &&
              ((serverConfig.atoms?.length || 0) > 0 ||
               (serverConfig.emitters?.length || 0) > 0);
            if (serverHasContent) {
              setConfig(serverConfig);
              localStorage.setItem(storageKey, JSON.stringify(serverConfig));
              localStorage.setItem(syncKey, new Date().toISOString());
            }
          } catch (err) {
            // Keep using local config on sync failure (including 404)
          }
        }
        return;
      }

      // Try server if no local config
      if (timelineId && timelineId !== 'demo') {
        try {
          const response = await timelineAPI.getBuilderConfig(timelineId);
          if (response.data?.config) {
            setConfig(response.data.config);
            localStorage.setItem(storageKey, JSON.stringify(response.data.config));
            localStorage.setItem(syncKey, new Date().toISOString());
            setIsDirty(false);
          }
        } catch (err) {
          // 404 = no saved config yet; other errors = server unavailable.
          // Either way, start with an empty local config.
          console.debug('No server config found, starting fresh.');
          setConfig({ atoms: [], emitters: [], simulationParams: {} });
        }
      } else {
        // Empty config for demo timelines
        setConfig({ atoms: [], emitters: [], simulationParams: {} });
      }
    } catch (err) {
      // Fallback for any unexpected errors
      setConfig({ atoms: [], emitters: [], simulationParams: {} });
    } finally {
      setLoading(false);
    }
  }, [timelineId, storageKey, syncKey]);

  /**
   * Save configuration to localStorage (immediate)
   * and server (async)
   * Phase 8.2: Added performance monitoring
   */
  const saveConfig = useCallback(
    async (newConfig, syncToServer = true) => {
      try {
        // Validate config structure
        if (!newConfig || typeof newConfig !== 'object') {
          throw new Error('Invalid configuration object');
        }

        // Ensure required fields
        const configToSave = {
          atoms: newConfig.atoms || [],
          emitters: newConfig.emitters || [],
          simulationParams: newConfig.simulationParams || {},
          timestamp: new Date().toISOString(),
          version: 1
        };

        // Phase 8.2: Measure localStorage performance
        try {
          perf.measure('localStorage.setItem (config)', () => {
            const serialized = JSON.stringify(configToSave);
            // Test if localStorage is available
            if (typeof localStorage === 'undefined') {
              throw new Error('localStorage not available');
            }
            localStorage.setItem(storageKey, serialized);
            console.log(`✓ Config saved to localStorage [${serialized.length} bytes]`, configToSave);
          }, { threshold: 50 });
        } catch (storageErr) {
          console.error('localStorage error:', storageErr);
          // Continue without localStorage - it might be disabled (private browsing)
          console.warn('localStorage unavailable, skipping local save');
        }

        localStorage.removeItem(unsavedKey); // Clear unsaved flag
        setConfig(configToSave);
        setIsDirty(false);

        // Optional server sync
        if (syncToServer && timelineId && timelineId !== 'demo') {
          setIsSyncing(true);
          try {
            const response = await timelineAPI.saveBuilderConfig(timelineId, configToSave);
            if (response.data?.success) {
              try {
                localStorage.setItem(syncKey, new Date().toISOString());
              } catch (e) {
                // Ignore localStorage errors
              }
              console.log('✓ Config synced to server');
            }
          } catch (err) {
            // 404 is expected - backend endpoint not implemented yet, suppress warning
            if (err.response?.status !== 404) {
              console.debug('Builder config server sync skipped (endpoint unavailable)', err);
            }
            // Mark as needing sync for later
            try {
              localStorage.setItem(unsavedKey, 'true');
            } catch (e) {
              // Ignore localStorage errors
            }
          } finally {
            setIsSyncing(false);
          }
        }

        return configToSave;
      } catch (err) {
        console.error('Failed to save configuration:', err);
        setError(`Failed to save configuration: ${err.message}`);
        throw err;
      }
    },
    [timelineId, storageKey, unsavedKey, syncKey]
  );

  /**
   * Update specific part of configuration
   */
  const updateConfig = useCallback(
    (updates, syncToServer = true) => {
      const newConfig = {
        ...config,
        ...updates,
        atoms: updates.atoms || config?.atoms || [],
        emitters: updates.emitters || config?.emitters || [],
        simulationParams: updates.simulationParams || config?.simulationParams || {},
      };

      setConfig(newConfig);
      setIsDirty(true);

      // Auto-save to localStorage immediately
      localStorage.setItem(storageKey, JSON.stringify(newConfig));

      // Debounced server sync (you could add debounce here in production)
      if (syncToServer && timelineId && timelineId !== 'demo') {
        setIsSyncing(true);
        timelineAPI
          .saveBuilderConfig(timelineId, newConfig)
          .then(() => {
            localStorage.setItem(syncKey, new Date().toISOString());
            setIsDirty(false);
          })
          .catch((err) => {
            console.warn('Failed to sync config update:', err);
            localStorage.setItem(unsavedKey, 'true');
          })
          .finally(() => setIsSyncing(false));
      }

      return newConfig;
    },
    [config, timelineId, storageKey, unsavedKey, syncKey]
  );

  /**
   * Clear configuration (reset)
   */
  const clearConfig = useCallback(async () => {
    const empty = { atoms: [], emitters: [], simulationParams: {} };
    await saveConfig(empty, true);
  }, [saveConfig]);

  /**
   * Get unsaved changes status
   */
  const hasUnsavedChanges = useCallback(() => {
    return isDirty || localStorage.getItem(unsavedKey) === 'true';
  }, [isDirty, unsavedKey]);

  /**
   * Force sync with server
   */
  const syncWithServer = useCallback(async () => {
    if (!timelineId || timelineId === 'demo') return;

    setIsSyncing(true);
    try {
      if (isDirty && config) {
        // Push local changes to server
        await timelineAPI.saveBuilderConfig(timelineId, config);
      } else {
        // Pull from server
        const response = await timelineAPI.getBuilderConfig(timelineId);
        if (response.data?.config) {
          setConfig(response.data.config);
          localStorage.setItem(storageKey, JSON.stringify(response.data.config));
        }
      }
      localStorage.setItem(syncKey, new Date().toISOString());
      setIsDirty(false);
    } catch (err) {
      setError(`Failed to sync with server: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  }, [timelineId, config, isDirty, storageKey, syncKey]);

  /**
   * Load config on mount
   */
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /**
   * Phase 13: Get cached config from localStorage without loading state
   * Used by config loader for offline fallback
   */
  const getCachedConfig = useCallback(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn('Error retrieving cached config:', err);
      return null;
    }
  }, [storageKey]);

  /**
   * Phase 13: Check if cache exists and is relatively fresh
   */
  const isCacheStale = useCallback((maxAgeMs = 3600000) => {
    // Default: 1 hour
    try {
      const lastSync = localStorage.getItem(syncKey);
      if (!lastSync) return true; // No sync record = stale

      const lastSyncTime = new Date(lastSync).getTime();
      const now = Date.now();
      return now - lastSyncTime > maxAgeMs;
    } catch (err) {
      return true;
    }
  }, [syncKey]);

  return {
    config,
    setConfig,
    loading,
    error,
    isDirty,
    isSyncing,
    saveConfig,
    updateConfig,
    clearConfig,
    hasUnsavedChanges,
    syncWithServer,
    storageKey,
    getCachedConfig,
    isCacheStale,
  };
}

export default useBuilderStorage;
