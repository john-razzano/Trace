import { useState, useEffect, useCallback, useRef } from 'react';
import { getLocations, Session } from '../utils/database';

export function useDatabase(timeRangeMs: number | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeRangeMsRef = useRef(timeRangeMs);

  useEffect(() => {
    timeRangeMsRef.current = timeRangeMs;
  }, [timeRangeMs]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Calculate fresh time window on each load
      const rangeMs = timeRangeMsRef.current;
      let startTime: number | undefined;
      let endTime: number | undefined;

      if (rangeMs !== null) {
        endTime = Date.now();
        startTime = endTime - rangeMs;
      }

      const data = await getLocations(startTime, endTime);
      setSessions(data);
    } catch (err) {
      setError('Failed to load location data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [timeRangeMs, loadData]);

  return {
    sessions,
    isLoading,
    error,
    refresh: loadData,
  };
}
