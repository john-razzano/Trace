import React, { useEffect, useState, useMemo } from 'react';
import { Animated } from 'react-native';
import { Path, G } from 'react-native-svg';

const AnimatedSvgPath = Animated.createAnimatedComponent(Path);

interface SegmentInfo {
  path: string;
  length: number;
  startProgress: number;
  endProgress: number;
}

interface AnimatedPathProps {
  paths: string[];
  stroke: string;
  strokeWidth: number;
  progress: Animated.Value;
  isAnimating: boolean;
}

export function AnimatedPath({
  paths,
  stroke,
  strokeWidth,
  progress,
  isAnimating,
}: AnimatedPathProps) {
  const segments = useMemo(() => {
    const lengths = paths.map(estimatePathLength);
    const totalLength = lengths.reduce((sum, len) => sum + len, 0);

    if (totalLength === 0) {
      return paths.map(path => ({
        path,
        length: 0,
        startProgress: 0,
        endProgress: 1,
      }));
    }

    let cumulative = 0;
    return paths.map((path, i) => {
      const startProgress = cumulative / totalLength;
      cumulative += lengths[i];
      const endProgress = cumulative / totalLength;
      return {
        path,
        length: lengths[i],
        startProgress,
        endProgress,
      };
    });
  }, [paths]);

  if (!isAnimating) {
    return (
      <G>
        {paths.map((path, index) => (
          <Path
            key={index}
            d={path}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </G>
    );
  }

  return (
    <G>
      {segments.map((segment, index) => (
        <AnimatedSegment
          key={index}
          segment={segment}
          stroke={stroke}
          strokeWidth={strokeWidth}
          progress={progress}
        />
      ))}
    </G>
  );
}

interface AnimatedSegmentProps {
  segment: SegmentInfo;
  stroke: string;
  strokeWidth: number;
  progress: Animated.Value;
}

function AnimatedSegment({
  segment,
  stroke,
  strokeWidth,
  progress,
}: AnimatedSegmentProps) {
  const { path, length, startProgress, endProgress } = segment;

  if (length === 0) {
    return null;
  }

  const segmentDuration = endProgress - startProgress;

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, startProgress, endProgress, 1],
    outputRange: [length, length, 0, 0],
    extrapolate: 'clamp',
  });

  return (
    <AnimatedSvgPath
      d={path}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={length}
      strokeDashoffset={strokeDashoffset}
    />
  );
}

function estimatePathLength(d: string): number {
  const commands = d.match(/[ML]\s*[\d.-]+\s+[\d.-]+/g) || [];
  let length = 0;
  let prevX = 0;
  let prevY = 0;

  for (const cmd of commands) {
    const match = cmd.match(/([ML])\s*([\d.-]+)\s+([\d.-]+)/);
    if (match) {
      const x = parseFloat(match[2]);
      const y = parseFloat(match[3]);

      if (match[1] === 'L') {
        length += Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2);
      }
      prevX = x;
      prevY = y;
    }
  }

  return length;
}

export { estimatePathLength };
