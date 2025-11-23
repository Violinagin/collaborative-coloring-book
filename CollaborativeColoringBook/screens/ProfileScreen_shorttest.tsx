// screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { User, UserRole, Artwork } from '../types/User';
import { directSupabaseService } from '../services/directSupabaseService';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen = ({ route, navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<'lineArt' | 'colorWork' | 'activity'>('lineArt');
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userLineArt, setUserLineArt] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  
  // Get the user ID from navigation params
  const { userId } = route.params;
  
  // Determine if this is the current user's own profile
  const isOwnProfile = userId === currentUser?.id;
  
  // Safety check - redirect if no valid user ID
  useEffect(() => {
    if (!userId) {
      console.log('No user ID provided, redirecting to auth');
      navigation.replace('Auth');
      return;
    }
  }, [userId, navigation]);

  // Load user profile data with timeout
  const loadUserProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setLoadFailed(false);
      console.log('🚀 Loading profile for user:', userId);
      
      // Use direct service instead of supabaseService
      const userData = await directSupabaseService.getUser(userId);
      console.log('✅ User data loaded successfully:', userData);
      setProfileUser(userData);
      
      const artworks = await directSupabaseService.getArtworks();
      console.log('✅ Artworks loaded, count:', artworks.length);
      const userArtworks = artworks.filter(artwork => artwork.artistId === userId);
      console.log('✅ User artworks filtered, count:', userArtworks.length);
      setUserLineArt(userArtworks);
      
    } catch (error) {
      console.error('💥 Error loading user profile:', error);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading && !loadFailed) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => {
            setLoading(false);
            setLoadFailed(true);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show error state if load failed
  if (loadFailed) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to Load Profile</Text>
        <Text style={styles.errorText}>
          There was a problem loading the user profile. This might be a network issue or the user doesn't exist.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadUserProfile}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show auth prompt if no user data and no valid userId
  if (!profileUser && !userId) {
    return (
      <View style={styles.authPromptContainer}>
        <Text style={styles.authPromptTitle}>Join the Community! 🎨</Text>
        <Text style={styles.authPromptText}>
          Sign up to create your own profile, upload line art, and start coloring with others!
        </Text>
        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.authButtonText}>Sign Up / Login</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use profileUser for display
  const user = profileUser;

  // If we still don't have a user after loading, show error
  if (!user) {
    return (
      <View style={styles.authPromptContainer}>
        <Text style={styles.authPromptTitle}>User Not Found</Text>
        <Text style={styles.authPromptText}>
          The user profile you're looking for doesn't exist or couldn't be loaded.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderRoleBadges = (roles: UserRole[]) => {
    const roleLabels = {
      line_artist: '🎨 Line Artist',
      colorist: '🖌️ Colorist', 
      supporter: '❤️ Supporter'
    };

    return (
      <View style={styles.rolesContainer}>
        {roles.map(role => (
          <Text key={role} style={styles.roleBadge}>
            {roleLabels[role]}
          </Text>
        ))}
      </View>
    );
  };

  const renderHeaderActions = () => {
    if (isOwnProfile) {
      return (
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      );
    } else {
      // Safe check for current user ID
      const isFollowing = currentUser?.id ? user.followers.includes(currentUser.id) : false;
      return (
        <TouchableOpacity style={[
          styles.followButton,
          isFollowing && styles.followingButton
        ]}>
          <Text style={[
            styles.followButtonText,
            isFollowing && styles.followingButtonText
          ]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      );
    }
  };

  const renderLineArtTab = () => {
    if (userLineArt.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {isOwnProfile 
              ? "You haven't uploaded any line art yet" 
              : "No line art uploaded yet"
            }
          </Text>
          {isOwnProfile && (
            <TouchableOpacity 
              style={styles.uploadPrompt}
              onPress={() => navigation.navigate('Upload')}
            >
              <Text style={styles.uploadPromptText}>Upload Your First Artwork</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={userLineArt}
        numColumns={2}
        renderItem={({ item }: { item: Artwork }) => (
          <TouchableOpacity 
            style={styles.artworkItem}
            onPress={() => navigation.navigate('ArtworkDetail', { artwork: item })}
          >
            <Image source={{ uri: item.lineArtUrl }} style={styles.artworkImage} />
          </TouchableOpacity>
        )}
        keyExtractor={(item: Artwork) => item.id}
        contentContainerStyle={styles.galleryGrid}
      />
    );
  };

  const renderColorWorkTab = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {isOwnProfile 
          ? "Your color work will appear here" 
          : "Color work gallery coming soon"
        }
      </Text>
    </View>
  );

  const renderActivityTab = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {isOwnProfile 
          ? "Your activity feed will appear here" 
          : "Activity feed coming soon"
        }
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: user.avatarUrl || 'https://via.placeholder.com/80x80.png?text=👤' }} 
          style={styles.avatar} 
        />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.displayName}>{user.displayName}</Text>
              <Text style={styles.username}>@{user.username}</Text>
              {isOwnProfile && <Text style={styles.youBadge}>(You)</Text>}
            </View>
            {renderHeaderActions()}
          </View>
          <Text style={styles.bio}>{user.bio || 'No bio yet.'}</Text>
          {renderRoleBadges(user.roles)}
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{userLineArt.length}</Text>
          <Text style={styles.statLabel}>Artworks</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{user.colorizedVersions?.length || 0}</Text>
          <Text style={styles.statLabel}>Colorizations</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{user.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{user.following?.length || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'lineArt' && styles.activeTab]}
          onPress={() => setActiveTab('lineArt')}
        >
          <Text style={[styles.tabText, activeTab === 'lineArt' && styles.activeTabText]}>
            Line Art
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'colorWork' && styles.activeTab]}
          onPress={() => setActiveTab('colorWork')}
        >
          <Text style={[styles.tabText, activeTab === 'colorWork' && styles.activeTabText]}>
            Color Work
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
            Activity
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'lineArt' && renderLineArtTab()}
        {activeTab === 'colorWork' && renderColorWorkTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  authPromptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  authPromptText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 32,
  },
  authButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
  },
  youBadge: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleBadge: {
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#333',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    minHeight: 200,
  },
  galleryGrid: {
    padding: 8,
  },
  artworkItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 22,
  },
  uploadPrompt: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadPromptText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ProfileScreen;