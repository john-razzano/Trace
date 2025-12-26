import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, StatusBar, Alert, useWindowDimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/theme';
import { useSettings } from '../hooks/useSettings';
import { useLocation } from '../hooks/useLocation';
import { useDatabase } from '../hooks/useDatabase';
import { LineRenderer } from '../components/LineRenderer';
import { MapLayer } from '../components/MapLayer';
import { TimeSlider, TimeRange } from '../components/TimeSlider';
import { OpacitySlider } from '../components/OpacitySlider';
import { TrackingIndicator } from '../components/TrackingIndicator';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { CurrentLocationIndicator } from '../components/CurrentLocationIndicator';
import { exportGPX, exportJSON, exportSVG } from '../utils/export';
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
  const { settings, updateThemeMode, updateTrackingInterval } = useSettings();
  const theme = useTheme(settings.themeMode);
  const { width, height } = useWindowDimensions();

  const [controlsVisible, setControlsVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [mapOpacity, setMapOpacity] = useState(0.3);
  const settingsFadeAnim = useRef(new Animated.Value(0)).current;
  const [totalPointCount, setTotalPointCount] = useState<number | null>(null);

  const {
    hasPermission,
    isTracking,
    toggleTracking,
    requestPermissions,
  } = useLocation(settings.trackingInterval);

  // Calculate time window for data query
  const timeWindow = useMemo(() => {
    const rangeMs = TIME_RANGE_MS[timeRange];
    if (rangeMs === null) {
      return { startTime: undefined, endTime: undefined };
    }
    const endTime = Date.now();
    const startTime = endTime - rangeMs;
    return { startTime, endTime };
  }, [timeRange]);

  const { sessions, refresh } = useDatabase(timeWindow.startTime, timeWindow.endTime);

  const loadTotalPointCount = useCallback(async () => {
    try {
      const count = await getLocationCount();
      setTotalPointCount(count);
    } catch (error) {
      setTotalPointCount(null);
    }
  }, []);

  // Redirect to onboarding if no permission
  useEffect(() => {
    if (hasPermission === false) {
      router.replace('/onboarding');
    }
  }, [hasPermission]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (controlsVisible) {
      const timer = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [controlsVisible]);

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

  const handleScreenTap = () => {
    setControlsVisible(prev => !prev);
  };

  const handleExportGPX = async () => {
    try {
      await exportGPX(sessions);
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export GPX data');
    }
  };

  const handleExportJSON = async () => {
    try {
      await exportJSON(sessions);
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export JSON data');
    }
  };

  const handleExportSVG = async () => {
    try {
      await exportSVG(sessions, width, height);
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export SVG data');
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

      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <View style={styles.content}>
          {mapOpacity > 0 && (
            <MapLayer sessions={sessions} opacity={mapOpacity} />
          )}
          <LineRenderer
            sessions={sessions}
            color={theme.line}
            accentColor={theme.accent}
            isTracking={isTracking}
          />
        </View>
      </TouchableWithoutFeedback>

      <CurrentLocationIndicator
        color={theme.accent}
        isTracking={isTracking}
      />

      <TrackingIndicator
        isTracking={isTracking}
        onPress={toggleTracking}
        color={theme.controls}
        visible={controlsVisible}
      />

      <TimeSlider
        value={timeRange}
        onChange={setTimeRange}
        color={theme.controls}
        visible={controlsVisible}
      />

      <OpacitySlider
        value={mapOpacity}
        onChange={setMapOpacity}
        color={theme.controls}
        visible={controlsVisible}
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
        onExportJSON={handleExportJSON}
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
