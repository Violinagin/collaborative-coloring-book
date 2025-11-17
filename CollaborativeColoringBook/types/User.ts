export type UserRole = 'line_artist' | 'colorist' | 'supporter';

export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    roles: UserRole[];
    joinedDate: Date;
    
    // Stats
    followers: string[]; // user IDs
    following: string[]; // user IDs
    
    // Content
    uploadedArtworks: string[]; // artwork IDs
    colorizedVersions: string[]; // colorized version IDs
    likedArtworks: string[]; // artwork IDs

    // Activity (for notifications)
    recentActivity: Activity[];
  }
  
  export interface UserStats {
    artworksUploaded: number;
    colorizationsCreated: number;
    totalLikesReceived: number;
    totalCommentsReceived: number;
    followersCount: number;
    followingCount: number;
  }

export interface Activity {
    id: string;
    type: 'like' | 'comment' | 'colorization' | 'follow';
    userId: string;
    targetId: string; // artwork ID or user ID
    createdAt: Date;
  }

  export interface Artwork {
    id: string;
    title: string;
    artist: string;
    artistId: string;
    lineArtUrl: string;
    colorizedVersions: ColorizedVersion[];
    likes: string[];
    comments: Comment[];
    createdAt: Date;
  }
  
  export interface ColorizedVersion {
    id: string;
    colorist: string;
    coloristId: string;
    coloredImageUrl: string;
    createdAt: Date;
  }
  
  export interface Comment {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: Date;
  }