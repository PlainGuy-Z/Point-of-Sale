import { useCallback, useEffect, useState } from 'react';
import type { HistoryTransaction } from '../types/historyTransaction';

export interface PrintReceiptSnapshot {
  transaction: HistoryTransaction;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
}

interface ShopMini {
  name: string;
  address?: string;
  phone?: string;
}

export function usePrint() {
  const [snap, setSnap] = useState<PrintReceiptSnapshot | null>(null);

  useEffect(() => {
    if (!snap) return undefined;
    const onAfter = () => setSnap(null);
    window.addEventListener('afterprint', onAfter);
    const fallback = window.setTimeout(() => setSnap(null), 5000);
    const timer = window.setTimeout(() => {
      window.print();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
      window.removeEventListener('afterprint', onAfter);
    };
  }, [snap]);

  const printReceipt = useCallback((transaction: HistoryTransaction, shop: ShopMini) => {
    setSnap({
      transaction,
      shopName: shop.name,
      shopAddress: shop.address,
      shopPhone: shop.phone,
    });
  }, []);

  return { snap, printReceipt };
}
