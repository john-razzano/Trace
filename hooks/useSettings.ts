import { useState, useEffect, useCallback } from 'react';
import { getSetting, setSetting } from '../utils/database';
import { ThemeMode } from '../constants/colors';
import { TrackingInterval } from './useLocation';

export interface Settings {
  themeMode: ThemeMode;
  trackingInterval: TrackingInterval;
}

const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  trackingInterval: 5,
};

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const themeMode = (await getSetting('themeMode')) as ThemeMode | null;
      const trackingInterval = await getSetting('trackingInterval');

      setSettingsState({
        themeMode: themeMode || DEFAULT_SETTINGS.themeMode,
        trackingInterval: trackingInterval ? parseInt(trackingInterval) as TrackingInterval : DEFAULT_SETTINGS.trackingInterval,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateThemeMode = useCallback(async (themeMode: ThemeMode) => {
    await setSetting('themeMode', themeMode);
    setSettingsState(prev => {
      const next = { ...prev, themeMode };
      console.log(`[Trace] Settings updated: themeMode=${next.themeMode}, trackingInterval=${next.trackingInterval}m`);
      return next;
    });
  }, []);

  const updateTrackingInterval = useCallback(async (trackingInterval: TrackingInterval) => {
    await setSetting('trackingInterval', trackingInterval.toString());
    setSettingsState(prev => {
      const next = { ...prev, trackingInterval };
      console.log(`[Trace] Settings updated: themeMode=${next.themeMode}, trackingInterval=${next.trackingInterval}m`);
      return next;
    });
  }, []);

  return {
    settings,
    isLoaded,
    updateThemeMode,
    updateTrackingInterval,
  };
}
