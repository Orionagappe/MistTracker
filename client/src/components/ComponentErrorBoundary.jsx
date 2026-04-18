import { Component } from 'react';
import { errorHandler } from '../utils/errorHandling';
import '../styles/ComponentErrorBoundary.css';

/**
 * ComponentErrorBoundary
 * Phase 8.1: Granular error boundaries for individual components
 * 
 * Catches errors in wrapped component and shows recovery UI
 * without blocking the entire page or sibling components
 */
class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isCollapsed: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const { name = 'Component' } = this.props;
    
    this.setState({
      error,
      errorInfo,
      isCollapsed: true
    });

    // Log to error handler
    errorHandler.emit(error, {
      name: `${name} Error`,
      componentStack: errorInfo.componentStack,
      severity: 'warning'
    });

    console.error(`Error in ${name}:`, error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isCollapsed: false
    });
  };

  handleRetry = () => {
    this.handleReset();
    const { onRetry } = this.props;
    if (onRetry) {
      onRetry();
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({
      isCollapsed: !prev.isCollapsed
    }));
  };

  render() {
    if (this.state.hasError) {
      const { name = 'Component', fallback } = this.props;
      const { error, errorInfo, isCollapsed } = this.state;

      return (
        <div className="component-error-boundary">
          <div className="component-error-container">
            <div className="component-error-header">
              <div className="component-error-icon">⚠️</div>
              <div className="component-error-title">
                <h3>{name} Error</h3>
                <p className="component-error-message">{error?.message || 'An unexpected error occurred'}</p>
              </div>
            </div>

            {fallback && (
              <div className="component-error-fallback">
                {fallback}
              </div>
            )}

            <div className="component-error-actions">
              <button 
                onClick={this.handleRetry}
                className="btn-component-retry"
                title="Try to recover from this error"
              >
                🔄 Retry
              </button>
              <button 
                onClick={this.toggleDetails}
                className="btn-component-details"
                title="Show/hide error details"
              >
                {isCollapsed ? '📋 Details' : '✕ Hide'}
              </button>
            </div>

            {!isCollapsed && (
              <details className="component-error-details">
                <summary>Technical Details</summary>
                <pre className="component-error-stack">
                  {error?.toString()}
                  {'\n\n'}
                  {errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
