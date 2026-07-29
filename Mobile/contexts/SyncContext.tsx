/**
 * SyncContext — Global sync state provider
 * 
 * Provides:
 *   - Real-time network status (online/offline)
 *   - Pending transaction count
 *   - Sync trigger functions (auto + manual)
 *   - Background sync on reconnect and app foreground
 *   - Database initialization on login
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAuth } from './AuthContext';
import { runMigrations, wipeLocalDatabase } from '../services/db/database';
import { syncCatalog, hasLocalCatalog } from '../services/db/catalogSync';
import { getPendingCount, getNeedsReviewCount } from '../services/db/pendingTransactions';
import { runSync, isSyncing as checkIsSyncing, addSyncListener, type SyncStats } from '../services/sync/SyncManager';
import { Alert } from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SyncContextValue {
  /** Whether the device is online */
  isOnline: boolean;
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
  /** Number of transactions waiting to be synced */
  pendingCount: number;
  /** Number of transactions marked needs_review */
  needsReviewCount: number;
  /** Whether the local DB has been initialized */
  isDbReady: boolean;
  /** Whether the initial catalog sync has completed */
  isCatalogReady: boolean;
  /** Manually trigger a sync */
  triggerSync: () => Promise<SyncStats | null>;
  /** Manually trigger a catalog refresh */
  triggerCatalogSync: () => Promise<void>;
  /** Last sync result stats */
  lastSyncStats: SyncStats | null;
  /** Device ID for sync identification */
  deviceId: string;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// ─── Constants ───────────────────────────────────────────────────────────────

const AUTO_SYNC_INTERVAL_MS = 15_000; // Auto-sync every 15 seconds if pending

// ─── Provider ────────────────────────────────────────────────────────────────

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useNetworkStatus();
  const { user, status } = useAuth();

  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isCatalogReady, setIsCatalogReady] = useState(false);
  const [lastSyncStats, setLastSyncStats] = useState<SyncStats | null>(null);
  const [deviceId] = useState(() => `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAuthenticatedRef = useRef(false);

  // ── Refresh pending counts ─────────────────────────────────────────────────

  const refreshCounts = useCallback(() => {
    if (!isDbReady) return;
    try {
      setPendingCount(getPendingCount());
      setNeedsReviewCount(getNeedsReviewCount());
    } catch (err) {
      console.error('[SyncContext] Failed to refresh counts:', err);
    }
  }, [isDbReady]);

  // ── Database initialization ────────────────────────────────────────────────

  useEffect(() => {
    if (status !== 'authenticated') {
      isAuthenticatedRef.current = false;
      return;
    }

    // Prevent double-init
    if (isAuthenticatedRef.current) return;
    isAuthenticatedRef.current = true;

    console.log('[SyncContext] Initializing local database...');
    try {
      runMigrations();
      setIsDbReady(true);
      console.log('[SyncContext] Database ready');
    } catch (err) {
      console.error('[SyncContext] Database init failed:', err);
    }
  }, [status]);

  // ── Initial catalog sync ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isDbReady || !isOnline || status !== 'authenticated') return;

    // Sync catalog on first load
    (async () => {
      try {
        console.log('[SyncContext] Running initial catalog sync...');
        await syncCatalog();
        setIsCatalogReady(true);
        refreshCounts();
      } catch (err) {
        console.error('[SyncContext] Initial catalog sync failed:', err);
        // If we have local data, still mark as ready
        if (hasLocalCatalog()) {
          setIsCatalogReady(true);
        }
      }
    })();
  }, [isDbReady, isOnline, status, refreshCounts]);

  // ── Mark catalog ready from local cache if offline ─────────────────────────

  useEffect(() => {
    if (isDbReady && !isCatalogReady && !isOnline) {
      if (hasLocalCatalog()) {
        setIsCatalogReady(true);
        console.log('[SyncContext] Using cached catalog (offline)');
      }
    }
  }, [isDbReady, isCatalogReady, isOnline]);

  // ── Sync trigger ───────────────────────────────────────────────────────────

  const triggerSync = useCallback(async (): Promise<SyncStats | null> => {
    if (!isDbReady || !isOnline || checkIsSyncing()) return null;

    setIsSyncing(true);
    try {
      const stats = await runSync(deviceId, true); // force=true to bypass retry limits on manual sync
      if (stats) {
        setLastSyncStats(stats);

        if (stats.rejected > 0) {
          Alert.alert(
            '⚠️ Sync Sebagian Ditolak',
            `${stats.rejected} transaksi offline ditolak oleh server. Pastikan migrasi database PostgreSQL (migration-offline-first.sql) sudah dijalankan di server.`
          );
        } else if (stats.failed > 0) {
          Alert.alert(
            '❌ Sync Gagal',
            `${stats.failed} transaksi gagal disinkronkan. Periksa koneksi internet atau pastikan server backend berjalan normal.`
          );
        } else if (stats.synced > 0) {
          console.log(`[SyncContext] Successfully synced ${stats.synced} transactions manually.`);
        }
      }
      refreshCounts();
      return stats;
    } finally {
      setIsSyncing(false);
    }
  }, [isDbReady, isOnline, deviceId, refreshCounts]);

  const triggerCatalogSync = useCallback(async (): Promise<void> => {
    if (!isDbReady || !isOnline) return;
    await syncCatalog();
    setIsCatalogReady(true);
  }, [isDbReady, isOnline]);

  // ── Auto-sync on reconnect ────────────────────────────────────────────────

  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    // Only trigger sync when transitioning from offline → online
    if (wasOffline && isOnline && isDbReady && status === 'authenticated') {
      console.log('[SyncContext] Network back online — triggering sync');
      triggerSync();
    }
  }, [isOnline, isDbReady, status, triggerSync]);

  // ── Auto-sync interval ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isDbReady || status !== 'authenticated') return;

    syncIntervalRef.current = setInterval(() => {
      if (isOnline && getPendingCount() > 0 && !checkIsSyncing()) {
        console.log('[SyncContext] Auto-sync interval — pending transactions detected');
        triggerSync();
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isDbReady, isOnline, status, triggerSync]);

  // ── Sync on app foreground ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isDbReady || status !== 'authenticated') return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isOnline) {
        console.log('[SyncContext] App came to foreground — refreshing');
        refreshCounts();
        if (getPendingCount() > 0) {
          triggerSync();
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isDbReady, isOnline, status, triggerSync, refreshCounts]);

  // ── Wipe on logout ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === 'unauthenticated' && isDbReady) {
      console.log('[SyncContext] User logged out — wiping local data');
      wipeLocalDatabase();
      setIsDbReady(false);
      setIsCatalogReady(false);
      setPendingCount(0);
      setNeedsReviewCount(0);
      setLastSyncStats(null);
      isAuthenticatedRef.current = false;
    }
  }, [status, isDbReady]);

  // ── Context value ──────────────────────────────────────────────────────────

  const value: SyncContextValue = {
    isOnline,
    isSyncing,
    pendingCount,
    needsReviewCount,
    isDbReady,
    isCatalogReady,
    triggerSync,
    triggerCatalogSync,
    lastSyncStats,
    deviceId,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
