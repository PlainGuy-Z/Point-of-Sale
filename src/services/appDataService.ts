import type { BusinessSettings, CartItemWithInput, Customer, Product, Transaction, WasteLog } from '../types';
import { customers as initialCustomers, mockTransactions, products as initialProducts } from '../data/mockData';
import { buildTransaction, calculateCartTotals, type CartTotals } from './posTransactionBuilder';

const STORAGE_KEYS = {
  PRODUCTS: 'coffee_pos_products',
  CUSTOMERS: 'coffee_pos_customers',
  SETTINGS: 'coffee_pos_settings',
  CATEGORIES: 'coffee_pos_categories',
  TRANSACTIONS: 'coffee_pos_transactions',
  WASTE_LOGS: 'coffee_pos_waste_logs',
} as const;

const SERVICE_LATENCY_MS = 2000;
const MAX_TRANSACTIONS = 1000;
const MAX_WASTE_LOGS = 300;

export interface AppDataState {
  products: Product[];
  transactions: Transaction[];
  wasteLogs: WasteLog[];
  customers: Customer[];
  settings: BusinessSettings;
  categories: string[];
}

export interface CheckoutParams {
  cart: CartItemWithInput[];
  paymentMethod: Transaction['paymentMethod'];
  selectedCustomer?: string;
  customCustomerName?: string;
  orderType: 'dine-in' | 'take-away';
  tableNumber?: string;
  cashReceived?: number;
  change?: number;
  orderNote?: string;
}

export interface CheckoutResult {
  nextState: AppDataState;
  transaction: Transaction;
}

const defaultSettings: BusinessSettings = {
  storeName: 'Coffee Shop',
  address: 'Jl. Utama No. 123',
  taxRate: 11,
  currency: 'IDR',
  currencyPosition: 'before',
  decimalPlaces: 0,
  thousandsSeparator: 'comma',
  receiptFooter: 'Terima kasih telah berbelanja!',
};

const defaultCategories = ['Coffee', 'Tea', 'Pastry', 'Food', 'Merchandise'];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseTransactionDate = (data: any): Transaction => ({ ...data, date: new Date(data.date) });
const parseWasteDate = (data: any): WasteLog => ({ ...data, date: new Date(data.date) });

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function serializeState(state: AppDataState) {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(state.products));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(state.customers));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
  localStorage.setItem(
    STORAGE_KEYS.TRANSACTIONS,
    JSON.stringify(state.transactions.map((t) => ({ ...t, date: t.date.toISOString() }))),
  );
  localStorage.setItem(
    STORAGE_KEYS.WASTE_LOGS,
    JSON.stringify(state.wasteLogs.map((w) => ({ ...w, date: w.date.toISOString() }))),
  );
}

function readState(): AppDataState {
  const products = readJson<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
  const customers = readJson<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  const settings = { ...defaultSettings, ...readJson<Partial<BusinessSettings>>(STORAGE_KEYS.SETTINGS, {}) };
  const categories = readJson<string[]>(STORAGE_KEYS.CATEGORIES, defaultCategories);
  const transactionsRaw = readJson<any[]>(
    STORAGE_KEYS.TRANSACTIONS,
    mockTransactions.map((t) => ({ ...t, date: new Date(t.date).toISOString() })),
  );
  const wasteRaw = readJson<any[]>(STORAGE_KEYS.WASTE_LOGS, []);

  return {
    products,
    customers,
    settings,
    categories,
    transactions: transactionsRaw.map(parseTransactionDate),
    wasteLogs: wasteRaw.map(parseWasteDate),
  };
}

async function withLatency<T>(fn: () => T): Promise<T> {
  await delay(SERVICE_LATENCY_MS);
  return fn();
}

async function mutate(mutator: (state: AppDataState) => AppDataState): Promise<AppDataState> {
  return withLatency(() => {
    const next = mutator(readState());
    serializeState(next);
    return next;
  });
}

export const appDataService = {
  getState: async (): Promise<AppDataState> => withLatency(readState),

  // Pure helper (dipakai UI untuk preview). Logic hitung total tetap ada di layer service.
  calculateCartTotalsPreview: (cart: CartItemWithInput[], taxRatePercent = 0): CartTotals =>
    calculateCartTotals(cart, taxRatePercent),

  checkout: async (params: CheckoutParams): Promise<CheckoutResult> => {
    const state = readState();
    if (!params.cart.length) throw new Error('Transaksi harus memiliki minimal 1 item');

    const transaction = buildTransaction({
      cart: params.cart,
      paymentMethod: params.paymentMethod,
      selectedCustomer: params.selectedCustomer,
      customCustomerName: params.customCustomerName,
      customers: state.customers,
      orderType: params.orderType,
      tableNumber: params.tableNumber,
      settings: state.settings,
      cashReceived: params.cashReceived,
      change: params.change,
      orderNote: params.orderNote,
    });

    const nextState = await appDataService.addTransaction(transaction);
    return { nextState, transaction };
  },

  addTransaction: async (transaction: Transaction): Promise<AppDataState> =>
    mutate((state) => {
      if (!transaction.items.length) throw new Error('Transaksi harus memiliki item');

      const stockMap = new Map<string, number>();
      transaction.items.forEach((item) => {
        // Custom/manual item tidak terikat stock produk.
        if (item.productId.startsWith('manual-')) return;

        const product = state.products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Produk ${item.productId} tidak ditemukan`);
        if (product.stock < item.quantity) throw new Error(`Stock ${product.name} tidak cukup`);
        stockMap.set(item.productId, item.quantity);
      });

      const products = state.products.map((product) => {
        const qty = stockMap.get(product.id);
        if (!qty) return product;
        return {
          ...product,
          stock: product.stock - qty,
          lastSold: new Date().toISOString(),
          salesCount: (product.salesCount || 0) + qty,
          totalRevenue: (product.totalRevenue || 0) + product.price * qty,
        };
      });

      const transactions = [{ ...transaction, date: new Date() }, ...state.transactions].slice(0, MAX_TRANSACTIONS);
      return { ...state, products, transactions };
    }),

  addWasteLog: async (waste: WasteLog): Promise<AppDataState> =>
    mutate((state) => {
      const product = state.products.find((p) => p.id === waste.productId);
      if (!product) throw new Error(`Produk ${waste.productId} tidak ditemukan`);
      if (product.stock < waste.quantity) throw new Error(`Stock ${product.name} tidak cukup untuk waste`);

      const products = state.products.map((p) =>
        p.id === waste.productId
          ? {
              ...p,
              stock: p.stock - waste.quantity,
              wasteCount: (p.wasteCount || 0) + waste.quantity,
              wasteLoss: (p.wasteLoss || 0) + waste.costLoss,
            }
          : p,
      );
      const wasteLogs = [{ ...waste, date: new Date() }, ...state.wasteLogs].slice(0, MAX_WASTE_LOGS);
      return { ...state, products, wasteLogs };
    }),

  addProduct: async (product: Product): Promise<AppDataState> =>
    mutate((state) => ({ ...state, products: [...state.products, product] })),
  updateProduct: async (product: Product): Promise<AppDataState> =>
    mutate((state) => ({ ...state, products: state.products.map((p) => (p.id === product.id ? product : p)) })),
  deleteProduct: async (id: string): Promise<AppDataState> =>
    mutate((state) => ({ ...state, products: state.products.filter((p) => p.id !== id) })),

  addCustomer: async (customer: Customer): Promise<AppDataState> =>
    mutate((state) => ({ ...state, customers: [...state.customers, customer] })),
  updateCustomer: async (customer: Customer): Promise<AppDataState> =>
    mutate((state) => ({ ...state, customers: state.customers.map((c) => (c.id === customer.id ? customer : c)) })),
  deleteCustomer: async (id: string): Promise<AppDataState> =>
    mutate((state) => ({ ...state, customers: state.customers.filter((c) => c.id !== id) })),

  updateSettings: async (settings: BusinessSettings): Promise<AppDataState> =>
    mutate((state) => ({ ...state, settings })),
  addCategory: async (name: string): Promise<AppDataState> =>
    mutate((state) => ({ ...state, categories: [...state.categories, name] })),
  deleteCategory: async (name: string): Promise<AppDataState> =>
    mutate((state) => ({ ...state, categories: state.categories.filter((c) => c !== name) })),

  clearOldData: async (): Promise<AppDataState> =>
    mutate((state) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return {
        ...state,
        products: state.products.map(({ image, ...rest }) => rest as Product),
        transactions: state.transactions.filter((t) => new Date(t.date) > cutoff),
        wasteLogs: state.wasteLogs.filter((w) => new Date(w.date) > cutoff),
      };
    }),

  resetAllData: async (): Promise<AppDataState> =>
    mutate((state) => ({
      products: initialProducts,
      transactions: [],
      wasteLogs: [],
      customers: initialCustomers,
      settings: state.settings,
      categories: defaultCategories,
    })),
};
