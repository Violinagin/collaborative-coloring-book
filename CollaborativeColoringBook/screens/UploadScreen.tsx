// screens/UploadScreen.tsx - NEW VERSION
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
import { MediaType } from '../types/core';
import { AlertModal } from '../components/AlertModal';
import { directSupabaseService } from '../services/directSupabaseService';

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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
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
      console.log('🚀 Starting proper upload flow...');
      
      // 1. FIRST: Upload image to Supabase Storage
      console.log('📤 Step 1: Uploading image to storage...');
      const storageImageUrl = await directSupabaseService.uploadArtworkImage(
        imageUri, 
        user.id
      );
      
      console.log('✅ Image uploaded to storage:', storageImageUrl);
      
      // 2. THEN: Create work with the storage URL
      console.log('📝 Step 2: Creating work record...');
      
      let createWorkParams;
  
      switch (mediaType) {
        case 'line_art':
          createWorkParams = {
            title: title.trim(),
            description: description.trim(),
            mediaType: 'line_art' as const,
            assetUrl: storageImageUrl, // ← STORAGE URL, not local URI
            mediaConfig: {
              isColorable: true,
              complexity: 'medium'
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
            assetUrl: storageImageUrl, // ← STORAGE URL, not local URI
            mediaConfig: {
              isColorable: true,
              technique: 'flat'
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
            assetUrl: storageImageUrl, // ← STORAGE URL, not local URI
            mediaConfig: {
              isColorable: false,
              style: 'painting'
            },
            tags: [],
            visibility: 'public' as const
          };
          break;
      }
  
      console.log('📦 Work data:', createWorkParams);
      const work = await worksService.createWork(createWorkParams as any);
      
      console.log('🎉 Work created successfully!');
      console.log('🆔 Work ID:', work.id);
      console.log('🖼️ Work image URL:', work.assetUrl);
  
      showModal('Success', 'Your work has been uploaded!', 'success');
      
      // Reset form
      setTitle('');
      setDescription('');
      setImageUri(null);
      setMediaType('line_art');
      
    } catch (error) {
      console.error('💥 Upload failed:', error);
      showModal('Error', 'Failed to upload work', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upload Creative Work</Text>
      
      {/* Media Type Selection */}
      <AlertModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={hideModal}
      />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Media Type</Text>
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
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Image Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Image</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Text style={styles.imagePickerText}>Image Selected ✓</Text>
          ) : (
            <Text style={styles.imagePickerText}>Tap to select image</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Work Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Work title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
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
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.uploadButtonText}>
            Upload {mediaType === 'line_art' ? 'Line Art' : 
                   mediaType === 'colored_art' ? 'Colored Art' : 'Digital Art'}
          </Text>
        )}
      </TouchableOpacity>
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  },
  mediaTypeTextSelected: {
    color: '#007AFF',
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
  imagePickerText: {
    fontSize: 16,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
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
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UploadScreen;