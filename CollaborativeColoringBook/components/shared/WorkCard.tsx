// components/shared/WorkCard.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { CreativeWork, MediaType } from '../../types/core';
import { mediaUtils } from '../../utils/mediaUtils';
import { WorkTypeBadge } from '../WorkTypeBadge';
import { MediaTypeBadge } from '../MediaTypeBadge';
import { HeartButton } from './HeartButton';

interface WorkCardProps {
  work: CreativeWork;
  likeInfo?: {
    count: number;
    isLiked: boolean;
  };
  commentCount?: number;
  onLikePress: (workId: string) => void;
  onCommentPress?: (workId: string) => void;
  onRemixPress?: (workId: string, workTitle: string) => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'compact' | 'featured';
  showActions?: boolean;
  showArtist?: boolean;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const WorkCard: React.FC<WorkCardProps> = ({
  work,
  likeInfo = { count: 0, isLiked: false },
  commentCount = 0,
  onLikePress,
  onCommentPress,
  onRemixPress,
  size = 'medium',
  variant = 'default',
  showActions = true,
  showArtist = true,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { width } = Dimensions.get('window');
  
  const isRemix = !!work.originalWorkId;
  const artistDisplayName = work.artist?.displayName || 'Unknown Artist';
  
  // Calculate responsive dimensions
  const cardDimensions = useMemo(() => {
    const basePadding = theme.spacing.md;
    const baseMargin = theme.spacing.sm;
    
    switch (size) {
      case 'small':
        return {
          width: width * 0.4 - baseMargin * 2,
          imageHeight: 120,
          padding: theme.spacing.sm,
        };
      case 'large':
        return {
          width: width - basePadding * 2,
          imageHeight: 400,
          padding: theme.spacing.lg,
        };
      case 'medium':
      default:
        return {
          width: width - basePadding * 2,
          imageHeight: 350,
          padding: theme.spacing.md,
        };
    }
  }, [size, width, theme.spacing]);

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: theme.colorRoles.ui.card,
        borderRadius: theme.borderRadius.lg,
        padding: cardDimensions.padding,
        margin: theme.spacing.sm,
        width: cardDimensions.width,
        alignSelf: 'center',
        ...theme.shadows.md,
      },
      featuredContainer: {
        borderWidth: 2,
        borderColor: theme.colorRoles.social.remix,
        ...theme.shadows.lg,
      },
      compactContainer: {
        padding: theme.spacing.sm,
        margin: theme.spacing.xs,
      },
      mediaContainer: {
        width: '100%',
        height: cardDimensions.imageHeight,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.palette.neutral[100],
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
      },
      imageMedia: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
      },
      textMedia: {
        padding: theme.spacing.lg,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
      },
      musicMedia: {
        padding: theme.spacing.lg,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.palette.brand.secondary[100],
      },
      videoMedia: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.neutral[900],
        justifyContent: 'center',
        alignItems: 'center',
      },
      mediaIcon: {
        fontSize: 48,
        marginBottom: theme.spacing.sm,
      },
      mediaLabel: {
        fontSize: theme.typography.body.fontSize,
        fontWeight: '600',
        color: theme.colorRoles.ui.text.primary,
        textAlign: 'center',
      },
      workInfo: {
        marginTop: variant === 'compact' ? 0 : theme.spacing.sm,
      },
      title: {
        fontSize: size === 'small' ? theme.typography.caption.fontSize : theme.typography.body.fontSize,
        fontWeight: '600',
        color: theme.colorRoles.ui.text.primary,
        lineHeight: size === 'small' ? theme.typography.caption.lineHeight : theme.typography.body.lineHeight,
      },
      artist: {
        fontSize: theme.typography.caption.fontSize,
        color: theme.colorRoles.social.remix,
        marginTop: theme.spacing.xs,
      },
      description: {
        fontSize: theme.typography.caption.fontSize,
        color: theme.colorRoles.ui.text.secondary,
        marginTop: theme.spacing.xs,
        lineHeight: theme.typography.caption.lineHeight,
      },
      badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.sm,
        marginBottom: showActions ? theme.spacing.sm : 0,
      },
      actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
      },
      likeCommentRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        alignItems: 'center',
      },
      commentButton: {
        backgroundColor: theme.palette.neutral[100],
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
      },
      commentButtonText: {
        fontSize: theme.typography.caption.fontSize,
        fontWeight: '600',
        color: theme.colorRoles.ui.text.secondary,
        marginLeft: theme.spacing.xs,
      },
      remixButton: {
        backgroundColor: theme.colorRoles.social.remix,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 8,
        minWidth: 80,
      },
      remixButtonText: {
        color: theme.colorRoles.ui.text.inverse,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: '600',
        textAlign: 'center',
      },
      excerpt: {
        fontSize: theme.typography.body.fontSize,
        color: theme.colorRoles.ui.text.secondary,
        fontStyle: 'italic',
        marginTop: theme.spacing.sm,
        lineHeight: theme.typography.body.lineHeight,
      },
    });
  }, [theme, size, variant, cardDimensions, showActions]);

  const renderMediaPreview = () => {
    switch (work.mediaType) {
      case 'line_art':
      case 'colored_art':
      case 'digital_art':
      case 'comic':
      case 'three_d':
      case 'animation':
        return (
          <Image 
            source={{ uri: work.assetUrl }} 
            style={styles.imageMedia}
            resizeMode="cover"
          />
        );
      
      case 'writing':
        return (
          <View style={styles.textMedia}>
            <Text style={styles.mediaIcon}>📝</Text>
            <Text style={styles.mediaLabel}>Writing</Text>
            {work.excerpt && (
              <Text style={styles.excerpt} numberOfLines={3}>
                "{work.excerpt}"
              </Text>
            )}
          </View>
        );
      
      case 'music':
        return (
          <View style={styles.musicMedia}>
            <Text style={styles.mediaIcon}>🎵</Text>
            <Text style={styles.mediaLabel}>Music Track</Text>
            {work.title && (
              <Text style={styles.description} numberOfLines={1}>
                {work.title}
              </Text>
            )}
          </View>
        );
      
      default:
        return (
          <View style={styles.videoMedia}>
            <Text style={[styles.mediaIcon, { color: 'white' }]}>🎬</Text>
            <Text style={[styles.mediaLabel, { color: 'white' }]}>
              {mediaUtils.getMediaTypeLabel(work.mediaType)}
            </Text>
          </View>
        );
    }
  };

  const handleCardPress = () => {
    navigation.navigate('ArtworkDetail', { workId: work.id });
  };

  const handleArtistPress = () => {
    navigation.navigate('Profile', { userId: work.artistId });
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

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variant === 'featured' && styles.featuredContainer,
        variant === 'compact' && styles.compactContainer,
      ]}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      <View style={styles.mediaContainer}>
        {renderMediaPreview()}
      </View>
      
      <View style={styles.workInfo}>
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
        
        {work.description && variant !== 'compact' && (
          <Text style={styles.description} numberOfLines={2}>
            {work.description}
          </Text>
        )}
        
        <View style={styles.badgesContainer}>
          <MediaTypeBadge 
            mediaType={work.mediaType}
            size={size === 'small' ? 'xsmall' : 'small'}
            variant="default"
          />
          <WorkTypeBadge 
            isOriginal={!isRemix} 
            size={size === 'small' ? 'xsmall' : 'small'}
          />
        </View>
        
        {showActions && (
          <View style={styles.actionsRow}>
            <View style={styles.likeCommentRow}>
              <HeartButton 
                isLiked={likeInfo.isLiked}
                onPress={() => onLikePress(work.id)}
                count={likeInfo.count}
                size={size === 'small' ? 'xsmall' : 'small'}
              />
              
              <TouchableOpacity 
                style={styles.commentButton}
                onPress={handleCommentPressInternal}
              >
                <Text>💬</Text>
                <Text style={styles.commentButtonText}>{commentCount}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.remixButton}
              onPress={handleRemixPressInternal}
            >
              <Text style={styles.remixButtonText}>
                {work.mediaType === 'writing' ? '📝 Respond' : 
                 work.mediaType === 'music' ? '🎵 Remix' : 
                 '🔄 Remix'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};