import { Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { WasteLog, Product } from '../../types';

interface WasteLogTableProps {
  wasteLogs: WasteLog[];
  products: Product[];
}

export default function WasteLogTable({ wasteLogs, products }: WasteLogTableProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getProductName = (productId: string) => 
    products.find(p => p.id === productId)?.name || 'Unknown';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`border-b ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
            <th className={`text-left py-3 px-4 font-medium ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Date</th>
            <th className={`text-left py-3 px-4 font-medium ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Product</th>
            <th className={`text-left py-3 px-4 font-medium ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Quantity</th>
            <th className={`text-left py-3 px-4 font-medium ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Reason</th>
            <th className={`text-left py-3 px-4 font-medium ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Cost Loss</th>
          </tr>
        </thead>
        <tbody>
          {wasteLogs.length > 0 ? (
            wasteLogs.map(waste => (
              <tr key={waste.id} className={`border-b transition-colors ${isDark ? 'border-stone-800 hover:bg-stone-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    {new Date(waste.date).toLocaleDateString('id-ID')}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className={`font-medium ${isDark ? 'text-stone-200' : 'text-gray-900'}`}>{getProductName(waste.productId)}</div>
                  <div className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>{waste.productName}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    {waste.quantity} pcs
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="capitalize">{waste.reason}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-red-600">
                    {waste.costLoss}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className={`py-8 text-center ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                <Trash2 className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-stone-800' : 'text-stone-300'}`} />
                <p>No waste records yet</p>
                <p className="text-sm mt-1">Start by adding waste records</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}