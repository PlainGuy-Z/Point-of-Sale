import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddCashierModal, { type CreatedCashier } from '../../components/users/AddCashierModal';
import EditCashierModal, { type CashierUserRow } from '../../components/users/EditCashierModal';
import ResetPasswordModal from '../../components/users/ResetPasswordModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { appApi, ApiError } from '../../services/appApi';
import { Lock, Unlock, MoreHorizontal, Pencil, KeyRound, Loader2, Search, UserRound } from 'lucide-react';
import { Skeleton, SkeletonCard } from '../../components/common/Skeleton';

type StatusFilter = 'all' | 'active' | 'inactive';

function formatCreatedAt(iso: string): string {
    return new Date(iso).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function UserManagementInner() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { showToast, ToastComponent } = useToast();

    const [users, setUsers] = useState<CashierUserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [addOpen, setAddOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<CashierUserRow | null>(null);
    const [resetTarget, setResetTarget] = useState<CashierUserRow | null>(null);
    const [openActionsId, setOpenActionsId] = useState<string | null>(null);
    const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const rows = await appApi.get<CashierUserRow[]>('/users');
            setUsers(rows);
        } catch (err) {
            const msg =
                err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Gagal memuat daftar kasir.';
            showToast(msg, 'error');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        if (!openActionsId) return;
        const onDoc = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenActionsId(null);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [openActionsId]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            if (statusFilter === 'active' && !u.is_active) return false;
            if (statusFilter === 'inactive' && u.is_active) return false;
            if (!q) return true;
            return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        });
    }, [users, search, statusFilter]);

    const totals = useMemo(() => {
        const total = users.length;
        const active = users.filter((u) => u.is_active).length;
        return { total, active, inactive: total - active };
    }, [users]);

    const toggleActive = async (row: CashierUserRow) => {
        setToggleLoadingId(row.id);
        setOpenActionsId(null);
        try {
            const updated = await appApi.put<CashierUserRow>(`/users/${encodeURIComponent(row.id)}`, {
                is_active: !row.is_active,
            });
            setUsers((prev) => prev.map((u) => (u.id === row.id ? updated : u)));
            showToast(row.is_active ? 'Kasir dinonaktifkan.' : 'Kasir diaktifkan kembali.', 'success');
        } catch (err) {
            const msg =
                err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Gagal mengubah status kasir.';
            showToast(msg, 'error');
        } finally {
            setToggleLoadingId(null);
        }
    };

    const statCard = (label: string, value: number) => (
        <div
            className={`rounded-3xl border p-5 shadow-sm ${isDark ? 'border-stone-800 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-900'
                }`}
        >
            <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                {label}
            </p>
            <p className="mt-2 text-3xl font-black text-amber-500">{value}</p>
        </div>
    );

    const filterBtn = (id: StatusFilter, label: string) => (
        <button
            key={id}
            type="button"
            onClick={() => setStatusFilter(id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${statusFilter === id
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : isDark
                        ? 'border border-stone-700 text-stone-300 hover:border-stone-600'
                        : 'border border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
        >
            {label}
        </button>
    );

    return (
        <>
            {ToastComponent}
            <div className="mx-auto max-w-6xl animate-in fade-in duration-500 space-y-6 px-4 pb-10 pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>Manajemen Kasir</h1>
                        <p className={`mt-1 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Kelola akun kasir toko Anda</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-3xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 active:scale-[0.98]"
                    >
                        + Tambah Kasir
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {statCard('Total Kasir', totals.total)}
                    {statCard('Kasir Aktif', totals.active)}
                    {statCard('Kasir Nonaktif', totals.inactive)}
                </div>

                <div
                    className={`flex flex-col gap-4 rounded-3xl border p-5 md:flex-row md:items-center md:justify-between ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'
                        }`}
                >
                    <div className={`relative flex-1 ${isDark ? '' : ''}`}>
                        <Search className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau email..."
                            className={`w-full rounded-3xl border py-3 pl-12 pr-4 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 ${isDark ? 'border-stone-800 bg-stone-950 text-white placeholder:text-stone-600' : 'border-stone-200 bg-stone-50 text-stone-900'
                                }`}
                            aria-label="Cari kasir"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {filterBtn('all', 'Semua')}
                        {filterBtn('active', 'Aktif')}
                        {filterBtn('inactive', 'Nonaktif')}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" rounded="rounded-2xl" />
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <div
                        className={`rounded-3xl border px-8 py-16 text-center ${isDark ? 'border-stone-800 bg-stone-900/40' : 'border-stone-200 bg-white'}`}
                    >
                        <UserRound className={`mx-auto h-14 w-14 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />
                        <p className={`mt-4 font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                            Belum ada kasir. Klik &quot;+ Tambah Kasir&quot; untuk memulai.
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`rounded-3xl border px-8 py-12 text-center ${isDark ? 'border-stone-800 bg-stone-900/40' : 'border-stone-200 bg-white'}`}>
                        <p className={`font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>Tidak ada kasir yang cocok dengan pencarian atau filter Anda.</p>
                    </div>
                ) : (
                    <>
                        <div className={`hidden md:block rounded-3xl border ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`}>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className={`text-left text-xs font-black uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                                        <th className="border-b px-5 py-4">Avatar</th>
                                        <th className="border-b px-5 py-4">Nama & Email</th>
                                        <th className="border-b px-5 py-4">Status</th>
                                        <th className="border-b px-5 py-4">PIN</th>
                                        <th className="border-b px-5 py-4">Dibuat</th>
                                        <th className="border-b px-5 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => (
                                        <tr key={row.id} className={`text-sm ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                                            <td className="align-middle border-t border-stone-200 px-5 py-4 dark:border-stone-800">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 font-black uppercase text-white">
                                                    {row.name.charAt(0)}
                                                </span>
                                            </td>
                                            <td className="border-t border-stone-200 px-5 py-4 dark:border-stone-800">
                                                <p className="font-bold">{row.name}</p>
                                                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>{row.email}</p>
                                            </td>
                                            <td className="border-t border-stone-200 px-5 py-4 dark:border-stone-800">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${row.is_active
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                                        }`}
                                                >
                                                    {row.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="border-t border-stone-200 px-5 py-4 dark:border-stone-800">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${row.pin ? 'bg-green-600/15 text-green-600 dark:text-green-400' : 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300'}`}>
                                                    <Lock className="h-3.5 w-3.5" />
                                                    {row.pin ? 'PIN Aktif' : 'Belum ada PIN'}
                                                </span>
                                            </td>
                                            <td className="border-t border-stone-200 px-5 py-4 text-xs opacity-90 dark:border-stone-800">
                                                {formatCreatedAt(row.created_at)}
                                            </td>
                                            <td className="relative border-t border-stone-200 px-5 py-4 text-right dark:border-stone-800">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenActionsId((id) => (id === row.id ? null : row.id));
                                                    }}
                                                    className="inline-flex rounded-2xl border border-stone-200 p-2 dark:border-stone-700 dark:text-stone-200"
                                                    aria-expanded={openActionsId === row.id}
                                                    aria-haspopup="true"
                                                >
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>
                                                {openActionsId === row.id && (
                                                    <div
                                                        ref={menuRef}
                                                        className={`absolute right-6 top-[calc(100%-0.25rem)] z-[50] mt-2 w-52 overflow-hidden rounded-2xl border shadow-xl ${isDark ? 'border-stone-700 bg-stone-950' : 'border-stone-200 bg-white'}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold hover:bg-stone-100 dark:hover:bg-stone-900`}
                                                            onClick={() => {
                                                                setEditTarget(row);
                                                                setOpenActionsId(null);
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4 text-amber-500" /> Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold hover:bg-stone-100 dark:hover:bg-stone-900`}
                                                            onClick={() => {
                                                                setResetTarget(row);
                                                                setOpenActionsId(null);
                                                            }}
                                                        >
                                                            <KeyRound className="h-4 w-4 text-amber-500" /> Reset Password
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={toggleLoadingId === row.id}
                                                            className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold hover:bg-stone-100 disabled:opacity-50 dark:hover:bg-stone-900`}
                                                            onClick={() => void toggleActive(row)}
                                                        >
                                                            {toggleLoadingId === row.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                                                            ) : row.is_active ? (
                                                                <Unlock className="h-4 w-4 text-red-400" />
                                                            ) : (
                                                                <Lock className="h-4 w-4 text-green-400" />
                                                            )}
                                                            {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-4 md:hidden">
                            {filtered.map((row) => (
                                <div
                                    key={row.id}
                                    className={`rounded-3xl border p-5 shadow-sm ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-lg font-black uppercase text-white">
                                                {row.name.charAt(0)}
                                            </span>
                                            <div>
                                                <p className="font-bold">{row.name}</p>
                                                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>{row.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${row.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                                }`}
                                        >
                                            {row.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${row.pin ? 'bg-green-600/15 text-green-600' : 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300'}`}
                                        >
                                            <Lock className="h-3.5 w-3.5" />
                                            {row.pin ? 'PIN Aktif' : 'Belum ada PIN'}
                                        </span>
                                    </div>
                                    <p className={`mt-3 text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                                        Dibuat: {formatCreatedAt(row.created_at)}
                                    </p>
                                    <div className={`mt-4 flex gap-2 border-t pt-4 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setEditTarget(row)}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-3xl border border-stone-200 py-2 text-sm font-bold dark:border-stone-700 dark:text-white"
                                        >
                                            <Pencil className="h-4 w-4" /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setResetTarget(row)}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-3xl border border-stone-200 py-2 text-sm font-bold dark:border-stone-700 dark:text-white"
                                        >
                                            <KeyRound className="h-4 w-4" /> Reset
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={toggleLoadingId === row.id}
                                        onClick={() => void toggleActive(row)}
                                        className="mt-2 w-full rounded-3xl border border-stone-200 py-2 text-sm font-bold dark:border-stone-700 dark:text-white"
                                    >
                                        {toggleLoadingId === row.id ? 'Menyimpan...' : row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {addOpen && (
                <AddCashierModal
                    onClose={() => setAddOpen(false)}
                    onCreated={(u: CreatedCashier) => {
                        setUsers((prev) => [u, ...prev]);
                        showToast(`Akun kasir ${u.name} berhasil dibuat`, 'success');
                    }}
                />
            )}

            {editTarget && (
                <EditCashierModal
                    cashier={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSaved={(u) => {
                        setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
                        showToast('Perubahan disimpan.', 'success');
                    }}
                />
            )}

            {resetTarget && <ResetPasswordModal cashier={resetTarget} onClose={() => setResetTarget(null)} />}
        </>
    );
}

export default function UserManagementPage() {
    return (
        <ErrorBoundary>
            <UserManagementInner />
        </ErrorBoundary>
    );
}
