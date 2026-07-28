/**
 * useNetworkStatus — Tracks device online/offline state with debouncing.
 * 
 * Uses @react-native-community/netinfo for reliable network detection.
 * Debounces state changes by 3 seconds to avoid false positives from
 * brief network blips.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  /** Whether the device currently has internet connectivity */
  isOnline: boolean;
  /** Whether the status is still being determined */
  isChecking: boolean;
  /** The underlying connection type (wifi, cellular, etc.) */
  connectionType: string | null;
  /** Force a recheck of connectivity */
  refresh: () => Promise<boolean>;
}

const DEBOUNCE_MS = 3000;

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNetworkChange = useCallback((state: NetInfoState) => {
    const newOnline = !!(state.isConnected && state.isInternetReachable !== false);
    const newType = state.type ?? null;

    setConnectionType(newType);

    // Debounce state changes to avoid flicker from brief disconnections
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (newOnline !== isOnline) {
      debounceTimer.current = setTimeout(() => {
        setIsOnline(newOnline);
        setIsChecking(false);
        console.log(`[Network] Status changed: ${newOnline ? 'ONLINE' : 'OFFLINE'} (${newType})`);
      }, DEBOUNCE_MS);
    } else {
      setIsChecking(false);
    }
  }, [isOnline]);

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      setConnectionType(state.type ?? null);
      setIsChecking(false);
      console.log(`[Network] Initial status: ${online ? 'ONLINE' : 'OFFLINE'} (${state.type})`);
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [handleNetworkChange]);

  const refresh = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const state = await NetInfo.fetch();
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      setConnectionType(state.type ?? null);
      return online;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { isOnline, isChecking, connectionType, refresh };
}
