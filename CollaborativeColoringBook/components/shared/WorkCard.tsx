// components/shared/WorkCard/WorkCard.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation';
import { CreativeWork } from '../../../types/core';
import { MediaTypeBadge } from '../../MediaTypeBadge';
import { WorkTypeBadge } from '../../WorkTypeBadge';
import { HeartButton } from '../../HeartButton';

interface WorkCardProps {
  work: CreativeWork;
  likeInfo?: {
    count: number;
    isLiked: boolean;
  };
  commentCount?: number;
  remixCount?: number;
  onLikePress?: (workId: string) => void;
  onCommentPress?: (workId: string) => void;
  onRemixPress?: (workId: string, workTitle: string) => void;
  variant?: 'default' | 'compact' | 'featured';
  showArtist?: boolean;
  showActions?: boolean;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const WorkCard: React.FC<WorkCardProps> = ({
  work,
  likeInfo = { count: 0, isLiked: false },
  commentCount = 0,
  remixCount = 0,
  onLikePress,
  onCommentPress,
  onRemixPress,
  variant = 'default',
  showArtist = true,
  showActions = true,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { width } = Dimensions.get('window');
  
  const isRemix = !!work.originalWorkId;
  const artistDisplayName = work.artist?.displayName || 'Unknown Artist';
  
  // Calculate dynamic image height based on aspect ratio
  const imageHeight = useMemo(() => {
    const targetHeight = width * 0.8; // 80% of screen width
    const maxHeight = Dimensions.get('window').height * 0.7;
    
    if (work.aspectRatio) {
      const calculatedHeight = width / work.aspectRatio;
      return Math.min(calculatedHeight, maxHeight);
    }
    
    return Math.min(targetHeight, maxHeight);
  }, [width, work.aspectRatio]);

  const styles = useMemo(() => createStyles(theme, variant, imageHeight), 
    [theme, variant, imageHeight]);

  const handleCardPress = () => {
    navigation.navigate('ArtworkDetail', { workId: work.id });
  };

  const handleArtistPress = () => {
    navigation.navigate('Profile', { userId: work.artistId });
  };

  const handleLikePressInternal = () => {
    if (onLikePress) {
      onLikePress(work.id);
    }
  };

  const handleCommentPressInternal = () => {
    if (onCommentPress) {
      onCommentPress(work.id);
    } else {
      navigation.navigate('ArtworkDetail', { workId: work.id });
    }
  };

  const handleRemixPressInternal = () => {
    if (onRemixPress) {
      onRemixPress(work.id, work.title);
    } else {
      navigation.navigate('CreateRemix', {
        originalWorkId: work.id,
        originalWorkTitle: work.title,
      });
    }
  };

  const renderMediaPreview = () => {
    // For now, handle images. We'll expand for other media types later.
    if (work.assetUrl) {
      return (
        <Image
          source={{ uri: work.assetUrl }}
          style={styles.mediaImage}
          resizeMode="contain"
        />
      );
    }
    
    // Placeholder for other media types
    return (
      <View style={styles.mediaPlaceholder}>
        <Text style={styles.mediaIcon}>🎨</Text>
        <Text style={styles.mediaLabel}>
          {work.mediaType.replace('_', ' ')}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleCardPress}
      activeOpacity={0.95}
    >
      {/* Media Preview */}
      <View style={styles.mediaContainer}>
        {renderMediaPreview()}
        
        {/* Gradient Overlay (for text readability) */}
        <View style={styles.gradientOverlay} />
        
        {/* Content Overlay */}
        <View style={styles.contentOverlay}>
          {/* Badges in top-right corner */}
          <View style={styles.badgesContainer}>
            <MediaTypeBadge 
              mediaType={work.mediaType}
              size="small"
              variant="outline"
            />
            <WorkTypeBadge 
              isOriginal={!isRemix}
              size="small"
              variant={isRemix ? 'remix' : 'original'}
            />
          </View>
          
          {/* Bottom Content Area */}
          <View style={styles.bottomContent}>
            {/* Social Actions Row */}
            {showActions && (
              <View style={styles.actionsRow}>
                <HeartButton 
                  isLiked={likeInfo.isLiked}
                  onPress={handleLikePressInternal}
                  count={likeInfo.count}
                  size="medium"
                  variant="overlay" // Special variant for overlay
                />
                
                <TouchableOpacity
                  style={styles.commentButton}
                  onPress={handleCommentPressInternal}
                >
                  <Text style={styles.commentIcon}>💬</Text>
                  <Text style={styles.commentCount}>{commentCount}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.remixButton}
                  onPress={handleRemixPressInternal}
                >
                  <Text style={styles.remixIcon}>🔄</Text>
                  <Text style={styles.remixCount}>{remixCount}</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Title and Artist */}
            <View style={styles.metadata}>
              <Text style={styles.title} numberOfLines={1}>
                {work.title}
              </Text>
              
              {showArtist && (
                <TouchableOpacity onPress={handleArtistPress}>
                  <Text style={styles.artist} numberOfLines={1}>
                    by {artistDisplayName}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (
  theme: any,
  variant: string,
  imageHeight: number
) => StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: variant === 'compact' ? 2 : 4,
    backgroundColor: variant === 'featured' 
      ? theme.colorRoles.ui.card 
      : 'transparent',
    borderRadius: variant === 'featured' ? 12 : 0,
    overflow: 'hidden',
  },
  mediaContainer: {
    width: '100%',
    height: imageHeight,
    backgroundColor: theme.palette.neutral[900],
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.neutral[800],
  },
  mediaIcon: {
    fontSize: 48,
    color: theme.palette.neutral[500],
    marginBottom: theme.spacing.sm,
  },
  mediaLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.palette.neutral[500],
    textTransform: 'capitalize',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundGradient: 'vertical',
    gradientColors: ['transparent', 'rgba(0,0,0,0.7)'],
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.xs,
  },
  bottomContent: {
    marginBottom: theme.spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  commentIcon: {
    fontSize: 20,
    color: 'white',
  },
  commentCount: {
    fontSize: theme.typography.caption.fontSize,
    color: 'white',
    fontWeight: '600',
  },
  remixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  remixIcon: {
    fontSize: 20,
    color: 'white',
  },
  remixCount: {
    fontSize: theme.typography.caption.fontSize,
    color: 'white',
    fontWeight: '600',
  },
  metadata: {
    // Title and artist area
  },
  title: {
    fontSize: theme.typography.heading.fontSize,
    fontWeight: theme.typography.heading.fontWeight,
    color: 'white',
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  artist: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colorRoles.interactive[300], // Light blue
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});