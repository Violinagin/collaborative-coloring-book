// contexts/UserContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types/core';
import { userService } from '../services/api/users';

type UserContextType = {
  getUser: (userId: string) => Promise<User>;
  getUserCached: (userId: string) => User | undefined;
  clearCache: (userId: string) => void;
  updateCache: (userId: string, userData: Partial<User>) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userCache, setUserCache] = useState<Map<string, User>>(new Map());

  const getUser = useCallback(async (userId: string): Promise<User> => {
    // Check cache
    const cached = userCache.get(userId);
    if (cached) {
      console.log('📦 Using cached user');
      return cached;
    }

    // Fetch from API
    console.log('🔍 Fetching user:', userId);
    const user = await userService.getUser(userId);
    
    // Update cache
    setUserCache(prev => new Map(prev).set(userId, user));
    
    return user;
  }, [userCache]);

  const getUserCached = useCallback((userId: string): User | undefined => {
    return userCache.get(userId);
  }, [userCache]);

  const clearCache = useCallback((userId: string) => {
    setUserCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(userId);
      return newCache;
    });
  }, []);

  const updateCache = useCallback((userId: string, userData: Partial<User>) => {
    setUserCache(prev => {
      const newCache = new Map(prev);
      const existing = newCache.get(userId);
      if (existing) {
        newCache.set(userId, { ...existing, ...userData });
      }
      return newCache;
    });
  }, []);

  return (
    <UserContext.Provider value={{
      getUser,
      getUserCached,
      clearCache,
      updateCache
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};