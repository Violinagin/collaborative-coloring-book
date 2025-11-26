// context/CommentsContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Comment } from '../types/User';
import { directSupabaseService } from '../services/directSupabaseService';
import { useAuth } from './AuthContext';

type CommentsContextType = {
  addComment: (artworkId: string, commentText: string) => Promise<void>;
  getComments: (artworkId: string) => Promise<Comment[]>;
  getCommentCount: (artworkId: string) => Promise<number>;
  refreshComments: (artworkId: string) => Promise<void>;
};

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

type CommentsProviderProps = {
  children: ReactNode;
};

export const CommentsProvider = ({ children }: CommentsProviderProps) => {
  const { user } = useAuth();

  const addComment = async (artworkId: string, commentText: string) => {
    if (!commentText.trim()) return;
    if (!user) {
      console.warn('User must be logged in to comment');
      return;
    }

    try {
      await directSupabaseService.addComment(artworkId, user.id, commentText);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error; // Re-throw so components can handle it
    }
  };

  const getComments = async (artworkId: string): Promise<Comment[]> => {
    try {
      return await directSupabaseService.getComments(artworkId);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const getCommentCount = async (artworkId: string): Promise<number> => {
    try {
      const comments = await getComments(artworkId);
      return comments.length;
    } catch (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }
  };

  const refreshComments = async (artworkId: string) => {
    // This function can be used to force-refresh comments if needed
    await getComments(artworkId);
  };

  return (
    <CommentsContext.Provider value={{
      addComment,
      getComments,
      getCommentCount,
      refreshComments,
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