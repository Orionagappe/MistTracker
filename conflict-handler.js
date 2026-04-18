// conflict-handler.js
// Detects and resolves concurrent mutations using Last-Write-Wins strategy

export class ConflictHandler {
  constructor(conflictResolver) {
    this.conflictResolver = conflictResolver;
    this.pendingMutations = new Map(); // itemId -> array of mutations
    this.conflictTimeWindow = 100; // ms - time window for detecting conflicts
    this.mutationHistory = []; // All mutations for audit
  }

  /**
   * Check if incoming mutation conflicts with existing mutations
   * Returns { hasConflict, resolution } or { hasConflict: false, mutation }
   */
  handleMutation(mutation) {
    const { itemId, userId, action, value, timestamp } = mutation;
    
    // Clean up old mutations outside time window
    this.cleanupOldMutations(itemId, timestamp);
    
    // Get recent mutations for this item
    const recentMutations = this.pendingMutations.get(itemId) || [];
    
    // Record this mutation in history
    this.mutationHistory.push({
      itemId,
      userId,
      action,
      value,
      timestamp,
      processedAt: Date.now()
    });
    
    // Check for conflicts with recent mutations
    let conflictResolution = null;
    let detectedConflicts = [];
    
    for (const recentMutation of recentMutations) {
      // Skip mutations from same user (not a conflict)
      if (recentMutation.userId === userId) continue;
      
      // Check if within conflict window
      const timeDiff = Math.abs(timestamp - recentMutation.timestamp);
      if (timeDiff <= this.conflictTimeWindow) {
        detectedConflicts.push(recentMutation);
      }
    }
    
    // If conflicts detected, resolve them
    if (detectedConflicts.length > 0) {
      // Create change objects for resolver
      // Note: The incoming mutation is being processed NOW (remote perspective)
      // The conflicting mutations are already stored (local perspective)
      const incomingChange = this.conflictResolver.recordChange(
        itemId,
        userId,
        { action, value },
        timestamp
      );
      
      // Resolve against each conflicting mutation
      for (const conflictingMutation of detectedConflicts) {
        const storedChange = this.conflictResolver.recordChange(
          itemId,
          conflictingMutation.userId,
          { action: conflictingMutation.action, value: conflictingMutation.value },
          conflictingMutation.timestamp
        );
        
        // Resolve: stored change is "local", incoming is "remote"
        conflictResolution = this.conflictResolver.resolveConflict(
          storedChange,
          incomingChange
        );
      }
      
      // Add incoming mutation to pending (even though there was conflict)
      recentMutations.push({
        itemId,
        userId,
        action,
        value,
        timestamp,
        processedAt: Date.now()
      });
      this.pendingMutations.set(itemId, recentMutations);
      
      return {
        hasConflict: true,
        conflicts: detectedConflicts.length,
        resolution: conflictResolution,
        mutation,
        conflictingMutations: detectedConflicts
      };
    }
    
    // No conflicts detected - add to pending for future conflict detection
    recentMutations.push({
      itemId,
      userId,
      action,
      value,
      timestamp,
      processedAt: Date.now()
    });
    this.pendingMutations.set(itemId, recentMutations);
    
    return {
      hasConflict: false,
      mutation,
      conflictingMutations: []
    };
  }

  /**
   * Remove mutations outside the conflict time window
   */
  cleanupOldMutations(itemId, currentTimestamp) {
    const recentMutations = this.pendingMutations.get(itemId);
    if (!recentMutations) return;
    
    const filtered = recentMutations.filter(m => {
      const age = currentTimestamp - m.timestamp;
      return age <= this.conflictTimeWindow;
    });
    
    if (filtered.length === 0) {
      this.pendingMutations.delete(itemId);
    } else {
      this.pendingMutations.set(itemId, filtered);
    }
  }

  /**
   * Get conflict history for an item
   */
  getConflictHistory(itemId) {
    return this.conflictResolver.getConflicts(itemId);
  }

  /**
   * Get mutation history for an item
   */
  getMutationHistory(itemId) {
    return this.mutationHistory.filter(m => m.itemId === itemId);
  }

  /**
   * Get total conflicts detected
   */
  getConflictStats() {
    return {
      totalMutations: this.mutationHistory.length,
      totalConflicts: this.conflictResolver.conflictHistory.length,
      pendingItems: this.pendingMutations.size,
      conflictRate: this.conflictResolver.conflictHistory.length / this.mutationHistory.length || 0
    };
  }

  /**
   * Set conflict time window (in milliseconds)
   */
  setConflictTimeWindow(ms) {
    this.conflictTimeWindow = ms;
  }
}
