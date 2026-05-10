import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import type { Transaction } from '../../types';

interface ReceiptTransaction extends Transaction {
  customerName?: string;
  tableNumber?: string;
  orderType?: 'dine-in' | 'take-away';
  cashReceived?: number;
  change?: number;
  taxRate?: number;
  subtotal?: number;
  tax?: number;
  service_charge?: number;
}

interface ReceiptModalProps {
  transaction: ReceiptTransaction;
  onClose: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
}

export default function ReceiptModal({
  transaction,
  onClose,
  onPrint
}: ReceiptModalProps) {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const isDark = theme === 'dark';

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  // ✅ TAMBAH: Fungsi untuk mendapatkan label order type
  const getOrderTypeLabel = () => {
    if (transaction.orderType === 'take-away') return 'Take Away';
    if (transaction.orderType === 'dine-in') return 'Dine In';
    // Fallback jika tidak ada orderType
    return transaction.tableNumber ? 'Dine In' : 'Take Away';
  };

  // ✅ TAMBAH: Tampilkan table number hanya jika dine-in
  const shouldShowTable = transaction.orderType === 'dine-in' && transaction.tableNumber;

  const copyReceipt = () => {
    const orderTypeInfo = transaction.orderType 
      ? `Tipe: ${getOrderTypeLabel()}\n`
      : '';
    
    const tableInfo = shouldShowTable
      ? `Meja: ${transaction.tableNumber}\n`
      : '';

    const itemsText = transaction.items
      .map(i => {
        let line = `${i.quantity}x ${i.note || 'Item'} - Rp ${i.price * i.quantity}`;
        if (i.description) {
          line += ` (${i.description})`;
        }
        return line;
      })
      .join('\n');

    const notesText = transaction.notes
      ? `\nCatatan: ${transaction.notes}`
      : '';

    const text = `
RECEIPT
ID: ${transaction.id}
Tanggal: ${formatDate(transaction.date)}
${orderTypeInfo}Pelanggan: ${transaction.customerName || 'Walk-in'}
${tableInfo}
${itemsText}

TOTAL: Rp ${transaction.total}
Pembayaran: ${transaction.paymentMethod?.toUpperCase()}${notesText}
`.trim();

    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div
        className={`w-full max-w-sm rounded-2xl shadow-2xl border ${
          isDark
            ? 'bg-stone-950/80 text-stone-100 border-stone-800'
            : 'bg-white/80 text-stone-900 border-stone-200'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <div>
            <h2 className="text-sm font-black">Receipt</h2>
            <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>#{transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-3xl border ${isDark ? 'border-stone-800 hover:bg-[#1a1614]' : 'border-stone-200 hover:bg-stone-50'}`}
            aria-label="Close receipt"
          >
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
          {/* Info - DENGAN ORDER TYPE */}
          <div className={`space-y-1 text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            <div>{formatDate(transaction.date)}</div>
            
            {/* ✅ TAMBAH: Order Type */}
            {transaction.orderType && (
              <div className="flex items-center gap-1">
                <span>Tipe:</span>
                <span className={`px-2 py-0.5 rounded-3xl text-[10px] font-black border ${
                  transaction.orderType === 'take-away'
                    ? isDark ? 'bg-amber-900/20 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'
                    : isDark ? 'bg-amber-900/20 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {getOrderTypeLabel()}
                </span>
              </div>
            )}
            
            <div>Pelanggan: {transaction.customerName || 'Walk-in'}</div>
            
            {/* ✅ MODIFIKASI: Table number hanya untuk dine-in */}
            {shouldShowTable ? (
              <div>Meja: {transaction.tableNumber}</div>
            ) : (
              transaction.orderType === 'take-away' && (
                <div className="text-stone-400 italic">Take Away</div>
              )
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {transaction.items.map((item, i) => (
              <div
                key={i}
                className={`flex justify-between border-b pb-2 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {item.note || 'Product'} {item.description && <span className="font-normal italic text-xs opacity-75">- {item.description}</span>}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {item.quantity} × Rp {item.price.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="text-right">
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className={`pt-3 space-y-1 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
            <div className="flex justify-between text-xs">
              <span>Subtotal</span>
              <span>Rp {(transaction.subtotal || transaction.total).toLocaleString('id-ID')}</span>
            </div>

            {(transaction.tax !== undefined && transaction.tax > 0) && (
              <div className="flex justify-between text-xs">
                <span>{settings?.tax_label || 'Pajak'} ({transaction.taxRate || 0}%)</span>
                <span>Rp {transaction.tax.toLocaleString('id-ID')}</span>
              </div>
            )}

            {(transaction.service_charge !== undefined && transaction.service_charge > 0) && (
              <div className="flex justify-between text-xs">
                <span>{settings?.service_charge_label || 'Service'}</span>
                <span>Rp {transaction.service_charge.toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="flex justify-between font-black pt-1 text-base border-t border-dashed mt-1 dark:border-stone-800">
              <span>Total</span>
              <span>Rp {transaction.total.toLocaleString('id-ID')}</span>
            </div>

            <div className={`pt-2 text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Pembayaran: {transaction.paymentMethod?.toUpperCase()}
            </div>

            {transaction.paymentMethod === 'cash' &&
              transaction.cashReceived && (
                <>
                  <div className="flex justify-between text-xs">
                    <span>Tunai</span>
                    <span>
                      Rp {transaction.cashReceived.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Kembali</span>
                    <span>
                      Rp {(transaction.change || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}

            {/* Footer */}
            {settings?.receipt_footer && (
              <div className="pt-6 text-center">
                <p className={`text-[10px] italic leading-relaxed ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  {settings.receipt_footer}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={`p-4 border-t flex gap-2 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <button
            onClick={copyReceipt}
            className={`flex-1 py-3 text-xs rounded-3xl border font-black ${isDark ? 'border-stone-800 hover:bg-[#1a1614]' : 'border-stone-200 hover:bg-stone-50'}`}
          >
            Copy
          </button>
          <button
            onClick={onPrint}
            className={`flex-1 py-3 text-xs rounded-3xl border font-black ${isDark ? 'border-stone-800 hover:bg-[#1a1614]' : 'border-stone-200 hover:bg-stone-50'}`}
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}