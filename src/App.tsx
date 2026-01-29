import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { navigationConfig } from './data/navigation';

import Dashboard from './pages/Dashboard/index';
import PointOfSale from './pages/PointOfSale/index';
import BusinessInsights from './pages/BusinessInsights/index';
import WasteLog from './pages/Operation/WasteLog/index';
import InventoryUsage from './pages/Operation/InventoryUsage/index';
import CostSummary from './pages/Operation/CostSummary/index';
import Members from './pages/Customers/Members/index';
import VisitHistory from './pages/Customers/VisitHistory/index';
import LoyaltyInsight from './pages/Customers/LoyaltyInsight/index';
import Settings from './pages/Settings/index';
import HelpCenter from './pages/HelpCenter/index';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Main Routes */}
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<PointOfSale />} />
          <Route path="insights" element={<BusinessInsights />} />
          
          {/* Operation Routes */}
          <Route path="operation">
            <Route path="waste-log" element={<WasteLog />} />
            <Route path="inventory-usage" element={<InventoryUsage />} />
            <Route path="cost-summary" element={<CostSummary />} />
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
          <Route path="logout" element={<div>Logout Page</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;