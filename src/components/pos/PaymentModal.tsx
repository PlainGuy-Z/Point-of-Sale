import { useState, useEffect, useRef } from 'react';
import { X, Banknote, CreditCard, QrCode, CheckCircle, Delete, DollarSign } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onConfirm: (method: 'cash' | 'card' | 'qris', cashReceived?: number, change?: number) => void;
}

export default function PaymentModal({ total, onClose, onConfirm }: PaymentModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [method, setMethod] = useState<'cash' | 'card' | 'qris'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [change, setChange] = useState<number>(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rawValue = cashReceived.replace(/\./g, '');
    const received = parseFloat(rawValue) || 0;
    setChange(Math.max(0, received - total));
  }, [cashReceived, total]);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '.'];

  const handleKeypadInput = (value: string) => {
    if (value === '.' && cashReceived.includes('.')) return;
    let newValue = cashReceived;
    if (value === '00') newValue += '00';
    else if (value === '.' && cashReceived === '') newValue = '0.';
    else newValue += value;
    
    if (newValue.startsWith('0') && !newValue.startsWith('0.') && newValue.length > 1) {
      newValue = newValue.substring(1);
    }
    setCashReceived(newValue);
  };

  const handleBackspace = () => setCashReceived(prev => prev.slice(0, -1));
  const handleClear = () => setCashReceived('');
  const handleQuickCash = (amount: number) => setCashReceived(amount.toString());

  const formatDisplayValue = (value: string) => {
    if (!value) return '0';
    try {
      const [integerPart, decimalPart] = value.split('.');
      let formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      if (decimalPart !== undefined) return `${formattedInteger},${decimalPart.padEnd(2, '0').slice(0, 2)}`;
      return formattedInteger;
    } catch { return value; }
  };

  const handleSubmit = () => {
    const rawValue = cashReceived.replace(/\./g, '');
    const received = parseFloat(rawValue) || 0;
    if (method === 'cash') {
      if (received < total) { alert('Uang tunai kurang!'); return; }
      onConfirm(method, received, change);
    } else { onConfirm(method); }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID').format(value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (method === 'cash') {
      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); handleKeypadInput(e.key); }
      else if (e.key === '.' || e.key === ',') { e.preventDefault(); handleKeypadInput('.'); }
      else if (e.key === 'Backspace') { e.preventDefault(); handleBackspace(); }
      else if (e.key === 'Delete' || e.key.toLowerCase() === 'c') { e.preventDefault(); handleClear(); }
      else if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    }
  };

  const quickAmounts = () => {
    const amounts = [total];
    const round50k = Math.ceil(total / 50000) * 50000;
    const round100k = Math.ceil(total / 100000) * 100000;
    if (round50k !== total) amounts.push(round50k);
    if (round100k !== round50k && round100k !== total) amounts.push(round100k);
    if (total < 150000) amounts.push(200000);
    return [...new Set(amounts)].sort((a, b) => a - b).slice(0, 4);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2">
      <div 
        ref={modalRef}
        className={`w-full max-w-xl rounded-xl shadow-xl overflow-hidden bg-gradient-to-b ${isDark ? 'from-gray-800 via-gray-800 to-gray-900' : 'from-white via-white to-gray-50'}`}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Header - Reduced padding */}
        <div className={`flex items-center justify-between p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {/* Total Amount - Compact version */}
          <div className={`mb-4 p-3 rounded-lg flex justify-between items-center bg-gradient-to-r ${isDark ? 'from-gray-900/50 to-gray-800/30' : 'from-gray-50 to-gray-100'}`}>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</span>
            <div className={`text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              Rp {formatCurrency(total)}
            </div>
          </div>

          {/* Payment Method Selector - More compact */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote, color: 'from-green-500 to-green-600' },
              { id: 'card', label: 'Card', icon: CreditCard, color: 'from-blue-500 to-blue-600' },
              { id: 'qris', label: 'QRIS', icon: QrCode, color: 'from-purple-500 to-purple-600' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id as any)}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg border transition-all bg-gradient-to-br ${
                  method === m.id 
                    ? `border-amber-500 ${m.color} text-white shadow-lg shadow-amber-500/25` 
                    : isDark 
                      ? 'from-gray-800 to-gray-700 border-gray-700 text-gray-400' 
                      : 'from-white to-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <m.icon className={`w-4 h-4 ${method === m.id ? 'text-white' : 'text-gray-400'}`} />
                <span className={`text-xs font-bold ${method === m.id ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {method === 'cash' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Input Info */}
              <div className="space-y-3">
                <div className={`p-3 rounded-lg border bg-gradient-to-br ${isDark ? 'from-gray-900/50 to-gray-800/30 border-gray-700' : 'from-white to-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between mb-1"><span className="text-xs text-gray-400 font-semibold uppercase">Received</span></div>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div className="text-lg font-bold">Rp {formatDisplayValue(cashReceived)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {quickAmounts().map((amt) => (
                      <button key={amt} onClick={() => handleQuickCash(amt)} className={`py-1.5 px-2 rounded text-[10px] font-bold border bg-gradient-to-br ${isDark ? 'from-gray-700 to-gray-600 border-gray-600 text-gray-300' : 'from-gray-100 to-gray-50 border-gray-200 text-gray-700'}`}>
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border bg-gradient-to-r ${change >= 0 ? (isDark ? 'from-green-900/10 to-green-800/20 border-green-800' : 'from-green-50 to-green-100 border-green-200') : (isDark ? 'from-red-900/10 to-red-800/20 border-red-800' : 'from-red-50 to-red-100 border-red-200')}`}>
                  <span className="text-xs text-gray-400 font-semibold uppercase">Change</span>
                  <div className={`text-lg font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    Rp {formatCurrency(Math.abs(change))}
                  </div>
                </div>
              </div>

              {/* Right Column: Keypad - Scaled down */}
              <div className="grid grid-cols-3 gap-1.5">
                {keypadButtons.map((btn) => (
                  <button key={btn} onClick={() => handleKeypadInput(btn)} className={`py-2.5 rounded-lg text-sm font-bold border bg-gradient-to-b ${isDark ? 'from-gray-800 to-gray-700 border-gray-700 text-white active:from-gray-700 active:to-gray-600' : 'from-white to-gray-50 border-gray-200 text-gray-700 active:from-gray-50 active:to-gray-100'} active:scale-95`}>
                    {btn}
                  </button>
                ))}
                <button onClick={handleClear} className="col-span-3 py-2 rounded-lg text-xs font-bold border border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-600 dark:from-red-900/20 dark:to-red-800/20 dark:border-red-800">
                  CLEAR (C)
                </button>
              </div>
            </div>
          ) : (
            <div className={`py-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center bg-gradient-to-br ${isDark ? 'from-gray-900/30 via-gray-900/20 to-gray-800/10 border-gray-700' : 'from-gray-50 via-gray-50/50 to-gray-100/30 border-gray-200'}`}>
              {method === 'qris' ? <QrCode className="w-20 h-20 text-purple-500 mb-3" /> : <CreditCard className="w-20 h-20 text-blue-500 mb-3" />}
              <p className="font-bold text-sm uppercase tracking-wide">Waiting for Payment</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={method === 'cash' && (parseFloat(cashReceived.replace(/\./g, '')) || 0) < total}
            className={`w-full mt-5 py-3.5 text-white font-bold rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r ${
              method === 'cash' && (parseFloat(cashReceived.replace(/\./g, '')) || 0) < total
                ? 'from-gray-400 to-gray-500 cursor-not-allowed' : 'from-amber-500 via-orange-500 to-amber-600 shadow-md active:scale-[0.98]'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            PROCESS TRANSACTION
          </button>

          <p className="mt-4 text-[10px] text-center text-gray-400 uppercase tracking-widest font-medium">
            ESC: Close • Enter: Confirm • C: Clear
          </p>
        </div>
      </div>
    </div>
  );
}