import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Artwork } from '../data/mockData';
import { RootStackParamList } from '../types/navigation';
import LikeButton from '../components/LikeButton';
import { useLikes } from '../context/LikesContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ArtworkDetail'>;

const ArtworkDetailScreen = ({ route, navigation }: Props) => {
  const artwork: Artwork | undefined = route.params?.artwork;
  const { toggleLike, isLiked, getLikeCount } = useLikes();

  if (!artwork) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Artwork not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.stat}>{artwork.comments.length} comments</Text>
          <Text style={styles.stat}>{artwork.colorizedVersions.length} colorizations</Text>
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

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments</Text>
          {artwork.comments.map(comment => (
            <View key={comment.id} style={styles.comment}>
              <Text style={styles.commentAuthor}>{comment.userName}:</Text>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}
          {artwork.comments.length === 0 && (
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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