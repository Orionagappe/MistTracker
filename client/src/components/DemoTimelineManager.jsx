import React, { useState } from 'react';
import '../styles/DemoTimelineManager.css';

/**
 * DemoTimelineManager Component
 * Phase 7.2: Interactive demo timeline selector with Phase 5.4 reference
 * 
 * Provides 3 pre-built demo scenarios:
 * 1. Fundamental Resonance (Phase 5.4 Tests #1 + #4)
 * 2. Multi-Element Cascade (Phase 5.4 Tests #6 + #8)
 * 3. Orbital Excitation (Phase 5.4 Test #5)
 */
function DemoTimelineManager({ onLoadDemo }) {
  const [selectedDemo, setSelectedDemo] = useState(null);

  const demos = [
    {
      id: 'resonance',
      name: 'Fundamental Resonance',
      description: 'Hydrogen atom in fundamental resonance with Rydberg frequency',
      phase5_4_tests: ['Test #1: Resonance Detection', 'Test #4: Particle Generation'],
      config: {
        atoms: [
          {
            id: 'h-resonance',
            element: 'H',
            orbital_name: '2p',
            orbital: { n: 2, l: 1, m: 0 },
            position: [0, 0, 0],
            amplitude: 0.5,
            phase: 0
          }
        ],
        emitters: [
          {
            id: 'wave-resonance',
            frequency: 3.29e15,
            amplitude: 0.3,
            position: [0, 0, 0]
          }
        ],
        simulationParams: {
          timeDilation: 1.0,
          fieldStrength: 1.0
        }
      },
      expectedResults: {
        resonanceType: 'Fundamental',
        coupling: '0.57 (57%)',
        particleGeneration: '72% probability',
        displacement: '1.2×10⁻¹³ m',
        emissionFrequency: '3.35×10¹⁵ Hz'
      },
      explanation: 'This demo shows the fundamental resonance detected when a Hydrogen atom\'s 2p orbital is exposed to a wave at the Rydberg frequency (3.29e15 Hz). The coupling percentage indicates how strongly this orbital state couples to the wave, enabling electron displacement and particle generation.'
    },
    {
      id: 'cascade',
      name: 'Multi-Element Cascade',
      description: 'Hydrogen, Helium, and Carbon atoms in resonance cascade',
      phase5_4_tests: ['Test #6: Resonance Modes', 'Test #8: Interaction Metrics', 'Test #7: Wave Propagation'],
      config: {
        atoms: [
          {
            id: 'h-cascade',
            element: 'H',
            orbital_name: '2p',
            orbital: { n: 2, l: 1, m: 0 },
            position: [-80, 0, 0],
            amplitude: 0.5,
            phase: 0
          },
          {
            id: 'he-cascade',
            element: 'He',
            orbital_name: '2p',
            orbital: { n: 2, l: 1, m: 0 },
            position: [0, 0, 0],
            amplitude: 0.5,
            phase: 0
          },
          {
            id: 'c-cascade',
            element: 'C',
            orbital_name: '2p',
            orbital: { n: 2, l: 1, m: 0 },
            position: [80, 0, 0],
            amplitude: 0.5,
            phase: 0
          }
        ],
        emitters: [
          {
            id: 'wave-cascade',
            frequency: 7.2e15,
            amplitude: 1.2,
            position: [-80, 0, 0]
          }
        ],
        simulationParams: {
          timeDilation: 1.0,
          fieldStrength: 1.0
        }
      },
      expectedResults: {
        resonanceType: 'Harmonic (2.0× fundamental)',
        couplingH: '~0.6 (harmonic 2)',
        couplingHe: '~0.55 (Z=2 response)',
        couplingC: '~0.48 (Z=6 response)',
        wavePropagation: 'Inverse-square law',
        qualityFactor: '0.82 (high coherence)',
        totalParticles: '100+ generated'
      },
      explanation: 'This demo demonstrates how different elements respond to resonance waves differently based on their atomic number (Z). The wave propagates through space following an inverse-square law, with intensity decreasing with distance. The quality factor tracks coherence across interactions, showing how well the system maintains resonance.'
    },
    {
      id: 'excitation',
      name: 'Orbital Excitation',
      description: 'Hydrogen atom orbital transition from n=2 to n=3',
      phase5_4_tests: ['Test #5: Orbital Transitions'],
      config: {
        atoms: [
          {
            id: 'h-excitation',
            element: 'H',
            orbital_name: '2p',
            orbital: { n: 2, l: 1, m: 0 },
            position: [0, 0, 0],
            amplitude: 0.5,
            phase: 0
          }
        ],
        emitters: [
          {
            id: 'wave-excitation-1',
            frequency: 3.29e15,
            amplitude: 0.5,
            position: [0, 0, 0]
          }
        ],
        simulationParams: {
          timeDilation: 1.0,
          fieldStrength: 1.0
        }
      },
      expectedResults: {
        initialOrbital: 'n=2, l=1, m=0',
        excitedOrbital: 'n=3, l=1, m=0',
        transitionType: 'Excitation (+1 shell)',
        amplitudeChange: '-50% (post-transition)',
        phaseReset: 'Yes (coherence reset)',
        newResonanceFreq: '~1.23×10¹⁵ Hz'
      },
      explanation: 'When sufficient energy is transferred to an electron, it can jump to a higher orbital shell (n=2→n=3). This transition causes the amplitude to drop by ~50% as the electron becomes more loosely bound and responsive. The phase resets, requiring re-coupling to the wave source at new resonance frequencies.'
    }
  ];

  const handleLoadDemo = (demoId) => {
    const demo = demos.find(d => d.id === demoId);
    if (demo) {
      setSelectedDemo(demoId);
      onLoadDemo?.(demo.config);
    }
  };

  return (
    <div className="demo-timeline-manager">
      <div className="demo-header">
        <h2>📚 Demo Timelines</h2>
        <p>Learn from Phase 5.4 test scenarios</p>
      </div>

      <div className="demo-selector-group">
        {demos.map(demo => (
          <div key={demo.id} className="demo-card">
            <div
              className={`demo-card-header ${selectedDemo === demo.id ? 'selected' : ''}`}
              onClick={() => handleLoadDemo(demo.id)}
            >
              <h3>{demo.name}</h3>
              <p className="demo-description">{demo.description}</p>
            </div>

            {selectedDemo === demo.id && (
              <div className="demo-card-details">
                <div className="demo-section">
                  <h4>Phase 5.4 Reference</h4>
                  <ul className="demo-tests">
                    {demo.phase5_4_tests.map((test, idx) => (
                      <li key={idx}>{test}</li>
                    ))}
                  </ul>
                </div>

                <div className="demo-section">
                  <h4>Expected Results</h4>
                  <div className="demo-results">
                    {Object.entries(demo.expectedResults).map(([key, value]) => (
                      <div key={key} className="result-row">
                        <span className="result-label">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="result-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="demo-section">
                  <h4>What This Demonstrates</h4>
                  <p className="demo-explanation">{demo.explanation}</p>
                </div>

                <div className="demo-actions">
                  <button 
                    className="btn-load-demo"
                    onClick={() => handleLoadDemo(demo.id)}
                  >
                    ✓ Loaded in Builder
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="demo-info">
        <h4>📖 How to Use</h4>
        <ol>
          <li>Click a demo card to view its Phase 5.4 reference and expected results</li>
          <li>Click "✓ Loaded in Builder" to populate the AtomBuilder with this configuration</li>
          <li>Preview the 3D atom positions and wave emitter locations</li>
          <li>Modify parameters as needed or save to run the simulation</li>
          <li>Compare your simulation results with the expected values shown here</li>
        </ol>
      </div>
    </div>
  );
}

export default DemoTimelineManager;
