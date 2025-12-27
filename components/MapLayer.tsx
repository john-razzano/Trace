import React, { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import MapView, { PROVIDER_DEFAULT, MAP_TYPES } from 'react-native-maps';
import { LatLonBounds, getRegionFromBounds } from '../utils/geo';

interface MapLayerProps {
  bounds: LatLonBounds | null;
  opacity: number;
}

export function MapLayer({ bounds, opacity }: MapLayerProps) {
  const region = useMemo(() => {
    if (!bounds) return null;
    return getRegionFromBounds(bounds);
  }, [bounds]);

  if (!region || opacity === 0) return null;

  return (
    <MapView
      style={[styles.map, { opacity }]}
      provider={PROVIDER_DEFAULT}
      region={region}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      showsPointsOfInterest={false}
      showsBuildings={false}
      showsTraffic={false}
      showsIndoors={false}
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
