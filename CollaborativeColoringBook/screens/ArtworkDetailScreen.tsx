// screens/ArtworkDetailScreen.tsx - UPDATED VERSION
import React, {useState, useEffect} from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import LikeButton from '../components/LikeButton';
import { Artwork, Comment } from '../types/User';
import CommentButton from '../components/CommentButton';
import { useAuth } from '../context/AuthContext';
import { directSupabaseService } from '../services/directSupabaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'ArtworkDetail'>;

const ArtworkDetailScreen = ({ route, navigation }: Props) => {
  const { user } = useAuth();
  const artworkFromParams: Artwork | undefined = route.params?.artwork;
  const [newComment, setNewComment] = useState('');
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [realComments, setRealComments] = useState<Comment[]>([]);
  const [realLikeCount, setRealLikeCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);

  // Load real artwork data from Supabase
  useEffect(() => {
    if (artworkFromParams) {
      loadArtworkData(artworkFromParams.id);
    }
  }, [artworkFromParams]);

  const loadArtworkData = async (artworkId: string) => {
    try {
      setLoading(true);
      
      // Use direct service instead of supabaseService
      const artworks = await directSupabaseService.getArtworks();
      const foundArtwork = artworks.find(a => a.id === artworkId);
      
      if (foundArtwork) {
        setArtwork(foundArtwork);
        
        // Load real comments
        const comments = await directSupabaseService.getComments(artworkId);
        setRealComments(comments);
        
        // Load real like data
        const likeCount = await directSupabaseService.getLikeCount(artworkId);
        setRealLikeCount(likeCount);
        
        if (user) {
          const liked = await directSupabaseService.isLiked(artworkId, user.id);
          setUserLiked(liked);
        }
      } else {
        setArtwork(artworkFromParams || null);
      }
    } catch (error) {
      console.error('Error loading artwork data:', error);
      setArtwork(artworkFromParams || null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      // Redirect to auth if not logged in
      navigation.navigate('Auth');
      return;
    }
  
    if (!newComment.trim() || !artwork) return;
  
    setSubmittingComment(true);
    try {
      const comment = await directSupabaseService.addComment(artwork.id, user.id, newComment.trim());
      
      // Update local state
      setRealComments(prev => [...prev, comment]);
      setNewComment('');
      
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment'); //make modal
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }
  
    if (!artwork) return;
  
    try {
      // Optimistic update
      const newLikedState = !userLiked;
      setUserLiked(newLikedState);
      setRealLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
  
      const nowLiked = await directSupabaseService.toggleLike(artwork.id, user.id);
      
      // If the actual result differs from our optimistic update, correct it
      if (nowLiked !== newLikedState) {
        setUserLiked(nowLiked);
        const actualLikeCount = await directSupabaseService.getLikeCount(artwork.id);
        setRealLikeCount(actualLikeCount);
      }
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      const actualLikeCount = await directSupabaseService.getLikeCount(artwork.id);
      const actualLikedState = await directSupabaseService.isLiked(artwork.id, user.id);
      setRealLikeCount(actualLikeCount);
      setUserLiked(actualLikedState);
    }
  };

  if (!artworkFromParams) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Artwork not found</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading artwork...</Text>
      </View>
    );
  }

  const currentArtwork = artwork || artworkFromParams;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* Artwork Image */}
        <Image 
          source={{ uri: currentArtwork.lineArtUrl }} 
          style={styles.artworkImage}
          resizeMode="contain"
        />
        
        {/* Artwork Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{currentArtwork.title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile', { userId: currentArtwork.artistId })}
          >
            <Text style={[styles.artist, styles.clickableArtist]}>by {currentArtwork.artist}</Text>
          </TouchableOpacity>
          
          {currentArtwork.description && (
            <Text style={styles.description}>{currentArtwork.description}</Text>
          )}
          
          {/* Stats */}
          <View style={styles.stats}>
            <LikeButton 
              isLiked={userLiked}
              likeCount={realLikeCount}
              onPress={handleLike}
              size="medium"
            />
            <Text style={styles.stat}>{realComments.length} comments 💬</Text>
            <Text style={styles.stat}>{currentArtwork.colorizedVersions.length} colorizations 🎨</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('Coloring', { artwork: currentArtwork })}
            >
              <Text style={styles.buttonText}>🎨 Color This</Text>
            </TouchableOpacity>
          </View>

          {/* Comment Section */}
          {user && (
            <View style={styles.addCommentSection}>
              <Text style={styles.sectionTitle}>Add a Comment</Text>
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Write your comment..."
                  multiline
                  editable={!submittingComment}
                />
                <TouchableOpacity 
                  style={[
                    styles.postButton,
                    (!newComment.trim() || submittingComment) && styles.postButtonDisabled
                  ]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                >
                  {submittingComment ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.postButtonText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Comments List */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>
              Comments ({realComments.length})
            </Text>
            {realComments.map(comment => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>{comment.userName}:</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentDate}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
            {realComments.length === 0 && (
              <Text style={styles.noComments}>No comments yet. Be the first!</Text>
            )}
          </View>

          {/* Colorized Versions */}
          <View style={styles.colorizationsSection}>
           <Text style={styles.sectionTitle}>
             Colorized Versions ({currentArtwork.colorizedVersions.length})
           </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {currentArtwork.colorizedVersions.map(version => (
          <TouchableOpacity key={version.id} style={styles.colorizedThumbnail}>
            <Image 
              source={{ uri: version.coloredImageUrl }} 
              style={styles.thumbnailImage}
            />
            <Text style={styles.colorist}>by {version.colorist}</Text>
          </TouchableOpacity>
    ))}
    {currentArtwork.colorizedVersions.length === 0 && (
      <Text style={styles.noColorizations}>No colorizations yet. Be the first!</Text>
    )}
  </ScrollView>
</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  artworkImage: {
    width: '100%',
    height: 300,
    backgroundColor: 'white',
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artist: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  stat: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  commentsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  comment: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    color: '#333',
  },
  noComments: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  addCommentSection: {
    marginBottom: 24,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  colorizationsSection: {
    marginBottom: 24,
  },
  colorizedThumbnail: {
    marginRight: 12,
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  colorist: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  noColorizations: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  clickableArtist: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default ArtworkDetailScreen;