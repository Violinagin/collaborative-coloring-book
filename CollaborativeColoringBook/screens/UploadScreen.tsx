// screens/UploadScreen.tsx - PROPERLY UPDATED VERSION
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image,
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { worksService } from '../services/worksService';
import { useAuth } from '../context/AuthContext';
import { UploadableMediaType, CreativeWork, UploadWork, DerivativeWorkData, RemixType } from '../types/core';
import { AlertModal } from '../components/AlertModal';
import { storageService } from '../services/storageService';
import { useRoute } from '@react-navigation/native';
import { MediaType } from '../types/core';
import { mediaUtils, UploadableMediaTypeConfig } from '../utils/mediaUtils';

interface RouteParams {
  originalWorkId?: string;
  originalWork?: CreativeWork;
  remixType?: RemixType;
  suggestedMediaType?: string;
}

const UploadScreen = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const route = useRoute();
  const params = route.params as {
    originalWorkId?: string;
    originalWork?: CreativeWork;
  } || {};
  const [mediaType, setMediaType] = useState<UploadableMediaType>('line_art');
  const isRemix = !!params.originalWorkId;
  const originalWork = params.originalWork;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const UPLOADABLE_MEDIA_TYPES = mediaUtils.getUploadableMediaTypeConfigs();
  
  
  
  
  const createUploadWorkData = (
    title: string,
    description: string,
    storageImageUrl: string,
    mediaType: UploadableMediaType
  ): UploadWork => {
    const base = {
      title: title.trim(),
      description: description.trim(),
      assetUrl: storageImageUrl,
      originalWorkId: undefined as string | undefined,
      tags: [] as string[],
      visibility: 'public' as const,
      mediaType: mediaType,
    };
  
    // Create objects with exact types first, then cast
    if (mediaType === 'line_art') {
      const lineArtWork = {
        ...base,
        mediaType: 'line_art' as const,
        mediaConfig: {
          isColorable: true,
          complexity: 'medium' as const
        }
      };
      // Cast to the specific union member
      return lineArtWork as typeof lineArtWork & UploadWork;
    }
    
    if (mediaType === 'colored_art') {
      const coloredArtWork = {
        ...base,
        mediaType: 'colored_art' as const,
        mediaConfig: {
          isColorable: true,
          technique: 'flat' as const,
          complexity: 'medium' as const
        }
      };
      return coloredArtWork as typeof coloredArtWork & UploadWork;
    }
    
    // digital_art
    const digitalArtWork = {
      ...base,
      mediaType: 'digital_art' as const,
      mediaConfig: {
        isColorable: false,
        style: 'painting' as const
      }
    };
    return digitalArtWork as typeof digitalArtWork & UploadWork;
  };

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
        quality: .8,
      });

      if (!result.canceled) {
        const selectedUri = result.assets[0].uri;
      setImageUri(selectedUri);
      console.log('✅ Image selected:', selectedUri);
    }
  } catch (error) {
    console.error('❌ Error picking image:', error);
    showModal('Error', 'Failed to select image. Please try again.', 'error');
  }
};

  // Form validation
  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'Please enter a title for your artwork';
    }
    
    if (title.trim().length < 2) {
      return 'Title must be at least 2 characters long';
    }
    
    if (title.trim().length > 100) {
      return 'Title must be less than 100 characters';
    }
    
    if (description.trim().length > 500) {
      return 'Description must be less than 500 characters';
    }
    
    if (!imageUri) {
      return 'Please select an image';
    }
    
    return null; // No errors
  };


  const handleUpload = async () => {
    
    if (!user) {
      showModal('Error', 'Please log in to upload works', 'error');
      return;
    }
     // Validate form
     const validationError = validateForm();
     if (validationError) {
       showModal('Validation Error', validationError, 'error');
       return;
     }
  
    setUploading(true);
    setShowProgress(true);
    setUploadProgress(0);


    
    try {
      console.log('🚀 Starting upload flow for user:', user.id);
      
      // Upload with Progress
      console.log('📤 Step 1: Uploading image to storage...');
      const storageImageUrl = await storageService.uploadArtworkImage(
        imageUri!, 
        user.id,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      console.log('✅ Image uploaded to storage:', storageImageUrl);

      const workData: UploadWork = createUploadWorkData(
        title,
        description,
        storageImageUrl,
        mediaType
      );

      let createdWork: CreativeWork;
    
      if (isRemix && originalWork) {
        // Create as remix
        const remixData: DerivativeWorkData = {
          ...workData,
          originalWorkId: originalWork.id,
          remixType: 'remix',
          attribution: `Inspired by "${originalWork.title}" by ${originalWork.artist?.displayName}`
        };
        createdWork = await worksService.createRemix(remixData);
      } else {
        // Create as original work
        createdWork = await worksService.createWork(workData);
      
      console.log('📦 Work data being created:', workData);
      
      // Use worksService to create the work record
      
      console.log('🎉 Work created successfully!');
      console.log('🆔 Work ID:', createdWork.id);
      console.log('🖼️ Work assetUrl:', createdWork.assetUrl);
  
      showModal('Success!', 'Your artwork has been uploaded and is now live in the gallery!', 'success');
      
      // Reset form on success
      setTitle('');
      setDescription('');
      setImageUri(null);
      setMediaType('line_art');
      
    }

      
    } catch (error: any) {
      console.error('💥 Upload failed:', error);
      const errorMessage = error?.message || 'Please try again.';
      showModal('Upload Failed', `Failed to upload artwork: ${errorMessage}`, 'error');
    } finally {
      setUploading(false);
      setShowProgress(false);
      setUploadProgress(0);
    }
  };

  return (
    <ScrollView style={styles.container}>
       {isRemix && originalWork && (
        <View style={styles.remixHeader}>
          <Text style={styles.remixTitle}>
            🎨 Creating a Remix
          </Text>
          <Text style={styles.remixSubtitle}>
            Based on "{originalWork.title}"
          </Text>
        </View>
      )}
      <Text style={styles.title}>Upload Creative Work</Text>
      
      <AlertModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={hideModal}
      />

       {/* Progress Bar */}
       {showProgress && (
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${uploadProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressPercentage}>{uploadProgress}%</Text>
        </View>
      )}
      
      {/* Media Type Selection */}
      <View style={styles.section}>
  <Text style={styles.sectionTitle}>Media Type</Text>
  <Text style={styles.sectionDescription}>
    What kind of creative work is this?
  </Text>
  
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    style={styles.mediaTypeScroll}
    contentContainerStyle={styles.mediaTypeScrollContent}
  >
    {UPLOADABLE_MEDIA_TYPES.map((config: UploadableMediaTypeConfig) => (
      <TouchableOpacity
        key={config.value}
        style={[
          styles.mediaTypeOption,
          mediaType === config.value && styles.mediaTypeOptionSelected
        ]}
        onPress={() => setMediaType(config.value)}
      >
        <Text style={[
          styles.mediaTypeOptionEmoji,
          mediaType === config.value && styles.mediaTypeOptionEmojiSelected
        ]}>
          {config.emoji}
        </Text>
        <Text style={[
          styles.mediaTypeOptionLabel,
          mediaType === config.value && styles.mediaTypeOptionLabelSelected
        ]}>
          {config.label}
        </Text>
        <Text style={styles.mediaTypeOptionDescription}>
          {config.description}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
  
  {/* Show selected option details */}
  <View style={styles.selectedTypeInfo}>
    <Text style={styles.selectedTypeTitle}>
      {mediaUtils.getMediaTypeLabel(mediaType)}
    </Text>
    <Text style={styles.selectedTypeDescription}>
      {mediaUtils.getMediaTypeDescription(mediaType)}
    </Text>
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
    <View style={styles.imagePreviewContainer}>
      <Image 
        source={{ uri: imageUri }} 
        style={styles.imagePreview}
        resizeMode="cover"
      />
      <View style={styles.imageOverlay}>
        <Text style={styles.imagePickerText}>✓ Image Selected</Text>
        <Text style={styles.imagePickerSubtext}>Tap to change</Text>
      </View>
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
        <Text style={styles.tip}>• Testing phase, use smaller artworks for now!</Text>
        <Text style={styles.tip}>• No AI artwork here! </Text>
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
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  remixHeader: {
    backgroundColor: '#f5f3ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  remixTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  remixSubtitle: {
    fontSize: 14,
    color: '#6d28d9',
  },
  mediaTypeScroll: {
    marginHorizontal: -16, // Bleed to edges
  },
  mediaTypeScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  mediaTypeOption: {
    width: 140,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  mediaTypeOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#f5f3ff',
  },
  mediaTypeOptionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  mediaTypeOptionEmojiSelected: {
    // Emoji stays the same when selected
  },
  mediaTypeOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 4,
  },
  mediaTypeOptionLabelSelected: {
    color: '#7C3AED',
  },
  mediaTypeOptionDescription: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedTypeInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  selectedTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedTypeDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
});

export default UploadScreen;