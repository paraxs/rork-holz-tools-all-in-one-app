import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

interface Props {
  postDimensions: [number, number] | null;
  minDiameter: number;
  currentLogDiameter: number;
}

export function BalkenVisualization({ postDimensions, minDiameter, currentLogDiameter }: Props) {
  if (!postDimensions) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Visualisierung</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Bitte Pfostenmaße eingeben</Text>
        </View>
      </View>
    );
  }

  const [w, h] = postDimensions;
  const svgSize = 200;
  const pad = 20;
  const maxR = (svgSize - pad * 2) / 2;
  
  const ref = Math.max(minDiameter || 0, currentLogDiameter || 0, Math.max(w, h), 1);
  const scale = maxR / (ref / 2);
  
  const rectW = w * scale;
  const rectH = h * scale;
  const rReq = (minDiameter || 0) * scale / 2;
  const rLog = (currentLogDiameter || 0) * scale / 2;
  
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visualisierung</Text>
      <View style={styles.svgContainer}>
        <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {/* Min diameter circle (dashed) */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={rReq}
            stroke="#888"
            strokeWidth="2"
            fill="none"
            strokeDasharray="8 6"
          />
          
          {/* Current log circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={rLog}
            stroke="#4CAF50"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Post rectangle */}
          <Rect
            x={centerX - rectW / 2}
            y={centerY - rectH / 2}
            width={rectW}
            height={rectH}
            fill="rgba(76, 175, 80, 0.3)"
            stroke="#4CAF50"
            strokeWidth="2"
          />
        </Svg>
      </View>
      
      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ø Stamm:</Text>
          <Text style={styles.infoValue}>
            {currentLogDiameter > 0 ? `${currentLogDiameter.toFixed(1)} cm` : '–'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ø min:</Text>
          <Text style={styles.infoValue}>
            {minDiameter > 0 ? `${minDiameter.toFixed(1)} cm` : '–'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pfosten:</Text>
          <Text style={styles.infoValue}>
            {w > 0 && h > 0 ? `${w} × ${h} cm` : '–'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 16,
  },
  svgContainer: {
    marginBottom: 16,
  },
  placeholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  info: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
  },
});