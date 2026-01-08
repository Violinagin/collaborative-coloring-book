// services/userService.ts - ULTRA SIMPLIFIED
import { getSupabase } from '../../lib/supabase';
import { User } from '../../types/core';
import { transformDatabaseUser, createFallbackUser } from '../../utils/transformers';

let getUserCallCount = 0;
const getUserCallers = new Map<string, number>();


export const userService = {
  async getUser(userId: string): Promise<User> {
    try {
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.log('🚫 Skipping getUser: invalid userId', userId);
        return createFallbackUser(userId || 'unknown');
      }
      // Ultra simple query - just get basic user info
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, bio, roles, created_at')
        .eq('id', userId)
        .maybeSingle();

      console.log('🔍 Query result:', { data: !!data, error });

      if (error) {
        console.error('❌ Query error:', error);
        return createFallbackUser(userId);
      }

      if (!data) {
        console.log('👤 User not found in database');
        return createFallbackUser(userId);
      }

      return transformDatabaseUser(data);
      
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      return createFallbackUser(userId);
    }
  },

  // Lean profile fetch (no social data)
  async getProfile(userId: string): Promise<User> {
    try {
      if (!userId) {
        return createFallbackUser('unknown');
      }

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, bio, roles, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ Profile fetch error:', error.message);
        return createFallbackUser(userId);
      }

      if (!data) {
        return createFallbackUser(userId);
      }

      return transformDatabaseUser(data);
    } catch (error) {
      console.warn('⚠️ Unexpected profile fetch error:', error);
      return createFallbackUser(userId);
    }
  },

  // Basic user info (for dropdowns, mentions, etc)
  async getBasicUser(userId: string): Promise<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  }> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return {
          id: userId,
          username: `user_${userId.slice(0, 8)}`,
          displayName: 'User',
          avatarUrl: undefined
        };
      }

      return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url
      };
    } catch (error) {
      console.warn('⚠️ Basic user fetch error:', error);
      return {
        id: userId,
        username: `user_${userId.slice(0, 8)}`,
        displayName: 'User',
        avatarUrl: undefined
      };
    }
  },

  // Update user profile
  async updateProfile(
    userId: string, 
    updates: { 
      displayName?: string; 
      username?: string; 
      bio?: string;
      avatarUrl?: string;
    }
  ): Promise<User> {
    try {
      const supabase = getSupabase();
      
      const updateData: any = {};
      if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
      if (updates.username !== undefined) updateData.username = updates.username.toLowerCase();
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating profile:', error);
        throw error;
      }

      return transformDatabaseUser(data);
    } catch (error) {
      console.error('❌ Unexpected error updating profile:', error);
      throw error;
    }
  },

  // Delete user account
  async deleteAccount(userId: string): Promise<void> {
    try {
      const supabase = getSupabase();
      
      // Note: This will cascade delete due to foreign key constraints
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('❌ Error deleting account:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Unexpected error deleting account:', error);
      throw error;
    }
  },

  // Check if username is available
  async checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      const supabase = getSupabase();
      
      let query = supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase());
      
      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('❌ Error checking username:', error);
        return false;
      }

      // If no data found, username is available
      return !data;
    } catch (error) {
      console.error('❌ Unexpected error checking username:', error);
      return false;
    }
  }
};
