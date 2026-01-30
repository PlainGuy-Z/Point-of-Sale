import { useState } from 'react';
import { Trash2, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext'; // Import context tema
import WasteLogTable from '../../../components/operation/WasteLogTable';
import AddWasteForm from '../../../components/operation/AddWasteForm';
import type { WasteLog } from '../../../types';

export default function WasteLog() {
  const { products, wasteLogs, addWasteLog } = useApp();
  const { theme } = useTheme(); // Ambil status tema
  const [showForm, setShowForm] = useState(false);

  const isDark = theme === 'dark';

  // Hitung total loss
  const totalLoss = wasteLogs.reduce((sum, w) => sum + w.costLoss, 0);
  const today = new Date().toDateString();
  const todayLoss = wasteLogs
    .filter(w => new Date(w.date).toDateString() === today)
    .reduce((sum, w) => sum + w.costLoss, 0);

  const handleAddWaste = (waste: Omit<WasteLog, 'id' | 'date'>) => {
    const newWaste: WasteLog = {
      ...waste,
      id: `W${Date.now()}`,
      date: new Date(),
    };
    addWasteLog(newWaste);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Waste Log
        </h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Kontrol biaya - profit sering bocor dari waste, bukan harga jual
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Waste Card */}
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Waste Loss</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Rp {totalLoss.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
              <DollarSign className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            </div>
          </div>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>All time accumulated</p>
        </div>

        {/* Today's Loss Card */}
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Today's Loss</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                Rp {todayLoss.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
              <Calendar className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
            </div>
          </div>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Potential profit lost today</p>
        </div>

        {/* Total Records Card */}
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Records</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {wasteLogs.length}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <Trash2 className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          </div>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Waste incidents logged</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Waste Records
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Monitor and control cost leakage</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
        >
          <AlertTriangle className="w-4 h-4" />
          Add Waste Record
        </button>
      </div>

      {/* Add Waste Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all">
          <div className={`rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Record Waste
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className={`transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ✕
              </button>
            </div>
            <AddWasteForm 
              products={products}
              onSubmit={handleAddWaste}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Waste Log Table Container */}
      <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <WasteLogTable wasteLogs={wasteLogs} products={products} />
      </div>
    </div>
  );
}