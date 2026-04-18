import { useState, useEffect, useCallback } from 'react';
import '../styles/Toast.css';

/**
 * Toast Notification Component
 * Phase 6.5: User feedback for errors and status updates
 */
function Toast({ message, type = 'info', duration = 4000, onClose }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'error' && '❌'}
          {type === 'success' && '✓'}
          {type === 'warning' && '⚠️'}
          {type === 'info' && 'ℹ️'}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

/**
 * Toast Container Component
 * Manages multiple toast notifications
 */
function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Expose methods globally for easy access
  useEffect(() => {
    window.showToast = addToast;
    window.showToastSuccess = (msg, duration) => addToast(msg, 'success', duration);
    window.showToastError = (msg, duration) => addToast(msg, 'error', duration || 6000);
    window.showToastWarning = (msg, duration) => addToast(msg, 'warning', duration);
    window.showToastInfo = (msg, duration) => addToast(msg, 'info', duration);

    return () => {
      delete window.showToast;
      delete window.showToastSuccess;
      delete window.showToastError;
      delete window.showToastWarning;
      delete window.showToastInfo;
    };
  }, [addToast]);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
export { Toast };
