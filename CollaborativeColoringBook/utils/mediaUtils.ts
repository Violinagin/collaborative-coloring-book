// utils/mediaUtils.ts
import { CreativeWork, MediaConfig, LineArtConfig, ColoredArtConfig, MediaType } from '../types/core';

export const mediaUtils = {
  // Check if a work is colorable
  isColorable(work: CreativeWork): boolean {
    if (work.mediaType === 'line_art' || work.mediaType === 'colored_art') {
      const config = work.mediaConfig as LineArtConfig | ColoredArtConfig;
      return config.isColorable;
    }
    return false;
  },

  // Get human-readable media type label
  getMediaTypeLabel(mediaType: MediaType): string {
    const labels: Record<MediaType, string> = {
      'line_art': '🎨 Line Art',
      'colored_art': '🌈 Colored Art', 
      'digital_art': '✨ Digital Art',
      'writing': '📝 Writing',
      'music': '🎵 Music',
      'animation': '🎬 Animation',
      'comic': '📚 Comic',
      'three_d': '🔷 3D Model'
    };
    return labels[mediaType];
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
  }
};