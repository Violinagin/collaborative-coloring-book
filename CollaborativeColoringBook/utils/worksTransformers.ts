// // utils/worksTransformers.ts
import { CreativeWork, UploadWork, DatabaseWork } from '../types';
import { transformDatabaseUser } from './transformers';

// import { 
//     CreativeWork, 
//     MediaConfig,
//     LineArtConfig,
//     ColoredArtConfig,
//     DigitalArtConfig,
//     WritingConfig,
//     MusicConfig,
//     AnimationConfig,
//     Like,
//     ArtworkComment,
//     User
//   } from '../types/core';
//   import { transformDatabaseUser } from './userTransformers';
  
//   // ==================== TYPE GUARDS ====================
  
//   export const isLineArtConfig = (config: any): config is LineArtConfig => {
//     return config?.isColorable === true && 
//            ['simple', 'medium', 'complex'].includes(config?.complexity);
//   };
  
//   export const isColoredArtConfig = (config: any): config is ColoredArtConfig => {
//     return config?.isColorable === false && 
//            config?.technique && 
//            ['simple', 'medium', 'complex'].includes(config?.complexity);
//   };
  
//   export const isDigitalArtConfig = (config: any): config is DigitalArtConfig => {
//     return config?.isColorable === false && 
//            config?.style !== undefined;
//   };
  
//   export const isWritingConfig = (config: any): config is WritingConfig => {
//     return config?.isColorable === false && 
//            typeof config?.wordCount === 'number';
//   };
  
//   export const isMusicConfig = (config: any): config is MusicConfig => {
//     return config?.isColorable === false && 
//            typeof config?.duration === 'number';
//   };
  
//   export const isAnimationConfig = (config: any): config is AnimationConfig => {
//     return config?.isColorable === false && 
//            typeof config?.duration === 'number' && 
//            typeof config?.frameRate === 'number';
//   };
  
//   // ==================== WORK TRANSFORMERS ====================
  
//   export const transformDatabaseWork = (dbWork: any): CreativeWork => {
//     if (!dbWork) {
//       return createFallbackWork('unknown');
//     }
  
//     return {
//       id: dbWork.id,
//       title: dbWork.title || 'Untitled Artwork',
//       description: dbWork.description || '',
//       artistId: dbWork.artist_id || 'unknown',
//       mediaType: dbWork.media_type || 'line_art',
//       assetUrl: dbWork.asset_url || '',
//       mediaConfig: dbWork.media_config,
//       originalWorkId: dbWork.original_work_id || undefined,
//       derivationChain: dbWork.derivation_chain || [],
//       metadata: dbWork.metadata || {},
//       tags: dbWork.tags || [],
//       visibility: dbWork.visibility || 'public',
//       createdAt: dbWork.created_at ? new Date(dbWork.created_at) : new Date(),
//       updatedAt: dbWork.updated_at ? new Date(dbWork.updated_at) : new Date(),
//       // Social features will be added separately
//       likes: [],
//       comments: [],
//       userHasLiked: false
//     };
//   };
  
//   export const transformDatabaseWorkWithSocial = (
//     dbWork: any, 
//     currentUserId?: string
//   ): CreativeWork => {
//     // Start with basic work
//     const baseWork = transformDatabaseWork(dbWork);
    
//     // Add artist if available
//     let artist: User | undefined;
//     if (dbWork.artist) {
//       artist = transformDatabaseUser(dbWork.artist);
//     }
    
//     // Transform likes
//     const likes: Like[] = (dbWork.likes || []).map((like: any) => ({
//       id: like.id,
//       workId: dbWork.id,
//       userId: like.user_id,
//       createdAt: new Date(like.created_at),
//       user: like.user ? transformDatabaseUser(like.user) : undefined
//     }));
    
//     // Transform comments (Note: Fixing the text/content inconsistency)
//     const comments: ArtworkComment[] = (dbWork.comments || []).map((comment: any) => ({
//       id: comment.id,
//       workId: dbWork.id,
//       userId: comment.user_id,
//       content: comment.text || comment.content || '', // Handle both field names
//       createdAt: new Date(comment.created_at),
//       user: comment.user ? transformDatabaseUser(comment.user) : undefined
//     }));
    
//     return {
//       ...baseWork,
//       artist,
//       likes,
//       comments,
//       userHasLiked: currentUserId 
//         ? likes.some(like => like.userId === currentUserId) 
//         : false
//     };
//   };

//   export const transformDatabaseWorkWithArtist = (dbWork: any): CreativeWork => {
//     const baseWork = transformDatabaseWork(dbWork);
    
//     return {
//       ...baseWork,
//       artist: dbWork.artist ? transformDatabaseUser(dbWork.artist) : undefined
//     };
//   };
  
//   // ==================== UTILITY FUNCTIONS ====================
  
export const createFallbackWork = (workId: string): CreativeWork => {
  return {
    id: workId,
    title: 'Unknown Artwork',
    description: 'This artwork could not be loaded',
    artistId: 'unknown',
    mediaType: 'digital_art',
    assetUrl: '',
    mediaConfig: {},
    derivationChain: [],
    metadata: {},
    tags: [],
    visibility: 'public',
    createdAt: new Date(),
    updatedAt: new Date(),
    likes: [],
    comments: [],
    userHasLiked: false,
    artist: {
      id: 'unknown',
      username: 'unknown',
      displayName: 'Unknown Artist',
      roles: [],
      joinedDate: new Date()
    }
  };
};
  
//   // Helper to extract basic info for lists
export const createWorkPreview = (work: CreativeWork) => {
  return {
    id: work.id,
    title: work.title,
    description: work.description,
    mediaType: work.mediaType,
    assetUrl: work.assetUrl,
    artist: work.artist,
    likeCount: work.likes?.length || 0,
    commentCount: work.comments?.length || 0
  };
};
  
//   // Type for work previews (useful for lists/feeds)
//   export type WorkPreview = ReturnType<typeof createWorkPreview>;
  
//   // Helper to validate work data before upload
  export const validateWorkForUpload = (work: any): { isValid: boolean; error?: string } => {
    if (!work.title?.trim()) {
      return { isValid: false, error: 'Title is required' };
    }
    
    if (!work.assetUrl) {
      return { isValid: false, error: 'Image is required' };
    }
    
    if (!work.mediaType) {
      return { isValid: false, error: 'Media type is required' };
    }
    
    // // Validate based on media type
    // switch (work.mediaType) {
    //   case 'line_art':
    //     if (!work.mediaConfig?.isColorable) {
    //       return { isValid: false, error: 'Line art must be colorable' };
    //     }
    //     break;
    //   case 'colored_art':
    //     if (work.mediaConfig?.isColorable !== false) {
    //       return { isValid: false, error: 'Colored art must not be colorable' };
    //     }
    //     break;
    // }
    
    return { isValid: true };
  };
  
//   // Note: Need to update your core.ts to add this type:
//   interface BasicMediaConfig {
//     isColorable: boolean;
//     complexity?: 'simple' | 'medium' | 'complex';
//     notes?: string;
//     // Consider using a more specific type instead of any
//     [key: string]: unknown; // Better than `any`
//   }