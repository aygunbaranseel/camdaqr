import React from 'react';
import { StyleSheet, View } from 'react-native';
import { G, Path, Svg } from 'react-native-svg';

export default function BackgroundIcons() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Topographic Lines */}
      <Svg width="100%" height="100%" style={styles.topography}>
        <G opacity="0.1">
          <Path
            d="M0,60 Q100,40 200,60 T400,60 T600,40 T800,80"
            stroke="#2563EB"
            strokeWidth="1.5"
            fill="none"
          />
          <Path
            d="M0,120 Q100,100 200,120 T400,120 T600,100 T800,140"
            stroke="#3B82F6"
            strokeWidth="1"
            fill="none"
          />
          <Path
            d="M0,180 Q100,160 200,180 T400,180 T600,160 T800,200"
            stroke="#60A5FA"
            strokeWidth="0.8"
            fill="none"
          />
          <Path
            d="M0,240 Q100,220 200,240 T400,240 T600,220 T800,260"
            stroke="#93C5FD"
            strokeWidth="0.6"
            fill="none"
          />
        </G>
      </Svg>

      {/* Elevation Dots */}
      <View style={styles.elevationContainer}>
        {Array.from({ length: 15 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.elevationDot,
              {
                left: `${10 + (i * 6)}%`,
                top: `${30 + Math.sin(i) * 20}%`,
                opacity: 0.15 + (i % 3) * 0.05,
                backgroundColor: i % 3 === 0 ? '#2563EB' : i % 3 === 1 ? '#3B82F6' : '#60A5FA',
              }
            ]}
          />
        ))}
      </View>

      {/* Contour Shapes */}
      <View style={[styles.contourShape, styles.contour1]} />
      <View style={[styles.contourShape, styles.contour2]} />
      <View style={[styles.contourShape, styles.contour3]} />

      {/* Coordinate Points */}
      <View style={styles.coordinateContainer}>
        <View style={[styles.coordinatePoint, styles.pointA]} />
        <View style={[styles.coordinatePoint, styles.pointB]} />
        <View style={[styles.coordinatePoint, styles.pointC]} />
        <View style={[styles.coordinatePoint, styles.pointD]} />
        
        {/* Connecting Lines */}
        <View style={[styles.coordinateLine, styles.lineAB]} />
        <View style={[styles.coordinateLine, styles.lineBC]} />
        <View style={[styles.coordinateLine, styles.lineCD]} />
        <View style={[styles.coordinateLine, styles.lineDA]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topography: {
    position: 'absolute',
    opacity: 0.3,
  },
  elevationContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  elevationDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  contourShape: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    opacity: 0.1,
    borderRadius: 100,
  },
  contour1: {
    width: 120,
    height: 120,
    top: '20%',
    right: '15%',
  },
  contour2: {
    width: 80,
    height: 80,
    top: '50%',
    left: '10%',
  },
  contour3: {
    width: 60,
    height: 60,
    bottom: '25%',
    right: '25%',
  },
  coordinateContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  coordinatePoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    opacity: 0.2,
  },
  pointA: {
    top: '30%',
    left: '20%',
  },
  pointB: {
    top: '30%',
    right: '20%',
  },
  pointC: {
    bottom: '30%',
    right: '20%',
  },
  pointD: {
    bottom: '30%',
    left: '20%',
  },
  coordinateLine: {
    position: 'absolute',
    backgroundColor: '#93C5FD',
    opacity: 0.08,
    height: 1,
  },
  lineAB: {
    top: '31%',
    left: '21%',
    width: '58%',
  },
  lineBC: {
    top: '31%',
    right: '21%',
    width: 1,
    height: '38%',
  },
  lineCD: {
    bottom: '31%',
    right: '21%',
    width: '58%',
  },
  lineDA: {
    bottom: '31%',
    left: '21%',
    width: 1,
    height: '38%',
  },
});