import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockArtworks, Artwork, Comment } from '../data/mockData';

type CommentsContextType = {
  artworks: Artwork[];
  addComment: (artworkId: string, commentText: string, userName: string) => void;
  getComments: (artworkId: string) => Comment[];
  getCommentCount: (artworkId: string) => number;
};

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

type CommentsProviderProps = {
  children: ReactNode;
};

export const CommentsProvider = ({ children }: CommentsProviderProps) => {
  const [artworks, setArtworks] = useState<Artwork[]>(mockArtworks);

  const addComment = (artworkId: string, commentText: string, userName: string) => {
    if (!commentText.trim()) return; // Don't add empty comments

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: `user-${userName}`, // Simple user ID for now
      userName: userName,
      text: commentText,
      createdAt: new Date(),
    };

    setArtworks(prevArtworks => 
      prevArtworks.map(artwork => {
        if (artwork.id === artworkId) {
          return {
            ...artwork,
            comments: [...artwork.comments, newComment]
          };
        }
        return artwork;
      })
    );
  };

  const getComments = (artworkId: string) => {
    const artwork = artworks.find(a => a.id === artworkId);
    return artwork ? artwork.comments : [];
  };

  const getCommentCount = (artworkId: string) => {
    const artwork = artworks.find(a => a.id === artworkId);
    return artwork ? artwork.comments.length : 0;
  };

  return (
    <CommentsContext.Provider value={{
      artworks,
      addComment,
      getComments,
      getCommentCount,
    }}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};