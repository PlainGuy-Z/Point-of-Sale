import React, { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext'; // Import context tema
import { 
  Search, 
  ArrowDownRight, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  RefreshCw,
  TrendingDown
} from 'lucide-react';

export default function InventoryUsage() {
  const { products, transactions, wasteLogs, updateProduct } = useApp();
  const { theme } = useTheme(); // Ambil tema
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [opnameMode, setOpnameMode] = useState(false);
  const [physicalStockInput, setPhysicalStockInput] = useState<Record<string, number>>({});

  const inventoryStats = useMemo(() => {
    return products.map(product => {
      const soldQty = transactions.reduce((acc, t) => {
        const item = t.items.find(i => i.productId === product.id);
        return acc + (item?.quantity || 0);
      }, 0);

      const wastedQty = wasteLogs
        .filter(w => w.productId === product.id)
        .reduce((acc, w) => acc + w.quantity, 0);

      const totalUsage = soldQty + wastedQty;
      const usageValue = totalUsage * product.cost;

      const currentStock = product.stock;
      const physical = physicalStockInput[product.id] ?? currentStock;
      const discrepancy = physical - currentStock;
      const discrepancyValue = discrepancy * product.cost;

      return {
        ...product,
        soldQty,
        wastedQty,
        totalUsage,
        usageValue,
        discrepancy,
        discrepancyValue
      };
    }).filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, transactions, wasteLogs, searchTerm, physicalStockInput]);

  const handleSaveOpname = (product: typeof inventoryStats[0]) => {
    if (product.discrepancy !== 0) {
      if (confirm(`Update stok ${product.name} dari ${product.stock} menjadi ${product.stock + product.discrepancy}?`)) {
        updateProduct({
          ...product,
          stock: product.stock + product.discrepancy,
        });
        const newInputs = { ...physicalStockInput };
        delete newInputs[product.id];
        setPhysicalStockInput(newInputs);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Inventory Usage
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Lacak penggunaan bahan & validasi stok fisik
          </p>
        </div>
        <button
          onClick={() => setOpnameMode(!opnameMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            opnameMode 
              ? isDark
                ? 'bg-amber-900/30 text-amber-300 border border-amber-700'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
              : isDark
                ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${opnameMode ? 'animate-spin-slow' : ''}`} />
          {opnameMode ? 'Exit Stock Opname' : 'Start Stock Opname'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`} />
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${
            isDark
              ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        />
      </div>

      {/* Main Table */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={isDark ? 'bg-gray-900/50 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-100'}>
              <tr>
                <th className={`px-6 py-4 text-xs font-semibold uppercase ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Produk</th>
                <th className={`px-6 py-4 text-xs font-semibold uppercase text-right ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Cost (Unit)</th>
                <th className={`px-6 py-4 text-xs font-semibold uppercase text-center ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Terjual</th>
                <th className={`px-6 py-4 text-xs font-semibold uppercase text-center ${
                  isDark ? 'text-red-400' : 'text-red-500'
                }`}>Waste</th>
                <th className={`px-6 py-4 text-xs font-semibold uppercase text-center ${
                  isDark ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>App Stock</th>
                {opnameMode && (
                  <>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase text-center ${
                      isDark 
                        ? 'bg-amber-900/20 text-amber-300' 
                        : 'bg-amber-50 text-amber-600'
                    }`}>Fisik (Real)</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase text-center ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>Selisih</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase text-center ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>Aksi</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
              {inventoryStats.map((item) => (
                <tr key={item.id} className={
                  isDark ? 'hover:bg-gray-700/50 transition-colors' : 'hover:bg-gray-50 transition-colors'
                }>
                  <td className="px-6 py-4">
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.name}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Total Usage Value: Rp {item.usageValue.toLocaleString()}
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Rp {item.cost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isDark 
                        ? 'bg-blue-900/30 text-blue-300' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.soldQty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.wastedQty > 0 ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDark 
                          ? 'bg-red-900/30 text-red-300' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                        {item.wastedQty}
                      </span>
                    ) : (
                      <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>-</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-center font-mono font-medium ${
                    isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-50 text-gray-900'
                  }`}>
                    {item.stock}
                  </td>
                  
                  {opnameMode && (
                    <>
                      <td className={`px-6 py-4 text-center ${
                        isDark ? 'bg-amber-900/20' : 'bg-amber-50'
                      }`}>
                        <input
                          type="number"
                          value={physicalStockInput[item.id] ?? ''}
                          placeholder={item.stock.toString()}
                          onChange={(e) => setPhysicalStockInput({
                            ...physicalStockInput,
                            [item.id]: parseInt(e.target.value) || 0
                          })}
                          className={`w-20 text-center border-b-2 bg-transparent focus:outline-none focus:border-amber-600 font-bold ${
                            isDark
                              ? 'border-amber-700 text-amber-300 placeholder-amber-600'
                              : 'border-amber-300 text-amber-900'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.discrepancy !== 0 ? (
                          <div className={`flex flex-col items-center ${
                            item.discrepancy < 0 
                              ? 'text-red-500' 
                              : 'text-green-500'
                          }`}>
                            <span className="font-bold">
                              {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                            </span>
                            <span className={`text-[10px] ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Rp {item.discrepancyValue.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <CheckCircle2 className={`w-5 h-5 mx-auto ${
                            isDark ? 'text-gray-700' : 'text-gray-300'
                          }`} />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleSaveOpname(item)}
                          disabled={item.discrepancy === 0}
                          className={`p-2 rounded-lg ${
                            isDark
                              ? 'text-gray-500 hover:text-indigo-400 hover:bg-indigo-900/30 disabled:opacity-30'
                              : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30'
                          }`}
                          title="Simpan perubahan stok"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}