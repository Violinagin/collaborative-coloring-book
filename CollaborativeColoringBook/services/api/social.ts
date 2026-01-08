// services/api/social.ts
import { getSupabase } from '../../lib/supabase';
import { 
  ApiResponse, 
  DatabaseLike, 
  DatabaseComment,
  ArtworkComment 
} from '../../types';
import { 
  transformDatabaseComment, 
  transformDatabaseLike,
  groupLikesByWorkId 
} from '../../utils/transformers';

// ==================== SAFE QUERY WRAPPER ====================
async function safeSocialQuery<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<ApiResponse<T>> {
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
      const supabase = getSupabase();
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
      const supabase = getSupabase();
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
      const supabase = getSupabase();
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
  
  async getComments(workId: string): Promise<ArtworkComment[]> {
    const result = await safeSocialQuery(async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, bio, roles, created_at)
        `)
        .eq('work_id', workId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(transformDatabaseComment);
    }, 'getComments');
    
    return result.data ?? [];
  },
  
  async addComment(workId: string, content: string): Promise<ApiResponse<ArtworkComment>> {
    return safeSocialQuery(async () => {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Not authenticated');
      }
      
      // Validation
      const trimmedText = content.trim();
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
          text: trimmedText  // Database uses 'text' column
        })
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, bio, roles, created_at)
        `)
        .single();
      
      if (error) throw error;
      
      // Use transformer
      return transformDatabaseComment(data);
    }, 'addComment');
  },
  
  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    return safeSocialQuery(async () => {
      const supabase = getSupabase();
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
  
  async followUser(followerId: string, followingId: string): Promise<ApiResponse<boolean>> {
    return safeSocialQuery(async () => {
      if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
      }
      const supabase = getSupabase();
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
  
  async unfollowUser(followerId: string, followingId: string): Promise<ApiResponse<boolean>> {
    return safeSocialQuery(async () => {
      const supabase = getSupabase();
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
      const supabase = getSupabase();
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
      const supabase = getSupabase();
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
      const supabase = getSupabase();
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      if (error) throw error;
      return count ?? 0;
    }, 'getFollowingCount');
    
    return result.data ?? 0;
  },

  // ✅ Batch get like counts for multiple works
async batchGetLikeCounts(workIds: string[]): Promise<Record<string, number>> {
  if (workIds.length === 0) return {};
  
  const result = await safeSocialQuery(async () => {
    const supabase = getSupabase();
    
    // Get all likes for these works in ONE query
    const { data, error } = await supabase
      .from('likes')
      .select('work_id')
      .in('work_id', workIds);
    
    if (error) throw error;
    
    // Count likes per work
    const counts: Record<string, number> = {};
    (data as DatabaseLike[] || []).forEach((like: DatabaseLike) => {
      counts[like.work_id] = (counts[like.work_id] || 0) + 1;
    });
    
    // Ensure all workIds are in the result (even with 0 likes)
    workIds.forEach(id => {
      if (!(id in counts)) {
        counts[id] = 0;
      }
    });
    
    return counts;
  }, 'batchGetLikeCounts');
  
  return result.data || {};
},

async batchGetLikes(workIds: string[]): Promise<Record<string, any[]>> {
  if (workIds.length === 0) return {};
  
  const result = await safeSocialQuery(async () => {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('likes')
      .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
      .in('work_id', workIds);
    
    if (error) throw error;
    
    const grouped = groupLikesByWorkId(data as DatabaseLike[] || []);
    
    // Transform each group
    const transformed: Record<string, any[]> = {};
    Object.keys(grouped).forEach(workId => {
      transformed[workId] = grouped[workId].map(transformDatabaseLike);
    });
    
    return transformed;
  }, 'batchGetLikes');
  
  return result.data || {};
},

// ✅ Batch get comments with user data
async batchGetComments(workIds: string[]): Promise<Record<string, any[]>> {
  if (workIds.length === 0) return {};
  
  const result = await safeSocialQuery(async () => {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
      .in('work_id', workIds);
    
    if (error) throw error;
    
    const grouped: Record<string, any[]> = {};
    (data || []).forEach((comment: any) => {
      if (!grouped[comment.work_id]) {
        grouped[comment.work_id] = [];
      }
      grouped[comment.work_id].push(comment);
    });
    
    return grouped;
  }, 'batchGetComments');
  
  return result.data || {};
},

// ✅ Batch get comment counts for multiple works
async batchGetCommentCounts(workIds: string[]): Promise<Record<string, number>> {
  if (workIds.length === 0) return {};
  
  const result = await safeSocialQuery(async () => {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('comments')
      .select('work_id')
      .in('work_id', workIds);
    
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    (data as DatabaseComment[] || []).forEach((comment: DatabaseComment) => {
      counts[comment.work_id] = (counts[comment.work_id] || 0) + 1;
    });
    
    // Ensure all workIds are in the result
    workIds.forEach(id => {
      if (!(id in counts)) {
        counts[id] = 0;
      }
    });
    
    return counts;
  }, 'batchGetCommentCounts');
  
  return result.data || {};
},

// ✅ Batch check if user liked multiple works
async batchIsLiked(workIds: string[], userId?: string): Promise<Record<string, boolean>> {
  // Always initialize with all false
  const initialResults: Record<string, boolean> = {};
  workIds.forEach(id => initialResults[id] = false);
  
  if (workIds.length === 0 || !userId) {
    return initialResults; // Already all false
  }
  
  const result = await safeSocialQuery(async () => {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('likes')
      .select('work_id')
      .in('work_id', workIds)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Create a copy to avoid mutation issues
    const results = { ...initialResults };
    
    // Mark liked works as true
    (data || []).forEach((like: any) => {
      if (like.work_id in results) {
        results[like.work_id] = true;
      }
    });
    
    return results;
  }, 'batchIsLiked');
  
  return result.data || initialResults; // Return fallback results if query fails
},

};
