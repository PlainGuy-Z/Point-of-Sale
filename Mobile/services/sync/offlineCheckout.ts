/**
 * Offline Checkout Service
 * 
 * Handles creating a transaction locally when the device is offline.
 * Calculates subtotal/tax/total from cached shop settings and stores
 * the transaction in the pending queue for later sync.
 */

import * as Crypto from 'expo-crypto';
import { getLocalShopSettings } from '../db/catalogSync';
import {
  createPendingTransaction,
  type CreatePendingTransactionInput,
  type PendingCartItem,
} from '../db/pendingTransactions';
import type { CartItemWithInput, Transaction, CheckoutParams } from '../../types';

/**
 * Process a checkout entirely offline.
 * 
 * 1. Generate UUID for the transaction via expo-crypto
 * 2. Calculate totals from cached shop settings
 * 3. Store in pending_transactions SQLite table
 * 4. Return a Transaction-shaped object for immediate UI display
 */
export async function offlineCheckout(params: {
  cart: CartItemWithInput[];
  paymentMethod: 'cash' | 'card' | 'qris';
  customerId?: string;
  customerName?: string;
  orderType: 'dine-in' | 'take-away';
  tableNumber?: string;
  cashReceived?: number;
  orderNote?: string;
  notes?: string;
  applyTax?: boolean;
  branchId?: string;
  shiftId?: string | null;
  cashierId: string;
  cashierName: string;
  shopId: string;
}): Promise<Transaction> {
  const txId = Crypto.randomUUID();
  const idempotencyKey = `offline-${txId}`;
  const now = new Date();
  const nowISO = now.toISOString();

  // ── Calculate totals from cached settings ──────────────────────────────────

  const settings = getLocalShopSettings();
  const taxRate = settings?.taxEnabled !== false ? (settings?.taxRate ?? 11) / 100 : 0;
  const serviceRate = settings?.serviceChargeEnabled ? (settings?.serviceChargeRate ?? 0) / 100 : 0;

  let subtotal = 0;
  const cartItems: PendingCartItem[] = [];

  for (const item of params.cart) {
    const itemPrice = Number(item.price) + Number(item.variantPrice || 0);
    subtotal += itemPrice * item.quantity;

    cartItems.push({
      id: Crypto.randomUUID(),
      productId: item.productId.startsWith('manual-') ? null : item.productId,
      name: item.name,
      price: itemPrice,
      quantity: item.quantity,
      isCustom: item.productId.startsWith('manual-'),
      description: item.description,
      variantName: item.variantName,
      variantPrice: item.variantPrice,
      note: item.note,
    });
  }

  const tax = params.applyTax ? Math.round(subtotal * taxRate) : 0;
  const serviceCharge = Math.round(subtotal * serviceRate);
  const grandTotal = subtotal + tax + serviceCharge;

  // ── Build cart JSON for sync payload ───────────────────────────────────────

  const cartJson = JSON.stringify(
    params.cart.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      note: i.note,
      description: i.description,
      variantName: i.variantName,
      variantPrice: i.variantPrice,
      ...(i.productId.startsWith('manual-') ? { price: i.price } : {}),
    }))
  );

  // ── Store in pending queue ─────────────────────────────────────────────────

  const input: CreatePendingTransactionInput = {
    id: txId,
    idempotencyKey,
    cart: cartItems,
    cartJson,
    paymentMethod: params.paymentMethod,
    customerName: params.customerName,
    customerId: params.customerId,
    tableNumber: params.tableNumber,
    orderType: params.orderType,
    notes: params.notes,
    orderNote: params.orderNote,
    cashReceived: params.cashReceived,
    applyTax: params.applyTax,
    branchId: params.branchId,
    localSubtotal: subtotal,
    localTax: tax,
    localService: serviceCharge,
    localGrandTotal: grandTotal,
    shiftId: params.shiftId ?? undefined,
    cashierId: params.cashierId,
    cashierName: params.cashierName,
    shopId: params.shopId,
  };

  createPendingTransaction(input);

  // ── Return Transaction-shaped object for immediate UI ──────────────────────

  const cashReceived = params.paymentMethod === 'cash' && params.cashReceived != null
    ? params.cashReceived
    : undefined;
  const change = cashReceived != null ? Math.max(0, cashReceived - grandTotal) : undefined;

  const transaction: Transaction = {
    id: txId,
    date: now,
    items: params.cart.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: Number(i.price) + Number(i.variantPrice || 0),
      quantity: i.quantity,
      note: i.note,
      description: i.description,
      variantName: i.variantName,
      variantPrice: i.variantPrice,
    })),
    total: grandTotal,
    subtotal,
    tax,
    service_charge: serviceCharge,
    cost: 0,       // Cost not available offline — will be calculated server-side
    profit: 0,     // Profit not available offline
    paymentMethod: params.paymentMethod,
    customerId: params.customerId,
    customerName: params.customerName,
    cashierName: params.cashierName,
    tableNumber: params.tableNumber,
    notes: params.notes,
    cashReceived,
    change,
    taxRate: settings?.taxRate ?? 11,
    orderType: params.orderType,
    orderNote: params.orderNote,
  };

  console.log(`[OfflineCheckout] Created offline transaction ${txId} — total: ${grandTotal}`);
  return transaction;
}
