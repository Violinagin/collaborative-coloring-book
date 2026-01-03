// styles/utils.ts
import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive sizing
export const responsive = {
  width: (percentage: number) => SCREEN_WIDTH * (percentage / 100),
  height: (percentage: number) => SCREEN_HEIGHT * (percentage / 100),
  font: (size: number) => {
    const scale = SCREEN_WIDTH / 375; // Based on iPhone 6/7/8
    return size * scale;
  }
};