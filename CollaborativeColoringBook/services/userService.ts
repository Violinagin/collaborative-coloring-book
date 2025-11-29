// services/userService.ts - ULTRA SIMPLIFIED
import { supabase } from '../lib/supabase';
import { User } from '../types/core';

export const userService = {
  async getUser(userId: string): Promise<User> {
    console.log('🔍 [1] userService.getUser called with ID:', userId);
    
    try {
      // Ultra simple query - just get basic user info
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, bio, roles, created_at')
        .eq('id', userId)
        .maybeSingle();

      console.log('🔍 [2] Query result:', { data: !!data, error });

      if (error) {
        console.error('❌ Query error:', error);
        return this.createFallbackUser(userId);
      }

      if (!data) {
        console.log('👤 User not found in database');
        return this.createFallbackUser(userId);
      }

      console.log('✅ User found:', data.username);
      return this.transformDatabaseUser(data);
      
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      return this.createFallbackUser(userId);
    }
  },

  transformDatabaseUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      displayName: dbUser.display_name,
      avatarUrl: dbUser.avatar_url,
      bio: dbUser.bio || '',
      roles: dbUser.roles || ['supporter'],
      joinedDate: new Date(dbUser.created_at),
      uploadedArtworks: [],
      colorizedVersions: [],
      likedArtworks: [],
    };
  },

  createFallbackUser(userId: string): User {
    console.log('🔄 Creating fallback user for:', userId);
    return {
      id: userId,
      username: `user_${userId.slice(0, 8)}`,
      displayName: 'New User',
      avatarUrl: undefined,
      bio: 'Welcome to the coloring community!',
      roles: ['supporter'],
      joinedDate: new Date(),
      uploadedArtworks: [],
      colorizedVersions: [],
      likedArtworks: [],
    };
  },
};