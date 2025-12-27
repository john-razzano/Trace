import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import type { LocationObject } from 'expo-location';
import { LatLonBounds, latLonToSVG, getActualMapBounds } from '../utils/geo';

interface CurrentLocationIndicatorProps {
  color: string;
  isTracking: boolean;
  currentLocation: LocationObject | null;
  bounds: LatLonBounds | null;
  width: number;
  height: number;
}

export function CurrentLocationIndicator({
  color,
  isTracking,
  currentLocation,
  bounds,
  width,
  height,
}: CurrentLocationIndicatorProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!isTracking) return;

    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    scaleAnimation.start();
    opacityAnimation.start();

    return () => {
      scaleAnimation.stop();
      opacityAnimation.stop();
    };
  }, [isTracking, scale, opacity]);

  const position = useMemo(() => {
    if (!currentLocation || !bounds) return null;
    // Calculate the actual bounds the map displays (accounting for screen aspect ratio)
    const actualBounds = getActualMapBounds(bounds, width, height);
    return latLonToSVG(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      actualBounds,
      width,
      height
    );
  }, [currentLocation, bounds, width, height]);

  if (!isTracking || !position) return null;

  return (
    <View style={[styles.container, { left: position.x, top: position.y }]}>
      <Animated.View
        style={[
          styles.pulse,
          { backgroundColor: color },
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      <View style={[styles.centerDot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
