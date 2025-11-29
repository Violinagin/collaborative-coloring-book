// components/ArtworkCard.tsx
import React, { memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image
} from 'react-native';
import { CreativeWork } from '../types/core';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import LikeButton from '../components/LikeButton';
import CommentButton from '../components/CommentButton';

interface ArtworkCardProps {
  artwork: CreativeWork;
  showArtist?: boolean;
  onPress?: (artwork: CreativeWork) => void;
  variant?: 'default' | 'compact';
  onLike?: (artworkId: string) => void;
  onComment?: (artworkId: string) => void;
}

export const ArtworkCard = memo<ArtworkCardProps>(({ 
  artwork, 
  showArtist = true,
  onPress,
  variant = 'default',
  onLike,
  onComment
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    if (onPress) {
      onPress(artwork);
    } else {
      navigation.navigate('ArtworkDetail', { work });
    }
  };

  const handleLike = () => {
    if (onLike) {
      onLike(artwork.id);
    } else {
      // Default like behavior
      console.log('Liked artwork:', artwork.id);
      // You could also navigate to detail with like intent
      navigation.navigate('ArtworkDetail', { 
        artwork,
        autoFocusComment: false 
      });
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(artwork.id);
    } else {
      // Default comment behavior - navigate to detail with comment focus
      navigation.navigate('ArtworkDetail', { 
        artwork,
        autoFocusComment: true 
      });
    }
  };

  const isDerivative = !!artwork.originalWorkId;
  const hasDerivatives = artwork.derivationChain && artwork.derivationChain.length > 0;
  const likeCount = artwork.likes?.length || 0;
  const commentCount = artwork.comments?.length || 0;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        variant === 'compact' && styles.compactContainer
      ]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: artwork.assetUrl }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        {/* Derivative Badge */}
        {isDerivative && (
          <View style={styles.derivativeBadge}>
            <Text style={styles.badgeText}>Inspired</Text>
          </View>
        )}

        {/* Quick Actions Overlay */}
        <View style={styles.actionsOverlay}>
          <LikeButton 
            artworkId={artwork.id}
            initialLiked={artwork.userHasLiked || false}
            likeCount={likeCount}
            onLike={handleLike}
            variant="overlay"
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and Artist */}
        <Text style={styles.title} numberOfLines={1}>
          {artwork.title}
        </Text>
        
        {showArtist && (
          <Text style={styles.artist} numberOfLines={1}>
            by {artwork.artist?.displayName || 'Unknown Artist'}
          </Text>
        )}

        {/* Interactive Stats Row */}
        <View style={styles.statsContainer}>
          <LikeButton 
            artworkId={artwork.id}
            initialLiked={artwork.userHasLiked || false}
            likeCount={likeCount}
            onLike={handleLike}
            variant="inline"
            size="small"
          />
          
          <CommentButton 
            artworkId={artwork.id}
            commentCount={commentCount}
            onPress={handleComment}
            variant="inline"
            size="small"
          />
          
          {hasDerivatives && (
            <View style={styles.stat}>
              <Text style={styles.statIcon}>🎨</Text>
              <Text style={styles.statCount}>{artwork.derivationChain.length}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {artwork.tags && artwork.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {artwork.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {artwork.tags.length > 2 && (
              <Text style={styles.moreTags}>+{artwork.tags.length - 2} more</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  compactContainer: {
    marginBottom: 8,
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  derivativeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  actionsOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  moreTags: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
});

ArtworkCard.displayName = 'ArtworkCard';