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
      return { cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', label: 'Selesai' };
    if (t.status === 'pending_void')
      return {
        cls: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200',
        label: 'Menunggu Persetujuan Void',
      };
    return { cls: 'bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-200', label: 'Dibatalkan' };
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
        className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        role="presentation"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto horizontal-scrollbar-thin rounded-3xl border shadow-2xl ${
            isDark ? 'border-stone-800 bg-stone-900 text-stone-100' : 'border-stone-200 bg-white text-stone-900'
          }`}
        >
          <div className={`sticky top-0 z-10 flex items-start justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800 bg-stone-950/90' : 'border-stone-200 bg-white'}`}>
            <div>
              <h2 className="text-xl font-black">Detail Transaksi</h2>
              <p className="mt-1 font-mono text-xs opacity-75 break-all">{t.id}</p>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${b.cls}`}>{b.label}</span>
            </div>
            <button type="button" aria-label="Tutup" onClick={onClose} className="rounded-2xl border border-transparent p-2 hover:bg-stone-100 dark:hover:bg-stone-800">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6 px-6 py-5">
            <section>
              <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-amber-500">Info Transaksi</h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className={`rounded-3xl border p-4 ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
                  <dt className="opacity-60">Tanggal &amp; Waktu</dt>
                  <dd className="mt-1 font-semibold">{fmtWIB(t.created_at)}</dd>
                </div>
                <div className={`rounded-3xl border p-4 ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
                  <dt className="opacity-60">Kasir</dt>
                  <dd className="mt-1 font-semibold">{t.cashier_name || '-'}</dd>
                </div>
                <div className={`rounded-3xl border p-4 ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
                  <dt className="opacity-60">Pelanggan</dt>
                  <dd className="mt-1 font-semibold">{t.customer_name?.trim() || 'Umum'}</dd>
                </div>
                <div className={`rounded-3xl border p-4 ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
                  <dt className="opacity-60">Tipe Order</dt>
                  <dd className="mt-1 font-semibold">
                    {dine ? `Dine-in (Meja ${t.table_number?.trim() || '-'})` : 'Take-away'}
                  </dd>
                </div>
                <div className={`rounded-3xl border p-4 sm:col-span-2 ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
                  <dt className="opacity-60">Metode Bayar</dt>
                  <dd className="mt-1 font-semibold">{t.payment_method}</dd>
                </div>
                {t.notes && (
                  <div className={`rounded-3xl border p-4 sm:col-span-2 ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
                    <dt className="opacity-60">Catatan Pesanan</dt>
                    <dd className="mt-1 font-semibold whitespace-pre-wrap">{t.notes}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-amber-500">Detail Produk</h3>
              <div className={`overflow-hidden rounded-3xl border ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                <table className="w-full text-sm">
                  <thead className={isDark ? 'bg-stone-950 text-stone-400' : 'bg-stone-50 text-stone-600'}>
                    <tr>
                      <th className="px-4 py-3 text-left">Produk</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="hidden px-4 py-3 text-right sm:table-cell">Harga Satuan</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(t.items || []).map((it, i) => (
                      <tr key={i} className={`border-t ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
                        <td className="px-4 py-3 font-semibold">{it.product_name} {it.notes && <span className="font-normal italic opacity-80">- {it.notes}</span>}</td>
                        <td className="px-4 py-3 text-center">{it.quantity}</td>
                        <td className="hidden px-4 py-3 text-right font-mono sm:table-cell">{format(it.unit_price)}</td>
                        <td className="px-4 py-3 text-right font-mono">{format(Number(it.subtotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={`mt-4 space-y-2 rounded-3xl border p-5 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-stone-50'}`}>
                <div className="flex justify-between">
                  <span className="opacity-70">Subtotal</span>
                  <span className="font-mono font-semibold">{format(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon</span>
                    <span className="font-mono">- {format(discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-lg font-black">
                  <span>Total</span>
                  <span className="font-mono text-amber-500">{format(total)}</span>
                </div>
                {isCash ? (
                  <>
                    <div className="flex justify-between">
                      <span className="opacity-70">Bayar</span>
                      <span className="font-mono">{format(Number(t.amount_paid ?? total))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Kembalian</span>
                      <span className="font-mono">{format(Number(t.change_amount ?? 0))}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </section>

            {t.status !== 'completed' ? (
              <section className={`rounded-3xl border p-4 ${isDark ? 'border-yellow-900/40 bg-yellow-950/20' : 'border-yellow-200 bg-yellow-50'}`}>
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-yellow-700 dark:text-yellow-400">Informasi Pembatalan</h3>
                {t.status === 'pending_void' ? (
                  <>
                    <p className="text-sm">
                      <strong>Alasan Void:</strong> {t.void_reason || '-'}
                    </p>
                    <p className="mt-2 text-sm">
                      <strong>Diajukan pada:</strong> {t.void_requested_at ? fmtWIB(t.void_requested_at) : '-'}
                    </p>
                    <p className="mt-2 text-sm font-semibold">Status: Menunggu persetujuan owner</p>
                  </>
                ) : t.status === 'voided' ? (
                  <>
                    <p className="text-sm">
                      <strong>Alasan Void:</strong> {t.void_reason || '-'}
                    </p>
                    <p className="mt-2 text-sm">
                      <strong>Diajukan:</strong> {t.void_requested_at ? fmtWIB(t.void_requested_at) : '-'}
                    </p>
                    <p className="mt-2 text-sm">
                      <strong>Disetujui:</strong> {t.void_reviewed_at ? fmtWIB(t.void_reviewed_at) : '-'}
                    </p>
                    <p className="mt-2 text-sm">
                      <strong>Catatan Owner:</strong> {t.void_review_note || '—'}
                    </p>
                  </>
                ) : null}
              </section>
            ) : null}

            {t.status === 'completed' && t.void_review_note?.trim() ? (
              <section className={`rounded-3xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-white'}`}>
                <p className="text-sm">
                  <strong>Catatan Owner:</strong> {t.void_review_note}
                </p>
              </section>
            ) : null}

            <div className="flex flex-wrap gap-3 pb-8">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-3xl border border-amber-500/50 bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600"
              >
                Cetak Struk
              </button>
              {userRole === 'cashier' && t.status === 'completed' ? (
                <button
                  type="button"
                  onClick={() => onVoidRequest?.()}
                  className="rounded-3xl border border-red-400 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Ajukan Pembatalan
                </button>
              ) : null}
              {userRole === 'owner' && t.status === 'pending_void' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onVoidReject?.()}
                    className="rounded-3xl border border-red-400 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() => onVoidApprove?.()}
                    className="rounded-3xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700"
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
