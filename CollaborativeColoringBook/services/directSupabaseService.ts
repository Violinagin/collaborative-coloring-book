// services/directSupabaseService.ts
import { Artwork, User, Comment } from '../types/User';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  
  const defaultHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  console.log('🔧 Direct fetch to:', endpoint);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`❌ Supabase request failed: ${response.status} ${response.statusText}`);
      throw new Error(`Supabase request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('❌ Network error in makeRequest:', error);
    throw error;
  }
};

export const directSupabaseService = {
  async getUser(userId: string): Promise<User> {
    try {
      console.log('🔍 Fetching user from Supabase with ID:', userId);
      const data = await makeRequest(`users?select=*&id=eq.${userId}`);
      
      if (!data || data.length === 0) {
        console.log('❌ User not found in public.users table, creating fallback user');
        // Create a fallback user if not found
        return this.createFallbackUser(userId);
      }

      const userData = data[0];
      console.log('✅ User data found:', userData);

      return {
        id: userData.id,
        username: userData.username || `user_${userId.slice(0, 8)}`,
        displayName: userData.display_name || 'Unknown User',
        avatarUrl: userData.avatar_url,
        bio: userData.bio || 'No bio yet.',
        roles: userData.roles || ['supporter'],
        joinedDate: new Date(userData.created_at),
        followers: userData.followers || [],
        following: userData.following || [],
        uploadedArtworks: userData.uploaded_artworks || [],
        colorizedVersions: userData.colorized_versions || [],
        likedArtworks: userData.liked_artworks || [],
        recentActivity: userData.recent_activity || [],
      };
    } catch (error) {
      console.error('💥 Error in getUser:', error);
      // Return fallback user on error
      return this.createFallbackUser(userId);
    }
  },
  createFallbackUser(userId: string): User {
    console.log('🔄 Creating fallback user for ID:', userId);
    return {
      id: userId,
      username: `user_${userId.slice(0, 8)}`,
      displayName: 'New User',
      avatarUrl: 'https://via.placeholder.com/80x80.png?text=👤',
      bio: 'Welcome to the coloring community!',
      roles: ['supporter'],
      joinedDate: new Date(),
      followers: [],
      following: [],
      uploadedArtworks: [],
      colorizedVersions: [],
      likedArtworks: [],
      recentActivity: [],
    };
  },

  async getArtworks(): Promise<Artwork[]> {
    const data = await makeRequest(`artworks?select=*,users!artworks_artist_id_fkey(id,username,display_name,avatar_url)`);
    
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      artist: item.users?.display_name || 'Unknown Artist',
      artistId: item.users?.id || '',
      lineArtUrl: item.line_art_url,
      colorizedVersions: [],
      likes: [],
      comments: [],
      createdAt: new Date(item.created_at),
      description: item.description || undefined,
    }));
  },

  async uploadArtwork(
    title: string, 
    description: string, 
    imageUri: string, 
    userId: string
  ): Promise<Artwork> {
    console.log('📤 Uploading artwork via direct service...');
    
    // For now, we'll create the artwork record without image upload
    // In a real app, you'd upload the image to Supabase Storage first
    const data = await makeRequest('artworks', {
      method: 'POST',
      body: JSON.stringify({
        title: title,
        description: description,
        artist_id: userId,
        line_art_url: imageUri, // Using the local URI for now
      }),
    });

    const newArtwork = data[0];
    
    // Get user data for the response
    const userData = await this.getUser(userId);
    
    return {
      id: newArtwork.id,
      title: newArtwork.title,
      artist: userData.displayName,
      artistId: userData.id,
      lineArtUrl: newArtwork.line_art_url,
      colorizedVersions: [],
      likes: [],
      comments: [],
      createdAt: new Date(newArtwork.created_at),
      description: newArtwork.description || undefined,
    };
  },

  async getComments(artworkId: string): Promise<Comment[]> {
    const data = await makeRequest(`comments?select=*,users!comments_user_id_fkey(display_name)&artwork_id=eq.${artworkId}&order=created_at.asc`);
    
    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      userName: item.users?.display_name || 'Unknown User',
      text: item.text,
      createdAt: new Date(item.created_at),
    }));
  },

  async addComment(artworkId: string, userId: string, text: string): Promise<Comment> {
    const data = await makeRequest('comments', {
      method: 'POST',
      body: JSON.stringify({
        artwork_id: artworkId,
        user_id: userId,
        text: text,
      }),
    });

    const newComment = data[0];
    return {
      id: newComment.id,
      userId: newComment.user_id,
      userName: 'You', // We'll update this after fetching user data
      text: newComment.text,
      createdAt: new Date(newComment.created_at),
    };
  },

  async toggleLike(artworkId: string, userId: string): Promise<boolean> {
    // First check if already liked
    const existingLikes = await makeRequest(`likes?select=id&artwork_id=eq.${artworkId}&user_id=eq.${userId}`);
    
    if (existingLikes.length > 0) {
      // Unlike
      await makeRequest(`likes?artwork_id=eq.${artworkId}&user_id=eq.${userId}`, {
        method: 'DELETE',
      });
      return false;
    } else {
      // Like
      await makeRequest('likes', {
        method: 'POST',
        body: JSON.stringify({
          artwork_id: artworkId,
          user_id: userId,
        }),
      });
      return true;
    }
  },

  async getLikeCount(artworkId: string): Promise<number> {
    const data = await makeRequest(`likes?select=id&artwork_id=eq.${artworkId}`);
    return data.length;
  },

  async isLiked(artworkId: string, userId: string): Promise<boolean> {
    const data = await makeRequest(`likes?select=id&artwork_id=eq.${artworkId}&user_id=eq.${userId}`);
    return data.length > 0;
  },
};