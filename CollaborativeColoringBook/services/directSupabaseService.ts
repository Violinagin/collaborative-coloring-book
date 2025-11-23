// services/directSupabaseService.ts - FIXED AUTHENTICATION
import { Artwork, User, Comment } from '../types/User';
import { supabase } from '../lib/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Updated makeRequest to handle authentication more gracefully
const makeRequest = async (endpoint: string, options: RequestInit = {}, requireAuth: boolean = true) => {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  
  let authToken = supabaseKey; // Default to anon key
  
  if (requireAuth) {
    // Get the current session to include the auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      authToken = session.access_token;
      console.log('🔐 Using authenticated request');
    } else {
      console.warn('⚠️ No auth token available, falling back to anon key');
      // For development, we'll proceed with anon key but this might fail due to RLS
    }
  }

  const defaultHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
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
      const errorText = await response.text();
      console.error(`❌ Supabase request failed: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
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
      
      // For user reads, we can use public access since RLS allows SELECT
      const url = `${supabaseUrl}/rest/v1/users?select=*&id=eq.${userId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.log('❌ User not found in public.users table, creating fallback user');
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
      return this.createFallbackUser(userId);
    }
  },

  async verifyUserExists(userId: string): Promise<boolean> {
    try {
      const url = `${supabaseUrl}/rest/v1/users?select=id&id=eq.${userId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        return false;
      }
  
      const data = await response.json();
      return data && data.length > 0;
    } catch (error) {
      console.error('Error verifying user:', error);
      return false;
    }
  },

  async createUserProfileIfMissing(userId: string, email: string): Promise<void> {
    try {
      const userExists = await this.verifyUserExists(userId);
      
      if (!userExists) {
        console.log('🔄 Creating missing user profile...');
        await makeRequest('users', {
          method: 'POST',
          body: JSON.stringify({
            id: userId,
            username: `user_${userId.slice(0, 8)}`,
            display_name: email.split('@')[0],
            roles: ['supporter'],
          }),
        }, true);
        console.log('✅ User profile created');
      }
    } catch (error) {
      console.error('❌ Failed to create user profile:', error);
      throw error;
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
      try {
        console.log('🖼️ Loading artworks from Supabase...');
        
        // Simple public fetch without complex joins that might fail
        const url = `${supabaseUrl}/rest/v1/artworks?select=*`;
        
        const response = await fetch(url, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });
    
        if (!response.ok) {
          console.error('❌ Failed to fetch artworks:', response.status);
          return []; // Return empty array instead of throwing
        }
    
        const data = await response.json();
        console.log(`✅ Loaded ${data.length} artworks`);
        
        // Transform the data - handle missing user data gracefully
        return data.map((item: any) => ({
          id: item.id,
          title: item.title || 'Untitled',
          artist: 'Artist', // We'll fix this later with proper user data
          artistId: item.artist_id || '',
          lineArtUrl: item.line_art_url || '',
          colorizedVersions: [],
          likes: [],
          comments: [],
          createdAt: new Date(item.created_at),
          description: item.description || undefined,
        }));
      } catch (error) {
        console.error('❌ Error loading artworks:', error);
        return []; // Always return empty array, never throw
      }
    },

  async uploadArtwork(
    title: string, 
    description: string, 
    imageUri: string, 
    userId: string
  ): Promise<Artwork> {
    console.log('📤 Creating artwork record in database...');
    
    // Validate parameters
    if (!title || !imageUri || !userId) {
      throw new Error('Missing required fields for artwork upload');
    }
    try {
      console.log('🔍 Verifying user exists:', userId);
      const userExists = await this.verifyUserExists(userId);
      
      if (!userExists) {
        throw new Error('User profile not found. Please complete your profile setup.');
      }
    } catch (error) {
      console.error('❌ User verification failed:', error);
      throw new Error('Unable to verify user account. Please try logging out and back in.');
    }
  
    const data = await makeRequest('artworks', {
      method: 'POST',
      body: JSON.stringify({
        title: title,
        description: description || '',
        artist_id: userId,
        line_art_url: imageUri,
      }),
    }, true);
  
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
    try {
      // For public reads, use simpler approach
      const url = `${supabaseUrl}/rest/v1/comments?select=*,users!comments_user_id_fkey(display_name)&artwork_id=eq.${artworkId}&order=created_at.asc`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        userName: item.users?.display_name || 'Unknown User',
        text: item.text,
        createdAt: new Date(item.created_at),
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  async addComment(artworkId: string, userId: string, text: string): Promise<Comment> {
    try {
      const data = await makeRequest('comments', {
        method: 'POST',
        body: JSON.stringify({
          artwork_id: artworkId,
          user_id: userId,
          text: text,
        }),
      }, true); // requireAuth = true

      const newComment = data[0];
      return {
        id: newComment.id,
        userId: newComment.user_id,
        userName: 'You',
        text: newComment.text,
        createdAt: new Date(newComment.created_at),
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  async toggleLike(artworkId: string, userId: string): Promise<boolean> {
    try {
      // First check if already liked
      const existingLikes = await makeRequest(`likes?select=id&artwork_id=eq.${artworkId}&user_id=eq.${userId}`, {}, true);
      
      if (existingLikes.length > 0) {
        // Unlike
        await makeRequest(`likes?artwork_id=eq.${artworkId}&user_id=eq.${userId}`, {
          method: 'DELETE',
        }, true);
        return false;
      } else {
        // Like
        await makeRequest('likes', {
          method: 'POST',
          body: JSON.stringify({
            artwork_id: artworkId,
            user_id: userId,
          }),
        }, true);
        return true;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  async getLikeCount(artworkId: string): Promise<number> {
    try {
      // Public read
      const url = `${supabaseUrl}/rest/v1/likes?select=id&artwork_id=eq.${artworkId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch likes: ${response.status}`);
      }

      const data = await response.json();
      return data.length;
    } catch (error) {
      console.error('Error getting like count:', error);
      return 0;
    }
  },

  async isLiked(artworkId: string, userId: string): Promise<boolean> {
    try {
      const data = await makeRequest(`likes?select=id&artwork_id=eq.${artworkId}&user_id=eq.${userId}`, {}, true);
      return data.length > 0;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  },
};