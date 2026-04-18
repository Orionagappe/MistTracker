import { Component } from 'react';
import { errorHandler } from '../utils/errorHandling';
import '../styles/ErrorBoundary.css';

/**
 * Error Boundary Component
 * Phase 6.5: Catch React errors and prevent white screens
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to error handler
    errorHandler.emit(error, {
      name: 'React Error Boundary',
      componentStack: errorInfo.componentStack,
      severity: 'critical'
    });

    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Show user-facing toast
    if (window.showToastError) {
      window.showToastError(`An error occurred: ${error.message}`, 8000);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">❌</div>
            <h2>Something went wrong</h2>
            
            <details className="error-details">
              <summary>Error Details</summary>
              <pre className="error-stack">
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>

            <div className="error-actions">
              <button 
                onClick={this.handleReset} 
                className="btn-error-retry"
              >
                Try Again
              </button>
              {window.location.pathname !== '/' && (
                <button 
                  onClick={() => window.location.href = '/'}
                  className="btn-error-home"
                >
                  Go to Home
                </button>
              )}
            </div>

            <p className="error-count">
              Error count: {this.state.errorCount}
              {this.state.errorCount > 3 && (
                <span className="error-warning"> (Multiple errors - may indicate system issue)</span>
              )}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
