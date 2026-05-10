import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/common/ErrorBoundary'

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

// Gunakan Vite environment variables
const isProduction = import.meta.env.PROD;

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

// Handle uncaught errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    console.error('Error at:', event.filename, 'line', event.lineno);
    
    // Log to analytics service (example) - hanya di production
    if (isProduction) {
      // Contoh: Kirim ke Sentry/Google Analytics
      // logErrorToService(event.error);
    }
    
    // Prevent default browser error handling
    event.preventDefault();
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Log to analytics - hanya di production
    if (isProduction) {
      // logPromiseRejection(event.reason);
    }
    
    // Optional: Show user-friendly message
    if (event.reason?.message?.includes('Failed to fetch')) {
      console.warn('Network error detected');
    }
    
    event.preventDefault();
  });

  // Handle console errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError.apply(console, args);
    
    // Filter out React development warnings
    const isReactWarning = args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('Warning:') || arg.includes('development build'))
    );
    
    if (!isReactWarning && isProduction) {
      // Log serious console errors
      // logConsoleError(args);
    }
  };
}

// Performance monitoring can be implemented using official React profiling tools if needed.

// ============================================================================
// OFFLINE DETECTION
// ============================================================================

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Application is online');
    // Bisa dispatch event untuk update UI
    document.dispatchEvent(new CustomEvent('app:online'));
  });

  window.addEventListener('offline', () => {
    console.warn('Application is offline');
    // Notify user
    document.dispatchEvent(new CustomEvent('app:offline'));
    
    // Show offline toast
    if (typeof document !== 'undefined') {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-xl shadow-lg z-50';
      toast.textContent = 'Anda sedang offline. Beberapa fitur mungkin tidak tersedia.';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 5000);
    }
  });
}

// ============================================================================
// STORAGE QUOTA WARNING
// ============================================================================

const checkStorageQuota = async () => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 10 * 1024 * 1024; // 10MB default
      const percentage = (used / quota) * 100;
      
      if (percentage > 80) {
        console.warn(`Storage almost full: ${Math.round(percentage)}% used`);
        
        // Show warning to user
        if (percentage > 90 && typeof document !== 'undefined') {
          const warning = document.createElement('div');
          warning.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 max-w-sm';
          warning.innerHTML = `
            <strong>⚠️ Penyimpanan Hampir Penuh</strong>
            <p class="text-sm mt-1">${Math.round(percentage)}% penyimpanan terpakai. Backup data dan hapus data lama.</p>
          `;
          document.body.appendChild(warning);
          
          setTimeout(() => {
            if (document.body.contains(warning)) {
              document.body.removeChild(warning);
            }
          }, 10000);
        }
      }
    }
  } catch (error) {
    console.error('Error checking storage quota:', error);
  }
};

// Check storage quota periodically (hanya di client)
if (typeof window !== 'undefined') {
  // Initial check
  setTimeout(checkStorageQuota, 2000);
  
  // Periodic checks setiap 30 detik
  setInterval(checkStorageQuota, 30000);
}

// ============================================================================
// REACT RENDER
// ============================================================================

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Create React root with error boundary
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// ============================================================================
// SERVICE WORKER REGISTRATION (PWA) - Production only
// ============================================================================

async function registerServiceWorkerIfAvailable(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !isProduction) {
    return;
  }

  try {
    const response = await fetch('/sw.js', { method: 'HEAD' });
    if (!response.ok) {
      console.warn('Service worker not registered because /sw.js was not found.');
      return;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('ServiceWorker registered:', registration.scope);
  } catch (error) {
    console.warn('ServiceWorker registration skipped or failed:', error);
  }
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && isProduction) {
  window.addEventListener('load', () => {
    void registerServiceWorkerIfAvailable();
  });
}

// ============================================================================
// APP VERSION CHECK
// ============================================================================

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  const APP_VERSION = '1.0.0';
  const STORAGE_VERSION_KEY = 'coffee_pos_app_version';

  // Check for version changes
  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  if (storedVersion !== APP_VERSION) {
    console.log(`App updated from ${storedVersion || 'unknown'} to ${APP_VERSION}`);
    
    // Perform data migrations if needed
    if (storedVersion && storedVersion < '1.0.0') {
      console.log('Performing data migration...');
      // Add migration logic here
    }
    
    // Update stored version
    localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION);
    
    // Show update notification
    if (typeof document !== 'undefined') {
      const updateMsg = document.createElement('div');
      updateMsg.className = 'fixed bottom-4 left-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50';
      updateMsg.textContent = `Aplikasi diperbarui ke versi ${APP_VERSION}`;
      document.body.appendChild(updateMsg);
      
      setTimeout(() => {
        if (document.body.contains(updateMsg)) {
          document.body.removeChild(updateMsg);
        }
      }, 5000);
    }
  }
}