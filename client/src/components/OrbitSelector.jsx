import React, { useState, useEffect, useRef } from 'react';

/**
 * OrbitSelector Component
 * Allows users to select electron orbital state (n, l, m quantum numbers)
 * Phase 7.1: Atomic model builder orbital selector
 */
function OrbitSelector({ onSelect, onCancel }) {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const modalRef = useRef(null);

  // Handle clicks outside modal to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onCancel();
      }
    };

    // Use capture phase to detect clicks outside
    document.addEventListener('click', handleOutsideClick, true);
    return () => document.removeEventListener('click', handleOutsideClick, true);
  }, [onCancel]);

  // Preset orbital configurations
  const orbitals = [
    {
      name: '1s',
      description: 'Ground state',
      quantum: { n: 1, l: 0, m: 0 },
      color: 'rgb(255, 100, 100)',
      depth: 1,
      responsive: 'Deepest (least responsive)'
    },
    {
      name: '2s',
      description: 'Second shell, spherical',
      quantum: { n: 2, l: 0, m: 0 },
      color: 'rgb(255, 150, 100)',
      depth: 2,
      responsive: 'Medium'
    },
    {
      name: '2p',
      description: 'Second shell, dumbbell',
      quantum: { n: 2, l: 1, m: 0 },
      color: 'rgb(100, 200, 100)',
      depth: 2,
      responsive: 'More responsive (l=1)'
    },
    {
      name: '3s',
      description: 'Third shell, spherical',
      quantum: { n: 3, l: 0, m: 0 },
      color: 'rgb(150, 150, 255)',
      depth: 3,
      responsive: 'Loosely bound'
    },
    {
      name: '3p',
      description: 'Third shell, dumbbell',
      quantum: { n: 3, l: 1, m: 0 },
      color: 'rgb(100, 200, 200)',
      depth: 3,
      responsive: 'Moderately responsive'
    },
    {
      name: '3d',
      description: 'Third shell, complex',
      quantum: { n: 3, l: 2, m: 0 },
      color: 'rgb(255, 200, 100)',
      depth: 3,
      responsive: 'Higher l = more responsive'
    }
  ];

  const handleSelect = (orbital) => {
    setSelectedPreset(orbital.name);
    onSelect(orbital);
  };

  return (
    <div className="orbit-selector-modal-overlay">
      <div className="orbit-selector-modal" ref={modalRef}>
        <div className="orbit-selector-header">
          <h2>Select Electron Orbital</h2>
          <button className="orbit-selector-close" onClick={onCancel}>×</button>
        </div>

        <div className="orbit-selector-help">
          <p>Choose an orbital state for the electron cloud. Higher <code>n</code> = more loosely bound. Higher <code>l</code> = more responsive to waves.</p>
        </div>

        <div className="orbit-selector-grid">
          {orbitals.map((orbital) => (
            <div
              key={orbital.name}
              className={`orbit-preset ${selectedPreset === orbital.name ? 'selected' : ''}`}
              onClick={() => handleSelect(orbital)}
            >
              <div className="orbit-preset-header">
                <span className="orbit-name">{orbital.name}</span>
                <span className="orbit-qn">
                  n={orbital.quantum.n}, l={orbital.quantum.l}, m={orbital.quantum.m}
                </span>
              </div>

              <div className="orbit-preview" style={{ backgroundColor: orbital.color, opacity: 0.3 }}></div>

              <div className="orbit-details">
                <p className="orbit-description">{orbital.description}</p>
                <p className="orbit-responsive">{orbital.responsive}</p>
                <p className="orbit-depth">Depth factor: {(1 / (1 + orbital.depth * orbital.depth)).toFixed(2)}</p>
              </div>

              <button className="orbit-select-btn">
                Select {orbital.name}
              </button>
            </div>
          ))}
        </div>

        <div className="orbit-selector-footer">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default OrbitSelector;
