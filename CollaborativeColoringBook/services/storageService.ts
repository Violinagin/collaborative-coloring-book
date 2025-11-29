// services/storageService.ts
import { supabase } from '../lib/supabase';

export const storageService = {
  async uploadArtworkImage(fileUri: string, userId: string): Promise<string> {
    try {
      console.log('📤 Uploading image to storage...');
      
      // Convert React Native file URI to blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      let fileExt = 'jpg'; // default fallback
      
      // Try to get extension from original URI
      const uriParts = fileUri.split('.');
      if (uriParts.length > 1) {
        const potentialExt = uriParts.pop()?.toLowerCase();
        if (potentialExt && ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(potentialExt)) {
          fileExt = potentialExt;
        }
      }
      
      // Alternative: detect from blob type
      if (blob.type) {
        const typeParts = blob.type.split('/');
        if (typeParts.length > 1 && typeParts[1] !== 'octet-stream') {
          fileExt = typeParts[1];
        }
      }
      
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      console.log('📁 Uploading to storage:', fileName, 'Type:', blob.type);
          
      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('artworks')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: false
        });
      
      if (error) {
        console.error('❌ Storage upload error:', error);
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('artworks')
        .getPublicUrl(fileName);
      
      console.log('✅ Image uploaded to:', urlData.publicUrl);
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('💥 Image upload failed:', error);
      throw error;
    }
  },

  async deleteArtworkImage(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = urlParts[urlParts.length - 2] + '/' + fileName;
      
      const { error } = await supabase.storage
        .from('artworks')
        .remove([filePath]);
      
      if (error) throw error;
      
      console.log('✅ Image deleted from storage:', filePath);
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  }
};