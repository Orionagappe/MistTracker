/**
 * defaultTimelineGenerator.js - Phase 6.2: Default Test Timeline Generation
 * 
 * Generates procedural test timelines for MistTracker physics simulation.
 * Creates atoms, molecules, and wave emitters with pre-configured parameters
 * for consistent testing and demonstration.
 * 
 * Features:
 * - Generate random atoms from periodic table
 * - Generate known molecules (H2, H2O, CO2)
 * - Create resonance scenarios with wave emitters
 * - Pre-configured demo timeline (seeds)
 * - Export as JSON for fixtures
 */

import { AtomTypeSystem } from './AtomTypeSystem.js';

/**
 * Default Timeline Generator
 */
export class DefaultTimelineGenerator {
  constructor() {
    // Element list for random generation
    this.elementList = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'];
    
    // Molecule templates
    this.moleculeTemplates = {
      'H2': {
        atoms: [
          { element: 'H', position: [-0.74, 0, 0] },
          { element: 'H', position: [0.74, 0, 0] }
        ],
        bondLength: 1.48
      },
      'H2O': {
        atoms: [
          { element: 'O', position: [0, 0, 0] },
          { element: 'H', position: [0.96, 0, 0] },
          { element: 'H', position: [-0.24, 0.93, 0] }
        ],
        bondAngles: [104.5]
      },
      'CO2': {
        atoms: [
          { element: 'C', position: [0, 0, 0] },
          { element: 'O', position: [-1.16, 0, 0] },
          { element: 'O', position: [1.16, 0, 0] }
        ],
        linear: true
      },
      'NH3': {
        atoms: [
          { element: 'N', position: [0, 0, 0] },
          { element: 'H', position: [0.87, 0, 0] },
          { element: 'H', position: [-0.43, 0.75, 0] },
          { element: 'H', position: [-0.43, -0.75, 0] }
        ]
      },
      'CH4': {
        atoms: [
          { element: 'C', position: [0, 0, 0] },
          { element: 'H', position: [0.63, 0.63, 0.63] },
          { element: 'H', position: [-0.63, -0.63, 0.63] },
          { element: 'H', position: [-0.63, 0.63, -0.63] },
          { element: 'H', position: [0.63, -0.63, -0.63] }
        ]
      }
    };
  }

  /**
   * Generate random position in 3D space
   * @param {number} sceneWidth - Width of scene
   * @param {number} sceneHeight - Height of scene
   * @param {number} sceneDepth - Depth of scene
   * @returns {Array} [x, y, z] position
   */
  randomPosition(sceneWidth = 100, sceneHeight = 100, sceneDepth = 100) {
    return [
      (Math.random() - 0.5) * sceneWidth,
      (Math.random() - 0.5) * sceneHeight,
      (Math.random() - 0.5) * sceneDepth
    ];
  }

  /**
   * Generate random element name
   * @returns {string} Element symbol (H, He, Li, etc.)
   */
  randomElement() {
    return this.elementList[Math.floor(Math.random() * this.elementList.length)];
  }

  /**
   * Create single atom timeline item
   * @param {string} element - Element symbol
   * @param {Array} position - [x, y, z] position
   * @param {number} index - Item index for ID generation
   * @returns {Object} Timeline item
   */
  createAtomItem(element = 'H', position = [0, 0, 0], index = 0) {
    const atomConfig = AtomTypeSystem.getObjectPhysicsConfiguration(element);
    if (!atomConfig) {
      console.warn(`Unknown element: ${element}`);
      return null;
    }

    return {
      id: `atom-${element}-${index}`,
      type: 'atom',
      value: `${element} Atom ${index}`,
      category: element,
      metadata: {
        atomicNumber: atomConfig.atomicNumber,
        elementName: atomConfig.elementName,
        electronConfiguration: atomConfig.electronConfiguration,
        position: position,
        initialState: 'ground'
      },
      timestamp: Date.now() + index * 100
    };
  }

  /**
   * Create molecule timeline item
   * @param {string} moleculeName - Molecule name (H2, H2O, CO2, etc.)
   * @param {Array} position - Center position [x, y, z]
   * @param {number} index - Item index
   * @returns {Object} Timeline item
   */
  createMoleculeItem(moleculeName = 'H2O', position = [0, 0, 0], index = 0) {
    const template = this.moleculeTemplates[moleculeName];
    if (!template) {
      console.warn(`Unknown molecule: ${moleculeName}`);
      return null;
    }

    const atoms = template.atoms.map((atom, i) => ({
      element: atom.element,
      position: [
        position[0] + atom.position[0],
        position[1] + atom.position[1],
        position[2] + atom.position[2]
      ],
      index: i
    }));

    return {
      id: `molecule-${moleculeName}-${index}`,
      type: 'molecule',
      value: `${moleculeName} ${index}`,
      category: moleculeName,
      metadata: {
        moleculeName: moleculeName,
        atoms: atoms,
        position: position,
        initialState: 'ground'
      },
      timestamp: Date.now() + index * 100
    };
  }

  /**
   * Create wave emitter item
   * @param {string} type - Emitter type (light, gravity, quantum)
   * @param {Array} position - [x, y, z] position
   * @param {number} frequency - Frequency in Hz
   * @param {number} amplitude - Wave amplitude
   * @param {number} index - Item index
   * @returns {Object} Timeline item
   */
  createEmitterItem(type = 'light', position = [0, 0, 0], frequency = 5000, amplitude = 1.0, index = 0) {
    return {
      id: `emitter-${type}-${index}`,
      type: 'emitter',
      value: `${type.charAt(0).toUpperCase() + type.slice(1)} Emitter`,
      category: 'emitter',
      metadata: {
        emitterType: type,
        frequency: frequency,
        amplitude: amplitude,
        intensity: amplitude * 0.8,
        position: position,
        active: true
      },
      timestamp: Date.now() + index * 100
    };
  }

  /**
   * Generate N random atoms
   * @param {number} count - Number of atoms to generate
   * @param {Array} sceneSize - [width, height, depth]
   * @returns {Array} Array of atom timeline items
   */
  generateAtomItems(count = 5, sceneSize = [200, 200, 200]) {
    const atoms = [];
    for (let i = 0; i < count; i++) {
      const element = this.randomElement();
      const position = this.randomPosition(...sceneSize);
      const atom = this.createAtomItem(element, position, i);
      if (atom) atoms.push(atom);
    }
    return atoms;
  }

  /**
   * Generate N random molecules
   * @param {number} count - Number of molecules
   * @param {Array} sceneSize - [width, height, depth]
   * @returns {Array} Array of molecule timeline items
   */
  generateMoleculeItems(count = 2, sceneSize = [200, 200, 200]) {
    const molecules = [];
    const moleculeNames = Object.keys(this.moleculeTemplates);
    
    for (let i = 0; i < count; i++) {
      const molName = moleculeNames[i % moleculeNames.length];
      const position = this.randomPosition(...sceneSize);
      const molecule = this.createMoleculeItem(molName, position, i);
      if (molecule) molecules.push(molecule);
    }
    return molecules;
  }

  /**
   * Generate random wave emitters with interaction targets
   * @param {number} count - Number of emitters
   * @param {Array} targetItems - Timeline items to potentially target
   * @param {Array} sceneSize - [width, height, depth]
   * @returns {Array} Array of emitter timeline items
   */
  generateEmitterItems(count = 2, targetItems = [], sceneSize = [200, 200, 200]) {
    const emitters = [];
    const emitterTypes = ['light', 'gravity', 'quantum'];
    
    for (let i = 0; i < count; i++) {
      const type = emitterTypes[i % emitterTypes.length];
      const frequency = 5000 + Math.random() * 10000; // 5-15 kHz
      const amplitude = 0.5 + Math.random() * 1.5; // 0.5-2.0
      const position = this.randomPosition(...sceneSize);
      
      const emitter = this.createEmitterItem(type, position, frequency, amplitude, i);
      if (emitter) emitters.push(emitter);
    }
    return emitters;
  }

  /**
   * Create procedural timeline with random composition
   * @param {Object} config - Configuration object
   * @returns {Object} Complete timeline object
   */
  createProceduralTimeline(config = {}) {
    const {
      atomCount = 3,
      moleculeCount = 1,
      emitterCount = 2,
      sceneWidth = 200,
      sceneHeight = 200,
      sceneDepth = 200
    } = config;

    const sceneSize = [sceneWidth, sceneHeight, sceneDepth];
    
    const items = [
      ...this.generateAtomItems(atomCount, sceneSize),
      ...this.generateMoleculeItems(moleculeCount, sceneSize),
      ...this.generateEmitterItems(emitterCount, [], sceneSize)
    ];

    return {
      id: `timeline-${Date.now()}`,
      name: 'Procedural Test Timeline',
      description: `Auto-generated timeline with ${atomCount} atoms, ${moleculeCount} molecules, ${emitterCount} emitters`,
      createdAt: Date.now(),
      lastModified: Date.now(),
      sceneSize: {
        width: sceneWidth,
        height: sceneHeight,
        depth: sceneDepth
      },
      items: items,
      physics: {
        gravity: 0.1,
        damping: 0.95,
        coupling: true,
        timeStep: 0.016
      }
    };
  }

  /**
   * Create pre-configured demo timeline (optimized for particle generation demo)
   * 3 Hydrogen atoms + 1 Helium + 1 Carbon + 2 wave emitters tuned for resonance
   * @returns {Object} Demo timeline
   */
  seedWithDefaults() {
    const items = [
      // Hydrogen atoms (good for testing basic orbital physics)
      this.createAtomItem('H', [-30, 0, 0], 1),
      this.createAtomItem('H', [30, 0, 0], 2),
      this.createAtomItem('H', [0, -30, 0], 3),
      
      // Helium (tests multi-electron systems)
      this.createAtomItem('He', [0, 30, 0], 4),
      
      // Carbon (tests more complex orbitals)
      this.createAtomItem('C', [0, 0, 40], 5),
      
      // Wave emitter 1: Low frequency, targets middle atoms
      this.createEmitterItem('light', [-15, 15, 0], 6000, 1.2, 1),
      
      // Wave emitter 2: Higher frequency, targets right atoms
      this.createEmitterItem('quantum', [15, -15, 0], 8000, 1.0, 2)
    ];

    return {
      id: 'timeline-demo-default',
      name: 'Demo: Quantum Physics Showcase',
      description: 'Pre-configured timeline demonstrating atom-wave interactions, particle generation, and multi-electron systems',
      createdAt: Date.now(),
      lastModified: Date.now(),
      sceneSize: {
        width: 200,
        height: 200,
        depth: 200
      },
      items: items,
      physics: {
        gravity: 0.0,         // No gravity for physics purity
        damping: 0.95,        // Slight damping to stabilize
        coupling: true,       // Enable 3D-4D coupling
        timeStep: 0.016,      // 60fps
        tensorIntensity: 0.8  // Good for visualization
      },
      metadata: {
        purpose: 'demonstration',
        expectedBehavior: 'Particles should spawn at high-coupling sites, orbital clouds should deform with wave presence',
        validationPoints: [
          'H1 and H2 emit resonant waves (~6-8 kHz)',
          'Wave reaches H3 and He atoms after ~500ms',
          'C atom shows multi-electron response',
          'Particles visible as glowing spheres at resonance sites'
        ]
      }
    };
  }

  /**
   * Export timeline to JSON string (for fixtures)
   * @param {Object} timeline - Timeline object
   * @returns {string} JSON string
   */
  exportAsJSON(timeline) {
    return JSON.stringify(timeline, null, 2);
  }

  /**
   * Create fixture file (string ready for file save)
   * @param {Object} timeline - Timeline object
   * @param {string} name - Filename without extension
   * @returns {Object} {filename, content}
   */
  createFixture(timeline, name = 'timeline') {
    const filename = `${name}.timeline.json`;
    const content = this.exportAsJSON(timeline);
    return { filename, content };
  }
}

/**
 * Singleton instance
 */
const defaultTimelineGenerator = new DefaultTimelineGenerator();

/**
 * Export convenience methods
 */
export function createDefaultTimeline(config = {}) {
  return defaultTimelineGenerator.createProceduralTimeline(config);
}

export function seedDefaultTimeline() {
  return defaultTimelineGenerator.seedWithDefaults();
}

export function generateRandomTimeline(atomCount = 5, moleculeCount = 2, emitterCount = 2) {
  return defaultTimelineGenerator.createProceduralTimeline({
    atomCount,
    moleculeCount,
    emitterCount
  });
}

export { DefaultTimelineGenerator, defaultTimelineGenerator };
