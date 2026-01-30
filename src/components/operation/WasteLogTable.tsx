import { Trash2, AlertTriangle, Calendar } from 'lucide-react';
import type { WasteLog, Product } from '../../types';

interface WasteLogTableProps {
  wasteLogs: WasteLog[];
  products: Product[];
}

export default function WasteLogTable({ wasteLogs, products }: WasteLogTableProps) {
  const getProductName = (productId: string) => 
    products.find(p => p.id === productId)?.name || 'Unknown';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
            <th className="text-left py-3 px-4 text-gray-600 font-medium">Product</th>
            <th className="text-left py-3 px-4 text-gray-600 font-medium">Quantity</th>
            <th className="text-left py-3 px-4 text-gray-600 font-medium">Reason</th>
            <th className="text-left py-3 px-4 text-gray-600 font-medium">Cost Loss</th>
          </tr>
        </thead>
        <tbody>
          {wasteLogs.length > 0 ? (
            wasteLogs.map(waste => (
              <tr key={waste.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(waste.date).toLocaleDateString('id-ID')}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium">{getProductName(waste.productId)}</div>
                  <div className="text-sm text-gray-500">{waste.productName}</div>
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
                    Rp {waste.costLoss.toLocaleString()}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-500">
                <Trash2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
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