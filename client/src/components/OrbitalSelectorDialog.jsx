/**
 * OrbitalSelectorDialog.jsx
 * Phase 9.2: Orbital selection modal dialog
 * 
 * Modal dialog that appears after atom placement
 * Allows user to select orbital type with keyboard/mouse
 */

import React, { useState, useEffect, useRef } from 'react';
import { ORBITALS_CONFIG } from '../config/ORBITALS_CONFIG';
import '../styles/OrbitalSelectorDialog.css';

function OrbitalSelectorDialog({ 
  position = [0, 0, 0],
  onSelect,           // (orbital) => void
  onCancel,           // () => void
  defaultOrbital = '1s'
}) {
  const [selectedIndex, setSelectedIndex] = useState(
    ORBITALS_CONFIG.findIndex(o => o.id === defaultOrbital) || 0
  );
  const dialogRef = useRef(null);
  const selectedOrbital = ORBITALS_CONFIG[selectedIndex];

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : ORBITALS_CONFIG.length - 1
        );
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < ORBITALS_CONFIG.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  /**
   * Apply selected orbital
   */
  const handleApply = () => {
    onSelect?.(selectedOrbital);
  };

  /**
   * Cancel selection (revert placement)
   */
  const handleCancel = () => {
    onCancel?.();
  };

  /**
   * Select orbital by clicking
   */
  const handleOrbitalClick = (index) => {
    setSelectedIndex(index);
  };

  /**
   * Immediately apply on double-click
   */
  const handleOrbitalDoubleClick = (index) => {
    setSelectedIndex(index);
    setTimeout(() => onSelect?.(ORBITALS_CONFIG[index]), 50);
  };

  return (
    <div className="orbital-selector-overlay" onClick={handleCancel}>
      <div 
        className="orbital-selector-dialog"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="orbital-selector-header">
          <h2>Select Electron Orbital</h2>
          <p className="orbital-selector-hint">
            Use ↑↓ arrows or click, press Enter to confirm, ESC to cancel
          </p>
        </div>

        {/* Position Display */}
        <div className="orbital-selector-position">
          <span><strong>Position:</strong></span>
          <span className="position-coords">
            ({position[0].toFixed(1)}, {position[1].toFixed(1)}, {position[2].toFixed(1)})
          </span>
        </div>

        {/* Orbital Grid */}
        <div className="orbital-selector-grid">
          {ORBITALS_CONFIG.map((orbital, index) => (
            <div
              key={orbital.id}
              className={`orbital-option ${selectedIndex === index ? 'selected' : ''}`}
              style={{ borderColor: `#${orbital.color.toString(16).padStart(6, '0')}` }}
              onClick={() => handleOrbitalClick(index)}
              onDoubleClick={() => handleOrbitalDoubleClick(index)}
              title={orbital.description}
            >
              {/* Visual indicator */}
              <div
                className="orbital-visual"
                style={{
                  backgroundColor: `#${orbital.color.toString(16).padStart(6, '0')}`,
                  boxShadow: selectedIndex === index 
                    ? `0 0 20px rgba(${(orbital.color >> 16) & 255}, ${(orbital.color >> 8) & 255}, ${orbital.color & 255}, 0.8)`
                    : 'none'
                }}
              >
                <span className="orbital-icon">{orbital.icon}</span>
              </div>

              {/* Label */}
              <div className="orbital-label">
                <div className="orbital-name">{orbital.name}</div>
                <div className="orbital-quantum">
                  n={orbital.quantum.n}, l={orbital.quantum.l}
                </div>
              </div>

              {/* Energy display */}
              <div className="orbital-energy">
                {orbital.energy.toFixed(1)} eV
              </div>

              {/* Selection indicator */}
              {selectedIndex === index && (
                <div className="orbital-checkmark">✓</div>
              )}
            </div>
          ))}
        </div>

        {/* Selected Orbital Preview */}
        {selectedOrbital && (
          <div className="orbital-selector-preview">
            <div className="preview-section">
              <strong>Selected: {selectedOrbital.name}</strong>
              <p className="preview-description">{selectedOrbital.description}</p>
              <div className="preview-properties">
                <div>Principal (n): {selectedOrbital.quantum.n}</div>
                <div>Angular (l): {selectedOrbital.quantum.l}</div>
                <div>Magnetic (m): {selectedOrbital.quantum.m}</div>
                <div>Spin (s): {selectedOrbital.quantum.s}</div>
                <div>Energy: {selectedOrbital.energy.toFixed(2)} eV</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="orbital-selector-actions">
          <button
            className="orbital-btn cancel-btn"
            onClick={handleCancel}
            title="Cancel placement (ESC)"
          >
            Cancel (ESC)
          </button>
          <button
            className="orbital-btn apply-btn"
            onClick={handleApply}
            title="Apply selected orbital (Enter)"
          >
            Apply (Enter)
          </button>
        </div>

        {/* Footer hint */}
        <div className="orbital-selector-footer">
          💡 Tip: Double-click an orbital to apply immediately
        </div>
      </div>
    </div>
  );
}

export default OrbitalSelectorDialog;
