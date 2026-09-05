import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './index';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PayOps UI ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '32px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          margin: '24px auto',
          maxWidth: '560px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FFE4E6',
            color: '#E11D48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <AlertCircle size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
            Application Error Caught
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '24px', maxWidth: '420px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred. You can reload this view to recover.'}
          </p>
          <Button variant="primary" icon={RefreshCw} onClick={this.handleReload}>
            Reload Application Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
