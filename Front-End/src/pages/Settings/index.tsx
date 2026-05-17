import { Outlet } from 'react-router-dom';
import SettingsLayout from './layout/SettingsLayout';

export default function Settings() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  );
}