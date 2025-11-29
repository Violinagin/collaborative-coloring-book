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
  },

  // Follow/Unfollow methods
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      return !!data; // Returns true if follow relationship exists
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  },
  async getFollowerCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId); // People who follow this user

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting follower count:', error);
      return 0;
    }
  },

  async getFollowingCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId); // People this user follows

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting following count:', error);
      return 0;
    }
  },
  // Bonus: Get follower and following lists
  async getFollowers(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (error) throw error;
      return data.map(item => item.follower_id);
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  },

  async getFollowing(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) throw error;
      return data.map(item => item.following_id);
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  },

  // Bonus: Get mutual follows
  async getMutualFollows(userId1: string, userId2: string): Promise<boolean> {
    try {
      const [user1FollowsUser2, user2FollowsUser1] = await Promise.all([
        this.isFollowing(userId1, userId2),
        this.isFollowing(userId2, userId1)
      ]);
      
      return user1FollowsUser2 && user2FollowsUser1;
    } catch (error) {
      console.error('Error checking mutual follows:', error);
      return false;
    }
  }
};