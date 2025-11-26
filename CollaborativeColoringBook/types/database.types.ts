// types/database.types.ts
export interface DatabaseArtwork {
    id: string;
    title: string;
    description?: string;
    artist_id: string;      // Database uses snake_case
    line_art_url: string;   // Database uses snake_case  
    created_at: string;     // Database returns ISO string
    updated_at: string;
  }
  
  export interface FrontendArtwork {
    id: string;
    title: string;
    description?: string;
    artist: string;         // Display name (from joined user)
    artistId: string;       // User ID (camelCase version of artist_id)
    lineArtUrl: string;     // camelCase version
    //colorizedVersions: ColorizedVersion[];
    likes: string[];
    //comments: Comment[];
    createdAt: Date;        // Date object instead of string
  }