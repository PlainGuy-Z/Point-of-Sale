import { Routes, Route, Navigate } from 'react-router-dom';
import CashierSettingsLayout from './layout/CashierSettingsLayout';
import CashierProfileSection from './sections/CashierProfileSection';
import CashierPinSection from './sections/CashierPinSection';
import CashierPrinterSection from './sections/CashierPrinterSection';
import AppearanceSection from './sections/AppearanceSection';
import NotificationSection from './sections/NotificationSection';

export default function CashierSettings() {
  return (
    <CashierSettingsLayout>
      <Routes>
        <Route index element={<CashierProfileSection />} />
        <Route path="profile" element={<CashierProfileSection />} />
        <Route path="pin" element={<CashierPinSection />} />
        <Route path="printer" element={<CashierPrinterSection />} />
        <Route path="appearance" element={<AppearanceSection />} />
        <Route path="notifications" element={<NotificationSection />} />
        <Route path="*" element={<Navigate to="/cashier-settings" replace />} />
      </Routes>
    </CashierSettingsLayout>
  );
}
