import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Session, LocationPoint } from '../utils/database';
import { LatLonBounds, generatePathData, simplifyPath, latLonToSVG, getActualMapBounds } from '../utils/geo';
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
}: LineRendererProps) {
  const { width, height } = useWindowDimensions();

  const { paths, lastPoint } = useMemo(() => {
    const allPoints = sessions.flatMap(s => s.points);
    if (allPoints.length === 0 || !bounds) {
      return { paths: [], lastPoint: null };
    }

    // Calculate the actual bounds the map will display (accounting for screen aspect ratio)
    const actualBounds = getActualMapBounds(bounds, width, height);

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

        return generatePathData(simplified, actualBounds, width, height);
      });

    // Get the last point for the pulse indicator (chronologically last)
    const lastLocationPoint = sortedPoints[sortedPoints.length - 1];
    const lastSVGPoint = lastLocationPoint
      ? latLonToSVG(lastLocationPoint.latitude, lastLocationPoint.longitude, actualBounds, width, height)
      : null;

    return {
      paths: sessionPaths,
      lastPoint: lastSVGPoint,
    };
  }, [sessions, width, height, bounds, gapThresholdMs]);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
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
