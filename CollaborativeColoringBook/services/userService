// services/userService.ts
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types/core';

export const userService = {
  // Get user by ID with full profile data
  async getUser(userId: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          uploaded_works:works!works_artist_id_fkey(
            id,
            title,
            asset_url,
            media_type,
            visibility,
            created_at
          ),
          colorized_works:works!works_artist_id_fkey(
            id,
            title,
            asset_url,
            media_type,
            original_work_id,
            visibility,
            created_at
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return this.createFallbackUser(userId);
      }

      if (!data) {
        console.log('User not found, creating fallback');
        return this.createFallbackUser(userId);
      }

      return this.transformDatabaseUser(data);
    } catch (error) {
      console.error('Error in getUser:', error);
      return this.createFallbackUser(userId);
    }
  },

  // Transform database user to frontend User type
  transformDatabaseUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      displayName: dbUser.display_name,
      avatarUrl: dbUser.avatar_url,
      bio: dbUser.bio || '',
      roles: dbUser.roles || ['supporter'],
      joinedDate: new Date(dbUser.joined_date),
      uploadedArtworks: dbUser.uploaded_works?.map((work: any) => work.id) || [],
      colorizedVersions: dbUser.colorized_works
        ?.filter((work: any) => work.original_work_id) // Only derivatives
        .map((work: any) => work.id) || [],
      likedArtworks: dbUser.liked_artworks || [],
    };
  },

  // Create fallback user for error handling
  createFallbackUser(userId: string): User {
    console.log('Creating fallback user for:', userId);
    return {
      id: userId,
      username: `user_${userId.slice(0, 8)}`,
      displayName: 'New User',
      avatarUrl: '👤',
      bio: 'Welcome to the coloring community!',
      roles: ['supporter'],
      joinedDate: new Date(),
      uploadedArtworks: [],
      colorizedVersions: [],
      likedArtworks: [],
    };
  },

  // Update user profile
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const updateData: any = {};
      
      if (updates.displayName !== undefined) {
        updateData.display_name = updates.displayName;
      }
      if (updates.avatarUrl !== undefined) {
        updateData.avatar_url = updates.avatarUrl;
      }
      if (updates.bio !== undefined) {
        updateData.bio = updates.bio;
      }
      if (updates.roles !== undefined) {
        updateData.roles = updates.roles;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return this.transformDatabaseUser(data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Search users by username or display name
  async searchUsers(query: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      return data.map(this.transformDatabaseUser);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  // Get user stats (artworks uploaded, colorizations, etc.)
  async getUserStats(userId: string) {
    try {
      // Get uploaded works count
      const { count: uploadedCount, error: uploadedError } = await supabase
        .from('works')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', userId)
        .eq('visibility', 'public');

      if (uploadedError) throw uploadedError;

      // Get colorized works count (derivatives)
      const { count: colorizedCount, error: colorizedError } = await supabase
        .from('works')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', userId)
        .neq('original_work_id', null)
        .eq('visibility', 'public');

      if (colorizedError) throw colorizedError;

      // Calculate total likes received
      const { data: userWorks, error: worksError } = await supabase
        .from('works')
        .select('id')
        .eq('artist_id', userId)
        .eq('visibility', 'public');

      if (worksError) throw worksError;

      let totalLikesReceived = 0;
      
      // Count likes on each of the user's works
      if (userWorks && userWorks.length > 0) {
        const workIds = userWorks.map(work => work.id);
        const { count: totalLikes, error: likesError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('work_id', workIds);

        if (!likesError) {
          totalLikesReceived = totalLikes || 0;
        }
      }

        // Get follower counts
       // ✅ Use direct Supabase calls for follower counts
      const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

      return {
        artworksUploaded: uploadedCount || 0,
        colorizationsCreated: colorizedCount || 0,
        totalLikesReceived: totalLikesReceived,
        followersCount: 0, // TODO: Implement with socialService
        followingCount: 0,  // TODO: Implement with socialService
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        artworksUploaded: 0,
        colorizationsCreated: 0,
        totalLikesReceived: 0,
        followersCount: 0,
        followingCount: 0,
      };
    }
  }
};