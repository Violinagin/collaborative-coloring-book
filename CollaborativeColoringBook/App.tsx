import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GalleryScreen from './screens/GalleryScreen';
import ArtworkDetailScreen from './screens/ArtworkDetailScreen';
import { RootStackParamList } from './types/navigation';
import { LikesProvider } from './context/LikesContext';
import { CommentsProvider } from './context/CommentsContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProfileScreen from './screens/ProfileScreen';
import ColoringScreen from './screens/ColoringScreen';
import UploadScreen from './screens/UploadScreen';
import AuthScreen from './screens/AuthScreen';
import HeaderRight from './components/HeaderRight';
import { View, Text } from 'react-native';
import { supabase } from './lib/supabase';

// Create the navigator with your specific types
const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // User is signed in - show main app
          <>
            <Stack.Screen 
              name="Gallery" 
              component={GalleryScreen}
              options={({ navigation }) => ({ 
                title: 'Collaborative Coloring Book',
                headerRight: () => <HeaderRight />
              })}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
            <Stack.Screen 
              name="ArtworkDetail" 
              component={ArtworkDetailScreen}
              options={{ title: 'Artwork Details' }}
            />
            <Stack.Screen 
              name="Upload" 
              component={UploadScreen}
              options={{ title: 'Upload Line Art' }}
            />
            <Stack.Screen 
              name="Coloring" 
              component={ColoringScreen}
              options={{ title: 'Color This Artwork' }}
            />
          </>
        ) : (
          // User is not signed in - only show Auth screen
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <CommentsProvider>
          <LikesProvider>
            <Navigation />
          </LikesProvider>
        </CommentsProvider>
      </AppProvider>
    </AuthProvider>
  );
}