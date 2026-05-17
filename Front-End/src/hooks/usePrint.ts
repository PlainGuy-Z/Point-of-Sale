import { useCallback, useEffect, useState } from 'react';
import type { HistoryTransaction } from '../types/historyTransaction';
import { useSettings } from '../contexts/SettingsContext';
import { usePrinter } from './usePrinter';

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
  const { settings } = useSettings();
  const { print: rawPrint } = usePrinter();
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

  const printReceipt = useCallback(async (transaction: HistoryTransaction, shop: ShopMini) => {
    const method = settings?.print_method || 'browser';
    
    if (method === 'rawbt' || method === 'rawbt_intent') {
      try {
        await rawPrint({
          shopName: shop.name,
          shopAddress: shop.address,
          shopPhone: shop.phone,
          cashierName: transaction.cashier_name || '-',
          transactionId: transaction.id,
          createdAt: new Date(transaction.created_at),
          orderType: transaction.order_type,
          tableNumber: transaction.table_number || undefined,
          customerName: transaction.customer_name || undefined,
          items: transaction.items.map(it => ({
            name: it.product_name,
            quantity: it.quantity,
            price: it.unit_price,
            subtotal: it.subtotal
          })),
          subtotal: transaction.subtotal,
          tax: transaction.tax_amount || 0,
          taxRate: transaction.tax_rate || 0,
          serviceCharge: transaction.service_charge,
          grandTotal: transaction.total_amount,
          paymentMethod: transaction.raw_payment_method?.toLowerCase() || transaction.payment_method.toLowerCase(),
          amountPaid: transaction.amount_paid || undefined,
          change: transaction.change_amount || undefined,
          receiptFooter: settings?.receipt_footer,
          paperSize: (settings?.receipt_paper_size || '58mm') as '58mm' | '80mm'
        });
      } catch (err) {
        console.error('RawBT print failed, falling back to browser:', err);
        // Fallback to browser if raw print fails
        setSnap({
          transaction,
          shopName: shop.name,
          shopAddress: shop.address,
          shopPhone: shop.phone,
        });
      }
    } else {
      setSnap({
        transaction,
        shopName: shop.name,
        shopAddress: shop.address,
        shopPhone: shop.phone,
      });
    }
  }, [settings, rawPrint]);

  return { snap, printReceipt };
}
