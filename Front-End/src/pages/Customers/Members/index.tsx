import { useState } from 'react';
import { Users, DollarSign, Calendar, TrendingUp, UserPlus, Edit2, Trash2, X, QrCode } from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext';
import CustomerStats from '../../../components/customers/CustomerStats';
import type { Customer } from '../../../types';

export default function Members() {
    const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // --- STATE UNTUK MODAL, EDIT & QR ---
    const [isModalOpen, setModalOpen] = useState(false);
    const [isQrModalOpen, setQrModalOpen] = useState(false);
    const [selectedCustomerForQr, setSelectedCustomerForQr] = useState<Customer | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // --- METRICS CALCULATION ---
    const totalCustomers = customers.length;
    const avgSpent = totalCustomers > 0
        ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers
        : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeCustomers = customers.filter(c =>
        c.lastVisit && new Date(c.lastVisit) >= thirtyDaysAgo
    ).length;

    const topSpender = customers.length > 0
        ? [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0]
        : null;

    const createId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `customer-${Date.now()}`);

    // --- FORM HANDLER ---
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const customerData: Customer = {
            id: editingCustomer?.id || createId(),
            name: formData.get('name') as string,
            phone: formData.get('phone') as string,
            email: (formData.get('email') as string) || undefined,
            joinDate: editingCustomer?.joinDate || new Date(),
            totalVisits: editingCustomer?.totalVisits || 0,
            totalSpent: editingCustomer?.totalSpent || 0,
            lastVisit: editingCustomer?.lastVisit
        };

        if (editingCustomer) {
            updateCustomer(customerData);
        } else {
            addCustomer(customerData);
        }

        handleCloseModal();
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingCustomer(null);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setModalOpen(true);
    };

    const handleShowQr = (customer: Customer) => {
        setSelectedCustomerForQr(customer);
        setQrModalOpen(true);
    };

    return (
        <div className={`min-h-screen ${isDark ? '' : 'bg-[#F8FAFC]'} -m-6 p-6 space-y-6`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                        Customer Members
                    </h1>
                    <p className={`font-medium ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
                        Kelola data pelanggan, QR Code, dan status member
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-600/25 transition-all active:scale-95"
                >
                    <UserPlus size={20} /> Register Member
                </button>
            </div>

            {/* Customer Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CustomerStats
                    title="Total Customers"
                    value={totalCustomers}
                    icon={<Users className="w-6 h-6" />}
                    description="Registered members"
                    trend={totalCustomers > 10 ? "up" : "stable"}
                />
                <CustomerStats
                    title="Active Customers"
                    value={activeCustomers}
                    icon={<Calendar className="w-6 h-6" />}
                    description="Visited last 30 days"
                    trend={activeCustomers > 5 ? "up" : "down"}
                />
                <CustomerStats
                    title="Avg Spent"
                    value={Math.round(avgSpent)}
                    icon={<DollarSign className="w-6 h-6" />}
                    description="Per customer average"
                    trend="stable"
                />
                <CustomerStats
                    title="Top Spender"
                    value={topSpender?.name || "N/A"}
                    icon={<TrendingUp className="w-6 h-6" />}
                    description={topSpender ? `${topSpender.totalSpent}` : 'No data'}
                    trend="premium"
                />
            </div>

            {/* Main Table Area */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#E2E8F0]'
                }`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className={isDark ? 'bg-stone-950/50' : 'bg-[#F8FAFC]'}>
                            <tr className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
                                <th className="p-4 px-6">Customer Name</th>
                                <th className="p-4 px-6">Contact</th>
                                <th className="p-4 px-6">Stats</th>
                                <th className="p-4 px-6">Status</th>
                                <th className="p-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-stone-800' : 'divide-[#F1F5F9]'}`}>
                            {customers.map(customer => {
                                const lastVisit = customer.lastVisit ? new Date(customer.lastVisit) : null;
                                const isActive = lastVisit && (new Date().getTime() - lastVisit.getTime()) < (30 * 24 * 60 * 60 * 1000);

                                return (
                                    <tr key={customer.id} className={`transition-colors ${isDark ? 'text-stone-300 hover:bg-stone-800/30' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>
                                        <td className="p-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleShowQr(customer)}
                                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isDark ? 'bg-teal-500/10 text-teal-500 hover:bg-teal-500 hover:text-white' : 'bg-[#F0FDFA] text-teal-600 hover:bg-teal-600 hover:text-white'}`}
                                                    title="View QR Code"
                                                >
                                                    <QrCode size={18} />
                                                </button>
                                                <div>
                                                    <div className={`font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{customer.name}</div>
                                                    <div className="text-xs text-[#94A3B8]">ID: {customer.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 px-6">
                                            <div className="text-sm font-medium">{customer.phone}</div>
                                            <div className="text-xs text-[#94A3B8]">{customer.email || '-'}</div>
                                        </td>
                                        <td className="p-4 px-6">
                                            <div className="flex flex-col">
                                                <span className={`font-bold ${isDark ? 'text-teal-500' : 'text-[#0F172A]'}`}>{customer.totalSpent}</span>
                                                <span className={`text-xs font-bold ${isDark ? 'text-teal-400/80' : 'text-teal-700'}`}>{customer.totalVisits} visits</span>
                                            </div>
                                        </td>
                                        <td className="p-4 px-6">
                                            {isActive ? (
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-amber-900/20 text-amber-500 border-amber-900/30' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    Loyalty Member
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${isDark ? 'bg-stone-800 text-stone-500 border-stone-700' : 'bg-[#F1F5F9] text-[#94A3B8] border-transparent'}`}>
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(customer)}
                                                    className={`p-2 rounded-xl transition-colors ${isDark ? 'text-teal-500 hover:bg-teal-500/10' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteCustomer(customer.id)}
                                                    className={`p-2 rounded-xl transition-colors ${isDark ? 'text-red-500 hover:bg-red-500/10' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form Member */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <form
                        onSubmit={handleSubmit}
                        className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white'}`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                                {editingCustomer ? 'Update Member' : 'New Member Registration'}
                            </h2>
                            <button type="button" onClick={handleCloseModal} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-black text-[#94A3B8] uppercase mb-2 block">Full Name</label>
                                <input
                                    name="name"
                                    defaultValue={editingCustomer?.name}
                                    className={`w-full p-3 px-4 rounded-2xl border outline-none transition-all focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 ${isDark ? 'bg-stone-950 border-stone-800 text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'}`}
                                    placeholder="e.g. Budi Santoso"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-[#94A3B8] uppercase mb-2 block">Phone Number</label>
                                <input
                                    name="phone"
                                    defaultValue={editingCustomer?.phone}
                                    className={`w-full p-3 px-4 rounded-2xl border outline-none transition-all focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 ${isDark ? 'bg-stone-950 border-stone-800 text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'}`}
                                    placeholder="e.g. 08123456789"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-[#94A3B8] uppercase mb-2 block">Email (Optional)</label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={editingCustomer?.email}
                                    className={`w-full p-3 px-4 rounded-2xl border outline-none transition-all focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 ${isDark ? 'bg-stone-950 border-stone-800 text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'}`}
                                    placeholder="e.g. budi@email.com"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-10">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className={`flex-1 py-3 rounded-2xl font-bold transition-all ${isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-600/25 transition-all"
                            >
                                {editingCustomer ? 'Update Member' : 'Save Member'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* QR Code Modal (Simulasi) */}
            {isQrModalOpen && selectedCustomerForQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                    <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-b-[50%] -mt-16 z-0"></div>

                        <div className="relative z-10 mt-6">
                            <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
                                <Users size={32} className="text-teal-600" />
                            </div>

                            <h3 className="text-2xl font-black text-[#0F172A]">{selectedCustomerForQr.name}</h3>
                            <p className="text-[#94A3B8] text-sm mb-6">{selectedCustomerForQr.id}</p>

                            <div className="bg-white p-4 border-2 border-dashed border-[#E2E8F0] rounded-2xl inline-block mb-6">
                                {/* Placeholder untuk QR Library - di real app gunakan 'react-qr-code' */}
                                <div className="w-48 h-48 bg-[#0F172A] flex items-center justify-center text-white text-xs rounded-xl">
                                    [QR CODE GENERATED HERE]
                                </div>
                            </div>

                            <p className="text-xs text-[#94A3B8] mb-6 font-medium">Scan ini di kasir untuk identifikasi member</p>

                            <button
                                onClick={() => setQrModalOpen(false)}
                                className="w-full py-3 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold rounded-2xl transition-colors"
                            >
                                Close Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}