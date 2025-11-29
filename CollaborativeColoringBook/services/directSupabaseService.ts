// services/directSupabaseService.ts - FIXED AUTHENTICATION
import { CreativeWork, User, Comment } from '../types/core';
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

      return {
        id: userData.id,
        username: userData.username || `user_${userId.slice(0, 8)}`,
        displayName: userData.display_name || 'Unknown User',
        avatarUrl: userData.avatar_url,
        bio: userData.bio || 'No bio yet.',
        roles: userData.roles || ['supporter'],
        joinedDate: new Date(userData.created_at),
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
      uploadedArtworks: [],
      colorizedVersions: [],
      likedArtworks: [],
      recentActivity: [],
    };
  },

  async getArtworks(): Promise<CreativeWork[]> {
      try {
        
        const url = `${supabaseUrl}/rest/v1/works?select=*,users!works_artist_id_fkey(display_name)`;
        
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
        
        // Transform the data - handle missing user data gracefully
        const artworksWithColorizations = await Promise.all(
          data.map(async (item: any) => {
            const colorizations = await this.getArtworkColorizations(item.id);
            
            return {
              id: item.id,
              title: item.title,
              artist: item.users?.display_name || 'Unknown Artist',
              artistId: item.artist_id,
              lineArtUrl: item.line_art_url,
              colorizedVersions: colorizations.map((color: any) => ({
                id: color.id,
                colorist: color.users?.display_name || 'Unknown Colorist',
                coloristId: color.colorist_id,
                coloredImageUrl: color.colored_image_url,
                createdAt: new Date(color.created_at),
              })),
              likes: [],
              comments: [],
              createdAt: new Date(item.created_at),
              description: item.description || undefined,
            };
          })
        );
        
        return artworksWithColorizations;
      } catch (error) {
        console.error('❌ Error loading artworks:', error);
        return [];
      }
    },

    async uploadArtworkImage(fileUri: string, userId: string): Promise<string> {
      try {
        console.log('📤 Uploading image to storage...');
        
        // Convert React Native file URI to blob
        const response = await fetch(fileUri);
        const blob = await response.blob();

        let fileExt = 'jpg'; // default fallback
        
        // Try to get extension from original URI first
    const originalUri = fileUri; // You might need to pass the original image picker URI separately
    const uriParts = originalUri.split('.');
    if (uriParts.length > 1) {
      const potentialExt = uriParts.pop()?.toLowerCase();
      // Only use if it's a common image extension
      if (potentialExt && ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(potentialExt)) {
        fileExt = potentialExt;
      }
    }
    
    // Alternative: detect from blob type
    if (blob.type) {
      const typeParts = blob.type.split('/');
      if (typeParts.length > 1 && typeParts[1] !== 'octet-stream') {
        fileExt = typeParts[1];
      }
    }
    
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    console.log('📁 Uploading to storage:', fileName, 'Type:', blob.type);
        
        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from('artworks')
          .upload(fileName, blob, {
            contentType: `image/${fileExt}`,
            upsert: false
          });
        
        if (error) {
          console.error('❌ Storage upload error:', error);
          throw error;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
      .from('artworks')
      .getPublicUrl(fileName);
        
      console.log('✅ Image uploaded to:', urlData.publicUrl);
      return urlData.publicUrl;
        
      } catch (error) {
        console.error('💥 Image upload failed:', error);
        throw error;
      }
    },

  async getUserColorizations(userId: string): Promise<CreativeWork[]> {
    try {
      
      // Get colorized versions by this user
      const url = `${supabaseUrl}/rest/v1/colorized_versions?select=*,artworks(*,users!artworks_artist_id_fkey(display_name))&colorist_id=eq.${userId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch colorizations: ${response.status}`);
      }
  
      const data = await response.json();
      
      // Transform the data
      return data.map((item: any) => {
        return {
          id: item.id, // Use colorization ID
          title: `${item.artworks.title} (Colored)`,
          artist: item.artworks.users?.display_name || 'Unknown Artist',
          artistId: item.artworks.artist_id,
          lineArtUrl: item.colored_image_url, // This should be the SVG URL
          originalLineArtUrl: item.artworks.line_art_url,
          colorizedVersions: [],
          likes: [],
          comments: [],
          createdAt: new Date(item.created_at),
          description: `Colored version of "${item.artworks.title}"`,
        };
      });
    } catch (error) {
      console.error('Error loading user colorizations:', error);
      return [];
    }
  },
  
  async getArtworkColorizations(artworkId: string): Promise<any[]> {
    try {
      const url = `${supabaseUrl}/rest/v1/colorized_versions?select=*,users!colorized_versions_colorist_id_fkey(display_name)&artwork_id=eq.${artworkId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch artwork colorizations: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error loading artwork colorizations:', error);
      return [];
    }
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
      console.error('❌ Error checking like status:', error);
      return false;
    }
  },
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      
      // First, add to follows table
      const followData = await makeRequest('follows', {
        method: 'POST',
        body: JSON.stringify({
          follower_id: followerId,
          following_id: followingId,
        }),
      }, true);

      // Then update the user arrays (optional - for performance)
      // This part might be handled by database triggers, but we'll do it manually for now
      await this.updateUserFollowArrays(followerId, followingId, 'follow');

      return true;
    } catch (error) {
      console.error('❌ Error following user:', error);
      throw error;
    }
  },

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      console.log(`🔗 User ${followerId} unfollowing ${followingId}`);
      
      // First, remove from follows table
      await makeRequest(`follows?follower_id=eq.${followerId}&following_id=eq.${followingId}`, {
        method: 'DELETE',
      }, true);

      console.log('✅ Unfollow removed from follows table');

      // Then update the user arrays
      await this.updateUserFollowArrays(followerId, followingId, 'unfollow');

      return true;
    } catch (error) {
      console.error('❌ Error unfollowing user:', error);
      throw error;
    }
  },

  async updateUserFollowArrays(followerId: string, followingId: string, action: 'follow' | 'unfollow') {
    try {
      // For now, we'll rely on the follows table for counts
      // In a production app, you might want to update the arrays here
      // or create database triggers to keep them in sync
      console.log(`🔄 Follow arrays update would happen here for ${action}`);
    } catch (error) {
      console.error('Error updating follow arrays:', error);
      // Don't throw - this is secondary to the main follow operation
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const url = `${supabaseUrl}/rest/v1/follows?select=id&follower_id=eq.${followerId}&following_id=eq.${followingId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check follow status: ${response.status}`);
      }

      const data = await response.json();
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  },

  async getFollowerCount(userId: string): Promise<number> {
    try {
      // Use the follows table instead of the array for accurate counts
      const url = `${supabaseUrl}/rest/v1/follows?select=id&following_id=eq.${userId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get follower count: ${response.status}`);
      }

      const data = await response.json();
      return data.length;
    } catch (error) {
      console.error('Error getting follower count:', error);
      return 0;
    }
  },

  async getFollowingCount(userId: string): Promise<number> {
    try {
      const url = `${supabaseUrl}/rest/v1/follows?select=id&follower_id=eq.${userId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get following count: ${response.status}`);
      }

      const data = await response.json();
      return data.length;
    } catch (error) {
      console.error('Error getting following count:', error);
      return 0;
    }
  },

  async getUserFollowers(userId: string): Promise<string[]> {
    try {
      const url = `${supabaseUrl}/rest/v1/follows?select=follower_id&following_id=eq.${userId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get followers: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => item.follower_id);
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  },
};