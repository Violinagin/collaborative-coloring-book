// screens/ArtworkDetailScreen.tsx - FIXED
import React, {useState, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { worksService } from '../services/api/works';
import LikeButton from '../components/LikeButton';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { AlertModal } from '../components/AlertModal';
import ScreenErrorBoundary from '../components/ScreenErrorBoundary';
import { RemixButton } from '../components/RemixButton';
import MediaTypeBadge from '../components/MediaTypeBadge';
import WorkTypeBadge from '../components/WorkTypeBadge';
import { navigateToProfile } from 'utils/navigation';
import { useArtworkDetail } from 'hooks/useArtworkDetail';

type Props = NativeStackScreenProps<RootStackParamList, 'ArtworkDetail'>;

const ArtworkDetailScreen = ({ route, navigation }: Props) => {
  
  const { user: currentUser } = useAuth();
  const { workId } = route.params as any;

  // Single hook to rule them all!
  const {
    work: currentWork,
    artist,
    realTimeComments: comments,
    realTimeLikeCount,
    realTimeUserHasLiked,
    collaborations,
    originalWork,
    loading,
    error: detailError,
    refresh,
    addComment,
    deleteComment,
    toggleLike,
    isCommentSubmitting,
    isCommentDeleting,
    isLikeToggling
  } = useArtworkDetail(workId, currentUser);

  const [newComment, setNewComment] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [showDeleteArtworkModal, setShowDeleteArtworkModal] = useState(false);
  const [deletingArtwork, setDeletingArtwork] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const isOwner = currentUser?.id === currentWork?.artistId;

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const handleArtistPress = (artistId: string) => {
    console.log('🎨 ArtworkDetail - Navigating to artist:', artistId);
    
    // Check if this is the current user
    if (currentUser && artistId === currentUser.id) {
      // It's you! Go to Profile tab
      navigateToProfile(navigation, artistId, currentUser?.id)
    } else {
      // It's another user, go to ArtistProfile
      navigation.navigate('Profile', { 
        userId: artistId
      });
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
      showAlert('Success', 'Comment added successfully', 'success');
    } else {
      showAlert('Error', 'Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    
    const success = await deleteComment(commentToDelete);
    if (success) {
      showAlert('Success', 'Comment deleted successfully', 'success');
    } else {
      showAlert('Error', 'Failed to delete comment', 'error');
    }
    
    setShowDeleteCommentModal(false);
    setCommentToDelete(null);
  };

  const handleLike = async () => {
    if (!currentUser) return;
    
    try {
      await toggleLike(); // ✅ Fixed: No userId parameter needed
    } catch (error) {
      showAlert('Error', 'Failed to update like', 'error');
    }
  };

  const handleDeleteArtwork = async () => {
    if (!workId) return;
    
    setDeletingArtwork(true);
    try {
      await worksService.deleteWork(workId);
      
      showAlert('Success', 'Artwork deleted successfully', 'success');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Error deleting artwork:', error);
      showAlert('Error', error.message || 'Failed to delete artwork', 'error');
    } finally {
      setDeletingArtwork(false);
      setShowDeleteArtworkModal(false);
    }
  };

  if (!workId) { 
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Work not found</Text>
      </View>
    );
  }

  if (loading || !currentWork) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading creative work...</Text>
      </View>
    );
  }

  return (
    <ScreenErrorBoundary onReset={refresh}>
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
      <ConfirmationModal
        visible={showDeleteArtworkModal}
        title="Delete Artwork"
        message="Are you sure you want to delete this artwork? This action cannot be undone."
        confirmText="Delete Artwork"
        onConfirm={handleDeleteArtwork}
        onCancel={() => setShowDeleteArtworkModal(false)}
        type="danger"
      />
      <ConfirmationModal
        visible={showDeleteCommentModal}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete Comment"
        onConfirm={confirmDeleteComment}
        onCancel={() => {
          setShowDeleteCommentModal(false);
          setCommentToDelete(null);
        }}
        type="danger"
      />
      <ScrollView style={styles.scrollView}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#007AFF']}
        />
      }
    >
        {/* Work Image */}
        <Image 
          source={{ uri: currentWork.assetUrl }} 
          style={styles.workImage}
          resizeMode="contain"
        />
        
        {/* Work Info */}
        <View style={styles.infoContainer}>
        <Text style={styles.title}>{currentWork.title}</Text>
          
        <TouchableOpacity 
          onPress={() => {
            if (artist?.id) {
              handleArtistPress(artist.id);
            }
          }}
          disabled={!artist?.id}
        >
          <Text style={[styles.artist, styles.clickableArtist]}>
            by {artist?.displayName || 'Unknown Artist'}
          </Text>
        </TouchableOpacity>
          
        <View style={styles.badgeContainer}>
          <MediaTypeBadge 
            mediaType={currentWork.mediaType}
            size="medium"
            variant="default"
          />
          <WorkTypeBadge 
            isOriginal={!currentWork.originalWorkId}
            size="medium"
          />
        </View>
          
        {currentWork.description && (
          <Text style={styles.description}>{currentWork.description}</Text>
        )}
          
          {/* Collaboration Chain */}
          {originalWork && (
            <View style={styles.collaborationChain}>
              <Text style={styles.chainTitle}>Inspired by:</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('ArtworkDetail', { workId: originalWork.id })}
              >
                <Text style={styles.chainLink}>{originalWork.title}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Stats */}
          <View style={styles.stats}>
            <LikeButton 
              isLiked={realTimeUserHasLiked} // ✅ Fixed: Use correct variable name
              likeCount={realTimeLikeCount} // ✅ Fixed: Use correct variable name
              onPress={handleLike} // ✅ Fixed: Use the handler function
              size="medium"
              disabled={isLikeToggling || !currentUser}
            />
            <Text style={styles.stat}>{comments.length} comments</Text>
            <Text style={styles.stat}>{collaborations.length} derivatives</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isOwner && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => setShowDeleteArtworkModal(true)}
                disabled={deletingArtwork}
              >
                {deletingArtwork ? (
                  <ActivityIndicator size="small" color="#ff4444" />
                ) : (
                  <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                )}
              </TouchableOpacity>
            )}
          
            <RemixButton 
              workId={currentWork.id}
              workTitle={currentWork.title}
              style={{ marginBottom: 12 }}
            />
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>
              Comments ({comments.length})
            </Text>
            {comments.map(comment => {
              const isCommentOwner = currentUser?.id === comment.userId;
              return (
                <View key={comment.id} style={styles.comment}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {comment.user?.displayName || comment.userId || 'Anonymous'}
                    </Text>
                    <Text style={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Text>
                    {isCommentOwner && (
                      <TouchableOpacity 
                        style={styles.deleteCommentButton}
                        onPress={() => handleDeleteComment(comment.id)}
                        disabled={isCommentDeleting(comment.id)} // ✅ Fixed: Pass comment.id
                      >
                        {isCommentDeleting(comment.id) ? (
                          <ActivityIndicator size="small" color="#ff4444" />
                        ) : (
                          <Text style={styles.deleteCommentText}>🗑️</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.commentText}>
                    {comment.content || comment.content} 
                  </Text>
                </View>
              );
            })}
            {comments.length === 0 && (
              <Text style={styles.noComments}>No comments yet. Be the first!</Text>
            )}
          </View>

          {/* Add Comment Section */}
          {currentUser && (
            <View style={styles.addCommentSection}>
              <Text style={styles.sectionTitle}>Add a Comment</Text>
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Share your thoughts..."
                  multiline
                  editable={!isCommentSubmitting} // ✅ Fixed: Use isCommentSubmitting
                />
                <TouchableOpacity 
                  style={[
                    styles.postButton,
                    (!newComment.trim() || isCommentSubmitting) && styles.postButtonDisabled
                  ]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || isCommentSubmitting}
                >
                  {isCommentSubmitting ? (
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
              {/* Future: derivative gallery */}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </ScreenErrorBoundary>
  );
};

// Styles remain the same...
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
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteCommentButton: {
    padding: 4,
    marginLeft: 8,
  },
  deleteCommentText: {
    color: '#d32f2f',
    fontSize: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  mediaDetailsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tags: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
});

export default ArtworkDetailScreen;