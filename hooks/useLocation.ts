import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { insertLocation } from '../utils/database';
import { generateUUID } from '../utils/uuid';

export type TrackingInterval = 1 | 5 | 15 | 30 | 60; // minutes

export interface LocationState {
  isTracking: boolean;
  hasPermission: boolean | null;
  currentLocation: Location.LocationObject | null;
  error: string | null;
}

export function useLocation(intervalMinutes: TrackingInterval = 5) {
  const [state, setState] = useState<LocationState>({
    isTracking: false,
    hasPermission: null,
    currentLocation: null,
    error: null,
  });

  const sessionIdRef = useRef<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();

      // For Expo Go, only require foreground permission
      // Background permission will work in standalone builds
      const hasPermission = foregroundStatus === 'granted';
      setState(prev => ({ ...prev, hasPermission }));
    } catch (error) {
      setState(prev => ({ ...prev, hasPermission: false, error: 'Failed to check permissions' }));
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setState(prev => ({ ...prev, hasPermission: false, error: 'Location permission denied' }));
        return false;
      }

      // Try to request background permission, but don't fail if it's not granted
      // This is mainly for standalone builds
      try {
        await Location.requestBackgroundPermissionsAsync();
      } catch (error) {
        // Background permission might not be available in Expo Go
        console.log('Background permission request failed (expected in Expo Go)');
      }

      setState(prev => ({ ...prev, hasPermission: true, error: null }));
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, hasPermission: false, error: 'Failed to request permissions' }));
      return false;
    }
  };

  const startTracking = useCallback(async () => {
    if (state.isTracking) return;

    const hasPermission = state.hasPermission || await requestPermissions();
    if (!hasPermission) return;

    // Generate new session ID for this tracking session
    sessionIdRef.current = generateUUID();

    try {
      // Start location subscription
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5,
          timeInterval: intervalMinutes * 60 * 1000,
        },
        async (location) => {
          setState(prev => ({ ...prev, currentLocation: location }));

          // Save to database
          if (sessionIdRef.current) {
            await insertLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: location.timestamp,
              accuracy: location.coords.accuracy || undefined,
              session_id: sessionIdRef.current,
            });
            const timestamp = new Date(location.timestamp).toISOString();
            console.log(
              `[Trace] Recorded location: lat=${location.coords.latitude}, lon=${location.coords.longitude}, time=${timestamp}`
            );
          }
        }
      );

      subscriptionRef.current = subscription;
      setState(prev => ({ ...prev, isTracking: true, error: null }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to start tracking' }));
    }
  }, [state.isTracking, state.hasPermission, intervalMinutes]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    sessionIdRef.current = null;
    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  const toggleTracking = useCallback(async () => {
    if (state.isTracking) {
      stopTracking();
    } else {
      await startTracking();
    }
  }, [state.isTracking, startTracking, stopTracking]);

  return {
    ...state,
    requestPermissions,
    startTracking,
    stopTracking,
    toggleTracking,
  };
}
