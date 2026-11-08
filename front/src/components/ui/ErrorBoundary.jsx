import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Operational Panel Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[320px] p-8 bg-ops-card border border-red-900/50 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-crisis-critical mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Operational Panel Error</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            An unexpected error occurred while rendering this telemetry module. Real-time data sync has been paused for safety.
          </p>
          <div className="bg-ops-bg/80 border border-slate-800 p-3 rounded-lg text-left text-xs font-mono text-red-400 mb-6 max-w-lg overflow-x-auto">
            {this.state.error?.message || 'Unknown component rendering error'}
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
