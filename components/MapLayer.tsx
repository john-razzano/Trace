import React, { useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { LatLonBounds, getRegionFromBounds } from '../utils/geo';

interface MapLayerProps {
  bounds: LatLonBounds | null;
  opacity: number;
  onBoundsChange?: (bounds: LatLonBounds) => void;
  mapRef?: React.RefObject<MapView>;
}

export function MapLayer({ bounds, opacity, onBoundsChange, mapRef }: MapLayerProps) {
  const region = useMemo(() => {
    if (!bounds) return null;
    return getRegionFromBounds(bounds);
  }, [bounds]);

  const updateBounds = useCallback(async () => {
    if (!mapRef?.current || !onBoundsChange) return;
    try {
      const { northEast, southWest } = await mapRef.current.getMapBoundaries();
      onBoundsChange({
        minLat: southWest.latitude,
        maxLat: northEast.latitude,
        minLon: southWest.longitude,
        maxLon: northEast.longitude,
      });
    } catch (error) {
      console.warn('[Trace] Failed to read map boundaries:', error);
    }
  }, [mapRef, onBoundsChange]);

  useEffect(() => {
    if (!bounds) return;
    const frame = requestAnimationFrame(() => {
      updateBounds();
    });
    return () => cancelAnimationFrame(frame);
  }, [bounds, updateBounds]);

  if (!region) return null;

  return (
    <MapView
      ref={mapRef}
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
      onMapReady={updateBounds}
      onRegionChangeComplete={updateBounds}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
