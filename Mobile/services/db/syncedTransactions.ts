import { getDb, getSQLiteDb } from './database';
import { syncedTransactions } from './schema';
import type { Transaction } from '../../types';

export function upsertSyncedTransactions(transactions: Transaction[]): void {
  const sqlite = getSQLiteDb();
  const now = new Date().toISOString();

  sqlite.execSync('BEGIN TRANSACTION;');
  try {
    // Clear old transactions before inserting new ones to keep cache fresh
    sqlite.runSync('DELETE FROM synced_transactions');

    const stmt = sqlite.prepareSync(
      `INSERT INTO synced_transactions (id, server_data_json, created_at, synced_at)
       VALUES (?, ?, ?, ?)`
    );

    for (const tx of transactions) {
      stmt.executeSync([
        tx.id,
        JSON.stringify(tx),
        tx.date instanceof Date ? tx.date.toISOString() : tx.date,
        now,
      ]);
    }

    sqlite.execSync('COMMIT;');
    console.log(`[SyncedTx] Cached ${transactions.length} synced transactions for offline use.`);
  } catch (err) {
    sqlite.execSync('ROLLBACK;');
    console.error('[SyncedTx] Failed to upsert synced transactions:', err);
  }
}

export function getSyncedTransactions(): Transaction[] {
  try {
    const db = getDb();
    const rows = db.select().from(syncedTransactions).all();
    return rows.map((row) => JSON.parse(row.serverDataJson));
  } catch (err) {
    console.error('[SyncedTx] Failed to get synced transactions:', err);
    return [];
  }
}
