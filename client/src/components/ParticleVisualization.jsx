/**
 * ParticleVisualization.jsx - Phase 5.6: Particle Display Component
 * 
 * React wrapper for particle visualization, providing:
 * - Lifecycle management
 * - Statistics display
 * - Debug information overlay
 * - Integration with PhysicsVisualization
 */

import React, { useState, useEffect } from 'react';

const ParticleVisualization = ({ 
  particleVisualizer, 
  showDebug = false,
  showStats = true 
}) => {
  const [stats, setStats] = useState({
    activeParticles: 0,
    totalParticlesCreated: 0,
    maxConcurrent: 0,
    averageEnergy: 0,
    creationRate: 0
  });

  const [particleInfo, setParticleInfo] = useState([]);

  // Update statistics every frame
  useEffect(() => {
    const interval = setInterval(() => {
      if (particleVisualizer) {
        const currentStats = particleVisualizer.getStatistics();
        setStats(currentStats);

        if (showDebug) {
          setParticleInfo(particleVisualizer.getParticleInfo());
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [particleVisualizer, showDebug]);

  if (!particleVisualizer) {
    return null;
  }

  return (
    <div className="particle-visualization-container">
      {showStats && (
        <div className="particle-stats-overlay" style={{
          position: 'fixed',
          top: '320px',
          right: '20px',
          backgroundColor: 'rgba(20, 20, 40, 0.85)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#00ff00',
          border: '1px solid #00ff00',
          maxWidth: '250px',
          zIndex: 100,
          textShadow: '0 0 5px rgba(0,255,0,0.5)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ff99' }}>
            ✨ PARTICLES
          </div>
          <div style={{ lineHeight: '1.6' }}>
            <div>Active: {stats.activeParticles}</div>
            <div>Created: {stats.totalParticlesCreated}</div>
            <div>Max Concurrent: {stats.maxConcurrent}</div>
            <div>Rate: {stats.creationRate}/s</div>
            <div>
              Avg Energy: {typeof stats.averageEnergy === 'number' 
                ? stats.averageEnergy.toFixed(2) 
                : '0.00'} eV
            </div>
          </div>
        </div>
      )}

      {showDebug && particleInfo.length > 0 && (
        <div className="particle-debug-overlay" style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(20, 20, 40, 0.9)',
          borderRadius: '4px',
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#00ff00',
          border: '1px solid #00ff00',
          maxWidth: '400px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 100
        }}>
          <div style={{ marginBottom: '4px', color: '#00ff99', fontWeight: 'bold' }}>
            Particle Debug Info
          </div>
          {particleInfo.slice(0, 5).map((info, idx) => (
            <div key={idx} style={{ 
              borderBottom: '1px solid rgba(0,255,0,0.2)',
              paddingBottom: '4px',
              marginBottom: '4px'
            }}>
              <div>ID: {info.id}</div>
              <div>Freq: {info.frequency} Hz</div>
              <div>Energy: {info.energy} eV</div>
              <div>Probability: {info.probability}</div>
              <div>Traveled: {info.traveled} m</div>
              <div>Age: {info.age} ms / {info.lifetime} ms</div>
            </div>
          ))}
          {particleInfo.length > 5 && (
            <div style={{ color: '#ff9900' }}>
              ... +{particleInfo.length - 5} more particles
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticleVisualization;
