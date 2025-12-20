// services/worksService.ts
import { supabase } from '../lib/supabase';
import { 
  CreativeWork, 
  Collaboration, 
  WorkWithContext, 
  User, 
  UploadWork, 
  DerivativeWorkData, 
  CollaborationType
} from '../types/core';
import { storageService } from './storageService';
import { transformDatabaseUser } from '../utils/userTransformers';

// ==================== TYPES ====================
type ServiceResult<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

// ==================== SAFE WRAPPER ====================
async function safeQuery<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<ServiceResult<T>> {
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

// ==================== FALLBACKS ====================
function createFallbackWork(workId: string): CreativeWork {
  return {
    id: workId,
    title: 'Untitled Artwork',
    description: 'Artwork unavailable',
    artistId: 'unknown',
    mediaType: 'line_art',
    assetUrl: '', // Consider a placeholder image
    mediaConfig: { isColorable: false, complexity: 'medium' },
    originalWorkId: undefined,
    derivationChain: [],
    metadata: {},
    tags: [],
    visibility: 'public',
    createdAt: new Date(),
    updatedAt: new Date(),
    artist: createFallbackUser('unknown')
  };
}

function createFallbackUser(userId: string): User {
  return {
    id: userId,
    username: 'unknown',
    displayName: 'Unknown Artist',
    avatarUrl: undefined,
    bio: '',
    roles: ['supporter'],
    joinedDate: new Date(),
  };
}

// ==================== MAIN SERVICE ====================
export const worksService = {
  
  // ✅ Get work with artist (with fallback)
  async getWork(workId: string): Promise<CreativeWork> {
    const result = await safeQuery(async () => {
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
      
      return {
        ...this.transformDatabaseWork(data),
        artist: transformDatabaseUser(data.artist)
      };
    }, 'getWork');
    
    return result.data || createFallbackWork(workId);
  },
  
  // ✅ Get all works (empty array fallback)
  async getAllWorks(): Promise<CreativeWork[]> {
    const result = await safeQuery(async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      
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
          ),
          likes:likes(
            id,
            user_id,
            created_at,
            user:users(id, username, display_name)
          ),
          comments:comments(
            id,
            user_id,
            text,
            created_at,
            user:users(id, username, display_name)
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Deduplicate
      const uniqueWorksMap = new Map();
      data?.forEach(dbWork => {
        if (!uniqueWorksMap.has(dbWork.id)) {
          uniqueWorksMap.set(dbWork.id, dbWork);
        }
      });
      
      const uniqueData = Array.from(uniqueWorksMap.values());
      
      return uniqueData.map(dbWork => 
        this.transformDatabaseWorkWithSocial(dbWork, currentUserId)
      );
    }, 'getAllWorks');
    
    return result.data || [];
  },
  
  // ✅ Create work with validation
  async createWork(workData: UploadWork): Promise<ServiceResult<CreativeWork>> {
    
    return safeQuery(async () => {
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('❌ No user found');
        throw new Error('Not authenticated');
      }
      
      // Validation
      if (!workData.title?.trim()) {
        throw new Error('Title is required');
      }
      if (!workData.assetUrl) {
        throw new Error('Image is required');
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
      
      // Return the full work
      return this.getWork(data.id);
    }, 'createWork');
  },
  
  // ✅ Delete work with cleanup
  async deleteWork(workId: string): Promise<ServiceResult<void>> {
    return safeQuery(async () => {
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
  
  // ✅ Internal: Get basic work (no joins)
  async getWorkBasic(workId: string): Promise<CreativeWork> {
    const result = await safeQuery(async () => {
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single();
      
      if (error) throw error;
      return this.transformDatabaseWork(data);
    }, 'getWorkBasic');
    
    return result.data || createFallbackWork(workId);
  },
  
  // ✅ Get work with full context
  async getWorkWithContext(workId: string): Promise<WorkWithContext> {
    const result = await safeQuery(async () => {
      // Get work with artist
      const work = await this.getWork(workId);
      
      // Get additional context in parallel
      const [collaborations, remixes, originalWork] = await Promise.all([
        this.getWorkCollaborations(workId),
        this.getWorkRemixes(workId),
        work.originalWorkId ? this.getWork(work.originalWorkId) : Promise.resolve(undefined)
      ]);
      
      // Get siblings
      let siblings: CreativeWork[] = [];
      if (work.originalWorkId) {
        const { data } = await supabase
          .from('works')
          .select('*')
          .eq('original_work_id', work.originalWorkId)
          .neq('id', workId);
        
        siblings = data?.map(this.transformDatabaseWork) || [];
      }
      
      return {
        work,
        originalWork,
        collaborations: [...collaborations.asOriginal, ...collaborations.asDerivative],
        artist: work.artist,
        remixes,
        siblings
      };
    }, 'getWorkWithContext');
    
    // If failed, create minimal context
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
  async createRemix(remixData: DerivativeWorkData): Promise<ServiceResult<CreativeWork>> {
    return safeQuery(async () => {
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
  
  // ===== YOUR EXISTING TRANSFORMERS (keep these) =====
  transformDatabaseWork(dbWork: any): CreativeWork {
    return {
      id: dbWork.id,
      title: dbWork.title,
      description: dbWork.description,
      artistId: dbWork.artist_id,
      mediaType: dbWork.media_type,
      assetUrl: dbWork.asset_url,
      mediaConfig: dbWork.media_config || {} ,
      originalWorkId: dbWork.original_work_id,
      derivationChain: dbWork.derivation_chain || [],
      metadata: dbWork.metadata || {},
      tags: dbWork.tags || [],
      visibility: dbWork.visibility,
      createdAt: new Date(dbWork.created_at),
      updatedAt: new Date(dbWork.updated_at)
    };
  },
  
  transformDatabaseWorkWithSocial(dbWork: any, currentUserId?: string): CreativeWork {
    const baseWork = {
      ...this.transformDatabaseWork(dbWork),
      artist: transformDatabaseUser(dbWork.artist)
    };
    
    return {
      ...baseWork,
      likes: dbWork.likes?.map((like: any) => ({
        id: like.id,
        workId: dbWork.id,
        userId: like.user_id,
        createdAt: new Date(like.created_at),
        user: transformDatabaseUser(like.user)
      })) || [],
      comments: dbWork.comments?.map((comment: any) => ({
        id: comment.id,
        workId: dbWork.id,
        userId: comment.user_id,
        text: comment.text,
        createdAt: new Date(comment.created_at),
        user: transformDatabaseUser(comment.user)
      })) || [],
      userHasLiked: dbWork.likes?.some((like: any) => like.user_id === currentUserId) || false
    };
  },
  
  // ===== EXISTING HELPER METHODS =====
  async getWorkRemixes(workId: string): Promise<CreativeWork[]> {
    const result = await safeQuery(async () => {
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('original_work_id', workId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(this.transformDatabaseWork);
    }, 'getWorkRemixes');
    
    return result.data || [];
  },
  
  async getWorkCollaborations(workId: string): Promise<{
    asOriginal: Collaboration[];
    asDerivative: Collaboration[];
  }> {
    const result = await safeQuery(async () => {
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
        asOriginal: asOriginal.data?.map(transformCollab) || [],
        asDerivative: asDerivative.data?.map(transformCollab) || []
      };
    }, 'getWorkCollaborations');
    
    return result.data || { asOriginal: [], asDerivative: [] };
  }
};