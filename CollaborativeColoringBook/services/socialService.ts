// services/socialService.ts
import { supabase } from '../lib/supabase';

export const socialService = {
  // Likes
  async toggleLike(workId: string, userId: string): Promise<boolean> {
    try {
      // Check if already liked
      const { data: existingLikes } = await supabase
        .from('likes')
        .select('id')
        .eq('work_id', workId)
        .eq('user_id', userId);

      if (existingLikes && existingLikes.length > 0) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('work_id', workId)
          .eq('user_id', userId);
        
        if (error) throw error;
        return false;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ work_id: workId, user_id: userId });
        
        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  async getLikeCount(workId: string): Promise<number> {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('work_id', workId);

    if (error) throw error;
    return count || 0;
  },

  async isLiked(workId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('work_id', workId)
      .eq('user_id', userId);

    if (error) throw error;
    return (data && data.length > 0) || false;
  },

  // Comments
  async getComments(workId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
      .eq('work_id', workId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return data?.map(comment => ({
      id: comment.id,
      userId: comment.user_id,
      userName: comment.user?.display_name || 'Unknown User',
      text: comment.text,
      createdAt: new Date(comment.created_at)
    })) || [];
  },

  async addComment(workId: string, userId: string, text: string) {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        work_id: workId,
        user_id: userId,
        text: text
      })
      .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      userName: data.user?.display_name || 'Unknown User',
      text: data.text,
      createdAt: new Date(data.created_at)
    };
  }
};