// screens/ProfileScreen.tsx - CLEAN VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { User, UserRole, CreativeWork } from '../types/core';
import { useAuth } from '../context/AuthContext';
import { worksService } from '../services/worksService'; 
import { userService } from '../services/userService';
import { socialService } from '../services/socialService';
import { AlertModal } from '../components/AlertModal';
import { mediaUtils } from '../utils/mediaUtils';
import MediaTypeBadge from '../components/MediaTypeBadge';
import { ProfileScreenProps } from '../types/navigation';
import { 
  navigateToUpload, 
  navigateToArtworkDetail, 
  navigateToGallery 
} from '../utils/navigation';

type Props = ProfileScreenProps;

const ProfileScreen = ({ route, navigation }: Props) => {
  // State
  const [activeTab, setActiveTab] = useState<'originals' | 'remixes' | 'activity'>('originals');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userOriginals, setUserOriginals] = useState<CreativeWork[]>([]);
  const [userRemixes, setUserRemixes] = useState<CreativeWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');
  const [refreshing, setRefreshing] = useState(false);

  // Context
  const { user: currentUser, signOut } = useAuth();

  // Route params
  const { userId } = route.params || {};
  
  // Computed values
  const isOwnProfile = !userId || userId === currentUser?.id;
  const profileUserId = userId || currentUser?.id;
  const displayUser = profileUser;

  // ========== HELPER FUNCTIONS ==========
  
  const showAlert = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  }, []);

  const handleAlertClose = useCallback(() => {
    setAlertVisible(false);
  }, []);

  const handleLogoutPress = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const handleLogoutCancel = useCallback(() => {
    setShowLogoutModal(false);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setShowLogoutModal(false);
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Gallery' }],
      });
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      showAlert('Logout Failed', error?.message || 'Please try again.', 'error');
    }
  }, [signOut, navigation, showAlert]);

  const handleArtworkPress = useCallback((workId: string) => {
    navigateToArtworkDetail(navigation, workId);
  }, [navigation]);

  // ========== DATA LOADING ==========

  const loadUserProfile = useCallback(async (targetUserId: string) => {
    console.log('🔍 Loading profile for:', targetUserId);
    
    if (!targetUserId) {
      console.log('❌ No targetUserId provided');
      return;
    }
    
    try {
      setLoading(true);
      setLoadFailed(false);
      
      // Load user data
      const userData = await userService.getUser(targetUserId);
      setProfileUser(userData);
      
      // Load artworks
      let allArtworks: CreativeWork[] = [];
      try {
        allArtworks = await worksService.getAllWorks();
      } catch (artError) {
        console.warn('⚠️ Could not load artworks:', artError);
        allArtworks = [];
      }
      
      // Filter works
      const originals = allArtworks.filter(artwork => 
        artwork.artistId === targetUserId && !artwork.originalWorkId
      );
      setUserOriginals(originals);

      const remixes = allArtworks.filter(artwork => 
        artwork.artistId === targetUserId && artwork.originalWorkId
      );
      setUserRemixes(remixes);
      
      // Load social data
      try {
        if (currentUser && currentUser.id !== targetUserId) {
          const followingStatus = await socialService.isFollowing(currentUser.id, targetUserId);
          setIsFollowing(followingStatus);
        }
        
        const [followers, following] = await Promise.all([
          socialService.getFollowerCount(targetUserId),
          socialService.getFollowingCount(targetUserId)
        ]);
        
        setFollowerCount(followers);
        setFollowingCount(following);
      } catch (socialError) {
        console.warn('⚠️ Social data failed:', socialError);
      }
      
    } catch (error) {
      console.error('💥 Critical error loading profile:', error);
      setLoadFailed(true);
      showAlert('Error', 'Failed to load user profile.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showAlert]);

  const onRefresh = useCallback(async () => {
    if (!profileUserId) return;
    setRefreshing(true);
    await loadUserProfile(profileUserId);
    setRefreshing(false);
  }, [profileUserId, loadUserProfile]);

  // ========== EFFECTS ==========

  // Set navigation title
  useEffect(() => {
    if (displayUser) {
      navigation.setOptions({
        title: isOwnProfile ? 'My Profile' : displayUser.displayName,
      });
    } else if (userId) {
      navigation.setOptions({
        title: 'Artist Profile',
      });
    }
  }, [displayUser, isOwnProfile, userId, navigation]);

  // Handle missing user ID
  useEffect(() => {
    if (!profileUserId) {
      console.log('❌ No profileUserId, redirecting');
      navigation.replace('Auth');
      return;
    }
  }, [profileUserId, navigation]);

  // Reset state when profile user changes
  useEffect(() => {
    setProfileUser(null);
    setUserOriginals([]);
    setUserRemixes([]);
    setLoading(true);
    setIsFollowing(false);
    setFollowerCount(0);
    setFollowingCount(0);
  }, [profileUserId]);

  // Load profile data
  useEffect(() => {
    if (!profileUserId) return;
    
    let isMounted = true;
    
    const loadProfile = async () => {
      await loadUserProfile(profileUserId);
    };
    
    loadProfile();

    const unsubscribe = navigation.addListener('focus', () => {
      if (isMounted && profileUserId) {
        loadUserProfile(profileUserId);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [profileUserId, navigation, loadUserProfile]);

  // ========== RENDER HELPERS ==========

  const currentTabData = useMemo(() => {
    switch (activeTab) {
      case 'originals': return userOriginals;
      case 'remixes': return userRemixes;
      case 'activity': return [];
      default: return userOriginals;
    }
  }, [activeTab, userOriginals, userRemixes]);

  const renderArtworkItem = useCallback(({ item }: { item: CreativeWork }) => {
    const handlePress = () => handleArtworkPress(item.id);

    if (activeTab === 'remixes') {
      const originalArtistName = item.originalWorkId ? 'Unknown Artist' : 'Original Artist';
      
      return (
        <TouchableOpacity 
          style={styles.artworkItem}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {item.assetUrl ? (
            <Image 
              source={{ uri: item.assetUrl }} 
              style={styles.artworkImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          <View style={styles.remixBadge}>
            <MediaTypeBadge 
              mediaType={item.mediaType}
              size="xsmall"
              showLabel={false}
              variant="default"
            />
          </View>
          
          <Text style={styles.artworkTitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          {item.originalWorkId && (
            <Text style={styles.remixInfo} numberOfLines={1}>
              Original by {originalArtistName}
            </Text>
          )}
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity 
          style={styles.artworkItem}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Image 
            source={{ uri: item.assetUrl }} 
            style={styles.artworkImage}
            resizeMode="cover"
          />
          <Text style={styles.artworkTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </TouchableOpacity>
      );
    }
  }, [activeTab, handleArtworkPress]);

  const handleFollowToggle = useCallback(async () => {
    if (!currentUser || !displayUser) return;
    if (currentUser.id === displayUser.id) return;
    
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    const oldFollowerCount = followerCount;
    
    // Optimistic update
    setIsFollowing(!wasFollowing);
    setFollowerCount(wasFollowing ? oldFollowerCount - 1 : oldFollowerCount + 1);
    
    try {
      if (wasFollowing) {
        const result = await socialService.unfollowUser(currentUser.id, displayUser.id);
        if (!result.success) {
          setIsFollowing(wasFollowing);
          setFollowerCount(oldFollowerCount);
          showAlert('Error', result.error || 'Failed to unfollow', 'error');
        }
      } else {
        const result = await socialService.followUser(currentUser.id, displayUser.id);
        if (!result.success) {
          setIsFollowing(wasFollowing);
          setFollowerCount(oldFollowerCount);
          showAlert('Error', result.error || 'Failed to follow', 'error');
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error toggling follow:', error);
      setIsFollowing(wasFollowing);
      setFollowerCount(oldFollowerCount);
      showAlert('Error', 'An unexpected error occurred', 'error');
    } finally {
      setFollowLoading(false);
    }
  }, [currentUser, displayUser, isFollowing, followerCount, showAlert]);

  const ProfileHeader = useCallback(() => {
    if (!displayUser) return null;
    
    const renderRoleBadges = (roles: UserRole[]) => {
      const roleLabels: Record<UserRole, string> = {
        line_artist: '🖌️ Line Artist',
        colorist: '🎨 Colorist', 
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
          <View style={styles.ownProfileActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButtonSmall}
              onPress={handleLogoutPress}
            >
              <Text style={styles.logoutButtonTextSmall}>Log Out</Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        return (
          <TouchableOpacity 
            style={[
              styles.followButton,
              isFollowing && styles.followingButton,
              followLoading && styles.followButtonDisabled
            ]}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? "#333" : "white"} />
            ) : (
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        );
      }
    };

    return (
      <View style={styles.profileHeaderContainer}>
        <View style={styles.header}>
          <Image 
            source={{ uri: displayUser.avatarUrl || 'https://via.placeholder.com/80' }} 
            style={styles.avatar} 
          />
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <View style={styles.nameContainer}>
                <Text style={styles.displayName}>{displayUser.displayName}</Text>
                <Text style={styles.username}>@{displayUser.username}</Text>
                {isOwnProfile && <Text style={styles.youBadge}>(You)</Text>}
              </View>
              {renderHeaderActions()}
            </View>
            <Text style={styles.bio}>{displayUser.bio || 'No bio yet.'}</Text>
            {renderRoleBadges(displayUser.roles)}
          </View>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{userOriginals.length}</Text>
            <Text style={styles.statLabel}>Originals</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{userRemixes.length}</Text>
            <Text style={styles.statLabel}>Remixes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {(['originals', 'remixes', 'activity'] as const).map(tab => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [
    displayUser, 
    isOwnProfile, 
    isFollowing, 
    followLoading, 
    userOriginals.length, 
    userRemixes.length, 
    followerCount, 
    followingCount, 
    activeTab,
    navigation,
    handleLogoutPress,
    handleFollowToggle
  ]);

  const EmptyState = useCallback(() => {
    if (currentTabData.length > 0) return null;
    
    let message = '';
    let showButton = false;
    let buttonText = '';
    let buttonAction = () => {};

    switch (activeTab) {
      case 'originals':
        message = isOwnProfile 
          ? "You haven't uploaded any original works yet!" 
          : "No original works uploaded yet";
        showButton = isOwnProfile;
        buttonText = "Create Your First Original";
        buttonAction = () => navigateToUpload(navigation, currentUser);
        break;
      case 'remixes':
        message = isOwnProfile 
          ? "You haven't remixed any work yet" 
          : "No remixes yet";
        showButton = isOwnProfile;
        buttonText = "Browse Work to Remix";
        buttonAction = () => navigateToGallery(navigation);
        break;
      case 'activity':
        message = isOwnProfile 
          ? "Your activity feed will show likes, comments, and follows" 
          : "Activity feed coming soon";
        showButton = isOwnProfile;
        buttonText = "Explore the community";
        buttonAction = () => navigateToGallery(navigation);
        break;
    }

    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>{message}</Text>
        {showButton && (
          <TouchableOpacity 
            style={styles.uploadPrompt}
            onPress={buttonAction}
          >
            <Text style={styles.uploadPromptText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [activeTab, currentTabData.length, isOwnProfile, currentUser, navigation]);

  // ========== RENDER STATES ==========

  // Early return if no user ID
  if (!profileUserId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading user...</Text>
      </View>
    );
  }

  // Loading state
  if (loading && !displayUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {isOwnProfile ? 'Loading your profile...' : 'Loading profile...'}
        </Text>
      </View>
    );
  }

  // Error state
  if (loadFailed && !displayUser) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to Load Profile</Text>
        <Text style={styles.errorText}>
          There was a problem loading the user profile.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => profileUserId && loadUserProfile(profileUserId)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Gallery</Text>
        </TouchableOpacity>
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogoutPress}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // User not found
  if (!displayUser) {
    return (
      <View style={styles.authPromptContainer}>
        <Text style={styles.authPromptTitle}>User Not Found</Text>
        <Text style={styles.authPromptText}>
          The user profile you're looking for doesn't exist.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Gallery</Text>
        </TouchableOpacity>
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogoutPress}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ========== MAIN RENDER ==========
  
  return (
    <View style={styles.container}>
      <FlatList
        data={currentTabData}
        renderItem={renderArtworkItem}
        ListHeaderComponent={ProfileHeader}
        ListEmptyComponent={EmptyState}
        keyExtractor={(item) => item.id}
        numColumns={2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
        contentContainerStyle={[
          styles.galleryGrid,
          currentTabData.length === 0 && styles.emptyGalleryGrid
        ]}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={true}
      />

      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={handleAlertClose}
      />

      {showLogoutModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalText}>
              Are you sure you want to log out?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleLogoutCancel}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleLogoutConfirm}
              >
                <Text style={styles.modalConfirmButtonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ========== STYLES ==========

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
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  logoutButtonText: {
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
  backButton: {
    padding: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  // Profile Header
  profileHeaderContainer: {
    backgroundColor: 'white',
    marginBottom: 8,
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
  ownProfileActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButtonSmall: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonTextSmall: {
    color: 'white',
    fontSize: 12,
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
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#333',
  },
  // Stats
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
  // Tabs
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
  // Gallery
  galleryGrid: {
    padding: 8,
    flexGrow: 1,
  },
  emptyGalleryGrid: {
    flexGrow: 1,
    justifyContent: 'flex-start',
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
  artworkTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  },
  remixBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  remixInfo: {
    fontSize: 10,
    color: '#666',
    paddingHorizontal: 8,
    paddingBottom: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Empty State
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
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
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    margin: 20,
    minWidth: 280,
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalConfirmButton: {
    backgroundColor: '#ff4444',
  },
  modalCancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  modalConfirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ProfileScreen;