import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import Slider from '@react-native-community/slider';

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'all';

interface TimeSliderProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  color: string;
  visible: boolean;
}

const TIME_RANGES: TimeRange[] = ['1h', '6h', '24h', '7d', '30d', 'all'];
const TIME_LABELS: Record<TimeRange, string> = {
  '1h': '1 hour',
  '6h': '6 hours',
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days',
  'all': 'All time',
};

export function TimeSlider({ value, onChange, color, visible }: TimeSliderProps) {
  const [showLabel, setShowLabel] = useState(false);
  const currentIndex = TIME_RANGES.indexOf(value);
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const labelFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 300 : 500,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  useEffect(() => {
    Animated.timing(labelFadeAnim, {
      toValue: showLabel ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showLabel, labelFadeAnim]);

  if (!visible) return null;

  const handleValueChange = (sliderValue: number) => {
    const index = Math.round(sliderValue);
    onChange(TIME_RANGES[index]);
  };

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
    >
      <Text style={[styles.permanentLabel, { color }]}>
        Time Range
      </Text>
      {showLabel && (
        <Animated.View
          style={[styles.labelContainer, { opacity: labelFadeAnim }]}
        >
          <Text style={[styles.label, { color }]}>
            {TIME_LABELS[value]}
          </Text>
        </Animated.View>
      )}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={TIME_RANGES.length - 1}
        step={1}
        value={currentIndex}
        onValueChange={handleValueChange}
        minimumTrackTintColor="rgba(154, 149, 144, 0.3)"
        maximumTrackTintColor="rgba(154, 149, 144, 0.1)"
        thumbTintColor={color}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  permanentLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labelContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
  },
});
