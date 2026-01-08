// utils/transformers.ts
import { 
  User, 
  UserRole,
  CreativeWork, 
  ArtworkComment,
  DatabaseUser,
  DatabaseWork,
  DatabaseComment,
  DatabaseLike
} from '../types';

const VALID_USER_ROLES: UserRole[] = ['line_artist', 'colorist', 'supporter'];
const isValidUserRole = (role: string): role is UserRole => {
    return VALID_USER_ROLES.includes(role as UserRole);
  };
// Parse and validate roles
export const parseUserRoles = (rolesInput: any): UserRole[] => {
    let roles: string[] = [];
    
    try {
      if (typeof rolesInput === 'string') {
        roles = JSON.parse(rolesInput);
      } else if (Array.isArray(rolesInput)) {
        roles = rolesInput;
      } else if (rolesInput) {
        roles = [rolesInput];
      }
    } catch (error) {
      console.warn('Failed to parse roles:', rolesInput);
      return ['supporter']; // Default role
    }
    
    // Filter out invalid roles
    return roles.filter(isValidUserRole) as UserRole[];
  };
  

// User transformer
export const transformDatabaseUser = (dbUser: DatabaseUser): User => {
    
    
  return {
    id: dbUser.id,
    username: dbUser.username,
    displayName: dbUser.display_name,
    avatarUrl: dbUser.avatar_url,
    bio: dbUser.bio,
    roles: parseUserRoles(dbUser.roles),
    joinedDate: new Date(dbUser.created_at)
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

// Work transformer
export const transformDatabaseWork = (dbWork: DatabaseWork): CreativeWork => {
  return {
    id: dbWork.id,
    title: dbWork.title,
    description: dbWork.description,
    artistId: dbWork.artist_id,
    mediaType: dbWork.media_type as any,
    assetUrl: dbWork.asset_url,
    mediaConfig: dbWork.media_config,
    originalWorkId: dbWork.original_work_id,
    derivationChain: dbWork.derivation_chain || [],
    metadata: dbWork.metadata || {},
    tags: dbWork.tags || [],
    visibility: dbWork.visibility as 'public' | 'private' | 'unlisted',
    createdAt: new Date(dbWork.created_at),
    updatedAt: new Date(dbWork.updated_at || dbWork.created_at)
  };
};

// Comment transformer (standardizes 'text' -> 'content')
export const transformDatabaseComment = (
  dbComment: DatabaseComment & { user?: DatabaseUser }
): ArtworkComment => {
  return {
    id: dbComment.id,
    workId: dbComment.work_id,
    userId: dbComment.user_id,
    content: dbComment.text, // Transform DB 'text' to 'content'
    createdAt: new Date(dbComment.created_at),
    user: dbComment.user ? transformDatabaseUser(dbComment.user) : undefined
  };
};

// Like transformer
export const transformDatabaseLike = (
  dbLike: DatabaseLike & { user?: DatabaseUser }
) => {
  return {
    id: dbLike.id,
    workId: dbLike.work_id,
    userId: dbLike.user_id,
    createdAt: new Date(dbLike.created_at),
    user: dbLike.user ? transformDatabaseUser(dbLike.user) : undefined
  };
};

// Grouping helpers
export const groupLikesByWorkId = (likes: any[]): Record<string, any[]> => {
  return likes.reduce((groups, like) => {
    const workId = like.work_id;
    if (!groups[workId]) {
      groups[workId] = [];
    }
    groups[workId].push(like);
    return groups;
  }, {});
};