// screens/ColoringScreen.tsx - UPDATED FOR YOUR RemoteSVG
import React, { useEffect, useState, useCallback, } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Alert,
  ActivityIndicator,
  Modal,
  Image
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { CreativeWork } from '../types/core';
import { useAuth } from '../context/AuthContext';
import { worksService } from '../services/worksService';
import { supabase } from '../lib/supabase';
import RemoteSVG from '../components/RemoteSVG';
import { svgAnalysisService , ColorablePath } from '../services/svgAnalysisService';

type Props = NativeStackScreenProps<RootStackParamList, 'Coloring'>;

const ColoringScreen = ({ route, navigation }: Props) => {
  const { artwork } = route.params;
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [coloredAreas, setColoredAreas] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [colorablePaths, setColorablePaths] = useState<ColorablePath[]>([]);
  const [analyzingSVG, setAnalyzingSVG] = useState(false);
  
  // Color palette
  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#A569BD', '#D7BDE2'
  ];

  // Analyze SVG when artwork loads

const analyzeArtworkSVG = async () => {
  console.log('🔄 analyzeArtworkSVG called - starting SVG analysis');
  setAnalyzingSVG(true);
  try {
    console.log('🎯 Artwork URL:', artwork.assetUrl);
    console.log('🔍 Is SVG?', artwork.assetUrl.toLowerCase().endsWith('.svg'));
    
    const response = await fetch(artwork.assetUrl);
    console.log('📡 Fetch response status:', response.status);
    
    const svgText = await response.text();
    console.log('📄 SVG text length:', svgText.length);
    console.log('📄 First 200 chars:', svgText.substring(0, 200));
    
    // Try calling the debug function directly
    console.log('🔧 Calling svgAnalysisService.debugSVGContent...');
    svgAnalysisService.debugSVGContent(svgText);
    
    console.log('🔧 Calling svgAnalysisService.analyzeSVG...');
    const paths = await svgAnalysisService.analyzeSVG(artwork.assetUrl);
    console.log('✅ Analysis complete, paths found:', paths.length);
    
    setColorablePaths(paths);
    
  } catch (error) {
    console.error('❌ Error analyzing SVG:', error);
  } finally {
    setAnalyzingSVG(false);
    console.log('🏁 Analysis finished');
  }
};

useEffect(() => {
  console.log('🎯 useEffect triggered');
  console.log('🎯 Artwork URL:', artwork.assetUrl);
  console.log('🎯 Is SVG?', artwork.assetUrl.toLowerCase().endsWith('.svg'));
  
  if (artwork.assetUrl.toLowerCase().endsWith('.svg')) {
    console.log('🎯 Starting SVG analysis...');
    analyzeArtworkSVG();
  } else {
    console.log('🎯 Not an SVG, skipping analysis');
  }
}, [artwork.assetUrl]);

  const handleArtworkTap = useCallback((event: any) => {

    const nativeEvent = event.nativeEvent || {};
    console.log('🎯 Tap event type:', event.type);
    console.log('🎯 Native event keys:', Object.keys(nativeEvent));
    
    // Get tap coordinates relative to the artwork container
    // Try different event structures
  const coords = event.nativeEvent || {};
  const locationX = coords.locationX || coords.x;
  const locationY = coords.locationY || coords.y;
  
  console.log('📍 Tap coordinates:', { locationX, locationY });
  console.log('📍 Event keys:', Object.keys(coords));
    console.log('📍 Tap event:', event.nativeEvent);
    console.log('📍 Tap at:', { x: locationX, y: locationY });
    if (locationX === undefined || locationY === undefined) {
      console.log('❌ No valid coordinates found in event');
      return;
    }
    
    if (locationX === undefined || locationY === undefined) {
      console.log('❌ No valid coordinates found');
      return;
    }

    // For Phase 1: Simple area detection based on tap position
    const tappedArea = detectTappedArea(locationX, locationY);
    
    if (tappedArea) {
      setColoredAreas(prev => ({
        ...prev,
        [tappedArea]: selectedColor
      }));
      console.log('🎨 Colored area:', tappedArea);
    } else {
      console.log('❌ No area detected at:', { x: locationX, y: locationY });
    }
  }, [selectedColor]);

  const detectTappedArea = (x: number, y: number): string | null => {
    // Check which SVG path contains the tap coordinates
    for (const path of colorablePaths) {
      const { bounds } = path;
      const tolerance = 5;
      
      // First check the bounding box (fast)
      if (x >= bounds.x - tolerance && 
          x <= bounds.x + bounds.width + tolerance && 
          y >= bounds.y - tolerance && 
          y <= bounds.y + bounds.height + tolerance) {
        
        // TODO: In Phase 2.1, we'll add precise point-in-path detection
        // For now, we'll use bounding boxes
        console.log('🎯 Tapped path:', path.id);
        return path.id;
      }
    }
    
    console.log('❌ No path detected at:', { x, y });
    return null;
  };
  

  // Save as a new colored_art work
  const saveColoredWork = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to save your coloring.');
      return;
    }
  
    if (Object.keys(coloredAreas).length === 0) {
      Alert.alert('No Coloring', 'Please color some areas before saving.');
      return;
    }
  
    setIsSaving(true);
    try {
      // Generate a new SVG with the colors applied
      const coloredSVGUrl = await generateColoredSVG();
      
      // Create a new colored_art derivative with the ACTUAL colored image
      const coloredWork = await worksService.createWork({
        title: `Colored: ${artwork.title}`,
        description: `A colorful interpretation of "${artwork.title}"`,
        mediaType: 'colored_art',
        mediaConfig: {
          isColorable: false,
          originalLineArtId: artwork.id,
          complexity: 'medium',
          technique: 'flat'
        },
        assetUrl: coloredSVGUrl, // Use the NEW colored SVG, not the original
        originalWorkId: artwork.id,
        tags: [...(artwork.tags || []), 'colored', 'derivative'],
        visibility: 'public'
      });
  
      // Create collaboration record
      const { error: collabError } = await supabase
        .from('collaborations')
        .insert({
          original_work_id: artwork.id,
          derived_work_id: coloredWork.id,
          collaboration_type: 'colorization',
          description: 'Digital coloring collaboration',
          context: {
            colored_areas: coloredAreas,
            color_palette: Array.from(new Set(Object.values(coloredAreas))),
            colored_at: new Date().toISOString()
          }
        });
  
      if (collabError) throw collabError;
  
      setShowSaveModal(true);
      
    } catch (error: any) {
      console.error('Error saving colored work:', error);
      Alert.alert('Save Failed', error.message || 'Failed to save coloring. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // ADD this function to generate the colored SVG
  const generateColoredSVG = async (): Promise<string> => {
    try {
      if (!user) {
        throw new Error('User must be logged in to save coloring');
      }
  
      const svgWidth = 300;
      const svgHeight = 400;
      const isOriginalSVG = artwork.assetUrl.toLowerCase().endsWith('.svg');
      
      let svgString = '';
      
      if (isOriginalSVG) {
        // For SVG originals - use actual path data
        svgString = `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    <!-- White background -->
    <rect width="100%" height="100%" fill="#FFFFFF"/>
    
    <!-- Original line art (faint) -->
    <image 
      href="${artwork.assetUrl}" 
      width="100%" 
      height="100%" 
      opacity="0.3"
      preserveAspectRatio="xMidYMid meet"
    />
    
    <!-- Colored Areas - Using actual SVG paths -->
    ${Object.entries(coloredAreas).map(([pathId, color]) => {
      const path = colorablePaths.find(p => p.id === pathId);
      if (path) {
        return `<path 
          d="${path.pathData}" 
          fill="${color}" 
          opacity="0.8"
        >
          <title>Colored path: ${pathId}</title>
        </path>`;
      }
      return '';
    }).filter(Boolean).join('\n  ')}
  </svg>`;
      } else {
        // For PNG originals - keep the existing bounds-based approach
        svgString = `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    <!-- White background -->
    <rect width="100%" height="100%" fill="#FFFFFF"/>
    
    <!-- Simple outline to represent the original artwork -->
    <rect 
      x="10" y="10" 
      width="${svgWidth - 20}" height="${svgHeight - 20}" 
      fill="none" 
      stroke="#CCCCCC" 
      stroke-width="2"
      stroke-dasharray="4,4"
    />
    
    <!-- Colored Areas - Using path bounds for PNG -->
    ${Object.entries(coloredAreas).map(([pathId, color]) => {
      const path = colorablePaths.find(p => p.id === pathId);
      if (path) {
        const { bounds } = path;
        return `<rect 
          x="${bounds.x}" 
          y="${bounds.y}" 
          width="${bounds.width}" 
          height="${bounds.height}" 
          fill="${color}" 
          opacity="0.8"
        >
          <title>Colored path: ${pathId}</title>
        </rect>`;
      }
      return '';
    }).filter(Boolean).join('\n  ')}
    
    <!-- Label indicating this is a colored version -->
    <text 
      x="${svgWidth / 2}" y="30" 
      text-anchor="middle" 
      font-family="Arial, sans-serif" 
      font-size="14" 
      fill="#666666"
    >
      Colored Version of: ${artwork.title}
    </text>
  </svg>`;
      }

    // Upload this SVG to Supabase Storage
    const fileName = `colorizations/${user.id}/${artwork.id}-${Date.now()}.svg`;
    
    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(fileName, svgString, {
        contentType: 'image/svg+xml',
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('artworks')
      .getPublicUrl(fileName);

    console.log('✅ Colored SVG saved:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error generating colored SVG:', error);
    throw error;
  }
};

  const handleReset = () => {
    setColoredAreas({});
  };

  const handleSaveModalClose = () => {
    setShowSaveModal(false);
    navigation.goBack();
  };

  // Update your ColoringScreen to show potential colorable areas
  const renderColorableAreas = () => {
    if (analyzingSVG) {
      return (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.analyzingText}>Analyzing artwork...</Text>
        </View>
      );
    }
  
    return colorablePaths.map(path => (
      <TouchableOpacity
        key={`path-${path.id}`}
        style={[
          styles.pathArea,
          { 
            left: path.bounds.x,
            top: path.bounds.y,
            width: path.bounds.width,
            height: path.bounds.height
          },
          coloredAreas[path.id] ? styles.coloredPath : styles.uncoloredPath
        ]}
        onPress={() => {
          setColoredAreas(prev => ({
            ...prev,
            [path.id]: selectedColor
          }));
        }}
      >
        <Text style={styles.pathLabel}>{path.id}</Text>
      </TouchableOpacity>
    ));
  };

  // Render colored areas as simple overlays
  const renderColoredOverlays = () => {
    return Object.entries(coloredAreas).map(([areaId, color]) => (
      <View
        key={areaId}
        style={[
          styles.coloredArea, // Use the correct style name
          { backgroundColor: color },
        ]}
      />
    ));
  };

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
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={saveColoredWork}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {Object.keys(coloredAreas).length} area{Object.keys(coloredAreas).length !== 1 ? 's' : ''} colored
        </Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Coloring Area */}
      <View style={styles.coloringArea}>
        <TouchableOpacity 
          style={styles.artworkTouchable}
          onPress={handleArtworkTap}
          activeOpacity={0.9}
        >
          {/* Use RemoteSVG for the artwork */}
          <View style={styles.artworkContainer}>
      {/* Use regular Image for PNG/JPG, RemoteSVG for SVG */}
      {artwork.assetUrl.toLowerCase().endsWith('.svg') ? (
        <RemoteSVG
          uri={artwork.assetUrl}
          width={300}
          height={400}
          style={styles.artworkImage}
        />
      ) : (
        <Image 
          source={{ uri: artwork.assetUrl }}
          style={[styles.artworkImage, { width: 300, height: 400 }]}
          resizeMode="contain"
        />
      )}
      
      {/* Colored Areas Overlay */}
      <View style={styles.overlayContainer}>
        {renderColorableAreas()}
        {renderColoredOverlays()}
      </View>
    </View>
  </TouchableOpacity>
  
  <Text style={styles.tapHint}>Tap anywhere to color random areas</Text>
</View>

      {/* Color Palette */}
      <View style={styles.paletteSection}>
        <Text style={styles.sectionTitle}>Colors</Text>
        <View style={styles.colorGrid}>
          {colorPalette.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.selectedColor,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
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
              Your coloring has been saved as a new artwork in the collaboration chain!
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

const styles = StyleSheet.create({
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
  coloredAreaStyle: { // Renamed to avoid conflict with the component
    borderColor: 'rgba(0,0,0,0.5)',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  coloredArea: { 
    position: 'absolute',
    opacity: 0.6,
    borderRadius: 4,
    pointerEvents: 'box-none',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  statsText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  resetText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  coloringArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  artworkTouchable: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  artworkContainer: {
    position: 'relative',
    width: 300,
    height: 400,
  },
  artworkImage: {
    opacity: 0.7, // Make line art faint so colors stand out
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none', // Allow taps to pass through to the artwork
  },
  tapHint: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
    backgroundColor: '#4ECDC4',
  },
  modalPrimaryText: {
    color: 'white',
    fontWeight: '600',
  },
  uncoloredArea: {
    borderColor: 'rgba(0,255,0,0.3)',
    backgroundColor: 'rgba(0,255,0,0.1)',
  },
  areaLabel: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.7)',
    fontWeight: 'bold',
  },
  areaBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
  },
  colorableArea: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 4,
  },
  coloredAreaOverlay: { // Renamed to avoid conflict
    position: 'absolute',
    opacity: 0.6,
    borderRadius: 4,
  },
  analyzingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    zIndex: 10, // Ensure it appears above everything
  },
  
  analyzingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  pathArea: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 3,
    // Smooth shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  
  coloredPath: {
    borderColor: 'rgba(0, 0, 0, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Very subtle background
    // Remove background when colored to let the actual color show through
  },
  
 // TEMPORARY DEBUG STYLES
uncoloredPath: {
  borderColor: 'rgba(255, 0, 0, 0.8)', // Bright red for easy visibility
  backgroundColor: 'rgba(255, 0, 0, 0.2)',
  borderWidth: 2,
},
  
  pathLabel: {
    fontSize: 7, // Even smaller for tight spaces
    color: 'rgba(0, 0, 0, 0.8)',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent background
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
  },
});

export default ColoringScreen;