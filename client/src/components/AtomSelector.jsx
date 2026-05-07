import React, { useState, useEffect } from 'react';
import '../styles/AtomSelector.css';

/**
 * AtomSelector Component
 * Allows users to select which atom to work with (H through Ne)
 * Phase 17.2.0 Foundation Component
 */

const ATOMS = [
  { symbol: 'H', name: 'Hydrogen', number: 1, electronConfig: '1s¹' },
  { symbol: 'He', name: 'Helium', number: 2, electronConfig: '1s²' },
  { symbol: 'Li', name: 'Lithium', number: 3, electronConfig: '[He] 2s¹' },
  { symbol: 'Be', name: 'Beryllium', number: 4, electronConfig: '[He] 2s²' },
  { symbol: 'B', name: 'Boron', number: 5, electronConfig: '[He] 2s² 2p¹' },
  { symbol: 'C', name: 'Carbon', number: 6, electronConfig: '[He] 2s² 2p²' },
  { symbol: 'N', name: 'Nitrogen', number: 7, electronConfig: '[He] 2s² 2p³' },
  { symbol: 'O', name: 'Oxygen', number: 8, electronConfig: '[He] 2s² 2p⁴' },
  { symbol: 'F', name: 'Fluorine', number: 9, electronConfig: '[He] 2s² 2p⁵' },
  { symbol: 'Ne', name: 'Neon', number: 10, electronConfig: '[He] 2s² 2p⁶' },
];

export default function AtomSelector({ selectedAtom, onAtomChange, trainedAtoms = [] }) {
  const [displayMode, setDisplayMode] = useState('grid'); // 'grid' or 'dropdown'
  const [atomStatus, setAtomStatus] = useState({});

  // Fetch training status for all atoms on mount
  useEffect(() => {
    const fetchAtomStatus = async () => {
      try {
        const statuses = {};
        for (const atom of ATOMS) {
          try {
            const response = await fetch(`/api/analysis/${atom.symbol}/status`);
            if (response.ok) {
              const data = await response.json();
              statuses[atom.symbol] = {
                trained: data.trained || trainedAtoms.includes(atom.symbol),
                accuracy: data.accuracy || null,
                lastUpdate: data.lastUpdate || null,
              };
            }
          } catch (err) {
            // Silently fail for individual atoms
            statuses[atom.symbol] = { trained: false, accuracy: null };
          }
        }
        setAtomStatus(statuses);
      } catch (err) {
        console.error('Error fetching atom status:', err);
      }
    };

    fetchAtomStatus();
    const interval = setInterval(fetchAtomStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [trainedAtoms]);

  const getAtomStatusClass = (symbol) => {
    if (atomStatus[symbol]?.trained) {
      return 'atom-trained';
    }
    return 'atom-untrained';
  };

  const getAccuracyDisplay = (symbol) => {
    const status = atomStatus[symbol];
    if (!status?.accuracy) return 'Not trained';
    return `${(status.accuracy * 100).toFixed(1)}%`;
  };

  // Grid Display
  const renderGridView = () => (
    <div className="atom-grid-container">
      <div className="atom-grid">
        {ATOMS.map((atom) => (
          <button
            key={atom.symbol}
            className={`atom-button ${getAtomStatusClass(atom.symbol)} ${
              selectedAtom?.symbol === atom.symbol ? 'selected' : ''
            }`}
            onClick={() => onAtomChange(atom)}
            title={`${atom.name} - ${atom.electronConfig}`}
          >
            <div className="atom-symbol">{atom.symbol}</div>
            <div className="atom-number">{atom.number}</div>
            <div className="atom-status">
              {atomStatus[atom.symbol]?.trained && (
                <span className="status-badge">✓ Trained</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedAtom && (
        <div className="atom-details">
          <h3>{selectedAtom.name}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="label">Atomic Number:</span>
              <span className="value">{selectedAtom.number}</span>
            </div>
            <div className="detail-item">
              <span className="label">Symbol:</span>
              <span className="value">{selectedAtom.symbol}</span>
            </div>
            <div className="detail-item">
              <span className="label">Configuration:</span>
              <span className="value">{selectedAtom.electronConfig}</span>
            </div>
            <div className="detail-item">
              <span className="label">Proxy Accuracy:</span>
              <span className="value">{getAccuracyDisplay(selectedAtom.symbol)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Dropdown Display
  const renderDropdownView = () => (
    <div className="atom-dropdown-container">
      <label htmlFor="atom-dropdown">Select Atom:</label>
      <select
        id="atom-dropdown"
        className="atom-dropdown"
        value={selectedAtom?.symbol || ''}
        onChange={(e) => {
          const atom = ATOMS.find((a) => a.symbol === e.target.value);
          if (atom) onAtomChange(atom);
        }}
      >
        <option value="">-- Choose an atom --</option>
        {ATOMS.map((atom) => (
          <option key={atom.symbol} value={atom.symbol}>
            {atom.symbol} - {atom.name}
            {atomStatus[atom.symbol]?.trained ? ' ✓' : ''}
          </option>
        ))}
      </select>

      {selectedAtom && (
        <div className="atom-info-box">
          <h3>{selectedAtom.name}</h3>
          <div className="info-grid">
            <div>
              <strong>Number:</strong> {selectedAtom.number}
            </div>
            <div>
              <strong>Configuration:</strong> {selectedAtom.electronConfig}
            </div>
            <div>
              <strong>Status:</strong>{' '}
              {atomStatus[selectedAtom.symbol]?.trained
                ? `✓ Trained (${getAccuracyDisplay(selectedAtom.symbol)})`
                : 'Not trained'}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="atom-selector-wrapper">
      <div className="display-mode-toggle">
        <button
          className={`mode-btn ${displayMode === 'grid' ? 'active' : ''}`}
          onClick={() => setDisplayMode('grid')}
        >
          Grid View
        </button>
        <button
          className={`mode-btn ${displayMode === 'dropdown' ? 'active' : ''}`}
          onClick={() => setDisplayMode('dropdown')}
        >
          Dropdown View
        </button>
      </div>

      <div className="atom-selector-content">
        {displayMode === 'grid' ? renderGridView() : renderDropdownView()}
      </div>
    </div>
  );
}
