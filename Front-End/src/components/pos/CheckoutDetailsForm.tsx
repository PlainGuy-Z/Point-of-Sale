import { X, MessageSquare, User, Hash } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface CheckoutDetailsFormProps {
  customerName: string;
  tableNumber: string;
  orderDescription: string;
  orderType: 'dine-in' | 'take-away';
  onCustomerNameChange: (value: string) => void;
  onTableNumberChange: (value: string) => void;
  onOrderDescriptionChange: (value: string) => void;
  onOrderTypeChange: (value: 'dine-in' | 'take-away') => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function CheckoutDetailsForm({
  customerName,
  tableNumber,
  orderDescription,
  orderType,
  onCustomerNameChange,
  onTableNumberChange,
  onOrderDescriptionChange,
  onOrderTypeChange,
  onClose,
  onSubmit
}: CheckoutDetailsFormProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const isTableNumberRequired = orderType === 'dine-in';

  // Validate form
  const isFormValid =
    (!isTableNumberRequired || tableNumber.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-stone-950/95 text-stone-100 border-stone-800'
            : 'bg-white/95 text-stone-900 border-stone-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex justify-between items-center ${
            isDark ? 'border-stone-800' : 'border-stone-200'
          }`}
        >
          <div>
            <h2 className="text-lg font-bold">Order Details</h2>
            <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Complete your order information
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg border transition ${
              isDark
                ? 'border-stone-800 hover:bg-stone-900'
                : 'border-stone-200 hover:bg-stone-100'
            }`}
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto horizontal-scrollbar-thin">
          {/* Order Type Selector */}
          <div>
            <label className="block text-sm font-semibold mb-2">Order Type</label>
            <div className={`flex gap-2 p-1 rounded-2xl ${isDark ? 'bg-stone-900' : 'bg-gray-100'}`}>
              {(['dine-in', 'take-away'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onOrderTypeChange(type)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${orderType === type
                    ? isDark
                      ? 'bg-stone-800 text-amber-400'
                      : 'bg-white text-amber-600 shadow-sm'
                    : isDark
                      ? 'text-stone-400 hover:text-stone-200'
                      : 'text-stone-500 hover:text-gray-700'
                    }`}
                >
                  {type === 'dine-in' ? 'Dine In' : 'Take Away'}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Name Field */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="e.g., Budi Santoso"
              maxLength={50}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                isDark
                  ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                  : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
              }`}
              autoFocus
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {customerName.length}/50 characters
            </p>
          </div>

          {/* Table Number Field (only for dine-in) */}
          {orderType === 'dine-in' && (
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Table Number
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => onTableNumberChange(e.target.value)}
                placeholder="e.g., 5, A1, Window-3"
                maxLength={20}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                    : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
                }`}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                {tableNumber.length}/20 characters
              </p>
            </div>
          )}

          {/* Order Description Field */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Order Notes
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                (Optional)
              </span>
            </label>
            <textarea
              value={orderDescription}
              onChange={(e) => onOrderDescriptionChange(e.target.value)}
              placeholder="e.g., 'ASAP', 'Birthday order', 'Special setup for event', etc."
              maxLength={200}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                isDark
                  ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                  : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
              }`}
              rows={3}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {orderDescription.length}/200 characters
            </p>
          </div>

          {/* Order Type Info */}
          <div
            className={`p-3 rounded-lg border ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <p className="text-xs font-semibold mb-1">Order Type</p>
            <p className={`text-sm font-bold text-amber-500`}>
              {orderType === 'dine-in' ? '🪑 Dine In' : '📦 Take Away'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-5 border-t flex gap-3 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}
        >
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 px-4 rounded-lg border font-semibold transition ${
              isDark
                ? 'border-stone-800 hover:bg-stone-900'
                : 'border-stone-200 hover:bg-stone-100'
            }`}
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={!isFormValid}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition ${
              isFormValid
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : isDark
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
