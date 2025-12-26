import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Session } from './database';
import { getBoundingBox, generatePathData } from './geo';

/**
 * Export sessions as GPX format
 */
export async function exportGPX(sessions: Session[]): Promise<void> {
  const timestamp = new Date().toISOString();

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Trace" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <time>${timestamp}</time>
  </metadata>
  <trk>
    <name>Trace Export</name>
`;

  for (const session of sessions) {
    gpx += '    <trkseg>\n';
    for (const point of session.points) {
      const time = new Date(point.timestamp).toISOString();
      gpx += `      <trkpt lat="${point.latitude}" lon="${point.longitude}">
        <time>${time}</time>
      </trkpt>\n`;
    }
    gpx += '    </trkseg>\n';
  }

  gpx += `  </trk>
</gpx>`;

  const fileName = `trace-export-${Date.now()}.gpx`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, gpx);
  await Sharing.shareAsync(filePath);
}

/**
 * Export sessions as JSON format
 */
export async function exportJSON(sessions: Session[]): Promise<void> {
  const data = {
    exportedAt: new Date().toISOString(),
    sessions: sessions.map(session => ({
      id: session.id,
      points: session.points.map(point => ({
        lat: point.latitude,
        lon: point.longitude,
        timestamp: point.timestamp,
        accuracy: point.accuracy,
      })),
    })),
  };

  const json = JSON.stringify(data, null, 2);
  const fileName = `trace-export-${Date.now()}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json);
  await Sharing.shareAsync(filePath);
}

/**
 * Export sessions as SVG format
 */
export async function exportSVG(sessions: Session[], width: number = 1000, height: number = 1000): Promise<void> {
  const allPoints = sessions.flatMap(s => s.points);
  if (allPoints.length === 0) {
    throw new Error('No data to export');
  }

  const bounds = getBoundingBox(allPoints);
  if (!bounds) {
    throw new Error('No valid bounds');
  }

  const paths = sessions.map(session =>
    generatePathData(session.points, bounds, width, height, 40)
  );

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#F5F2EB"/>
`;

  for (const path of paths) {
    svg += `  <path d="${path}" stroke="#2C2C2C" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  }

  svg += '</svg>';

  const fileName = `trace-export-${Date.now()}.svg`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, svg);
  await Sharing.shareAsync(filePath);
}
