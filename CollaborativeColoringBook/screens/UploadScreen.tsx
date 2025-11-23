// screens/UploadScreen.tsx - EMERGENCY FIX
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { directSupabaseService } from '../services/directSupabaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;

const UploadScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageName, setImageName] = useState<string>('');

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'info'
  });

  const showModal = (title: string, message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setModalContent({ title, message, type });
    if (type === 'error') {
      setShowErrorModal(true);
    } else if (type === 'success') {
      setShowSuccessModal(true);
    }
  };

  // Close all modals
  const closeModals = () => {
    setShowErrorModal(false);
    setShowSuccessModal(false);
    setShowPermissionModal(false);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setShowPermissionModal(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        const fileName = `artwork-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        setImageName(fileName);
        console.log('✅ Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showModal('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setShowPermissionModal(true);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        const fileName = `artwork-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        setImageName(fileName);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showModal('Error', 'Failed to take photo');
    }
  };

  const uploadImageToStorage = async (uri: string, fileName: string): Promise<string> => {
    console.log('📤 Uploading image to storage...');
    
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const { data, error } = await supabase.storage
      .from('artworks')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Storage upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    console.log('✅ Image uploaded to storage:', data);

    const { data: urlData } = supabase.storage
      .from('artworks')
      .getPublicUrl(fileName);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get image URL');
    }

    console.log('✅ Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      showModal('Missing Title', 'Please enter a title for your artwork.');
      return;
    }

    if (!image) {
      showModal('No Image', 'Please select an image to upload.');
      return;
    }

    if (!user) {
      showModal('Not Logged In', 'Please log in to upload artwork.');
      return;
    }

    console.log('🚀 Starting real upload...');
    setUploading(true);

    try {
      const imageUrl = await uploadImageToStorage(image, imageName);
      const newArtwork = await directSupabaseService.uploadArtwork(
        title.trim(),
        description.trim(),
        imageUrl,
        user.id
      );

      console.log('✅ Upload successful:', newArtwork);
      
      // Show success modal
      setModalContent({
        title: 'Success! 🎉',
        message: 'Your line art has been uploaded!',
        type: 'success'
      });
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      showModal('Upload Failed', error.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageName('');
  };

  const handleSuccessAction = (action: 'view' | 'another') => {
    closeModals();
    if (action === 'view') {
      navigation.navigate('Gallery');
    } else {
      // Reset form for another upload
      setTitle('');
      setDescription('');
      setImage(null);
      setImageName('');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Line Art</Text>
          <Text style={styles.subtitle}>
            Share your line art for others to color and bring to life!
          </Text>
        </View>

        {/* Image Preview/Upload Section */}
        <View style={styles.imageSection}>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.clearImageButton} onPress={clearImage}>
                <Text style={styles.clearImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadPlaceholderText}>
                Select your line art image
              </Text>
              <Text style={styles.uploadHint}>
                Choose a clear black and white image for best coloring results
              </Text>
            </View>
          )}

          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Text style={styles.uploadButtonText}>📁 Choose from Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
              <Text style={styles.uploadButtonText}>📸 Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your artwork a name"
            maxLength={100}
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your artwork, coloring tips, or theme..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />

          <Text style={styles.charCount}>
            {description.length}/500 characters
          </Text>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!title.trim() || !image || uploading) && styles.submitButtonDisabled
          ]}
          onPress={handleUpload}
          disabled={!title.trim() || !image || uploading}
        >
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color="white" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              🎨 Upload to Gallery
            </Text>
          )}
        </TouchableOpacity>

        {/* Upload Status */}
        {uploading && (
          <View style={styles.uploadStatus}>
            <Text style={styles.uploadStatusText}>
              Uploading your artwork...
            </Text>
            <Text style={styles.uploadStatusSubtext}>
              This may take a moment
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Tips for Great Line Art:</Text>
          <Text style={styles.tip}>• Use high contrast black and white</Text>
          <Text style={styles.tip}>• Ensure lines are clear and connected</Text>
          <Text style={styles.tip}>• Simple compositions work best for coloring</Text>
          <Text style={styles.tip}>• Avoid overly complex small details</Text>
        </View>
      </ScrollView>

      {/* ERROR MODAL */}
      {showErrorModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            <Text style={styles.modalText}>{modalContent.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={closeModals}
              >
                <Text style={styles.modalPrimaryButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            <Text style={styles.modalText}>{modalContent.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSecondaryButton]}
                onPress={() => handleSuccessAction('another')}
              >
                <Text style={styles.modalSecondaryButtonText}>Upload Another</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={() => handleSuccessAction('view')}
              >
                <Text style={styles.modalPrimaryButtonText}>View in Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* PERMISSION MODAL */}
      {showPermissionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Permission Needed</Text>
            <Text style={styles.modalText}>
              Sorry, we need camera roll permissions to upload images. 
              Please enable permissions in your device settings.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={closeModals}
              >
                <Text style={styles.modalPrimaryButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 20,
  },
  imageSection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
  },
  clearImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  uploadPlaceholder: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  uploadPlaceholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  uploadButtons: {
    gap: 12,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadStatus: {
    backgroundColor: '#e3f2fd',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  uploadStatusSubtext: {
    fontSize: 14,
    color: '#1976d2',
  },
  demoNotice: {
    backgroundColor: '#e3f2fd',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: 'white',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  tip: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    margin: 20,
    minWidth: 280,
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButton: {
    backgroundColor: '#007AFF',
  },
  modalSecondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalPrimaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalSecondaryButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
});

export default UploadScreen;