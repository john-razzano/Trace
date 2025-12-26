import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { Session } from '../utils/database';
import { getBoundingBox } from '../utils/geo';

interface MapLayerProps {
  sessions: Session[];
  opacity: number;
}

const DESATURATED_MAP_STYLE = [
  {
    elementType: 'geometry',
    stylers: [{ saturation: -90 }, { lightness: 20 }],
  },
  {
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ visibility: 'simplified' }, { saturation: -100 }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
];

export function MapLayer({ sessions, opacity }: MapLayerProps) {
  const region = useMemo(() => {
    const allPoints = sessions.flatMap(s => s.points);
    if (allPoints.length === 0) return null;

    const bounds = getBoundingBox(allPoints);
    if (!bounds) return null;

    const latDelta = (bounds.maxLat - bounds.minLat) * 1.2; // Add 20% padding
    const lonDelta = (bounds.maxLon - bounds.minLon) * 1.2;

    return {
      latitude: (bounds.minLat + bounds.maxLat) / 2,
      longitude: (bounds.minLon + bounds.maxLon) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lonDelta, 0.01),
    };
  }, [sessions]);

  if (!region || opacity === 0) return null;

  return (
    <MapView
      style={[styles.map, { opacity }]}
      provider={PROVIDER_DEFAULT}
      region={region}
      customMapStyle={DESATURATED_MAP_STYLE}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      toolbarEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
