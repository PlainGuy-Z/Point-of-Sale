import { OfflineShiftManager } from './OfflineShiftManager';
import { api } from '../api';
import { getSQLiteDb } from '../db/database';
import type { Shift } from '../../types';

/**
 * Service responsible for syncing Offline Shifts to the backend.
 * Due to backend constraints, we must:
 * 1. Open the shift on the backend BEFORE syncing transactions.
 * 2. Update local offline transactions to use the new server shift ID.
 * 3. Sync the transactions.
 * 4. Close the shift on the backend AFTER syncing transactions (so expected_cash is calculated correctly).
 */
export const ShiftSyncService = {
  /**
   * Syncs the opening of an offline shift.
   * This MUST be called BEFORE SyncManager processes pending transactions.
   */
  async syncOfflineShiftOpen(): Promise<void> {
    const offlineShift = await OfflineShiftManager.getOfflineShift();
    if (!offlineShift) return;

    if (offlineShift.needs_sync_open) {
      try {
        console.log('[ShiftSyncService] Syncing offline shift OPEN to server...');
        const response = await api.post<Shift>('/shifts/open', {
          opening_cash: offlineShift.opening_cash,
          branch_id: offlineShift.branch_id,
        });

        const newServerShiftId = response.id;
        console.log('[ShiftSyncService] Successfully opened on server. New ID:', newServerShiftId);

        // Update all pending transactions to use the new server shift ID
        const db = getSQLiteDb();
        db.runSync(
          'UPDATE pending_transactions SET shift_id = ? WHERE shift_id = ?',
          [newServerShiftId, offlineShift.id]
        );
        console.log('[ShiftSyncService] Updated local transactions with new server shift ID.');

        // Update local offline shift state so we don't try to open it again,
        // and we store the real server ID for the close operation.
        await OfflineShiftManager.updateOfflineShift({
          id: newServerShiftId,
          needs_sync_open: false,
          is_offline: false, // The ID is now real, but we might still need to sync close.
        });
      } catch (err: any) {
        // If the server says there is already an active shift, we have a conflict!
        // We might just need to fetch the active shift and use its ID.
        if (err?.code === 'SHIFT_ALREADY_ACTIVE' || err?.message?.includes('sudah aktif')) {
           console.log('[ShiftSyncService] Conflict: Shift already active on server. Resolving...');
           try {
             const activeServerShift = await api.get<Shift | null>('/shifts/active');
             if (activeServerShift) {
               const db = getSQLiteDb();
               db.runSync(
                 'UPDATE pending_transactions SET shift_id = ? WHERE shift_id = ?',
                 [activeServerShift.id, offlineShift.id]
               );
               await OfflineShiftManager.updateOfflineShift({
                 id: activeServerShift.id,
                 needs_sync_open: false,
                 is_offline: false,
               });
               console.log('[ShiftSyncService] Resolved conflict using existing server shift ID.');
             }
           } catch (resolveErr) {
             console.error('[ShiftSyncService] Failed to resolve shift conflict:', resolveErr);
             throw err; // Re-throw to stop sync process
           }
        } else {
           console.error('[ShiftSyncService] Failed to sync offline shift OPEN:', err);
           throw err; // Re-throw so SyncManager aborts transaction sync (transactions need a valid shift ID)
        }
      }
    }
  },

  /**
   * Syncs the closing of an offline shift.
   * This MUST be called AFTER SyncManager successfully processes pending transactions.
   */
  async syncOfflineShiftClose(): Promise<void> {
    const offlineShift = await OfflineShiftManager.getOfflineShift();
    if (!offlineShift) return;

    if (offlineShift.needs_sync_close && !offlineShift.needs_sync_open) {
      try {
        console.log('[ShiftSyncService] Syncing offline shift CLOSE to server...');
        await api.post('/shifts/close', {
          closing_cash: offlineShift.closing_cash || 0,
          notes: offlineShift.notes,
        });
        
        console.log('[ShiftSyncService] Successfully closed shift on server.');
        
        // Everything is synced, we can clear the offline shift
        await OfflineShiftManager.clearOfflineShift();
      } catch (err: any) {
        console.error('[ShiftSyncService] Failed to sync offline shift CLOSE:', err);
        // We don't throw here, we just leave it for the next sync attempt.
      }
    }
  },
};
