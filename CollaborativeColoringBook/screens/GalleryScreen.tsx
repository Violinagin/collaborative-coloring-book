import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { worksService } from '../services/worksService';
import { socialService } from '../services/socialService';
import { CreativeWork } from '../types/core';
import { mediaUtils } from '../utils/mediaUtils';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

const GalleryScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [works, setWorks] = useState<CreativeWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likeData, setLikeData] = useState<{[workId: string]: {count: number, isLiked: boolean}}>({});
  const [commentData, setCommentData] = useState<{[workId: string]: number}>({});

  const loadWorks = async () => {
    try {
      setLoading(true);
      
      // Use the new service to get colorable works
      const colorableWorks = await worksService.getColorableWorks();
      setWorks(colorableWorks);
      
      // Load social data for all works
      const likeData: {[workId: string]: {count: number, isLiked: boolean}} = {};
      const commentData: {[workId: string]: number} = {};
      
      const dataPromises = colorableWorks.map(async (work) => {
        const [likeCount, workComments, isLiked] = await Promise.all([
          socialService.getLikeCount(work.id),        
          socialService.getComments(work.id),         
          user ? socialService.isLiked(work.id, user.id) : false
        ]);
        
        return { 
          workId: work.id, 
          likeCount, 
          commentCount: workComments.length,
          isLiked 
        };
      });
      
      const results = await Promise.all(dataPromises);
      
      results.forEach(result => {
        likeData[result.workId] = {
          count: result.likeCount,
          isLiked: result.isLiked
        };
        commentData[result.workId] = result.commentCount;
      });
      
      setLikeData(likeData);
      setCommentData(commentData);
      
    } catch (error) {
      console.error('Error loading works:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadWorks();
    }
  }, [isFocused]);

  useEffect(() => {
    loadWorks();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWorks();
  };

  // Handle like - redirect to auth if not logged in
  const handleLike = async (workId: string) => {
    console.log('🎯 ===== LIKE BUTTON PRESSED =====');
  console.log('🆔 Work ID:', workId);
  console.log('👤 User:', user?.id);
  console.log('📊 Current like data:', likeData[workId]);
    if (!user) {
      console.log('🚫 No user - redirecting to auth');
      navigation.navigate('Auth');
      return;
    }
    console.log('✅ User authenticated, proceeding with like...');
    try {
      // Optimistic update
      const currentLikeState = likeData[workId]?.isLiked || false;
      const currentCount = likeData[workId]?.count || 0;
      console.log('🔄 Optimistic update - current state:', {
        wasLiked: currentLikeState,
        currentCount: currentCount,
        newState: !currentLikeState,
        newCount: currentLikeState ? currentCount - 1 : currentCount + 1
      });
      setLikeData(prev => ({
        ...prev,
        [workId]: {
          count: currentLikeState ? prev[workId]?.count - 1 : prev[workId]?.count + 1,
          isLiked: !currentLikeState
        }
      }));

      console.log('📞 Calling socialService.toggleLike...');
    const nowLiked = await socialService.toggleLike(workId, user.id);
    console.log('✅ socialService returned:', nowLiked);
    
    const newLikeCount = await socialService.getLikeCount(workId);
    console.log('📈 Actual like count from database:', newLikeCount);
      
      // Update with actual database state
      setLikeData(prev => ({
        ...prev,
        [workId]: {
          count: newLikeCount,
          isLiked: nowLiked
        }
      }));

      console.log('🎉 Like operation completed successfully!');
      console.log('📊 Final state:', {
        isLiked: nowLiked,
        count: newLikeCount
      });
      
    } catch (error) {
      console.error('Error toggling like:', error);
      loadWorks(); // Reload to get correct state
    }
    console.log('🎯 ===== LIKE OPERATION COMPLETE =====');
  };

  const renderWorkItem = ({ item }: { item: CreativeWork }) => {
    const likeInfo = likeData[item.id] || { count: 0, isLiked: false };
    const commentCount = commentData[item.id] || 0;
    
    return (
      <TouchableOpacity 
        style={styles.workCard}
        onPress={() => navigation.navigate('ArtworkDetail', { artwork: item })}
      >
        <Image 
          source={{ uri: item.assetUrl }} 
          style={styles.workImage}
          resizeMode="contain"
        />
        <View style={styles.workInfo}>
          <Text style={styles.title}>{item.title}</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile', { userId: item.artistId })}
          >
            <Text style={styles.artist}>by User {item.artistId.slice(0, 8)}</Text>
          </TouchableOpacity>
          
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          {/* Work Type & Colorable Badge */}
          <View style={styles.workMeta}>
            <Text style={styles.mediaType}>
              {mediaUtils.getMediaTypeLabel(item.mediaType)}
            </Text>
            {mediaUtils.isColorable(item) && (
              <Text style={styles.colorableBadge}>🖍️ Colorable</Text>
            )}
          </View>
          
          {/* Social Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, likeInfo.isLiked && styles.likedButton]}
              onPress={() => {
                console.log('🔘 LIKE BUTTON PHYSICALLY PRESSED for work:', item.id);
                console.log('👆 Touch detected on button');
                handleLike(item.id);
              }}
              onPressIn={() => console.log('⬇️ Button press started')}
              onPressOut={() => console.log('⬆️ Button press ended')}
            >
              <Text style={styles.actionText}>
                {likeInfo.isLiked ? '❤️' : '🤍'} {likeInfo.count}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ArtworkDetail', { artwork: item })}
            >
              <Text style={styles.actionText}>💬 {commentCount}</Text>
            </TouchableOpacity>
            
            {mediaUtils.isColorable(item) && (
              <TouchableOpacity 
                style={styles.colorButton}
                onPress={() => navigation.navigate('SkiaColoring', { work: item })}
              >
                <Text style={styles.colorButtonText}>🎨 Color</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && works.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading creative works...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={works}
        renderItem={renderWorkItem}
        keyExtractor={(item: CreativeWork) => item.id}
        contentContainerStyle={styles.gallery}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No creative works yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to upload some art!
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  gallery: {
    padding: 8,
  },
  workCard: {
    flex: 1,
    margin: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workImage: {
    width: '100%',
    height: 350,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  workInfo: {
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  description: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  workMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  mediaType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  colorableBadge: {
    fontSize: 12,
    color: '#155724',
    backgroundColor: '#d4edda',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    alignItems: 'center',
  },
  likedButton: {
    backgroundColor: '#ffe6e6',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    alignItems: 'center',
  },
  colorButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GalleryScreen;