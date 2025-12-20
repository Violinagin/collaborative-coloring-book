// services/storageService.ts
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

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
          console.log('📤 Uploading image to storage...');
          
          let blob: Blob;
          
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            // REACT NATIVE: Convert file to ArrayBuffer via base64
            const base64 = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const arrayBuffer = decode(base64);
            
            // Convert ArrayBuffer to Blob for consistency
            const fileExt = this.getFileExtensionFromUri(fileUri);
            const contentType = this.getContentType(fileExt);
            blob = new Blob([arrayBuffer], { type: contentType });
          } else {
            // WEB: Use fetch
            const response = await fetch(fileUri);
            blob = await response.blob();
          }

     // Universal validation using blob (works on web and native)
     await this.validateImageBlob(blob, fileUri);

      let fileExt = 'jpg'; // default fallback
      
     // Handle blob URLs (web) vs file paths (native)
     if (fileUri.startsWith('blob:')) {
      // For blob URLs, detect extension from blob type
      if (blob.type) {
        const typeParts = blob.type.split('/');
        if (typeParts.length > 1 && typeParts[1] !== 'octet-stream') {
          fileExt = typeParts[1];
        }
      }
    } else {
      // For file paths, extract extension from URI
      const uriParts = fileUri.split('.');
      if (uriParts.length > 1) {
        const potentialExt = uriParts.pop()?.toLowerCase();
        if (potentialExt && ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(potentialExt)) {
          fileExt = potentialExt;
        }
      }
      
      // Fallback to blob type if URI extraction fails
      if (fileExt === 'jpg' && blob.type) {
        const typeParts = blob.type.split('/');
        if (typeParts.length > 1 && typeParts[1] !== 'octet-stream') {
          fileExt = typeParts[1];
        }
      }
    }
    
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    console.log('📁 Uploading to storage:', fileName, 'Type:', blob.type, 'Size:', `${(blob.size / 1024 / 1024).toFixed(2)}MB`);

      // Simulate progress updates (since Supabase doesn't have built-in progress for blobs)
      if (onProgress) {
        onProgress(25);
        await new Promise(resolve => setTimeout(resolve, 200));
        onProgress(50);
        await new Promise(resolve => setTimeout(resolve, 200));
        onProgress(75);
      }
          
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

      if (onProgress) {
        onProgress(100);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('artworks')
        .getPublicUrl(fileName);
      
      console.log('✅ Image uploaded to:', urlData.publicUrl);
      return {
        success: true,
        data: urlData.publicUrl,
        error: null
      };
      
    } catch (error: unknown) {
      console.error('💥 Image upload failed:', error);
      let errorMessage = 'Failed to upload image';
  
  // Check if it's an Error object
  if (error instanceof Error) {
    errorMessage = error.message;
  } 
  // Check if it's a string
  else if (typeof error === 'string') {
    errorMessage = error;
  }
  // Check if it has a message property
  else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as any).message);
  }
  
  return {
    success: false,
    data: null,
    error: errorMessage
  };
}
  },

  async validateImageBlob(blob: Blob, fileUri: string): Promise<void> {
    try {
      let fileExt = 'jpg';
      
      // Handle blob URLs vs file paths (SAME LOGIC AS UPLOAD FUNCTION)
      if (fileUri.startsWith('blob:')) {
        // For blob URLs, detect extension from blob type
        if (blob.type) {
          const typeParts = blob.type.split('/');
          if (typeParts.length > 1 && typeParts[1] !== 'octet-stream') {
            fileExt = typeParts[1];
          }
        }
      } else {
        // For file paths, extract extension from URI
        const uriParts = fileUri.split('.');
        if (uriParts.length > 1) {
          const potentialExt = uriParts.pop()?.toLowerCase();
          if (potentialExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(potentialExt)) {
            fileExt = potentialExt;
          }
        }
        
        // Fallback to blob type if URI extraction fails
        if (fileExt === 'jpg' && blob.type) {
          const typeParts = blob.type.split('/');
          if (typeParts.length > 1 && typeParts[1] !== 'octet-stream') {
            fileExt = typeParts[1];
          }
        }
      }
  
      const supportedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      if (!supportedTypes.includes(fileExt)) {
        throw new Error(`Unsupported file type: ${fileExt}. Supported: ${supportedTypes.join(', ')}`);
      }
  
      // File size validation using blob
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (blob.size > maxSize) {
        const fileSizeMB = (blob.size / 1024 / 1024).toFixed(1);
        throw new Error(`File too large: ${fileSizeMB}MB. Maximum size is 5MB.`);
      }
  
      console.log('✅ File validation passed:', {
        type: fileExt,
        size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
        source: fileUri.startsWith('blob:') ? 'blob URL' : 'file path'
      });
      
    } catch (error) {
      console.error('❌ File validation failed:', error);
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