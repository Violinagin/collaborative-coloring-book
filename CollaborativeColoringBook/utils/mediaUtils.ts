// utils/mediaUtils.ts
import { CreativeWork, MediaConfig, LineArtConfig, ColoredArtConfig, MediaType, DigitalArtConfig } from '../types/core';

export const mediaUtils = {
  // Check if a work is colorable
  isColorable(work: CreativeWork): boolean {
    return work.mediaType === 'line_art' || work.mediaType === 'colored_art';
  },

  // Get human-readable media type label
  getMediaTypeLabel(mediaType: MediaType): string {
    const labels: Record<MediaType, string> = {
      'line_art': '✏️ Line Art',
      'colored_art': '🌈 Colored Art', 
      'digital_art': '🖥️ Digital Art',
      'writing': '📝 Writing',
      'music': '🎵 Music',
      'animation': '🎬 Animation',
      'comic': '📚 Comic',
      'three_d': '🔷 3D Model'
    };
    return labels[mediaType] || mediaType;
  },

  getMediaTypeColor(type: MediaType): string {
    const colors: Record<MediaType, string> = {
      'line_art': '#3b82f6',    // Blue
      'colored_art': '#8b5cf6', // Purple
      'digital_art': '#10b981', // Green
      'writing': '#f59e0b',     // Amber
      'music': '#ec4899',       // Pink
      'animation': '#ef4444',   // Red
      'comic': '#f97316',       // Orange
      'three_d': '#06b6d4'      // Cyan
    };
    return colors[type] || '#6b7280';
  },

  getMediaTypeDescription(type: MediaType): string {
    const descriptions: Record<MediaType, string> = {
      'line_art': 'Black and white drawings ready for coloring',
      'colored_art': 'Already colored artwork',
      'digital_art': 'Finished digital paintings and illustrations',
      'writing': 'Stories, poems, and written works',
      'music': 'Audio compositions and soundscapes',
      'animation': 'Animated sequences and motion graphics',
      'comic': 'Comic strips and graphic narratives',
      'three_d': '3D models and sculptures'
    };
    return descriptions[type] || 'Creative work';
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
  }
};