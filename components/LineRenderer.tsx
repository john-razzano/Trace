import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Session, LocationPoint } from '../utils/database';
import { getBoundingBox, generatePathData, simplifyPath } from '../utils/geo';
import { PulseIndicator } from './PulseIndicator';
import { latLonToSVG } from '../utils/geo';

interface LineRendererProps {
  sessions: Session[];
  color: string;
  accentColor: string;
  isTracking: boolean;
}

export function LineRenderer({ sessions, color, accentColor, isTracking }: LineRendererProps) {
  const { width, height } = useWindowDimensions();

  const { paths, lastPoint } = useMemo(() => {
    const allPoints = sessions.flatMap(s => s.points);
    if (allPoints.length === 0) {
      return { paths: [], lastPoint: null };
    }

    const bounds = getBoundingBox(allPoints);
    if (!bounds) {
      return { paths: [], lastPoint: null };
    }

    const sessionPaths = sessions.map(session => {
      // Simplify path for performance with many points
      const simplified = session.points.length > 100
        ? simplifyPath(session.points, 0.0001)
        : session.points;

      return generatePathData(simplified, bounds, width, height);
    });

    // Get the last point for the pulse indicator
    const lastSession = sessions[sessions.length - 1];
    const lastLocationPoint = lastSession?.points[lastSession.points.length - 1];
    const lastSVGPoint = lastLocationPoint
      ? latLonToSVG(lastLocationPoint.latitude, lastLocationPoint.longitude, bounds, width, height)
      : null;

    return {
      paths: sessionPaths,
      lastPoint: lastSVGPoint,
    };
  }, [sessions, width, height]);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {paths.map((path, index) => (
          <Path
            key={index}
            d={path}
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
      {lastPoint && (
        <PulseIndicator
          x={lastPoint.x}
          y={lastPoint.y}
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
