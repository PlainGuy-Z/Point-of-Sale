import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import StorageMonitor from './components/StorageMonitor'; // ← IMPORT DI SINI

// Import semua pages
import Dashboard from './pages/Dashboard';
import PointOfSale from './pages/PointOfSale';
import BusinessInsights from './pages/BusinessInsights';
import WasteLog from './pages/Operation/WasteLog';
import InventoryUsage from './pages/Operation/InventoryUsage';
import CostSummary from './pages/Operation/CostSummary';
import Members from './pages/Customers/Members';
import VisitHistory from './pages/Customers/VisitHistory';
import LoyaltyInsight from './pages/Customers/LoyaltyInsight';
import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';
import ProductManagement from './pages/Operation/ProductManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <>
            <Layout />
            <StorageMonitor /> {/* ← TAMBAHKAN DI SINI */}
          </>
        }>
          {/* Main Routes */}
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<PointOfSale />} />
          <Route path="insights" element={<BusinessInsights />} />
          
          {/* Operation Routes */}
          <Route path="operation">
            <Route path="waste-log" element={<WasteLog />} />
            <Route path="inventory-usage" element={<InventoryUsage />} />
            <Route path="cost-summary" element={<CostSummary />} />
            <Route path="products" element={<ProductManagement />} /> {/* Rute Baru */}
          </Route>
          
          {/* Customer Routes */}
          <Route path="customers">
            <Route path="members" element={<Members />} />
            <Route path="visit-history" element={<VisitHistory />} />
            <Route path="loyalty-insight" element={<LoyaltyInsight />} />
          </Route>
          
          {/* Other Routes */}
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<HelpCenter />} />
          <Route path="logout" element={<div className="p-8">Logout successful</div>} />
          
          {/* 404 */}
          <Route path="*" element={<div className="p-8">Page not found</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;