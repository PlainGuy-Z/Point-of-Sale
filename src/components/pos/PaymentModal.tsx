import { useState, useEffect } from 'react';
import { X, Banknote, CreditCard, QrCode, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onConfirm: (method: 'cash' | 'card' | 'qris', cashReceived?: number) => void;
}

export default function PaymentModal({ total, onClose, onConfirm }: PaymentModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [method, setMethod] = useState<'cash' | 'card' | 'qris'>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const change = Math.max(0, cashReceived - total);

  // Auto-fill cash received saat modal dibuka (optional UX)
  useEffect(() => {
    setCashReceived(0);
  }, []);

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount);
  };

  const handleSubmit = () => {
    if (method === 'cash' && cashReceived < total) {
      alert('Uang tunai kurang!');
      return;
    }
    onConfirm(method, method === 'cash' ? cashReceived : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        
        {/* Left Side: Summary & Numpad Area */}
        <div className={`p-6 flex-1 flex flex-col justify-between ${isDark ? 'border-r border-gray-700' : 'border-r border-gray-100'}`}>
          <div>
            <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Detail</h2>
            
            <div className="mb-8 text-center">
              <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
              <p className={`text-4xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                Rp {total.toLocaleString()}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Debit/Credit', icon: CreditCard },
                { id: 'qris', label: 'QRIS', icon: QrCode },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as any)}
                  className={`py-3 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${
                    method === m.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                      : isDark ? 'border-gray-700 bg-gray-700/50 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <m.icon className="w-6 h-6" />
                  <span className="text-xs font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Cash Calculation or QR */}
        <div className={`p-6 w-full md:w-[320px] ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {method === 'cash' ? 'Cash Calculation' : 'Process Payment'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
              <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>

          {method === 'cash' ? (
            <div className="space-y-4">
              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cash Received</label>
                <input
                  type="number"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  className={`w-full p-4 rounded-xl text-lg font-bold outline-none border-2 focus:border-amber-500 transition-all ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[total, 50000, 100000, 150000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => handleQuickCash(amt)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Rp {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className={`p-4 rounded-xl mt-4 ${isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Change</span>
                  <span className={`text-xl font-bold ${change < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    Rp {change.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-8 font-medium transition-all">
              {/* Container Background yang Adaptif */}
              <div className={`w-48 h-48 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors ${
                isDark ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100'
              }`}>
                {method === 'qris' ? (
                  <QrCode className={`w-28 h-28 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                ) : (
                  <CreditCard className={`w-28 h-28 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                )}
              </div>
              <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {method === 'qris' ? 'Scan QR Code' : 'Ready for Card'}
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {method === 'qris' ? 'Tunjukkan QRIS pada pelanggan' : 'Silakan gesek/masukkan kartu di EDC'}
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full mt-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <CheckCircle className="w-5 h-5" />
            Complete Order
          </button>
        </div>
      </div>
    </div>
  );
}