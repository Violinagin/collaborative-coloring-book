// components/SkiaColoringScreen.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Alert, 
  TouchableWithoutFeedback, 
  Text,
  GestureResponderEvent,
} from 'react-native';
import { Canvas, Image, useImage, type SkImage } from '@shopify/react-native-skia';
import { skiaFloodFillService } from '../services/skiaFloodFillService';
import { ColorPicker } from '../components/ColorPicker';

import { RootStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Coloring'>;  

const { width: screenWidth } = Dimensions.get('window');

export const SkiaColoringScreen: React.FC<Props> = ({ route }) => {
    const { imageUrl } = route.params;
  const [currentImage, setCurrentImage] = useState<SkImage | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [isLoading, setIsLoading] = useState(false);
  const [canvasLayout, setCanvasLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Load the initial image
  const initialImage = useImage(imageUrl);

  // Set the current image when initial image loads
  React.useEffect(() => {
    if (initialImage && !currentImage) {
      setCurrentImage(initialImage);
    }
  }, [initialImage, currentImage]);

  const handleCanvasPress = useCallback(
    async (event: GestureResponderEvent) => {
      if (isLoading || !currentImage) return;

      setIsLoading(true);

      try {
        const { locationX, locationY } = event.nativeEvent;
        console.log('🖌️ Canvas pressed at:', locationX, locationY);
        
        // Convert touch coordinates to image coordinates
        const imageX = Math.floor((locationX / canvasLayout.width) * currentImage.width());
        const imageY = Math.floor((locationY / canvasLayout.height) * currentImage.height());
        
        console.log('🎯 Image coordinates:', imageX, imageY);
        
        const result = await skiaFloodFillService.floodFillImage(
          currentImage,
          { x: imageX, y: imageY },
          selectedColor
        );

        if (result.success) {
          setCurrentImage(result.image);
          Alert.alert('Colored!', `Filled ${result.filledPixels} pixels`);
        }
      } catch (error) {
        console.error('Flood fill failed:', error);
        Alert.alert('Error', 'Could not fill this area. Try a different spot.');
      } finally {
        setIsLoading(false);
      }
    },
    [currentImage, selectedColor, isLoading, canvasLayout]
  );

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    console.log('🎨 Selected color:', color);
  };

  const handleCanvasLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setCanvasLayout({ x, y, width, height });
    console.log('📐 Canvas layout:', { x, y, width, height });
  };

  if (!currentImage) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading image...</Text>
        </View>
      </View>
    );
  }

  // Calculate image dimensions for display
  const imageWidth = currentImage.width();
  const imageHeight = currentImage.height();
  const aspectRatio = imageWidth / imageHeight;
  const displayWidth = Math.min(screenWidth - 40, imageWidth);
  const displayHeight = displayWidth / aspectRatio;

  return (
    <View style={styles.container}>
      <ColorPicker 
        onColorSelect={handleColorSelect} 
        selectedColor={selectedColor} 
      />
      
      <View style={styles.canvasContainer}>
        <TouchableWithoutFeedback onPress={handleCanvasPress}>
          <View onLayout={handleCanvasLayout}>
            <Canvas 
              style={[
                styles.canvas, 
                { width: displayWidth, height: displayHeight }
              ]}
            >
              <Image
                image={currentImage}
                x={0}
                y={0}
                width={displayWidth}
                height={displayHeight}
                fit="contain"
              />
            </Canvas>
          </View>
        </TouchableWithoutFeedback>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text>Coloring...</Text>
          </View>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          🎨 Tap anywhere to fill with {selectedColor}
        </Text>
        <Text style={styles.instructionText}>
          ⚠️ Avoid tapping on black lines
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  canvas: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
});
export default SkiaColoringScreen;