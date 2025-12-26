import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/theme';
import { useLocation } from '../hooks/useLocation';
import { useSettings } from '../hooks/useSettings';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';

export default function OnboardingScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const theme = useTheme(settings.themeMode);
  const { hasPermission, requestPermissions, startTracking } = useLocation();
  const appState = useRef(AppState.currentState);

  // Check permissions when app comes to foreground (e.g., from Settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, check permissions
        const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();

        if (foregroundStatus === 'granted') {
          await startTracking();
          router.replace('/');
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [router, startTracking]);

  const handleStart = async () => {
    // First check current permission status
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();

    // If already granted (e.g., user came back from Settings), start tracking
    if (foregroundStatus === 'granted') {
      await startTracking();
      router.replace('/');
      return;
    }

    // Try to request permissions
    const granted = await requestPermissions();
    if (granted) {
      await startTracking();
      router.replace('/');
    } else {
      // If denied, open settings
      await Linking.openSettings();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" hidden />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.line, { backgroundColor: theme.line }]} />
        </View>

        <Text style={[styles.title, { color: theme.line }]}>
          Trace records your location to draw a line of where you've been.
        </Text>

        <Text style={[styles.subtitle, { color: theme.controls }]}>
          Nothing leaves your device. Ever.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.line }]}
        onPress={handleStart}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: theme.background }]}>
          Start Tracking
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 40,
    paddingVertical: 80,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 60,
  },
  line: {
    width: 80,
    height: 2,
    borderRadius: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
