// components/WorkCard/WorkCard.tsx - UPDATED WITH ASPECT RATIOS
import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../shared/ThemedText';
import { Icons } from '../shared/Icon';
import { HeartButton } from '../shared/HeartButton';
import { MediaTypeBadge } from '../MediaTypeBadge';
import { WorkTypeBadge } from '../WorkTypeBadge';
import { navigateToProfile, handleArtistPressNav } from '../../utils/navigation';

import { useAuth } from '../../context/AuthContext';


const { width: SCREEN_WIDTH } = Dimensions.get('window');


interface WorkCardProps {
  work: {
    id: string;
    title: string;
    assetUrl: string;
    artistId: string;
    artist: {
      displayName: string;
      username?: string;
    };
    mediaType: string;
    originalWorkId?: string;
    description?: string;
    aspectRatio?: number; // Optional for now
  };
  likeInfo: {
    count: number;
    isLiked: boolean;
  };
  commentCount: number;
  remixCount?: number;
  onLikePress: () => void;
  onArtistPress?: (artistId: string) => void;
}

// Aspect ratio defaults by media type
const MEDIA_TYPE_ASPECT_RATIOS: Record<string, number> = {
  // Images
  line_art: 1,        // Square (1:1)
  colored_art: 1,     // Square (1:1)
  digital_art: 1.5,   // Widescreen (3:2)
  comic: 1.333,       // Standard comic (4:3)
  photo: 1.5,         // Standard photo (3:2)
  
  // Video/Animation
  animation: 1.777,   // 16:9 video
  video: 1.777,       // 16:9
  
  // Writing
  writing: 1.414,     // A4 paper (√2:1)
  
  // Music
  music: 1,           // Square album cover
  
  // 3D
  three_d: 1,         // Square preview
  
  // Default fallback
  default: 1,
};

export const WorkCard: React.FC<WorkCardProps> = ({
  work,
  likeInfo,
  commentCount,
  remixCount = 0,
  onLikePress,
  onArtistPress,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  
  const isRemix = !!work.originalWorkId;
  const artistDisplayName = work.artist?.displayName || 'Unknown Artist';

  // Calculate image height based on media type aspect ratio
  const calculateImageHeight = () => {
    const CARD_WIDTH = SCREEN_WIDTH - 24; // Account for margins (12 + 12)
    
    // Use provided aspect ratio, or default based on media type
    const aspectRatio = work.aspectRatio || 
                       MEDIA_TYPE_ASPECT_RATIOS[work.mediaType] || 
                       MEDIA_TYPE_ASPECT_RATIOS.default;
    
    // Calculate initial height
    let height = CARD_WIDTH / aspectRatio;
    
    // Apply reasonable constraints
    const MIN_HEIGHT = 200;
    const MAX_HEIGHT = SCREEN_WIDTH * 1.5; // Max 1.5x screen width
    
    // Clamp between min and max
    height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height));
    
    return { height, aspectRatio };
  };

  const { height: imageHeight, aspectRatio } = calculateImageHeight();

  // Artist press handler
  const handleArtistPress = (artistId: string) => {
    handleArtistPressNav(navigation, artistId, user?.id);
  };

  const handleCardPress = () => {
    navigation.navigate('ArtworkDetail', { workId: work.id });
  };

  const handleCommentPress = () => {
    navigation.navigate('ArtworkDetail', { 
      workId: work.id,
    });
  };

  const handleRemixPress = () => {
    navigation.navigate('CreateRemix', {
      originalWorkId: work.id,
      originalWorkTitle: work.title,
    });
  };

  // Determine resize mode based on aspect ratio
  const resizeMode = aspectRatio >= 1 ? 'cover' : 'contain';

  return (
    <View style={styles.container}>
      {/* Artwork Image with Overlay Badges */}
      <TouchableOpacity 
        onPress={handleCardPress}
        activeOpacity={0.95}
        style={styles.imageContainer}
      >
        <Image
          source={{ uri: work.assetUrl }}
          style={[styles.image, { height: imageHeight }]}
          resizeMode={resizeMode}
        />
        
        {/* Dark gradient overlay at bottom for text readability */}
        <View style={[
          styles.gradientOverlay,
          { 
            // Adjust gradient height based on image height
            height: Math.min(80, imageHeight * 0.4)
          }
        ]} />
        
        {/* Media Type Badge (top-left)
        <View style={styles.mediaTypeBadge}>
          <MediaTypeBadge 
            mediaType={work.mediaType}
            size="small"
            variant="outline"
          />
        </View> */}
        
        {/* Work Type Badge (top-right)
        {isRemix && (
          <View style={styles.workTypeBadge}>
            <WorkTypeBadge 
              isOriginal={false}
              size="small"
              variant="remix"
            />
          </View>
        )} */}
        
        {/* Title and Artist Overlay (bottom) */}
        <View style={styles.imageOverlay}>
          <ThemedText 
            type="subtitle" 
            style={[styles.overlayTitle, { color: 'white' }]}
            numberOfLines={1}
          >
            {work.title}
          </ThemedText>
          <TouchableOpacity onPress={() => {
            if (onArtistPress) {
                onArtistPress(work.artistId);
            } else {
             // Fallback: navigate directly (keep for backward compatibility)
                navigateToProfile(navigation, work.artistId, user?.id);
            }
          }}>
            <ThemedText 
              type="caption" 
              style={[styles.overlayArtist, { 
                color: theme.palette.brand.secondary[300] // Light purple
              }]}
              numberOfLines={1}
            >
              by {artistDisplayName}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Social Actions Row */}
      <View style={styles.actionsRow}>
        <HeartButton 
          isLiked={likeInfo.isLiked}
          onPress={onLikePress}
          count={likeInfo.count}
          size="medium"
        />
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleCommentPress}
        >
          <Icons.Comment 
            size={22} 
            color={theme.colorRoles.social.comment} 
          />
          <ThemedText 
            type="caption" 
            style={[
              styles.actionCount,
              { color: theme.colorRoles.social.comment }
            ]}
          >
            {commentCount}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleRemixPress}
        >
          <Icons.Remix 
            size={22} 
            color={theme.colorRoles.social.remix} 
          />
          <ThemedText 
            type="caption" 
            style={[
              styles.actionCount,
              { color: theme.colorRoles.social.remix }
            ]}
          >
            {remixCount > 0 ? remixCount : 'Remix'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Description (if available) */}
      {work.description && (
        <View style={styles.descriptionContainer}>
          <ThemedText 
            type="body" 
            style={[
              styles.description,
              { color: theme.colorRoles.ui.text.secondary }
            ]}
            numberOfLines={2}
          >
            {work.description}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    backgroundColor: '#f3f4f6',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  workTypeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  overlayTitle: {
    fontWeight: '600',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  overlayArtist: {
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 14,
  },
  descriptionContainer: {
    padding: 16,
  },
  description: {
    lineHeight: 20,
    fontSize: 14,
  },
});