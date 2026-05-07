import { Search, User, X } from 'lucide-react';
import type { Customer } from '../../types';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer?: string;
  onSelect: (customerId: string) => void;
}

export default function CustomerSelector({
  customers,
  selectedCustomer,
  onSelect,
}: CustomerSelectorProps) {
  const [search, setSearch] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone?.includes(search)
  );

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 bg-gradient-to-br ${
      isDark ? 'from-gray-800 via-gray-800 to-gray-900 border-gray-700 shadow-xl' : 'from-white via-white to-gray-50 border-gray-100 shadow-sm'
    }`}>
      {/* Header - Tombol New dihapus sesuai permintaan */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${isDark ? 'from-amber-500/10 to-orange-500/5' : 'from-amber-50 to-orange-50'}`}>
           <User className="w-4 h-4 text-amber-500" />
        </div>
        <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Select Customer
        </h3>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search name or phone..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all bg-gradient-to-br ${
            isDark 
              ? 'from-gray-900 to-gray-800 border-gray-700 text-white focus:border-amber-500' 
              : 'from-gray-50 to-white border-gray-200 text-gray-800 focus:border-amber-500 focus:from-white focus:to-gray-50'
          }`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* List Area */}
      <div className="max-h-44 overflow-y-auto custom-scrollbar pr-1 space-y-1">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => {
            const isSelected = selectedCustomer === customer.id;
            return (
              <button
                key={customer.id}
                onClick={() => onSelect(customer.id)}
                className={`w-full text-left p-3 rounded-xl transition-all group bg-gradient-to-r ${
                  isSelected
                    ? isDark 
                      ? 'from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20' 
                      : 'from-amber-500 to-orange-500 text-white shadow-sm'
                    : isDark 
                      ? 'from-gray-800/50 via-gray-800/40 to-gray-900/30 hover:from-gray-700/50 hover:via-gray-700/40 hover:to-gray-800/30 text-gray-300 border border-transparent' 
                      : 'from-gray-50/50 via-gray-50/40 to-white/30 hover:from-gray-100/50 hover:via-gray-100/40 hover:to-gray-50/30 text-gray-600 border border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {customer.name}
                    </p>
                    <p className={`text-[10px] font-medium uppercase tracking-tight ${isSelected ? 'text-amber-100' : 'text-gray-500'}`}>
                      {customer.phone || 'No Phone'} • {customer.totalVisits} Visits
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                       <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500 text-xs font-medium">No results for "{search}"</p>
          </div>
        )}
      </div>

      {/* Selected Indicator Footer */}
      {selectedCustomer && (
        <div className={`mt-4 p-3 rounded-2xl border-2 flex items-center justify-between animate-in slide-in-from-top-2 duration-300 bg-gradient-to-r ${
          isDark 
            ? 'from-gray-900/50 via-gray-900/40 to-gray-800/30 border-gray-700' 
            : 'from-gray-50 via-gray-50/80 to-white/50 border-gray-100'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs font-bold text-gray-500">Active: <span className={isDark ? 'text-white' : 'text-gray-800'}>{selectedCustomerData?.name}</span></p>
          </div>
          <button
            onClick={() => onSelect('')}
            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  );
}