import { useState, useCallback, useEffect } from 'react';
import { loadSession, saveSession, generateSessionId } from '../utils/simulationSessionManager';
import { perf } from '../utils/performanceMonitor';
import { timelineAPI } from '../api';

/**
 * useSimulationStorage Hook
 * Phase 14: Manages persistent storage of simulation configurations
 * 
 * Decoupled from organizational Timeline context
 * Keyed by sessionId (UUID) instead of timelineId
 * 
 * Provides:
 * - Offline-first storage (localStorage)
 * - Server sync to database
 * - Performance monitoring
 */

export function useSimulationStorage(sessionId, timelineId) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // If no sessionId provided, generate fresh one
  // This prevents accidental session reuse
  const effectiveSessionId = sessionId || generateSessionId();

  /**
   * Load configuration from localStorage
   * Session is loaded on first mount only
   */
  useEffect(() => {
    const loadSessionData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load session from localStorage by sessionId
        const session = loadSession(effectiveSessionId);

        if (session) {
          console.log(`✓ Loaded simulation session [${effectiveSessionId.substring(0, 8)}...]`, session.config);
          setConfig(session.config);
          setIsDirty(false);
        } else {
          // Fresh session - initialize empty config
          console.log(`⚡ New simulation session [${effectiveSessionId.substring(0, 8)}...]`);
          setConfig({
            atoms: [],
            emitters: [],
            simulationParams: {}
          });
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        setError(err.message);
        setConfig({ atoms: [], emitters: [], simulationParams: {} });
      } finally {
        setLoading(false);
      }
    };

    loadSessionData();
  }, [effectiveSessionId]);

  /**
   * Save configuration to localStorage AND sync to server
   * @param {object} newConfig - Configuration to save
   */
  const saveConfig = useCallback(
    async (newConfig) => {
      try {
        // Validate config structure
        if (!newConfig || typeof newConfig !== 'object') {
          throw new Error('Invalid configuration object');
        }

        const configToSave = {
          atoms: newConfig.atoms || [],
          emitters: newConfig.emitters || [],
          simulationParams: newConfig.simulationParams || {},
          timestamp: new Date().toISOString(),
          version: 1
        };

        // Save to localStorage (offline-first)
        try {
          perf.measure('session.save', () => {
            // Load current session, update config, save back
            const session = loadSession(effectiveSessionId);
            if (session) {
              session.config = configToSave;
              session.metadata.lastModified = new Date().toISOString();
              saveSession(session);
            }
            console.log(`✓ Config saved to localStorage [${effectiveSessionId.substring(0, 8)}...]`);
          }, { threshold: 50 });
        } catch (storageErr) {
          console.error('Session storage error:', storageErr);
          console.warn('Storage unavailable, config not persisted locally');
        }

        // Sync to server if timelineId is available
        if (timelineId) {
          try {
            setIsSyncing(true);
            console.log(`⏳ Syncing config to server for timeline ${timelineId}...`);
            
            await timelineAPI.saveBuilderConfig(timelineId, configToSave);
            
            console.log(`✓ Config synced to database for timeline ${timelineId}`);
          } catch (syncErr) {
            console.warn(`Failed to sync config to server: ${syncErr.message}`);
            // Don't throw - allow offline use even if sync fails
          } finally {
            setIsSyncing(false);
          }
        } else {
          console.warn('No timelineId provided - config not synced to server');
        }

        setConfig(configToSave);
        setIsDirty(false);
      } catch (err) {
        console.error('Failed to save config:', err);
        setError(err.message);
      }
    },
    [effectiveSessionId, timelineId]
  );

  /**
   * Get current session metadata
   */
  const getSessionMetadata = useCallback(() => {
    const session = loadSession(effectiveSessionId);
    return session ? {
      sessionId: session.sessionId,
      timelineId: session.timelineId,
      createdAt: session.createdAt,
      lastModified: session.metadata.lastModified,
      version: session.version
    } : null;
  }, [effectiveSessionId]);

  return {
    config,
    loading,
    error,
    isDirty,
    isSyncing,
    sessionId: effectiveSessionId,
    saveConfig,
    getSessionMetadata
  };
}

export default useSimulationStorage;
