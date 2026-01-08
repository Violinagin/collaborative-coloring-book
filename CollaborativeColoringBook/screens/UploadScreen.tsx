// screens/UploadScreen.tsx - FIXED SYNTAX ERRORS
import React, { useState, useRef } from 'react';
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
import { worksService } from '../services/api/works';
import { storageService, UploadController } from '../services/upload/storageService';
import { useAuth } from '../context/AuthContext';
import { AlertModal } from '../components/AlertModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { mediaUtils } from '../utils/mediaUtils';
import { UploadScreenProps } from '../types/navigation';
import { NavigationCoordinator } from '../utils/navigation';
import { navigateToProfile, navigateToAuth, navigateToUpload, navigateToArtworkDetail } from '../utils/navigation';


type Props = UploadScreenProps;

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [createdWorkId, setCreatedWorkId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // For remixes (if coming from Gallery)
  const isRemix = route.params?.originalWorkId;
  const originalWorkId = route.params?.originalWorkId;
  const originalWorkTitle = route.params?.originalWorkTitle;
  
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const UPLOADABLE_MEDIA_TYPES = mediaUtils.getUploadableMediaTypeConfigs();

  // Cancellation support
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const uploadControllerRef = useRef<UploadController | null>(null);
  
  // ==================== IMAGE PICKER ====================
  const pickImage = async () => {
    // If already uploading, ask user if they want to cancel
    if (uploading) {
      setModalTitle('Upload in Progress');
      setModalMessage('An upload is currently in progress. Would you like to cancel it and select a new image?');
      setModalType('info');
      setShowCancelConfirmModal(true);
      return;
    }
    
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

  // ==================== CANCELLATION HANDLERS ====================
  const handleCancelUpload = () => {
    if (currentUploadId) {
      const cancelled = storageService.cancelUpload(currentUploadId);
      if (cancelled) {
        console.log('🚫 Upload cancelled by user');
        setModalMessage('Upload cancelled');
        setUploading(false);
        setUploadProgress(0);
        setCurrentUploadId(null);
        uploadControllerRef.current = null;
      }
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

   // ==================== UPLOAD FUNCTION WITH CANCELLATION ====================
   const handleUpload = async () => {
    if (!validateForm() || !imageUri) {
      return;
    }
  
    setUploading(true);
    setUploadProgress(0);
    
    // Generate a unique upload ID for this upload session
    const uploadId = `upload_${Date.now()}`;
    setCurrentUploadId(uploadId);
    
    try {
      let finalImageUrl = imageUri;
      let wasLocalAsset = false;
      
      const isLocalAsset = imageUri && (
        imageUri.startsWith('file://') || 
        imageUri.startsWith('blob:') || 
        imageUri.includes('localhost:8081')
      );
      
      if (isLocalAsset) {
        wasLocalAsset = true;
        
        const uploadResult = await storageService.uploadArtworkImage(
          imageUri,
          `artwork_${Date.now()}_${title.replace(/\s+/g, '_')}.jpg`,
          (progress) => {
            setUploadProgress(progress);
          }
        );
        
        // Check if upload was cancelled
        if (uploadResult.error === 'Upload cancelled') {
          console.log('ℹ️ Upload was cancelled, stopping process');
          return;
        }
        
        if (!uploadResult.success) {
          setModalMessage(uploadResult.error || 'Failed to upload image');
          setShowErrorModal(true);
          setUploading(false);
          setCurrentUploadId(null);
          return;
        }
        
        finalImageUrl = uploadResult.data!;
      } else {
        // Not a local asset - use the URL directly
      }
      
      // ========== DATABASE CREATION ==========
  
      const workData = {
        title: title.trim(),
        description: description.trim(),
        assetUrl: finalImageUrl,
        originalWorkId: isRemix ? originalWorkId : undefined,
        tags: tags,
        visibility: visibility,
        mediaType: selectedMediaType as any,
        mediaConfig: {},
      };
  
      let result;
      
      if (isRemix && originalWorkId) {
        const remixData = {
          ...workData,
          originalWorkId: originalWorkId,
          remixType: 'remix' as const,
          attribution: `Remix of "${originalWorkTitle || 'original work'}"`
        };
        
        result = await worksService.createRemix(remixData);
      } else {
        result = await worksService.createWork(workData);
      }
  
      if (result.success && result.data) {
        const createdWork = result.data;
        setCreatedWorkId(createdWork.id);
        setModalMessage(`"${createdWork.title}" was created successfully!`);
        setShowSuccessModal(true);
      } else {
        setModalMessage(result.error || 'Failed to save artwork');
        setShowErrorModal(true);
        
        // Try to delete the uploaded image since work creation failed
        if (wasLocalAsset && finalImageUrl && finalImageUrl !== imageUri) {
          try {
            await storageService.deleteArtworkImage(finalImageUrl);
          } catch (cleanupError) {
            console.warn('⚠️ Could not cleanup image:', cleanupError);
          }
        }
      }
      
    } catch (error: any) {
      // Only show error if not cancelled
      if (error.message !== 'Upload cancelled') {
        console.error('💥 Upload error:', error);
        setModalMessage('An unexpected error occurred. Please try again.');
        setShowErrorModal(true);
      }
    } finally {
      setUploading(false);
      setCurrentUploadId(null);
      uploadControllerRef.current = null;
    }
  };

  // ==================== MODAL HANDLERS ====================
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    
    if (createdWorkId) {
      NavigationCoordinator.navigateToArtworkDetailAfterUpload(navigation, createdWorkId);
    }
      
      // Optional: Clear the form for next upload
      setTitle('');
      setDescription('');
      setImageUri(null);
      setTags([]);
      setTagInput('');
  };

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

        {/* Upload Progress & Cancel */}
        {uploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                Uploading... {uploadProgress}%
              </Text>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCancelConfirmModal(true)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${uploadProgress}%` }
                ]} 
              />
            </View>
          </View>
        )}

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
        
        {/* Upload/Cancel Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton, 
            uploading ? styles.cancelButtonStyle : styles.uploadButtonStyle
          ]}
          onPress={uploading ? () => setShowCancelConfirmModal(true) : handleUpload}
        >
          {uploading ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="white" size="small" style={styles.loader} />
              <Text style={styles.uploadButtonText}>Click to cancel upload...</Text>
            </View>
          ) : (
            <Text style={styles.uploadButtonText}>
              {isRemix ? 'Create Remix' : 'Upload Artwork'}
            </Text>
          )}
        </TouchableOpacity>
        
        {/* Optional: Add a small cancel link below the button */}
        {uploading && (
          <TouchableOpacity 
            style={styles.smallCancelLink}
            onPress={handleCancelUpload}
          >
            <Text style={styles.smallCancelLinkText}>or cancel upload</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* ==================== MODALS ==================== */}
      
     {/* Cancel Confirmation Modal */}
     <ConfirmationModal
        visible={showCancelConfirmModal}
        title="Upload in Progress"
        message="An upload is currently in progress. Would you like to cancel it?"
        type="warning"
        confirmText="Yes, Cancel"
        cancelText="No, Continue Upload"
        onConfirm={() => {
          setShowCancelConfirmModal(false);
          handleCancelUpload();
        }}
        onCancel={() => setShowCancelConfirmModal(false)}
      />
      
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
        onClose={() => setShowErrorModal(false)}
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
  // Progress styles
  progressContainer: {
    marginVertical: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff3b30',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginRight: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  // Button styles
  uploadButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 50,
  },
  uploadButtonStyle: {
    backgroundColor: '#007AFF',
  },
  cancelButtonStyle: {
    backgroundColor: '#ff3b30',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  // Small cancel link
  smallCancelLink: {
    alignSelf: 'center',
    marginTop: -10,
    marginBottom: 20,
  },
  smallCancelLinkText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
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
});

export default UploadScreen;