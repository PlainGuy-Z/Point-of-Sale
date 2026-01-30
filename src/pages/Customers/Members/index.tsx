import { useState } from 'react';
import { Users, DollarSign, Calendar, TrendingUp, UserPlus, Edit2, Trash2, X } from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext';
import CustomerStats from '../../../components/customers/CustomerStats';
import type { Customer } from '../../../types';

export default function Members() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // --- STATE UNTUK MODAL & EDIT ---
  const [isModalOpen, setModalOpen] = useState(false);
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

  // --- FORM HANDLER ---
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const customerData: Customer = {
      id: editingCustomer?.id || `C${Date.now()}`,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: (formData.get('email') as string) || undefined,
      joinDate: editingCustomer?.joinDate || new Date(),
      totalVisits: editingCustomer?.totalVisits || 0,
      totalSpent: editingCustomer?.totalSpent || 0,
      lastVisit: editingCustomer?.lastVisit
    };

    if (editingCustomer) {
      updateCustomer(customerData); // Update member yang sudah ada
    } else {
      addCustomer(customerData); // Registrasi member baru
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Customer Members
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Kelola data pelanggan dan pantau loyalitas mereka secara dinamis
          </p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95"
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
          value={`Rp ${Math.round(avgSpent).toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          description="Per customer average"
          trend="stable"
        />
        <CustomerStats
          title="Top Spender"
          value={topSpender?.name || "N/A"}
          icon={<TrendingUp className="w-6 h-6" />}
          description={topSpender ? `Rp ${topSpender.totalSpent.toLocaleString()}` : 'No data'}
          trend="premium"
        />
      </div>

      {/* Main Table Area - Mengganti CustomerTable statis dengan tabel interaktif CRUD */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
          <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Member Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Join Date</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {customers.map(customer => (
                <tr key={customer.id} className={`transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700/30' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                        {customer.name.charAt(0)}
                      </div>
                      <span className="font-semibold">{customer.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{customer.phone}</td>
                  <td className="p-4 text-sm">{new Date(customer.joinDate).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-amber-500">Rp {customer.totalSpent.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteCustomer(customer.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500">No members registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form 
            onSubmit={handleSubmit} 
            className={`w-full max-w-md p-6 rounded-3xl shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingCustomer ? 'Update Member' : 'New Member Registration'}
              </h2>
              <button type="button" onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
                <input 
                  name="name" 
                  defaultValue={editingCustomer?.name} 
                  className={`w-full p-3 rounded-xl border outline-none focus:border-amber-500 transition-all ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`} 
                  placeholder="e.g. Budi Santoso"
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone Number</label>
                <input 
                  name="phone" 
                  defaultValue={editingCustomer?.phone} 
                  className={`w-full p-3 rounded-xl border outline-none focus:border-amber-500 transition-all ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`} 
                  placeholder="e.g. 08123456789"
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email (Optional)</label>
                <input 
                  name="email" 
                  type="email"
                  defaultValue={editingCustomer?.email} 
                  className={`w-full p-3 rounded-xl border outline-none focus:border-amber-500 transition-all ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`} 
                  placeholder="e.g. budi@email.com"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                type="button" 
                onClick={handleCloseModal} 
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all"
              >
                {editingCustomer ? 'Update Member' : 'Save Member'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}