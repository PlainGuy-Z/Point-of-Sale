import React from 'react';
import POSScreen from '../../components/pos/POSScreen';
import { POSCartProvider } from '../../contexts/POSCartContext';

export default function OwnerPOS() {
  return (
    <POSCartProvider>
      <POSScreen />
    </POSCartProvider>
  );
}
