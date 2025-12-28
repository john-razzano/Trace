import { useState, useEffect, useCallback } from 'react';
import { getSetting, setSetting } from '../utils/database';
import { ThemeMode } from '../constants/colors';
import { TrackingInterval } from './useLocation';

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'all';

export interface Settings {
  themeMode: ThemeMode;
  trackingInterval: TrackingInterval;
  timeRange: TimeRange;
  mapOpacity: number;
}

const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  trackingInterval: 5,
  timeRange: '24h',
  mapOpacity: 0.3,
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
      const timeRange = (await getSetting('timeRange')) as TimeRange | null;
      const mapOpacity = await getSetting('mapOpacity');

      setSettingsState({
        themeMode: themeMode || DEFAULT_SETTINGS.themeMode,
        trackingInterval: trackingInterval ? parseInt(trackingInterval) as TrackingInterval : DEFAULT_SETTINGS.trackingInterval,
        timeRange: timeRange || DEFAULT_SETTINGS.timeRange,
        mapOpacity: mapOpacity ? parseFloat(mapOpacity) : DEFAULT_SETTINGS.mapOpacity,
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
    setSettingsState(prev => ({ ...prev, trackingInterval }));
  }, []);

  const updateTimeRange = useCallback(async (timeRange: TimeRange) => {
    await setSetting('timeRange', timeRange);
    setSettingsState(prev => ({ ...prev, timeRange }));
  }, []);

  const updateMapOpacity = useCallback(async (mapOpacity: number) => {
    await setSetting('mapOpacity', mapOpacity.toString());
    setSettingsState(prev => ({ ...prev, mapOpacity }));
  }, []);

  return {
    settings,
    isLoaded,
    updateThemeMode,
    updateTrackingInterval,
    updateTimeRange,
    updateMapOpacity,
  };
}
