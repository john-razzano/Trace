import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { initDatabase, insertLocation } from './database';
import { getOrCreateTrackingSessionId } from './trackingSession';

export const BACKGROUND_LOCATION_TASK = 'trace-background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Trace] Background location task error:', error);
    return;
  }

  const locations = (data as { locations?: Location.LocationObject[] })?.locations;
  if (!locations || locations.length === 0) {
    return;
  }

  try {
    await initDatabase();
    const sessionId = await getOrCreateTrackingSessionId();

    let recorded = 0;
    let skipped = 0;

    for (const location of locations) {
      // Filter out low-accuracy points (> 50m accuracy)
      const accuracy = location.coords.accuracy;
      if (accuracy && accuracy > 50) {
        skipped++;
        continue;
      }

      await insertLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: accuracy || undefined,
        session_id: sessionId,
      });
      recorded++;
    }

    if (skipped > 0) {
      console.log(`[Trace] Background recorded ${recorded} location(s), skipped ${skipped} low-accuracy point(s).`);
    } else {
      console.log(`[Trace] Background recorded ${recorded} location(s).`);
    }
  } catch (taskError) {
    console.error('[Trace] Failed to record background locations:', taskError);
  }
});
