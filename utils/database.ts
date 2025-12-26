import * as SQLite from 'expo-sqlite';

export interface LocationPoint {
  id?: number;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  session_id: string;
}

export interface Session {
  id: string;
  points: LocationPoint[];
}

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('trace.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      accuracy REAL,
      session_id TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_timestamp ON locations(timestamp);
    CREATE INDEX IF NOT EXISTS idx_session ON locations(session_id);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return db;
}

export async function insertLocation(location: Omit<LocationPoint, 'id'>): Promise<void> {
  const database = await initDatabase();
  await database.runAsync(
    'INSERT INTO locations (latitude, longitude, timestamp, accuracy, session_id) VALUES (?, ?, ?, ?, ?)',
    [location.latitude, location.longitude, location.timestamp, location.accuracy || null, location.session_id]
  );
}

export async function getLocations(
  startTime?: number,
  endTime?: number
): Promise<Session[]> {
  const database = await initDatabase();

  let query = 'SELECT * FROM locations';
  const params: number[] = [];

  if (startTime !== undefined && endTime !== undefined) {
    query += ' WHERE timestamp BETWEEN ? AND ?';
    params.push(startTime, endTime);
  } else if (startTime !== undefined) {
    query += ' WHERE timestamp >= ?';
    params.push(startTime);
  }

  query += ' ORDER BY timestamp ASC';

  const rows = await database.getAllAsync<LocationPoint>(query, params);

  // Group by session_id
  const sessionMap = new Map<string, LocationPoint[]>();
  for (const row of rows) {
    if (!sessionMap.has(row.session_id)) {
      sessionMap.set(row.session_id, []);
    }
    sessionMap.get(row.session_id)!.push(row);
  }

  return Array.from(sessionMap.entries()).map(([id, points]) => ({
    id,
    points,
  }));
}

export async function clearAllLocations(): Promise<void> {
  const database = await initDatabase();
  await database.runAsync('DELETE FROM locations');
}

export async function getLocationCount(): Promise<number> {
  const database = await initDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM locations'
  );
  return result?.count ?? 0;
}

export async function getSetting(key: string): Promise<string | null> {
  const database = await initDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return result?.value || null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await initDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}
