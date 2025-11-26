// types/index.ts
export interface DatabaseArtwork {
    id: string;
    title: string;
    description?: string;
    artist_id: string;
    line_art_url: string;
    created_at: string;
    updated_at: string;
    users?: { display_name: string }; // Joined user data
  }
  
  export interface Artwork {
    id: string;
    title: string;
    description?: string;
    artist: string; // Display name from joined user
    artistId: string; // User ID
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