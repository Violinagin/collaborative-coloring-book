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

  export interface Artist {
    id: string;
    username: string;
    display_name: string;  // Database field name
    avatar_url?: string;   // Database field name
    bio?: string;
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
  isColorable: boolean;
  originalLineArtId?: string;
  technique: 'flat' | 'gradient' | 'textured';
}

export interface WritingConfig {
  wordCount: number;
  genre: string[];
  readingTime?: number;
}

export interface MusicConfig {
  duration: number;
  genre: string[];
  bpm?: number;
}

export interface AnimationConfig {
  duration: number;
  frameRate: number;
  technique: '2d' | '3d' | 'stop_motion';
}

export type MediaConfig = LineArtConfig | ColoredArtConfig | WritingConfig | MusicConfig | AnimationConfig;

// Main work interface
export interface CreativeWork {
  id: string;
  title: string;
  description?: string;
  artistId: string;
  mediaType: MediaType;
  assetUrl: string;
  mediaConfig: MediaConfig;
  originalWorkId?: string;
  derivationChain: string[];
  metadata: Record<string, any>;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  createdAt: Date;
  updatedAt: Date;
}

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
    artist: Artist;
}

export const isLineArtConfig = (config: MediaConfig): config is LineArtConfig => {
    return (config as LineArtConfig).isColorable !== undefined;
  };
  
  export const isColoredArtConfig = (config: MediaConfig): config is ColoredArtConfig => {
    return (config as ColoredArtConfig).technique !== undefined;
  };
  
  export const isColorableWork = (work: CreativeWork): boolean => {
    return work.mediaType === 'line_art' || work.mediaType === 'colored_art';
  };
  
  export const getColorableConfig = (work: CreativeWork): LineArtConfig | ColoredArtConfig | null => {
    if (work.mediaType === 'line_art' || work.mediaType === 'colored_art') {
      return work.mediaConfig as LineArtConfig | ColoredArtConfig;
    }
    return null;
  };