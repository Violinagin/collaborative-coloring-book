// // utils/socialTransformers.ts
// import { Like, ArtworkComment } from '../types/core';
// import { transformDatabaseUser } from './userTransformers';

// // ==================== LIKES ====================
// export interface DatabaseLike {
//   id: string;
//   work_id: string;
//   user_id: string;
//   created_at: string;
//   user?: {
//     id: string;
//     username: string;
//     display_name: string;
//     avatar_url?: string;
//   };
// }

// export const transformDatabaseLike = (dbLike: any): Like => {
//   if (!dbLike) {
//     return createFallbackLike();
//   }

//   return {
//     id: dbLike.id,
//     workId: dbLike.work_id,
//     userId: dbLike.user_id,
//     createdAt: new Date(dbLike.created_at),
//     user: dbLike.user ? transformDatabaseUser(dbLike.user) : undefined
//   };
// };

// export const createFallbackLike = (): Like => {
//   return {
//     id: 'unknown',
//     workId: 'unknown',
//     userId: 'unknown',
//     createdAt: new Date()
//   };
// };

// // ==================== COMMENTS ====================
// export interface DatabaseComment {
//   id: string;
//   work_id: string;
//   user_id: string;
//   text: string;
//   created_at: string;
//   user?: {
//     id: string;
//     username: string;
//     display_name: string;
//     avatar_url?: string;
//   };
// }

// export const transformDatabaseComment = (dbComment: any): ArtworkComment => {
//   if (!dbComment) {
//     return createFallbackComment();
//   }

//   // Handle both field names (text/content)
//   const content = dbComment.text || dbComment.content || '';

//   return {
//     id: dbComment.id,
//     workId: dbComment.work_id,
//     userId: dbComment.user_id,
//     content: content,
//     createdAt: new Date(dbComment.created_at),
//     user: dbComment.user ? transformDatabaseUser(dbComment.user) : undefined
//   };
// };

// export const createFallbackComment = (): ArtworkComment => {
//   return {
//     id: 'unknown',
//     workId: 'unknown',
//     userId: 'unknown',
//     content: 'Comment unavailable',
//     createdAt: new Date()
//   };
// };

// // ==================== BATCH TRANSFORMERS ====================
// export const batchTransformLikes = (dbLikes: any[]): Like[] => {
//   return (dbLikes || []).map(transformDatabaseLike);
// };

// export const batchTransformComments = (dbComments: any[]): ArtworkComment[] => {
//   return (dbComments || []).map(transformDatabaseComment);
// };

// // ==================== GROUPING HELPERS ====================
// export const groupLikesByWorkId = (dbLikes: any[]): Record<string, Like[]> => {
//   const transformedLikes = batchTransformLikes(dbLikes);
//   const grouped: Record<string, Like[]> = {};
  
//   transformedLikes.forEach(like => {
//     if (!grouped[like.workId]) {
//       grouped[like.workId] = [];
//     }
//     grouped[like.workId].push(like);
//   });
  
//   return grouped;
// };

// export const groupCommentsByWorkId = (dbComments: any[]): Record<string, ArtworkComment[]> => {
//   const transformedComments = batchTransformComments(dbComments);
//   const grouped: Record<string, ArtworkComment[]> = {};
  
//   transformedComments.forEach(comment => {
//     if (!grouped[comment.workId]) {
//       grouped[comment.workId] = [];
//     }
//     grouped[comment.workId].push(comment);
//   });
  
//   return grouped;
// };