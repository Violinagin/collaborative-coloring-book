// src/components/MediaTypeBadge.tsx
import React from 'react';
import { Text, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { MediaType } from '../types/core';
import { mediaUtils } from '../utils/mediaUtils';

export type BadgeSize = 'xsmall' | 'small' | 'medium' | 'large';
export type BadgeVariant = 'default' | 'outline' | 'minimal';

interface MediaTypeBadgeProps {
  mediaType: MediaType;
  showLabel?: boolean;
  showEmoji?: boolean;
  size?: BadgeSize;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  // For showing as a remix badge
  isRemix?: boolean;
}

export const MediaTypeBadge: React.FC<MediaTypeBadgeProps> = ({ 
  mediaType, 
  showLabel = true,
  showEmoji = true,
  size = 'medium',
  variant = 'default',
  style,
  textStyle,
  isRemix = false
}) => {
  const config = mediaUtils.getMediaTypeConfig(mediaType);
  
  // Size mappings
  const sizeStyles = {
    xsmall: { 
      fontSize: 9, 
      paddingHorizontal: 5, 
      paddingVertical: 2,
      emojiSize: 10
    },
    small: { 
      fontSize: 11, 
      paddingHorizontal: 6, 
      paddingVertical: 3,
      emojiSize: 12
    },
    medium: { 
      fontSize: 13, 
      paddingHorizontal: 8, 
      paddingVertical: 4,
      emojiSize: 14
    },
    large: { 
      fontSize: 15, 
      paddingHorizontal: 10, 
      paddingVertical: 6,
      emojiSize: 16
    },
  };

  // Variant styles
  const variantStyles = {
    default: {
      backgroundColor: config.color,
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: config.color,
      textColor: config.color,
    },
    minimal: {
      backgroundColor: `${config.color}15`, // 15 = ~10% opacity
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: config.color,
    }
  };

  const currentSize = sizeStyles[size];
  const currentVariant = variantStyles[variant];

  // Build content
  let content = '';
  if (showEmoji) content += `${config.emoji} `;
  if (showLabel) content += config.label;
  if (isRemix && content) content += ' Remix';

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: currentVariant.backgroundColor,
        borderWidth: currentVariant.borderWidth,
        borderColor: currentVariant.borderColor,
        paddingHorizontal: currentSize.paddingHorizontal,
        paddingVertical: currentSize.paddingVertical,
        borderRadius: currentSize.fontSize * 2, // Scale border radius with font size
      },
      style
    ]}>
      <Text style={[
        styles.text,
        {
          fontSize: currentSize.fontSize,
          color: currentVariant.textColor,
        },
        textStyle
      ]}>
        {content}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default MediaTypeBadge;