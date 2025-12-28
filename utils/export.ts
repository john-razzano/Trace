import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Session } from './database';
import { getBoundingBox, generatePathData } from './geo';

async function shareFile(filePath: string): Promise<void> {
  if (!FileSystem.documentDirectory) {
    throw new Error('File system is not available on this device.');
  }
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) {
    throw new Error('Export failed to create the file.');
  }
  await Sharing.shareAsync(filePath);
}

function getTotalPoints(sessions: Session[]): number {
  return sessions.reduce((count, session) => count + session.points.length, 0);
}

/**
 * Export sessions as GPX format
 */
export async function exportGPX(sessions: Session[]): Promise<void> {
  if (getTotalPoints(sessions) === 0) {
    throw new Error('No data to export');
  }
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
  await shareFile(filePath);
}

/**
 * Export sessions as GeoJSON format
 */
export async function exportGeoJSON(sessions: Session[]): Promise<void> {
  if (getTotalPoints(sessions) === 0) {
    throw new Error('No data to export');
  }

  const features = sessions
    .filter(session => session.points.length > 0)
    .map((session, sessionIndex) => {
      const coordinates = session.points.map(point => [point.longitude, point.latitude]);
      const timestamps = session.points.map(point => point.timestamp);
      const accuracies = session.points.map(point => point.accuracy ?? null);
      const geometry = coordinates.length === 1
        ? { type: 'Point', coordinates: coordinates[0] }
        : { type: 'LineString', coordinates };

      return {
        type: 'Feature',
        properties: {
          id: session.id,
          sessionIndex,
          pointCount: coordinates.length,
          timestamps,
          accuracies,
        },
        geometry,
      };
    });

  const data = {
    type: 'FeatureCollection',
    metadata: {
      exportedAt: new Date().toISOString(),
      generator: 'Trace',
    },
    features,
  };

  const json = JSON.stringify(data, null, 2);
  const fileName = `trace-export-${Date.now()}.geojson`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json);
  await shareFile(filePath);
}

/**
 * Export sessions as SVG format
 */
export async function exportSVG(sessions: Session[], width: number = 1000, height: number = 1000): Promise<void> {
  if (getTotalPoints(sessions) === 0) {
    throw new Error('No data to export');
  }
  const allPoints = sessions.flatMap(s => s.points);

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
  await shareFile(filePath);
}
