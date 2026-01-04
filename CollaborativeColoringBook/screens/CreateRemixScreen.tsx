// screens/CreateRemixScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { worksService } from '../services/worksService';
import { useAuth } from '../context/AuthContext';
import { CreativeWork, WorkWithContext } from '../types/core';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import {  NavigationCoordinator } from '../utils/navigation'; 

type CreateRemixScreenRouteProp = RouteProp<RootStackParamList, 'CreateRemix'>;
type CreateRemixScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateRemix'>;

const CreateRemixScreen = () => {
    const route = useRoute<CreateRemixScreenRouteProp>();
    const navigation = useNavigation<CreateRemixScreenNavigationProp>();
  const { user } = useAuth();
  
  const { originalWorkId } = route.params as { originalWorkId: string };
  
  const [originalWork, setOriginalWork] = useState<CreativeWork | null>(null);
  const [workContext, setWorkContext] = useState<WorkWithContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOriginalWork();
  }, [originalWorkId]);

  const loadOriginalWork = async () => {
    try {
      setLoading(true);
      const work = await worksService.getWork(originalWorkId);
      setOriginalWork(work);
    } catch (error) {
      console.error('Failed to load original work:', error);
      Alert.alert('Error', 'Could not load the original work');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!originalWork) return;

    NavigationCoordinator.navigateToUploadForRemix(navigation as any, user, {
      originalWorkId,
      originalWork
    });
    };  

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading original work...</Text>
      </View>
    );
  }

  if (!originalWork) {
    return (
      <View style={styles.centerContainer}>
        <Text>Work not found</Text>
      </View>
    );
  }

  const getArtistDisplayName = () => {
    if (originalWork.artist?.displayName) {
      return originalWork.artist.displayName;
    }
    
    // Fallback to artistId if artist data is missing
    return originalWork.artistId 
      ? `User ${originalWork.artistId.slice(0, 8)}`
      : 'Unknown Artist';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create a Remix</Text>
        <Text style={styles.subtitle}>
        Make something new inspired by this work
        </Text>
      </View>

      {/* Original Work Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>You're remixing:</Text>
        <View style={styles.originalWorkCard}>
          <Image 
            source={{ uri: originalWork.assetUrl }} 
            style={styles.originalWorkImage}
            resizeMode="cover"
          />
          <View style={styles.originalWorkInfo}>
            <Text style={styles.originalWorkTitle} numberOfLines={1}>
              {originalWork.title}
            </Text>
            <Text style={styles.originalWorkArtist}>
              by {getArtistDisplayName()}
            </Text>
            <Text style={styles.originalWorkType}>
              {originalWork.mediaType.replace('_', ' ')}
            </Text>
            {originalWork.description && (
              <Text style={styles.originalWorkDescription} numberOfLines={2}>
                {originalWork.description}
              </Text>
            )}
          </View>
        </View>
      </View>

       {/* Creative Freedom Message */}
       <View style={styles.freedomSection}>
        <Text style={styles.freedomTitle}>🎨 Total Creative Freedom</Text>
        <Text style={styles.freedomText}>
          Create anything inspired by this work! Turn it into a different medium, 
          continue the story, reinterpret it your way, or make something completely new.
        </Text>
        <Text style={styles.freedomText}>
          The original artist will be automatically credited.
        </Text>
      </View>

      {/* Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ideas to get you started:</Text>
        <View style={styles.ideaList}>
          <Text style={styles.idea}>• Colorize or recolor the artwork</Text>
          <Text style={styles.idea}>• Write a story based on it</Text>
          <Text style={styles.idea}>• Create an animation</Text>
          <Text style={styles.idea}>• Compose music inspired by it</Text>
          <Text style={styles.idea}>• Make a 3D model</Text>
          <Text style={styles.idea}>• Create a comic adaptation</Text>
          <Text style={styles.idea}>• Or anything else you imagine!</Text>
        </View>
      </View>
       {/* Continue Button */}
       <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>
          Start Creating
        </Text>
        <Text style={styles.continueButtonSubtext}>
          Your remix, your rules
        </Text>
      </TouchableOpacity>

      {/* Attribution Notice */}
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>🎭 Collaborative Spirit</Text>
        <Text style={styles.noticeText}>
          Your remix will automatically credit the original artist and link back to their work.
          This is a celebration of shared creativity!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  originalWorkCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  originalWorkImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  originalWorkInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  originalWorkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  originalWorkArtist: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  originalWorkType: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  originalWorkDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  remixTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  remixTypeButton: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  remixTypeButtonSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#f5f3ff',
  },
  remixTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  remixTypeIconSelected: {
    color: '#7C3AED',
  },
  remixTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    textAlign: 'center',
  },
  remixTypeTextSelected: {
    color: '#7C3AED',
  },
  remixTypeDescription: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 14,
  },
  creationPreview: {
    marginTop: 8,
  },
  creationStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#7C3AED',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  continueButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  notice: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    marginBottom: 32,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
  },
  freedomSection: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  freedomTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  freedomText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
    marginBottom: 8,
  },
  ideaList: {
    marginTop: 8,
  },
  idea: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 4,
  },
});

export default CreateRemixScreen;