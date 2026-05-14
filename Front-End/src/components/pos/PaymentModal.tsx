import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Banknote, CreditCard, QrCode, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onConfirm: (method: 'cash' | 'card' | 'qris', cashReceived?: number, change?: number) => void;
}

export default function PaymentModal({ total, onClose, onConfirm }: PaymentModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  
  const [method, setMethod] = useState<'cash' | 'card' | 'qris'>('cash');
  const [rawCashValue, setRawCashValue] = useState<string>(''); // Store raw numeric value without formatting
  const [change, setChange] = useState<number>(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate change whenever rawCashValue or total changes
  useEffect(() => {
    const received = parseFloat(rawCashValue) || 0;
    setChange(Math.max(0, received - total));
  }, [rawCashValue, total]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  // Auto-focus modal when opened
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '.'];

  const handleKeypadInput = (value: string) => {
    let newValue = rawCashValue;
    
    // Handle decimal point
    if (value === '.') {
      if (newValue.includes('.')) return; // Already has decimal point
      if (newValue === '') {
        setRawCashValue('0.');
      } else {
        setRawCashValue(prev => prev + '.');
      }
      return;
    }
    
    // Handle '00' input
    if (value === '00') {
      newValue += '00';
    } else {
      newValue += value;
    }
    
    // Remove leading zeros (except for '0.' cases)
    if (newValue.startsWith('0') && newValue.length > 1 && !newValue.startsWith('0.')) {
      newValue = newValue.substring(1);
    }
    
    // Limit decimal places to 2
    if (newValue.includes('.')) {
      const [integer, decimal] = newValue.split('.');
      if (decimal && decimal.length > 2) {
        newValue = `${integer}.${decimal.slice(0, 2)}`;
      }
    }
    
    setRawCashValue(newValue);
  };

  const handleBackspace = () => {
    setRawCashValue(prev => {
      if (prev.length <= 1) return '';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => setRawCashValue('');

  const handleQuickCash = (amount: number) => {
    // Store as string without thousand separators
    setRawCashValue(amount.toString());
  };

  const handleSubmit = () => {
    const received = parseFloat(rawCashValue) || 0;
    
    if (method === 'cash') {
      if (received < total) { 
        alert('Uang tunai kurang!'); 
        return; 
      }
      onConfirm(method, received, change);
    } else { 
      onConfirm(method); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (method === 'cash') {
      // Numeric keys
      if (e.key >= '0' && e.key <= '9') { 
        e.preventDefault(); 
        handleKeypadInput(e.key); 
      }
      // Decimal point
      else if (e.key === '.' || e.key === ',') { 
        e.preventDefault(); 
        handleKeypadInput('.'); 
      }
      // Backspace
      else if (e.key === 'Backspace') { 
        e.preventDefault(); 
        handleBackspace(); 
      }
      // Clear (Delete or C)
      else if (e.key === 'Delete' || e.key.toLowerCase() === 'c') { 
        e.preventDefault(); 
        handleClear(); 
      }
      // Enter to submit
      else if (e.key === 'Enter') { 
        e.preventDefault(); 
        handleSubmit(); 
      }
    }
  };

  // Generate quick cash amounts
  const quickAmounts = useCallback(() => {
    const amounts = [total];
    
    // Round up to nearest 50k
    const round50k = Math.ceil(total / 50000) * 50000;
    // Round up to nearest 100k
    const round100k = Math.ceil(total / 100000) * 100000;
    
    // Add rounded amounts if they're different from total
    if (round50k !== total) amounts.push(round50k);
    if (round100k !== round50k && round100k !== total) amounts.push(round100k);
    
    // Add fixed amount for smaller totals
    if (total < 150000) {
      const twoHundredThousand = 200000;
      if (!amounts.includes(twoHundredThousand)) amounts.push(twoHundredThousand);
    }
    
    // Remove duplicates, sort, and take max 4 amounts
    return [...new Set(amounts)]
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [total]);

  // Check if payment can be processed
  const canProcessPayment = method === 'cash' 
    ? (parseFloat(rawCashValue) || 0) >= total
    : true;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      <div 
        ref={modalRef}
        className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border ${
          isDark
            ? 'bg-stone-950/80 border-stone-800'
            : 'bg-white border-[#E2E8F0]'
        }`}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        autoFocus
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Payment</h2>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1a1614]' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'}`}
            aria-label="Close payment modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Total Amount */}
          <div className={`mb-4 p-4 rounded-xl flex justify-between items-center border ${
            isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <span className={`text-sm font-bold ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Total</span>
            <div className={`text-xl font-black ${isDark ? 'text-amber-500' : 'text-teal-600'}`}>
              {format(total)}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'card', label: 'Card', icon: CreditCard },
              { id: 'qris', label: 'QRIS', icon: QrCode },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id as any)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  method === m.id 
                    ? `bg-teal-50 border-2 border-teal-500 text-teal-700` 
                    : isDark 
                      ? 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-[#1a1614]' 
                      : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                <m.icon className={`w-4 h-4 ${method === m.id ? 'text-teal-600' : isDark ? 'text-stone-400' : 'text-stone-500'}`} />
                <span className={`text-xs font-bold`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {method === 'cash' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Cash Input Info */}
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-stone-400 font-semibold uppercase">Received</span>
                    <button
                      onClick={handleClear}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                      {rawCashValue ? format(Number(rawCashValue)) : format(0)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {quickAmounts().map((amount) => (
                      <button 
                        key={amount} 
                        onClick={() => handleQuickCash(amount)} 
                        className={`py-2 px-2 rounded-xl text-[10px] font-bold border ${isDark ? 'bg-stone-950 border-stone-800 text-stone-200 hover:bg-[#1a1614]' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
                      >
                        {format(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${change >= 0 ? (isDark ? 'bg-green-900/10 border-green-800' : 'bg-green-50 border-green-200') : (isDark ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200')}`}>
                  <span className="text-xs text-stone-400 font-semibold uppercase">Change</span>
                  <div className={`text-lg font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {format(Math.abs(change))}
                  </div>
                </div>
              </div>

              {/* Right Column: Keypad */}
              <div className="grid grid-cols-3 gap-1.5">
                {keypadButtons.map((btn) => (
                  <button 
                    key={btn} 
                    onClick={() => handleKeypadInput(btn)} 
                    className={`py-3 rounded-xl text-sm font-bold border ${isDark ? 'bg-stone-950 border-stone-800 text-white active:bg-[#1a1614]' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] active:bg-stone-50'} active:scale-[0.99] transition-all`}
                  >
                    {btn}
                  </button>
                ))}
                <button 
                  onClick={handleClear}
                  className="col-span-3 py-3 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-800"
                >
                  CLEAR (C)
                </button>
              </div>
            </div>
          ) : (
            <div className={`py-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
              {method === 'qris' ? (
                <QrCode className="w-20 h-20 text-purple-500 mb-3" />
              ) : (
                <CreditCard className={`w-20 h-20 mb-3 ${isDark ? 'text-amber-500' : 'text-teal-500'}`} />
              )}
              <p className="font-bold text-sm uppercase tracking-wide">Waiting for Payment</p>
              <p className="text-xs text-stone-500 mt-2">
                {method === 'qris' ? 'Scan QR Code with your mobile banking app' : 'Insert or tap your card on the reader'}
              </p>
            </div>
          )}

          {/* Process Transaction Button */}
          <button
            onClick={handleSubmit}
            disabled={!canProcessPayment}
            className={`w-full mt-5 py-4 text-white font-black rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r transition-all ${
              canProcessPayment
                ? isDark 
                  ? 'from-amber-500 via-orange-500 to-amber-600 shadow-md hover:shadow-lg active:scale-[0.98]' 
                  : 'from-teal-500 via-teal-600 to-emerald-600 shadow-md hover:shadow-lg active:scale-[0.98]'
                : 'from-gray-400 to-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            {method === 'cash' ? 'PROCESS TRANSACTION' : `PROCESS ${method.toUpperCase()} PAYMENT`}
          </button>

          {/* Keyboard Shortcuts Hint */}
          {method === 'cash' && (
            <div className="mt-3 text-center">
              <p className="text-xs text-stone-500">
                <span className="font-semibold">Keyboard Shortcuts:</span> [0-9] Input • [.] Decimal • [Backspace] Delete • [C] Clear • [Enter] Submit
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}