import { LocationPoint } from './database';

export type LatLonBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

/**
 * Calculate bounding box for a set of points
 */
export function getBoundingBox(points: LocationPoint[]): LatLonBounds | null {
  if (points.length === 0) return null;

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Calculate display bounds with padding and a minimum span.
 */
export function getDisplayBounds(
  points: LocationPoint[],
  paddingRatio: number = 0.2,
  minDelta: number = 0.01
): LatLonBounds | null {
  const bounds = getBoundingBox(points);
  if (!bounds) return null;

  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const latDelta = Math.max((bounds.maxLat - bounds.minLat) * (1 + paddingRatio), minDelta);
  const lonDelta = Math.max((bounds.maxLon - bounds.minLon) * (1 + paddingRatio), minDelta);

  return {
    minLat: centerLat - latDelta / 2,
    maxLat: centerLat + latDelta / 2,
    minLon: centerLon - lonDelta / 2,
    maxLon: centerLon + lonDelta / 2,
  };
}

export function getRegionFromBounds(bounds: LatLonBounds): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  return {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLon + bounds.maxLon) / 2,
    latitudeDelta: bounds.maxLat - bounds.minLat,
    longitudeDelta: bounds.maxLon - bounds.minLon,
  };
}

/**
 * Convert lat/lon to screen coordinate system.
 * When bounds already include padding (from getDisplayBounds), use padding=0.
 * Only use padding > 0 for export functions where bounds are raw bounding boxes.
 */
function latToMercator(lat: number): number {
  const clamped = Math.max(-85, Math.min(85, lat));
  const rad = (clamped * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

export function latLonToSVG(
  lat: number,
  lon: number,
  bounds: LatLonBounds,
  width: number,
  height: number,
  padding: number = 0
): { x: number; y: number } {
  const latMin = latToMercator(bounds.minLat);
  const latMax = latToMercator(bounds.maxLat);
  const latRange = latMax - latMin || 0.001;
  const lonRange = bounds.maxLon - bounds.minLon || 0.001;

  const x = padding + ((lon - bounds.minLon) / lonRange) * (width - 2 * padding);
  // Y is inverted: higher latitude = lower Y (top of screen)
  const y = padding + ((latMax - latToMercator(lat)) / latRange) * (height - 2 * padding);

  return { x, y };
}

/**
 * Generate SVG path data from location points.
 * Pass padding=0 when bounds already include padding (display use).
 * Pass padding > 0 for export when bounds are raw bounding boxes.
 */
export function generatePathData(
  points: LocationPoint[],
  bounds: LatLonBounds,
  width: number,
  height: number,
  padding: number = 0
): string {
  if (points.length === 0) return '';

  const coords = points.map(p => latLonToSVG(p.latitude, p.longitude, bounds, width, height, padding));

  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    path += ` L ${coords[i].x} ${coords[i].y}`;
  }

  return path;
}

/**
 * Downsample points using Douglas-Peucker algorithm for performance
 */
export function simplifyPath(points: LocationPoint[], tolerance: number = 0.0001): LocationPoint[] {
  if (points.length <= 2) return points;

  // Find point with maximum distance from line between first and last
  let maxDist = 0;
  let maxIndex = 0;

  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  } else {
    return [first, last];
  }
}

function perpendicularDistance(
  point: LocationPoint,
  lineStart: LocationPoint,
  lineEnd: LocationPoint
): number {
  const x = point.longitude;
  const y = point.latitude;
  const x1 = lineStart.longitude;
  const y1 = lineStart.latitude;
  const x2 = lineEnd.longitude;
  const y2 = lineEnd.latitude;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}
