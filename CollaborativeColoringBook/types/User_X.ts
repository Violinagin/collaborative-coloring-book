export type UserRole = 'line_artist' | 'colorist' | 'supporter';

export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    roles: UserRole[];
    joinedDate: Date;
    
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
    lineArtUrl: string; // This could be either original OR colored
    originalLineArtUrl?: string;
    colorizedVersions: ColorizedVersion[];
    likes: string[];
    comments: Comment[];
    createdAt: Date;
    description?: string;
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

  export const transformDatabaseUser = (dbUser: any): User => ({
    id: dbUser.id,
    username: dbUser.username,
    displayName: dbUser.display_name,  // Map from database
    avatarUrl: dbUser.avatar_url,      // Map from database
    bio: dbUser.bio,
    roles: dbUser.roles || ['supporter'],
    joinedDate: new Date(dbUser.joined_date),
    uploadedArtworks: dbUser.uploaded_artworks || [],
    colorizedVersions: dbUser.colorized_versions || [],
    likedArtworks: dbUser.liked_artworks || [],
    recentActivity: dbUser.recent_activity || []
  });