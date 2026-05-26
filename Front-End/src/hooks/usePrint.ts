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

  // Browser-only: trigger window.print() when snap is set AND method is browser
  useEffect(() => {
    if (!snap) return undefined;
    const method = settings?.print_method || 'browser';

    // Only trigger window.print() for browser method
    if (method !== 'browser') {
      console.log('[usePrint] snap set but print_method is', method, '— skipping window.print()');
      // Clear snap after a short delay (no print dialog needed)
      const clear = window.setTimeout(() => setSnap(null), 500);
      return () => window.clearTimeout(clear);
    }

    console.log('[usePrint] browser print triggered via snap');
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
  }, [snap, settings?.print_method]);

  const printReceipt = useCallback(async (transaction: HistoryTransaction, shop: ShopMini) => {
    const method = settings?.print_method || 'browser';
    console.log('[usePrint] printReceipt called, selected print method:', method);
    
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
        if (method === 'rawbt_intent') {
          // rawbt_intent: NEVER fallback to browser print
          console.error('[usePrint] RawBT intent print failed — NOT falling back to browser.', err);
          console.warn('[usePrint] Reason: print_method is rawbt_intent, browser fallback is disabled');
        } else {
          // rawbt (network proxy): fallback to browser print
          console.error('[usePrint] RawBT network print failed, falling back to browser print:', err);
          console.log('[usePrint] fallback browser print triggered. Reason: rawbt network proxy failed');
          setSnap({
            transaction,
            shopName: shop.name,
            shopAddress: shop.address,
            shopPhone: shop.phone,
          });
        }
      }
    } else {
      // browser method
      console.log('[usePrint] using browser print via snap');
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

