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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../types/navigation';
import { worksService } from '../services/worksService';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { UploadableMediaType, CreativeWork, UploadWork, DerivativeWorkData, RemixType, LineArtConfig, ColoredArtConfig, DigitalArtConfig} from '../types/core';
import { AlertModal } from '../components/AlertModal';
import { useRoute } from '@react-navigation/native';
import { mediaUtils, UploadableMediaTypeConfig } from '../utils/mediaUtils';


type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;

// interface RouteParams {
//   originalWorkId?: string;
//   originalWork?: CreativeWork;
//   remixType?: RemixType;
//   suggestedMediaType?: string;
// }

const UploadScreen = ({ navigation, route }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('digital_art');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');

  //const route = useRoute();
  // const params = route.params as {
  //   originalWorkId?: string;
  //   originalWork?: CreativeWork;
  // } || {};
  //const [mediaType, setMediaType] = useState<UploadableMediaType>('line_art');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [createdWorkId, setCreatedWorkId] = useState<string | null>(null);

  // For remixes (if coming from Gallery)
  const isRemix = route.params?.originalWorkId;
  const originalWorkId = route.params?.originalWorkId;
  const originalWorkTitle = route.params?.originalWorkTitle;
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const UPLOADABLE_MEDIA_TYPES = mediaUtils.getUploadableMediaTypeConfigs();
  
  // ==================== IMAGE PICKER ====================
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };
  
  // ==================== TAG HANDLING ====================
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // ==================== VALIDATION ====================
  const validateForm = () => {
    if (!title.trim()) {
      setModalMessage('Please enter a title for your artwork');
      setShowErrorModal(true);
      return false;
    }
    
    if (!imageUri) {
      setModalMessage('Please select an image to upload');
      setShowErrorModal(true);
      return false;
    }
    
    return true;
  };

  // ==================== UPLOAD FUNCTION ====================
  const handleUpload = async () => {
    // 1. Validate form
    if (!validateForm() || !imageUri) {
      // validateForm already shows error if imageUri is null
      return;
    }

    setUploading(true);
    
    try {
      let finalImageUrl = imageUri; // Now TypeScript knows imageUri is string
      
      const isLocalAsset = imageUri && (
        imageUri.startsWith('file://') || 
        imageUri.startsWith('blob:') || 
        imageUri.includes('localhost:8081')
      );
      
      if (isLocalAsset) {
        console.log('📤 NEEDS UPLOAD: Local/blob asset detected');
        console.log('📤 Calling storageService.uploadArtworkImage...');
        
        const uploadResult = await storageService.uploadArtworkImage(
          imageUri,
          `artwork_${Date.now()}_${title.replace(/\s+/g, '_')}.jpg`
        );

        console.log('📤 storageService returned:', uploadResult);
        
        if (!uploadResult.success) {
          // Image upload failed
          console.error('❌ storageService failed:', uploadResult.error);
          setModalMessage(uploadResult.error || 'Failed to upload image to cloud storage');
          setShowErrorModal(true);
          setUploading(false);
          return;
        }
        
        finalImageUrl = uploadResult.data!;
        console.log('✅ Image uploaded to:', finalImageUrl);
      }

      // 4. Prepare work data
      const workData = {
        title: title.trim(),
        description: description.trim(),
        assetUrl: finalImageUrl,
        originalWorkId: isRemix ? originalWorkId : undefined,
        tags: tags,
        visibility: visibility,
        mediaType: selectedMediaType as any, // Your UploadableMediaType
        mediaConfig: {},
      };

      console.log('🎨 Creating work record in database...');

      // 5. Create work in database
      let result;
      
      if (isRemix && originalWorkId) {
        // It's a remix
        const remixData = {
          ...workData,
          originalWorkId: originalWorkId,
          remixType: 'remix' as const,
          attribution: `Remix of "${originalWorkTitle || 'original work'}"`
        };
        
        result = await worksService.createRemix(remixData);
      } else {
        // It's an original work
        result = await worksService.createWork(workData);
      }

      // 6. Handle the result
      if (result.success && result.data) {
        // SUCCESS! 🎉
        console.log('🔍 FINAL URL TO SAVE:', finalImageUrl);
  console.log('Valid Supabase URL?', 
    finalImageUrl?.includes('supabase.co') || 
    finalImageUrl?.includes('supabase.in') ||
    finalImageUrl?.includes('storage.googleapis.com')
  );
        const createdWork = result.data;
        setCreatedWorkId(createdWork.id);
        setModalMessage(`"${createdWork.title}" was created successfully!`);
        setShowSuccessModal(true);
        console.log('✅ Work created with ID:', createdWork.id);
      } else {
        // ERROR from service
        setModalMessage(result.error || 'Failed to save artwork to database');
        setShowErrorModal(true);
        console.error('❌ Service error:', result.error);
        
        // Optional: Try to delete the uploaded image since work creation failed
        if (finalImageUrl && finalImageUrl !== imageUri) {
          try {
            await storageService.deleteArtworkImage(finalImageUrl);
            console.log('🔄 Cleaned up uploaded image');
          } catch (cleanupError) {
            console.warn('⚠️ Could not cleanup image:', cleanupError);
          }
        }
      }
      
    } catch (error) {
      // 7. Handle unexpected errors
      console.error('💥 Unexpected error in upload process:', error);
      setModalMessage('An unexpected error occurred. Please try again.');
      setShowErrorModal(true);
    } finally {
      // 8. Always stop loading
      setUploading(false);
    }
  };

  // ==================== MODAL HANDLERS ====================
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    
    if (createdWorkId) {
      // Navigate to the newly created artwork
      navigation.navigate('ArtworkDetail', { workId: createdWorkId });
      
      // Optional: Clear the form for next upload
      setTitle('');
      setDescription('');
      setImageUri(null);
      setTags([]);
      setTagInput('');
    }
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    // Don't clear form on error - user might want to fix and retry
  };
  
  // const createUploadWorkData = (
  //   title: string,
  //   description: string,
  //   storageImageUrl: string,
  //   mediaType: UploadableMediaType
  // ): UploadWork => {
  //   const base = {
  //     title: title.trim(),
  //     description: description.trim(),
  //     assetUrl: storageImageUrl,
  //     originalWorkId: undefined as string | undefined,
  //     tags: [] as string[],
  //     visibility: 'public' as const,
  //     mediaType: mediaType,
  //   };
  
  //   // Create objects with exact types first, then cast
  //   if (mediaType === 'line_art') {
  //     const lineArtWork = {
  //       ...base,
  //       mediaType: 'line_art' as const,
  //       mediaConfig: {
  //         isColorable: true,
  //         complexity: 'medium' as const
  //       }
  //     };
  //     // Cast to the specific union member
  //     return lineArtWork as typeof lineArtWork & UploadWork;
  //   }
    
  //   if (mediaType === 'colored_art') {
  //     const coloredArtWork = {
  //       ...base,
  //       mediaType: 'colored_art' as const,
  //       mediaConfig: {
  //         isColorable: true,
  //         technique: 'flat' as const,
  //         complexity: 'medium' as const
  //       }
  //     };
  //     return coloredArtWork as typeof coloredArtWork & UploadWork;
  //   }
    
  //   // digital_art
  //   const digitalArtWork = {
  //     ...base,
  //     mediaType: 'digital_art' as const,
  //     mediaConfig: {
  //       isColorable: false,
  //       style: 'painting' as const
  //     }
  //   };
  //   return digitalArtWork as typeof digitalArtWork & UploadWork;
  // };

  // const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
  //   setModalTitle(title);
  //   setModalMessage(message);
  //   setModalType(type);
  //   setModalVisible(true);
  // };

  // const hideModal = () => {
  //   setModalVisible(false);
  // };

  // const handleUpload = async () => {
    
  //   if (!user) {
  //     showModal('Error', 'Please log in to upload works', 'error');
  //     return;
  //   }
  //    // Validate form
  //    const validationError = validateForm();
  //    if (validationError) {
  //      showModal('Validation Error', validationError, 'error');
  //      return;
  //    }
  
  //   setUploading(true);
  //   setShowProgress(true);
  //   setUploadProgress(0);


    
  //   try {
  //     console.log('🚀 Starting upload flow for user:', user.id);
      
  //     // Upload with Progress
  //     console.log('📤 Step 1: Uploading image to storage...');
  //     const storageImageUrl = await storageService.uploadArtworkImage(
  //       imageUri!, 
  //       user.id,
  //       (progress) => {
  //         setUploadProgress(progress);
  //       }
  //     );
      
  //     console.log('✅ Image uploaded to storage:', storageImageUrl);

  //     const workData: UploadWork = createUploadWorkData(
  //       title,
  //       description,
  //       storageImageUrl,
  //       mediaType
  //     );

  //     let createdWork: CreativeWork;
    
  //     if (isRemix && originalWork) {
  //       // Create as remix
  //       const remixData: DerivativeWorkData = {
  //         ...workData,
  //         originalWorkId: originalWork.id,
  //         remixType: 'remix',
  //         attribution: `Inspired by "${originalWork.title}" by ${originalWork.artist?.displayName}`
  //       };
  //       createdWork = await worksService.createRemix(remixData);
  //     } else {
  //       // Create as original work
  //       createdWork = await worksService.createWork(workData);
      
  //     console.log('📦 Work data being created:', workData);
      
  //     // Use worksService to create the work record
      
  //     console.log('🎉 Work created successfully!');
  //     console.log('🆔 Work ID:', createdWork.id);
  //     console.log('🖼️ Work assetUrl:', createdWork.assetUrl);
  
  //     showModal('Success!', 'Your artwork has been uploaded and is now live in the gallery!', 'success');
      
  //     // Reset form on success
  //     setTitle('');
  //     setDescription('');
  //     setImageUri(null);
  //     setMediaType('line_art');
      
  //   }

      
  //   } catch (error: any) {
  //     console.error('💥 Upload failed:', error);
  //     const errorMessage = error?.message || 'Please try again.';
  //     showModal('Upload Failed', `Failed to upload artwork: ${errorMessage}`, 'error');
  //   } finally {
  //     setUploading(false);
  //     setShowProgress(false);
  //     setUploadProgress(0);
  //   }
  // };

  // ==================== RENDER ====================
  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Give your artwork a title"
          maxLength={100}
        />
        
        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Tell us about your artwork..."
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        
        {/* Image Upload */}
        <Text style={styles.label}>Image *</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Media Type Selector */}
        <Text style={styles.label}>Media Type</Text>
        <View style={styles.mediaTypeContainer}>
          {mediaUtils.getUploadableMediaTypes().map(type => {
            const config = mediaUtils.getMediaTypeConfig(type);
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mediaTypeButton,
                  selectedMediaType === type && styles.mediaTypeButtonSelected
                ]}
                onPress={() => setSelectedMediaType(type)}
              >
                <Text style={[
                  styles.mediaTypeText,
                  selectedMediaType === type && styles.mediaTypeTextSelected
                ]}>
                  {config.emoji} {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Tags */}
        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={[styles.input, styles.tagInput]}
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="Add a tag and press Enter"
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
            <Text style={styles.addTagButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tags Display */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                onPress={() => removeTag(tag)}
              >
                <Text style={styles.tagText}>{tag} ×</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.uploadButtonText}>
              {isRemix ? 'Create Remix' : 'Upload Artwork'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* ==================== MODALS ==================== */}
      
      {/* Success Modal */}
      <AlertModal
        visible={showSuccessModal}
        title="Success! 🎉"
        message={modalMessage}
        type="success"
        onClose={handleSuccessModalClose}
      />
      
      {/* Error Modal */}
      <AlertModal
        visible={showErrorModal}
        title="Oops! 😅"
        message={modalMessage}
        type="error"
        onClose={handleErrorModalClose}
      />
    </ScrollView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  mediaTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  mediaTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  mediaTypeButtonSelected: {
    backgroundColor: '#007AFF',
  },
  mediaTypeText: {
    fontSize: 14,
  },
  mediaTypeTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 50,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default UploadScreen;