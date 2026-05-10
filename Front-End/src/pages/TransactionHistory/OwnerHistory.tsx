import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import TransactionDetailModal from '../../components/transactions/TransactionDetailModal';
import VoidReviewModal from '../../components/transactions/VoidReviewModal';
import type { HistoryTransaction, TransactionsListResponse, TxSummaryMonth, TxSummaryToday } from '../../types/historyTransaction';
import type { CreatedCashier } from '../../components/users/AddCashierModal';
import { appApi, ApiError } from '../../services/appApi';
import { Loader2, Search, Download, AlertTriangle } from 'lucide-react';

function itemSummary(t: HistoryTransaction): string {
  return (
    (t.items || [])
      .slice(0, 2)
      .map((it) => `${it.product_name} ×${it.quantity}`)
      .join(', ') || '—'
  );
}

function statusLabel(s: HistoryTransaction['status']): string {
  if (s === 'completed') return 'Selesai';
  if (s === 'pending_void') return 'Pending Void';
  return 'Dibatalkan';
}

function statusChip(s: HistoryTransaction['status'], dark: boolean): string {
  if (s === 'completed') return dark ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-800';
  if (s === 'pending_void') return dark ? 'bg-yellow-500/15 text-yellow-200' : 'bg-yellow-100 text-yellow-900';
  return dark ? 'bg-red-500/15 text-red-300' : 'bg-red-100 text-red-700';
}

function downloadCsv(filename: string, rows: string[][]): void {
  const esc = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const body = rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Inner() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const { ToastComponent, showToast } = useToast();
  const pendingBannerRef = useRef<HTMLDivElement | null>(null);

  const [todaySumm, setTodaySumm] = useState<TxSummaryToday | null>(null);
  const [monthSumm, setMonthSumm] = useState<TxSummaryMonth | null>(null);
  const [pendingList, setPendingList] = useState<HistoryTransaction[]>([]);
  const [cashiers, setCashiers] = useState<CreatedCashier[]>([]);

  const today = useMemo(() => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }), []);
  const monthStart = useMemo(() => {
    const parts = today.split('-');
    const y = parts[0]!;
    const m = parts[1]!;
    return `${y}-${m}-01`;
  }, [today]);

  const [df, setDf] = useState(monthStart);
  const [dt, setDt] = useState(today);
  const [search, setSearch] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [status, setStatus] = useState<'all' | HistoryTransaction['status']>('all');
  const [pay, setPay] = useState('');

  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);

  const [rows, setRows] = useState<HistoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [summLoading, setSummLoading] = useState(true);

  const [detail, setDetail] = useState<HistoryTransaction | null>(null);
  const [review, setReview] = useState<{ t: HistoryTransaction; action: 'approve' | 'reject' } | null>(null);

  const loadSummaries = useCallback(async () => {
    setSummLoading(true);
    try {
      const qt = '?scope=today';
      const qm = '?scope=month';
      const cashierQ = cashierId ? `&cashier_id=${encodeURIComponent(cashierId)}` : '';
      const [tRes, mRes, vRes, cRes] = await Promise.all([
        appApi.get<TxSummaryToday>(`/transactions/summary${qt}${cashierQ}`),
        appApi.get<TxSummaryMonth>(`/transactions/summary${qm}${cashierQ}`),
        appApi.get<{ data: HistoryTransaction[]; total: number }>(`/transactions/void-requests`),
        appApi.get<CreatedCashier[]>(`/users`),
      ]);
      setTodaySumm(tRes);
      setMonthSumm(mRes);
      setPendingList(vRes.data);
      setCashiers(Array.isArray(cRes) ? cRes : []);
    } catch {
      showToast('Gagal memuat ringkasan', 'error');
    } finally {
      setSummLoading(false);
    }
  }, [cashierId, showToast]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('page', String(page));
      q.set('limit', String(limit));
      q.set('sort', 'desc');
      if (df) q.set('date_from', df);
      if (dt) q.set('date_to', dt);
      if (cashierId) q.set('cashier_id', cashierId);
      if (status !== 'all') q.set('status', status);
      if (pay.trim()) q.set('payment_method', pay.trim().toLowerCase());
      if (search.trim()) q.set('q', search.trim());

      const res = await appApi.get<TransactionsListResponse>(`/transactions?${q.toString()}`);
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal memuat.';
      showToast(msg, 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, df, dt, cashierId, status, pay, search, showToast]);

  useEffect(() => void loadSummaries(), [loadSummaries]);
  useEffect(() => void loadRows(), [loadRows]);

  useEffect(() => {
    setPage(1);
  }, [df, dt, cashierId, status, pay, search]);

  const scrollPending = () => pendingBannerRef.current?.scrollIntoView({ behavior: 'smooth' });

  const exportCsv = async () => {
    try {
      const q = new URLSearchParams();
      q.set('page', '1');
      q.set('limit', '5000');
      q.set('sort', 'desc');
      if (df) q.set('date_from', df);
      if (dt) q.set('date_to', dt);
      if (cashierId) q.set('cashier_id', cashierId);
      if (status !== 'all') q.set('status', status);
      if (pay.trim()) q.set('payment_method', pay.trim());
      const res = await appApi.get<TransactionsListResponse>(`/transactions?${q.toString()}`);
      const head = [['ID', 'Waktu', 'Kasir', 'Pelanggan', 'Items', 'Subtotal', 'Diskon', 'Total', 'Metode', 'Status']];
      const body = res.data.map((t) => {
        const iso = new Date(t.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const disc = String(t.discount_amount ?? 0);
        const sub = String(t.subtotal ?? 0);
        return [
          t.id,
          iso,
          String(t.cashier_name ?? ''),
          String(t.customer_name ?? 'Umum'),
          itemSummary(t),
          sub,
          disc,
          String(t.total_amount),
          String(t.raw_payment_method || t.payment_method),
          statusLabel(t.status),
        ];
      });
      const fname = `transaksi_${df}_${dt}.csv`;
      downloadCsv(fname, [...head, ...body]);
      showToast('CSV diunduh', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Export gagal', 'error');
    }
  };

  return (
    <>
      {ToastComponent}
      <div className={`mx-auto max-w-[1200px] animate-in fade-in pb-20 ${dark ? 'text-white' : 'text-stone-900'}`}>
        <header className="mb-8">
          <h1 className="text-3xl font-black">Riwayat Transaksi</h1>
          <p className={`mt-1 text-sm ${dark ? 'text-stone-400' : 'text-stone-600'}`}>Filter lengkap untuk semua transaksi di toko Anda</p>
        </header>

        {summLoading ? (
          <div className="mb-8 py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                { k: 'Total Transaksi Hari Ini', v: todaySumm?.today_count ?? 0, num: true as const },
                {
                  k: 'Penjualan Hari Ini',
                  v: `Rp${(todaySumm?.today_sales ?? 0).toLocaleString('id-ID')}`,
                  num: false as const,
                },
                {
                  k: 'Pending Void',
                  v: pendingList.length,
                  num: true as const,
                  onClick: pendingList.length ? scrollPending : undefined,
                  amber: pendingList.length > 0,
                },
                { k: 'Total Transaksi Bulan Ini', v: monthSumm?.month_count ?? 0, num: true as const },
              ] as const
            ).map((c) => {
              const cls = `rounded-3xl border px-6 py-5 text-left shadow-sm transition ${
                dark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'
              } ${'onClick' in c && c.onClick ? 'cursor-pointer hover:border-amber-500/60' : ''} ${'amber' in c && c.amber ? 'ring-2 ring-amber-500/50' : ''}`;
              const inner = (
                <>
                  <p className={`text-xs font-black uppercase tracking-wider ${dark ? 'text-stone-500' : 'text-stone-500'}`}>{c.k}</p>
                  <p className="mt-2 text-2xl font-black text-amber-500">{c.num ? (c.v as number).toLocaleString('id-ID') : String(c.v)}</p>
                </>
              );
              if ('onClick' in c && c.onClick) {
                return (
                  <button key={c.k} type="button" className={`${cls} w-full text-left`} onClick={c.onClick}>
                    {inner}
                  </button>
                );
              }
              return (
                <div key={c.k} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        )}

        {pendingList.length > 0 ? (
          <div
            ref={pendingBannerRef}
            className={`mb-8 rounded-3xl border px-5 py-4 ${dark ? 'border-yellow-800 bg-yellow-950/30 text-yellow-100' : 'border-yellow-300 bg-yellow-50 text-yellow-950'}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-bold">{pendingList.length} transaksi menunggu persetujuan void</p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {pendingList.map((p) => (
                <div key={p.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 ${dark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-white'}`}>
                  <div>
                    <p className="font-mono text-xs opacity-60">{p.id.slice(0, 8)}…</p>
                    <p className="text-sm">{p.cashier_name} • Rp{p.total_amount.toLocaleString('id-ID')}</p>
                  </div>
                  <button type="button" onClick={() => setDetail(p)} className="rounded-3xl border border-amber-500 px-4 py-2 text-xs font-black uppercase hover:bg-amber-500 hover:text-white">
                    Tinjau
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className={`mb-8 space-y-4 rounded-3xl border p-6 ${dark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-black uppercase opacity-70">
              Dari
              <input type="date" value={df} onChange={(e) => setDf(e.target.value)} className={`mt-1 w-full rounded-3xl border px-4 py-2 ${dark ? 'border-stone-800 bg-stone-950 text-white' : 'border-stone-200 bg-white'}`} />
            </label>
            <label className="text-xs font-black uppercase opacity-70">
              Sampai
              <input type="date" value={dt} onChange={(e) => setDt(e.target.value)} className={`mt-1 w-full rounded-3xl border px-4 py-2 ${dark ? 'border-stone-800 bg-stone-950 text-white' : 'border-stone-200 bg-white'}`} />
            </label>
            <label className="text-xs font-black uppercase opacity-70 md:col-span-2">
              Kasir
              <select value={cashierId} onChange={(e) => setCashierId(e.target.value)} className={`mt-1 w-full rounded-3xl border px-4 py-2 ${dark ? 'border-stone-800 bg-stone-950 text-white' : 'border-stone-200 bg-white'}`}>
                <option value="">Semua kasir</option>
                {cashiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${dark ? 'text-stone-600' : 'text-stone-400'}`} />
            <input
              placeholder="Pelanggan atau ID transaksi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full rounded-3xl border py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500/40 ${dark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-stone-50'}`}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {(['all', 'completed', 'pending_void', 'voided'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setStatus(k === 'all' ? 'all' : k)}
                className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${
                  k === 'all' ? status === 'all' : status === k
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : dark
                      ? 'border-stone-700 text-stone-300'
                      : 'border-stone-200 text-stone-700'
                }`}
              >
                {k === 'all' ? 'Semua' : k === 'completed' ? 'Selesai' : k === 'pending_void' ? 'Menunggu Void' : 'Dibatalkan'}
              </button>
            ))}
            <select
              value={pay}
              onChange={(e) => setPay(e.target.value)}
              className={`rounded-3xl border px-4 py-2 text-sm font-semibold ${dark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-white'}`}
            >
              <option value="">Semua pembayaran</option>
              <option value="cash">Cash</option>
              <option value="qris">QRIS</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
            </select>
            <button type="button" onClick={() => void exportCsv()} className="ml-auto rounded-3xl border border-amber-500 px-6 py-2 text-sm font-bold text-amber-600 hover:bg-amber-500 hover:text-white dark:text-amber-400">
              <Download className="mr-2 inline h-4 w-4 -translate-y-px" /> Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-amber-500" />
          </div>
        ) : rows.length === 0 ? (
          <div className={`rounded-3xl border py-24 text-center ${dark ? 'border-stone-800' : 'border-stone-200'}`}>
            <p className="font-bold">Belum ada data transaksi untuk filter ini</p>
          </div>
        ) : (
          <>
            <div className={`hidden overflow-hidden rounded-3xl border md:block ${dark ? 'border-stone-800' : 'border-stone-200'}`}>
              <table className="w-full border-collapse text-left text-sm">
                <thead className={dark ? 'bg-stone-950 text-stone-400' : 'bg-stone-50 text-stone-600'}>
                  <tr>
                    <th className="px-5 py-4">Waktu</th>
                    <th className="px-5 py-4">Kasir</th>
                    <th className="px-5 py-4">Pelanggan</th>
                    <th className="px-5 py-4">Items</th>
                    <th className="px-5 py-4">Metode</th>
                    <th className="px-5 py-4 text-right">Total</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className={`border-t ${dark ? 'border-stone-900' : 'border-stone-100'}`}>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs">
                        {new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                      </td>
                      <td className="px-5 py-3">{t.cashier_name}</td>
                      <td className="max-w-[120px] truncate px-5 py-3">{t.customer_name || 'Umum'}</td>
                      <td className="max-w-[200px] truncate px-5 py-3 text-xs opacity-90">{itemSummary(t)}</td>
                      <td className="px-5 py-3 text-xs font-bold">{String(t.payment_method)}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-amber-500">Rp{t.total_amount.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${statusChip(t.status, dark)}`}>{statusLabel(t.status)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <button type="button" onClick={() => setDetail(t)} className="text-xs font-black uppercase text-amber-600">
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {rows.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDetail(t)}
                  className={`w-full rounded-3xl border p-5 text-left ${dark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] opacity-70">{t.id.slice(0, 8)}</p>
                      <p className="mt-1 font-bold">{t.cashier_name}</p>
                      <p className="text-sm opacity-80">{t.customer_name || 'Umum'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black ${statusChip(t.status, dark)}`}>{statusLabel(t.status)}</span>
                  </div>
                  <p className="my-3 text-xs opacity-80">{itemSummary(t)}</p>
                  <div className="flex items-center justify-between border-t pt-3 dark:border-stone-800">
                    <span className="text-xs font-bold">{String(t.payment_method)}</span>
                    <span className="font-mono font-black text-amber-500">Rp{t.total_amount.toLocaleString('id-ID')}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {total > limit ? (
          <div className="mt-8 flex justify-center gap-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
              className="rounded-3xl border px-6 py-2 text-sm font-bold disabled:opacity-40 dark:border-stone-700"
            >
              Sebelumnya
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              type="button"
              className="rounded-3xl border px-6 py-2 text-sm font-bold disabled:opacity-40 dark:border-stone-700"
            >
              Berikutnya
            </button>
          </div>
        ) : null}
      </div>

      {detail ? (
        <TransactionDetailModal
          transaction={detail}
          userRole="owner"
          shop={{ name: user?.shop?.name || 'Toko', address: undefined, phone: undefined }}
          onVoidApprove={() => setReview({ t: detail, action: 'approve' })}
          onVoidReject={() => setReview({ t: detail, action: 'reject' })}
          onClose={() => setDetail(null)}
        />
      ) : null}

      {review ? (
        <VoidReviewModal
          transaction={review.t}
          action={review.action}
          onClose={() => setReview(null)}
          onToast={showToast}
          onSuccess={() => {
            setReview(null);
            setDetail(null);
            void loadRows();
            void loadSummaries();
          }}
        />
      ) : null}
    </>
  );
}

export default function OwnerHistory() {
  return (
    <ErrorBoundary>
      <Inner />
    </ErrorBoundary>
  );
}
