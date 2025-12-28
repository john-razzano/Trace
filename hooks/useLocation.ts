import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { insertLocation } from '../utils/database';
import { generateUUID } from '../utils/uuid';
import { BACKGROUND_LOCATION_TASK } from '../utils/locationTask';
import { getTrackingSessionId, setTrackingSessionId } from '../utils/trackingSession';

export type TrackingInterval = 1 | 5 | 15 | 30 | 60; // minutes

export interface LocationState {
  isTracking: boolean;
  hasPermission: boolean | null;
  currentLocation: Location.LocationObject | null;
  error: string | null;
}

export function useLocation(
  intervalMinutes: TrackingInterval = 5,
  onLocationRecorded?: (location: Location.LocationObject) => void
) {
  const [state, setState] = useState<LocationState>({
    isTracking: false,
    hasPermission: null,
    currentLocation: null,
    error: null,
  });

  const sessionIdRef = useRef<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const onLocationRecordedRef = useRef<typeof onLocationRecorded>(onLocationRecorded);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    onLocationRecordedRef.current = onLocationRecorded;
  }, [onLocationRecorded]);

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

  const startForegroundWatch = useCallback(async () => {
    if (subscriptionRef.current) return;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 5,
        timeInterval: intervalMinutes * 60 * 1000,
      },
      async (location) => {
        setState(prev => ({ ...prev, currentLocation: location }));

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
          onLocationRecordedRef.current?.(location);
        }
      }
    );

    subscriptionRef.current = subscription;
  }, [intervalMinutes]);

  const stopForegroundWatch = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  const startBackgroundUpdates = useCallback(async () => {
    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (alreadyStarted) return;

    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      const { status: requestedStatus } = await Location.requestBackgroundPermissionsAsync();
      if (requestedStatus !== 'granted') {
        console.log('[Trace] Background permission not granted; skipping background tracking.');
        return;
      }
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 5,
      timeInterval: intervalMinutes * 60 * 1000,
      deferredUpdatesInterval: intervalMinutes * 60 * 1000,
      deferredUpdatesDistance: 5,
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: false,
    });
  }, [intervalMinutes]);

  const stopBackgroundUpdates = useCallback(async () => {
    const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (started) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  }, []);

  const startTracking = useCallback(async () => {
    if (state.isTracking) return;

    const hasPermission = state.hasPermission || await requestPermissions();
    if (!hasPermission) return;

    try {
      const backgroundStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      const existingSessionId = await getTrackingSessionId();
      const sessionId = backgroundStarted && existingSessionId
        ? existingSessionId
        : generateUUID();

      sessionIdRef.current = sessionId;
      await setTrackingSessionId(sessionId);

      if (AppState.currentState === 'active') {
        await stopBackgroundUpdates();
        await startForegroundWatch();
      } else {
        stopForegroundWatch();
        await startBackgroundUpdates();
      }

      setState(prev => ({ ...prev, isTracking: true, error: null }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to start tracking' }));
    }
  }, [
    state.isTracking,
    state.hasPermission,
    requestPermissions,
    startBackgroundUpdates,
    startForegroundWatch,
    stopBackgroundUpdates,
    stopForegroundWatch,
  ]);

  const stopTracking = useCallback(async () => {
    stopForegroundWatch();
    await stopBackgroundUpdates();
    sessionIdRef.current = null;
    await setTrackingSessionId(null);
    setState(prev => ({ ...prev, isTracking: false }));
  }, [stopForegroundWatch, stopBackgroundUpdates]);

  const toggleTracking = useCallback(async () => {
    if (state.isTracking) {
      await stopTracking();
    } else {
      await startTracking();
    }
  }, [state.isTracking, startTracking, stopTracking]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (!state.isTracking) {
        appState.current = nextState;
        return;
      }

      const wasActive = appState.current === 'active';
      const isActive = nextState === 'active';
      if (wasActive === isActive) {
        appState.current = nextState;
        return;
      }

      try {
        if (isActive) {
          await stopBackgroundUpdates();
          await startForegroundWatch();
        } else {
          stopForegroundWatch();
          await startBackgroundUpdates();
        }
      } catch (error) {
        console.error('[Trace] Failed to switch tracking mode:', error);
      }

      appState.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [state.isTracking, startBackgroundUpdates, startForegroundWatch, stopBackgroundUpdates, stopForegroundWatch]);

  return {
    ...state,
    requestPermissions,
    startTracking,
    stopTracking,
    toggleTracking,
  };
}
