// services/api/works.ts
import { getSupabase } from '../../lib/supabase';
import { 
  CreativeWork,
  Collaboration, 
  WorkWithContext, 
  User, 
  UploadWork, 
  DerivativeWorkData,
  ArtworkComment,
  ApiResponse,
  DatabaseWork,
  DatabaseUser,
  Like
} from '../../types';
import { socialService } from './social';
import { storageService } from './../upload/storageService';
import { transformDatabaseUser, transformDatabaseWork } from '../../utils/transformers';
import { 
  validateWorkForUpload,
  createFallbackWork,
  createWorkPreview
} from '../../utils/worksTransformers';

export const transformDatabaseWorkWithSocial = (
  dbWork: DatabaseWork & { 
    artist?: DatabaseUser;
    likes?: any[];
    comments?: any[];
  },
  currentUserId?: string
): CreativeWork => {
  const baseWork = transformDatabaseWork(dbWork);
  
  return {
    ...baseWork,
    artist: dbWork.artist ? transformDatabaseUser(dbWork.artist) : undefined,
    likes: dbWork.likes?.map(like => ({
      id: like.id,
      workId: dbWork.id,
      userId: like.user_id,
      createdAt: new Date(like.created_at),
      user: like.user ? transformDatabaseUser(like.user) : undefined
    })) || [],
    comments: dbWork.comments?.map(comment => ({
      id: comment.id,
      workId: dbWork.id,
      userId: comment.user_id,
      content: comment.text || comment.content, // Handle both
      createdAt: new Date(comment.created_at),
      user: comment.user ? transformDatabaseUser(comment.user) : undefined
    })) || [],
    userHasLiked: dbWork.likes?.some((like: any) => like.user_id === currentUserId) || false
  };
};

function transformCollabHelper(collab: any): Collaboration {
  return {
    id: collab.id,
    originalWorkId: collab.original_work_id,
    derivedWorkId: collab.derived_work_id,
    collaborationType: collab.collaboration_type,
    context: collab.context || {},
    description: collab.description,
    attribution: collab.attribution || 'Inspired by',
    createdAt: new Date(collab.created_at)
  };
}

// ==================== SAFE WRAPPER ====================
async function safeQuery<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<ApiResponse<T>> {
  try {
    const data = await operation();
    return { data, error: null, success: true };
  } catch (err: any) {
    console.error(`❌ [Works:${operationName}] failed:`, err.message || err);
    
    let errorMessage = 'Action failed. Please try again.';
    if (err.message?.includes('Network')) {
      errorMessage = 'No internet connection';
    } else if (err.message?.includes('not found')) {
      errorMessage = 'Artwork not found';
    } else if (err.message?.includes('auth')) {
      errorMessage = 'Please log in to continue';
    }
    
    return { 
      data: null, 
      error: errorMessage, 
      success: false 
    };
  }
}

// ==================== MAIN SERVICE ====================
export const worksService = {
  
  // ✅ Get work with artist (with fallback)
  async getWork(workId: string): Promise<CreativeWork> {
    const result = await safeQuery(async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('works')
        .select(`
          *,
          artist:users(
            id,
            username,
            display_name,
            avatar_url,
            bio,
            roles,
            created_at
          )
        `)
        .eq('id', workId)
        .single();
      
      if (error) throw error;
      
      return transformDatabaseWorkWithSocial(data);
    }, 'getWork');
    
    return result.data || createFallbackWork(workId);
  },
  
  // ✅ Get all works (OPTIMIZED with socialService batch methods)
  async getAllWorks(): Promise<CreativeWork[]> {
    const result = await safeQuery(async () => {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      
      // 1. Get works with artists only
      const { data: worksData, error } = await supabase
        .from('works')
        .select(`
          *,
          artist:users(
            id,
            username,
            display_name,
            avatar_url,
            bio,
            roles,
            created_at
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Deduplicate
      const uniqueWorksMap = new Map();
      (worksData || []).forEach((dbWork: any) => {
        if (!uniqueWorksMap.has(dbWork.id)) {
          uniqueWorksMap.set(dbWork.id, dbWork);
        }
      });
      
      const uniqueData = Array.from(uniqueWorksMap.values());
      const workIds = uniqueData.map((work: any) => work.id);
      
      // 2. Use socialService BATCH methods for social data
      const [likeCounts, commentCounts, userLikes, allLikes, allComments] = await Promise.all([
        socialService.batchGetLikeCounts(workIds),
        socialService.batchGetCommentCounts(workIds),
        currentUserId 
    ? socialService.batchIsLiked(workIds, currentUserId) 
    : Promise.resolve<Record<string, boolean>>({}), 
  socialService.batchGetLikes(workIds),
  socialService.batchGetComments(workIds)
]);
      
      // 3. Transform each work with its social data
      return uniqueData.map((dbWork: any): CreativeWork => {
        const workId = dbWork.id;
        const workLikes = allLikes[workId] || [];
        const workComments = allComments[workId] || [];
        
        // Create the work with social data
        const work = transformDatabaseWork(dbWork);
        // Create the complete CreativeWork object
      const creativeWork: CreativeWork = {
        ...work,
        // Add artist from the database join
        artist: dbWork.artist ? transformDatabaseUser(dbWork.artist) : undefined,
        // Add social data from batch queries
        likes: workLikes,
        comments: workComments,
        userHasLiked: userLikes[workId] || false,
        // likeCount: likeCounts[workId] || 0,
        // commentCount: commentCounts[workId] || 0
      };
      
      return creativeWork;
    });
  }, 'getAllWorks');
    
    return result.data || [];
  },

  async getArtworkDetail(workId: string): Promise<{
    work: CreativeWork;
    artist: User;
    likeCount: number;
    commentCount: number;
    userHasLiked: boolean;
    comments: ArtworkComment[];
    remixesCount: number;
    collaborations: Collaboration[];
    originalWork?: CreativeWork;
  }> {
    const result = await safeQuery(async () => {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      
      // SINGLE QUERY to get everything we need for detail view
      const { data: workData, error } = await supabase
      .from('works')
      .select(`
        *,
        artist:users(*),
        likes:likes(count),
        comments:comments(count),
        collaborations_as_original:collaborations!original_work_id(*),
        collaborations_as_derivative:collaborations!derived_work_id(*)
      `)
      .eq('id', workId)
      .single();
    
    if (error) throw error;
    
    const work = transformDatabaseWork(workData);
    const artist = transformDatabaseUser(workData.artist);
    
    // Get counts from the single query
    const likeCount = workData.likes?.[0]?.count || 0;
    const commentCount = workData.comments?.[0]?.count || 0;
    
    // Transform collaborations
    const collaborations: Collaboration[] = [
      ...(workData.collaborations_as_original || []).map((collab: any) => ({
        id: collab.id,
        originalWorkId: collab.original_work_id,
        derivedWorkId: collab.derived_work_id,
        collaborationType: collab.collaboration_type,
        context: collab.context || {},
        description: collab.description,
        attribution: collab.attribution || 'Inspired by',
        createdAt: new Date(collab.created_at)
      })),
      ...(workData.collaborations_as_derivative || []).map((collab: any) => ({
        id: collab.id,
        originalWorkId: collab.original_work_id,
        derivedWorkId: collab.derived_work_id,
        collaborationType: collab.collaboration_type,
        context: collab.context || {},
        description: collab.description,
        attribution: collab.attribution || 'Inspired by',
        createdAt: new Date(collab.created_at)
      }))
    ];
    
    // PARALLEL queries for the rest
    const [commentsResult, userLikedResult, remixesCountResult, originalWorkResult] = await Promise.all([
      // Comments with user info
      socialService.getComments(workId),
      
      // Check if current user liked
      currentUserId 
        ? socialService.isLiked(workId, currentUserId)
        : Promise.resolve(false),
      
      // Count remixes (derivatives)
      supabase
        .from('works')
        .select('*', { count: 'exact', head: true })
        .eq('original_work_id', workId)
        .then(({ count }: { count: number | null }) => count || 0),
      
      // Get original work if exists (basic only)
      work.originalWorkId 
        ? this.getWorkBasic(work.originalWorkId).catch(() => undefined)
        : Promise.resolve(undefined)
    ]);

    const comments: ArtworkComment[] = Array.isArray(commentsResult) 
      ? commentsResult 
      : [];
    
    return {
      work: {
        ...work,
        artist,
        likeCount,
        commentCount,
        userHasLiked: userLikedResult
      },
      artist,
      likeCount,
      commentCount,
      userHasLiked: userLikedResult,
      comments: comments,
      remixesCount: remixesCountResult,
      collaborations,
      originalWork: originalWorkResult
    };
  }, 'getArtworkDetail');
  
  // Return the result OR fallback
  if (result.data) {
    return result.data;
  }
  
  // Fallback
  const fallbackWork = createFallbackWork(workId);
  return {
    work: fallbackWork,
    artist: fallbackWork.artist!,
    likeCount: 0,
    commentCount: 0,
    userHasLiked: false,
    comments: [],
    remixesCount: 0,
    collaborations: [],
    originalWork: undefined
  };
},
  
  // ✅ Create work with validation (using your validator)
  async createWork(workData: UploadWork): Promise<ApiResponse<CreativeWork>> {
    return safeQuery(async () => {
      // Use your validator
      const validation = validateWorkForUpload(workData);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid work data');
      }
      
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('❌ No user found');
        throw new Error('Not authenticated');
      }
      
      // Build derivation chain
      let derivationChain: string[] = [];
      if (workData.originalWorkId) {
        const original = await this.getWorkBasic(workData.originalWorkId);
        derivationChain = [...original.derivationChain, workData.originalWorkId];
      }
      
      const work = {
        title: workData.title.trim(),
        description: workData.description?.trim(),
        media_type: workData.mediaType,
        asset_url: workData.assetUrl,
        media_config: workData.mediaConfig,
        original_work_id: workData.originalWorkId,
        artist_id: userData.user.id,
        derivation_chain: derivationChain,
        tags: workData.tags || [],
        visibility: workData.visibility || 'public',
        metadata: {}
      };
      
      const { data, error } = await supabase
        .from('works')
        .insert(work)
        .select()
        .single();
      
      console.log('📊 Insert response:', { data, error });
      
      if (error) {
        console.error('❌ Database insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      if (!data) {
        console.error('❌ No data returned from insert, but no error either');
        throw new Error('Insert succeeded but no data returned');
      }
      
      // Return the full work using getWork
      return this.getWork(data.id);
    }, 'createWork');
  },
  
  // ✅ Delete work with cleanup
  async deleteWork(workId: string): Promise<ApiResponse<void>> {
    return safeQuery(async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Get work first
      const work = await this.getWorkBasic(workId);
      if (work.artistId !== user.id) {
        throw new Error('You can only delete your own artworks');
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('works')
        .delete()
        .eq('id', workId)
        .eq('artist_id', user.id);
      
      if (dbError) throw dbError;
      
      // Try to delete storage (optional)
      try {
        if (work.assetUrl) {
          await storageService.deleteArtworkImage(work.assetUrl);
        }
      } catch (storageError) {
        console.warn('⚠️ Could not delete image from storage:', storageError);
        // Continue anyway
      }
    }, 'deleteWork');
  },
  
  // ✅ Internal: Get basic work (no joins, using your transformer)
  async getWorkBasic(workId: string): Promise<CreativeWork> {
    const result = await safeQuery(async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single();
      
      if (error) throw error;
      
      // Use your basic transformer
      return transformDatabaseWork(data);
    }, 'getWorkBasic');
    
    return result.data || createFallbackWork(workId);
  },

  // ✅ Get work previews for lists/feeds
  async getWorkPreviews(): Promise<ReturnType<typeof createWorkPreview>[]> {
    const works = await this.getAllWorks();
    return works.map(work => createWorkPreview(work));
  },
  
  // ✅ Get work with full context
  async getWorkWithContext(workId: string, includeSocial: boolean = true): Promise<WorkWithContext> {
    const result = await safeQuery(async () => {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      
      // Build the query based on what we need
      let query = supabase
        .from('works')
        .select(`
          *,
          artist:users(*)
        `)
        .eq('id', workId)
        .single();
      
      // Add collaborations if needed
      query = query.select(`
        *,
        artist:users(*),
        collaborations_as_original:collaborations!original_work_id(*),
        collaborations_as_derivative:collaborations!derived_work_id(*)
      `);
      
      const { data: workData, error } = await query;
      
      if (error) throw error;
      
      const work = transformDatabaseWork(workData);
      const artist = transformDatabaseUser(workData.artist);
      
      // Get social data in parallel if needed
      let likes: Like[] = [];
      let comments: ArtworkComment[] = [];
      let userHasLiked = false;
      let likeCount = 0;
      let commentCount = 0;
      
      if (includeSocial) {
        // Use socialService batch methods for efficiency
        const [likesResult, commentsResult, likeCountResult, commentCountResult, userLikedResult] = await Promise.all([
          socialService.batchGetLikes([workId]),
          socialService.batchGetComments([workId]),
          socialService.batchGetLikeCounts([workId]),
          socialService.batchGetCommentCounts([workId]),
          currentUserId 
            ? socialService.batchIsLiked([workId], currentUserId)
            : Promise.resolve({} as Record<string, boolean>) 
          ]);
        
        likes = likesResult[workId] || [];
        comments = commentsResult[workId] || [];
        likeCount = likeCountResult[workId] || 0;
        commentCount = commentCountResult[workId] || 0;
        userHasLiked = userLikedResult[workId] || false;
      }
      
      // Get remixes/siblings only if needed
      let remixes: CreativeWork[] = [];
      let siblings: CreativeWork[] = [];
      
      if (work.originalWorkId) {
        // Get siblings (works with same original)
        const { data: siblingsData } = await supabase
          .from('works')
          .select('*')
          .eq('original_work_id', work.originalWorkId)
          .neq('id', workId);
        
        siblings = siblingsData?.map(transformDatabaseWork) || [];
      }
      
      // Get remixes (works that have this as original)
      const { data: remixesData } = await supabase
        .from('works')
        .select('*')
        .eq('original_work_id', workId);
      
      remixes = remixesData?.map(transformDatabaseWork) || [];
      
      // Get original work if exists
      let originalWork: CreativeWork | undefined;
      if (work.originalWorkId) {
        // Just get basic info, not full context (avoid infinite recursion)
        originalWork = await this.getWorkBasic(work.originalWorkId);
      }
      
      // Transform collaborations
      const collaborations: Collaboration[] = [
        ...(workData.collaborations_as_original || []).map((collab: any) => ({
          id: collab.id,
          originalWorkId: collab.original_work_id,
          derivedWorkId: collab.derived_work_id,
          collaborationType: collab.collaboration_type,
          context: collab.context || {},
          description: collab.description,
          attribution: collab.attribution || 'Inspired by',
          createdAt: new Date(collab.created_at)
        })),
        ...(workData.collaborations_as_derivative || []).map((collab: any) => ({
          id: collab.id,
          originalWorkId: collab.original_work_id,
          derivedWorkId: collab.derived_work_id,
          collaborationType: collab.collaboration_type,
          context: collab.context || {},
          description: collab.description,
          attribution: collab.attribution || 'Inspired by',
          createdAt: new Date(collab.created_at)
        }))
      ];
      
      // Return the complete context
      return {
        work: {
          ...work,
          artist,
          likes,
          comments,
          userHasLiked,
          likeCount,
          commentCount
        },
        originalWork,
        collaborations,
        artist: artist,
        remixes,
        siblings
      };
    }, 'getWorkWithContext');
    
    // Fallback
    if (!result.data) {
      const fallbackWork = createFallbackWork(workId);
      return {
        work: fallbackWork,
        originalWork: undefined,
        collaborations: [],
        artist: fallbackWork.artist,
        remixes: [],
        siblings: []
      };
    }
    
    return result.data;
  },
  
  // ✅ Create remix
  async createRemix(remixData: DerivativeWorkData): Promise<ApiResponse<CreativeWork>> {
    return safeQuery(async () => {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      // Create the work
      const uploadWork: UploadWork = {
        title: remixData.title,
        description: remixData.description,
        assetUrl: remixData.assetUrl,
        originalWorkId: remixData.originalWorkId,
        tags: remixData.tags,
        visibility: remixData.visibility,
        mediaType: remixData.mediaType,
        mediaConfig: remixData.mediaConfig
      };
      
      const workResult = await this.createWork(uploadWork);
      if (!workResult.data) {
        throw new Error('Failed to create work: ' + workResult.error);
      }
      
      // Try to create collaboration record
      try {
        await supabase
          .from('collaborations')
          .insert({
            original_work_id: remixData.originalWorkId,
            derived_work_id: workResult.data.id,
            collaboration_type: remixData.remixType || 'remix',
            description: remixData.attribution || `Remix of work`
          });
      } catch (collabError) {
        console.warn('⚠️ Collaboration record failed:', collabError);
        // Continue - the main work was created
      }
      
      return workResult.data;
    }, 'createRemix');
  },
  
  // ===== EXISTING HELPER METHODS =====
  async getWorkRemixes(workId: string): Promise<CreativeWork[]> {
    const result = await safeQuery(async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('original_work_id', workId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(transformDatabaseWork);
    }, 'getWorkRemixes');
    
    return result.data || [];
  },
  
  async getWorkCollaborations(workId: string): Promise<{
    asOriginal: Collaboration[];
    asDerivative: Collaboration[];
  }> {
    const result = await safeQuery(async () => {
      const supabase = getSupabase();
      const [asOriginal, asDerivative] = await Promise.all([
        supabase
          .from('collaborations')
          .select('*')
          .eq('original_work_id', workId),
        supabase
          .from('collaborations')
          .select('*')
          .eq('derived_work_id', workId)
      ]);
      
      const transformCollab = (collab: any): Collaboration => ({
        id: collab.id,
        originalWorkId: collab.original_work_id,
        derivedWorkId: collab.derived_work_id,
        collaborationType: collab.collaboration_type,
        context: collab.context || {},
        description: collab.description,
        attribution: collab.attribution || 'Inspired by',
        createdAt: new Date(collab.created_at)
      });
      
      return {
        asOriginal: asOriginal.data?.map(transformCollabHelper) || [],
        asDerivative: asDerivative.data?.map(transformCollabHelper) 
      };
    }, 'getWorkCollaborations');
    
    return result.data || { asOriginal: [], asDerivative: [] };
  },

  async getUserArtworks(userId: string): Promise<CreativeWork[]> {
    const result = await safeQuery(async () => {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      
      // 1. Get ONLY this user's works with artist info
      const { data: worksData, error } = await supabase
        .from('works')
        .select(`
          *,
          artist:users(
            id,
            username,
            display_name,
            avatar_url,
            bio,
            roles,
            created_at
          )
        `)
        .eq('artist_id', userId)
        .eq('visibility', 'public') // Only public works
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!worksData || worksData.length === 0) {
        return [];
      }
      
      // 2. Get work IDs for batch queries
      const workIds = worksData.map((work: any) => work.id);
      
      // 3. Use socialService BATCH methods (this is key!)
      const [likeCounts, commentCounts, userLikes] = await Promise.all([
        socialService.batchGetLikeCounts(workIds),
        socialService.batchGetCommentCounts(workIds),
        currentUserId 
          ? socialService.batchIsLiked(workIds, currentUserId)
          : Promise.resolve({} as Record<string, boolean>)
      ]);
      
      // 4. Transform with social data
      return worksData.map((dbWork: any): CreativeWork => {
        const workId = dbWork.id;
        const work = transformDatabaseWork(dbWork);
        
        return {
          ...work,
          artist: dbWork.artist ? transformDatabaseUser(dbWork.artist) : undefined,
          userHasLiked: userLikes[workId] || false,
          // Add likes/comments if you need them
        };
      });
    }, 'getUserArtworks');
    return result.data || [];
  },
  
};

