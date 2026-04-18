import { useState, useEffect } from 'react';
import { timelineAPI, categoryAPI, itemAPI, analysisAPI } from '../api';
import TimelinesView from '../components/TimelinesView';
import TimelineDetail from '../components/TimelineDetail';
import { getCurrentSession, getSessionsForTimeline } from '../utils/simulationSessionManager';
import '../styles/DashboardPage.css';

function DashboardPage({ user, onLogout, ws }) {
  const [timelines, setTimelines] = useState([]);
  const [selectedTimeline, setSelectedTimelineState] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [currentSession, setCurrentSessionState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTimelineValue, setNewTimelineValue] = useState('');

  /**
   * Phase 14: Restore selected timeline and current session from localStorage on mount
   */
  useEffect(() => {
    const savedTimelineId = localStorage.getItem('selectedTimelineId');
    const savedTimelineName = localStorage.getItem('selectedTimelineName');
    
    if (savedTimelineId && savedTimelineName) {
      // Restore timeline
      const timeline = { id: savedTimelineId, name: savedTimelineName };
      setSelectedTimelineState(timeline);
      
      // Load available sessions for this timeline
      const sessions = getSessionsForTimeline(savedTimelineId);
      setAvailableSessions(sessions);
      
      // Check if we have a current session to resume
      const resumableSession = getCurrentSession(savedTimelineId);
      if (resumableSession) {
        setCurrentSessionState(resumableSession);
      }
    }
  }, []);

  /**
   * Phase 14: Wrapper around setSelectedTimeline that persists to localStorage
   * and loads available sessions
   */
  const setSelectedTimeline = (timeline) => {
    if (timeline) {
      localStorage.setItem('selectedTimelineId', timeline.id);
      localStorage.setItem('selectedTimelineName', timeline.name);
      
      // Load sessions for this timeline
      const sessions = getSessionsForTimeline(timeline.id);
      setAvailableSessions(sessions);
      
      // Check for resumable session
      const resumable = getCurrentSession(timeline.id);
      setCurrentSessionState(resumable);
    } else {
      localStorage.removeItem('selectedTimelineId');
      localStorage.removeItem('selectedTimelineName');
      setAvailableSessions([]);
      setCurrentSessionState(null);
    }
    setSelectedTimelineState(timeline);
  };

  useEffect(() => {
    loadTimelines();
  }, []);

  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'timeline-update') {
            loadTimelines();
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };
    }
  }, [ws]);

  const loadTimelines = async () => {
    try {
      setLoading(true);
      const response = await timelineAPI.getTimelines();
      setTimelines(response.data.timelines || []);
    } catch (err) {
      setError('Failed to load timelines');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimeline = async (e) => {
    e.preventDefault();
    if (!newTimelineValue.trim()) return;

    try {
      await timelineAPI.createTimeline(newTimelineValue);
      setNewTimelineValue('');
      loadTimelines();
    } catch (err) {
      setError('Failed to create timeline');
      console.error(err);
    }
  };

  const handleSelectTimeline = (timeline) => {
    setSelectedTimeline(timeline);
  };

  const handleBackToTimelines = () => {
    setSelectedTimeline(null);
    loadTimelines();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>MistTracker Dashboard</h1>
          <div className="user-info">
            <span>{user.accountId}</span>
            <button onClick={onLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}

        {selectedTimeline ? (
          <TimelineDetail
            timeline={selectedTimeline}
            onBack={handleBackToTimelines}
            ws={ws}
          />
        ) : (
          <>
            <div className="create-timeline-section">
              <h2>Create New Timeline</h2>
              <form onSubmit={handleCreateTimeline}>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Timeline name or description..."
                    value={newTimelineValue}
                    onChange={(e) => setNewTimelineValue(e.target.value)}
                  />
                  <button type="submit" disabled={loading} className="btn-primary">
                    Create Timeline
                  </button>
                </div>
              </form>
            </div>

            <TimelinesView
              timelines={timelines}
              loading={loading}
              onSelectTimeline={handleSelectTimeline}
              onRefresh={loadTimelines}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
