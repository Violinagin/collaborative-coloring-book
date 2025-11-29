// components/SkiaColoringScreen.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableWithoutFeedback, 
  Text,
  GestureResponderEvent,
  ActivityIndicator,
} from 'react-native';
import { Skia } from '@shopify/react-native-skia';
import { Canvas, Image, useImage } from '@shopify/react-native-skia';
import { skiaFloodFillService } from '../services/skiaFloodFillService';
import { ColorPicker } from '../components/ColorPicker';
import { AlertModal } from '../components/AlertModal'; // Import your AlertModal
import { RootStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'SkiaColoring'>;  
// Add this at the top of your component
console.log('🔍 Skia module available:', !!Skia);
console.log('🔍 Skia Image factory available:', !!Skia?.Image);
console.log('🔍 MakeImageFromEncoded available:', !!Skia?.Image?.MakeImageFromEncoded);

// Also check what methods are available on Skia.Image
if (Skia?.Image) {
  console.log('🔍 Skia.Image methods:', Object.keys(Skia.Image));
}
// Also check the specific factory
console.log('🔍 MakeImageFromEncoded available:', !!Skia?.Image?.MakeImageFromEncoded);
const { width: screenWidth } = Dimensions.get('window');

export const SkiaColoringScreen: React.FC<Props> = ({ route }) => {
  const { imageUrl, title } = route.params;

  console.log('🔍 DEBUG - Full imageUrl:', imageUrl);
  console.log('🔍 DEBUG - Image extension:', imageUrl?.split('.').pop());

  React.useEffect(() => {
    const testImageLoad = async () => {
      try {
        console.log('🔍 Testing image fetch...');
        const response = await fetch(imageUrl);
        console.log('🔍 Fetch response status:', response.status);
        console.log('🔍 Fetch response ok:', response.ok);
        
        if (response.ok) {
          const blob = await response.blob();
          console.log('🔍 Image blob size:', blob.size);
          console.log('🔍 Image blob type:', blob.type);
        } else {
          console.error('🔍 Fetch failed with status:', response.status);
        }
      } catch (error) {
        console.error('🔍 Fetch error:', error);
      }
    };

    if (imageUrl) {
      testImageLoad();
    }
  }, [imageUrl]);
  
  // Simplified state - only what we actually need
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [isFilling, setIsFilling] = useState(false);
  const [canvasLayout, setCanvasLayout] = useState({ width: 0, height: 0 });
  
  // Alert modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Load image - this handles the loading state for us
  const image = useImage(imageUrl, (error) => {
    console.error('❌ Failed to load image:', error);
    showAlert('Error', 'Failed to load image. Please try again.');
  });

  // Helper function to show alerts
  const showAlert = useCallback((title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  }, []);

  // Handle canvas press for flood fill
  const handleCanvasPress = useCallback(
    async (event: GestureResponderEvent) => {
      if (isFilling || !image) return;

      setIsFilling(true);

      try {
        const { locationX, locationY } = event.nativeEvent;
        
        // Convert touch coordinates to image coordinates
        const imageX = Math.floor((locationX / canvasLayout.width) * image.width());
        const imageY = Math.floor((locationY / canvasLayout.height) * image.height());
        
        console.log('🎯 Flood fill at:', { imageX, imageY, color: selectedColor });
        
        // TODO: Implement your flood fill logic here
        // const result = await skiaFloodFillService.floodFillImage(...);
        
        // For now, just show a success message
        showAlert('Flood Fill', `Would fill at (${imageX}, ${imageY}) with ${selectedColor}`);
        
      } catch (error) {
        console.error('Flood fill failed:', error);
        showAlert('Error', 'Could not fill this area. Try a different spot.');
      } finally {
        setIsFilling(false);
      }
    },
    [image, selectedColor, isFilling, canvasLayout, showAlert]
  );

  // Track canvas dimensions
  const handleCanvasLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasLayout({ width, height });
  }, []);

  // Loading state
  if (!image) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading coloring page...</Text>
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
      </View>
    );
  }

  // Calculate display dimensions
  const aspectRatio = image.width() / image.height();
  const displayWidth = Math.min(screenWidth - 40, image.width());
  const displayHeight = displayWidth / aspectRatio;

  return (
    <View style={styles.container}>
      {/* Color Picker */}
      <ColorPicker 
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
      />
      
      {/* Canvas Area */}
      <View style={styles.canvasContainer}>
        <TouchableWithoutFeedback onPress={handleCanvasPress}>
          <View onLayout={handleCanvasLayout}>
            <Canvas style={{ width: displayWidth, height: displayHeight }}>
              <Image
                image={image}
                x={0}
                y={0}
                width={displayWidth}
                height={displayHeight}
                fit="contain"
              />
            </Canvas>
          </View>
        </TouchableWithoutFeedback>
        
        {/* Loading overlay during flood fill */}
        {isFilling && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#0000ff" />
            <Text>Coloring...</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          🎨 Tap anywhere to fill with {selectedColor}
        </Text>
      </View>

      {/* Alert Modal */}
      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  title: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  instructions: {
    padding: 16,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default SkiaColoringScreen;