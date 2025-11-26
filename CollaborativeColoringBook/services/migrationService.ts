// services/migrationService.ts
import { supabase } from '../lib/supabase';

export const migrationService = {
  async migrateArtworksToWorks(): Promise<void> {
    console.log('🔄 Migrating artworks to works...');
    
    try {
      // Get all existing artworks
      const { data: artworks, error } = await supabase
        .from('artworks')
        .select('*');
      
      if (error) {
        console.error('❌ Error fetching artworks:', error);
        return;
      }
      
      console.log(`📦 Found ${artworks?.length} artworks to migrate`);
      
      // Migrate each artwork to works table
      for (const artwork of artworks || []) {
        const workData = {
          id: artwork.id,
          title: artwork.title,
          description: artwork.description,
          artist_id: artwork.artist_id,
          media_type: 'line_art' as const,
          asset_url: artwork.line_art_url,
          media_config: {
            isColorable: true,
            complexity: 'medium'
          },
          derivation_chain: [],
          metadata: {},
          tags: [],
          created_at: artwork.created_at,
          updated_at: artwork.updated_at
        };
        
        const { error: insertError } = await supabase
          .from('works')
          .insert(workData);
        
        if (insertError) {
          console.error(`❌ Error migrating artwork ${artwork.id}:`, insertError);
        } else {
          console.log(`✅ Migrated artwork: ${artwork.title}`);
        }
      }
      
      console.log('✅ Artworks migration completed');
    } catch (error) {
      console.error('💥 Unexpected error in artworks migration:', error);
    }
  },
  
  async migrateColorizationsToWorksAndCollaborations(): Promise<void> {
    console.log('🔄 Migrating colorizations...');
    
    try {
      const { data: colorizations, error } = await supabase
        .from('colorized_versions')
        .select('*');
      
      if (error) {
        console.error('❌ Error fetching colorizations:', error);
        return;
      }
      
      console.log(`📦 Found ${colorizations?.length} colorizations to migrate`);
      
      for (const colorization of colorizations || []) {
        // Create the colored work
        const workData = {
          title: `Colored Version of ${colorization.artwork_id.slice(0, 8)}`,
          artist_id: colorization.colorist_id,
          media_type: 'colored_art' as const,
          asset_url: colorization.colored_image_url,
          media_config: {
            isColorable: true,
            originalLineArtId: colorization.artwork_id,
            technique: 'flat'
          },
          original_work_id: colorization.artwork_id,
          derivation_chain: [colorization.artwork_id],
          metadata: {},
          tags: ['colored'],
          created_at: colorization.created_at
        };
        
        const { data: newWork, error: workError } = await supabase
          .from('works')
          .insert(workData)
          .select()
          .single();
        
        if (workError) {
          console.error(`❌ Error creating work for colorization ${colorization.id}:`, workError);
          continue;
        }
        
        // Create collaboration record
        const collaborationData = {
          original_work_id: colorization.artwork_id,
          derived_work_id: newWork.id,
          collaboration_type: 'colorization' as const,
          context: {
            technique: 'fill'
          },
          description: 'Colorized version'
        };
        
        const { error: collabError } = await supabase
          .from('collaborations')
          .insert(collaborationData);
        
        if (collabError) {
          console.error(`❌ Error creating collaboration for ${newWork.id}:`, collabError);
        } else {
          console.log(`✅ Migrated colorization: ${newWork.id}`);
        }
      }
      
      console.log('✅ Colorizations migration completed');
    } catch (error) {
      console.error('💥 Unexpected error in colorizations migration:', error);
    }
  },
  
  async runFullMigration(): Promise<void> {
    console.log('🚀 Starting full database migration...');
    
    try {
      await this.migrateArtworksToWorks();
      await this.migrateColorizationsToWorksAndCollaborations();
      
      console.log('🎉 Full migration completed!');
      console.log('💡 You can now update your components to use the new worksService');
    } catch (error) {
      console.error('💥 Full migration failed:', error);
    }
  }
};