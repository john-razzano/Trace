import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, StatusBar, Alert, useWindowDimensions, Animated, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/theme';
import { useSettings, TimeRange } from '../hooks/useSettings';
import { useLocation } from '../hooks/useLocation';
import { useDatabase } from '../hooks/useDatabase';
import { useDoubleTap } from '../hooks/useDoubleTap';
import { useReplayAnimation } from '../hooks/useReplayAnimation';
import { getDisplayBounds } from '../utils/geo';
import { LineRenderer } from '../components/LineRenderer';
import { MapLayer } from '../components/MapLayer';
import { TimeSlider } from '../components/TimeSlider';
import { OpacitySlider } from '../components/OpacitySlider';
import { TrackingIndicator } from '../components/TrackingIndicator';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { CurrentLocationIndicator } from '../components/CurrentLocationIndicator';
import { exportGPX, exportGeoJSON, exportSVG } from '../utils/export';
import { clearAllLocations, getLocationCount } from '../utils/database';
import { Ionicons } from '@expo/vector-icons';

const TIME_RANGE_MS: Record<TimeRange, number | null> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  'all': null,
};

export default function MainScreen() {
  const router = useRouter();
  const { settings, updateThemeMode, updateTrackingInterval, updateTimeRange, updateMapOpacity } = useSettings();
  const theme = useTheme(settings.themeMode);
  const { width, height } = useWindowDimensions();

  const [controlsVisible, setControlsVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const settingsFadeAnim = useRef(new Animated.Value(0)).current;
  const [totalPointCount, setTotalPointCount] = useState<number | null>(null);
  const autoStartAttemptedRef = useRef(false);
  const appState = useRef(AppState.currentState);

  // Calculate time window for data query
  const timeWindow = useMemo(() => {
    const rangeMs = TIME_RANGE_MS[settings.timeRange];
    if (rangeMs === null) {
      return { startTime: undefined, endTime: undefined };
    }
    const endTime = Date.now();
    const startTime = endTime - rangeMs;
    return { startTime, endTime };
  }, [settings.timeRange]);

  const { sessions, refresh } = useDatabase(timeWindow.startTime, timeWindow.endTime);
  const displayBounds = useMemo(() => {
    const allPoints = sessions.flatMap(session => session.points);
    return getDisplayBounds(allPoints);
  }, [sessions]);

  const { isReplaying, progress: replayProgress, startReplay, stopReplay } = useReplayAnimation({
    duration: 4000,
  });

  const totalPoints = useMemo(() => {
    return sessions.flatMap(s => s.points).length;
  }, [sessions]);

  const { handleTap } = useDoubleTap({
    onSingleTap: () => {
      if (!isReplaying) {
        setControlsVisible(prev => !prev);
      }
    },
    onDoubleTap: () => {
      if (totalPoints > 1) {
        if (isReplaying) {
          stopReplay();
        } else {
          setControlsVisible(false);
          startReplay();
        }
      }
    },
    doubleTapDelay: 300,
  });

  const loadTotalPointCount = useCallback(async () => {
    try {
      const count = await getLocationCount();
      setTotalPointCount(count);
    } catch (error) {
      setTotalPointCount(null);
    }
  }, []);

  const handleLocationRecorded = useCallback(() => {
    refresh();
    loadTotalPointCount();
  }, [refresh, loadTotalPointCount]);

  const {
    hasPermission,
    isTracking,
    currentLocation,
    startTracking,
    toggleTracking,
    requestPermissions,
  } = useLocation(settings.trackingInterval, handleLocationRecorded);

  // Redirect to onboarding if no permission
  useEffect(() => {
    if (hasPermission === false) {
      router.replace('/onboarding');
    }
  }, [hasPermission]);

  useEffect(() => {
    if (hasPermission !== true || isTracking || autoStartAttemptedRef.current) {
      return;
    }
    autoStartAttemptedRef.current = true;
    startTracking();
  }, [hasPermission, isTracking, startTracking]);

  // Auto-hide controls after 3 seconds (only when not interacting)
  useEffect(() => {
    if (controlsVisible && !isInteracting) {
      const timer = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [controlsVisible, isInteracting]);

  useEffect(() => {
    Animated.timing(settingsFadeAnim, {
      toValue: controlsVisible ? 1 : 0,
      duration: controlsVisible ? 300 : 500,
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, settingsFadeAnim]);

  useEffect(() => {
    if (settingsVisible) {
      loadTotalPointCount();
    }
  }, [settingsVisible, loadTotalPointCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        refresh();
        loadTotalPointCount();
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [refresh, loadTotalPointCount]);


  const handleExportGPX = async () => {
    try {
      await exportGPX(sessions);
    } catch (error) {
      console.error('Export GPX failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to export GPX data';
      Alert.alert('Export Failed', message);
    }
  };

  const handleExportGeoJSON = async () => {
    try {
      await exportGeoJSON(sessions);
    } catch (error) {
      console.error('Export GeoJSON failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to export GeoJSON data';
      Alert.alert('Export Failed', message);
    }
  };

  const handleExportSVG = async () => {
    try {
      await exportSVG(sessions, width, height);
    } catch (error) {
      console.error('Export SVG failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to export SVG data';
      Alert.alert('Export Failed', message);
    }
  };

  const handleClearData = async () => {
    try {
      await clearAllLocations();
      refresh();
      await loadTotalPointCount();
    } catch (error) {
      Alert.alert('Clear Failed', 'Failed to clear location data');
    }
  };

  if (hasPermission === null) {
    return null; // Loading
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar hidden />

      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.content}>
          {settings.mapOpacity > 0 && (
            <MapLayer bounds={displayBounds} opacity={settings.mapOpacity} />
          )}
          <LineRenderer
            sessions={sessions}
            color={theme.line}
            accentColor={theme.accent}
            isTracking={isTracking}
            bounds={displayBounds}
            gapThresholdMs={settings.trackingInterval * 60 * 1000 * 2}
            isReplaying={isReplaying}
            replayProgress={replayProgress}
          />
        </View>
      </TouchableWithoutFeedback>

      {!isReplaying && (
        <CurrentLocationIndicator
          color={theme.accent}
          isTracking={isTracking}
          currentLocation={currentLocation}
          bounds={displayBounds}
          width={width}
          height={height}
        />
      )}

      <TrackingIndicator
        isTracking={isTracking}
        onPress={toggleTracking}
        color={theme.controls}
        visible={controlsVisible}
      />

      <TimeSlider
        value={settings.timeRange}
        onChange={updateTimeRange}
        color={theme.controls}
        visible={controlsVisible}
        onInteractionStart={() => setIsInteracting(true)}
        onInteractionEnd={() => setIsInteracting(false)}
      />

      <OpacitySlider
        value={settings.mapOpacity}
        onChange={updateMapOpacity}
        color={theme.controls}
        visible={controlsVisible}
        onInteractionStart={() => setIsInteracting(true)}
        onInteractionEnd={() => setIsInteracting(false)}
      />

      {controlsVisible && (
        <Animated.View
          style={[styles.settingsButton, { opacity: settingsFadeAnim }]}
        >
          <TouchableWithoutFeedback onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-outline" size={24} color={theme.controls} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}

      <SettingsDrawer
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        themeMode={settings.themeMode}
        trackingInterval={settings.trackingInterval}
        onThemeModeChange={updateThemeMode}
        onTrackingIntervalChange={updateTrackingInterval}
        onExportGPX={handleExportGPX}
        onExportGeoJSON={handleExportGeoJSON}
        onExportSVG={handleExportSVG}
        onClearData={handleClearData}
        totalPointCount={totalPointCount}
        backgroundColor={theme.background}
        textColor={theme.line}
        controlsColor={theme.controls}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    padding: 8,
  },
});
