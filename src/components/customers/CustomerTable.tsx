import { User, Phone, Calendar, DollarSign } from 'lucide-react';
import type { Customer } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomerTableProps {
  customers: Customer[];
}

export default function CustomerTable({ customers }: CustomerTableProps) {
  const { theme } = useTheme();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            {['Customer', 'Contact', 'Visits', 'Total Spent', 'Last Visit', 'Status'].map((header) => (
              <th key={header} className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
          {customers.length > 0 ? (
            customers.map(customer => {
              const lastVisit = customer.lastVisit ? new Date(customer.lastVisit) : null;
              const daysSinceLastVisit = lastVisit 
                ? Math.floor((new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
                : null;
              
              const status = daysSinceLastVisit === null ? 'New' 
                : daysSinceLastVisit <= 7 ? 'Active' 
                : daysSinceLastVisit <= 30 ? 'Regular' 
                : 'Inactive';

              const statusColors = theme === 'dark' ? {
                New: 'bg-blue-900/30 text-blue-400',
                Active: 'bg-green-900/30 text-green-400',
                Regular: 'bg-amber-900/30 text-amber-400',
                Inactive: 'bg-red-900/30 text-red-400',
              } : {
                New: 'bg-blue-100 text-blue-800',
                Active: 'bg-green-100 text-green-800',
                Regular: 'bg-amber-100 text-amber-800',
                Inactive: 'bg-red-100 text-red-800',
              };

              return (
                <tr 
                  key={customer.id} 
                  className={`
                    transition-colors 
                    ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-900 hover:bg-gray-50'}
                  `}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Member since {new Date(customer.joinDate).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Phone className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className="text-sm">{customer.phone || 'No phone'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className="font-medium">{customer.totalVisits}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                        Rp {customer.totalSpent.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {lastVisit ? lastVisit.toLocaleDateString('id-ID') : 'Never'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="py-12 text-center">
                <User className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`} />
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>No customers yet</p>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Add customers from POS or manually
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}