import { supabase } from '../lib/supabase';
import { 
  CreativeWork, 
  Collaboration, 
  WorkWithContext, 
  User, 
  UploadWork, 
  DerivativeWorkData, 
  CollaborationType,
  validateUploadWork } from '../types/core';
import { storageService } from '../services/storageService'
import { transformDatabaseUser, createFallbackUser } from '../utils/userTransformers';

export const worksService = {

  // === CORE WORK METHODS ===

  // Main method: Work with artist (what you'll use 90% of the time)
  async getWork(workId: string): Promise<CreativeWork> {
    console.log('🔍 Getting work with artist:', workId);
    
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
    
    if (error) {
      console.error('❌ Error getting work with artist:', error);
      throw error;
    }
    
    console.log('✅ Raw work with artist data:', {
      workId: data.id,
      hasArtist: !!data.artist,
      artistName: data.artist?.display_name
    });
    
    return {
      ...this.transformDatabaseWork(data),
      artist: transformDatabaseUser(data.artist)
    };
  },

  // All works for gallery (with artists and social data)
  async getAllWorks(): Promise<CreativeWork[]> {
    console.log('🔍 Getting all works with artists');
    return this.getWorksWithSocialData();
  },
  
  // Basic work without joins (for performance when you don't need artist)
  async getWorkBasic(workId: string): Promise<CreativeWork> {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('id', workId)
      .single();
    
    if (error) throw error;
    return this.transformDatabaseWork(data);
  },
  
  // Work with full context (for detail pages)
  async getWorkWithContext(workId: string): Promise<WorkWithContext> {
    console.log('🔍 Getting work with full context:', workId);
    
    // Get work with artist first
    const work = await this.getWork(workId);
    
    // Get additional context in parallel
    const [collaborations, remixes, originalWork] = await Promise.all([
      this.getWorkCollaborations(workId),
      this.getWorkRemixes(workId),
      work.originalWorkId ? this.getWork(work.originalWorkId).catch(() => undefined) : Promise.resolve(undefined)
    ]);

    // Get siblings (other works from same original)
    let siblings: CreativeWork[] = [];
    if (work.originalWorkId) {
      try {
        const { data } = await supabase
          .from('works')
          .select('*')
          .eq('original_work_id', work.originalWorkId)
          .neq('id', workId);
        
        siblings = data?.map(this.transformDatabaseWork) || [];
      } catch (error) {
        console.warn('Could not load siblings:', error);
      }
    }

    return {
      work, // Already includes artist
      originalWork,
      collaborations: [...collaborations.asOriginal, ...collaborations.asDerivative],
      artist: work.artist, // Same reference as work.artist
      remixes,
      siblings
    };
  },
  
  // Colorable works only
  async getColorableWorks(): Promise<CreativeWork[]> {
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
      .or('media_type.eq.line_art,media_type.eq.colored_art')
      .eq('visibility', 'public');
    
    if (error) throw error;
    return data.map(dbWork => ({
      ...this.transformDatabaseWork(dbWork),
      artist: transformDatabaseUser(dbWork.artist)
    }));
  },

  // === TRANSFORMERS ===
  
  transformDatabaseWork(dbWork: any): CreativeWork {
    console.log('🔄 Transforming db work:', dbWork);
  console.log('🆔 DB work ID:', dbWork.id);
    return {
      id: dbWork.id,
      title: dbWork.title,
      description: dbWork.description,
      artistId: dbWork.artist_id,
      mediaType: dbWork.media_type,
      assetUrl: dbWork.asset_url,
      mediaConfig: dbWork.media_config,
      originalWorkId: dbWork.original_work_id,
      derivationChain: dbWork.derivation_chain || [],
      metadata: dbWork.metadata || {},
      tags: dbWork.tags || [],
      visibility: dbWork.visibility,
      createdAt: new Date(dbWork.created_at),
      updatedAt: new Date(dbWork.updated_at)
    };
  },

  // === SOCIAL DATA METHODS ===

  async getWorksWithSocialData(): Promise<CreativeWork[]> {
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

      if (error) {
        console.error('❌ Error getting works with social data:', error);
        throw error;
      }

      // Debug: Check first work
    if (data.length > 0) {
      console.log('📊 First work artist data:', data[0]?.artist);
    }

    // Deduplicate
    const uniqueWorksMap = new Map();
    data.forEach(dbWork => {
      if (!uniqueWorksMap.has(dbWork.id)) {
        uniqueWorksMap.set(dbWork.id, dbWork);
      }
    });
    
    // Convert map back to array
    const uniqueData = Array.from(uniqueWorksMap.values());
    
    console.log(`📊 Deduplicated: ${data.length} → ${uniqueData.length} works`);
    
    return uniqueData.map(dbWork => 
      this.transformDatabaseWorkWithSocial(dbWork, currentUserId)
    );
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

  // === CREATE/UPDATE METHODS ===

  async createWork(workData: UploadWork): Promise<CreativeWork> {

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    // Optional: Add runtime validation
    const validation = validateUploadWork(workData);
    if (!validation.isValid) {
    throw new Error(`Invalid work data: ${validation.error}`);
    }

    let derivationChain: string[] = [];
    const metadata = {};
    
    // Build derivation chain if this is a derivative work
    if (workData.originalWorkId) {
      const originalWork = await this.getWorkBasic(workData.originalWorkId);
      derivationChain = [...originalWork.derivationChain, workData.originalWorkId];
    }
    
    const work = {
      title: workData.title,
      description: workData.description,
      media_type: workData.mediaType,        
      asset_url: workData.assetUrl,          
      media_config: workData.mediaConfig,    
      original_work_id: workData.originalWorkId, 
      artist_id: userData.user.id,           
      derivation_chain: derivationChain,
      tags: workData.tags || [],
      visibility: workData.visibility || 'public',
      metadata: metadata
    };
    
    const { data, error } = await supabase
      .from('works')
      .insert(work)
      .select()
      .single();
    
    if (error) throw error;
  // Return the created work with artist data
  return this.getWork(data.id);
    
  },

  async deleteWork(workId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First, get the work to verify ownership and get the asset URL
    const work = await this.getWorkBasic(workId);
    
    // Check if the current user is the artist
    if (work.artistId !== user.id) {
      throw new Error('You can only delete your own artworks');
    }

    // Delete the work from database
    const { error: workError } = await supabase
      .from('works')
      .delete()
      .eq('id', workId)
      .eq('artist_id', user.id); // Double-check ownership

    if (workError) throw workError;

    // Delete the associated image from storage
    try {
      await storageService.deleteArtworkImage(work.assetUrl);
    } catch (storageError) {
      console.warn('⚠️ Could not delete image from storage:', storageError);
      // Continue even if storage deletion fails
    }

    console.log('✅ Work deleted successfully:', workId);
  },

  async createRemix(remixData: DerivativeWorkData): Promise<CreativeWork> {
    const { data: userData } = await supabase.auth.getUser();
  
    if (!userData.user) throw new Error('Not authenticated');

    // Get the original work
    const originalWork = await this.getWork(remixData.originalWorkId);

    // Create the remix work - NO VALIDATION!
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

    const work = await this.createWork(uploadWork);

  // Create collaboration record
  await this.createCollaborationRecord({
    originalWorkId: remixData.originalWorkId,
    derivedWorkId: work.id,
    collaborationType: remixData.remixType || 'remix',
    description: remixData.attribution || `Remix of "${originalWork.title}"`
  });

  console.log('✅ Remix created successfully:', {
    original: originalWork.title,
    remix: work.title,
    type: remixData.remixType
  });

  return work;
},

// === COLLABORATION METHODS ===

  async createCollaborationRecord(collabData: {
    originalWorkId: string;
    derivedWorkId: string;
    collaborationType: CollaborationType;
    description?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('collaborations')
      .insert({
        original_work_id: collabData.originalWorkId,
        derived_work_id: collabData.derivedWorkId,
        collaboration_type: collabData.collaborationType,
        description: collabData.description,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Failed to create collaboration:', error);
      throw error;
    }
  },

  async getWorkRemixes(workId: string): Promise<CreativeWork[]> {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('original_work_id', workId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.transformDatabaseWork);
  },

  async getWorkCollaborations(workId: string): Promise<{
    asOriginal: Collaboration[];  // Works where this is the original
    asDerivative: Collaboration[]; // Works where this is the remix
  }> {
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
  },

  // Helper to get artist (rarely needed since works include artist)

  async getWorkArtist(artistId: string): Promise<User>  {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', artistId)
      .single();

      if (error) {
        console.error('❌ Error fetching artist:', error);
        // Return a default user instead of throwing
        return {
          id: artistId,
          username: 'Unknown Artist',
          displayName: 'Unknown Artist',
          avatarUrl: undefined,
          bio: '',
          roles: ['supporter'],
          joinedDate: new Date(),
        };
      }
      
      return transformDatabaseUser(data);
    },
};