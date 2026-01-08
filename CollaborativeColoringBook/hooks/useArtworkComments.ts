// hooks/useArtworkComments.ts
import { useState, useCallback, useRef } from 'react';
import { socialService } from '../services/api/social';
import { User, ArtworkComment } from '../types';

export const useArtworkComments = (
    workId: string,
    currentUser?: User | null,
    initialComments: ArtworkComment[] = []
  ) => {
  // State
  const [comments, setComments] = useState<ArtworkComment[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Refs for optimistic updates
  const pendingComments = useRef<Map<string, ArtworkComment>>(new Map());
  const deletedComments = useRef<Map<string, ArtworkComment>>(new Map());

  // Load comments from server
  const loadComments = useCallback(async () => {
    if (!workId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const freshComments = await socialService.getComments(workId);
      setComments(freshComments);
    } catch (err: any) {
      setError(err.message || 'Failed to load comments');
      console.error('useArtworkComments load error:', err);
    } finally {
      setLoading(false);
    }
  }, [workId]);

  // Add comment with optimistic update
  const addComment = useCallback(async (content: string): Promise<boolean> => {
    if (!workId || !content.trim() || submitting) return false;
    
    setSubmitting(true);
    setError(null);
    
    // Create optimistic comment
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticComment: ArtworkComment = {
        id: tempId,
        workId,
        userId: currentUser?.id || 'unknown',
        content: content.trim(),
        createdAt: new Date(),
        user: currentUser ? {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
          roles: currentUser.roles,
          joinedDate: currentUser.joinedDate
        } : undefined
      };
    
    // Store for later reference
    pendingComments.current.set(tempId, optimisticComment);
    
    // Optimistic update
    setComments(prev => [...prev, optimisticComment]);
    
    try {
      const result = await socialService.addComment(workId, content.trim());
      
      if (result.success && result.data) {
        // Replace optimistic comment with real one
        setComments(prev => 
          prev.map(comment => 
            comment.id === tempId ? result.data! : comment
          )
        );
        
        // Clean up
        pendingComments.current.delete(tempId);
        return true;
      } else {
        // Server returned error
        throw new Error(result.error || 'Failed to add comment');
      }
    } catch (err: any) {
      // Revert optimistic update
      setComments(prev => prev.filter(comment => comment.id !== tempId));
      pendingComments.current.delete(tempId);
      
      setError(err.message || 'Failed to add comment');
      console.error('useArtworkComments add error:', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [workId, currentUser, submitting]);

  // Delete comment with optimistic update
  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!commentId || deletingId) return false;
    
    setDeletingId(commentId);
    setError(null);
    
    // Store for potential restoration
    const commentToDelete = comments.find(c => c.id === commentId);
    if (commentToDelete) {
      deletedComments.current.set(commentId, commentToDelete);
    }
    
    // Optimistic update
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    
    try {
      const result = await socialService.deleteComment(commentId);
      
      if (result.success) {
        // Success - comment already removed
        deletedComments.current.delete(commentId);
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete comment');
      }
    } catch (err: any) {
      // Revert optimistic update
      if (commentToDelete) {
        setComments(prev => [...prev, commentToDelete].sort((a, b) => 
          a.createdAt.getTime() - b.createdAt.getTime()
        ));
      }
      deletedComments.current.delete(commentId);
      
      setError(err.message || 'Failed to delete comment');
      console.error('useArtworkComments delete error:', err);
      return false;
    } finally {
      setDeletingId(null);
    }
  }, [comments, deletingId]);

  // Check if user owns a comment
  const isCommentOwner = useCallback((commentUserId: string) => {
    return currentUser?.id === commentUserId;
  }, [currentUser]);

  // Refresh comments
  const refresh = useCallback(async () => {
    await loadComments();
  }, [loadComments]);

  // Clear all comments (useful on unmount or work change)
  const clearComments = useCallback(() => {
    setComments([]);
    pendingComments.current.clear();
    deletedComments.current.clear();
    setError(null);
  }, []);

  return {
    // State
    comments,
    loading,
    error,
    submitting,
    deletingId,
    
    // Actions
    addComment,
    deleteComment,
    loadComments,
    refresh,
    clearComments,
    isCommentOwner,
    
    // Derived values
    commentCount: comments.length,
    hasComments: comments.length > 0,
    
    // State setters (for external updates)
    setComments,
    setError
  };
};