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
        <div style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '2rem auto',
          background: '#fee',
          border: '2px solid #f00',
          borderRadius: '8px'
        }}>
          <h2 style={{ color: '#c00', marginBottom: '1rem' }}>
            ⚠️ Something went wrong
          </h2>

          <div style={{
            background: '#fff',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <strong>Error:</strong>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.9rem',
              color: '#c00'
            }}>
              {this.state.error?.toString()}
            </pre>
          </div>

          {this.state.errorInfo && (
            <details style={{
              background: '#fff',
              padding: '1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              <summary style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Stack Trace
              </summary>
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontSize: '0.8rem',
                color: '#666',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🔄 Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
