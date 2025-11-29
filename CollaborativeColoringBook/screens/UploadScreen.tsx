// screens/UploadScreen.tsx - PROPERLY UPDATED VERSION
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { worksService } from '../services/worksService';
import { useAuth } from '../context/AuthContext';
import { MediaType, CreateWorkParams } from '../types/core';
import { AlertModal } from '../components/AlertModal';
import { storageService } from '../services/storageService';

// Helper function to create properly typed work parameters
const createWorkParams = (
  mediaType: MediaType,
  title: string,
  description: string,
  assetUrl: string
): CreateWorkParams => {
  const baseParams = {
    title: title.trim(),
    description: description.trim(),
    assetUrl,
    tags: [],
    visibility: 'public' as const
  };

  switch (mediaType) {
    case 'line_art':
      return {
        ...baseParams,
        mediaType: 'line_art',
        mediaConfig: {
          isColorable: true,
          complexity: 'medium'
        }
      };
      
    case 'colored_art':
      return {
        ...baseParams,
        mediaType: 'colored_art', 
        mediaConfig: {
          isColorable: true,
          technique: 'flat',
          complexity: 'medium'
        }
      };
      
    case 'digital_art':
    default:
      return {
        ...baseParams,
        mediaType: 'digital_art',
        mediaConfig: {
          isColorable: false,
          style: 'painting'
        }
      };
  }
};

const UploadScreen = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('line_art');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        console.log('✅ Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      showModal('Error', 'Failed to select image', 'error');
    }
  };

  const handleUpload = async () => {
    if (!user) {
      showModal('Error', 'Please log in to upload works', 'error');
      return;
    }
  
    if (!title.trim() || !imageUri) {
      showModal('Error', 'Please add a title and image', 'error');
      return;
    }
  
    setUploading(true);
    try {
      console.log('🚀 Starting upload flow for user:', user.id);
      
      // ✅ STEP 1: Upload image to Supabase Storage using storageService
      console.log('📤 Step 1: Uploading image to storage...');
      const storageImageUrl = await storageService.uploadArtworkImage(imageUri, user.id);
      
      console.log('✅ Image uploaded to storage:', storageImageUrl);
      
      // ✅ STEP 2: Create work record using worksService
      console.log('📝 Step 2: Creating work record...');
      
      let createWorkParams;
  
      // Build the correct parameters based on media type
      switch (mediaType) {
        case 'line_art':
          createWorkParams = {
            title: title.trim(),
            description: description.trim(),
            mediaType: 'line_art' as const,
            assetUrl: storageImageUrl,
            mediaConfig: {
              isColorable: true,
              complexity: 'medium' as const
            },
            tags: [],
            visibility: 'public' as const
          };
          break;
          
        case 'colored_art':
          createWorkParams = {
            title: title.trim(),
            description: description.trim(),
            mediaType: 'colored_art' as const,
            assetUrl: storageImageUrl,
            mediaConfig: {
              isColorable: true,
              technique: 'flat' as const,
              complexity: 'medium'
            },
            tags: [],
            visibility: 'public' as const
          };
          break;
          
        case 'digital_art':
        default:
          createWorkParams = {
            title: title.trim(),
            description: description.trim(),
            mediaType: 'digital_art' as const,
            assetUrl: storageImageUrl,
            mediaConfig: {
              isColorable: false,
              style: 'painting' as const
            },
            tags: [],
            visibility: 'public' as const
          };
          break;
      }
  
      console.log('📦 Work data being created:', createWorkParams);
      
      // ✅ Use worksService to create the work record
      const work = await worksService.createWork(createWorkParams);
      
      console.log('🎉 Work created successfully!');
      console.log('🆔 Work ID:', work.id);
      console.log('🖼️ Work assetUrl:', work.assetUrl);
      console.log('📊 Work mediaType:', work.mediaType);
  
      showModal('Success!', 'Your artwork has been uploaded and is now live in the gallery!', 'success');
      
      // Reset form on success
      setTitle('');
      setDescription('');
      setImageUri(null);
      setMediaType('line_art');
      
    } catch (error: any) {
      console.error('💥 Upload failed:', error);
      const errorMessage = error?.message || 'Please try again.';
      showModal('Upload Failed', `Failed to upload artwork: ${errorMessage}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upload Creative Work</Text>
      
      <AlertModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={hideModal}
      />
      
      {/* Media Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Media Type</Text>
        <Text style={styles.sectionDescription}>
          Choose the type of artwork you're uploading
        </Text>
        <View style={styles.mediaTypeGrid}>
          {(['line_art', 'colored_art', 'digital_art'] as MediaType[]).map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.mediaTypeButton,
                mediaType === type && styles.mediaTypeButtonSelected
              ]}
              onPress={() => setMediaType(type)}
            >
              <Text style={[
                styles.mediaTypeText,
                mediaType === type && styles.mediaTypeTextSelected
              ]}>
                {type === 'line_art' ? '🎨 Line Art' :
                 type === 'colored_art' ? '🌈 Colored Art' :
                 '✨ Digital Art'}
              </Text>
              <Text style={styles.mediaTypeDescription}>
                {type === 'line_art' ? 'Others can color this' :
                 type === 'colored_art' ? 'Already colored artwork' :
                 'Finished digital artwork'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Image Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Image</Text>
        <Text style={styles.sectionDescription}>
          Select a high-quality image of your artwork
        </Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <View style={styles.imageSelected}>
              <Text style={styles.imagePickerText}>✓ Image Selected</Text>
              <Text style={styles.imagePickerSubtext}>Tap to change</Text>
            </View>
          ) : (
            <View style={styles.imageNotSelected}>
              <Text style={styles.imagePickerText}>📷 Tap to Select Image</Text>
              <Text style={styles.imagePickerSubtext}>PNG, JPG, or WebP</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Work Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Give your artwork a title..."
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your artwork (optional)..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      {/* Upload Button */}
      <TouchableOpacity 
        style={[
          styles.uploadButton,
          (!title.trim() || !imageUri || uploading) && styles.uploadButtonDisabled
        ]}
        onPress={handleUpload}
        disabled={!title.trim() || !imageUri || uploading}
      >
        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator color="white" size="small" />
            <Text style={styles.uploadButtonText}>Uploading...</Text>
          </View>
        ) : (
          <Text style={styles.uploadButtonText}>
            🚀 Upload {mediaType === 'line_art' ? 'Line Art' : 
                   mediaType === 'colored_art' ? 'Colored Art' : 'Digital Art'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Upload Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Upload Tips</Text>
        <Text style={styles.tip}>• Use square images for best results</Text>
        <Text style={styles.tip}>• High-quality PNG works best for coloring</Text>
        <Text style={styles.tip}>• Add descriptive titles to help others find your work</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  mediaTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaTypeButton: {
    flex: 1,
    minWidth: 100,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mediaTypeButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e7f3ff',
  },
  mediaTypeText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  mediaTypeTextSelected: {
    color: '#007AFF',
  },
  mediaTypeDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  imagePicker: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imageSelected: {
    alignItems: 'center',
  },
  imageNotSelected: {
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  tip: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default UploadScreen;