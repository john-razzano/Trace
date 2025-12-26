import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';

interface TrackingIndicatorProps {
  isTracking: boolean;
  onPress: () => void;
  color: string;
  visible: boolean;
}

export function TrackingIndicator({ isTracking, onPress, color, visible }: TrackingIndicatorProps) {
  if (!visible) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.wrapper}>
        <View style={[styles.indicator, { borderColor: color }]}>
          {isTracking && <View style={[styles.innerDot, { backgroundColor: color }]} />}
        </View>
        <Text style={[styles.label, { color }]}>
          {isTracking ? 'Tracking' : 'Paused'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 24,
    padding: 8,
  },
  wrapper: {
    alignItems: 'center',
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
