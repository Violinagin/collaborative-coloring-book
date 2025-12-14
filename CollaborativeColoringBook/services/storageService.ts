// services/storageService.ts
import { supabase } from '../lib/supabase';

export const storageService = {
  async debugStorage(): Promise<void> {
    console.log('=== STORAGE DEBUG START ===');
    
    try {
      // 1. Check Supabase client
      console.log('1. Checking Supabase client...');
      console.log('Supabase object:', supabase);
      console.log('Has storage?', !!supabase.storage);
      console.log('Has auth?', !!supabase.auth);
      
      if (!supabase.storage) {
        throw new Error('Supabase storage not initialized');
      }
      
      // 2. Check authentication
      console.log('2. Checking authentication...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
      } else {
        console.log('✅ Auth session:', authData.session ? 'Exists' : 'None');
        if (authData.session) {
          console.log('   User ID:', authData.session.user.id);
        }
      }
      
      // 3. List buckets
      console.log('3. Listing storage buckets...');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('❌ Bucket list error:', bucketError);
        console.error('   Message:', bucketError.message);
        console.error('   Details:', bucketError);
      } else {
        console.log('✅ Available buckets:', buckets.map(b => b.name));
        
        // 4. Check artworks bucket
        const hasArtworks = buckets.some(b => b.name === 'artworks');
        console.log(hasArtworks ? '✅ Found "artworks" bucket' : '❌ Missing "artworks" bucket');
        
        if (hasArtworks) {
          // 5. Try to list files in artworks bucket
          console.log('4. Checking "artworks" bucket contents...');
          const { data: files, error: filesError } = await supabase.storage
            .from('artworks')
            .list();
          
          if (filesError) {
            console.error('❌ File list error:', filesError);
          } else {
            console.log(`✅ Bucket has ${files.length} files`);
          }
        }
      }
      
      // 6. Test file upload (if authenticated)
      if (authData?.session) {
        console.log('5. Testing upload...');
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const testPath = `test_${Date.now()}.txt`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('artworks')
          .upload(testPath, testBlob, {
            contentType: 'text/plain',
            upsert: false
          });
        
        if (uploadError) {
          console.error('❌ Upload test failed:', uploadError);
          console.error('   Error details:', {
            message: uploadError.message,
            name: uploadError.name,
            statusCode: uploadError
          });
        } else {
          console.log('✅ Upload test successful:', uploadData);
          
          // Clean up
          await supabase.storage
            .from('artworks')
            .remove([testPath]);
          console.log('✅ Test file cleaned up');
        }
      } else {
        console.log('ℹ️ Skipping upload test - not authenticated');
      }
      
    } catch (error: any) {
      console.error('💥 Debug error:', error);
      console.error('   Stack:', error.stack);
    }
    
    console.log('=== STORAGE DEBUG END ===');
  },
  async uploadArtworkImage(
    fileUri: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      console.log('📤 Uploading image to storage...');

     // Convert React Native file URI to blob
     const response = await fetch(fileUri);
     const blob = await response.blob();

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
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('💥 Image upload failed:', error);
      throw error;
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