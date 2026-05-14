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
            : 'bg-white text-[#0F172A] border-[#CBD5E1]'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex justify-between items-center ${
            isDark ? 'border-stone-800' : 'border-[#CBD5E1]'
          }`}
        >
          <div>
            <h2 className="text-lg font-bold">Order Details</h2>
            <p className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-[#64748B]'}`}>
              Complete your order information
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg border transition ${
              isDark
                ? 'border-stone-800 hover:bg-stone-900'
                : 'border-[#CBD5E1] hover:bg-[#F8FAFC]'
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
            <div className={`flex gap-2 p-1 rounded-2xl ${isDark ? 'bg-stone-900' : 'bg-[#F1F5F9]'}`}>
              {(['dine-in', 'take-away'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onOrderTypeChange(type)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${orderType === type
                    ? isDark
                      ? 'bg-stone-800 text-amber-400'
                      : 'bg-white text-teal-800 shadow-sm'
                    : isDark
                      ? 'text-stone-400 hover:text-stone-200'
                      : 'text-[#64748B] hover:text-[#0F172A]'
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
              className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-amber-500' : 'focus:ring-teal-500'} transition ${
                isDark
                  ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                  : 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8]'
              }`}
              autoFocus
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-[#64748B]'}`}>
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
                className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-amber-500' : 'focus:ring-teal-500'} transition ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                    : 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8]'
                }`}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-[#64748B]'}`}>
                {tableNumber.length}/20 characters
              </p>
            </div>
          )}

          {/* Order Description Field */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Order Notes
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#64748B]'}`}>
                (Optional)
              </span>
            </label>
            <textarea
              value={orderDescription}
              onChange={(e) => onOrderDescriptionChange(e.target.value)}
              placeholder="e.g., 'ASAP', 'Birthday order', 'Special setup for event', etc."
              maxLength={200}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-amber-500' : 'focus:ring-teal-500'} transition ${
                isDark
                  ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                  : 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8]'
              }`}
              rows={3}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-[#64748B]'}`}>
              {orderDescription.length}/200 characters
            </p>
          </div>

          {/* Order Type Info */}
          <div
            className={`p-3 rounded-lg border ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-[#F8FAFC] border-[#CBD5E1]'
            }`}
          >
            <p className="text-xs font-semibold mb-1">Order Type</p>
            <p className={`text-sm font-bold ${isDark ? 'text-amber-500' : 'text-teal-700'}`}>
              {orderType === 'dine-in' ? '🪑 Dine In' : '📦 Take Away'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-5 border-t flex gap-3 ${isDark ? 'border-stone-800' : 'border-[#CBD5E1]'}`}
        >
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 px-4 rounded-lg border font-semibold transition ${
              isDark
                ? 'border-stone-800 hover:bg-stone-900'
                : 'border-[#CBD5E1] hover:bg-[#F8FAFC]'
            }`}
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={!isFormValid}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition ${
              isFormValid
                ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/10'
                : isDark
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-stone-200 text-[#94A3B8] cursor-not-allowed'
            }`}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
