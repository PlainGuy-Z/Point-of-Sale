import React from 'react';
import DashboardScreen from '../../components/dashboard/DashboardScreen';
import { useSidebar } from './_layout';

export default function OwnerDashboard() {
  const { openSidebar } = useSidebar();
  return <DashboardScreen onOpenSidebar={openSidebar} />;
}
