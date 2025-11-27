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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { CreativeWork, WorkWithContext } from '../types/core';
import { worksService } from '../services/worksService';
import { socialService } from '../services/socialService'; 
import LikeButton from '../components/LikeButton';
import { useAuth } from '../context/AuthContext';
import { mediaUtils } from '../utils/mediaUtils';
import { AlertModal } from '../components/AlertModal';

type Props = NativeStackScreenProps<RootStackParamList, 'ArtworkDetail'>;

const ArtworkDetailScreen = ({ route, navigation }: Props) => {
  const { user } = useAuth();
  const artworkFromParams: CreativeWork = route.params?.artwork;
  const [workContext, setWorkContext] = useState<WorkWithContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [realLikeCount, setRealLikeCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
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

  useEffect(() => {
    if (artworkFromParams) {
      loadWorkData(artworkFromParams.id);
    }
  }, [artworkFromParams]);

  const loadWorkData = async (workId: string) => {
    try {
      setLoading(true);
      
      // Use the new service to get work with full context
      const context = await worksService.getWorksWithContext(workId);
      setWorkContext(context);
      
      // Load real-time data (likes/comments) - we'll update these services next
      const [likeCount, workComments, liked] = await Promise.all([
        socialService.getLikeCount(workId),
        socialService.getComments(workId),
        user ? socialService.isLiked(workId, user.id) : false
      ]);
      
      setRealLikeCount(likeCount);
      setUserLiked(liked);
      setComments(workComments);
      
    } catch (error) {
      console.error('Error loading work data:', error);
      // Fallback to basic work data
      if (artworkFromParams) {
        setWorkContext({
          work: artworkFromParams,
          collaborations: [],
          artist: { 
            id: artworkFromParams.artistId,
            username: 'unknown',
            display_name: 'Unknown Artist'
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !workContext) return;
    
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      const newCommentObj = await socialService.addComment(workContext.work.id, user.id, newComment.trim());
      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      showModal('Error', 'Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (!user || !workContext) return;
    
    try {
      // Optimistic update
      setUserLiked(prev => !prev);
      setRealLikeCount(prev => userLiked ? prev - 1 : prev + 1);

      // Use NEW social service
      const nowLiked = await socialService.toggleLike(workContext.work.id, user.id);
      const newLikeCount = await socialService.getLikeCount(workContext.work.id);
      
      // Update with actual database state
      setUserLiked(nowLiked);
      setRealLikeCount(newLikeCount);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      const actualLikeCount = await socialService.getLikeCount(workContext.work.id);
      const actualLikedState = await socialService.isLiked(workContext.work.id, user.id);
      setRealLikeCount(actualLikeCount);
      setUserLiked(actualLikedState);
    }
  };

  if (!artworkFromParams) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Work not found</Text>
      </View>
    );
  }

  if (loading || !workContext) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading creative work...</Text>
      </View>
    );
  }

  const { work, originalWork, collaborations, artist } = workContext;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
       <AlertModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={hideModal}
      />
      <ScrollView style={styles.scrollView}>
        {/* Work Image */}
        <Image 
          source={{ uri: work.assetUrl }} 
          style={styles.workImage}
          resizeMode="contain"
        />
        
        {/* Work Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{work.title}</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile', { userId: artist.id })}
          >
            <Text style={[styles.artist, styles.clickableArtist]}>
              by {artist.display_name}
            </Text>
          </TouchableOpacity>
          
          {/* Work Type Badge */}
          <View style={styles.workTypeBadge}>
            <Text style={styles.workTypeText}>
              {mediaUtils.getMediaTypeLabel(work.mediaType)}
            </Text>
            {mediaUtils.isColorable(work) && (
              <Text style={styles.colorableBadge}>🖍️ Colorable</Text>
            )}
          </View>
          
          {work.description && (
            <Text style={styles.description}>{work.description}</Text>
          )}
          
          {/* Collaboration Chain */}
          {originalWork && (
            <View style={styles.collaborationChain}>
              <Text style={styles.chainTitle}>Inspired by:</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('ArtworkDetail', { artwork: originalWork })}
              >
                <Text style={styles.chainLink}>{originalWork.title}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Stats */}
          <View style={styles.stats}>
            <LikeButton 
              isLiked={userLiked}
              likeCount={realLikeCount}
              onPress={handleLike}
              size="medium"
            />
            <Text style={styles.stat}>{comments.length} comments</Text>
            <Text style={styles.stat}>{collaborations.length} derivatives</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {mediaUtils.isColorable(work) && (
              <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate('Coloring', { artwork: work })}
              >
                <Text style={styles.buttonText}>🎨 Color This</Text>
              </TouchableOpacity>
            )}
            
            {/* Future: Add other collaboration buttons based on media type */}
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {/* Future: Other collaboration types */}}
            >
              <Text style={styles.secondaryButtonText}>✨ Create Derivative</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>
              Comments ({comments.length})
            </Text>
            {comments.map(comment => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>{comment.userName}:</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentDate}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
            {comments.length === 0 && (
              <Text style={styles.noComments}>No comments yet. Be the first!</Text>
            )}
          </View>

          {/* Add Comment Section */}
          {user && (
            <View style={styles.addCommentSection}>
              <Text style={styles.sectionTitle}>Add a Comment</Text>
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Share your thoughts..."
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

          {/* Derivatives Section */}
          {collaborations.length > 0 && (
            <View style={styles.derivativesSection}>
              <Text style={styles.sectionTitle}>
                Derivative Works ({collaborations.length})
              </Text>
              <Text style={styles.derivativeSubtitle}>
                Other creations inspired by this work
              </Text>
              {/* We'll build a proper derivative gallery here */}
              </View>
          )}
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
  workImage: {
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
  workTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workTypeText: {
    fontSize: 14,
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  colorableBadge: {
    fontSize: 14,
    backgroundColor: '#d4edda',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#155724',
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 20,
  },
  collaborationChain: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  chainTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  chainLink: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
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
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  derivativesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  derivativeSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
  clickableArtist: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  commentsSection: {
    marginBottom: 24,
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
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
  },
  noComments: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});

export default ArtworkDetailScreen;