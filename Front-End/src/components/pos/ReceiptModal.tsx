import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import type { Transaction } from '../../types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

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
  const { format } = useCurrencyFormatter();

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
        let line = `${i.quantity}x ${i.note || 'Item'} - ${format(i.price * i.quantity)}`;
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

TOTAL: ${format(transaction.total)}
Pembayaran: ${transaction.paymentMethod?.toUpperCase()}${notesText}
`.trim();

    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-sm rounded-2xl shadow-2xl border ${
          isDark
            ? 'bg-stone-950/80 text-stone-100 border-stone-800'
            : 'bg-white text-[#0F172A] border-[#E2E8F0]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <div>
            <h2 className="text-sm font-bold">Receipt</h2>
            <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>#{transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'border-stone-800 hover:bg-[#1a1614]' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'}`}
            aria-label="Close receipt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm max-h-[60vh] overflow-y-auto horizontal-scrollbar-thin">
          {/* Info - DENGAN ORDER TYPE */}
          <div className={`space-y-1 text-xs ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
            <div>{formatDate(transaction.date)}</div>
            
            {/* ✅ TAMBAH: Order Type */}
            {transaction.orderType && (
              <div className="flex items-center gap-1">
                <span>Tipe:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
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
                className={`flex justify-between border-b pb-2 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}
              >
                <div className="flex-1">
                  <div className="font-medium text-[#0F172A] dark:text-stone-100">
                    {item.note || 'Product'} {item.description && <span className="font-normal italic text-xs opacity-75">- {item.description}</span>}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>
                    {item.quantity} × {format(item.price)}
                  </div>
                </div>
                <div className="text-right font-semibold text-[#0F172A] dark:text-stone-100">
                  {format(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className={`pt-3 space-y-1 border-t ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
            <div className="flex justify-between text-xs text-[#475569] dark:text-stone-400">
              <span>Subtotal</span>
              <span>{format(transaction.subtotal || transaction.total)}</span>
            </div>

            {(transaction.tax !== undefined && transaction.tax > 0) && (
              <div className="flex justify-between text-xs text-[#475569] dark:text-stone-400">
                <span>{settings?.tax_label || 'Pajak'} ({transaction.taxRate || 0}%)</span>
                <span>{format(transaction.tax)}</span>
              </div>
            )}

            {(transaction.service_charge !== undefined && transaction.service_charge > 0) && (
              <div className="flex justify-between text-xs text-[#475569] dark:text-stone-400">
                <span>{settings?.service_charge_label || 'Service'}</span>
                <span>{format(transaction.service_charge)}</span>
              </div>
            )}

            <div className="flex justify-between font-black pt-1 text-base border-t border-dashed mt-1 border-[#E2E8F0] dark:border-stone-800 text-[#0F172A] dark:text-white">
              <span>Total</span>
              <span>{format(transaction.total)}</span>
            </div>

            <div className={`pt-2 text-xs ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>
              Pembayaran: {transaction.paymentMethod?.toUpperCase()}
            </div>

            {transaction.paymentMethod === 'cash' &&
              transaction.cashReceived && (
                <>
                  <div className="flex justify-between text-xs text-[#475569] dark:text-stone-400">
                    <span>Tunai</span>
                    <span>
                      {format(transaction.cashReceived)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#475569] dark:text-stone-400">
                    <span>Kembali</span>
                    <span>
                      {format(transaction.change || 0)}
                    </span>
                  </div>
                </>
              )}

            {/* Footer */}
            {settings?.receipt_footer && (
              <div className="pt-6 text-center">
                <p className={`text-[10px] italic leading-relaxed ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
                  {settings.receipt_footer}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={`p-4 border-t flex gap-2 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <button
            onClick={copyReceipt}
            className={`flex-1 py-3 text-xs rounded-xl border font-bold transition-all ${isDark ? 'border-stone-800 hover:bg-[#1a1614]' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
          >
            Copy
          </button>
          <button
            onClick={onPrint}
            className={`flex-1 py-3 text-xs rounded-xl border font-bold transition-all ${isDark ? 'border-stone-800 hover:bg-[#1a1614]' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}