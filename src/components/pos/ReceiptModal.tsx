import { X, Copy, Printer } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Transaction } from '../../types';

interface ReceiptTransaction extends Transaction {
  customerName?: string;
  tableNumber?: string;
  orderType?: 'dine-in' | 'take-away'; // ✅ TAMBAH INI
  cashReceived?: number;
  change?: number;
  taxRate?: number;
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
  const isDark = theme === 'dark';

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const subtotal = transaction.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const taxAmount = transaction.taxRate
    ? subtotal * (transaction.taxRate / 100)
    : 0;

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

    const text = `
RECEIPT
ID: ${transaction.id}
Tanggal: ${formatDate(transaction.date)}
${orderTypeInfo}Pelanggan: ${transaction.customerName || 'Walk-in'}
${tableInfo}
${transaction.items
  .map(
    i =>
      `${i.quantity}x ${i.note || 'Item'} - Rp ${(i.price * i.quantity).toLocaleString()}`
  )
  .join('\n')}

Subtotal: Rp ${subtotal.toLocaleString()}
${taxAmount > 0 ? `Pajak: Rp ${taxAmount.toLocaleString()}` : ''}
TOTAL: Rp ${transaction.total.toLocaleString()}
Pembayaran: ${transaction.paymentMethod?.toUpperCase()}
`.trim();

    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full max-w-sm rounded-xl shadow-lg ${
          isDark
            ? 'bg-gray-900 text-gray-100 border border-gray-700'
            : 'bg-white text-gray-900 border border-gray-200'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold">Receipt</h2>
            <p className="text-xs text-gray-500">#{transaction.id}</p>
          </div>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
          {/* Info - DENGAN ORDER TYPE */}
          <div className="space-y-1 text-xs text-gray-500">
            <div>{formatDate(transaction.date)}</div>
            
            {/* ✅ TAMBAH: Order Type */}
            {transaction.orderType && (
              <div className="flex items-center gap-1">
                <span>Tipe:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  transaction.orderType === 'take-away'
                    ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                    : isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'
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
                <div className="text-gray-400 italic">Take Away</div>
              )
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {transaction.items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between border-b pb-1 border-gray-200 dark:border-gray-700"
              >
                <div>
                  <div className="font-medium">
                    {item.note || 'Product'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.quantity} × Rp {item.price.toLocaleString()}
                  </div>
                </div>
                <div>
                  Rp {(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-3 space-y-1 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>Rp {subtotal.toLocaleString()}</span>
            </div>

            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Pajak</span>
                <span>Rp {taxAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between font-semibold pt-1">
              <span>Total</span>
              <span>Rp {transaction.total.toLocaleString()}</span>
            </div>

            <div className="pt-2 text-xs text-gray-500">
              Pembayaran: {transaction.paymentMethod?.toUpperCase()}
            </div>

            {transaction.paymentMethod === 'cash' &&
              transaction.cashReceived && (
                <>
                  <div className="flex justify-between text-xs">
                    <span>Tunai</span>
                    <span>
                      Rp {transaction.cashReceived.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Kembali</span>
                    <span>
                      Rp {transaction.change?.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={copyReceipt}
            className="flex-1 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-600"
          >
            Copy
          </button>
          <button
            onClick={onPrint}
            className="flex-1 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-600"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}