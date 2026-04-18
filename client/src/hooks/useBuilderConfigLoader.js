/**
 * useBuilderConfigLoader - Load builder configurations from DB/cache
 * Phase 13: Configuration Persistence
 * 
 * Responsibilities:
 * - Fetch saved configs from DB or localStorage fallback
 * - Send configs to physics server via WebSocket
 * - Handle errors gracefully with offline fallback
 * - Cache management to prevent repeated DB calls
 */

import { useState, useCallback, useRef } from 'react';
import { timelineAPI } from '../api';
import { useBuilderStorage } from './useBuilderStorage';

export function useBuilderConfigLoader(timelineId) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [usingCache, setUsingCache] = useState(false);
  const { config: cachedConfig, updateConfig: updateCachedConfig } = useBuilderStorage(timelineId);
  
  // Track which config is currently loaded to avoid duplicate sends
  const lastLoadedConfigRef = useRef(null);

  /**
   * Fetch config from database with localStorage fallback
   * @param {string} timelineId - Timeline ID to fetch for
   * @returns {Promise<Object|null>} - Config object or null if not found
   */
  const fetchConfig = useCallback(async (timelineId) => {
    if (!timelineId) return null;

    try {
      setIsLoading(true);
      setLoadError(null);
      setUsingCache(false);

      // Try to fetch from API (DB)
      try {
        const response = await timelineAPI.getBuilderConfig(timelineId);
        
        if (response?.data?.config) {
          const loadedConfig = response.data.config;
          
          // Cache the loaded config to localStorage
          try {
            await updateCachedConfig(loadedConfig, false); // Don't re-sync to server
          } catch (cacheErr) {
            console.warn('Failed to cache config to localStorage:', cacheErr.message);
          }
          
          setIsLoading(false);
          return loadedConfig;
        }
      } catch (apiErr) {
        // API call failed - check if it's expected (404/timeout)
        if (apiErr?.response?.status === 404 || apiErr?.code === 'ECONNABORTED') {
          console.log('⚠️ Builder config not found in DB (expected during development)');
        } else if (apiErr?.message?.includes('Network')) {
          console.log('⚠️ Network error fetching config - checking cache');
        } else {
          console.warn('API error fetching config:', apiErr.message);
        }
        // Continue to fallback
      }

      // Fallback: Try localStorage cache
      if (cachedConfig && Object.keys(cachedConfig).length > 0) {
        console.log('📦 Using cached config from localStorage');
        setUsingCache(true);
        setIsLoading(false);
        return cachedConfig;
      }

      // No config found anywhere
      setIsLoading(false);
      return null;

    } catch (err) {
      console.error('Unexpected error in fetchConfig:', err);
      setLoadError(err.message);
      setIsLoading(false);
      return null;
    }
  }, [cachedConfig, updateCachedConfig]);

  /**
   * Send configuration to physics server via WebSocket
   * @param {Object} config - Config with atoms/emitters/params
   * @param {Object} wsConnection - WebSocket connection object
   * @returns {Promise<boolean>} - Success status
   */
  const sendConfigToPhysics = useCallback(async (config, wsConnection) => {
    if (!config || !wsConnection) {
      console.warn('⚠️ Missing config or WebSocket connection');
      return false;
    }

    // Check if WebSocket is ready
    if (!wsConnection.isConnected) {
      console.log('⏳ WebSocket not connected yet, skipping send');
      return false;
    }

    try {
      const { atoms = [], emitters = [] } = config;
      let sentCount = 0;
      let failCount = 0;

      // Send each atom as geometry
      for (const atom of atoms) {
        try {
          const success = wsConnection.sendGeometryCreate(
            atom.id || `atom-${Math.random().toString(36).substr(2, 9)}`,
            'sphere',
            { 
              x: atom.position?.[0] || 0, 
              y: atom.position?.[1] || 0, 
              z: atom.position?.[2] || 0 
            },
            { x: 8, y: 8, z: 8 },
            { x: 0, y: 0, z: 0 },
            '#44dd88',
            {
              orbital: atom.orbital_name || atom.orbital?.name,
              type: 'atom',
              orbitalFreq: atom.orbitalFrequency,
              nucleusFreq: atom.nucleusFrequency
            }
          );

          if (success) {
            sentCount++;
          } else {
            failCount++;
          }
        } catch (atomErr) {
          console.warn(`Failed to send atom ${atom.id}:`, atomErr.message);
          failCount++;
        }
      }

      // Send each emitter as wave source
      for (const emitter of emitters) {
        try {
          const success = wsConnection.sendWaveEmitter(
            emitter.id || `emitter-${Math.random().toString(36).substr(2, 9)}`,
            'light',
            { 
              x: emitter.position?.[0] || 0, 
              y: emitter.position?.[1] || 0, 
              z: emitter.position?.[2] || 0 
            },
            emitter.frequency || 5000,
            emitter.amplitude || 1.0,
            1.0
          );

          if (success) {
            sentCount++;
          } else {
            failCount++;
          }
        } catch (emitterErr) {
          console.warn(`Failed to send emitter ${emitter.id}:`, emitterErr.message);
          failCount++;
        }
      }

      const status = `${sentCount} objects sent${failCount > 0 ? `, ${failCount} failed` : ''}`;
      console.log(`✅ Config sent to physics: ${status}`);
      return failCount === 0;

    } catch (err) {
      console.error('Error sending config to physics:', err);
      setLoadError(err.message);
      return false;
    }
  }, []);

  /**
   * Complete workflow: Load config from DB/cache and send to physics
   * @param {string} timelineId - Timeline ID to load
   * @param {Object} wsConnection - WebSocket connection
   * @returns {Promise<Object|null>} - Loaded and sent config
   */
  const loadAndSendConfig = useCallback(async (timelineId, wsConnection) => {
    if (!timelineId) {
      console.log('ℹ️ No timeline ID provided to loadAndSendConfig');
      return null;
    }

    // Fetch config
    const config = await fetchConfig(timelineId);

    if (!config) {
      console.log('ℹ️ No configuration found for timeline');
      return null;
    }

    // Check if this is the same config we already sent (avoid duplicates)
    if (lastLoadedConfigRef.current === config) {
      console.log('ℹ️ Configuration already loaded, skipping resend');
      return config;
    }

    // Send to physics server
    await sendConfigToPhysics(config, wsConnection);
    lastLoadedConfigRef.current = config;

    return config;
  }, [fetchConfig, sendConfigToPhysics]);

  /**
   * Clear the loaded config tracking (useful when switching contexts)
   */
  const clearLoaded = useCallback(() => {
    lastLoadedConfigRef.current = null;
    setUsingCache(false);
  }, []);

  return {
    isLoading,
    loadError,
    usingCache,
    fetchConfig,
    sendConfigToPhysics,
    loadAndSendConfig,
    clearLoaded
  };
}

export default useBuilderConfigLoader;
