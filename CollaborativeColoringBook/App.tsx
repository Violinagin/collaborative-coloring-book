import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GalleryScreen from './screens/GalleryScreen';
import ArtworkDetailScreen from './screens/ArtworkDetailScreen';
import { RootStackParamList } from './types/navigation';

// Create the navigator with your specific types
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Gallery">
        <Stack.Screen 
          name="Gallery" 
          component={GalleryScreen}
          options={{ title: 'Collaborative Coloring Book' }}
        />
        <Stack.Screen 
          name="ArtworkDetail" 
          component={ArtworkDetailScreen}
          options={{ title: 'Artwork Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}