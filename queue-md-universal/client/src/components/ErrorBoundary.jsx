import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env ? import.meta.env.DEV : true;
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#090b11] text-white p-6 relative overflow-hidden font-sans">
          {/* Decorative background gradients */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 w-full max-w-2xl bg-[#111422]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl text-center">
            {/* Pulsing Alert Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 mb-6 animate-pulse">
              <span className="material-symbols-outlined text-[40px]">
                warning
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-200">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
              An unexpected rendering error occurred in the user interface. Don't worry, your data is safe. Let's try reloading the application.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => window.location.reload()}
                className="px-6 h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-6 h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all duration-200 active:scale-95"
              >
                Go to Dashboard
              </button>
            </div>

            {/* Error Details Accordion */}
            {isDev && this.state.error && (
              <details className="text-left bg-black/40 border border-white/5 rounded-xl p-4 transition-all duration-200 cursor-pointer group">
                <summary className="text-xs text-red-400 font-bold select-none flex items-center justify-between">
                  <span>Developer Technical Details</span>
                  <span className="material-symbols-outlined text-xs transform group-open:rotate-180 transition-transform duration-200">
                    expand_more
                  </span>
                </summary>
                <div className="mt-4 overflow-x-auto text-[11px] font-mono text-gray-300 space-y-2 bg-[#090b11]/80 p-3 rounded border border-white/5 cursor-text">
                  <p className="font-bold text-red-400">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap leading-relaxed opacity-80">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
