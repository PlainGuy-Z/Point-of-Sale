/**
 * Pending Transactions — Local SQLite operations for offline transaction queue
 * 
 * CRUD operations for the pending_transactions and pending_transaction_items tables.
 * These represent transactions created while offline, waiting to be synced to the server.
 * Also provides getPendingAsTransactions() to convert pending records into Transaction[]
 * format for display in UI alongside server data.
 */

import { eq, and, inArray, not } from 'drizzle-orm';
import { getDb, getSQLiteDb } from './database';
import { pendingTransactions, pendingTransactionItems } from './schema';
import { incrementLocalStockAdj } from './catalogSync';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PendingCartItem {
  id: string;
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  isCustom: boolean;
  description?: string;
  variantName?: string;
  variantPrice?: number;
  note?: string;
}

export interface CreatePendingTransactionInput {
  id: string;
  idempotencyKey: string;
  cart: PendingCartItem[];
  cartJson: string;
  paymentMethod: string;
  customerName?: string;
  customerId?: string;
  tableNumber?: string;
  orderType?: string;
  notes?: string;
  orderNote?: string;
  cashReceived?: number;
  applyTax?: boolean;
  branchId?: string;
  localSubtotal: number;
  localTax: number;
  localService: number;
  localGrandTotal: number;
  shiftId?: string;
  cashierId: string;
  cashierName: string;
  shopId: string;
}

export type PendingSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'needs_review' | 'rejected';

export interface PendingTransaction {
  id: string;
  idempotencyKey: string;
  cartJson: string;
  paymentMethod: string;
  customerName: string | null;
  customerId: string | null;
  tableNumber: string | null;
  orderType: string | null;
  notes: string | null;
  orderNote: string | null;
  cashReceived: number | null;
  applyTax: boolean | null;
  branchId: string | null;
  localSubtotal: number;
  localTax: number;
  localService: number;
  localGrandTotal: number;
  shiftId: string | null;
  cashierId: string;
  cashierName: string;
  shopId: string;
  status: string;
  syncError: string | null;
  retryCount: number;
  createdAt: string;
  syncedAt: string | null;
  updatedAt: string;
}

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * Create a new pending transaction with its items.
 * Also updates local_stock_adj for affected products.
 */
export function createPendingTransaction(input: CreatePendingTransactionInput): void {
  const sqlite = getSQLiteDb();
  const now = new Date().toISOString();

  sqlite.execSync('BEGIN TRANSACTION;');
  try {
    // Insert the transaction
    sqlite.runSync(
      `INSERT INTO pending_transactions
        (id, idempotency_key, cart_json, payment_method, customer_name, customer_id,
         table_number, order_type, notes, order_note, cash_received, apply_tax, branch_id,
         local_subtotal, local_tax, local_service, local_grand_total,
         shift_id, cashier_id, cashier_name, shop_id,
         status, retry_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
      [
        input.id,
        input.idempotencyKey,
        input.cartJson,
        input.paymentMethod,
        input.customerName ?? null,
        input.customerId ?? null,
        input.tableNumber ?? null,
        input.orderType ?? null,
        input.notes ?? null,
        input.orderNote ?? null,
        input.cashReceived ?? null,
        input.applyTax ? 1 : 0,
        input.branchId ?? null,
        input.localSubtotal,
        input.localTax,
        input.localService,
        input.localGrandTotal,
        input.shiftId ?? null,
        input.cashierId,
        input.cashierName,
        input.shopId,
        now,
        now,
      ]
    );

    // Insert items
    for (const item of input.cart) {
      sqlite.runSync(
        `INSERT INTO pending_transaction_items
          (id, transaction_id, product_id, name, price, quantity, is_custom,
           description, variant_name, variant_price, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          input.id,
          item.productId ?? null,
          item.name,
          item.price,
          item.quantity,
          item.isCustom ? 1 : 0,
          item.description ?? null,
          item.variantName ?? null,
          item.variantPrice ?? 0,
          item.note ?? null,
        ]
      );

      // Adjust local stock for real products (not manual/custom)
      if (item.productId && !item.isCustom) {
        incrementLocalStockAdj(item.productId, item.quantity);
      }
    }

    sqlite.execSync('COMMIT;');
    console.log(`[PendingTx] Created pending transaction ${input.id} with ${input.cart.length} items`);
  } catch (err) {
    sqlite.execSync('ROLLBACK;');
    console.error('[PendingTx] Failed to create pending transaction:', err);
    throw err;
  }
}

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Get all pending transactions that need to be synced.
 * Returns transactions with status: 'pending' or 'failed' (retryable).
 * @param force If true, bypasses retry limits and backoff timeouts (for manual sync)
 */
export function getPendingTransactionsToSync(force: boolean = false): PendingTransaction[] {
  try {
    const db = getDb();
    // Include 'syncing' to recover transactions stuck after app crash/kill
    const candidates = db
      .select()
      .from(pendingTransactions)
      .where(
        inArray(pendingTransactions.status, ['pending', 'failed', 'syncing'])
      )
      .orderBy(pendingTransactions.createdAt)
      .all() as PendingTransaction[];

    if (force) {
      return candidates;
    }

    const now = Date.now();
    return candidates.filter((tx) => {
      if (tx.status === 'pending') return true;
      if (tx.status === 'syncing') {
        // Recover stuck 'syncing' transactions after 2 minutes.
        // If a transaction has been 'syncing' for > 2 min, the original
        // request likely failed (app crash/kill) and we should retry.
        const lastUpdated = tx.updatedAt ? new Date(tx.updatedAt).getTime() : 0;
        return (now - lastUpdated) >= 120_000;
      }
      if (tx.status === 'failed') {
        const retryCount = tx.retryCount || 0;
        if (retryCount >= 5) return false; // Exceeded max retries

        // Exponential backoff: retry 1 -> 15s, retry 2 -> 30s, retry 3 -> 60s, retry 4 -> 120s
        const backoffMs = Math.min(15_000 * Math.pow(2, Math.max(0, retryCount - 1)), 300_000);
        const lastUpdated = tx.updatedAt ? new Date(tx.updatedAt).getTime() : 0;
        return (now - lastUpdated) >= backoffMs;
      }
      return false;
    });
  } catch (err) {
    console.error('[PendingTx] getPendingTransactionsToSync error:', err);
    return [];
  }
}

/**
 * Get count of pending (unsynced) transactions.
 */
export function getPendingCount(): number {
  try {
    const db = getDb();
    const rows = db
      .select()
      .from(pendingTransactions)
      .where(inArray(pendingTransactions.status, ['pending', 'failed', 'syncing']))
      .all();
    return rows.length;
  } catch (err) {
    return 0;
  }
}

/**
 * Get count of transactions needing review.
 */
export function getNeedsReviewCount(): number {
  try {
    const db = getDb();
    const rows = db
      .select()
      .from(pendingTransactions)
      .where(eq(pendingTransactions.status, 'needs_review'))
      .all();
    return rows.length;
  } catch (err) {
    return 0;
  }
}

/**
 * Get all pending transactions for display (any status except 'synced').
 */
export function getAllPendingTransactions(): PendingTransaction[] {
  try {
    const db = getDb();
    return db
      .select()
      .from(pendingTransactions)
      .orderBy(pendingTransactions.createdAt)
      .all() as PendingTransaction[];
  } catch (err) {
    return [];
  }
}

/**
 * Get a single pending transaction by ID.
 */
export function getPendingTransactionById(id: string): PendingTransaction | undefined {
  try {
    const db = getDb();
    return db
      .select()
      .from(pendingTransactions)
      .where(eq(pendingTransactions.id, id))
      .get() as PendingTransaction | undefined;
  } catch (err) {
    return undefined;
  }
}

/**
 * Get totals for pending transactions by shift ID.
 * Excludes rejected transactions.
 */
export function getPendingTotalsByShiftId(shiftId: string): { totalSales: number; totalTransactions: number } {
  try {
    const db = getDb();
    const rows = db
      .select()
      .from(pendingTransactions)
      .where(
        and(
          eq(pendingTransactions.shiftId, shiftId),
          not(inArray(pendingTransactions.status, ['synced', 'rejected']))
        )
      )
      .all();

    let totalSales = 0;
    for (const row of rows) {
      totalSales += row.localGrandTotal;
    }
    return { totalSales, totalTransactions: rows.length };
  } catch (err) {
    console.error('[PendingTx] getPendingTotalsByShiftId error:', err);
    return { totalSales: 0, totalTransactions: 0 };
  }
}


// ─── Update ──────────────────────────────────────────────────────────────────

/**
 * Mark a transaction as currently syncing.
 */
export function markAsSyncing(id: string): void {
  const sqlite = getSQLiteDb();
  const now = new Date().toISOString();
  sqlite.runSync(
    `UPDATE pending_transactions SET status = 'syncing', updated_at = ? WHERE id = ?`,
    [now, id]
  );
}

/**
 * Mark a transaction as successfully synced.
 */
export function markAsSynced(id: string): void {
  const sqlite = getSQLiteDb();
  const now = new Date().toISOString();
  sqlite.runSync(
    `UPDATE pending_transactions SET status = 'synced', synced_at = ?, updated_at = ? WHERE id = ?`,
    [now, now, id]
  );
}

/**
 * Mark a transaction as failed (retryable).
 */
export function markAsFailed(id: string, error: string): void {
  const sqlite = getSQLiteDb();
  const now = new Date().toISOString();
  const tx = getPendingTransactionById(id);
  const nextRetry = (tx?.retryCount ?? 0) + 1;

  if (nextRetry >= 5) {
    sqlite.runSync(
      `UPDATE pending_transactions 
       SET status = 'needs_review', sync_error = ?, retry_count = ?, updated_at = ?
       WHERE id = ?`,
      [`Gagal sync setelah ${nextRetry}x percobaan: ${error}`, nextRetry, now, id]
    );
  } else {
    sqlite.runSync(
      `UPDATE pending_transactions 
       SET status = 'failed', sync_error = ?, retry_count = ?, updated_at = ?
       WHERE id = ?`,
      [error, nextRetry, now, id]
    );
  }
}

/**
 * Mark a transaction as needing review (stok conflict etc).
 */
export function markAsNeedsReview(id: string, reason: string): void {
  const sqlite = getSQLiteDb();
  const now = new Date().toISOString();
  sqlite.runSync(
    `UPDATE pending_transactions SET status = 'needs_review', sync_error = ?, synced_at = ?, updated_at = ? WHERE id = ?`,
    [reason, now, now, id]
  );
}

/**
 * Mark a transaction as rejected by server.
 */
export function markAsRejected(id: string, reason: string): void {
  const sqlite = getSQLiteDb();
  const now = new Date().toISOString();
  sqlite.runSync(
    `UPDATE pending_transactions SET status = 'rejected', sync_error = ?, updated_at = ? WHERE id = ?`,
    [reason, now, id]
  );
}

/**
 * Mark a transaction as duplicate (already exists on server).
 */
export function markAsDuplicate(id: string): void {
  markAsSynced(id);
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

/**
 * Delete synced transactions older than the given number of days.
 * Keeps the local DB lean.
 */
export function pruneSyncedTransactions(olderThanDays: number = 7): number {
  const sqlite = getSQLiteDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  const cutoffStr = cutoff.toISOString();

  // First delete items, then transactions
  sqlite.runSync(
    `DELETE FROM pending_transaction_items WHERE transaction_id IN 
     (SELECT id FROM pending_transactions WHERE status = 'synced' AND synced_at < ?)`,
    [cutoffStr]
  );
  const result = sqlite.runSync(
    `DELETE FROM pending_transactions WHERE status = 'synced' AND synced_at < ?`,
    [cutoffStr]
  );

  const deleted = result.changes;
  if (deleted > 0) {
    console.log(`[PendingTx] Pruned ${deleted} synced transactions older than ${olderThanDays} days`);
  }
  return deleted;
}

// ─── Conversion for UI Display ───────────────────────────────────────────────

/**
 * Convert unsynced pending transactions to Transaction[] format for UI display.
 * 
 * This allows the AppContext to merge offline transactions with server data,
 * ensuring they remain visible in dashboard, sales reports, and history
 * even after app restart (when server state overwrites in-memory state).
 * 
 * Only returns transactions that haven't been synced yet (excludes 'synced' status).
 */
export function getPendingAsTransactions(): Array<{
  id: string;
  date: Date;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    note?: string;
    description?: string;
    variantName?: string;
    variantPrice?: number;
  }>;
  total: number;
  cost: number;
  profit: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  customerId?: string;
  customerName?: string;
  cashierName?: string;
  tableNumber?: string;
  notes?: string;
  cashReceived?: number;
  change?: number;
  taxRate?: number;
  subtotal?: number;
  tax?: number;
  service_charge?: number;
  orderType?: 'dine-in' | 'take-away';
  orderNote?: string;
}> {
  try {
    const db = getDb();
    const sqlite = getSQLiteDb();

    // Get all pending transactions that are NOT yet synced
    const txRows = db
      .select()
      .from(pendingTransactions)
      .where(not(eq(pendingTransactions.status, 'synced')))
      .orderBy(pendingTransactions.createdAt)
      .all();

    if (txRows.length === 0) return [];

    return txRows.map((tx) => {
      // Fetch items for this transaction
      const itemRows = db
        .select()
        .from(pendingTransactionItems)
        .where(eq(pendingTransactionItems.transactionId, tx.id))
        .all();

      const items = itemRows.map((item) => ({
        productId: item.productId || `manual-${item.id}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note ?? undefined,
        description: item.description ?? undefined,
        variantName: item.variantName ?? undefined,
        variantPrice: item.variantPrice ?? undefined,
      }));

      const cashReceived = tx.cashReceived ?? undefined;
      const grandTotal = tx.localGrandTotal;
      const change = cashReceived != null ? Math.max(0, cashReceived - grandTotal) : undefined;

      return {
        id: tx.id,
        date: new Date(tx.createdAt),
        items,
        total: grandTotal,
        cost: 0,      // Cost not available offline
        profit: 0,    // Profit not available offline
        paymentMethod: (tx.paymentMethod as 'cash' | 'card' | 'qris') || 'cash',
        customerId: tx.customerId ?? undefined,
        customerName: tx.customerName ?? undefined,
        cashierName: tx.cashierName,
        tableNumber: tx.tableNumber ?? undefined,
        notes: tx.notes ?? undefined,
        cashReceived,
        change,
        taxRate: undefined, // Will be recalculated by server during sync
        subtotal: tx.localSubtotal,
        tax: tx.localTax,
        service_charge: tx.localService,
        orderType: (tx.orderType as 'dine-in' | 'take-away') ?? undefined,
        orderNote: tx.orderNote ?? undefined,
      };
    });
  } catch (err) {
    console.error('[PendingTx] getPendingAsTransactions error:', err);
    return [];
  }
}
