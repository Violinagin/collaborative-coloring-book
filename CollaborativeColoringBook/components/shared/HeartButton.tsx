import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface HeartButtonProps {
  isLiked: boolean;
  onPress: () => void;
  count: number;
  size?: 'small' | 'medium' | 'large';
}

export const HeartButton: React.FC<HeartButtonProps> = ({ 
  isLiked, 
  onPress, 
  count,
  size = 'medium' 
}) => {
  const theme = useTheme();
  
  const sizeMap = {
    small: { button: 24, text: theme.typography.caption.fontSize },
    medium: { button: 32, text: theme.typography.body.fontSize },
    large: { button: 40, text: theme.typography.subheading.fontSize },
  };
  
  const currentSize = sizeMap[size];
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 6,
          backgroundColor: theme.palette.neutral[100],
          borderRadius: theme.borderRadius.full,
          flexDirection: 'row',
          alignItems: 'center',
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={{
        fontSize: currentSize.button * 0.6,
        marginRight: theme.spacing.xs,
        color: isLiked ? theme.colorRoles.social.like : theme.colorRoles.ui.text.secondary,
      }}>
        {isLiked ? '💜' : '🤍'}
      </Text>
      <Text style={{
        fontSize: theme.typography.caption.fontSize,
        fontWeight: '600',
        color: isLiked ? theme.colorRoles.social.like : theme.colorRoles.ui.text.secondary,
      }}>
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
});

export default HeartButton;