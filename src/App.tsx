import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load untuk performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PointOfSale = lazy(() => import('./pages/PointOfSale'));
const BusinessInsights = lazy(() => import('./pages/BusinessInsights'));
const WasteLog = lazy(() => import('./pages/Operation/WasteLog'));
const InventoryUsage = lazy(() => import('./pages/Operation/InventoryUsage'));
const CostSummary = lazy(() => import('./pages/Operation/CostSummary'));
const Members = lazy(() => import('./pages/Customers/Members'));
const VisitHistory = lazy(() => import('./pages/Customers/VisitHistory'));
const LoyaltyInsight = lazy(() => import('./pages/Customers/LoyaltyInsight'));
const Settings = lazy(() => import('./pages/Settings'));
const DataReset = lazy(() => import('./pages/Settings/DataReset'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const ProductManagement = lazy(() => import('./pages/Operation/ProductManagement'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* SEMUA ROUTES HARUS DI DALAM LAYOUT */}
          <Route path="/" element={<Layout />}>
            {/* Main Routes */}
            <Route index element={
              <Suspense fallback={<LoadingSpinner text="Memuat Dashboard..." />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="pos" element={
              <Suspense fallback={<LoadingSpinner text="Memuat POS..." />}>
                <PointOfSale />
              </Suspense>
            } />
            <Route path="insights" element={
              <Suspense fallback={<LoadingSpinner text="Memuat Insights..." />}>
                <BusinessInsights />
              </Suspense>
            } />
            
            {/* Operation Routes */}
            <Route path="operation">
              <Route path="waste-log" element={
                <Suspense fallback={<LoadingSpinner text="Memuat Waste Log..." />}>
                  <WasteLog />
                </Suspense>
              } />
              <Route path="inventory-usage" element={
                <Suspense fallback={<LoadingSpinner text="Memuat Inventory..." />}>
                  <InventoryUsage />
                </Suspense>
              } />
              <Route path="cost-summary" element={
                <Suspense fallback={<LoadingSpinner text="Memuat Cost Summary..." />}>
                  <CostSummary />
                </Suspense>
              } />
              <Route path="products" element={
                <Suspense fallback={<LoadingSpinner text="Memuat Produk..." />}>
                  <ProductManagement />
                </Suspense>
              } />
            </Route>
            
            {/* Customer Routes */}
            <Route path="customers">
              <Route path="members" element={
                <Suspense fallback={<LoadingSpinner text="Memuat Members..." />}>
                  <Members />
                </Suspense>
              } />
              <Route path="visit-history" element={
                <Suspense fallback={<LoadingSpinner text="Memuat Visit History..." />}>
                  <VisitHistory />
                </Suspense>
              } />
              <Route path="loyalty-insight" element={
                <Suspense fallback={<LoadingSpinner text="Memuat Loyalty Insight..." />}>
                  <LoyaltyInsight />
                </Suspense>
              } />
            </Route>
            
            <Route path="settings">
              <Route index element={
                <Suspense fallback={<LoadingSpinner text="Memuat Settings..." />}>
                  <Settings />
                </Suspense>
              } />
              <Route path="data-reset" element={
                <Suspense fallback={<LoadingSpinner text="Memuat Data Reset..." />}>
                  <DataReset />
                </Suspense>
              } />
            </Route>

            <Route path="help" element={
              <Suspense fallback={<LoadingSpinner text="Memuat Help Center..." />}>
                <HelpCenter />
              </Suspense>
            } />
            
            <Route path="logout" element={<div className="p-8">Logout successful</div>} />
            
            {/* 404 */}
            <Route path="*" element={
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  404 - Page Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Halaman yang Anda cari tidak ditemukan.
                </p>
              </div>
            } />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;