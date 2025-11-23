// screens/ColoringScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, PanResponder, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Artwork } from '../data/mockData';
import {
  Canvas,
  Path,
  Skia,
  PaintStyle,
  StrokeJoin,
  StrokeCap,
} from '@shopify/react-native-skia';

type Props = NativeStackScreenProps<RootStackParamList, 'Coloring'>;

// Define drawing path type
interface DrawingPath {
  path: string;
  color: string;
  strokeWidth: number;
}

const ColoringScreen = ({ route, navigation }: Props) => {
  const { artwork } = route.params;
  const [currentColor, setCurrentColor] = useState('#FF6B6B');
  const [strokeWidth, setStrokeWidth] = useState(8);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  // Available colors
  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];

  const brushSizes = [4, 8, 12, 16, 20];

  // Start new drawing path
  const startNewPath = useCallback((x: number, y: number) => {
    const newPath = Skia.Path.Make();
    newPath.moveTo(x, y);
    setCurrentPath(newPath.toSVGString());
  }, []);

  // Add point to current path
  const addPointToPath = useCallback((x: number, y: number) => {
    if (!currentPath) return;
    
    const path = Skia.Path.MakeFromSVGString(currentPath);
    if (path) {
      path.lineTo(x, y);
      setCurrentPath(path.toSVGString());
    }
  }, [currentPath]);

  // Finish current path and add to paths array
  const finishPath = useCallback(() => {
    if (currentPath) {
      setPaths(prev => [...prev, {
        path: currentPath,
        color: currentColor,
        strokeWidth: strokeWidth
      }]);
      setCurrentPath('');
    }
  }, [currentPath, currentColor, strokeWidth]);

  // Handle touch events
  const onTouchStart = useCallback((event: any) => {
    const { locationX: x, locationY: y } = event.nativeEvent;
    startNewPath(x, y);
  }, [startNewPath]);

  const onTouchMove = useCallback((event: any) => {
    const { locationX: x, locationY: y } = event.nativeEvent;
    addPointToPath(x, y);
  }, [addPointToPath]);

  const onTouchEnd = useCallback(() => {
    finishPath();
  }, [finishPath]);

  // Clear the canvas
  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath('');
  };

  // Save colorization
  const saveColorization = () => {
    if (paths.length === 0) {
      Alert.alert('No coloring', 'Please color the artwork before saving.');
      return;
    }
    
    Alert.alert(
      'Save Colorization',
      'Save your colored version?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: () => {
            // TODO: Implement save functionality
            Alert.alert('Success', 'Your colorization has been saved!');
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Coloring: {artwork.title}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveColorization}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Main Coloring Area */}
      <View style={styles.coloringArea}>
        {/* Background Line Art */}
        <View style={styles.backgroundImageContainer}>
          {/* We'll use the line art as background - for now just a placeholder */}
          <View style={styles.backgroundPlaceholder}>
            <Text style={styles.placeholderText}>Line Art Background</Text>
          </View>
        </View>

        {/* Skia Canvas Overlay */}
        <View 
          style={styles.canvasOverlay}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Canvas style={styles.canvas}>
            {/* Render all saved paths */}
            {paths.map((pathData, index) => (
              <Path
                key={index}
                path={pathData.path}
                color={pathData.color}
                style="stroke"
                strokeWidth={pathData.strokeWidth}
                strokeJoin={"round"}
                strokeCap={"round"}
                antiAlias={true}
              />
            ))}
            
            {/* Render current active path */}
            {currentPath && (
              <Path
                path={currentPath}
                color={currentColor}
                style="stroke"
                strokeWidth={strokeWidth}
                strokeJoin={"round"}
                strokeCap={"round"}
                antiAlias={true}
              />
            )}
          </Canvas>
        </View>
      </View>

      {/* Color Palette */}
      <View style={styles.paletteSection}>
        <Text style={styles.sectionTitle}>Colors</Text>
        <View style={styles.colorGrid}>
          {colorPalette.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                currentColor === color && styles.selectedColor
              ]}
              onPress={() => setCurrentColor(color)}
            />
          ))}
        </View>
      </View>

      {/* Brush Sizes */}
      <View style={styles.brushSection}>
        <Text style={styles.sectionTitle}>Brush Size</Text>
        <View style={styles.brushGrid}>
          {brushSizes.map(size => (
            <TouchableOpacity
              key={size}
              style={[
                styles.brushOption,
                strokeWidth === size && styles.selectedBrush
              ]}
              onPress={() => setStrokeWidth(size)}
            >
              <View 
                style={[
                  styles.brushPreview,
                  { 
                    width: size, 
                    height: size,
                    backgroundColor: currentColor 
                  }
                ]} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tools */}
      <View style={styles.toolsSection}>
        <TouchableOpacity style={styles.toolButton} onPress={clearCanvas}>
          <Text style={styles.toolButtonText}>🗑️ Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => navigation.goBack()}>
          <Text style={styles.toolButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  coloringArea: {
    flex: 1,
    position: 'relative',
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backgroundImageContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundPlaceholder: {
    width: '90%',
    height: '90%',
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  canvasOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    flex: 1,
  },
  paletteSection: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#333',
    transform: [{ scale: 1.1 }],
  },
  brushSection: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  brushGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  brushOption: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBrush: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  brushPreview: {
    borderRadius: 20,
  },
  toolsSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  toolButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toolButtonText: {
    fontWeight: '600',
  },
});

export default ColoringScreen;