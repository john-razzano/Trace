import { useRef, useCallback } from 'react';

interface UseDoubleTapOptions {
  onSingleTap?: () => void;
  onDoubleTap?: () => void;
  doubleTapDelay?: number;
}

interface UseDoubleTapReturn {
  handleTap: () => void;
}

export function useDoubleTap({
  onSingleTap,
  onDoubleTap,
  doubleTapDelay = 300,
}: UseDoubleTapOptions): UseDoubleTapReturn {
  const lastTapRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < doubleTapDelay && timeSinceLastTap > 0) {
      // Double tap detected
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapRef.current = 0;
      onDoubleTap?.();
    } else {
      // Potential single tap - wait to see if another tap comes
      lastTapRef.current = now;

      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }

      singleTapTimeoutRef.current = setTimeout(() => {
        onSingleTap?.();
        singleTapTimeoutRef.current = null;
      }, doubleTapDelay);
    }
  }, [onSingleTap, onDoubleTap, doubleTapDelay]);

  return { handleTap };
}
