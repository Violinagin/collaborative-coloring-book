// services/userService.ts - ULTRA SIMPLIFIED
import { supabase } from '../lib/supabase';
import { User } from '../types/core';
import { transformDatabaseUser, createFallbackUser } from '../utils/userTransformers';

export const userService = {
  async getUser(userId: string): Promise<User> {
    
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
};
