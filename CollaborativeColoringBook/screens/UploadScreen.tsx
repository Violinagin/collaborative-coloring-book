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

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;

const UploadScreen = ({ navigation }: Props) => {
  const { state, dispatch } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images.');
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
        console.log('✅ Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for your artwork.');
      return;
    }

    if (!image) {
      Alert.alert('No image', 'Please select an image to upload.');
      return;
    }

    console.log('🚀 Starting mock upload...');
    setUploading(true);

    // Simulate upload delay
    setTimeout(() => {
      try {
        // Create mock artwork (no API call)
        const newArtwork = {
          id: `artwork-${Date.now()}`,
          title: title.trim(),
          artist: state.currentUser.displayName,
          artistId: state.currentUser.id,
          lineArtUrl: image, // Use local URI
          colorizedVersions: [],
          likes: [],
          comments: [],
          createdAt: new Date(),
          description: description.trim() || undefined,
        };

        console.log('✅ Mock upload successful:', newArtwork);

        // Update local state only
        dispatch({ 
          type: 'ADD_ARTWORK', 
          payload: newArtwork 
        });

        Alert.alert(
          'Success! 🎉',
          'Your line art has been added! (Local demo mode)',
          [
            {
              text: 'View in Gallery',
              onPress: () => navigation.navigate('Gallery')
            }
          ]
        );

        // Reset form
        setTitle('');
        setDescription('');
        setImage(null);

      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Upload failed', 'Please try again.');
      } finally {
        setUploading(false);
      }
    }, 1500); // 1.5 second delay to simulate upload
  };

  const clearImage = () => {
    setImage(null);
  };

  return (
    <ScrollView style={styles.container}>
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
            <Text style={styles.uploadingText}>Adding to Gallery...</Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>
            🎨 Add to Gallery
          </Text>
        )}
      </TouchableOpacity>

      {/* Demo Notice */}
      <View style={styles.demoNotice}>
        <Text style={styles.demoTitle}>Demo Mode</Text>
        <Text style={styles.demoText}>
          • Artwork stored locally only{'\n'}
          • Will appear in your gallery{'\n'}
          • Perfect for testing!
        </Text>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Tips for Great Line Art:</Text>
        <Text style={styles.tip}>• Use high contrast black and white</Text>
        <Text style={styles.tip}>• Ensure lines are clear and connected</Text>
        <Text style={styles.tip}>• Simple compositions work best for coloring</Text>
        <Text style={styles.tip}>• Avoid overly complex small details</Text>
      </View>
    </ScrollView>
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
});

export default UploadScreen;