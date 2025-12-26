import { useState, useEffect, useCallback } from 'react';
import { getLocations, Session } from '../utils/database';

export function useDatabase(startTime?: number, endTime?: number) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLocations(startTime, endTime);
      setSessions(data);
    } catch (err) {
      setError('Failed to load location data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [startTime, endTime]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    sessions,
    isLoading,
    error,
    refresh: loadData,
  };
}
