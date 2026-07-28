/**
 * useSyncStatus — Convenience hook combining sync and network status
 * 
 * Provides a simple API for components to check:
 *   - Whether a specific transaction was created offline
 *   - The display status for a transaction's sync state
 */

import { useSync } from '../contexts/SyncContext';
import { getPendingTransactionById, type PendingTransaction } from '../services/db/pendingTransactions';

type SyncDisplayStatus = 'online' | 'synced' | 'pending' | 'syncing' | 'needs_review' | 'rejected' | 'offline';

interface SyncStatusInfo {
  /** Overall display status for the banner */
  displayStatus: SyncDisplayStatus;
  /** Whether the device is currently offline */
  isOffline: boolean;
  /** Human-readable status message */
  statusMessage: string;
  /** Whether there are items waiting to sync */
  hasPending: boolean;
}

export function useSyncStatus(): SyncStatusInfo {
  const { isOnline, isSyncing, pendingCount, needsReviewCount } = useSync();

  let displayStatus: SyncDisplayStatus;
  let statusMessage: string;

  if (isSyncing) {
    displayStatus = 'syncing';
    statusMessage = `Menyinkronkan ${pendingCount} transaksi...`;
  } else if (!isOnline && pendingCount > 0) {
    displayStatus = 'offline';
    statusMessage = `Offline — ${pendingCount} transaksi menunggu sync`;
  } else if (!isOnline) {
    displayStatus = 'offline';
    statusMessage = 'Offline — transaksi disimpan lokal';
  } else if (needsReviewCount > 0) {
    displayStatus = 'needs_review';
    statusMessage = `${needsReviewCount} transaksi perlu review owner`;
  } else if (pendingCount > 0) {
    displayStatus = 'pending';
    statusMessage = `${pendingCount} transaksi menunggu sync`;
  } else {
    displayStatus = 'online';
    statusMessage = 'Semua transaksi tersinkronkan';
  }

  return {
    displayStatus,
    isOffline: !isOnline,
    statusMessage,
    hasPending: pendingCount > 0,
  };
}

/**
 * Get the sync status for a specific transaction by ID.
 * Checks the pending queue first, falls back to 'synced'.
 */
export function getTransactionSyncStatus(transactionId: string): SyncDisplayStatus {
  try {
    const pending = getPendingTransactionById(transactionId);
    if (!pending) return 'synced';

    switch (pending.status) {
      case 'pending': return 'pending';
      case 'syncing': return 'syncing';
      case 'synced': return 'synced';
      case 'failed': return 'pending'; // Show as pending (will retry)
      case 'needs_review': return 'needs_review';
      case 'rejected': return 'rejected';
      default: return 'synced';
    }
  } catch {
    return 'synced'; // DB not initialized yet
  }
}
