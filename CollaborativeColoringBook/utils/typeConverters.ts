// utils/typeConverters.ts
import { Artwork } from '../types/User';
import { CreativeWork, LineArtConfig } from '../types/core';

export const convertArtworkToCreativeWork = (artwork: Artwork): CreativeWork => {
  return {
    id: artwork.id,
    title: artwork.title,
    description: artwork.description,
    artistId: artwork.artistId,
    mediaType: 'line_art', // Assume old artworks are line art
    assetUrl: artwork.lineArtUrl,
    mediaConfig: {
      isColorable: true,
      complexity: 'medium'
    } as LineArtConfig,
    originalWorkId: undefined,
    derivationChain: [],
    metadata: {},
    tags: [],
    visibility: 'public',
    createdAt: artwork.createdAt,
    updatedAt: artwork.createdAt
  };
};