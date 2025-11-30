import { supabase } from '../lib/supabase';
import { CreativeWork, Collaboration, WorkWithContext, MediaType, MediaConfig, User, CreateWorkParams } from '../types/core';
import { storageService } from '../services/storageService'

export const worksService = {
  async createWork(workData: CreateWorkParams): Promise<CreativeWork> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');
    
    // Build derivation chain if this is a derivative work
    let derivationChain: string[] = [];
    if (workData.originalWorkId) {
      const originalWork = await this.getWork(workData.originalWorkId);
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
      metadata: {}
    };
    
    const { data, error } = await supabase
      .from('works')
      .insert(work)
      .select()
      .single();

      console.log('📦 Database response:', data);
      console.log('🆔 Database work ID:', data?.id);
    
    if (error) throw error;
    const transformed = this.transformDatabaseWork(data);
  console.log('🔄 Transformed work:', transformed);
  console.log('🆔 Transformed work ID:', transformed.id);
    return transformed;
    
  },
  
  async getWork(workId: string): Promise<CreativeWork> {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('id', workId)
      .single();
    
    if (error) throw error;
    return this.transformDatabaseWork(data);
  },
  
  async getWorksWithContext(workId: string): Promise<WorkWithContext> {
    try {
      console.log('🔍 Fetching work with context for ID:', workId);
      
      const { data: workData, error } = await supabase
        .from('works')
        .select(`
          *,
          artist:users(*),
          collaborations:collaborations!derived_work_id(*)
        `)
        .eq('id', workId);
  
      if (error) {
        console.error('❌ Error fetching work with context:', error);
        throw error;
      }
  
      if (!workData || workData.length === 0) {
        console.error('❌ No work found with ID:', workId);
        throw new Error('Work not found');
      }
  
      // Take the first element since we're querying by unique ID
      const work = workData[0];
      
      console.log('✅ Raw work data:', work);
      console.log('👤 Raw artist data:', work.artist);
      console.log('🤝 Raw collaborations:', work.collaborations);
  
      // Transform the main work first
      const transformedWork = this.transformDatabaseWork(work);
      
      // Get original work if this is a derivative
      let originalWork = undefined;
      if (work.original_work_id) {
        try {
          originalWork = await this.getWork(work.original_work_id);
        } catch (error) {
          console.error('❌ Error fetching original work:', error);
        }
      }
  
      // Transform artist and collaborations
      const artist = this.transformDatabaseUser(work.artist);
      const collaborations: Collaboration[] = (work.collaborations || []).map((collab: any) => ({
        id: collab.id,
        originalWorkId: collab.original_work_id,
        derivedWorkId: collab.derived_work_id,
        collaborationType: collab.collaboration_type,
        context: collab.context || {},
        description: collab.description,
        attribution: collab.attribution || 'Inspired by',
        createdAt: new Date(collab.created_at),
      }));
  
      console.log('✅ Final transformed data:', {
        workTitle: transformedWork.title,
        artistName: artist?.displayName,
        assetUrl: transformedWork.assetUrl,
        collaborationsCount: collaborations.length
      });
  
      return {
        work: transformedWork,
        originalWork,
        collaborations,
        artist
      };
    } catch (error) {
      console.error('❌ Error in getWorksWithContext:', error);
      throw error;
    }
  },
  
  async getColorableWorks(): Promise<CreativeWork[]> {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .or('media_type.eq.line_art,media_type.eq.colored_art')
      .eq('visibility', 'public');
    
    if (error) throw error;
    return data.map(this.transformDatabaseWork);
  },
  
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

  transformDatabaseUser(dbArtist: any): User | undefined {
    if (!dbArtist) {
      console.log('👤 No artist data provided');
      return undefined;
    }
  
    console.log('👤 Transforming artist:', dbArtist);
  
    return {
      id: dbArtist.id,
      username: dbArtist.username,
      displayName: dbArtist.display_name,
      avatarUrl: dbArtist.avatar_url,
      bio: dbArtist.bio || '',
      roles: dbArtist.roles || ['supporter'], 
      joinedDate: new Date(dbArtist.joined_date || dbArtist.created_at || Date.now()),
      uploadedArtworks: dbArtist.uploaded_artworks || [],
      colorizedVersions: dbArtist.colorized_versions || [],
      likedArtworks: dbArtist.liked_artworks || []
    };
  },

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

    if (error) throw error;

    return data.map(dbWork => this.transformDatabaseWorkWithSocial(dbWork, currentUserId));
  },

  transformDatabaseWorkWithSocial(dbWork: any, currentUserId?: string): CreativeWork {
    const baseWork = this.transformDatabaseWork(dbWork);
    
    return {
      ...baseWork,
      artist: this.transformDatabaseUser(dbWork.artist), // ✅ Use the transformer
      likes: dbWork.likes?.map((like: any) => ({
        id: like.id,
        workId: dbWork.id,
        userId: like.user_id,
        createdAt: new Date(like.created_at),
        user: this.transformDatabaseUser(like.user) // ✅ Use the transformer
      })) || [],
      comments: dbWork.comments?.map((comment: any) => ({
        id: comment.id,
        workId: dbWork.id,
        userId: comment.user_id,
        text: comment.text,
        createdAt: new Date(comment.created_at),
        user: this.transformDatabaseUser(comment.user) // ✅ Use the transformer
      })) || [],
      userHasLiked: dbWork.likes?.some((like: any) => like.user_id === currentUserId) || false
    };
  },
  async deleteWork(workId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First, get the work to verify ownership and get the asset URL
    const work = await this.getWork(workId);
    
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
};