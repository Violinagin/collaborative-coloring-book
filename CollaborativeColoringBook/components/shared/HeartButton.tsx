// components/HeartButton.tsx - Updated for overlay
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface HeartButtonProps {
  isLiked: boolean;
  onPress: () => void;
  count: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'overlay';
}

export const HeartButton: React.FC<HeartButtonProps> = ({ 
  isLiked, 
  onPress, 
  count,
  size = 'medium',
  variant = 'default'
}) => {
  const theme = useTheme();
  
  const sizeMap = {
    small: { icon: 20, text: 12, spacing: 4 },
    medium: { icon: 24, text: 14, spacing: 6 },
    large: { icon: 32, text: 16, spacing: 8 },
  };
  
  const variantStyles = {
    default: {
      container: {
        backgroundColor: theme.palette.neutral[100],
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
      },
      iconColor: isLiked 
        ? theme.colorRoles.social.like 
        : theme.colorRoles.ui.text.secondary,
      textColor: isLiked 
        ?theme.colorRoles.social.like 
        : theme.colorRoles.ui.text.secondary,
    },
    overlay: {
      container: {
        backgroundColor: 'transparent',
        borderRadius: 0,
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
      iconColor: isLiked 
        ? theme.palette.brand.secondary[100]  // Light purple for overlay
        : 'white',
      textColor: isLiked 
        ? theme.palette.brand.secondary[100] 
        : 'white',
    },
  };
  
  const currentSize = sizeMap[size];
  const currentVariant = variantStyles[variant];
  
  return (
    <TouchableOpacity 
      style={[styles.container, currentVariant.container]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.icon,
        {
          fontSize: currentSize.text,
          color: currentVariant.iconColor,
          marginRight: currentSize.spacing,
        }
      ]}>
        {isLiked ? '💜' : '🤍'}
      </Text>
      <Text style={[
        styles.count,
        {
          fontSize: currentSize.text,
          color: currentVariant.textColor,
          fontWeight: '600',
        }
      ]}>
        {count}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    lineHeight: 24,
  },
  count: {
    lineHeight: 20,
  },
});