/**
 * Phase 16.10: CachedModelVisualizer
 * Client-side component for fast, high-accuracy visualizations
 * 
 * Uses Phase 16.9 dual-track server (Track 1: Cached models)
 * Serves particle visualizations with precomputed neural networks
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * CachedModelVisualizer: Fast visualization using precomputed models
 * 
 * Features:
 * - Loads precomputed trained models from server
 * - No FP operations (precomputed)
 * - Unlimited particle scaling
 * - Cache-aware optimization
 * - Real-time statistics
 * 
 * @param {Object} props
 * @param {Object} props.server - Phase 16.9 DualTrackServer instance
 * @param {String} props.proxyId - Model ID (e.g., 'hydrogen-proxy-v5')
 * @param {Number} props.particleLimit - Max particles to display (default: unlimited)
 * @param {Number} props.updateRate - Updates per second (default: 60)
 * @param {Function} props.onError - Error callback
 * @param {Function} props.onStatsUpdate - Statistics callback
 */
export function CachedModelVisualizer({
  server,
  proxyId = 'hydrogen-proxy-v5',
  particleLimit = Infinity,
  updateRate = 60,
  onError = null,
  onStatsUpdate = null
}) {
  // State
  const [particles, setParticles] = useState([]);
  const [stats, setStats] = useState({
    particleCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    avgResponseTime: 0,
    fpOpsUsed: 0,
    energyRange: { min: 0, max: 0 },
    domainDistribution: { past: 0, present: 0, future: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState('cached');
  const [isRunning, setIsRunning] = useState(true);

  // Initialize
  useEffect(() => {
    if (!server) {
      setError('Server not initialized');
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [server]);

  /**
   * Generate random particle batch
   */
  const generateParticleBatch = useCallback((count) => {
    const batch = [];
    for (let i = 0; i < count; i++) {
      batch.push([
        Math.random() * 10,           // x
        Math.random() * 10,           // y
        Math.random() * 10,           // z
        Math.random() * 20 - 10       // w: [-10, 10]
      ]);
    }
    return batch;
  }, []);

  /**
   * Predict energies for particle batch
   */
  const predictBatch = useCallback(async (coordinates) => {
    if (!server || !isRunning) return null;

    try {
      const result = await server.predictBatch({
        coordinates,
        proxyId,
        track: selectedTrack
      });

      // Transform to particle visualization format
      const visualParticles = result.predictions.map((pred, idx) => {
        const [x, y, z, w] = coordinates[idx];
        return {
          id: idx,
          x, y, z, w,
          energy: pred.energy,
          timeDomain: pred.timeDomain,
          confidence: pred.confidence || (selectedTrack === 'cached' ? 0.9 : 0.85),
          responseTime: pred.responseTime,
          fpOpsUsed: pred.fpOpsUsed,
          source: pred.source
        };
      });

      // Update stats
      const energies = result.predictions.map(p => p.energy);
      const domains = { past: 0, present: 0, future: 0 };

      result.predictions.forEach(p => {
        if (p.timeDomain in domains) {
          domains[p.timeDomain]++;
        }
      });

      const newStats = {
        particleCount: visualParticles.length,
        cacheHits: result.predictions.filter(p => p.cacheHit).length,
        cacheMisses: result.predictions.filter(p => !p.cacheHit).length,
        hitRate: result.predictions.filter(p => p.cacheHit).length / visualParticles.length,
        avgResponseTime: result.avgResponseTime,
        fpOpsUsed: result.fpOpsUsed,
        energyRange: {
          min: Math.min(...energies),
          max: Math.max(...energies)
        },
        domainDistribution: domains
      };

      setParticles(visualParticles);
      setStats(newStats);

      if (onStatsUpdate) {
        onStatsUpdate(newStats);
      }

      return visualParticles;
    } catch (err) {
      const msg = `Prediction failed: ${err.message}`;
      setError(msg);
      if (onError) onError(err);
      return null;
    }
  }, [server, proxyId, selectedTrack, isRunning, onError, onStatsUpdate]);

  /**
   * Update loop
   */
  useEffect(() => {
    if (!isRunning || !server) return;

    const updateInterval = 1000 / updateRate;
    let lastUpdate = 0;
    let particleCount = 50; // Start small

    const updateLoop = async () => {
      const now = Date.now();
      if (now - lastUpdate >= updateInterval) {
        // Gradually increase particles (if using cached track)
        if (selectedTrack === 'cached' && particleCount < particleLimit) {
          particleCount = Math.min(
            particleCount + 10,
            Math.min(500, particleLimit)
          );
        }

        const batch = generateParticleBatch(particleCount);
        await predictBatch(batch);
        lastUpdate = now;
      }

      if (isRunning) {
        requestAnimationFrame(updateLoop);
      }
    };

    requestAnimationFrame(updateLoop);
  }, [isRunning, server, updateRate, particleLimit, selectedTrack, generateParticleBatch, predictBatch]);

  /**
   * Render particle grid visualization
   */
  const renderParticleGrid = useMemo(() => {
    if (particles.length === 0) return null;

    return (
      <div className="particle-grid">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${(p.x / 10) * 100}%`,
              top: `${(p.y / 10) * 100}%`,
              backgroundColor: getParticleColor(p.energy, stats.energyRange),
              opacity: 0.7 + (Math.abs(p.w) / 20) * 0.3,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              position: 'absolute',
              cursor: 'pointer',
              title: `E=${p.energy.toFixed(2)} eV, Domain=${p.timeDomain}, w=${p.w.toFixed(2)}`
            }}
            onClick={() => console.log('Particle:', p)}
          />
        ))}
      </div>
    );
  }, [particles, stats.energyRange]);

  /**
   * Helper: Get color based on energy
   */
  const getParticleColor = (energy, range) => {
    if (range.max === range.min) return '#888';

    const normalized = (energy - range.min) / (range.max - range.min);

    // Red (low) → Yellow → Green (high)
    if (normalized < 0.5) {
      const t = normalized * 2;
      return `rgb(${255}, ${Math.floor(255 * t)}, 0)`;
    } else {
      const t = (normalized - 0.5) * 2;
      return `rgb(${Math.floor(255 * (1 - t))}, 255, 0)`;
    }
  };

  if (loading) {
    return <div className="cached-visualizer loading">Initializing...</div>;
  }

  if (error) {
    return (
      <div className="cached-visualizer error">
        <h3>⚠️ Error</h3>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Dismiss</button>
      </div>
    );
  }

  return (
    <div className="cached-visualizer">
      <div className="header">
        <h2>🎨 Particle Visualizer (Phase 16.10)</h2>
        <div className="controls">
          <label>
            <input
              type="checkbox"
              checked={isRunning}
              onChange={(e) => setIsRunning(e.target.checked)}
            />
            Running
          </label>

          <label>
            Track:
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
            >
              <option value="cached">Cached (Fast)</option>
              <option value="simulation">Simulation (Research)</option>
            </select>
          </label>
        </div>
      </div>

      <div className="main">
        <div className="visualization">
          <div className="particle-container" style={{ position: 'relative', width: '100%', height: '400px', border: '1px solid #ccc', overflow: 'hidden' }}>
            {renderParticleGrid}
          </div>
        </div>

        <div className="stats">
          <h3>📊 Statistics</h3>
          <div className="stat-group">
            <div className="stat">
              <span>Particles:</span>
              <span className="value">{stats.particleCount}</span>
            </div>
            <div className="stat">
              <span>Track:</span>
              <span className="value">{selectedTrack}</span>
            </div>
            <div className="stat">
              <span>Response:</span>
              <span className="value">{stats.avgResponseTime.toFixed(2)}ms</span>
            </div>
            <div className="stat">
              <span>FP Ops:</span>
              <span className="value">{stats.fpOpsUsed}</span>
            </div>
          </div>

          {selectedTrack === 'cached' && (
            <div className="stat-group">
              <h4>Cache Performance</h4>
              <div className="stat">
                <span>Hits:</span>
                <span className="value">{stats.cacheHits}</span>
              </div>
              <div className="stat">
                <span>Misses:</span>
                <span className="value">{stats.cacheMisses}</span>
              </div>
              <div className="stat">
                <span>Hit Rate:</span>
                <span className="value">{(stats.hitRate * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}

          <div className="stat-group">
            <h4>Time Domains</h4>
            <div className="stat">
              <span>Past:</span>
              <span className="value">{stats.domainDistribution.past}</span>
            </div>
            <div className="stat">
              <span>Present:</span>
              <span className="value">{stats.domainDistribution.present}</span>
            </div>
            <div className="stat">
              <span>Future:</span>
              <span className="value">{stats.domainDistribution.future}</span>
            </div>
          </div>

          <div className="stat-group">
            <h4>Energy Range</h4>
            <div className="stat">
              <span>Min:</span>
              <span className="value">{stats.energyRange.min.toFixed(2)} eV</span>
            </div>
            <div className="stat">
              <span>Max:</span>
              <span className="value">{stats.energyRange.max.toFixed(2)} eV</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cached-visualizer {
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .cached-visualizer.loading,
        .cached-visualizer.error {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          color: #666;
        }

        .cached-visualizer.error {
          flex-direction: column;
          gap: 10px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }

        .header h2 {
          margin: 0;
          color: #333;
        }

        .controls {
          display: flex;
          gap: 15px;
        }

        .controls label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .controls input,
        .controls select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .main {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
        }

        .visualization {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          background: #f9f9f9;
        }

        .particle-container {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .particle {
          box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s ease;
        }

        .particle:hover {
          transform: scale(1.5);
          z-index: 10;
        }

        .stats {
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          max-height: 500px;
          overflow-y: auto;
        }

        .stats h3 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 16px;
        }

        .stats h4 {
          margin: 12px 0 8px 0;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-group {
          margin-bottom: 15px;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
          border-bottom: 1px solid #eee;
        }

        .stat span {
          color: #666;
        }

        .stat .value {
          font-weight: bold;
          color: #333;
          font-family: 'Courier New', monospace;
        }

        @media (max-width: 900px) {
          .main {
            grid-template-columns: 1fr;
          }

          .stats {
            max-height: 200px;
          }
        }
      `}</style>
    </div>
  );
}

export default CachedModelVisualizer;
