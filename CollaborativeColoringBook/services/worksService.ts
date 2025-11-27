import { supabase } from '../lib/supabase';
import { CreativeWork, Collaboration, WorkWithContext, MediaType, MediaConfig, Artist, CreateWorkParams } from '../types/core';

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
    return this.transformDatabaseWork(data);
    
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
    // Get work with artist and collaborations
    const { data: workData, error } = await supabase
      .from('works')
      .select(`
        *,
        artist:users(*),
        collaborations:collaborations!derived_work_id(*)
      `)
      .eq('id', workId)
      .single();
    
    if (error) throw error;
    
    // Get original work if this is a derivative
    let originalWork = undefined;
    if (workData.original_work_id) {
      originalWork = await this.getWork(workData.original_work_id);
    }
    
    return {
      work: this.transformDatabaseWork(workData),
      originalWork,
      collaborations: workData.collaborations || [],
      artist: workData.artist
    };
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

  transformDatabaseArtist(dbArtist: any): Artist {
    return {
      id: dbArtist.id,
      username: dbArtist.username,
      display_name: dbArtist.display_name, // Keep database naming
      avatar_url: dbArtist.avatar_url,
      bio: dbArtist.bio
    };
  }
};