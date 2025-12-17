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
      console.log('📤 Uploading image directly to Supabase Storage...');

      // 1. Extract file info
      const uriParts = fileUri.split('.');
      let fileExt = 'jpg';
      if (uriParts.length > 1) {
        const ext = uriParts.pop()?.toLowerCase();
        if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
          fileExt = ext;
        }
      }
      
      // Create a unique file path in the storage bucket
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      console.log('📁 Target path:', fileName);

      // 2. Prepare the file for Supabase (React Native compatible)
      // Important: The Supabase client expects a Blob or File for the .upload() method.
      // In React Native, we use fetch() on the local file URI to get a response,
      // then call .blob() on that response.
      const response = await fetch(fileUri);
      const fileBlob = await response.blob(); // This is the key step

      // 3. Upload the Blob directly to the 'artworks' bucket
      const { data, error } = await supabase.storage
        .from('artworks') // Make sure this bucket exists!
        .upload(fileName, fileBlob, {
          contentType: fileBlob.type, // Automatically set from the Blob
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase storage upload error:', error);
        throw error; // Let the catch block handle it
      }

      // 4. Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('artworks')
        .getPublicUrl(fileName);

      console.log('✅ Direct upload successful. Public URL:', publicUrl);
      return {
        success: true,
        data: publicUrl,
        error: null
      };
      
    } catch (error: any) {
      console.error('💥 Upload failed:', error);
      // Your existing error handling logic here
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