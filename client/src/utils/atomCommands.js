/**
 * atomCommands.js
 * Phase 9.2: Command pattern for undo/redo
 * 
 * Implements command pattern for atomic operations on atoms/emitters
 * Each command knows how to execute, undo, and redo itself
 */

/**
 * Base Command class
 * All commands inherit from this
 */
export class Command {
  constructor() {
    this.timestamp = Date.now();
  }

  /**
   * Execute the command
   * @returns {void}
   */
  execute() {
    throw new Error('Command.execute() must be implemented');
  }

  /**
   * Undo the command
   * @returns {void}
   */
  undo() {
    throw new Error('Command.undo() must be implemented');
  }

  /**
   * Redo the command (calls execute by default)
   * @returns {void}
   */
  redo() {
    this.execute();
  }

  /**
   * Get command description for UI/logging
   * @returns {string}
   */
  getDescription() {
    return this.constructor.name;
  }

  /**
   * Check if command can be merged with another (for optimization)
   * @param {Command} other
   * @returns {boolean}
   */
  canMergeWith(other) {
    return false;
  }

  /**
   * Merge with another command (must implement canMergeWith)
   * @param {Command} other
   * @returns {void}
   */
  mergeWith(other) {
    throw new Error('Command.mergeWith() must be implemented');
  }
}

/**
 * PlaceAtomCommand - Place a new atom
 */
export class PlaceAtomCommand extends Command {
  constructor(atoms, setAtoms, atom, scene, objectsRef) {
    super();
    this.atoms = atoms;
    this.setAtoms = setAtoms;
    this.atom = atom;
    this.scene = scene;
    this.objectsRef = objectsRef;
    this.mesh = null;
  }

  execute() {
    const atomId = `atom-${this.atoms.length}-${this.timestamp}`;
    this.atom.id = atomId;
    
    // Update state
    this.setAtoms(prev => [...prev, this.atom]);

    // Add visual to scene
    if (this.scene) {
      const THREE = require('three');
      const geometry = new THREE.SphereGeometry(15, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: this.atom.color || 0x44dd88,
        opacity: 0.7,
        transparent: true
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(
        this.atom.position[0], 
        this.atom.position[1], 
        this.atom.position[2]
      );
      this.mesh.userData = { type: 'atom', id: atomId };
      this.scene.add(this.mesh);
      this.objectsRef.current.push(this.mesh);
    }
  }

  undo() {
    // Remove from state
    this.setAtoms(prev => prev.filter(a => a.id !== this.atom.id));

    // Remove from scene
    if (this.scene && this.mesh) {
      this.scene.remove(this.mesh);
      this.objectsRef.current = this.objectsRef.current.filter(
        m => m !== this.mesh
      );
    }
  }

  getDescription() {
    return `Place atom (${this.atom.orbital_name})`;
  }
}

/**
 * DeleteAtomCommand - Delete an atom
 */
export class DeleteAtomCommand extends Command {
  constructor(atoms, setAtoms, atomId, scene, objectsRef) {
    super();
    this.atoms = atoms;
    this.setAtoms = setAtoms;
    this.atomId = atomId;
    this.scene = scene;
    this.objectsRef = objectsRef;
    this.deletedAtom = null;
    this.mesh = null;
  }

  execute() {
    // Store deleted atom for undo
    this.deletedAtom = this.atoms.find(a => a.id === this.atomId);

    // Remove from state
    this.setAtoms(prev => prev.filter(a => a.id !== this.atomId));

    // Remove from scene
    if (this.scene) {
      this.mesh = this.objectsRef.current.find(m => m.userData.id === this.atomId);
      if (this.mesh) {
        this.scene.remove(this.mesh);
        this.objectsRef.current = this.objectsRef.current.filter(m => m !== this.mesh);
      }
    }
  }

  undo() {
    if (!this.deletedAtom) return;

    // Restore to state
    this.setAtoms(prev => [...prev, this.deletedAtom]);

    // Restore to scene
    if (this.scene && this.mesh) {
      this.scene.add(this.mesh);
      this.objectsRef.current.push(this.mesh);
    }
  }

  getDescription() {
    if (this.deletedAtom) {
      return `Delete atom (${this.deletedAtom.orbital_name})`;
    }
    return 'Delete atom';
  }
}

/**
 * MoveAtomCommand - Move/drag an atom
 */
export class MoveAtomCommand extends Command {
  constructor(atoms, setAtoms, atomId, fromPos, toPos) {
    super();
    this.atoms = atoms;
    this.setAtoms = setAtoms;
    this.atomId = atomId;
    this.fromPos = [...fromPos];
    this.toPos = [...toPos];
  }

  execute() {
    // Move atom to new position
    this.setAtoms(prev => prev.map(a => 
      a.id === this.atomId 
        ? { ...a, position: [...this.toPos] }
        : a
    ));
  }

  undo() {
    // Move back to original position
    this.setAtoms(prev => prev.map(a => 
      a.id === this.atomId 
        ? { ...a, position: [...this.fromPos] }
        : a
    ));
  }

  canMergeWith(other) {
    // Can merge consecutive move commands for same atom
    return (
      other instanceof MoveAtomCommand &&
      other.atomId === this.atomId &&
      other.timestamp - this.timestamp < 500 // Within 500ms
    );
  }

  mergeWith(other) {
    // Update toPos to the newer move command's final position
    this.toPos = [...other.toPos];
  }

  getDescription() {
    const dist = Math.sqrt(
      (this.toPos[0] - this.fromPos[0]) ** 2 +
      (this.toPos[1] - this.fromPos[1]) ** 2 +
      (this.toPos[2] - this.fromPos[2]) ** 2
    );
    return `Move atom (${dist.toFixed(1)} units)`;
  }
}

/**
 * ChangeOrbitalCommand - Change atom's orbital type
 */
export class ChangeOrbitalCommand extends Command {
  constructor(atoms, setAtoms, atomId, fromOrbital, toOrbital) {
    super();
    this.atoms = atoms;
    this.setAtoms = setAtoms;
    this.atomId = atomId;
    this.fromOrbital = fromOrbital;
    this.toOrbital = toOrbital;
  }

  execute() {
    this.setAtoms(prev => prev.map(a =>
      a.id === this.atomId
        ? {
            ...a,
            orbital: this.toOrbital.quantum,
            orbital_name: this.toOrbital.name,
            color: this.toOrbital.color
          }
        : a
    ));
  }

  undo() {
    this.setAtoms(prev => prev.map(a =>
      a.id === this.atomId
        ? {
            ...a,
            orbital: this.fromOrbital.quantum,
            orbital_name: this.fromOrbital.name,
            color: this.fromOrbital.color
          }
        : a
    ));
  }

  getDescription() {
    return `Change orbital: ${this.fromOrbital.name} → ${this.toOrbital.name}`;
  }
}

/**
 * PlaceEmitterCommand - Place a wave emitter
 */
export class PlaceEmitterCommand extends Command {
  constructor(emitters, setEmitters, emitter, scene, objectsRef) {
    super();
    this.emitters = emitters;
    this.setEmitters = setEmitters;
    this.emitter = emitter;
    this.scene = scene;
    this.objectsRef = objectsRef;
    this.mesh = null;
  }

  execute() {
    const emitterId = `emitter-${this.emitters.length}-${this.timestamp}`;
    this.emitter.id = emitterId;

    // Update state
    this.setEmitters(prev => [...prev, this.emitter]);

    // Add visual to scene
    if (this.scene) {
      const THREE = require('three');
      const geometry = new THREE.BoxGeometry(10, 10, 10);
      const material = new THREE.MeshPhongMaterial({
        color: 0xffaa00,
        emissive: 0xff6600,
        transparent: true,
        opacity: 0.8
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(
        this.emitter.position[0],
        this.emitter.position[1],
        this.emitter.position[2]
      );
      this.mesh.userData = { type: 'emitter', id: emitterId };
      this.scene.add(this.mesh);
      this.objectsRef.current.push(this.mesh);
    }
  }

  undo() {
    this.setEmitters(prev => prev.filter(e => e.id !== this.emitter.id));

    if (this.scene && this.mesh) {
      this.scene.remove(this.mesh);
      this.objectsRef.current = this.objectsRef.current.filter(m => m !== this.mesh);
    }
  }

  getDescription() {
    return `Place emitter (${(this.emitter.frequency / 1e15).toFixed(2)} PHz)`;
  }
}

/**
 * CommandHistory - Manages command history for undo/redo
 */
export class CommandHistory {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.past = [];
    this.future = [];
  }

  /**
   * Execute a command and add to history
   */
  execute(command) {
    command.execute();
    
    // Try to merge with last command
    if (this.past.length > 0 && command.canMergeWith) {
      const lastCommand = this.past[this.past.length - 1];
      if (command.canMergeWith(lastCommand)) {
        lastCommand.mergeWith(command);
        return;
      }
    }

    this.past.push(command);
    this.future = []; // Clear future when new command

    // Limit history size
    if (this.past.length > this.maxSize) {
      this.past.shift();
    }
  }

  /**
   * Undo last command
   */
  undo() {
    if (this.past.length === 0) return false;

    const command = this.past.pop();
    command.undo();
    this.future.unshift(command);
    return true;
  }

  /**
   * Redo last undone command
   */
  redo() {
    if (this.future.length === 0) return false;

    const command = this.future.shift();
    command.execute(); // Use execute instead of redo for consistency
    this.past.push(command);
    return true;
  }

  /**
   * Clear history
   */
  clear() {
    this.past = [];
    this.future = [];
  }

  /**
   * Get history state for UI
   */
  getState() {
    return {
      canUndo: this.past.length > 0,
      canRedo: this.future.length > 0,
      undoDescription: this.past.length > 0 
        ? this.past[this.past.length - 1].getDescription() 
        : 'Nothing to undo',
      redoDescription: this.future.length > 0 
        ? this.future[0].getDescription() 
        : 'Nothing to redo'
    };
  }

  /**
   * Get history stack for debugging
   */
  getHistory() {
    return {
      past: this.past.map(c => c.getDescription()),
      future: this.future.map(c => c.getDescription())
    };
  }

  /**
   * Get size of history (number of commands)
   */
  getSize() {
    return this.past.length + this.future.length;
  }
}

/**
 * BulkOrbitalChangeCommand - Change orbital for multiple atoms
 * Phase 9.3: Multi-select bulk operations
 */
export class BulkOrbitalChangeCommand extends Command {
  constructor(atoms, setAtoms, atomIds, fromOrbital, toOrbital) {
    super();
    this.atoms = atoms;
    this.setAtoms = setAtoms;
    this.atomIds = atomIds;
    this.fromOrbital = fromOrbital;
    this.toOrbital = toOrbital;
  }

  execute() {
    this.setAtoms(prev => prev.map(atom =>
      this.atomIds.includes(atom.id)
        ? {
            ...atom,
            orbital: this.toOrbital.quantum,
            orbital_name: this.toOrbital.name,
            color: this.toOrbital.color
          }
        : atom
    ));
  }

  undo() {
    this.setAtoms(prev => prev.map(atom =>
      this.atomIds.includes(atom.id)
        ? {
            ...atom,
            orbital: this.fromOrbital.quantum,
            orbital_name: this.fromOrbital.name,
            color: this.fromOrbital.color
          }
        : atom
    ));
  }

  getDescription() {
    return `Change ${this.atomIds.length} atoms: ${this.fromOrbital.name} → ${this.toOrbital.name}`;
  }
}

/**
 * BulkDeleteCommand - Delete multiple atoms/emitters
 * Phase 9.3: Multi-select bulk delete
 */
export class BulkDeleteCommand extends Command {
  constructor(atoms, emitters, setAtoms, setEmitters, itemIds, scene, objectsRef) {
    super();
    this.atoms = atoms;
    this.emitters = emitters;
    this.setAtoms = setAtoms;
    this.setEmitters = setEmitters;
    this.itemIds = itemIds;
    this.scene = scene;
    this.objectsRef = objectsRef;
    this.deletedAtoms = [];
    this.deletedEmitters = [];
    this.deletedMeshes = [];
  }

  execute() {
    // Store deleted items for undo
    this.deletedAtoms = this.atoms.filter(a => this.itemIds.includes(a.id));
    this.deletedEmitters = this.emitters.filter(e => this.itemIds.includes(e.id));

    // Remove from state
    this.setAtoms(prev => prev.filter(a => !this.itemIds.includes(a.id)));
    this.setEmitters(prev => prev.filter(e => !this.itemIds.includes(e.id)));

    // Remove from scene
    if (this.scene) {
      this.deletedMeshes = this.objectsRef.current.filter(
        m => this.itemIds.includes(m.userData?.id)
      );
      this.deletedMeshes.forEach(mesh => this.scene.remove(mesh));
      this.objectsRef.current = this.objectsRef.current.filter(
        m => !this.itemIds.includes(m.userData?.id)
      );
    }
  }

  undo() {
    // Restore atoms
    if (this.deletedAtoms.length > 0) {
      this.setAtoms(prev => [...prev, ...this.deletedAtoms]);
    }

    // Restore emitters
    if (this.deletedEmitters.length > 0) {
      this.setEmitters(prev => [...prev, ...this.deletedEmitters]);
    }

    // Restore to scene
    if (this.scene) {
      this.deletedMeshes.forEach(mesh => {
        this.scene.add(mesh);
        this.objectsRef.current.push(mesh);
      });
    }
  }

  getDescription() {
    const atomCount = this.deletedAtoms.length;
    const emitterCount = this.deletedEmitters.length;
    const items = [];
    if (atomCount > 0) items.push(`${atomCount} atom${atomCount !== 1 ? 's' : ''}`);
    if (emitterCount > 0) items.push(`${emitterCount} emitter${emitterCount !== 1 ? 's' : ''}`);
    return `Delete ${items.join(' & ')}`;
  }
}

/**
 * BulkMoveCommand - Move multiple atoms together (relative offset)
 * Phase 9.3: Multi-select transform operations
 */
export class BulkMoveCommand extends Command {
  constructor(atoms, setAtoms, atomIds, offsetX, offsetY, offsetZ) {
    super();
    this.atoms = atoms;
    this.setAtoms = setAtoms;
    this.atomIds = atomIds;
    this.offset = [offsetX, offsetY, offsetZ];
  }

  execute() {
    this.setAtoms(prev => prev.map(atom =>
      this.atomIds.includes(atom.id)
        ? {
            ...atom,
            position: [
              atom.position[0] + this.offset[0],
              atom.position[1] + this.offset[1],
              atom.position[2] + this.offset[2]
            ]
          }
        : atom
    ));
  }

  undo() {
    this.setAtoms(prev => prev.map(atom =>
      this.atomIds.includes(atom.id)
        ? {
            ...atom,
            position: [
              atom.position[0] - this.offset[0],
              atom.position[1] - this.offset[1],
              atom.position[2] - this.offset[2]
            ]
          }
        : atom
    ));
  }

  getDescription() {
    const dist = Math.sqrt(
      this.offset[0] ** 2 + this.offset[1] ** 2 + this.offset[2] ** 2
    );
    return `Move ${this.atomIds.length} atoms (${dist.toFixed(1)} units)`;
  }
}

export default { 
  Command,
  PlaceAtomCommand,
  DeleteAtomCommand,
  MoveAtomCommand,
  ChangeOrbitalCommand,
  PlaceEmitterCommand,
  BulkOrbitalChangeCommand,
  BulkDeleteCommand,
  BulkMoveCommand,
  CommandHistory
};
