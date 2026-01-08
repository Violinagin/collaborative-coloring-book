// hooks/useArtworkLikes.ts - Fixed version
import { useState, useCallback } from 'react';
import { socialService } from '../services/api/social';
import { User } from '../types/core';

export const useArtworkLikes = (
  workId: string, 
  initialLikedState: boolean, 
  initialLikeCount: number,
  currentUser?: User | null
) => {
  const [likedState, setLikedState] = useState(initialLikedState);
  const [countState, setCountState] = useState(initialLikeCount);
  const [isToggling, setIsToggling] = useState(false);

  const toggleLike = useCallback(async () => {
    const userId = currentUser?.id;
    if (!workId || !userId || isToggling) return;

    // Optimistic update
    const newLiked = !likedState;
    const newCount = newLiked ? countState + 1 : countState - 1;
    
    setLikedState(newLiked);
    setCountState(newCount);
    setIsToggling(true);

    try {
      const actualLiked = await socialService.toggleLike(workId, userId);
      const actualCount = await socialService.getLikeCount(workId);
      
      // Update with server response
      setLikedState(actualLiked);
      setCountState(actualCount);
      
      return actualLiked;
    } catch (error) {
      // Revert on error
      setLikedState(!newLiked);
      setCountState(countState);
      console.error('Error toggling like:', error);
      throw error;
    } finally {
      setIsToggling(false);
    }
  }, [workId, currentUser?.id, likedState, countState, isToggling]);

  return {
    userHasLiked: likedState,
    likeCount: countState,
    isToggling,
    toggleLike,
    setUserHasLiked: setLikedState,
    setLikeCount: setCountState,
  };
};