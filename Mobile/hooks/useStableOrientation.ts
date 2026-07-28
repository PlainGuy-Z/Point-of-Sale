import { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';

/**
 * A stabilized orientation hook that debounces dimension changes
 * to prevent intermediate renders during device rotation.
 *
 * Problem: During rotation, useWindowDimensions() fires 2-4 times with
 * transitional values (e.g., half-screen dimensions). This causes
 * conditional portrait/landscape renders to unmount/remount rapidly,
 * resulting in a visual flash where the app appears clipped to half
 * the screen with the other half blank.
 *
 * Solution: This hook holds the PREVIOUS stable orientation and dimensions
 * until the new values have settled (no further changes for `debounceMs`).
 * Then it updates everything in a single render, producing one clean
 * transition instead of 2-4 jarring intermediate states.
 *
 * When orientation does NOT change (e.g., keyboard opens, safe area updates),
 * dimensions are updated immediately with no debounce.
 */
export function useStableOrientation(debounceMs = 150) {
  const { width, height } = useWindowDimensions();

  const [stable, setStable] = useState({
    width,
    height,
  });

  const isLandscape = stable.width > stable.height;

  useEffect(() => {
    // Debounce exact dimension updates to allow viewport measurements to settle,
    // while orientation direction (isLandscape) updates immediately.
    const timer = setTimeout(() => {
      setStable({ width, height });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [width, height, debounceMs]);

  return {
    width: stable.width,
    height: stable.height,
    isLandscape,
  };
}
