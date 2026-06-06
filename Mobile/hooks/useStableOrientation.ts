import { useRef, useState, useEffect } from 'react';
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
  const isLandscapeRaw = width > height;

  const [stable, setStable] = useState({
    width,
    height,
    isLandscape: isLandscapeRaw,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOrientationRef = useRef(isLandscapeRaw);

  useEffect(() => {
    const orientationChanged = isLandscapeRaw !== prevOrientationRef.current;

    if (!orientationChanged) {
      // Same orientation — update dimensions immediately (keyboard, safe-area, etc.)
      setStable({ width, height, isLandscape: isLandscapeRaw });
      return;
    }

    // Orientation flipped — debounce to wait for the final dimensions
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      prevOrientationRef.current = isLandscapeRaw;
      setStable({ width, height, isLandscape: isLandscapeRaw });
    }, debounceMs);

    // Do NOT clear timeout on unmount of *this* effect invocation,
    // because we want the last scheduled update to fire even if
    // no more dimension changes arrive. We only clear on the NEXT
    // invocation (above) or on component unmount (below).
  }, [width, height, isLandscapeRaw, debounceMs]);

  // Cleanup on component unmount only
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return stable;
}
