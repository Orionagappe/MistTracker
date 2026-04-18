// ConflictResolver.js
// Handles concurrent edit conflicts with vector clocks and Last-Write-Wins strategy

export class ConflictResolver {
  constructor() {
    this.vectorClocks = new Map(); // userId -> lamportClock
    this.globalLamportClock = 0; // Global clock for all changes
    this.changeLog = [];
    this.conflictHistory = [];
  }

  // Record a change with metadata
  recordChange(itemId, userId, value, timestamp = Date.now()) {
    this.globalLamportClock++;
    const change = {
      id: `${itemId}-${timestamp}-${userId}`,
      itemId,
      userId,
      value,
      timestamp,
      lamportClock: this.globalLamportClock,
      vectorClock: this.createVectorClock(userId)
    };
    this.changeLog.push(change);
    return change;
  }

  // Resolve conflict using Last-Write-Wins strategy
  resolveConflict(localChange, remoteChange) {
    const conflict = {
      itemId: localChange.itemId,
      localChange,
      remoteChange,
      detectedAt: Date.now(),
      resolution: null
    };

    // Compare timestamps
    if (remoteChange.timestamp > localChange.timestamp) {
      conflict.resolution = {
        winner: 'remote',
        change: remoteChange,
        reason: 'remote-has-later-timestamp'
      };
    } else if (localChange.timestamp > remoteChange.timestamp) {
      conflict.resolution = {
        winner: 'local',
        change: localChange,
        reason: 'local-has-later-timestamp'
      };
    } else {
      // Timestamps equal: use user ID as tie-breaker
      if (remoteChange.userId > localChange.userId) {
        conflict.resolution = {
          winner: 'remote',
          change: remoteChange,
          reason: 'tie-breaker-remote-user-id-higher'
        };
      } else {
        conflict.resolution = {
          winner: 'local',
          change: localChange,
          reason: 'tie-breaker-local-user-id-higher'
        };
      }
    }

    this.conflictHistory.push(conflict);
    return conflict.resolution;
  }

  // Create vector clock for causal ordering
  createVectorClock(userId) {
    const clock = new Map(this.vectorClocks);
    const current = clock.get(userId) || 0;
    clock.set(userId, current + 1);
    this.vectorClocks.set(userId, current + 1);
    return Object.fromEntries(clock);
  }

  // Increment Lamport clock for userId
  incrementLamportClock(userId) {
    const current = this.vectorClocks.get(userId) || 0;
    const next = current + 1;
    this.vectorClocks.set(userId, next);
    return next;
  }

  // Get audit trail for an item
  getItemHistory(itemId) {
    return this.changeLog
      .filter(c => c.itemId === itemId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // Get conflicts for an item
  getConflicts(itemId) {
    return this.conflictHistory.filter(c => c.itemId === itemId);
  }

  // Check if two changes causally depend on each other
  hasCausalDependency(change1, change2) {
    const vc1 = change1.vectorClock;
    const vc2 = change2.vectorClock;
    
    // vc1 < vc2 if all entries in vc1 <= vc2 and at least one <
    let hasLess = false;
    for (const [user, clock] of Object.entries(vc1)) {
      if (clock > (vc2[user] || 0)) return false;
      if (clock < (vc2[user] || 0)) hasLess = true;
    }
    
    return hasLess;
  }

  // Merge strategy: take changes in causal order, then conflict-resolve concurrent ones
  mergeChanges(changes) {
    if (changes.length === 0) return [];
    if (changes.length === 1) return changes;

    const sorted = [];
    const remaining = [...changes];

    while (remaining.length > 0) {
      let foundCausal = false;

      for (let i = 0; i < remaining.length; i++) {
        const current = remaining[i];
        const hasAllDependencies = sorted.every(
          prev => !this.hasCausalDependency(prev, current)
        );

        if (hasAllDependencies) {
          sorted.push(current);
          remaining.splice(i, 1);
          foundCausal = true;
          break;
        }
      }

      if (!foundCausal) {
        // Handle concurrent changes
        const concurrent = remaining[0];
        sorted.push(concurrent);
        remaining.splice(0, 1);
      }
    }

    return sorted;
  }

  // Clear old entries (keep last 10000)
  cleanup() {
    if (this.changeLog.length > 10000) {
      this.changeLog = this.changeLog.slice(-10000);
    }
    if (this.conflictHistory.length > 1000) {
      this.conflictHistory = this.conflictHistory.slice(-1000);
    }
  }
}

export default ConflictResolver;
