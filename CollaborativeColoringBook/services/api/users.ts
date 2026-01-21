// services/userService.ts - ULTRA SIMPLIFIED
import { getSupabase } from '../../lib/supabase';
import { User } from '../../types/core';
import { transformDatabaseUser, createFallbackUser } from '../../utils/transformers';

let getUserCalls = 0;
const getUserCallers = new Map<string, number>();
let callCounter = 0;
const caller = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
console.log(`🔍 getUser called from: ${caller}`, {  });
const userCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds
const activeProfileRequests = new Map<string, Promise<User>>();

export const userService = {
  async getUser(userId: string): Promise<User> {
    const callId = ++getUserCalls;
    
    // Get the full stack trace
    const stack = new Error().stack || '';
    
    // Look for React component names in the stack
    const stackLines = stack.split('\n');
    const callerInfo = stackLines.slice(2, 6).join(' | '); // Skip first 2 lines
    
    console.log(`🔍 [${callId}] getUser called by:`, {
      userId,
      timestamp: new Date().toISOString(),
      caller: callerInfo
    });
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 Using cached user data');
      return cached.user;
    }
    
    const callId2 = ++callCounter;
    console.log(`🔍 [${callId2}] getUser START - userId: ${userId}`);
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


      if (data) {
        const transformed = transformDatabaseUser(data);
        // Cache it
        userCache.set(userId, { 
          user: transformed, 
          timestamp: Date.now() 
        });
        return transformed;
      }
      if (error) {
        console.error('❌ Query error:', error);
        return createFallbackUser(userId);
      }

      if (!data) {
        console.log('👤 User not found in database');
        return createFallbackUser(userId);
      }

      return transformDatabaseUser(data);
      console.log(`🔍 [${callId}] getUser END - userId: ${userId}`);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      return createFallbackUser(userId);
    }
  },
  
  // Clear cache when user updates their profile
  clearUserCache(userId: string) {
    userCache.delete(userId);
  },

  // Lean profile fetch (no social data)
  async getProfile(userId: string): Promise<User> {
    // ⭐ Check for active request
    if (activeProfileRequests.has(userId)) {
      console.log('⏳ Returning existing getProfile promise');
      return activeProfileRequests.get(userId)!;
    }
    
    console.log(`🔍 Starting new getProfile for: ${userId}`);
    
    // Create the request
    const requestPromise = (async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url, bio, roles, created_at')
          .eq('id', userId)
          .maybeSingle();

        console.log('🔍 getProfile query complete:', { hasData: !!data });
        
        if (error || !data) {
          return createFallbackUser(userId);
        }
        
        return transformDatabaseUser(data);
      } catch (error) {
        console.error('❌ getProfile error:', error);
        return createFallbackUser(userId);
      } finally {
        // Clean up
        activeProfileRequests.delete(userId);
      }
    })();
    
    // Store the promise
    activeProfileRequests.set(userId, requestPromise);
    
    return requestPromise;
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
