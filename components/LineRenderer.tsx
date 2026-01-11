import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type MapView from 'react-native-maps';
import { Session, LocationPoint } from '../utils/database';
import { LatLonBounds, generatePathData, simplifyPath, latLonToSVG } from '../utils/geo';
import { PulseIndicator } from './PulseIndicator';
import { AnimatedPath } from './AnimatedPath';
import { AnimatedReplayIndicator } from './AnimatedReplayIndicator';

interface LineRendererProps {
  sessions: Session[];
  color: string;
  accentColor: string;
  isTracking: boolean;
  bounds: LatLonBounds | null;
  gapThresholdMs?: number;
  isReplaying?: boolean;
  replayProgress?: Animated.Value;
  mapRef?: React.RefObject<MapView>;
  mapBounds?: LatLonBounds | null;
  width?: number;
  height?: number;
}

function splitPointsByGap(points: LocationPoint[], gapThresholdMs?: number): LocationPoint[][] {
  if (!gapThresholdMs || gapThresholdMs <= 0) {
    return points.length ? [points] : [];
  }

  const segments: LocationPoint[][] = [];
  let current: LocationPoint[] = [];
  let lastTimestamp: number | null = null;

  for (const point of points) {
    if (lastTimestamp !== null && point.timestamp - lastTimestamp > gapThresholdMs && current.length > 0) {
      segments.push(current);
      current = [];
    }
    current.push(point);
    lastTimestamp = point.timestamp;
  }

  if (current.length > 0) {
    segments.push(current);
  }

  return segments;
}

export function LineRenderer({
  sessions,
  color,
  accentColor,
  isTracking,
  bounds,
  gapThresholdMs,
  isReplaying = false,
  replayProgress,
  mapRef,
  mapBounds,
  width,
  height,
}: LineRendererProps) {
  const windowDimensions = useWindowDimensions();
  const renderWidth = width ?? windowDimensions.width;
  const renderHeight = height ?? windowDimensions.height;
  const [mapPaths, setMapPaths] = useState<string[] | null>(null);
  const [mapLastPoint, setMapLastPoint] = useState<{ x: number; y: number } | null>(null);

  const { paths: fallbackPaths, lastPoint: fallbackLastPoint } = useMemo(() => {
    const allPoints = sessions.flatMap(s => s.points);
    if (allPoints.length === 0 || !bounds) {
      return { paths: [], lastPoint: null };
    }

    // Sort all points chronologically first, then split by gaps
    const sortedPoints = [...allPoints].sort((a, b) => a.timestamp - b.timestamp);
    const segments = splitPointsByGap(sortedPoints, gapThresholdMs);

    const sessionPaths = segments
      .filter(segment => segment.length > 1)
      .map(segment => {
        // Simplify path for performance with many points
        const simplified = segment.length > 100
          ? simplifyPath(segment, 0.0001)
          : segment;

        return generatePathData(simplified, bounds, renderWidth, renderHeight);
      });

    // Get the last point for the pulse indicator (chronologically last)
    const lastLocationPoint = sortedPoints[sortedPoints.length - 1];
    const lastSVGPoint = lastLocationPoint
      ? latLonToSVG(lastLocationPoint.latitude, lastLocationPoint.longitude, bounds, renderWidth, renderHeight)
      : null;

    return {
      paths: sessionPaths,
      lastPoint: lastSVGPoint,
    };
  }, [sessions, renderWidth, renderHeight, bounds, gapThresholdMs]);

  useEffect(() => {
    if (!mapRef?.current) {
      setMapPaths(null);
      setMapLastPoint(null);
      return;
    }

    let cancelled = false;
    const buildPathFromScreenPoints = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return '';
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
      return path;
    };

    const computeMapPaths = async () => {
      try {
        const allPoints = sessions.flatMap(s => s.points);
        if (allPoints.length === 0) {
          if (!cancelled) {
            setMapPaths([]);
            setMapLastPoint(null);
          }
          return;
        }

        const sortedPoints = [...allPoints].sort((a, b) => a.timestamp - b.timestamp);
        const segments = splitPointsByGap(sortedPoints, gapThresholdMs);
        const newPaths: string[] = [];

        for (const segment of segments) {
          if (segment.length < 2) continue;
          const simplified = segment.length > 100
            ? simplifyPath(segment, 0.0001)
            : segment;
          const screenPoints = await Promise.all(
            simplified.map(point =>
              mapRef.current!.pointForCoordinate({
                latitude: point.latitude,
                longitude: point.longitude,
              })
            )
          );
          const filtered = screenPoints.filter(point =>
            Number.isFinite(point.x) && Number.isFinite(point.y)
          );
          if (filtered.length > 1) {
            newPaths.push(buildPathFromScreenPoints(filtered));
          }
        }

        const lastLocationPoint = sortedPoints[sortedPoints.length - 1];
        const lastScreenPoint = lastLocationPoint
          ? await mapRef.current!.pointForCoordinate({
            latitude: lastLocationPoint.latitude,
            longitude: lastLocationPoint.longitude,
          })
          : null;

        if (!cancelled) {
          setMapPaths(newPaths);
          setMapLastPoint(lastScreenPoint);
        }
      } catch (error) {
        if (!cancelled) {
          setMapPaths(null);
          setMapLastPoint(null);
        }
        console.warn('[Trace] Failed to project path to map coordinates:', error);
      }
    };

    computeMapPaths();
    return () => {
      cancelled = true;
    };
  }, [sessions, mapRef, mapBounds, gapThresholdMs, renderWidth, renderHeight]);

  const paths = mapPaths ?? fallbackPaths;
  const lastPoint = mapPaths !== null ? mapLastPoint : fallbackLastPoint;

  return (
    <View style={styles.container}>
      <Svg width={renderWidth} height={renderHeight}>
        {isReplaying && replayProgress ? (
          <AnimatedPath
            paths={paths}
            stroke={color}
            strokeWidth={2}
            progress={replayProgress}
            isAnimating={true}
          />
        ) : (
          paths.map((path, index) => (
            <Path
              key={index}
              d={path}
              stroke={color}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))
        )}
      </Svg>
      {!isReplaying && lastPoint && (
        <PulseIndicator
          x={lastPoint.x}
          y={lastPoint.y}
          color={accentColor}
        />
      )}
      {isReplaying && replayProgress && paths.length > 0 && (
        <AnimatedReplayIndicator
          paths={paths}
          progress={replayProgress}
          color={accentColor}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
