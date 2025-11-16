import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type CommentButtonProps = {
  commentCount: number;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
};

const CommentButton = ({ 
  commentCount, 
  onPress, 
  size = 'medium' 
}: CommentButtonProps) => {
  const sizeStyles = {
    small: { padding: 6, fontSize: 12 },
    medium: { padding: 8, fontSize: 14 },
    large: { padding: 12, fontSize: 16 },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { padding: sizeStyles[size].padding }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, { fontSize: sizeStyles[size].fontSize }]}>
        💬 {commentCount}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  buttonText: {
    fontWeight: '600',
  },
});

export default CommentButton;