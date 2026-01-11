import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import type { LocationObject } from 'expo-location';
import type MapView from 'react-native-maps';
import { LatLonBounds, latLonToSVG } from '../utils/geo';

interface CurrentLocationIndicatorProps {
  color: string;
  isTracking: boolean;
  currentLocation: LocationObject | null;
  bounds: LatLonBounds | null;
  width: number;
  height: number;
  mapRef?: React.RefObject<MapView>;
  mapBounds?: LatLonBounds | null;
}

export function CurrentLocationIndicator({
  color,
  isTracking,
  currentLocation,
  bounds,
  width,
  height,
  mapRef,
  mapBounds,
}: CurrentLocationIndicatorProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    const computePosition = async () => {
      if (!currentLocation) {
        if (!cancelled) setPosition(null);
        return;
      }

      if (mapRef?.current) {
        try {
          const point = await mapRef.current.pointForCoordinate({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
          if (!cancelled) setPosition(point);
          return;
        } catch (error) {
          console.warn('[Trace] Failed to project current location:', error);
        }
      }

      if (!bounds) {
        if (!cancelled) setPosition(null);
        return;
      }

      const fallback = latLonToSVG(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        bounds,
        width,
        height
      );
      if (!cancelled) setPosition(fallback);
    };

    computePosition();

    return () => {
      cancelled = true;
    };
  }, [currentLocation, bounds, width, height, mapRef, mapBounds]);

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
