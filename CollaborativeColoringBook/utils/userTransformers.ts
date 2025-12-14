// utils/userTransformers.ts
import { User } from '../types/core';

export const transformDatabaseUser = (dbUser: any): User => {
  if (!dbUser) {
    // Return a proper fallback user, not undefined
    return createFallbackUser('unknown');
  }

  return {
    id: dbUser.id,
    username: dbUser.username || `user_${dbUser.id.slice(0, 8)}`,
    displayName: dbUser.display_name || 'Unknown Artist',
    avatarUrl: dbUser.avatar_url,
    bio: dbUser.bio || '',
    roles: dbUser.roles || ['supporter'],
    joinedDate: new Date(dbUser.created_at || dbUser.joined_date || Date.now()),
  };
};

export const createFallbackUser = (userId: string): User => {
  return {
    id: userId,
    username: `user_${userId.slice(0, 8)}`,
    displayName: 'New User',
    avatarUrl: undefined,
    bio: 'Welcome to the community!',
    roles: ['supporter'],
    joinedDate: new Date(),
  };
};