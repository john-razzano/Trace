import { useRef, useState, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

interface UseReplayAnimationOptions {
  duration?: number;
  easing?: (value: number) => number;
}

interface UseReplayAnimationReturn {
  isReplaying: boolean;
  progress: Animated.Value;
  startReplay: () => void;
  stopReplay: () => void;
}

export function useReplayAnimation({
  duration = 4000,
  easing = Easing.inOut(Easing.ease),
}: UseReplayAnimationOptions = {}): UseReplayAnimationReturn {
  const [isReplaying, setIsReplaying] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const startReplay = useCallback(() => {
    progress.setValue(0);
    setIsReplaying(true);

    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing,
      useNativeDriver: false,
    });

    animationRef.current.start(({ finished }) => {
      if (finished) {
        setIsReplaying(false);
      }
    });
  }, [progress, duration, easing]);

  const stopReplay = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    progress.setValue(0);
    setIsReplaying(false);
  }, [progress]);

  return {
    isReplaying,
    progress,
    startReplay,
    stopReplay,
  };
}
