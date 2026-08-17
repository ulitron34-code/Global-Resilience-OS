import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="min-h-screen bg-void flex items-center justify-center p-6"><div className="bg-panel border border-alert/30 rounded-lg p-6 max-w-md text-center"><h1 className="font-display text-xl font-semibold text-ink">This view needs to restart</h1><p className="text-sm text-ink-muted mt-2">An unexpected error occurred. Backend operational state was not cleared.</p><button onClick={() => window.location.reload()} className="mt-5 bg-signal text-void rounded px-4 py-2 text-sm font-semibold">Reload platform</button></div></div>;
  }
}

