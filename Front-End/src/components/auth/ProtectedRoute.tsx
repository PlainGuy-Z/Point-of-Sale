import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'owner' | 'cashier';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { status, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-stone-950' : 'bg-gray-50'}`}>
        <LoadingSpinner text="Memverifikasi sesi..." />
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
