import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Banknote, CreditCard, QrCode, CheckCircle, DollarSign } from 'lucide-react';
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

  // Format display value with thousand separators
  const formatDisplayValue = useCallback((value: string): string => {
    if (!value) return '0';
    
    try {
      // Check if value has decimal point
      const hasDecimal = value.includes('.');
      let integerPart = value;
      let decimalPart = '';
      
      if (hasDecimal) {
        [integerPart, decimalPart] = value.split('.');
        // Ensure decimal part has max 2 digits
        decimalPart = decimalPart.slice(0, 2);
      }
      
      // Format integer part with thousand separators
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      if (hasDecimal) {
        return `${formattedInteger},${decimalPart.padEnd(2, '0')}`;
      }
      
      return formattedInteger;
    } catch (error) {
      console.error('Formatting error:', error);
      return value;
    }
  }, []);

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

  // Format currency for display (total, change, etc.)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2">
      <div 
        ref={modalRef}
        className={`w-full max-w-xl rounded-xl shadow-xl overflow-hidden bg-gradient-to-b ${isDark ? 'from-gray-800 via-gray-800 to-gray-900' : 'from-white via-white to-gray-50'}`}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        autoFocus
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment</h2>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label="Close payment modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {/* Total Amount */}
          <div className={`mb-4 p-3 rounded-lg flex justify-between items-center bg-gradient-to-r ${isDark ? 'from-gray-900/50 to-gray-800/30' : 'from-gray-50 to-gray-100'}`}>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</span>
            <div className={`text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              Rp {formatCurrency(total)}
            </div>
          </div>

          {/* Payment Method Selector */}
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
              {/* Left Column: Cash Input Info */}
              <div className="space-y-3">
                <div className={`p-3 rounded-lg border bg-gradient-to-br ${isDark ? 'from-gray-900/50 to-gray-800/30 border-gray-700' : 'from-white to-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400 font-semibold uppercase">Received</span>
                    <button
                      onClick={handleClear}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div className="text-lg font-bold">Rp {formatDisplayValue(rawCashValue)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {quickAmounts().map((amount) => (
                      <button 
                        key={amount} 
                        onClick={() => handleQuickCash(amount)} 
                        className={`py-1.5 px-2 rounded text-[10px] font-bold border bg-gradient-to-br ${isDark ? 'from-gray-700 to-gray-600 border-gray-600 text-gray-300' : 'from-gray-100 to-gray-50 border-gray-200 text-gray-700'}`}
                      >
                        {formatCurrency(amount)}
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

              {/* Right Column: Keypad */}
              <div className="grid grid-cols-3 gap-1.5">
                {keypadButtons.map((btn) => (
                  <button 
                    key={btn} 
                    onClick={() => handleKeypadInput(btn)} 
                    className={`py-2.5 rounded-lg text-sm font-bold border bg-gradient-to-b ${isDark ? 'from-gray-800 to-gray-700 border-gray-700 text-white active:from-gray-700 active:to-gray-600' : 'from-white to-gray-50 border-gray-200 text-gray-700 active:from-gray-50 active:to-gray-100'} active:scale-95`}
                  >
                    {btn}
                  </button>
                ))}
                <button 
                  onClick={handleClear}
                  className="col-span-3 py-2 rounded-lg text-xs font-bold border border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-600 dark:from-red-900/20 dark:to-red-800/20 dark:border-red-800"
                >
                  CLEAR (C)
                </button>
              </div>
            </div>
          ) : (
            <div className={`py-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center bg-gradient-to-br ${isDark ? 'from-gray-900/30 via-gray-900/20 to-gray-800/10 border-gray-700' : 'from-gray-50 via-gray-50/50 to-gray-100/30 border-gray-200'}`}>
              {method === 'qris' ? (
                <QrCode className="w-20 h-20 text-purple-500 mb-3" />
              ) : (
                <CreditCard className="w-20 h-20 text-blue-500 mb-3" />
              )}
              <p className="font-bold text-sm uppercase tracking-wide">Waiting for Payment</p>
              <p className="text-xs text-gray-500 mt-2">
                {method === 'qris' ? 'Scan QR Code with your mobile banking app' : 'Insert or tap your card on the reader'}
              </p>
            </div>
          )}

          {/* Process Transaction Button */}
          <button
            onClick={handleSubmit}
            disabled={!canProcessPayment}
            className={`w-full mt-5 py-3.5 text-white font-bold rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r ${
              canProcessPayment
                ? 'from-amber-500 via-orange-500 to-amber-600 shadow-md hover:shadow-lg active:scale-[0.98] transition-all'
                : 'from-gray-400 to-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            {method === 'cash' ? 'PROCESS TRANSACTION' : `PROCESS ${method.toUpperCase()} PAYMENT`}
          </button>

          {/* Keyboard Shortcuts Hint */}
          {method === 'cash' && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Keyboard Shortcuts:</span> [0-9] Input • [.] Decimal • [Backspace] Delete • [C] Clear • [Enter] Submit
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}