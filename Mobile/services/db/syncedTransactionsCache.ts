/**
 * Synced Transactions Cache
 * 
 * Manages the offline cache of transactions that have already been synced with the server.
 * This ensures that the Dashboard, Reports, and Transaction History screens
 * show historical data even when the app is launched offline.
 */

import { getDb, getSQLiteDb } from './database';
import { syncedTransactions } from './schema';
import type { Transaction } from '../../types';

/**
 * Cache transactions from the server into the local SQLite database.
 * Deduplicates by ID. We store the entire object as JSON for simplicity,
 * since this is purely a read-only offline cache.
 */
export function cacheSyncedTransactions(transactions: Transaction[]): void {
  try {
    if (!transactions || transactions.length === 0) return;

    const sqlite = getSQLiteDb();
    const now = new Date().toISOString();

    sqlite.execSync('BEGIN TRANSACTION;');
    try {
      const stmt = sqlite.prepareSync(
        `INSERT OR REPLACE INTO synced_transactions (id, server_data_json, created_at, synced_at) VALUES (?, ?, ?, ?)`
      );

      for (const tx of transactions) {
        // Only cache actually synced transactions (just in case pending ones sneak in)
        if ((tx as any).created_offline && !(tx as any).synced_at) continue;

        stmt.executeSync([
          tx.id,
          JSON.stringify(tx),
          tx.date instanceof Date ? tx.date.toISOString() : tx.date,
          now
        ]);
      }

      sqlite.execSync('COMMIT;');
      // console.log(`[SyncedTxCache] Cached ${transactions.length} transactions`);
    } catch (err) {
      sqlite.execSync('ROLLBACK;');
      throw err;
    }
  } catch (err) {
    console.error('[SyncedTxCache] Failed to cache synced transactions:', err);
  }
}

/**
 * Read the cached transactions from SQLite to serve offline requests.
 * @returns Array of Transaction objects
 */
export function getLocalSyncedTransactions(): Transaction[] {
  try {
    const db = getDb();

    // Order by createdAt descending
    const rows = db.select()
      .from(syncedTransactions)
      .orderBy(syncedTransactions.createdAt)
      .all();

    // The DB query might return ascending, we should ensure descending order in memory
    // and parse dates
    const parsed: Transaction[] = rows.map(r => {
      try {
        const tx = JSON.parse(r.serverDataJson);
        // Ensure date is a Date object
        if (tx.date && typeof tx.date === 'string') {
          tx.date = new Date(tx.date);
        }
        return tx;
      } catch (e) {
        return null;
      }
    }).filter(Boolean) as Transaction[];

    // Sort descending by date
    parsed.sort((a, b) => {
      const aTime = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const bTime = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      return bTime - aTime;
    });

    return parsed;
  } catch (err) {
    console.error('[SyncedTxCache] Failed to load local synced transactions:', err);
    return [];
  }
}

/**
 * Delete cached synced transactions older than the specified number of days
 * to keep the local database size under control.
 * @param olderThanDays Default is 30 days
 */
export function pruneSyncedTransactionsCache(olderThanDays: number = 30): number {
  try {
    const sqlite = getSQLiteDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const cutoffStr = cutoff.toISOString();

    const result = sqlite.runSync(
      `DELETE FROM synced_transactions WHERE created_at < ?`,
      [cutoffStr]
    );

    const deleted = result.changes;
    if (deleted > 0) {
      console.log(`[SyncedTxCache] Pruned ${deleted} synced transactions older than ${olderThanDays} days`);
    }
    return deleted;
  } catch (err) {
    console.error('[SyncedTxCache] Failed to prune synced transactions cache:', err);
    return 0;
  }
}
