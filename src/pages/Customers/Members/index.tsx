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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Customer Members
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Kelola data pelanggan, QR Code, dan status member
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

      {/* Main Table Area */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Stats</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {customers.map(customer => {
                 const lastVisit = customer.lastVisit ? new Date(customer.lastVisit) : null;
                 const isActive = lastVisit && (new Date().getTime() - lastVisit.getTime()) < (30 * 24 * 60 * 60 * 1000);
                 
                 return (
                  <tr key={customer.id} className={`transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700/30' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleShowQr(customer)}
                          className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                          title="View QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                        <div>
                          <div className="font-bold">{customer.name}</div>
                          <div className="text-xs text-gray-500">ID: {customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{customer.phone}</div>
                      <div className="text-xs text-gray-500">{customer.email || '-'}</div>
                    </td>
                    <td className="p-4">
                       <div className="flex flex-col">
                          <span className="font-bold text-amber-500">Rp {customer.totalSpent.toLocaleString()}</span>
                          <span className="text-xs text-gray-500">{customer.totalVisits} visits</span>
                       </div>
                    </td>
                    <td className="p-4">
                      {isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
                      )}
                    </td>
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
            className={`w-full max-w-md p-6 rounded-3xl shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}
          >
            {/* ... (Isi form sama seperti sebelumnya) ... */}
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

      {/* QR Code Modal (Simulasi) */}
      {isQrModalOpen && selectedCustomerForQr && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
            <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-b-[50%] -mt-16 z-0"></div>
               
               <div className="relative z-10 mt-6">
                 <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
                    <Users size={32} className="text-amber-500" />
                 </div>
                 
                 <h3 className="text-2xl font-bold text-gray-800">{selectedCustomerForQr.name}</h3>
                 <p className="text-gray-500 text-sm mb-6">{selectedCustomerForQr.id}</p>
                 
                 <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-2xl inline-block mb-6">
                    {/* Placeholder untuk QR Library - di real app gunakan 'react-qr-code' */}
                    <div className="w-48 h-48 bg-gray-900 flex items-center justify-center text-white text-xs rounded-lg">
                       [QR CODE GENERATED HERE]
                    </div>
                 </div>
                 
                 <p className="text-xs text-gray-400 mb-6">Scan ini di kasir untuk identifikasi member</p>
                 
                 <button 
                   onClick={() => setQrModalOpen(false)}
                   className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
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