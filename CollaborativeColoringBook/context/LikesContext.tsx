import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockArtworks, Artwork } from '../data/mockData';

type LikesContextType = {
  artworks: Artwork[];
  likedArtworks: Set<string>;
  toggleLike: (artworkId: string) => void;
  isLiked: (artworkId: string) => boolean;
  getLikeCount: (artworkId: string) => number;
};

const LikesContext = createContext<LikesContextType | undefined>(undefined);

type LikesProviderProps = {
  children: ReactNode;
};

export const LikesProvider = ({ children }: LikesProviderProps) => {
  const [artworks, setArtworks] = useState<Artwork[]>(mockArtworks);
  const [likedArtworks, setLikedArtworks] = useState<Set<string>>(new Set());

  const toggleLike = (artworkId: string) => {
    const currentlyLiked = likedArtworks.has(artworkId);
    
    setArtworks(prevArtworks => 
      prevArtworks.map(artwork => {
        if (artwork.id === artworkId) {
          if (currentlyLiked) {
            // Remove like
            return {
              ...artwork,
              likes: artwork.likes.slice(0, -1)
            };
          } else {
            // Add like
            return {
              ...artwork,
              likes: [...artwork.likes, `user-${Date.now()}`]
            };
          }
        }
        return artwork;
      })
    );

    setLikedArtworks(prev => {
      const newLiked = new Set(prev);
      if (currentlyLiked) {
        newLiked.delete(artworkId);
      } else {
        newLiked.add(artworkId);
      }
      return newLiked;
    });
  };

  const isLiked = (artworkId: string) => likedArtworks.has(artworkId);

  const getLikeCount = (artworkId: string) => {
    const artwork = artworks.find(a => a.id === artworkId);
    return artwork ? artwork.likes.length : 0;
  };

  return (
    <LikesContext.Provider value={{
      artworks,
      likedArtworks,
      toggleLike,
      isLiked,
      getLikeCount,
    }}>
      {children}
    </LikesContext.Provider>
  );
};

// Custom hook to use the likes context
export const useLikes = () => {
  const context = useContext(LikesContext);
  if (context === undefined) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
};