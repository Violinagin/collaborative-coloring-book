// hooks/useNavigation.ts
import { useNavigation as useReactNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

export const useNavigation = () => {
  const navigation = useReactNavigation<NavigationProp<RootStackParamList>>();
  return navigation;
};

// Alternative: More specific hook for screens
export const useRootNavigation = () => {
  return useReactNavigation<NavigationProp<RootStackParamList>>();
};