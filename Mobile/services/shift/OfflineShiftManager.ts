import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Shift } from '../../types';

const OFFLINE_SHIFT_KEY = '@pos_offline_shift';

export interface OfflineShift extends Shift {
  is_offline: boolean;
  branch_id?: string | null; // Needed when syncing to backend
  needs_sync_open?: boolean; // True if opened offline
  needs_sync_close?: boolean; // True if closed offline
}

/**
 * Manages the offline shift state in AsyncStorage.
 * This acts as a temporary fallback when the device cannot reach the server to open/close a shift.
 */
export const OfflineShiftManager = {
  /**
   * Retrieves the current offline shift, if any.
   */
  async getOfflineShift(): Promise<OfflineShift | null> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_SHIFT_KEY);
      if (!data) return null;
      return JSON.parse(data) as OfflineShift;
    } catch (err) {
      console.error('[OfflineShiftManager] Failed to get offline shift:', err);
      return null;
    }
  },

  /**
   * Creates and stores a new offline shift.
   */
  async createOfflineShift(
    cashierId: string,
    cashierName: string,
    openingCash: number,
    branchId?: string | null
  ): Promise<OfflineShift> {
    const shift: OfflineShift = {
      id: Crypto.randomUUID(), // Generate a temporary local UUID
      cashier_id: cashierId,
      cashier_name: cashierName,
      opened_at: new Date().toISOString(),
      closed_at: null,
      opening_cash: openingCash,
      closing_cash: null,
      expected_cash: null,
      cash_difference: null,
      total_sales: 0,
      total_transactions: 0,
      notes: null,
      status: 'open',
      is_offline: true,
      branch_id: branchId,
      needs_sync_open: true,
      needs_sync_close: false,
    };

    try {
      await AsyncStorage.setItem(OFFLINE_SHIFT_KEY, JSON.stringify(shift));
      console.log('[OfflineShiftManager] Created offline shift:', shift.id);
      return shift;
    } catch (err) {
      console.error('[OfflineShiftManager] Failed to create offline shift:', err);
      throw new Error('Gagal menyimpan shift secara offline');
    }
  },

  /**
   * Updates the offline shift, typically used when closing the shift offline.
   */
  async updateOfflineShift(updates: Partial<OfflineShift>): Promise<OfflineShift> {
    try {
      const current = await this.getOfflineShift();
      if (!current) {
        throw new Error('Tidak ada shift offline yang aktif');
      }

      const updated = { ...current, ...updates };
      await AsyncStorage.setItem(OFFLINE_SHIFT_KEY, JSON.stringify(updated));
      console.log('[OfflineShiftManager] Updated offline shift:', updated.id, updates);
      return updated;
    } catch (err) {
      console.error('[OfflineShiftManager] Failed to update offline shift:', err);
      throw new Error('Gagal memperbarui shift offline');
    }
  },

  /**
   * Records an offline close intent for a shift that was opened online.
   */
  async recordOfflineCloseForOnlineShift(shift: Shift, closingCash: number, notes?: string): Promise<OfflineShift> {
    const offlineShift: OfflineShift = {
      ...shift,
      status: 'closed',
      closing_cash: closingCash,
      notes: notes || null,
      closed_at: new Date().toISOString(),
      is_offline: true,
      needs_sync_open: false,
      needs_sync_close: true,
    };

    try {
      await AsyncStorage.setItem(OFFLINE_SHIFT_KEY, JSON.stringify(offlineShift));
      console.log('[OfflineShiftManager] Recorded offline close for online shift:', shift.id);
      return offlineShift;
    } catch (err) {
      console.error('[OfflineShiftManager] Failed to record offline close:', err);
      throw new Error('Gagal menyimpan penutupan shift secara offline');
    }
  },

  /**
   * Clears the offline shift from storage after it has been successfully synced to the server.
   */
  async clearOfflineShift(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_SHIFT_KEY);
      console.log('[OfflineShiftManager] Cleared offline shift from storage.');
    } catch (err) {
      console.error('[OfflineShiftManager] Failed to clear offline shift:', err);
    }
  },

  /**
   * Checks if there is an offline shift waiting to be synced (open or close).
   */
  async hasPendingShiftSync(): Promise<boolean> {
    const shift = await this.getOfflineShift();
    return !!shift && (shift.needs_sync_open === true || shift.needs_sync_close === true);
  },

  /**
   * Caches an online shift so it can be retrieved if the device goes offline.
   */
  async cacheOnlineShift(shift: Shift): Promise<void> {
    const offlineShift: OfflineShift = {
      ...shift,
      is_offline: false,
      needs_sync_open: false,
      needs_sync_close: false,
    };
    try {
      await AsyncStorage.setItem(OFFLINE_SHIFT_KEY, JSON.stringify(offlineShift));
      console.log('[OfflineShiftManager] Cached online shift:', shift.id);
    } catch (err) {
      console.error('[OfflineShiftManager] Failed to cache online shift:', err);
    }
  },
};
