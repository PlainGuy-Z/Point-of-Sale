import { X } from 'lucide-react';
import type { HistoryTransaction } from '../../types/historyTransaction';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { usePrint } from '../../hooks/usePrint';
import ReceiptPrint from './ReceiptPrint';

interface Props {
  transaction: HistoryTransaction;
  userRole: 'owner' | 'cashier';
  onClose: () => void;
  onVoidRequest?: () => void;
  onVoidApprove?: () => void;
  onVoidReject?: () => void;
  onPrint?: () => void;
  shop?: { name: string; address?: string; phone?: string };
}

function fmtWIB(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function TransactionDetailModal({
  transaction: t,
  userRole,
  onClose,
  onVoidRequest,
  onVoidApprove,
  onVoidReject,
  onPrint,
  shop,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  const { snap, printReceipt } = usePrint();

  const badgeStatus = (): { cls: string; label: string } => {
    if (t.status === 'completed')
      return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800', label: 'Selesai' };
    if (t.status === 'pending_void')
      return {
        cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800',
        label: 'Menunggu Persetujuan Void',
      };
    return { cls: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/35 dark:text-red-200 dark:border-red-800', label: 'Dibatalkan' };
  };

  const b = badgeStatus();
  const dine = t.order_type === 'takeaway' ? false : true;
  const subtotal = t.subtotal ?? 0;
  const discount = t.discount_amount ?? 0;
  const total = t.total_amount ?? 0;
  const isCash =
    String(t.payment_method).toLowerCase() === 'cash' || String(t.raw_payment_method || '').toLowerCase() === 'cash';

  const handlePrint = () => {
    if (onPrint) onPrint();
    else if (shop) printReceipt(t, shop);
  };

  return (
    <>
      {snap ? <ReceiptPrint transaction={snap.transaction} shopName={snap.shopName} shopAddress={snap.shopAddress} shopPhone={snap.shopPhone} /> : null}
      <div
        className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        role="presentation"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto horizontal-scrollbar-thin rounded-2xl border shadow-2xl ${
            isDark ? 'border-stone-800 bg-stone-900 text-stone-100' : 'border-[#E2E8F0] bg-white text-[#0F172A]'
          }`}
        >
          <div className={`sticky top-0 z-10 flex items-start justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800 bg-stone-950/90' : 'border-[#F1F5F9] bg-white'}`}>
            <div>
              <h2 className="text-xl font-bold">Detail Transaksi</h2>
              <p className={`mt-1 font-mono text-xs opacity-75 break-all ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>#{t.id}</p>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold border ${b.cls}`}>{b.label}</span>
            </div>
            <button type="button" aria-label="Tutup" onClick={onClose} className={`rounded-lg p-2 transition-colors ${isDark ? 'hover:bg-stone-800' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'}`}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6 px-6 py-5">
            <section>
              <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>Info Transaksi</h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className={`rounded-xl border p-4 ${isDark ? 'border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <dt className={`text-xs font-bold uppercase tracking-wider opacity-60 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Tanggal &amp; Waktu</dt>
                  <dd className="mt-1 font-semibold">{fmtWIB(t.created_at)}</dd>
                </div>
                <div className={`rounded-xl border p-4 ${isDark ? 'border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <dt className={`text-xs font-bold uppercase tracking-wider opacity-60 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Kasir</dt>
                  <dd className="mt-1 font-semibold">{t.cashier_name || '-'}</dd>
                </div>
                <div className={`rounded-xl border p-4 ${isDark ? 'border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <dt className={`text-xs font-bold uppercase tracking-wider opacity-60 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Pelanggan</dt>
                  <dd className="mt-1 font-semibold">{t.customer_name?.trim() || 'Umum'}</dd>
                </div>
                <div className={`rounded-xl border p-4 ${isDark ? 'border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <dt className={`text-xs font-bold uppercase tracking-wider opacity-60 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Tipe Order</dt>
                  <dd className="mt-1 font-semibold">
                    {dine ? `Dine-in (Meja ${t.table_number?.trim() || '-'})` : 'Take-away'}
                  </dd>
                </div>
                <div className={`rounded-xl border p-4 sm:col-span-2 ${isDark ? 'border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <dt className={`text-xs font-bold uppercase tracking-wider opacity-60 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Metode Bayar</dt>
                  <dd className="mt-1 font-semibold">{t.payment_method}</dd>
                </div>
                {t.notes && (
                  <div className={`rounded-xl border p-4 sm:col-span-2 ${isDark ? 'border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                    <dt className={`text-xs font-bold uppercase tracking-wider opacity-60 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Catatan Pesanan</dt>
                    <dd className="mt-1 font-semibold whitespace-pre-wrap">{t.notes}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section>
              <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>Detail Produk</h3>
              <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-stone-800' : 'border-[#E2E8F0]'}`}>
                <table className="w-full text-sm">
                  <thead className={isDark ? 'bg-stone-950 text-stone-400' : 'bg-[#F8FAFC] text-[#94A3B8]'}>
                    <tr className="text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Produk</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="hidden px-4 py-3 text-right sm:table-cell">Harga</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-stone-800' : 'divide-[#F1F5F9]'}`}>
                    {(t.items || []).map((it, i) => (
                      <tr key={i} className={`transition-colors ${isDark ? 'text-stone-200' : 'text-[#475569]'}`}>
                        <td className="px-4 py-3 font-semibold">
                          {it.product_name} 
                          {it.notes && <span className={`block text-xs font-normal italic ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>{it.notes}</span>}
                        </td>
                        <td className="px-4 py-3 text-center">{it.quantity}</td>
                        <td className="hidden px-4 py-3 text-right font-medium sm:table-cell">{format(it.unit_price)}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#0F172A] dark:text-white">{format(Number(it.subtotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={`mt-4 space-y-2 rounded-xl border p-5 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
                <div className="flex justify-between text-sm">
                  <span className={`font-bold ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Subtotal</span>
                  <span className="font-bold">{format(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between text-sm text-red-600">
                    <span className="font-bold">Diskon</span>
                    <span className="font-bold">- {format(discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-lg font-black pt-2 border-t border-dashed border-[#E2E8F0] dark:border-stone-800">
                  <span className={isDark ? 'text-white' : 'text-[#0F172A]'}>Total</span>
                  <span className="text-teal-600">{format(total)}</span>
                </div>
                {isCash ? (
                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`opacity-70 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Bayar</span>
                      <span className="font-medium">{format(Number(t.amount_paid ?? total))}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={`opacity-70 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Kembalian</span>
                      <span className="font-medium">{format(Number(t.change_amount ?? 0))}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {t.status !== 'completed' ? (
              <section className={`rounded-xl border p-4 ${isDark ? 'border-amber-900/40 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                <h3 className={`mb-3 text-xs font-black uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Informasi Pembatalan</h3>
                <div className="space-y-2 text-sm">
                  {t.status === 'pending_void' ? (
                    <>
                      <p><span className="font-bold">Alasan Void:</span> {t.void_reason || '-'}</p>
                      <p><span className="font-bold">Diajukan:</span> {t.void_requested_at ? fmtWIB(t.void_requested_at) : '-'}</p>
                      <p className="font-bold text-amber-600">Status: Menunggu persetujuan owner</p>
                    </>
                  ) : t.status === 'voided' ? (
                    <>
                      <p><span className="font-bold">Alasan Void:</span> {t.void_reason || '-'}</p>
                      <p><span className="font-bold">Diajukan:</span> {t.void_requested_at ? fmtWIB(t.void_requested_at) : '-'}</p>
                      <p><span className="font-bold">Disetujui:</span> {t.void_reviewed_at ? fmtWIB(t.void_reviewed_at) : '-'}</p>
                      <p><span className="font-bold">Catatan:</span> {t.void_review_note || '—'}</p>
                    </>
                  ) : null}
                </div>
              </section>
            ) : null}

            <div className="flex flex-wrap gap-3 pb-4">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 min-w-[140px] rounded-xl bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 active:scale-[0.98]"
              >
                Cetak Struk
              </button>
              {userRole === 'cashier' && t.status === 'completed' ? (
                <button
                  type="button"
                  onClick={() => onVoidRequest?.()}
                  className="flex-1 min-w-[140px] rounded-xl border border-[#E2E8F0] bg-white px-6 py-3.5 text-sm font-bold text-red-600 transition-all hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Ajukan Void
                </button>
              ) : null}
              {userRole === 'owner' && t.status === 'pending_void' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onVoidReject?.()}
                    className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-6 py-3.5 text-sm font-bold text-[#475569] transition-all hover:bg-[#F8FAFC]"
                  >
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() => onVoidApprove?.()}
                    className="flex-1 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 active:scale-[0.98]"
                  >
                    Setujui Void
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
