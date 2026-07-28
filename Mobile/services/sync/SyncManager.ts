/**
 * SyncManager — Orchestrates syncing pending offline transactions to the server
 * 
 * Responsibilities:
 *   - Batch uploads pending transactions via POST /pos/sync
 *   - Handles server responses per-transaction (synced/needs_review/rejected/duplicate)
 *   - Implements exponential backoff retry logic
 *   - Ensures only one sync job runs at a time (mutex)
 *   - Triggers catalog refresh after successful sync
 */

import { http } from '../api';
import {
  getPendingTransactionsToSync,
  getPendingCount,
  markAsSyncing,
  markAsSynced,
  markAsFailed,
  markAsNeedsReview,
  markAsRejected,
  markAsDuplicate,
  pruneSyncedTransactions,
  type PendingTransaction,
} from '../db/pendingTransactions';
import { syncCatalog, resetLocalStockAdj } from '../db/catalogSync';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SyncResult {
  client_transaction_id: string;
  status: 'synced' | 'needs_review' | 'rejected' | 'duplicate';
  server_transaction_id?: string;
  server_calculated?: {
    subtotal: number;
    tax: number;
    service_charge: number;
    grand_total: number;
    price_differences: Array<{
      product_id: string;
      product_name: string;
      client_price: number;
      server_price: number;
    }>;
  };
  review_reason?: string;
  rejection_reason?: string;
  rejection_code?: string;
}

interface SyncResponse {
  results: SyncResult[];
  server_timestamp: string;
  updated_products: unknown[];
}

export interface SyncStats {
  synced: number;
  needsReview: number;
  rejected: number;
  duplicates: number;
  failed: number;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const RETRY_CONFIG = {
  maxRetries: 10,
  baseDelayMs: 5_000,
  maxDelayMs: 300_000,
  jitterMs: 2_000,
};

const BATCH_SIZE = 20; // Max transactions per sync request
const SYNC_TIMEOUT_MS = 60_000;

// ─── Singleton State ─────────────────────────────────────────────────────────

let _isSyncing = false;
let _lastSyncAttempt: Date | null = null;
let _syncListeners: Array<(stats: SyncStats | null) => void> = [];

// ─── Listener Management ────────────────────────────────────────────────────

export function addSyncListener(listener: (stats: SyncStats | null) => void): () => void {
  _syncListeners.push(listener);
  return () => {
    _syncListeners = _syncListeners.filter((l) => l !== listener);
  };
}

function notifyListeners(stats: SyncStats | null): void {
  for (const listener of _syncListeners) {
    try {
      listener(stats);
    } catch (err) {
      console.error('[SyncManager] Listener error:', err);
    }
  }
}

// ─── Core Sync Logic ─────────────────────────────────────────────────────────

export function isSyncing(): boolean {
  return _isSyncing;
}

/**
 * Run a single sync cycle: upload all pending transactions to the server.
 * Returns stats about the sync results, or null if nothing to sync.
 * 
 * This function is safe to call repeatedly — it uses a mutex to ensure
 * only one sync runs at a time.
 */
export async function runSync(deviceId: string): Promise<SyncStats | null> {
  // Mutex — prevent concurrent syncs
  if (_isSyncing) {
    console.log('[SyncManager] Sync already in progress, skipping');
    return null;
  }

  const pendingTxs = getPendingTransactionsToSync();
  if (pendingTxs.length === 0) {
    return null;
  }

  _isSyncing = true;
  _lastSyncAttempt = new Date();

  const stats: SyncStats = { synced: 0, needsReview: 0, rejected: 0, duplicates: 0, failed: 0 };

  try {
    console.log(`[SyncManager] Starting sync — ${pendingTxs.length} pending transactions`);

    // Process in batches
    for (let i = 0; i < pendingTxs.length; i += BATCH_SIZE) {
      const batch = pendingTxs.slice(i, i + BATCH_SIZE);
      const batchStats = await syncBatch(batch, deviceId);
      stats.synced += batchStats.synced;
      stats.needsReview += batchStats.needsReview;
      stats.rejected += batchStats.rejected;
      stats.duplicates += batchStats.duplicates;
      stats.failed += batchStats.failed;
    }

    // After successful sync, refresh catalog to get updated stock from server
    if (stats.synced > 0) {
      console.log('[SyncManager] Refreshing catalog after sync...');
      await syncCatalog();
      resetLocalStockAdj();
    }

    // Prune old synced transactions
    pruneSyncedTransactions(7);

    console.log(`[SyncManager] Sync complete — synced:${stats.synced} review:${stats.needsReview} rejected:${stats.rejected} dup:${stats.duplicates} failed:${stats.failed}`);
    notifyListeners(stats);
    return stats;
  } catch (err) {
    console.error('[SyncManager] Sync failed:', err);
    notifyListeners(null);
    return stats;
  } finally {
    _isSyncing = false;
  }
}

/**
 * Sync a single batch of pending transactions.
 */
async function syncBatch(batch: PendingTransaction[], deviceId: string): Promise<SyncStats> {
  const stats: SyncStats = { synced: 0, needsReview: 0, rejected: 0, duplicates: 0, failed: 0 };

  // Mark all as syncing
  for (const tx of batch) {
    markAsSyncing(tx.id);
  }

  // Build request payload with normalized fields
  const transactions = batch.map((tx) => {
    const parsedCart = Array.isArray(JSON.parse(tx.cartJson)) ? JSON.parse(tx.cartJson) : [];
    const normalizedCart = parsedCart.map((item: any) => ({
      ...item,
      productId: item.productId || (item.isCustom ? `manual-${item.id}` : `prod-${item.id}`),
    }));

    let normalizedOrderType = tx.orderType;
    if (normalizedOrderType === 'takeaway' || normalizedOrderType === 'take_away') {
      normalizedOrderType = 'take-away';
    } else if (normalizedOrderType === 'dine_in' || normalizedOrderType === 'dineIn') {
      normalizedOrderType = 'dine-in';
    }

    const cleanUuid = (val?: string | null) => (val && val.trim().length > 0 ? val.trim() : undefined);

    return {
      id: tx.id,
      idempotency_key: tx.idempotencyKey,
      cart: normalizedCart,
      payment_method: tx.paymentMethod || 'cash',
      customer_name: tx.customerName || undefined,
      customer_id: cleanUuid(tx.customerId),
      table_number: tx.tableNumber || undefined,
      order_type: normalizedOrderType,
      notes: tx.notes || undefined,
      order_note: tx.orderNote || undefined,
      cash_received: tx.cashReceived != null ? tx.cashReceived : undefined,
      apply_tax: tx.applyTax ?? true,
      branch_id: cleanUuid(tx.branchId),
      shift_id: cleanUuid(tx.shiftId),
      created_at: tx.createdAt,
    };
  });

  try {
    const response = await http<SyncResponse>(
      '/pos/sync',
      {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId, transactions }),
      },
      SYNC_TIMEOUT_MS
    );

    // Process results
    for (const result of response.results) {
      const txId = result.client_transaction_id;

      switch (result.status) {
        case 'synced':
          markAsSynced(txId);
          stats.synced++;
          break;
        case 'needs_review':
          markAsNeedsReview(txId, result.review_reason ?? 'Stock conflict');
          stats.needsReview++;
          break;
        case 'rejected':
          markAsRejected(txId, result.rejection_reason ?? 'Rejected by server');
          stats.rejected++;
          break;
        case 'duplicate':
          markAsDuplicate(txId);
          stats.duplicates++;
          break;
      }
    }

    // Handle transactions not in the response (network issue mid-batch)
    const respondedIds = new Set(response.results.map((r) => r.client_transaction_id));
    for (const tx of batch) {
      if (!respondedIds.has(tx.id)) {
        markAsFailed(tx.id, 'No response from server for this transaction');
        stats.failed++;
      }
    }
  } catch (err: any) {
    // Entire batch failed — mark all as failed
    const errorMsg = err?.message || 'Network error during sync';
    for (const tx of batch) {
      markAsFailed(tx.id, errorMsg);
      stats.failed++;
    }
    console.error('[SyncManager] Batch sync failed:', errorMsg);
  }

  return stats;
}

/**
 * Calculate retry delay with exponential backoff and jitter.
 */
export function getRetryDelay(retryCount: number): number {
  const exponential = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, retryCount),
    RETRY_CONFIG.maxDelayMs
  );
  const jitter = (Math.random() - 0.5) * 2 * RETRY_CONFIG.jitterMs;
  return Math.max(RETRY_CONFIG.baseDelayMs, exponential + jitter);
}

/**
 * Check if a transaction has exceeded max retries.
 */
export function isRetryExhausted(retryCount: number): boolean {
  return retryCount >= RETRY_CONFIG.maxRetries;
}
