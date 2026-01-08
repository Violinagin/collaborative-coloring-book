// types/core.ts
export type MediaType = 
  | 'line_art'        
  | 'colored_art'     
  | 'digital_art'     
  | 'writing'         
  | 'music'           
  | 'animation'       
  | 'comic'           
  | 'three_d';        

export type CollaborationType =
  | 'colorization'    
  | 'recolorization'  
  | 'illustration'    
  | 'scoring'         
  | 'adaptation'      
  | 'sequel'          
  | 'remix';          

  export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    roles: UserRole[];
    joinedDate: Date;
    // Content
    // Activity
    //recentActivity: Activity[];
  }

// Media-specific configurations
export interface LineArtConfig {
  isColorable: true;
  complexity: 'simple' | 'medium' | 'complex';
  suggestedPalette?: string[];
  layers?: Array<{
    id: string;
    name: string;
    assetUrl: string;
  }>;
}

export interface ColoredArtConfig {
  isColorable: false;
  originalLineArtId?: string;
  complexity: 'simple' | 'medium' | 'complex';
  technique: 'flat' | 'gradient' | 'textured';
}

export interface DigitalArtConfig {
  isColorable: false;
  // Digital art can have its own specific properties
  style?: 'painting' | 'vector' | 'pixel_art' | 'concept_art';
  software?: string[];
}

export interface WritingConfig {
  isColorable: false;
  wordCount: number;
  genre: string[];
  readingTime?: number;
}

export interface MusicConfig {
  isColorable: false;
  duration: number;
  genre: string[];
  bpm?: number;
}

export interface AnimationConfig {
  isColorable: false;
  duration: number;
  frameRate: number;
  technique: '2d' | '3d' | 'stop_motion';
}

export type MediaConfig = LineArtConfig | ColoredArtConfig | DigitalArtConfig | WritingConfig | MusicConfig | AnimationConfig;

export type UserRole = 'line_artist' | 'colorist' | 'supporter';


// Main work interface
export type CreativeWork = {
  id: string;
  title: string;
  description?: string;
  artistId: string;
  mediaType: MediaType;
  assetUrl: string;
  mediaConfig: BasicMediaConfig;
  originalWorkId?: string;
  derivationChain: string[];
  metadata: Record<string, any>;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  createdAt: Date;
  updatedAt: Date;
  likes?: Like[];
  comments?: Comment[];
  userHasLiked?: boolean;
  artist?: User;
  aspectRatio?: number;
}

export type UploadWork = {
  title: string;
  description?: string;
  assetUrl: string;
  originalWorkId?: string;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  mediaType: 'line_art' | 'colored_art' | 'digital_art';
  mediaConfig: BasicMediaConfig;
};

export const validateUploadWork = (work: UploadWork): { isValid: boolean; error?: string } => {
  // Runtime validation instead of compile-time
  if (work.mediaType === 'line_art') {
    const config = work.mediaConfig as LineArtConfig;
    if (!config.isColorable || !config.complexity) {
      return { isValid: false, error: 'Invalid line art config' };
    }
  }
  
  if (work.mediaType === 'colored_art') {
    const config = work.mediaConfig as ColoredArtConfig;
    if (!config.isColorable || !config.technique || !config.complexity) {
      return { isValid: false, error: 'Invalid colored art config' };
    }
  }
  
  if (work.mediaType === 'digital_art') {
    const config = work.mediaConfig as DigitalArtConfig;
    if (config.isColorable !== false) {
      return { isValid: false, error: 'Invalid digital art config' };
    }
  }
  
  return { isValid: true };
};

export type UploadableMediaType = 'line_art' | 'colored_art' | 'digital_art';

export interface Collaboration {
  id: string;
  originalWorkId: string;
  derivedWorkId: string;
  collaborationType: CollaborationType;
  context?: Record<string, any>;
  description?: string;
  attribution: string;
  createdAt: Date;
}

export interface WorkWithContext {
    work: CreativeWork;
    originalWork?: CreativeWork;
    collaborations: Collaboration[];
    artist?: User;
    remixes?: CreativeWork[]; // Works derived FROM this one
    siblings?: CreativeWork[]; // Other works from same original
}

export interface Like {
  id: string;
  workId: string;
  userId: string;
  createdAt: Date;
  user?: User;
}

export interface ArtworkComment {
  id: string;
  workId: string;
  userId: string;
  content: string;  // Note: Your socialService uses 'text', database uses 'text'
  createdAt: Date;
  user?: User;
}

export type Comment = ArtworkComment;

export const isLineArtConfig = (config: MediaConfig): config is LineArtConfig => {
    return (config as LineArtConfig).isColorable !== undefined;
  };
  
  export const isColoredArtConfig = (config: MediaConfig): config is ColoredArtConfig => {
    return (config as ColoredArtConfig).technique !== undefined;
  };
  
  export const isColorableWork = (work: CreativeWork): boolean => {
    return work.mediaType === 'line_art';
  };
  
  export const getColorableConfig = (work: CreativeWork): LineArtConfig | ColoredArtConfig | null => {
    if (work.mediaType === 'line_art') {
      return work.mediaConfig as LineArtConfig | ColoredArtConfig;
    }
    return null;
  };

  // Remix/Collaboration Types
export type RemixType = CollaborationType; // Reuse your existing type

export interface DerivativeWorkData extends UploadWork {
  originalWorkId: string;  // Required for derivatives
  remixType?: CollaborationType;
  attribution?: string;
};

export const extractUploadWork = (data: DerivativeWorkData): UploadWork => {
  const { remixType, attribution, ...uploadWork } = data;
  return uploadWork;
};

export type SimpleMediaConfig = Record<string, any>;

export interface BasicMediaConfig {
  // Optional basic fields
  notes?: string;
  // Allow any extra data
  [key: string]: any;
};

