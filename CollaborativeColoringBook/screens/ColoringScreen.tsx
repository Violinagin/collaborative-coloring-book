import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Image,
  PanResponder
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Artwork } from '../types/User';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Svg, { Path, G } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Coloring'>;

interface DrawingPath {
  path: string;
  color: string;
  strokeWidth: number;
  points: { x: number; y: number }[];
}

const ColoringScreen = ({ route, navigation }: Props) => {
  const { artwork } = route.params;
  const { user } = useAuth();
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [scaleInfo, setScaleInfo] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    scaledWidth: 0,
    scaledHeight: 0
  });
  const [currentColor, setCurrentColor] = useState('#FF6B6B');
  const [strokeWidth, setStrokeWidth] = useState(8);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    if (artwork.lineArtUrl) {
      Image.getSize(artwork.lineArtUrl, (width, height) => {
        console.log('📐 Original image dimensions:', { width, height });
        setImageDimensions({ width, height });
        if (containerDimensions.width > 0 && containerDimensions.height > 0) {
          calculateScaleInfo({ width, height }, containerDimensions);
        }
      }, (error) => {
        console.warn('⚠️ Could not get image dimensions:', error);
      });
    }
  }, [artwork.lineArtUrl]);

  // Calculate scaling with aspect ratio preservation
  const calculateScaleInfo = useCallback((imgDims: {width: number, height: number}, containerDims: {width: number, height: number}) => {
    const { width: imgWidth, height: imgHeight } = imgDims;
    const { width: containerWidth, height: containerHeight } = containerDims;
    
    if (imgWidth === 0 || imgHeight === 0 || containerWidth === 0 || containerHeight === 0) {
      return;
    }

    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    
    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;
    
    const newScaleInfo = {
      scale,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    };
    
    setScaleInfo(newScaleInfo);
    
    console.log('📐 Dynamic scaling info:', {
      originalImage: { imgWidth, imgHeight },
      container: { containerWidth, containerHeight },
      scale,
      scaled: { scaledWidth, scaledHeight },
      offset: { offsetX, offsetY }
    });
  }, []);

  // Container layout handler
  const onContainerLayout = useCallback((event: any) => {
    const { width: containerWidth, height: containerHeight } = event.nativeEvent.layout;
    setContainerDimensions({ width: containerWidth, height: containerHeight });
    
    if (imageDimensions.width > 0 && imageDimensions.height > 0) {
      calculateScaleInfo(imageDimensions, { width: containerWidth, height: containerHeight });
    }
  }, [imageDimensions, calculateScaleInfo]);

  // Convert screen coordinates to image coordinates for storage
  const screenToImageCoords = useCallback((screenX: number, screenY: number) => {
    const { scale, offsetX, offsetY } = scaleInfo;
    
    if (scale === 0) return { x: screenX, y: screenY };
    
    const imageX = (screenX - offsetX) / scale;
    const imageY = (screenY - offsetY) / scale;
    
    return {
      x: Math.max(0, Math.min(imageX, imageDimensions.width)),
      y: Math.max(0, Math.min(imageY, imageDimensions.height))
    };
  }, [scaleInfo, imageDimensions]);

  // Color palette and brush sizes (keep your existing arrays)
  const colorPalette = [
    { color: '#FF6B6B', id: 'red' },
    { color: '#4ECDC4', id: 'teal' },
    { color: '#45B7D1', id: 'blue' },
    { color: '#96CEB4', id: 'mint' },
    { color: '#FFEAA7', id: 'yellow' },
    { color: '#DDA0DD', id: 'plum' },
    { color: '#98D8C8', id: 'seafoam' },
    { color: '#F7DC6F', id: 'gold' },
    { color: '#BB8FCE', id: 'lavender' },
    { color: '#85C1E9', id: 'skyblue' },
    { color: '#F8C471', id: 'orange' },
    { color: '#82E0AA', id: 'lightgreen' },
    { color: '#F1948A', id: 'coral' },
    { color: '#A569BD', id: 'purple' },
    { color: '#D7BDE2', id: 'lightpurple' },
    { color: '#000000', id: 'black' },
    { color: '#FFFFFF', id: 'white' },
    { color: '#888888', id: 'gray' }
  ];

  const brushSizes = [4, 8, 12, 16, 20];

  // Create SVG path data from points
  const pointsToSvgPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  // Start new drawing path - STORE image coordinates
  const startDrawing = useCallback((screenX: number, screenY: number) => {
    const imageCoords = screenToImageCoords(screenX, screenY);
    
    const newPath: DrawingPath = {
      path: '',
      color: currentColor,
      strokeWidth: strokeWidth,
      points: [{ x: imageCoords.x, y: imageCoords.y }]
    };
    setCurrentPath(newPath);
  }, [currentColor, strokeWidth, screenToImageCoords]);

  // Add point to current path - STORE image coordinates
  const addPoint = useCallback((screenX: number, screenY: number) => {
    if (!currentPath) return;
    
    const imageCoords = screenToImageCoords(screenX, screenY);
    
    const updatedPath = {
      ...currentPath,
      points: [...currentPath.points, { x: imageCoords.x, y: imageCoords.y }]
    };
    setCurrentPath(updatedPath);
  }, [currentPath, screenToImageCoords]);

  // Finish current path and add to paths array
  const finishDrawing = useCallback(() => {
    if (currentPath && currentPath.points.length > 1) {
      const completedPath = {
        ...currentPath,
        path: pointsToSvgPath(currentPath.points)
      };
      setPaths(prev => [...prev, completedPath]);
    }
    setCurrentPath(null);
  }, [currentPath]);

  // Handle touch events
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      startDrawing(locationX, locationY);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      addPoint(locationX, locationY);
    },
    onPanResponderRelease: () => {
      finishDrawing();
    },
    onPanResponderTerminate: () => {
      finishDrawing();
    },
  });

  // Clear the canvas
  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath(null);
  };

  // Undo last path
  const undoLastPath = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  // Save colorization to database
  const saveColorizationToDatabase = async (imageUrl: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('colorized_versions')
        .insert({
          artwork_id: artwork.id,
          colorist_id: user.id,
          colored_image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error saving colorization:', error);
      throw error;
    }
  };

  // Upload colored image to storage
  const uploadColoredImage = async (): Promise<string> => {
    try {
      const { width: svgWidth, height: svgHeight } = imageDimensions;

      if (svgWidth === 0 || svgHeight === 0) {
        throw new Error('Invalid image dimensions');
      }

      const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg 
  width="${svgWidth}" 
  height="${svgHeight}" 
  viewBox="0 0 ${svgWidth} ${svgHeight}" 
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>
  <!-- White background that matches the exact image dimensions -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  
  <!-- Colored paths - using original image coordinates -->
  <g stroke-linecap="round" stroke-linejoin="round">
    ${paths.map(pathData => 
      `<path 
        d="${pathData.path}" 
        stroke="${pathData.color}" 
        stroke-width="${pathData.strokeWidth}" 
        fill="none"
      />`
    ).join('\n    ')}
  </g>
</svg>`;

      console.log('🎨 Dynamic SVG generated with correct aspect ratio:', { 
        svgWidth, 
        svgHeight,
        aspectRatio: (svgWidth / svgHeight).toFixed(3),
        pathCount: paths.length
      });

      const fileName = `colorizations/colorization-${artwork.id}-${user?.id}-${Date.now()}.svg`;
      
      const { data, error } = await supabase.storage
        .from('artworks')
        .upload(fileName, svgString, {
          contentType: 'image/svg+xml',
          cacheControl: '3600'
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('artworks')
        .getPublicUrl(fileName);

      console.log('✅ SVG saved with correct dimensions:', { 
        url: urlData.publicUrl,
        width: svgWidth,
        height: svgHeight 
      });
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error uploading colorization:', error);
      throw error;
    }
  };

  // Save colorization
  const saveColorization = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to save your colorization.');
      return;
    }

    if (paths.length === 0) {
      Alert.alert('No Coloring', 'Please color the artwork before saving.');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadColoredImage();
      await saveColorizationToDatabase(imageUrl);
      setShowSaveModal(true);
      
    } catch (error: any) {
      console.error('Error saving colorization:', error);
      Alert.alert('Save Failed', error.message || 'Failed to save colorization. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModalClose = () => {
    setShowSaveModal(false);
    navigation.goBack();
  };

  // FIXED: Convert image coordinates to screen coordinates for display
  const getPathsForDisplay = useCallback(() => {
    return paths.map(pathData => {
      // Convert each point from image coordinates to screen coordinates
      const screenPoints = pathData.points.map(point => {
        const screenX = (point.x * scaleInfo.scale) + scaleInfo.offsetX;
        const screenY = (point.y * scaleInfo.scale) + scaleInfo.offsetY;
        return { x: screenX, y: screenY };
      });
      
      return {
        ...pathData,
        path: pointsToSvgPath(screenPoints),
        strokeWidth: pathData.strokeWidth * scaleInfo.scale
      };
    });
  }, [paths, scaleInfo]);

  const displayPaths = getPathsForDisplay();

  // FIXED: Get current path for display
  const getCurrentPathForDisplay = () => {
    if (!currentPath || currentPath.points.length < 2) return null;
    
    // Convert current path points from image to screen coordinates
    const screenPoints = currentPath.points.map(point => {
      const screenX = (point.x * scaleInfo.scale) + scaleInfo.offsetX;
      const screenY = (point.y * scaleInfo.scale) + scaleInfo.offsetY;
      return { x: screenX, y: screenY };
    });
    
    return pointsToSvgPath(screenPoints);
  };

  const currentPathForDisplay = getCurrentPathForDisplay();

  // Show loading while we get dimensions
  if (imageDimensions.width === 0 || imageDimensions.height === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          Coloring: {artwork.title}
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveColorization}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Dynamic Coloring Area */}
      <View 
        style={styles.coloringArea}
        onLayout={onContainerLayout}
      >
        {/* Background Line Art */}
        {scaleInfo.scaledWidth > 0 && scaleInfo.scaledHeight > 0 && (
          <>
            <View style={[
              styles.backgroundContainer,
              {
                left: scaleInfo.offsetX,
                top: scaleInfo.offsetY,
                width: scaleInfo.scaledWidth,
                height: scaleInfo.scaledHeight,
              }
            ]}>
              <Image 
                source={{ uri: artwork.lineArtUrl }} 
                style={{
                  width: '100%',
                  height: '100%',
                }}
                resizeMode="contain"
              />
            </View>

            {/* Drawing Canvas - FIXED: Use full container for touch area but scaled for display */}
            <View 
              style={[
                styles.drawingCanvas,
                {
                  left: 0,
                  top: 0,
                  width: containerDimensions.width,
                  height: containerDimensions.height,
                }
              ]}
              {...panResponder.panHandlers}
            >
              <Svg 
                style={{
                  width: containerDimensions.width,
                  height: containerDimensions.height,
                  position: 'absolute',
                }}
                ref={svgRef}
              >
                {/* Render ONLY the display paths (screen coordinates) */}
                <G>
                  {displayPaths.map((pathData, index) => (
                    <Path
                      key={index}
                      d={pathData.path}
                      stroke={pathData.color}
                      strokeWidth={pathData.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ))}
                </G>
                
                {/* Render current active path (screen coordinates) */}
                {currentPathForDisplay && (
                  <Path
                    d={currentPathForDisplay}
                    stroke={currentPath!.color}
                    strokeWidth={currentPath!.strokeWidth * scaleInfo.scale}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </Svg>
            </View>
          </>
        )}
      </View>  

      {/* Rest of your UI (Color Palette, Brush Sizes, Tools) remains the same */}
      <View style={styles.paletteSection}>
        <Text style={styles.sectionTitle}>Colors</Text>
        <View style={styles.colorGrid}>
          {colorPalette.map(({ color, id }) => (
            <TouchableOpacity
              key={id}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                currentColor === color && styles.selectedColor,
                color === '#FFFFFF' && styles.whiteColor,
              ]}
              onPress={() => setCurrentColor(color)}
            />
          ))}
        </View>
      </View>

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
                    backgroundColor: currentColor,
                    borderColor: currentColor === '#FFFFFF' ? '#ccc' : 'transparent'
                  }
                ]} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.toolsSection}>
        <TouchableOpacity 
          style={[styles.toolButton, paths.length === 0 && styles.toolButtonDisabled]}
          onPress={undoLastPath}
          disabled={paths.length === 0}
        >
          <Text style={[
            styles.toolButtonText,
            paths.length === 0 && styles.toolButtonTextDisabled
          ]}>↶ Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toolButton, paths.length === 0 && styles.toolButtonDisabled]}
          onPress={clearCanvas}
          disabled={paths.length === 0}
        >
          <Text style={[
            styles.toolButtonText,
            paths.length === 0 && styles.toolButtonTextDisabled
          ]}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Save Success Modal */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Success! 🎉</Text>
            <Text style={styles.modalText}>
              Your colorization has been saved! Others can now see your creative work.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalPrimaryButton]}
              onPress={handleSaveModalClose}
            >
              <Text style={styles.modalPrimaryText}>View in Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Your styles remain the same...
const styles = StyleSheet.create({
  // ... keep all your existing styles
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  coloringArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  backgroundContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawingCanvas: {
    position: 'absolute',
    backgroundColor: 'transparent',
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
  whiteColor: {
    borderColor: '#ccc',
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
    alignItems: 'center',
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
    borderWidth: 1,
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
  toolButtonDisabled: {
    backgroundColor: '#f8f8f8',
  },
  toolButtonText: {
    fontWeight: '600',
  },
  toolButtonTextDisabled: {
    color: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#4CAF50',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalPrimaryButton: {
    backgroundColor: '#007AFF',
  },
  modalPrimaryText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default ColoringScreen;