import { X } from 'lucide-react';
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
      `${i.quantity}x ${i.note || 'Item'} - ${i.price * i.quantity}`
  )
  .join('\n')}

TOTAL: ${transaction.total}
Pembayaran: ${transaction.paymentMethod?.toUpperCase()}
`.trim();

    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div
        className={`w-full max-w-sm rounded-3xl shadow-2xl border ${
          isDark
            ? 'bg-slate-900/80 text-slate-100 border-slate-800'
            : 'bg-white/80 text-slate-900 border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h2 className="text-sm font-black">Receipt</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>#{transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-3xl border ${isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
            aria-label="Close receipt"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
          {/* Info - DENGAN ORDER TYPE */}
          <div className={`space-y-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <div>{formatDate(transaction.date)}</div>
            
            {/* ✅ TAMBAH: Order Type */}
            {transaction.orderType && (
              <div className="flex items-center gap-1">
                <span>Tipe:</span>
                <span className={`px-2 py-0.5 rounded-3xl text-[10px] font-black border ${
                  transaction.orderType === 'take-away'
                    ? isDark ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
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
                <div className="text-gray-400 italic">Take Away</div>
              )
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {transaction.items.map((item, i) => (
              <div
                key={i}
                className={`flex justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
              >
                <div>
                  <div className="font-medium">
                    {item.note || 'Product'}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.quantity} × {item.price}
                  </div>
                </div>
                <div>
                  {item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className={`pt-3 space-y-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex justify-between font-semibold pt-1">
              <span>Total</span>
              <span>{transaction.total}</span>
            </div>

            <div className={`pt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Pembayaran: {transaction.paymentMethod?.toUpperCase()}
            </div>

            {transaction.paymentMethod === 'cash' &&
              transaction.cashReceived && (
                <>
                  <div className="flex justify-between text-xs">
                    <span>Tunai</span>
                    <span>
                      {transaction.cashReceived}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Kembali</span>
                    <span>
                      {transaction.change || 0}
                    </span>
                  </div>
                </>
              )}
          </div>
        </div>

        {/* Actions */}
        <div className={`p-4 border-t flex gap-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={copyReceipt}
            className={`flex-1 py-3 text-xs rounded-3xl border font-black ${isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            Copy
          </button>
          <button
            onClick={onPrint}
            className={`flex-1 py-3 text-xs rounded-3xl border font-black ${isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}