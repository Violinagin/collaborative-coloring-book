// services/socialService.ts
import { supabase } from '../lib/supabase';

// ==================== TYPES ====================
export type SocialResult<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

// ==================== SAFE QUERY WRAPPER ====================
async function safeSocialQuery<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<SocialResult<T>> {
  try {
    const data = await operation();
    return { data, error: null, success: true };
  } catch (err: any) {
    console.error(`❌ [Social:${operationName}] failed:`, err.message || err);
    
    // User-friendly error messages
    let errorMessage = 'Action failed. Please try again.';
    if (err.message?.includes('Network') || err.message?.includes('internet')) {
      errorMessage = 'No internet connection';
    } else if (err.message?.includes('auth') || err.message?.includes('login')) {
      errorMessage = 'Please log in to continue';
    }
    
    return { 
      data: null, 
      error: errorMessage, 
      success: false 
    };
  }
}

// ==================== MAIN SERVICE ====================
export const socialService = {
  
  // ✅ LIKES ===========================================
  
  async toggleLike(workId: string, userId: string): Promise<boolean> {
    const result = await safeSocialQuery(async () => {
      // Check if already liked
      const { data: existing } = await supabase
        .from('likes')
        .select('id')
        .eq('work_id', workId)
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single
      
      if (existing) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existing.id);
        
        if (error) throw error;
        return false; // Now unliked
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            work_id: workId,
            user_id: userId
          });
        
        if (error) throw error;
        return true; // Now liked
      }
    }, 'toggleLike');
    
    // Return current state on failure
    return result.data ?? false;
  },
  
  async getLikeCount(workId: string): Promise<number> {
    const result = await safeSocialQuery(async () => {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('work_id', workId);
      
      if (error) throw error;
      return count ?? 0;
    }, 'getLikeCount');
    
    return result.data ?? 0;
  },
  
  async isLiked(workId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;
    
    const result = await safeSocialQuery(async () => {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('work_id', workId)
        .eq('user_id', userId)
        .maybeSingle(); // Safer than single
      
      if (error) throw error;
      return !!data; // true if found
    }, 'isLiked');
    
    return result.data ?? false;
  },
  
  // ✅ COMMENTS ========================================
  
  async getComments(workId: string): Promise<any[]> {
    const result = await safeSocialQuery(async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url)
        `)
        .eq('work_id', workId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Transform to your expected format
      return (data || []).map((comment: any) => ({
        id: comment.id,
        workId: comment.work_id,
        userId: comment.user_id,
        text: comment.text,
        createdAt: new Date(comment.created_at),
        userName: comment.user?.display_name || comment.user?.username || 'Anonymous',
        user: comment.user ? {
          id: comment.user.id,
          username: comment.user.username,
          displayName: comment.user.display_name,
          avatarUrl: comment.user.avatar_url
        } : undefined
      }));
    }, 'getComments');
    
    return result.data ?? [];
  },
  
  async addComment(workId: string, text: string): Promise<SocialResult<any>> {
    return safeSocialQuery(async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Not authenticated');
      }
      
      // Validation
      const trimmedText = text.trim();
      if (!trimmedText) {
        throw new Error('Comment cannot be empty');
      }
      if (trimmedText.length > 500) {
        throw new Error('Comment is too long (max 500 characters)');
      }
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          work_id: workId,
          user_id: userData.user.id,
          text: trimmedText
        })
        .select(`
          *,
          user:users(id, username, display_name, avatar_url)
        `)
        .single();
      
      if (error) throw error;
      
      // Return in your expected format
      return {
        id: data.id,
        workId: data.work_id,
        userId: data.user_id,
        text: data.text,
        createdAt: new Date(data.created_at),
        userName: data.user?.display_name || data.user?.username || 'Anonymous',
        user: data.user ? {
          id: data.user.id,
          username: data.user.username,
          displayName: data.user.display_name,
          avatarUrl: data.user.avatar_url
        } : undefined
      };
    }, 'addComment');
  },
  
  async deleteComment(commentId: string): Promise<SocialResult<void>> {
    return safeSocialQuery(async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Not authenticated');
      }
      
      // Verify ownership first
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();
      
      if (fetchError) throw fetchError;
      if (comment.user_id !== userData.user.id) {
        throw new Error('You can only delete your own comments');
      }
      
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (deleteError) throw deleteError;
    }, 'deleteComment');
  },
  
  // ✅ FOLLOWS =========================================
  
  async followUser(followerId: string, followingId: string): Promise<SocialResult<boolean>> {
    return safeSocialQuery(async () => {
      if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
      }
      
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        });
      
      if (error) {
        // If already following, that's okay
        if (error.code === '23505') {
          return true;
        }
        throw error;
      }
      
      return true;
    }, 'followUser');
  },
  
  async unfollowUser(followerId: string, followingId: string): Promise<SocialResult<boolean>> {
    return safeSocialQuery(async () => {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
      
      if (error) throw error;
      return true;
    }, 'unfollowUser');
  },
  
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await safeSocialQuery(async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    }, 'isFollowing');
    
    return result.data ?? false;
  },
  
  async getFollowerCount(userId: string): Promise<number> {
    const result = await safeSocialQuery(async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      
      if (error) throw error;
      return count ?? 0;
    }, 'getFollowerCount');
    
    return result.data ?? 0;
  },
  
  async getFollowingCount(userId: string): Promise<number> {
    const result = await safeSocialQuery(async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      if (error) throw error;
      return count ?? 0;
    }, 'getFollowingCount');
    
    return result.data ?? 0;
  }
};