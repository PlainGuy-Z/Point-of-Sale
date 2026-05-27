import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import type { Transaction } from '../../types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { buildReceipt, receiptToIntentUrl } from '../../utils/escpos';

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
  onPrint,
}: ReceiptModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  const { formatDateTime } = useDateFormatter();
  const { settings } = useSettings();

  const formatDateString = (date: Date) => formatDateTime(date);

  const getOrderTypeLabel = () => {
    if (transaction.orderType === 'dine-in') return 'Dine In';
    if (transaction.orderType === 'take-away') return 'Take Away';
    // Fallback jika tidak ada orderType
    return transaction.tableNumber ? 'Dine In' : 'Take Away';
  };

  // ✅ TAMBAH: Tampilkan table number hanya jika dine-in
  const shouldShowTable = transaction.orderType === 'dine-in' && transaction.tableNumber;

  const copyReceipt = () => {
    const storeName = settings?.shop_name || 'STORE';
    const storeAddress = settings?.address ? `\n${settings.address}` : '';

    const orderTypeInfo = transaction.orderType 
      ? `Tipe: ${getOrderTypeLabel()}\n`
      : '';
    
    const tableInfo = shouldShowTable
      ? `Meja: ${transaction.tableNumber}\n`
      : '';

    const customerInfo = transaction.customerName ? `Pelanggan: ${transaction.customerName}\n` : '';
    const notesInfo = transaction.notes ? `Catatan Pesanan: ${transaction.notes}\n` : '';

    const itemsText = transaction.items
      .map(i => {
        let line = `${i.quantity}x ${i.note || i.name || 'Item'} - ${format(i.price * i.quantity)}`;
        if (i.variantName) {
          line += `\n   + ${i.variantName} (${format(i.variantPrice || 0)})`;
        }
        if (i.description) {
          line += `\n   Catatan: ${i.description}`;
        }
        return line;
      })
      .join('\n');

    const text = `
=== ${storeName.toUpperCase()} ===${storeAddress}
--------------------------------
ID: ${transaction.id?.substring(0,8) || 'N/A'}
Tanggal: ${formatDateString(transaction.date)}
${orderTypeInfo}${tableInfo}${customerInfo}${notesInfo}--------------------------------
${itemsText}
--------------------------------
SUBTOTAL: ${format(transaction.subtotal || transaction.total)}
TOTAL: ${format(transaction.total)}
Pembayaran: ${transaction.paymentMethod?.toUpperCase()}
`.trim();

    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print-backdrop">
      
      {/* ── Style Khusus Print ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-receipt-area, .print-receipt-area * {
            visibility: visible;
            color: black !important;
          }
          .print-receipt-area {
            position: absolute;
            left: 0;
            top: 0;
            width: ${settings?.receipt_paper_size || '58mm'};
            margin: 0;
            padding: 0;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            font-family: ui-monospace, monospace;
          }
          /* FIX: Hapus batasan tinggi agar semua item tercetak lengkap */
          .print-receipt-area,
          .print-receipt-area * {
            max-height: none !important;
            overflow: visible !important;
          }
          .print-hidden {
            display: none !important;
          }
          /* Matikan border styling di print agar lebih bersih */
          .print-receipt-area .border-t, .print-receipt-area .border-b {
            border-color: black !important;
            border-style: solid !important;
          }
          .print-receipt-area .border-dashed {
            border-style: dashed !important;
          }
          .print-backdrop {
            background: none !important;
            backdrop-filter: none !important;
          }
          @page {
            size: ${settings?.receipt_paper_size || '58mm'} auto;
            margin: 2mm;
          }
        }
      `}</style>

      <div
        className={`print-receipt-area w-full max-w-sm rounded-2xl shadow-2xl border ${
          isDark
            ? 'bg-stone-950 text-stone-100 border-stone-800'
            : 'bg-white text-black border-[#E2E8F0]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 pb-3 border-b text-center relative ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <div className="absolute right-4 top-4 print-hidden">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1a1614] text-stone-400' : 'text-gray-800 hover:bg-gray-200'}`}
              aria-label="Close receipt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className={`text-xl font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>{settings?.shop_name || 'STORE'}</h2>
          {settings?.address && <p className={`text-xs mt-1.5 leading-relaxed font-bold ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>{settings.address}</p>}
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-sm max-h-[65vh] overflow-y-auto horizontal-scrollbar-thin print:max-h-none print:overflow-visible">
          
          {/* Order Info */}
          <div className={`space-y-2 text-xs font-bold ${isDark ? 'text-stone-300' : 'text-black'}`}>
            <div className="flex justify-between">
              <span className={`font-black ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>Receipt ID</span>
              <span className="font-bold">#{transaction.id?.substring(0,8) || 'N/A'}...</span>
            </div>
            <div className="flex justify-between">
              <span className={`font-black ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>Tanggal</span>
              <span className="font-bold">{formatDateString(transaction.date)}</span>
            </div>
            
            {transaction.orderType && (
              <div className="flex justify-between items-center pt-1">
                <span className={`font-black ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>Tipe Pesanan</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                  isDark ? 'bg-amber-900/20 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  {getOrderTypeLabel()}
                </span>
              </div>
            )}
            
            {transaction.customerName && (
              <div className="flex justify-between pt-1">
                <span className={`font-black ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>Pelanggan</span>
                <span className="font-black text-sm">{transaction.customerName}</span>
              </div>
            )}
            
            {shouldShowTable && (
              <div className="flex justify-between pt-1">
                <span className={`font-black ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>Meja</span>
                <span className={`font-black text-base ${isDark ? 'text-white' : 'text-black'}`}>{transaction.tableNumber}</span>
              </div>
            )}

            {transaction.notes && (
              <div className="pt-2">
                <span className={`block mb-0.5 font-black ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>Catatan Pesanan:</span>
                <span className="font-bold italic leading-relaxed">"{transaction.notes}"</span>
              </div>
            )}
          </div>

          <div className={`border-t border-dashed ${isDark ? 'border-stone-700' : 'border-gray-400'}`}></div>

          {/* Items */}
          <div className="space-y-4">
            {transaction.items.map((item, i) => {
              const itemTotal = (item.price + (item.variantPrice || 0)) * item.quantity;
              return (
                <div key={i} className="flex flex-col text-sm">
                  <div className={`flex justify-between font-black ${isDark ? 'text-white' : 'text-black'}`}>
                    <span>{item.quantity}x {item.note || item.name || 'Item'}</span>
                    <span>{format(itemTotal)}</span>
                  </div>
                  
                  {/* Harga Satuan */}
                  <div className={`flex justify-between text-[11px] mt-1 pl-4 font-bold ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>
                    <span>Harga Satuan</span>
                    <span>{format(item.price)}</span>
                  </div>

                  {/* Variant */}
                  {item.variantName && (
                    <div className={`flex justify-between text-xs mt-0.5 pl-4 font-black ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      <span>+ {item.variantName}</span>
                      <span>{format(item.variantPrice || 0)}</span>
                    </div>
                  )}

                  {/* Deskripsi/Catatan Item */}
                  {item.description && (
                    <div className={`text-[11px] italic mt-1 pl-4 leading-relaxed font-bold ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>
                      Catatan: {item.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className={`pt-4 space-y-1.5 border-t border-dashed ${isDark ? 'border-stone-700' : 'border-gray-400'}`}>
            <div className={`flex justify-between text-xs font-bold ${isDark ? 'text-stone-400' : 'text-black'}`}>
              <span>Subtotal</span>
              <span>{format(transaction.subtotal || transaction.total)}</span>
            </div>

            {(transaction.tax !== undefined && transaction.tax > 0) && (
              <div className={`flex justify-between text-xs font-bold ${isDark ? 'text-stone-400' : 'text-black'}`}>
                <span>{settings?.tax_label || 'Pajak'} ({transaction.taxRate || 0}%)</span>
                <span>{format(transaction.tax)}</span>
              </div>
            )}

            {(transaction.service_charge !== undefined && transaction.service_charge > 0) && (
              <div className={`flex justify-between text-xs font-bold ${isDark ? 'text-stone-400' : 'text-black'}`}>
                <span>{settings?.service_charge_label || 'Service'}</span>
                <span>{format(transaction.service_charge)}</span>
              </div>
            )}

            <div className={`flex justify-between font-black pt-1 text-base border-t border-dashed mt-1 ${isDark ? 'border-stone-800 text-white' : 'border-gray-400 text-black'}`}>
              <span>Total</span>
              <span>{format(transaction.total)}</span>
            </div>

            <div className={`pt-2 text-xs font-black ${isDark ? 'text-stone-400' : 'text-black'}`}>
              Pembayaran: {transaction.paymentMethod?.toUpperCase()}
            </div>

            {transaction.paymentMethod === 'cash' &&
              transaction.cashReceived !== undefined && transaction.cashReceived > 0 && (
                <>
                  <div className={`flex justify-between text-xs font-bold ${isDark ? 'text-stone-400' : 'text-black'}`}>
                    <span>Tunai</span>
                    <span>
                      {format(transaction.cashReceived)}
                    </span>
                  </div>
                  <div className={`flex justify-between text-xs font-bold ${isDark ? 'text-stone-400' : 'text-black'}`}>
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
                <p className={`text-[10px] italic leading-relaxed font-bold ${isDark ? 'text-stone-400' : 'text-black'}`}>
                  {settings.receipt_footer}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={`p-4 border-t flex gap-2 print-hidden ${isDark ? 'border-stone-800' : 'border-gray-300'}`}>
          <button
            onClick={copyReceipt}
            className={`flex-1 py-3 text-xs rounded-xl border font-bold transition-all ${isDark ? 'border-stone-800 hover:bg-[#1a1614] text-stone-300' : 'bg-white border-gray-400 text-black hover:bg-gray-100 shadow-sm'}`}
          >
            Salin Struk
          </button>
          <button
            onClick={() => {
              const method = settings?.print_method || 'browser';
              console.log('[ReceiptModal] Print clicked, method:', method);

              if (method === 'rawbt_intent') {
                // SYNCHRONOUS — no async/await, preserves user gesture
                try {
                  const receiptContent = buildReceipt({
                    shopName: settings?.shop_name || 'STORE',
                    shopAddress: settings?.address,
                    shopPhone: settings?.phone,
                    cashierName: transaction.cashierName || 'Kasir',
                    transactionId: transaction.id,
                    createdAt: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
                    orderType: transaction.orderType === 'dine-in' ? 'dine_in' : 'takeaway',
                    tableNumber: transaction.tableNumber || undefined,
                    customerName: transaction.customerName || undefined,
                    items: transaction.items.map(it => ({
                      name: it.note || it.name || 'Item',
                      quantity: it.quantity,
                      price: it.price,
                      subtotal: it.price * it.quantity
                    })),
                    subtotal: transaction.subtotal || transaction.total,
                    tax: transaction.tax || 0,
                    taxRate: transaction.taxRate || 0,
                    serviceCharge: transaction.service_charge,
                    grandTotal: transaction.total,
                    paymentMethod: transaction.paymentMethod,
                    amountPaid: transaction.cashReceived || undefined,
                    change: transaction.change || undefined,
                    receiptFooter: settings?.receipt_footer,
                    paperSize: (settings?.receipt_paper_size || '58mm') as '58mm' | '80mm'
                  });
                  const intentUrl = receiptToIntentUrl(receiptContent);
                  console.log('[ReceiptModal] rawbt intent generated, length:', intentUrl.length);
                  // Navigate synchronously — this IS the user click
                  window.location.href = intentUrl;
                  console.log('[ReceiptModal] rawbt intent opened via location.href');
                } catch (err) {
                  console.error('[ReceiptModal] rawbt intent error:', err);
                  alert('Gagal membuat struk untuk RawBT. Periksa console untuk detail.');
                }
              } else if (method === 'browser') {
                console.log('[ReceiptModal] browser print (window.print)');
                window.print();
              } else {
                // rawbt network or other — use the onPrint callback
                if (onPrint) onPrint();
              }
            }}
            className={`flex-1 py-3 text-xs rounded-xl border font-bold transition-all ${isDark ? 'border-amber-500/60 text-amber-500 hover:bg-amber-500 hover:text-stone-900' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm border-teal-700'}`}
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}