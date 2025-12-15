// utils/mediaUtils.ts
import { CreativeWork, LineArtConfig, ColoredArtConfig, MediaType, DigitalArtConfig, UploadableMediaType } from '../types/core';

// Define the media type configuration
export interface MediaTypeConfig {
  value: MediaType;
  emoji: string;
  label: string;
  description: string;
  color: string;
}

export interface UploadableMediaTypeConfig {
  value: UploadableMediaType;  // This is the key change
  emoji: string;
  label: string;
  description: string;
  color: string;
}

// All media types with their configurations
export const MEDIA_TYPE_CONFIGS: MediaTypeConfig[] = [
  { 
    value: 'line_art', 
    emoji: '✏️', 
    label: 'Line Art', 
    description: 'Black and white illustrations',
    color: '#3b82f6'
  },
  { 
    value: 'colored_art', 
    emoji: '🎨', 
    label: 'Colored Art', 
    description: 'A splash of color',
    color: '#8b5cf6'
  },
  { 
    value: 'digital_art', 
    emoji: '🖥️', 
    label: 'Digital Art', 
    description: 'Digital paintings and illustrations',
    color: '#10b981'
  },
  { 
    value: 'writing', 
    emoji: '📝', 
    label: 'Writing', 
    description: 'Stories, poems, and written works',
    color: '#f59e0b'
  },
  { 
    value: 'music', 
    emoji: '🎵', 
    label: 'Music', 
    description: 'Audio compositions and soundscapes',
    color: '#ec4899'
  },
  { 
    value: 'animation', 
    emoji: '🎬', 
    label: 'Animation', 
    description: 'Animated sequences and motion graphics',
    color: '#ef4444'
  },
  { 
    value: 'comic', 
    emoji: '📚', 
    label: 'Comic', 
    description: 'Comic strips and graphic narratives',
    color: '#f97316'
  },
  { 
    value: 'three_d', 
    emoji: '🔷', 
    label: '3D Model', 
    description: '3D models and sculptures',
    color: '#06b6d4'
  },
];

export const mediaUtils = {
  // Get all media type configs
  getAllMediaTypes(): MediaTypeConfig[] {
    return MEDIA_TYPE_CONFIGS;
  },

  // Get config for a specific media type
  getMediaTypeConfig(type: MediaType | undefined | null): MediaTypeConfig {
    // Handle undefined/null types
    if (!type) {
      return this.getFallbackConfig('unknown');
    }
    
    const config = MEDIA_TYPE_CONFIGS.find(c => c.value === type);
    if (!config) {
      return this.getFallbackConfig(type);
    }
    return config;
  },

  // Helper for fallback configs
  getFallbackConfig(type: string): MediaTypeConfig {
    const safeType = type || 'unknown';
    return {
      value: safeType as MediaType,
      emoji: '🔄',
      label: safeType.replace('_', ' ') || 'Unknown',
      description: 'Creative work',
      color: '#6b7280'
    };
  },

  // Get formatted label with emoji
  getMediaTypeLabel(type: MediaType | undefined | null): string {
    const config = this.getMediaTypeConfig(type);
    return `${config.emoji} ${config.label}`;
  },

  // Get just the emoji
  getMediaTypeEmoji(type: MediaType | undefined | null): string {
    return this.getMediaTypeConfig(type).emoji;
  },

   // Get description
  getMediaTypeDescription(type: MediaType | undefined | null): string {
    return this.getMediaTypeConfig(type).description;
  },

  // Get color
  getMediaTypeColor(type: MediaType | undefined | null): string {
    return this.getMediaTypeConfig(type).color;
  },

  // Get uploadable media types (for UploadScreen)
  getUploadableMediaTypes(): UploadableMediaType[] {
    return ['line_art', 'colored_art', 'digital_art'];
  },
  
  // Get configs for uploadable types
  getUploadableMediaTypeConfig(type: UploadableMediaType): UploadableMediaTypeConfig {
    const config = MEDIA_TYPE_CONFIGS.find(c => c.value === type);
    if (!config) {
      throw new Error(`Invalid uploadable media type: ${type}`);
    }
    return config as UploadableMediaTypeConfig;
  },
  
  getUploadableMediaTypeConfigs(): UploadableMediaTypeConfig[] {
    return this.getUploadableMediaTypes().map(type => 
      this.getUploadableMediaTypeConfig(type)
    );
  },

  // Check if a work is colorable
  isColorable(work: CreativeWork): boolean {
    if (!work || !work.mediaType) return false;
    return work.mediaType === 'line_art' || work.mediaType === 'colored_art';
  },

  // Get colorable config safely
  getColorableConfig(work: CreativeWork): LineArtConfig | ColoredArtConfig | null {
    if (work.mediaType === 'line_art' || work.mediaType === 'colored_art') {
      return work.mediaConfig as LineArtConfig | ColoredArtConfig;
    }
    return null;
  },

  // Get work complexity for coloring (only for line_art)
  getComplexity(work: CreativeWork): string | null {
    if (work.mediaType === 'line_art') {
      const config = work.mediaConfig as LineArtConfig;
      return config.complexity || null;
    }
    return null;
  },

  // Get suggested palette for coloring (only for line_art)
  getSuggestedPalette(work: CreativeWork): string[] {
    if (work.mediaType === 'line_art') {
      const config = work.mediaConfig as LineArtConfig;
      return config.suggestedPalette || [];
    }
    return [];
  },

  // Check if work has original line art reference (only for colored_art)
  hasOriginalLineArt(work: CreativeWork): boolean {
    if (work.mediaType === 'colored_art') {
      const config = work.mediaConfig as ColoredArtConfig;
      return !!config.originalLineArtId;
    }
    return false;
  },

  // Get coloring technique (only for colored_art)
  getColoringTechnique(work: CreativeWork): string | null {
    if (work.mediaType === 'colored_art') {
      const config = work.mediaConfig as ColoredArtConfig;
      return config.technique || null;
    }
    return null;
  },

  // Get layers for advanced coloring (only for line_art)
  getLayers(work: CreativeWork) {
    if (work.mediaType === 'line_art') {
      const config = work.mediaConfig as LineArtConfig;
      return config.layers || [];
    }
    return [];
  },

  // Add digital art style helper
  getDigitalArtStyle(work: CreativeWork): string | null {
    if (work.mediaType === 'digital_art') {
      const config = work.mediaConfig as DigitalArtConfig;
      return config.style || null;
    }
    return null;
  },
  getMediaTypeForDisplay(work: CreativeWork): {
    label: string;
    emoji: string;
    color: string;
    description: string;
  } {
    const config = this.getMediaTypeConfig(work.mediaType);
    return {
      label: config.label,
      emoji: config.emoji,
      color: config.color,
      description: config.description
    };
  },
};