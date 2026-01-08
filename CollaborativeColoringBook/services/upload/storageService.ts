// services/storageService.ts - FINAL OPTIMIZED VERSION
import { getSupabase } from '../../lib/supabase';
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

export type UploadController = {
  cancel: () => void;
  isCancelled: boolean;
};

export const storageService = {
  // Store active upload controllers
  activeUploads: new Map<string, UploadController>(),

  async uploadArtworkImage(
    fileUri: string, 
    fileName?: string,
    onProgress?: (progress: number) => void
  ): Promise<ServiceResult<string>> {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const abortController = new AbortController();
    
    // Create upload controller
    const uploadController: UploadController = {
      cancel: () => {
        console.log(`🚫 Cancelling upload: ${uploadId}`);
        abortController.abort();
        uploadController.isCancelled = true;
        this.activeUploads.delete(uploadId);
      },
      isCancelled: false
    };
  
    // Store the controller
    this.activeUploads.set(uploadId, uploadController);
  
    try {

      const fileExt = getFileExtension(fileUri);
      const finalFileName = fileName || `artwork_${Date.now()}.${fileExt}`;
      const contentType = getContentType(fileExt);

      let fileData: Uint8Array | Blob;
      let fileSize: number;

      if (Platform.OS === 'web') {
        // WEB: Use fetch for Blob
        const response = await fetch(fileUri, {
          signal: abortController.signal
        });
        
        // Check if cancelled during fetch
        if (uploadController.isCancelled) {
          throw new Error('Upload cancelled');
        }
        const blob = await response.blob();
        fileData = blob;
        fileSize = blob.size;
      } else {
        // REACT NATIVE: Read file and convert to Uint8Array
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) throw new Error('File not found');
        
       // Check if cancelled
      if (uploadController.isCancelled) {
        throw new Error('Upload cancelled');
      }

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
          // Fallback for older Expo versions - with abort signal
          const response = await fetch(fileUri, {
            signal: abortController.signal
          });
          
          if (uploadController.isCancelled) {
            throw new Error('Upload cancelled');
          }
          
          const blob = await response.blob();
          base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (uploadController.isCancelled) {
                reject(new Error('Upload cancelled'));
                return;
              }
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(blob);
          });
        }

        // Check if cancelled during file reading
        if (uploadController.isCancelled) {
          throw new Error('Upload cancelled');
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
        if (uploadController.isCancelled) {
          throw new Error('Upload cancelled');
        }
        onProgress(70);
      }
      
      if (uploadController.isCancelled) {
        throw new Error('Upload cancelled');
      }
      const supabase = getSupabase();
      const { data, error } = await supabase.storage
        .from('artworks')
        .upload(finalFileName, fileData, {
          contentType: contentType,
          upsert: false
        });

      // Check if cancelled during upload
      if (uploadController.isCancelled) {
        throw new Error('Upload cancelled');
      }

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }

      if (onProgress) onProgress(100);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('artworks')
        .getPublicUrl(data?.path || finalFileName);

      // Clean up
      this.activeUploads.delete(uploadId);
      abortController.abort();
      
      return {
        success: true,
        data: urlData.publicUrl,
        error: null
      };

    } catch (error: any) {
      // Clean up on error
      this.activeUploads.delete(uploadId);

      if (!abortController.signal.aborted) {
        abortController.abort();
      }

    console.error('💥 Upload failed:', error);

      // Special handling for cancellation
      if (uploadController.isCancelled || error.name === 'AbortError') {
        console.log('ℹ️ Upload was cancelled by user');
        return {
          success: false,
          data: null,
          error: 'Upload cancelled'
        };
      }  
      
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to upload image'
      };
    }
  },

  // Method to cancel a specific upload
  cancelUpload(uploadId: string): boolean {
    const controller = this.activeUploads.get(uploadId);
    if (controller) {
      controller.cancel();
      return true;
    }
    return false;
  },

  // Method to cancel all active uploads
  cancelAllUploads(): void {
    console.log(`🚫 Cancelling ${this.activeUploads.size} active upload(s)`);
    this.activeUploads.forEach(controller => controller.cancel());
    this.activeUploads.clear();
  },

  // Check if an upload is in progress
  isUploadInProgress(uploadId: string): boolean {
    return this.activeUploads.has(uploadId);
  },

  // Get all active upload IDs
  getActiveUploads(): string[] {
    return Array.from(this.activeUploads.keys());
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
      const supabase = getSupabase();
      const { error } = await supabase.storage
        .from('artworks')
        .remove([filePath]);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('❌ Delete failed:', error);
      throw error;
    }
  }
};