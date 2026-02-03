import React from 'react';

interface JamPageErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface JamPageErrorBoundaryState {
  hasError: boolean;
}

class JamPageErrorBoundary extends React.Component<JamPageErrorBoundaryProps, JamPageErrorBoundaryState> {
  state: JamPageErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('JamPage render failed', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default JamPageErrorBoundary;
