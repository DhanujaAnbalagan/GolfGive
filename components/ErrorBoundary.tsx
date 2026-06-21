'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label for identifying the error scope in logs */
  scope?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable React Error Boundary.
 *
 * Wraps any subtree. On error, shows a styled fallback UI and
 * offers a reset button to re-render the children.
 *
 * Usage:
 *   <ErrorBoundary scope="Draws Panel">
 *     <DrawsPanel />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const scope = this.props.scope ?? 'Unknown';
    console.error(`[ErrorBoundary:${scope}]`, error, errorInfo.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="rounded-2xl bg-neutral-900 border border-red-500/20 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {this.props.scope ? `${this.props.scope} Error` : 'Component Error'}
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              This section encountered an error. Other parts of the page still work.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <p className="text-xs font-mono text-red-400 bg-black/30 rounded-lg p-3 text-left break-all">
              {this.state.error.message}
            </p>
          )}

          <button
            onClick={this.reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
