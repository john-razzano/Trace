import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import Slider from '@react-native-community/slider';

interface OpacitySliderProps {
  value: number;
  onChange: (value: number) => void;
  color: string;
  visible: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export function OpacitySlider({ value, onChange, color, visible, onInteractionStart, onInteractionEnd }: OpacitySliderProps) {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 300 : 500,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleValueChange = useCallback((newValue: number) => {
    try {
      setLocalValue(newValue);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce the onChange call
      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, 50);
    } catch (error) {
      console.error('OpacitySlider onChange error:', error);
    }
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
    >
      <Text style={[styles.label, { color }]}>Map</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={0.99}
        value={Math.min(localValue, 0.99)}
        onValueChange={handleValueChange}
        onSlidingStart={onInteractionStart}
        onSlidingComplete={onInteractionEnd}
        minimumTrackTintColor="rgba(154, 149, 144, 0.3)"
        maximumTrackTintColor="rgba(154, 149, 144, 0.1)"
        thumbTintColor={color}
        step={0.01}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 24,
    top: 60,
    width: 150,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  slider: {
    width: 150,
    height: 40,
  },
});
