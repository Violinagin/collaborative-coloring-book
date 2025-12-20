// services/storageService.ts - FINAL OPTIMIZED VERSION
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

// Polyfill for atob if needed (React Native sometimes doesn't have it)
if (typeof atob === 'undefined') {
  (global as any).atob = function(b64: string) {
    return Buffer.from(b64, 'base64').toString('binary');
  };
}

// Helper functions
const getFileExtension = (uri: string): string => {
  const uriParts = uri.split('.');
  if (uriParts.length > 1) {
    const ext = uriParts.pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  return 'jpg';
};

const getContentType = (ext: string): string => {
  return {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  }[ext] || 'image/jpeg';
};

export const storageService = {
  async uploadArtworkImage(
    fileUri: string, 
    fileName?: string,
    onProgress?: (progress: number) => void
  ): Promise<ServiceResult<string>> {
    try {
      console.log('📤 Uploading image...');
      console.log('📱 Platform:', Platform.OS);

      const fileExt = getFileExtension(fileUri);
      const finalFileName = fileName || `artwork_${Date.now()}.${fileExt}`;
      const contentType = getContentType(fileExt);

      let fileData: Uint8Array | Blob;
      let fileSize: number;

      if (Platform.OS === 'web') {
        // WEB: Use fetch for Blob
        const response = await fetch(fileUri);
        const blob = await response.blob();
        fileData = blob;
        fileSize = blob.size;
      } else {
        // REACT NATIVE: Read file and convert to Uint8Array
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) throw new Error('File not found');
        
        fileSize = fileInfo.size || 0;
        
        // Validate file size
        if (fileSize > 5 * 1024 * 1024) {
          throw new Error(`File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB`);
        }

        // Read file as base64
        let base64: string;
        try {
          base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: 'base64' as any
          });
        } catch {
          // Fallback for older Expo versions
          const response = await fetch(fileUri);
          const blob = await response.blob();
          base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(blob);
          });
        }

        // Convert base64 to Uint8Array
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        fileData = bytes;
      }

      // Simulate progress
      if (onProgress) {
        onProgress(30);
        await new Promise(resolve => setTimeout(resolve, 200));
        onProgress(70);
      }

      console.log('📁 Uploading to Supabase storage...');
      
      // Use the supabase client directly
      const { data, error } = await supabase.storage
        .from('artworks')
        .upload(finalFileName, fileData, {
          contentType: contentType,
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }

      if (onProgress) onProgress(100);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('artworks')
        .getPublicUrl(data?.path || finalFileName);

      console.log('✅ Upload successful! URL:', urlData.publicUrl);
      
      return {
        success: true,
        data: urlData.publicUrl,
        error: null
      };

    } catch (error: any) {
      console.error('💥 Upload failed:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to upload image'
      };
    }
  },

  async deleteArtworkImage(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      // Handle both URL objects and string URLs
      let pathname: string;
      try {
        const url = new URL(fileUrl);
        pathname = url.pathname;
      } catch {
        // If it's not a valid URL, try to extract manually
        const urlParts = fileUrl.split('/');
        const storageIndex = urlParts.findIndex(part => part.includes('storage'));
        if (storageIndex !== -1) {
          pathname = '/' + urlParts.slice(storageIndex).join('/');
        } else {
          throw new Error('Invalid URL format');
        }
      }
      
      const pathParts = pathname.split('/');
      const filePath = pathParts.slice(3).join('/'); // Remove /storage/v1/object/
      
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