import { useCallback, useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import TransactionDetailModal from '../../components/transactions/TransactionDetailModal';
import VoidRequestModal from '../../components/transactions/VoidRequestModal';
import { appApi, ApiError } from '../../services/appApi';
import type { HistoryTransaction, TransactionsListResponse } from '../../types/historyTransaction';
import { Loader2, Search, ChevronDown, Filter } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';

function itemSummary(t: HistoryTransaction): string {
  return (
    (t.items || [])
      .slice(0, 3)
      .map((it) => `${it.product_name} ×${it.quantity}`)
      .join(', ') || 'Tanpa detail item'
  );
}

function statusBadge(s: HistoryTransaction['status'], isDark: boolean): string {
  if (s === 'completed') return isDark ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-800';
  if (s === 'pending_void') return isDark ? 'bg-yellow-500/15 text-yellow-300' : 'bg-yellow-100 text-yellow-900';
  return isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-100 text-red-800';
}

function statusLabel(s: HistoryTransaction['status']): string {
  if (s === 'completed') return 'Selesai';
  if (s === 'pending_void') return 'Pending Void';
  return 'Dibatalkan';
}

function Inner() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { ToastComponent, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<HistoryTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | HistoryTransaction['status']>('all');
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');

  const [detail, setDetail] = useState<HistoryTransaction | null>(null);
  const [voidTarget, setVoidTarget] = useState<HistoryTransaction | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full' }).format(new Date()),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('sort', sort);
    if (status !== 'all') params.set('status', status);
    if (search.trim()) params.set('q', search.trim());
    try {
      const res = await appApi.get<TransactionsListResponse>(`/transactions?${params.toString()}`);
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal memuat transaksi.';
      showToast(msg, 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, status, search, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status, sort, search]);

  const filtered = rows;

  return (
    <>
      {ToastComponent}
      <div className={`mx-auto max-w-5xl animate-in fade-in pb-16 ${isDark ? 'text-white' : 'text-stone-900'}`}>
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl md:text-3xl font-black">Riwayat Transaksi</h1>
          <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Transaksi Hari Ini — {todayLabel}</p>
        </header>

        <div
          className={`mb-6 rounded-3xl border ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`}
        >
          {/* Collapsible header */}
          <button
            type="button"
            onClick={() => setFiltersOpen(o => !o)}
            className={`w-full flex items-center justify-between p-4 md:hidden ${isDark ? 'text-stone-300' : 'text-stone-700'}`}
          >
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-amber-500" />
              <span className="text-sm font-bold">Filter & Pencarian</span>
            </div>
            <ChevronDown size={16} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className={`space-y-4 p-4 md:p-5 ${filtersOpen ? 'block' : 'hidden md:block'} ${filtersOpen ? 'pt-0 md:pt-5' : ''}`}>
            <div className={`relative flex-1 ${isDark ? '' : ''}`}>
              <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />
              <input
                placeholder="Cari nama pelanggan atau ID transaksi"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full rounded-3xl border py-3 min-h-[44px] pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500/40 ${isDark ? 'border-stone-800 bg-stone-950 text-white' : 'border-stone-200 bg-stone-50'
                  }`}
                aria-label="Cari transaksi"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {(['all', 'completed', 'pending_void', 'voided'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStatus(k === 'all' ? 'all' : k)}
                  className={`rounded-full px-4 py-2.5 min-h-[44px] text-xs font-black uppercase whitespace-nowrap flex-shrink-0 ${(k === 'all' ? status === 'all' : status === k)
                      ? 'bg-amber-500 text-white'
                      : `border ${isDark ? 'border-stone-700 text-stone-300' : 'border-stone-200 text-stone-700'}`
                    }`}
                >
                  {k === 'all' ? 'Semua' : k === 'completed' ? 'Selesai' : k === 'pending_void' ? 'Pending Void' : 'Dibatalkan'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-full px-4 py-2.5 min-h-[44px] text-xs font-bold ${sort === 'desc' ? 'bg-amber-500 text-white' : 'border dark:border-stone-700'}`}
                onClick={() => setSort('desc')}
              >
                Terbaru
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2.5 min-h-[44px] text-xs font-bold ${sort === 'asc' ? 'bg-amber-500 text-white' : 'border dark:border-stone-700'}`}
                onClick={() => setSort('asc')}
              >
                Terlama
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`rounded-3xl border p-5 ${isDark ? 'border-stone-800 bg-stone-900/50' : 'border-stone-200 bg-white'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48 mb-3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className={`rounded-3xl border px-8 py-20 text-center ${isDark ? 'border-stone-800 bg-stone-900/50' : 'border-stone-200 bg-white'}`}
          >
            <p className="font-bold">Belum ada transaksi hari ini</p>
            <p className={`mt-2 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Mulai shift dan proses transaksi di POS</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((t) => (
              <div key={t.id} className={`rounded-3xl border p-5 ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs opacity-60">{t.id.slice(0, 8)}…</p>
                    <p className="mt-2 text-xl font-black">
                      {new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>{t.customer_name?.trim() || 'Umum'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusBadge(t.status, isDark)}`}>{statusLabel(t.status)}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${isDark ? 'border border-stone-700 text-stone-300' : 'border border-stone-300 text-stone-700'
                        }`}
                    >
                      {t.order_type === 'takeaway' ? 'Take-away' : 'Dine-in'}
                    </span>
                  </div>
                </div>
                <p className={`my-4 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>{itemSummary(t)}</p>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 dark:border-stone-800">
                  <span className="text-xs font-bold uppercase text-amber-500">{String(t.payment_method)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-amber-500">
                      Rp{t.total_amount.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetail(t)}
                      className="rounded-3xl border border-amber-500/60 px-4 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-wide hover:bg-amber-500 hover:text-white"
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && total > limit ? (
          <div className="mt-8 flex justify-center gap-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`rounded-3xl border px-6 py-2.5 min-h-[44px] text-sm font-bold disabled:opacity-40 ${isDark ? 'border-stone-700' : 'border-stone-200'}`}
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className={`rounded-3xl border px-6 py-2.5 min-h-[44px] text-sm font-bold disabled:opacity-40 ${isDark ? 'border-stone-700' : 'border-stone-200'}`}
            >
              Berikutnya
            </button>
          </div>
        ) : null}
      </div>

      {detail ? (
        <TransactionDetailModal
          transaction={detail}
          userRole="cashier"
          shop={user?.shop ? { name: user.shop.name } : undefined}
          onVoidRequest={() => setVoidTarget(detail)}
          onClose={() => setDetail(null)}
        />
      ) : null}

      {voidTarget ? (
        <VoidRequestModal
          transaction={voidTarget}
          onClose={() => setVoidTarget(null)}
          onToast={showToast}
          onSuccess={() => {
            setVoidTarget(null);
            setDetail(null);
            void load();
          }}
        />
      ) : null}
    </>
  );
}

export default function CashierHistory() {
  return (
    <ErrorBoundary>
      <Inner />
    </ErrorBoundary>
  );
}
