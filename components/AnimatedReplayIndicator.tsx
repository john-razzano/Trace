import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface PathPoint {
  x: number;
  y: number;
  cumulativeLength: number;
}

interface AnimatedReplayIndicatorProps {
  paths: string[];
  progress: Animated.Value;
  color: string;
}

export function AnimatedReplayIndicator({
  paths,
  progress,
  color,
}: AnimatedReplayIndicatorProps) {
  const { points, totalLength } = useMemo(() => {
    const allPoints: PathPoint[] = [];
    let cumulative = 0;

    for (const path of paths) {
      const pathPoints = parsePathToPoints(path);
      for (let i = 0; i < pathPoints.length; i++) {
        const pt = pathPoints[i];
        if (i > 0) {
          const prev = pathPoints[i - 1];
          cumulative += Math.sqrt((pt.x - prev.x) ** 2 + (pt.y - prev.y) ** 2);
        }
        allPoints.push({ x: pt.x, y: pt.y, cumulativeLength: cumulative });
      }
    }

    return { points: allPoints, totalLength: cumulative };
  }, [paths]);

  if (points.length === 0 || totalLength === 0) {
    return null;
  }

  // Create input/output ranges for interpolation
  const inputRange = points.map(p => p.cumulativeLength / totalLength);
  const xOutputRange = points.map(p => p.x);
  const yOutputRange = points.map(p => p.y);

  // Ensure inputRange starts at 0 and ends at 1
  if (inputRange[0] !== 0) {
    inputRange.unshift(0);
    xOutputRange.unshift(xOutputRange[0]);
    yOutputRange.unshift(yOutputRange[0]);
  }
  if (inputRange[inputRange.length - 1] !== 1) {
    inputRange.push(1);
    xOutputRange.push(xOutputRange[xOutputRange.length - 1]);
    yOutputRange.push(yOutputRange[yOutputRange.length - 1]);
  }

  const x = progress.interpolate({
    inputRange,
    outputRange: xOutputRange,
    extrapolate: 'clamp',
  });

  const y = progress.interpolate({
    inputRange,
    outputRange: yOutputRange,
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: x }, { translateY: y }],
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
    </Animated.View>
  );
}

function parsePathToPoints(d: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const commands = d.match(/[ML]\s*[\d.-]+\s+[\d.-]+/g) || [];

  for (const cmd of commands) {
    const match = cmd.match(/([ML])\s*([\d.-]+)\s+([\d.-]+)/);
    if (match) {
      points.push({
        x: parseFloat(match[2]),
        y: parseFloat(match[3]),
      });
    }
  }

  return points;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -6,
    top: -6,
    width: 12,
    height: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
