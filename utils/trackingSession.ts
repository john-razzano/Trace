import { getSetting, setSetting } from './database';
import { generateUUID } from './uuid';

const TRACKING_SESSION_KEY = 'tracking_session_id';

export async function getTrackingSessionId(): Promise<string | null> {
  return getSetting(TRACKING_SESSION_KEY);
}

export async function setTrackingSessionId(sessionId: string | null): Promise<void> {
  await setSetting(TRACKING_SESSION_KEY, sessionId ?? '');
}

export async function getOrCreateTrackingSessionId(): Promise<string> {
  const existing = await getTrackingSessionId();
  if (existing) return existing;

  const sessionId = generateUUID();
  await setTrackingSessionId(sessionId);
  return sessionId;
}
