import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type LikesContextType = {
  likedArtworks: Set<string>;
  toggleLike: (artworkId: string) => Promise<void>;
  isLiked: (artworkId: string) => boolean;
  getLikeCount: (artworkId: string) => Promise<number>;
  refreshLikes: () => Promise<void>;
};

const LikesContext = createContext<LikesContextType | undefined>(undefined);

type LikesProviderProps = {
  children: ReactNode;
};

export const LikesProvider = ({ children }: LikesProviderProps) => {
  const [likedArtworks, setLikedArtworks] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // Load user's likes when component mounts or user changes
  const refreshLikes = async () => {
    if (!user) {
      setLikedArtworks(new Set());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('artwork_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const likedIds = new Set(data?.map(like => like.artwork_id) || []);
      setLikedArtworks(likedIds);
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const toggleLike = async (artworkId: string) => {
    if (!user) {
      console.warn('User must be logged in to like artworks');
      return;
    }

    const currentlyLiked = likedArtworks.has(artworkId);

    try {
      if (currentlyLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('artwork_id', artworkId);

        if (error) throw error;

        setLikedArtworks(prev => {
          const newLiked = new Set(prev);
          newLiked.delete(artworkId);
          return newLiked;
        });
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert([
            { user_id: user.id, artwork_id: artworkId }
          ]);

        if (error) throw error;

        setLikedArtworks(prev => {
          const newLiked = new Set(prev);
          newLiked.add(artworkId);
          return newLiked;
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const isLiked = (artworkId: string) => likedArtworks.has(artworkId);

  const getLikeCount = async (artworkId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('artwork_id', artworkId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting like count:', error);
      return 0;
    }
  };

  // Load likes when component mounts
  React.useEffect(() => {
    refreshLikes();
  }, [user]);

  return (
    <LikesContext.Provider value={{
      likedArtworks,
      toggleLike,
      isLiked,
      getLikeCount,
      refreshLikes,
    }}>
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => {
  const context = useContext(LikesContext);
  if (context === undefined) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
};