import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'owner' | 'cashier';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { status, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Still checking auth — show spinner, never flash login page
  if (status === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: isDark ? '#0c0a09' : '#f9fafb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '4px solid',
              borderColor: isDark ? '#292524' : '#e5e7eb',
              borderTopColor: '#f59e0b',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: isDark ? '#a8a29e' : '#6b7280', fontSize: 14 }}>
            Memverifikasi sesi...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Not logged in
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role
  if (requiredRole === 'owner' && user?.role !== 'owner') {
    return <Navigate to="/pos" replace />;
  }

  return <>{children}</>;
}
