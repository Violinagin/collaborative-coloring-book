// services/storageService.ts - SIMPLIFIED VERSION
import { supabase } from '../lib/supabase';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

export const storageService = {
  async uploadArtworkImage(
    fileUri: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<ServiceResult<string>> {
    try {
      console.log('📤 Starting upload...');
      
      // For React Native, we need to handle file:// URIs differently
      let uploadUri = fileUri;
      
      // If it's a file:// URI, we need to use it as-is in FormData
      // React Native's FormData handles file:// URIs automatically
      
      const uriParts = fileUri.split('.');
      let fileExt = 'jpg';
      
      if (uriParts.length > 1) {
        const potentialExt = uriParts.pop()?.toLowerCase();
        if (potentialExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(potentialExt)) {
          fileExt = potentialExt;
        }
      }
      
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      // ALWAYS use FormData - it works on both platforms
      const formData = new FormData();
      
      // The structure React Native expects
      formData.append('file', {
        uri: uploadUri,
        type: `image/${fileExt}`,
        name: `upload.${fileExt}`,
      } as any);
      
      // Use Supabase Storage REST API directly
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials');
      }
      
      console.log('📤 Uploading to:', `${supabaseUrl}/storage/v1/object/artworks/${fileName}`);
      
      const response = await fetch(
        `${supabaseUrl}/storage/v1/object/artworks/${fileName}`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            // Let React Native set Content-Type automatically
          },
        }
      );
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Upload result:', result);
      
      // Construct public URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/artworks/${fileName}`;
      
      return {
        success: true,
        data: publicUrl,
        error: null
      };
      
    } catch (error: any) {
      console.error('💥 Upload failed:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Upload failed'
      };
    }
  },

  async deleteArtworkImage(fileUrl: string): Promise<void> {
    try {
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = urlParts[urlParts.length - 2] + '/' + fileName;
      
      const { error } = await supabase.storage
        .from('artworks')
        .remove([filePath]);
      
      if (error) throw error;
      
      console.log('✅ Image deleted:', filePath);
    } catch (error) {
      console.error('❌ Delete failed:', error);
      throw error;
    }
  }
};