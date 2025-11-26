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

const RemoteSVG = ({ uri, width, height, style, aspectRatio, lineArtUrl  }: RemoteSVGProps) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [lineArtDimensions, setLineArtDimensions] = useState({ width: 0, height: 0 });

  // Calculate dynamic dimensions
  const calculateDimensions = () => {
    const screen = Dimensions.get('window');
    
    // If both width and height provided, use them
    if (width && height) {
        // Calculate the actual dimensions that maintain the SVG's aspect ratio
        const svgAspectRatio = svgDimensions.width / svgDimensions.height;
        const targetAspectRatio = width / height;
        
        if (svgAspectRatio > targetAspectRatio) {
          // SVG is wider than target - fit to width
          return { width, height: width / svgAspectRatio };
        } else {
          // SVG is taller than target - fit to height
          return { width: height * svgAspectRatio, height };
        }
      }
    
    // If only width provided, calculate height from aspect ratio
    if (width && !height && svgDimensions.height > 0) {
      const calculatedHeight = (width / svgDimensions.width) * svgDimensions.height;
      return { width, height: calculatedHeight };
    }
    
    // If only height provided, calculate width from aspect ratio
    if (height && !width && svgDimensions.width > 0) {
      const calculatedWidth = (height / svgDimensions.height) * svgDimensions.width;
      return { width: calculatedWidth, height };
    }
    
    // If no dimensions provided, use a reasonable default that maintains aspect ratio
    if (svgDimensions.width > 0 && svgDimensions.height > 0) {
      const maxWidth = screen.width * 0.8;
      const scale = maxWidth / svgDimensions.width;
      return {
        width: svgDimensions.width * scale,
        height: svgDimensions.height * scale
      };
    }
    
    // Fallback
    return { width: width || 200, height: height || 200 };
  };

  // Extract dimensions from SVG content
  const extractSvgDimensions = (content: string) => {
    try {
        let extractedWidth = 0;
        let extractedHeight = 0;

      const widthMatch = content.match(/width="([^"]*)"/);
      const heightMatch = content.match(/height="([^"]*)"/);


      const viewBoxMatch = content.match(/viewBox="([^"]*)"/);
      
     
      
      // Parse width and height attributes
      if (widthMatch && heightMatch) {
        extractedWidth = parseFloat(widthMatch[1]) || 0;
        extractedHeight = parseFloat(heightMatch[1]) || 0;
      }
      
      // Fallback to viewBox if width/height are missing or zero
    if ((extractedWidth === 0 || extractedHeight === 0)) {
      const viewBoxMatch = content.match(/viewBox="([^"]*)"/);
      if (viewBoxMatch) {
        const viewBoxParts = viewBoxMatch[1].split(/[\s,]+/).filter(part => part !== '');
        if (viewBoxParts.length >= 4) {
          extractedWidth = parseFloat(viewBoxParts[2]) || 0;
          extractedHeight = parseFloat(viewBoxParts[3]) || 0;
        }
      }
    }
      
      // Final fallback
      if (extractedWidth === 0 || extractedHeight === 0) {
        extractedWidth = 400;
        extractedHeight = 400;
      }
      
      return { width: extractedWidth, height: extractedHeight };
    } catch (error) {
      console.error('Error extracting SVG dimensions:', error);
      return { width: 400, height: 400 };
    }
  };

   // Get line art dimensions
  useEffect(() => {
    if (lineArtUrl) {
      Image.getSize(lineArtUrl, (width, height) => {
        console.log('📐 Line art dimensions:', { width, height });
        setLineArtDimensions({ width, height });
      }, (error) => {
        console.warn('⚠️ Could not get line art dimensions:', error);
      });
    }
  }, [lineArtUrl]);

  useEffect(() => {
    const fetchSVG = async () => {
        try {
          setLoading(true);
          setError(null);
          
          console.log('🔄 RemoteSVG: Fetching dynamic SVG from:', uri);
          
          if (!uri || uri === 'null' || uri === 'undefined') {
            console.log('❌ RemoteSVG: Invalid URI provided');
            throw new Error('Invalid URI provided');
          }
      
          const response = await fetch(uri);
          
          if (!response.ok) {
            console.log('❌ RemoteSVG: HTTP request failed');
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
      
          const text = await response.text();
          
          if (!text || text.trim().length === 0) {
            console.log('❌ RemoteSVG: Empty response content');
            throw new Error('Empty SVG content');
          }
          
          // Check if it's actually SVG content
          const trimmedText = text.trim();
          
          const isSvg = trimmedText.startsWith('<svg') || 
                       trimmedText.startsWith('<?xml') || 
                       trimmedText.includes('<svg');
          
          if (!isSvg) {
            console.log('❌ RemoteSVG: Content does not appear to be valid SVG');
            console.log('❌ RemoteSVG: Content type might be:', response.headers.get('content-type'));
            throw new Error('Invalid SVG format - content does not appear to be SVG');
          }
      
          // Extract dimensions from SVG
        const dimensions = extractSvgDimensions(text);
        setSvgDimensions(dimensions);
        
        setSvgContent(text);
          setSvgContent(text);
          setError(null);
          
        } catch (err) {
          console.error('❌ RemoteSVG: Error in fetchSVG:', err);
          setError(err instanceof Error ? err.message : 'Failed to load image');
          setSvgContent(null);
        } finally {
          console.log('⏹️ RemoteSVG: Fetch completed, setting loading to false');
          setLoading(false);
        }
      };

    fetchSVG();
  }, [uri]);

  const displayDimensions = calculateDimensions();

  // Show loading state
  if (loading) {
    return (
        <View style={[{ width: displayDimensions.width, height: displayDimensions.height }, style, styles.container]}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
  }

  // Show error state
  if (error) {
    return (
      <View style={[{ width, height }, style, styles.container]}>
        <Text style={styles.errorText}>❌ Failed to load</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  // Try to render SVG if we have content
  if (svgContent) {
    try {
      return (
        <View style={[{ width, height }, style, { overflow: 'hidden', position: 'relative'}]}>
          {/* Line Art Background */}
          {lineArtUrl && (
        <View style={styles.lineArtBackground}>
          <Image 
            source={{ uri: lineArtUrl }} 
            style={{
              width: '100%',
              height: '100%',
            }}
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
        <View style={[{ width, height }, style, styles.container]}>
          <Text style={styles.errorText}>❌ Render error</Text>
          <Text style={styles.errorSubtext}>Invalid SVG format</Text>
        </View>
      );
    }
  }

  // Fallback if no content and no error
  return (
    <View style={[{ width, height }, style, styles.container]}>
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
    opacity: 0.8, // Slightly transparent so colors show through clearly
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