// types/database.ts
// Database column names (snake_case)
export interface DatabaseUser {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
    roles: string[];
    created_at: string;
  }
  
  export interface DatabaseWork {
    id: string;
    title: string;
    description?: string;
    asset_url: string;
    media_type: string;
    artist_id: string;
    original_work_id?: string;
    derivation_chain: string[];
    created_at: string;
    updated_at: string;
    media_config: Record<string, any>;
    metadata: Record<string, any>;
    tags: string[];
    visibility: string;
  }
  
  export interface DatabaseLike {
    id: string;
    work_id: string;
    user_id: string;
    created_at: string;
  }
  
  export interface DatabaseComment {
    id: string;
    work_id: string;
    user_id: string;
    text: string;  // Note: 'text' in DB, 'content' in your frontend
    created_at: string;
  }