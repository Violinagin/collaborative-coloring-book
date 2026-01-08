// hooks/useArtworkDetail.ts - FINAL FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { worksService } from '../services/api/works';
import { useArtworkComments } from './useArtworkComments';
import { useArtworkLikes } from './useArtworkLikes';
import { User, ArtworkComment } from 'types/core';

export const useArtworkDetail = (workId: string, currentUser?: User | null) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use specialized hooks for sub-features
  const commentsHook = useArtworkComments(
    workId,          
    currentUser,    
    []               
  );
  
  const likesHook = useArtworkLikes(
    workId,
    detail?.userHasLiked || false,
    detail?.likeCount || 0,
    currentUser  // ✅ Pass currentUser
  );
  
  const loadDetail = useCallback(async (forceRefresh = false) => {
    if (!workId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await worksService.getArtworkDetail(workId);
      setDetail(result);

      const validComments = result.comments.map(comment => ({
        ...comment,
        // Ensure 'content' field exists (not 'text')
        content: (comment as any).content || (comment as any).text || ''
      })) as ArtworkComment[];  // ✅ Fixed type
      
      // Update sub-hooks with fresh data
      commentsHook.setComments(validComments);
      likesHook.setUserHasLiked(result.userHasLiked || false);
      likesHook.setLikeCount(result.likeCount || 0);

    } catch (err: any) {
      setError(err.message || 'Failed to load artwork');
      console.error('useArtworkDetail error:', err);
    } finally {
      setLoading(false);
    }
  }, [workId]);
  
  const refresh = useCallback(() => {
    loadDetail(true);
  }, [loadDetail]);
  
  useEffect(() => {
    loadDetail();
    
    // Cleanup
    return () => {
      commentsHook.clearComments();
    };
  }, [workId]);
  
  // Update likes hook when detail changes
  useEffect(() => {
    if (detail) {
      likesHook.setUserHasLiked(detail.userHasLiked || false);
      likesHook.setLikeCount(detail.likeCount || 0);
    }
  }, [detail]);

  return {
    // Main detail data
    detail,
    loading,
    error,
    refresh,
    loadDetail,
    
    // Convenience getters from detail
    work: detail?.work,
    artist: detail?.artist,
    likeCount: detail?.likeCount || 0,
    commentCount: detail?.commentCount || 0,
    userHasLiked: detail?.userHasLiked || false,
    collaborations: detail?.collaborations || [],
    originalWork: detail?.originalWork,
    remixesCount: detail?.remixesCount || 0,
    
    // Combined convenience getters (using hooks for real-time updates)
    realTimeComments: commentsHook.comments,
    realTimeLikeCount: likesHook.likeCount,
    realTimeUserHasLiked: likesHook.userHasLiked,
    
    // Combined actions
    addComment: commentsHook.addComment,
    deleteComment: commentsHook.deleteComment,
    toggleLike: likesHook.toggleLike, // ✅ Now works without userId parameter
    
    // Combined loading states
    isCommentSubmitting: commentsHook.submitting,
    isCommentDeleting: (id: string) => commentsHook.deletingId === id,
    isLikeToggling: likesHook.isToggling
  };
};