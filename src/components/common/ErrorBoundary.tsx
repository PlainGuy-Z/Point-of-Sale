import React, { Component} from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // Bisa log ke service seperti Sentry di sini
    // logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Reload page untuk reset state
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback atau default UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Gunakan Vite environment variables
      const isDevMode = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Oops! Terjadi Error
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Aplikasi mengalami masalah. Silakan coba refresh halaman.
            </p>
            
            {/* Error details hanya ditampilkan di development mode */}
            <div className={`mb-6 p-4 rounded-lg text-left text-sm ${
              isDevMode 
                ? 'bg-gray-100 dark:bg-gray-700' 
                : 'hidden'
            }`}>
              <p className="font-mono text-xs text-red-600 dark:text-red-400 break-all">
                {this.state.error?.toString()}
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-gray-500 dark:text-gray-400">
                  Stack Trace
                </summary>
                <pre className="mt-2 text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-40">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Halaman
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                Ke Beranda
              </button>
            </div>
            
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              Jika error berlanjut, silakan clear cache browser atau hubungi support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;