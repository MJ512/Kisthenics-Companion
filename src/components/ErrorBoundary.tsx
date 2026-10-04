import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Kisthenics] Caught unhandled rendering error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          style={{
            padding: 24,
            maxWidth: 420,
            margin: '40px auto',
            borderRadius: 16,
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e4e1db)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: 'var(--color-text-primary, #2b2926)',
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            Application Encountered an Error
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary, #6f6b65)', margin: '0 0 16px', lineHeight: 1.45 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              background: 'var(--color-primary, #c15f3c)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
