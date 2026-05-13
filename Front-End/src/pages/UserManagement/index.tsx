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
            className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'border-stone-800 bg-stone-900 text-white' : 'border-[#E2E8F0] bg-white text-[#0F172A]'
                }`}
        >
            <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
                {label}
            </p>
            <p className={`mt-2 text-2xl font-black ${isDark ? 'text-teal-500' : 'text-teal-700'}`}>{value}</p>
        </div>
    );

    const filterBtn = (id: StatusFilter, label: string) => (
        <button
            key={id}
            type="button"
            onClick={() => setStatusFilter(id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${statusFilter === id
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : isDark
                        ? 'border border-stone-700 text-stone-300 hover:border-stone-600'
                        : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                }`}
        >
            {label}
        </button>
    );

    return (
        <>
            {ToastComponent}
            <div className={`min-h-screen ${isDark ? '' : 'bg-[#F8FAFC]'} -m-6 p-6 px-4 pb-10 pt-6`}>
                <div className="mx-auto max-w-6xl animate-in fade-in duration-500 space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Manajemen Kasir</h1>
                            <p className={`mt-1 text-sm ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Kelola akun kasir toko Anda</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAddOpen(true)}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-3xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-[0.98]"
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
                        className={`flex flex-col gap-4 rounded-3xl border p-5 md:flex-row md:items-center md:justify-between ${isDark ? 'border-stone-800 bg-stone-900' : 'border-[#E2E8F0] bg-white shadow-sm'
                            }`}
                    >
                        <div className={`relative flex-1`}>
                            <Search className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-stone-600' : 'text-[#94A3B8]'}`} />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau email..."
                                className={`w-full rounded-3xl border py-3 pl-12 pr-4 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 ${isDark ? 'border-stone-800 bg-stone-950 text-white placeholder:text-stone-600' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]'
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
                            className={`rounded-3xl border px-8 py-16 text-center ${isDark ? 'border-stone-800 bg-stone-900/40' : 'border-[#E2E8F0] bg-white shadow-sm'}`}
                        >
                            <UserRound className={`mx-auto h-14 w-14 ${isDark ? 'text-stone-600' : 'text-[#94A3B8]'}`} />
                            <p className={`mt-4 font-semibold ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>
                                Belum ada kasir. Klik &quot;+ Tambah Kasir&quot; untuk memulai.
                            </p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={`rounded-3xl border px-8 py-12 text-center ${isDark ? 'border-stone-800 bg-stone-900/40' : 'border-[#E2E8F0] bg-white shadow-sm'}`}>
                            <p className={`font-semibold ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>Tidak ada kasir yang cocok dengan pencarian atau filter Anda.</p>
                        </div>
                    ) : (
                        <>
                            <div className={`hidden md:block rounded-3xl border overflow-hidden shadow-sm ${isDark ? 'border-stone-800 bg-stone-900' : 'border-[#E2E8F0] bg-white'}`}>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className={`text-left text-xs font-black uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-[#94A3B8] bg-[#F8FAFC]'}`}>
                                            <th className="px-5 py-4">Avatar</th>
                                            <th className="px-5 py-4">Nama & Email</th>
                                            <th className="px-5 py-4">Status</th>
                                            <th className="px-5 py-4">PIN</th>
                                            <th className="px-5 py-4">Dibuat</th>
                                            <th className="px-5 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-stone-800' : 'divide-[#F1F5F9]'}`}>
                                        {filtered.map((row) => (
                                            <tr key={row.id} className={`text-sm transition-colors ${isDark ? 'text-stone-200 hover:bg-stone-800/50' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>
                                                <td className="align-middle px-5 py-4">
                                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 font-black uppercase text-white shadow-sm shadow-teal-600/20">
                                                        {row.name.charAt(0)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-[#0F172A] dark:text-white">{row.name}</p>
                                                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>{row.email}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black border ${row.is_active
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-red-50 text-red-600 border-red-200'
                                                            }`}
                                                    >
                                                        {row.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${row.pin ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-[#F1F5F9] text-[#94A3B8] border-transparent dark:bg-stone-700 dark:text-stone-300'}`}>
                                                        <Lock className="h-3.5 w-3.5" />
                                                        {row.pin ? 'PIN Aktif' : 'Belum ada PIN'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs opacity-90">
                                                    {formatCreatedAt(row.created_at)}
                                                </td>
                                                <td className="relative px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenActionsId((id) => (id === row.id ? null : row.id));
                                                        }}
                                                        className={`inline-flex rounded-2xl border p-2 transition-colors ${isDark ? 'border-stone-700 text-stone-200 hover:bg-stone-800' : 'border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'}`}
                                                        aria-expanded={openActionsId === row.id}
                                                        aria-haspopup="true"
                                                    >
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </button>
                                                    {openActionsId === row.id && (
                                                        <div
                                                            ref={menuRef}
                                                            className={`absolute right-6 top-[calc(100%-0.25rem)] z-[50] mt-2 w-52 overflow-hidden rounded-2xl border shadow-xl animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'border-stone-700 bg-stone-950' : 'border-[#E2E8F0] bg-white'}`}
                                                        >
                                                            <button
                                                                type="button"
                                                                className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition-colors ${isDark ? 'hover:bg-stone-900' : 'hover:bg-amber-50 text-amber-600'}`}
                                                                onClick={() => {
                                                                    setEditTarget(row);
                                                                    setOpenActionsId(null);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" /> Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition-colors ${isDark ? 'hover:bg-stone-900' : 'hover:bg-teal-50 text-teal-700'}`}
                                                                onClick={() => {
                                                                    setResetTarget(row);
                                                                    setOpenActionsId(null);
                                                                }}
                                                            >
                                                                <KeyRound className="h-4 w-4" /> Reset Password
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={toggleLoadingId === row.id}
                                                                className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition-colors disabled:opacity-50 ${isDark ? 'hover:bg-stone-900' : 'hover:bg-red-50 text-red-500'}`}
                                                                onClick={() => void toggleActive(row)}
                                                            >
                                                                {toggleLoadingId === row.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                                                                ) : row.is_active ? (
                                                                    <Unlock className="h-4 w-4" />
                                                                ) : (
                                                                    <Lock className="h-4 w-4" />
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
                                        className={`rounded-3xl border p-5 shadow-sm ${isDark ? 'border-stone-800 bg-stone-900' : 'border-[#E2E8F0] bg-white'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-lg font-black uppercase text-white">
                                                    {row.name.charAt(0)}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">{row.name}</p>
                                                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>{row.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black border ${row.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-red-50 text-red-600 border-red-200'
                                                    }`}
                                            >
                                                {row.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${row.pin ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-[#F1F5F9] text-[#94A3B8] border-transparent dark:bg-stone-700 dark:text-stone-300'}`}
                                            >
                                                <Lock className="h-3.5 w-3.5" />
                                                {row.pin ? 'PIN Aktif' : 'Belum ada PIN'}
                                            </span>
                                        </div>
                                        <p className={`mt-3 text-xs ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
                                            Dibuat: {formatCreatedAt(row.created_at)}
                                        </p>
                                        <div className={`mt-4 flex gap-2 border-t pt-4 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
                                            <button
                                                type="button"
                                                onClick={() => setEditTarget(row)}
                                                className={`flex flex-1 items-center justify-center gap-2 rounded-3xl py-2 text-sm font-bold transition-colors ${isDark ? 'border border-stone-700 dark:text-white hover:bg-stone-800' : 'bg-amber-50 text-amber-600 border border-transparent hover:bg-amber-100'}`}
                                            >
                                                <Pencil className="h-4 w-4" /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResetTarget(row)}
                                                className={`flex flex-1 items-center justify-center gap-2 rounded-3xl py-2 text-sm font-bold transition-colors ${isDark ? 'border border-stone-700 dark:text-white hover:bg-stone-800' : 'bg-teal-50 text-teal-700 border border-transparent hover:bg-teal-100'}`}
                                            >
                                                <KeyRound className="h-4 w-4" /> Reset
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={toggleLoadingId === row.id}
                                            onClick={() => void toggleActive(row)}
                                            className={`mt-2 w-full rounded-3xl py-2 text-sm font-bold transition-colors ${isDark ? 'border border-stone-700 dark:text-white hover:bg-stone-800' : 'bg-red-50 text-red-500 border border-transparent hover:bg-red-100'}`}
                                        >
                                            {toggleLoadingId === row.id ? 'Menyimpan...' : row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
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
