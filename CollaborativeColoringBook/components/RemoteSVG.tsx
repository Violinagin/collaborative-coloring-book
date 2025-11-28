// components/RemoteSVG.tsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, Dimensions, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface RemoteSVGProps {
  uri: string;
  width?: number;
  height?: number;
  style?: any;
  aspectRatio?: number;
  lineArtUrl?: string;
}

const RemoteSVG = ({ uri, width, height, style, aspectRatio, lineArtUrl }: RemoteSVGProps) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSVG, setIsSVG] = useState<boolean | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Check if the URI points to an SVG file
  const checkIfSVG = (url: string): boolean => {
    if (!url) return false;
    
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.svg') || 
           lowerUrl.includes('.svg?') ||
           lowerUrl.includes('svg');
  };

  // Get image dimensions for non-SVG images
  const getImageDimensions = (url: string) => {
    Image.getSize(url, (imgWidth, imgHeight) => {
      setImageDimensions({ width: imgWidth, height: imgHeight });
    }, (err) => {
      console.warn('⚠️ Could not get image dimensions:', err);
      setImageDimensions({ width: width || 300, height: height || 300 });
    });
  };

  useEffect(() => {
    const processURI = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 RemoteSVG: Processing URI:', uri);
        
        if (!uri || uri === 'null' || uri === 'undefined') {
          throw new Error('Invalid URI provided');
        }

        const svgCheck = checkIfSVG(uri);
        setIsSVG(svgCheck);
        
        if (svgCheck) {
          console.log('📄 RemoteSVG: Detected SVG file');
          // It's an SVG - fetch and parse
          const response = await fetch(uri);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const text = await response.text();
          
          if (!text || text.trim().length === 0) {
            throw new Error('Empty SVG content');
          }
          
          // Basic SVG validation
          const trimmedText = text.trim();
          const isSvgContent = trimmedText.startsWith('<svg') || 
                             trimmedText.startsWith('<?xml') || 
                             trimmedText.includes('<svg');
          
          if (!isSvgContent) {
            throw new Error('Invalid SVG format');
          }

          setSvgContent(text);
        } else {
          console.log('🖼️ RemoteSVG: Detected raster image (PNG/JPG/etc)');
          // It's a raster image - get dimensions for proper sizing
          getImageDimensions(uri);
        }
        
      } catch (err) {
        console.error('❌ RemoteSVG: Error processing URI:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    processURI();
  }, [uri]);

  // Calculate display dimensions
  const calculateDimensions = () => {
    const screen = Dimensions.get('window');
    
    // Use provided dimensions if available
    if (width && height) {
      return { width, height };
    }
    
    // For raster images, use actual dimensions with scaling
    if (!isSVG && imageDimensions.width > 0 && imageDimensions.height > 0) {
      const maxWidth = screen.width * 0.8;
      const scale = maxWidth / imageDimensions.width;
      return {
        width: imageDimensions.width * scale,
        height: imageDimensions.height * scale
      };
    }
    
    // Fallback dimensions
    return { width: width || 300, height: height || 300 };
  };

  const displayDimensions = calculateDimensions();

  // Show loading state
  if (loading) {
    return (
      <View style={[{ width: displayDimensions.width, height: displayDimensions.height }, style, styles.container]}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading image...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[{ width: displayDimensions.width, height: displayDimensions.height }, style, styles.container]}>
        <Text style={styles.errorText}>❌ Failed to load</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  // Render SVG content
  if (isSVG && svgContent) {
    try {
      return (
        <View style={[{ width: displayDimensions.width, height: displayDimensions.height }, style]}>
          {/* Line Art Background for coloring */}
          {lineArtUrl && (
            <View style={styles.lineArtBackground}>
              <Image 
                source={{ uri: lineArtUrl }} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
          )}    
          <View style={styles.svgOverlay}>
            <SvgXml 
              xml={svgContent} 
              width={displayDimensions.width} 
              height={displayDimensions.height}
              preserveAspectRatio="xMidYMid meet"
            />
          </View>
        </View>
      );
    } catch (svgError) {
      console.error('❌ SVG rendering error:', svgError);
      return (
        <View style={[{ width: displayDimensions.width, height: displayDimensions.height }, style, styles.container]}>
          <Text style={styles.errorText}>❌ SVG render error</Text>
        </View>
      );
    }
  }

  // Render raster image (PNG, JPG, etc)
  if (!isSVG) {
    return (
      <View style={[{ width: displayDimensions.width, height: displayDimensions.height }, style]}>
        <Image 
          source={{ uri }}
          style={{ 
            width: displayDimensions.width, 
            height: displayDimensions.height 
          }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Fallback
  return (
    <View style={[{ width: displayDimensions.width, height: displayDimensions.height }, style, styles.container]}>
      <Text style={styles.errorText}>No image data</Text>
    </View>
  );
};

const styles = {
  container: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  errorText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center' as const,
  },
  errorSubtext: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  lineArtBackground: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 0.8,
  },
  svgOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },  
};

export default RemoteSVG;