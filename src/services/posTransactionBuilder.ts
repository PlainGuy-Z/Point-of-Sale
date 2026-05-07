import type { BusinessSettings, CartItemWithInput, Customer, Transaction } from '../types';

interface BuildTransactionParams {
  cart: CartItemWithInput[];
  paymentMethod: 'cash' | 'card' | 'qris';
  selectedCustomer?: string;
  customCustomerName?: string;
  customers: Customer[];
  orderType: 'dine-in' | 'take-away';
  tableNumber?: string;
  settings?: BusinessSettings;
  cashReceived?: number;
  change?: number;
  orderNote?: string;
}

export interface CartTotals {
  subtotal: number;
  totalCost: number;
  taxRate: number;
  tax: number;
  grandTotal: number;
  profit: number;
  totalSavings: number;
}

export function calculateCartTotals(cart: CartItemWithInput[], taxRatePercent = 0): CartTotals {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  const taxRate = taxRatePercent / 100;
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + tax;
  const profit = subtotal - totalCost;
  const totalSavings = cart.reduce((sum, item) => {
    if (item.isPromo && item.originalPrice) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);

  return { subtotal, totalCost, taxRate, tax, grandTotal, profit, totalSavings };
}

function createTransactionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tx-${Date.now()}`;
}

export function buildTransaction(params: BuildTransactionParams): Transaction {
  const {
    cart,
    paymentMethod,
    selectedCustomer,
    customCustomerName,
    customers,
    orderType,
    tableNumber,
    settings,
    cashReceived,
    change,
    orderNote,
  } = params;

  const totals = calculateCartTotals(cart, settings?.taxRate || 0);

  return {
    id: createTransactionId(),
    date: new Date(),
    items: cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      cost: item.cost,
      note: item.note,
      modifiers: item.modifiers,
      isPromo: item.isPromo,
      originalPrice: item.originalPrice,
      promoPrice: item.promoPrice,
      promoLabel: item.promoLabel,
    })),
    total: totals.grandTotal,
    cost: totals.totalCost,
    profit: totals.profit,
    paymentMethod,
    customerId: selectedCustomer,
    customerName: customCustomerName || customers.find((c) => c.id === selectedCustomer)?.name,
    tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
    orderType,
    cashReceived,
    change,
    taxRate: settings?.taxRate || 0,
    orderNote,
  };
}
