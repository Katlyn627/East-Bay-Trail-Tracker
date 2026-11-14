import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sage-mist flex items-center justify-center p-6 nature-pattern">
          <div className="organic-card bg-white p-8 max-w-md w-full shadow-2xl text-center border-2 border-poppy/20">
            <div className="inline-flex p-4 rounded-full bg-poppy/10 text-poppy mb-6">
              <AlertTriangle size={48} />
            </div>
            <h2 className="text-2xl font-heading font-black text-forest-deep mb-2">Something went wrong</h2>
            <p className="text-forest-moss mb-8 text-sm leading-relaxed">
              An unexpected trail hazard occurred in the app. We've been notified and are working on it.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-forest text-white rounded-2xl font-bold hover:bg-forest-deep transition-all shadow-lg"
              >
                <RotateCcw size={18} />
                Try Refreshing
              </button>

              <a
                href="/"
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-forest/20 text-forest rounded-2xl font-bold hover:bg-forest/5 transition-all"
              >
                <Home size={18} />
                Back to Home
              </a>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-red-50 rounded-xl text-left overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-red-800 break-words">
                  {this.state.error?.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
