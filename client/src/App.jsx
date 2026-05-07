import { useState, useEffect, useRef } from 'react';
import './App.css';
import { setAuthToken, authAPI } from './api';
import LoginPage from './pages/LoginPage';
import HydrogenProxyPage from './pages/HydrogenProxyPage';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import { errorHandler } from './utils/errorHandling';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  useEffect(() => {
    // Verify token on app load
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      // Check if token exists first
      const token = localStorage.getItem('authToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Token exists, verify it's still valid
      const response = await authAPI.verify();
      setUser(response.data);
      connectWebSocket();
    } catch (error) {
      console.error('Auth verification failed:', error.message);
      errorHandler.emit(error, {
        name: 'Auth Verification',
        severity: 'warning'
      });
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('⏳ No auth token available, skipping WebSocket connection');
        return;
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host.split(':')[0]}:3000/?token=${encodeURIComponent(token)}`;
      
      console.log('🔌 Connecting to WebSocket with authentication token...');
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✓ WebSocket connected');
        if (window.showToastSuccess) {
          window.showToastSuccess('Connected to physics engine', 2000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.warn('WebSocket connection error (optional feature, app continues without real-time updates)');
        errorHandler.emit(new Error('WebSocket connection error'), {
          name: 'WebSocket Connection',
          severity: 'warning'
        });
        if (window.showToastWarning) {
          window.showToastWarning('Physics connection unavailable (optional feature)');
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        if (window.showToastInfo) {
          window.showToastInfo('Disconnected from physics engine');
        }
        // Don't auto-reconnect to avoid infinite retry loops
        // Users can refresh if they want real-time updates
      };
    } catch (error) {
      console.warn('WebSocket not available (optional)');
      errorHandler.emit(error, {
        name: 'WebSocket Setup',
        severity: 'warning'
      });
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    connectWebSocket();
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <ErrorBoundary>
      <div className="app">
        {user ? (
          <HydrogenProxyPage user={user} onLogout={handleLogout} />
        ) : (
          <LoginPage onLogin={handleLogin} />
        )}
      </div>
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
