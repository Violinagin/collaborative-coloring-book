import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogBox } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

import { ThemeProvider } from './context/ThemeContext';
import { FloatingThemeButton } from './components/DevTools/FloatingThemeButton';

import GalleryScreen from './screens/GalleryScreen';
import ArtworkDetailScreen from './screens/ArtworkDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import CreateRemixScreen from './screens/CreateRemixScreen';
import UploadScreen from './screens/UploadScreen';
import AuthScreen from './screens/AuthScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ThemePreviewScreen from './screens/ThemePreviewScreen';

import HeaderRight from './components/HeaderRight';
import GalleryHeaderRight from './components/GalleryHeaderRight';

import { RootStackParamList } from './types/navigation';

LogBox.ignoreAllLogs(false);

// Create the navigator with your specific types
const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { user, loading } = useAuth();

  return (
      <Stack.Navigator>
        {/* Gallery is always accessible to everyone */}
        <Stack.Screen 
          name="Gallery" 
          component={GalleryScreen}
          options={({ navigation }) => ({ 
            title: 'Fork Art',
            headerRight: () => <GalleryHeaderRight />
          })}
        />
        
        {/* Artwork details are public */}
        <Stack.Screen 
          name="ArtworkDetail" 
          component={ArtworkDetailScreen}
          options={{ title: 'Artwork Details',
          headerRight: () => <HeaderRight /> 
        }}
        />

        {/* DEVELOPMENT SCREENS - Always accessible in dev */}
      {__DEV__ && (
        <Stack.Screen 
          name="ThemePreview" 
          component={ThemePreviewScreen}
          options={{ 
            title: '🎨 Theme Reference',
            headerShown: true,
          }}
        />
      )}

        {user ? (
          // User is signed in - show protected screens
          <>
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile', headerRight: () => <HeaderRight /> 
            }}
            />
            <Stack.Screen 
              name="Upload" 
              component={UploadScreen}
              options={{ title: 'Upload Original Art', headerRight: () => <HeaderRight />
             }}
            />
            <Stack.Screen 
              name="CreateRemix" 
              component={CreateRemixScreen}
              options={{ title: 'Create Remix',
              headerRight: () => <HeaderRight />
             }}
            />
            {/* <Stack.Screen 
              name="SkiaColoring" 
              component={SkiaColoringScreen}
              options={{ title: 'Color This Artwork' }}
            /> */}
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ title: 'Edit Profile',
              headerRight: () => <HeaderRight />
             }}
            />
          </>
        ) : (
          // User is not signed in - show auth screen
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <Navigation />
          {__DEV__ && <FloatingThemeButton />}
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}