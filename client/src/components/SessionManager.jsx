/**
 * SessionManager Component
 * Phase 14: Displays available simulation sessions and session controls
 * 
 * Shows:
 * - List of prior simulations for this timeline
 * - Resume, new, delete options
 * - Session metadata (created, modified, config summary)
 */

import { useState, useEffect } from 'react';
import {
  getSessionsForTimeline,
  loadSession,
  deleteSession,
  setCurrentSession,
  generateSessionId,
  SimulationSession,
  saveSession
} from '../utils/simulationSessionManager';

function SessionManager({ timelineId, onNewSession, onResumeSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
  }, [timelineId]);

  const loadSessions = () => {
    try {
      setLoading(true);
      const sessionIds = getSessionsForTimeline(timelineId);
      const loadedSessions = sessionIds
        .map(id => loadSession(id))
        .filter(s => s !== null)
        .sort((a, b) => new Date(b.metadata.lastModified) - new Date(a.metadata.lastModified));
      
      setSessions(loadedSessions);
      setError(null);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = () => {
    const newSession = new SimulationSession(generateSessionId(), timelineId);
    saveSession(newSession);
    setCurrentSession(timelineId, newSession.sessionId);
    onNewSession(newSession);
  };

  const handleResumeSession = (session) => {
    setCurrentSession(timelineId, session.sessionId);
    onResumeSession(session);
  };

  const handleDeleteSession = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this simulation session? This cannot be undone.')) {
      deleteSession(sessionId, timelineId);
      loadSessions(); // Refresh list
    }
  };

  const getConfigSummary = (config) => {
    const atomCount = config.atoms?.length || 0;
    const emitterCount = config.emitters?.length || 0;
    return `${atomCount} atoms, ${emitterCount} emitters`;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="session-manager loading">Loading sessions...</div>;
  }

  return (
    <div className="session-manager">
      <div className="session-manager-header">
        <h3>Simulation Sessions</h3>
        <button 
          className="btn-new-session btn-primary"
          onClick={handleNewSession}
          title="Create new simulation session"
        >
          + New Simulation
        </button>
      </div>

      {error && (
        <div className="session-error">{error}</div>
      )}

      {sessions.length === 0 ? (
        <div className="sessions-empty">
          <p>No previous simulations found.</p>
          <p>Click "New Simulation" to get started.</p>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map((session) => (
            <div key={session.sessionId} className="session-item">
              <div className="session-info">
                <div className="session-header">
                  <span className="session-id" title={session.sessionId}>
                    Session: {session.sessionId.substring(0, 8)}...
                  </span>
                  <span className="session-config">
                    {getConfigSummary(session.config)}
                  </span>
                </div>
                <div className="session-dates">
                  <span className="created">Created: {formatDate(session.createdAt)}</span>
                  <span className="modified">Modified: {formatDate(session.metadata.lastModified)}</span>
                </div>
                {session.metadata.description && (
                  <div className="session-description">{session.metadata.description}</div>
                )}
              </div>
              <div className="session-actions">
                <button
                  className="btn-resume btn-secondary"
                  onClick={() => handleResumeSession(session)}
                  title="Resume this simulation"
                >
                  Resume
                </button>
                <button
                  className="btn-delete btn-danger"
                  onClick={() => handleDeleteSession(session.sessionId)}
                  title="Delete this simulation session"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SessionManager;
