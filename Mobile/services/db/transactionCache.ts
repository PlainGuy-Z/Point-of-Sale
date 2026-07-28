import { eq } from 'drizzle-orm';
import { getDb, getSQLiteDb } from './database';
import { syncedTransactions } from './schema';
import type { Transaction } from '../../types';

/**
 * Cache historical (synced) transactions into SQLite.
 * This ensures they are available for the Sales Report and History view
 * even when the app is started completely offline.
 */
export function cacheSyncedTransactions(transactions: Transaction[]): void {
  const sqlite = getSQLiteDb();
  
  if (transactions.length === 0) return;

  sqlite.execSync('BEGIN TRANSACTION;');
  try {
    const now = new Date().toISOString();
    
    // We only keep the most recent ones sent by the server
    sqlite.runSync('DELETE FROM synced_transactions');

    for (const tx of transactions) {
      sqlite.runSync(
        `INSERT INTO synced_transactions (id, server_data_json, created_at, synced_at) VALUES (?, ?, ?, ?)`,
        [
          tx.id,
          JSON.stringify(tx),
          tx.date instanceof Date ? tx.date.toISOString() : new Date(tx.date).toISOString(),
          now
        ]
      );
    }
    sqlite.execSync('COMMIT;');
  } catch (err) {
    sqlite.execSync('ROLLBACK;');
    console.error('[TransactionCache] Failed to cache synced transactions:', err);
  }
}

/**
 * Retrieve cached historical transactions from SQLite.
 * Used during offline fallback so the user still sees past sales.
 */
export function getCachedSyncedTransactions(): Transaction[] {
  try {
    const db = getDb();
    const rows = db.select().from(syncedTransactions).orderBy(syncedTransactions.createdAt).all();
    
    return rows.reverse().map(row => {
      try {
        const tx = JSON.parse(row.serverDataJson);
        // Ensure date is a Date object (if needed by UI)
        return {
          ...tx,
          date: new Date(tx.date)
        } as Transaction;
      } catch (e) {
        return null;
      }
    }).filter((tx): tx is Transaction => tx !== null);
  } catch (err) {
    console.error('[TransactionCache] Failed to load cached transactions:', err);
    return [];
  }
}
