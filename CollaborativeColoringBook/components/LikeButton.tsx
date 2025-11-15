import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';

// Define the component's props
type LikeButtonProps = {
  isLiked: boolean;
  likeCount: number;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large'; // Optional size prop
};

const LikeButton = ({ 
  isLiked, 
  likeCount, 
  onPress, 
  size = 'medium' 
}: LikeButtonProps) => {
  // Simple scale animation value
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Animation when pressed
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Call the parent's onPress function
    onPress();
  };

  // Size configurations
  const sizeStyles = {
    small: { padding: 6, fontSize: 12 },
    medium: { padding: 8, fontSize: 14 },
    large: { padding: 12, fontSize: 16 },
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          { padding: sizeStyles[size].padding },
          isLiked ? styles.liked : styles.notLiked
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, { fontSize: sizeStyles[size].fontSize }]}>
          {isLiked ? '❤️' : '🤍'} {likeCount}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  liked: {
    backgroundColor: '#ffe6e6',
  },
  notLiked: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    fontWeight: '600',
  },
});

export default LikeButton;