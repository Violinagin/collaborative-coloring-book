// screens/GalleryScreen.tsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  ListRenderItem,
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Artwork } from '../data/mockData';
import { RootStackParamList } from '../types/navigation';
import LikeButton from '../components/LikeButton';
import CommentButton from '../components/CommentButton';
import { useLikes } from '../context/LikesContext';
import { useComments } from '../context/CommentsContext';
import { useApp } from '../context/AppContext';
import { directSupabaseService } from '../services/directSupabaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

const GalleryScreen = ({ navigation }: Props) => {
  const { state, dispatch } = useApp();
  const { toggleLike, isLiked, getLikeCount } = useLikes();
  const { getCommentCount } = useComments();
  
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load artworks from Supabase
  const loadArtworks = async () => {
    try {
      setLoading(true);
      const supabaseArtworks = await directSupabaseService.getArtworks();
      setArtworks(supabaseArtworks);
    } catch (error) {
      console.error('Error loading artworks:', error);
      // Fallback to mock data if Supabase fails
      setArtworks(state.artworks);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load artworks on component mount
  useEffect(() => {
    loadArtworks();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadArtworks();
  };

  // Handle like with Supabase
  const handleLike = async (artworkId: string) => {
    try {
      const currentUserId = state.currentUser.id;
      console.log('🎯 Toggling like for artwork:', artworkId, 'user:', currentUserId);
      
      const nowLiked = await directSupabaseService.toggleLike(artworkId, currentUserId);
      console.log('✅ Like toggled successfully, now liked:', nowLiked);
      
      // Update local state for immediate feedback
      dispatch({
        type: 'TOGGLE_LIKE',
        payload: { artworkId, userId: currentUserId }
      });
      
    } catch (error) {
      console.error('❌ Error toggling like:', error);
    }
  };

  const renderArtworkItem: ListRenderItem<Artwork> = ({ item }) => (
    <TouchableOpacity 
      style={styles.artworkCard}
      onPress={() => navigation.navigate('ArtworkDetail', { artwork: item })}
    >
      <Image 
        source={{ uri: item.lineArtUrl }} 
        style={styles.artworkImage}
        resizeMode="contain"
        onError={() => console.log('Error loading image:', item.lineArtUrl)}
      />
      <View style={styles.artworkInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.artist}>by {item.artist}</Text>
        
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.actionsRow}>
          <LikeButton 
            isLiked={isLiked(item.id)}
            likeCount={getLikeCount(item.id)}
            onPress={() => handleLike(item.id)}
            size="small"
          />
          <CommentButton 
            commentCount={getCommentCount(item.id)}
            onPress={() => navigation.navigate('ArtworkDetail', { artwork: item })}
            size="small"
          />
        </View>
        
        <View style={styles.stats}>
          <Text style={styles.stat}>
            {item.colorizedVersions.length} colorizations
          </Text>
          <Text style={styles.stat}>
            {item.likes.length} likes
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && artworks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading artworks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={artworks}
        renderItem={renderArtworkItem}
        keyExtractor={(item: Artwork) => item.id}
        numColumns={2}
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
            <Text style={styles.emptyText}>No artworks yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to upload some line art!
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
  artworkCard: {
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
  artworkImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  artworkInfo: {
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  description: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stat: {
    fontSize: 12,
    color: '#888',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});

export default GalleryScreen;