// src/App.tsx — FIXED
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ShiftProvider } from './contexts/ShiftContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
const LandingPage = lazy(() => import('./pages/Auth/LandingPage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));

// App Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CashierDashboard = lazy(() => import('./pages/Dashboard/CashierDashboard'));
const PointOfSale = lazy(() => import('./pages/PointOfSale'));
const BusinessInsights = lazy(() => import('./pages/BusinessInsights'));
const WasteLog = lazy(() => import('./pages/Operation/WasteLog'));
const InventoryUsage = lazy(() => import('./pages/Operation/InventoryUsage'));
const CostSummary = lazy(() => import('./pages/Operation/CostSummary'));
const Members = lazy(() => import('./pages/Customers/Members'));
const VisitHistory = lazy(() => import('./pages/Customers/VisitHistory'));
const LoyaltyInsight = lazy(() => import('./pages/Customers/LoyaltyInsight'));
const Settings = lazy(() => import('./pages/Settings'));
const CashierSettings = lazy(() => import('./pages/Settings/CashierSettings'));
const ProductManagement = lazy(() => import('./pages/Operation/ProductManagement'));
const ShiftReport = lazy(() => import('./pages/Shifts/index'));
const ShiftDetail = lazy(() => import('./pages/Shifts/detail'));

interface RoleRouteProps {
  allowedRoles: ('owner' | 'cashier')[];
  children: React.ReactNode;
  redirectTo?: string;
}

function RoleRoute({ allowedRoles, children, redirectTo = '/pos' }: RoleRouteProps) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={redirectTo} />;
  return <>{children}</>;
}

function RoleBasedDashboard() {
  const { user } = useAuth();
  return user?.role === 'owner' ? <Dashboard /> : <CashierDashboard />;
}

function RoleBasedSettings() {
  const { user } = useAuth();
  return user?.role === 'owner' ? <Settings /> : <CashierSettings />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
          <Login />
        </Suspense>
      } />
      <Route path="/register" element={
        <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
          <Register />
        </Suspense>
      } />

      <Route path="/welcome" element={
        <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
          <LandingPage />
        </Suspense>
      } />

      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <AppProvider>
            <Layout />
          </AppProvider>
        </ProtectedRoute>
      }>
        {/* All roles */}
        <Route path="pos" element={
          <Suspense fallback={<LoadingSpinner text="Memuat POS..." />}>
            <PointOfSale />
          </Suspense>
        } />
        <Route path="operation/waste-log" element={
          <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
            <WasteLog />
          </Suspense>
        } />

        {/* Dashboard (Role Based) */}
        <Route path="/" element={
          <RoleRoute allowedRoles={['owner', 'cashier']}>
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <RoleBasedDashboard />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="cashier-dashboard" element={
          <RoleRoute allowedRoles={['cashier']}>
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <CashierDashboard />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="insights" element={
          <RoleRoute allowedRoles={['owner']}>
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <BusinessInsights />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="operation/products" element={
          <RoleRoute allowedRoles={['owner']}>
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <ProductManagement />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="operation/inventory-usage" element={
          <RoleRoute allowedRoles={['owner']}>
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <InventoryUsage />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="operation/cost-summary" element={
          <RoleRoute allowedRoles={['owner']}>
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <CostSummary />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="customers">
          <Route path="members" element={
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
                <Members />
              </Suspense>
            </RoleRoute>
          } />
          <Route path="visit-history" element={
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
                <VisitHistory />
              </Suspense>
            </RoleRoute>
          } />
          <Route path="loyalty-insight" element={
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
                <LoyaltyInsight />
              </Suspense>
            </RoleRoute>
          } />
        </Route>
        {/* Settings (Role Based) */}
        <Route path="settings" element={
          <RoleRoute allowedRoles={['owner', 'cashier']}>
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <RoleBasedSettings />
            </Suspense>
          </RoleRoute>
        } />
        {/* Shifts (Owner) */}
        <Route path="shifts">
          <Route index element={
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
                <ShiftReport />
              </Suspense>
            </RoleRoute>
          } />
          <Route path=":id" element={
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
                <ShiftDetail />
              </Suspense>
            </RoleRoute>
          } />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>        {/* ✅ AuthProvider di dalam ErrorBoundary tapi di luar Router */}
        <AppProvider>
          <ShiftProvider>
            <Router>
              <AppRoutes />     {/* ✅ Routes dipisah ke komponen sendiri */}
            </Router>
          </ShiftProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;