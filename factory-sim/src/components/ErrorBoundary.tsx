import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="industrial-container">
          <div className="blueprint-background"></div>
          <div className="industrial-content">
            <div className="industrial-card" style={{ borderColor: '#f87171', maxWidth: '800px', margin: '2rem auto' }}>
              <div className="industrial-status industrial-status--error" style={{ marginBottom: '1rem' }}>
                <span className="industrial-status__indicator"></span>
                SYSTEM ERROR
              </div>

              <h2 className="industrial-card__title" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
                Critical Failure Detected
              </h2>

              <div className="industrial-code-block" style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f87171' }}>ERROR:</strong>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '0.9rem',
                  marginTop: '0.5rem'
                }}>
                  {this.state.error?.toString()}
                </pre>
              </div>

              {this.state.errorInfo && (
                <details className="industrial-code-block" style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                  <summary style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                    STACK TRACE
                  </summary>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.8rem',
                    overflow: 'auto',
                    maxHeight: '400px',
                    marginTop: '0.5rem'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <button
                className="industrial-button"
                onClick={() => window.location.reload()}
                style={{ width: '100%' }}
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
