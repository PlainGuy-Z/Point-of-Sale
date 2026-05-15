// src/App.tsx — FIXED
import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import PWAInstallBanner from './components/common/PWAInstallBanner';
import FullscreenManager from './components/common/FullscreenManager';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AIProvider } from './contexts/AIContext';
import { AppProvider } from './contexts/AppContext';
import { CartProvider } from './contexts/CartContext';
import { ShiftProvider } from './contexts/ShiftContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NetworkStatus from './components/common/NetworkStatus';

// Auth Pages
const LandingPage = lazy(() => import('./pages/Auth/LandingPage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));

// App Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CashierDashboard = lazy(() => import('./pages/Dashboard/CashierDashboard'));
const PointOfSale = lazy(() => import('./pages/PointOfSale'));
const CategoryPage = lazy(() => import('./pages/PointOfSale/CategoryPage'));
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
const CashierShiftHub = lazy(() => import('./pages/Shifts/CashierShiftHub'));
const CashierHistory = lazy(() => import('./pages/TransactionHistory/CashierHistory'));
const OwnerHistory = lazy(() => import('./pages/TransactionHistory/OwnerHistory'));
const SalesReport = lazy(() => import('./pages/SalesReport'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));

// Settings Sections
const ProfileSection = lazy(() => import('./pages/Settings/sections/ProfileSection'));
const AccountSection = lazy(() => import('./pages/Settings/sections/AccountSection'));
const PrinterSection = lazy(() => import('./pages/Settings/sections/PrinterSection'));
const PaymentSection = lazy(() => import('./pages/Settings/sections/PaymentSection'));
const AppearanceSection = lazy(() => import('./pages/Settings/sections/AppearanceSection'));
const NotificationSection = lazy(() => import('./pages/Settings/sections/NotificationSection'));
const DataSection = lazy(() => import('./pages/Settings/sections/DataSection'));
const CashierSection = lazy(() => import('./pages/Settings/sections/CashierSection'));


interface RoleRouteProps {
  allowedRoles: ('owner' | 'cashier')[];
  children: ReactNode;
  /** Where to send users whose role is not allowed (e.g. cashier → /pos, owner → /dashboard). */
  redirectTo?: string;
}

function RoleRoute({ allowedRoles, children, redirectTo }: RoleRouteProps) {
  const { user, status } = useAuth();
  
  if (status === 'loading') {
    return <LoadingSpinner text="Memverifikasi izin..." />;
  }

  if (!user) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(user.role)) {
    // Better defaults: If you are an owner, you usually want dashboard. 
    // If you are a cashier, you usually want POS.
    const fallback =
      redirectTo ?? (user.role === 'owner' ? '/dashboard' : '/pos');
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

/** 
 * Handles the root path (/) logic. 
 * If guest: show landing.
 * If owner: go to dashboard.
 * If cashier: go to POS.
 */
function RootRedirect() {
  const { status, user } = useAuth();
  if (status === 'authenticated' && user) {
    return <Navigate to={user.role === 'owner' ? '/dashboard' : '/pos'} replace />;
  }
  return (
    <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
      <LandingPage />
    </Suspense>
  );
}

/**
 * A more resilient catch-all for typos.
 * Keeps users in the app instead of bouncing to landing.
 */
function CatchAllRedirect() {
  const { status, user } = useAuth();
  if (status === 'authenticated' && user) {
    return <Navigate to={user.role === 'owner' ? '/dashboard' : '/pos'} replace />;
  }
  return <Navigate to="/" replace />;
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
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-stone-900">
        <LoadingSpinner text="Memverifikasi sesi..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Marketing / SaaS landing (guests). Logged-in users are redirected inside LandingPage. */}
      <Route path="/" element={<RootRedirect />} />

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
      <Route path="/forgot-password" element={
        <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
          <ForgotPassword />
        </Suspense>
      } />
      <Route path="/reset-password" element={
        <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
          <ResetPassword />
        </Suspense>
      } />

      <Route path="/welcome" element={<Navigate to="/" replace />} />

      {/* Main app layout wrapper with ProtectedRoute */}
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>

        {/* All roles */}
        <Route path="pos">
          <Route index element={
            <Suspense fallback={<LoadingSpinner text="Memuat POS..." />}>
              <PointOfSale />
            </Suspense>
          } />
          <Route path="category/:categoryName" element={
            <Suspense fallback={<LoadingSpinner text="Memuat kategori..." />}>
              <CategoryPage />
            </Suspense>
          } />
        </Route>
        <Route path="operation/waste-log" element={
          <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
            <WasteLog />
          </Suspense>
        } />
        <Route path="sales-report" element={
          <Suspense fallback={<LoadingSpinner text="Memuat Laporan..." />}>
            <SalesReport />
          </Suspense>
        } />
        <Route path="help" element={
          <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
            <HelpCenter />
          </Suspense>
        } />

        <Route path="history" element={
          <RoleRoute allowedRoles={['cashier']} redirectTo="/dashboard">
            <Suspense fallback={<LoadingSpinner />}>
              <CashierHistory />
            </Suspense>
          </RoleRoute>
        } />

        {/* Dashboard (Role Based) */}
        <Route path="dashboard" element={
          <RoleRoute allowedRoles={['owner', 'cashier']}>
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <RoleBasedDashboard />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="cashier-dashboard" element={
          <RoleRoute allowedRoles={['cashier']} redirectTo="/dashboard">
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <CashierDashboard />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="cashier/shift" element={
          <RoleRoute allowedRoles={['cashier']} redirectTo="/dashboard">
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <CashierShiftHub />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="insights" element={
          <RoleRoute allowedRoles={['owner']} redirectTo="/pos">
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <BusinessInsights />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="operation/products" element={
          <RoleRoute allowedRoles={['owner']} redirectTo="/pos">
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <ProductManagement />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="operation/inventory-usage" element={
          <RoleRoute allowedRoles={['owner']} redirectTo="/pos">
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <InventoryUsage />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="operation/cost-summary" element={
          <RoleRoute allowedRoles={['owner']} redirectTo="/pos">
            <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
              <CostSummary />
            </Suspense>
          </RoleRoute>
        } />
        <Route path="customers">
          <Route path="members" element={
            <RoleRoute allowedRoles={['owner']} redirectTo="/pos">
              <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
                <Members />
              </Suspense>
            </RoleRoute>
          } />
          <Route path="visit-history" element={
            <RoleRoute allowedRoles={['owner']} redirectTo="/pos">
              <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
                <VisitHistory />
              </Suspense>
            </RoleRoute>
          } />
          <Route path="loyalty-insight" element={
            <RoleRoute allowedRoles={['owner']} redirectTo="/pos">
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
        }>
          <Route index element={
            <Suspense fallback={<LoadingSpinner />}>
              <ProfileSection />
            </Suspense>
          } />
          <Route path="account" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AccountSection />
            </Suspense>
          } />
          <Route path="printer" element={
            <Suspense fallback={<LoadingSpinner />}>
              <PrinterSection />
            </Suspense>
          } />
          <Route path="payment" element={
            <Suspense fallback={<LoadingSpinner />}>
              <PaymentSection />
            </Suspense>
          } />
          <Route path="appearance" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AppearanceSection />
            </Suspense>
          } />
          <Route path="notifications" element={
            <Suspense fallback={<LoadingSpinner />}>
              <NotificationSection />
            </Suspense>
          } />
          <Route path="data" element={
            <Suspense fallback={<LoadingSpinner />}>
              <DataSection />
            </Suspense>
          } />
          <Route path="cashiers" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CashierSection />
            </Suspense>
          } />
        </Route>
        {/* Shifts (Owner) */}
        <Route path="shifts">
          <Route index element={
            <RoleRoute allowedRoles={['owner']} redirectTo="/pos">
              <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
                <ShiftReport />
              </Suspense>
            </RoleRoute>
          } />
          <Route path=":id" element={
            <RoleRoute allowedRoles={['owner']} redirectTo="/pos">
              <Suspense fallback={<LoadingSpinner text="Memuat..." />}>
                <ShiftDetail />
              </Suspense>
            </RoleRoute>
          } />
        </Route>
        <Route path="transactions" element={
          <RoleRoute allowedRoles={['owner']} redirectTo="/pos">
            <Suspense fallback={<LoadingSpinner />}>
              <OwnerHistory />
            </Suspense>
          </RoleRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <SettingsProvider>
            <ShiftProvider>
              <CartProvider>
                <AIProvider>
                  <NetworkStatus />
                  <PWAInstallBanner />
                  <FullscreenManager />
                  <Router>
                    <AppRoutes />
                  </Router>
                </AIProvider>
              </CartProvider>
            </ShiftProvider>
          </SettingsProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}


export default App;