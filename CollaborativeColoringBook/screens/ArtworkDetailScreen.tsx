import React, {useState} from 'react';
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Artwork } from '../data/mockData';
import { RootStackParamList } from '../types/navigation';
import LikeButton from '../components/LikeButton';
import CommentButton from '../components/CommentButton';
import { useLikes } from '../context/LikesContext';
import { useComments } from '../context/CommentsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ArtworkDetail'>;

const ArtworkDetailScreen = ({ route, navigation }: Props) => {
  const artwork: Artwork | undefined = route.params?.artwork;
  const { toggleLike, isLiked, getLikeCount } = useLikes();
  const { addComment, getComments, getCommentCount } = useComments();
  const [newComment, setNewComment] = useState('');
  const [userName] = useState('CurrentUser');

  if (!artwork) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Artwork not found</Text>
      </View>
    );
  }
  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(artwork.id, newComment, userName);
      setNewComment(''); // Clear input after posting
    }
  };

  const comments = getComments(artwork.id);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
      {/* Artwork Image */}
      <Image 
        source={{ uri: artwork.lineArtUrl }} 
        style={styles.artworkImage}
        resizeMode="contain"
      />
      
      {/* Artwork Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{artwork.title}</Text>
        <Text style={styles.artist}>by {artwork.artist}</Text>
        
        {/* Stats */}
        <View style={styles.stats}>
        <LikeButton 
            isLiked={isLiked(artwork.id)}
            likeCount={getLikeCount(artwork.id)}
            onPress={() => toggleLike(artwork.id)}
            size="medium"
          />
          <CommentButton 
              commentCount={getCommentCount(artwork.id)}
              onPress={() => {}} // Already on comment screen
              size="medium"
            />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>🎨 Color This</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>💬 Comment</Text>
          </TouchableOpacity>
        </View>

        {/* Comment Section */}
        <View style={styles.addCommentSection}>
            <Text style={styles.sectionTitle}>Add a Comment</Text>
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write your comment..."
                multiline
              />
              <TouchableOpacity 
                style={[
                  styles.postButton,
                  !newComment.trim() && styles.postButtonDisabled
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments List */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>
              Comments ({comments.length})
            </Text>
            {comments.map(comment => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>{comment.userName}:</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentDate}>
                  {comment.createdAt.toLocaleDateString()}
                </Text>
              </View>
            ))}
            {comments.length === 0 && (
              <Text style={styles.noComments}>No comments yet. Be the first!</Text>
            )}
          </View>

        {/* Colorized Versions */}
        <View style={styles.colorizationsSection}>
          <Text style={styles.sectionTitle}>Colorized Versions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {artwork.colorizedVersions.map(version => (
              <TouchableOpacity key={version.id} style={styles.colorizedThumbnail}>
                <Image 
                  source={{ uri: version.coloredImageUrl }} 
                  style={styles.thumbnailImage}
                />
                <Text style={styles.colorist}>by {version.colorist}</Text>
              </TouchableOpacity>
            ))}
            {artwork.colorizedVersions.length === 0 && (
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
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
});

export default ArtworkDetailScreen;