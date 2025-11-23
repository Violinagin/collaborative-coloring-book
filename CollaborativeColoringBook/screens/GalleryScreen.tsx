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
import { useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Artwork } from '../data/mockData';
import { RootStackParamList } from '../types/navigation';
import LikeButton from '../components/LikeButton';
import CommentButton from '../components/CommentButton';
import { useLikes } from '../context/LikesContext';
import { useComments } from '../context/CommentsContext';
import { useApp } from '../context/AppContext';
import { directSupabaseService } from '../services/directSupabaseService';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Gallery'>;
const GalleryScreen = ({ navigation }: Props) => {
  const isFocused = useIsFocused();
    useEffect(() => {
      if (isFocused) {
        loadArtworks();
      }
    }, [isFocused]);
  const { state } = useApp();
  const { toggleLike, isLiked, getLikeCount } = useLikes();
  const { getCommentCount } = useComments();
  const { user } = useAuth(); // Only for like functionality
  
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realLikeData, setRealLikeData] = useState<{[artworkId: string]: {count: number, isLiked: boolean}}>({});
  const [realCommentData, setRealCommentData] = useState<{[artworkId: string]: number}>({});

  // Load artworks from Supabase - no user dependency
  const loadArtworks = async () => {
    try {
      setLoading(true);
      console.log('🖼️ Loading artworks and like data...');
      
      const supabaseArtworks = await directSupabaseService.getArtworks();
      console.log(`✅ Loaded ${supabaseArtworks.length} artworks`);
      
      setArtworks(supabaseArtworks);
      
      // Load like data for ALL artworks first, then update state once
      const likeData: {[artworkId: string]: {count: number, isLiked: boolean}} = {};
      const commentData: {[artworkId: string]: number} = {};
      
      // Use Promise.all to load all like data in parallel
      const dataPromises = supabaseArtworks.map(async (artwork) => {
        const [likeCount, comments, isLiked] = await Promise.all([
          directSupabaseService.getLikeCount(artwork.id),
          directSupabaseService.getComments(artwork.id),
          user ? directSupabaseService.isLiked(artwork.id, user.id) : false
        ]);
        
        return { 
          artworkId: artwork.id, 
          likeCount, 
          commentCount: comments.length,
          isLiked 
        };
      });
      
      const results = await Promise.all(dataPromises);
      
      // Build the data objects from results
      results.forEach(result => {
        likeData[result.artworkId] = {
          count: result.likeCount,
          isLiked: result.isLiked
        };
        commentData[result.artworkId] = result.commentCount;
      });
      
      console.log('✅ Like and comment data loaded for all artworks');
      setRealLikeData(likeData);
      setRealCommentData(commentData);
      
    } catch (error) {
      console.error('Error loading artworks:', error);
      setArtworks(state.artworks);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load artworks on component mount
  useEffect(() => {
    loadArtworks();
  }, [user]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadArtworks();
  };

  // Handle like - redirect to auth if not logged in
  const handleLike = async (artworkId: string) => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }
  
    try {
      console.log(`🎯 Toggling like for artwork ${artworkId} by user ${user.id}`);
      
      // Get current state from our local state (not context)
      const currentLikeState = realLikeData[artworkId]?.isLiked || false;
      console.log(`📊 Current UI like state: ${currentLikeState}`);
      
      // Update UI optimistically first
      setRealLikeData(prev => ({
        ...prev,
        [artworkId]: {
          count: currentLikeState ? prev[artworkId]?.count - 1 : prev[artworkId]?.count + 1,
          isLiked: !currentLikeState
        }
      }));
  
      // Then make the actual database call
      const nowLiked = await directSupabaseService.toggleLike(artworkId, user.id);
      console.log(`✅ Database like result: ${nowLiked}`);
      
      // Get fresh like count from database to ensure accuracy
      const newLikeCount = await directSupabaseService.getLikeCount(artworkId);
      
      // Update local state with actual database state
      setRealLikeData(prev => ({
        ...prev,
        [artworkId]: {
          count: newLikeCount,
          isLiked: nowLiked
        }
      }));
  
      console.log(`🔄 Final UI state - count: ${newLikeCount}, isLiked: ${nowLiked}`);
      
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      // Revert optimistic update on error
      loadArtworks(); // Reload to get correct state
    }
  };

  const renderArtworkItem: ListRenderItem<Artwork> = ({ item }) => {
    // Use ONLY realLikeData, not context
    const likeInfo = realLikeData[item.id] || { 
      count: 0, 
      isLiked: false 
    };
    const commentCount = realCommentData[item.id] || 0;
    
    return (
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
          <TouchableOpacity 
            onPress={() => {
              if (item.artistId) {
                navigation.navigate('Profile', { userId: item.artistId });
              }
            }}
          >
            <Text style={styles.artist}>by {item.artist}</Text>
          </TouchableOpacity>
          
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.actionsRow}>
            <LikeButton 
              isLiked={likeInfo.isLiked}  // Use realLikeData
              likeCount={likeInfo.count}   // Use realLikeData
              onPress={() => handleLike(item.id)}
              size="small"
            />
            <CommentButton 
              commentCount={commentCount}
              onPress={() => navigation.navigate('ArtworkDetail', { artwork: item })}
              size="small"
            />
          </View>
          
          <View style={styles.stats}>
            <Text style={styles.stat}>
              {item.colorizedVersions.length} colorizations
            </Text>
            <Text style={styles.stat}>
            {likeInfo.count} likes 
            </Text>
            <Text style={styles.stat}>
            {commentCount} comments
            </Text>
          </View>

        </View>
      </TouchableOpacity>
    );
  };

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
  debugButton: {
    backgroundColor: '#666',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 8,
    opacity: 0.8,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default GalleryScreen;