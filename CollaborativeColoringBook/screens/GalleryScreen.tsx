import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { worksService } from '../services/api/works';
import { socialService } from '../services/api/social';
import { CreativeWork, MediaType } from '../types/core';
import { mediaUtils } from '../utils/mediaUtils';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/shared/ThemedText';
import { Icons } from '../components/shared/Icon';
import { navigateToAuth, navigateToUpload } from '../utils/navigation'; // IMPORT BOTH
import { WorkCard } from '../components/shared/WorkCard';
import { WorkCardSkeleton } from '../components/WorkCardSkeleton';
import { GalleryEmptyState } from '../components/GalleryEmptyState';
import { GalleryScreenProps } from '../types/navigation';

const { width } = Dimensions.get('window');

type Props = GalleryScreenProps;

// All available media types
const ALL_MEDIA_TYPES: MediaType[] = [
  'line_art', 'colored_art', 'digital_art', 
  'writing', 'music', 'animation', 'comic', 'three_d'
];

const GalleryScreen = ({ navigation, route }: Props) => {
  const theme = useTheme();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  // State
  const [works, setWorks] = useState<CreativeWork[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<CreativeWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtering state
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<MediaType[]>(ALL_MEDIA_TYPES);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');

  // Navigation handlers
  const handleNavigateToAuth = useCallback(() => {
    // Use your existing navigateToAuth function
    navigateToAuth(navigation);
  }, [navigation]);

  const handleNavigateToUpload = useCallback(() => {
    if (!user) {
      handleNavigateToAuth();
    } else {
      // Call your existing navigateToUpload function
      navigateToUpload(navigation, user, {
        originalWorkId: undefined,
        originalWorkTitle: undefined,
        originalWork: undefined
      });
    }
  }, [user, navigation, handleNavigateToAuth]);

  // Load works on focus
  useEffect(() => {
    if (isFocused) {
      loadWorks();
    }
  }, [isFocused, user]);

  // Watch for param changes
  useEffect(() => {
    const paramValue = route.params?.showFilterModal;
    if (paramValue !== undefined) {
      setShowFilterModal(paramValue);
      
      // Clear the param after reading
      if (paramValue) {
        setTimeout(() => {
          navigation.setParams({ showFilterModal: undefined });
        }, 100);
      }
    }
  }, [route.params?.showFilterModal]);

  const loadWorks = async () => {
    try {
      setLoading(true);
      
      // Use the optimized getAllWorks function
      const allWorks = await worksService.getAllWorks();
      setWorks(allWorks);
      
      // Apply initial filters
      applyFilters(allWorks, selectedMediaTypes, sortBy);
      
    } catch (error) {
      console.error('Error loading works:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (worksList: CreativeWork[], mediaTypes: MediaType[], sortMethod: string) => {
    let filtered = worksList;
    
    // Filter by media type
    if (mediaTypes.length < ALL_MEDIA_TYPES.length) {
      filtered = filtered.filter(work => mediaTypes.includes(work.mediaType));
    }
    
    // Sort works
    filtered = [...filtered].sort((a, b) => {
      switch (sortMethod) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          
        case 'popular':
          const likesA = a.likes?.length || 0;
          const likesB = b.likes?.length || 0;
          return likesB - likesA;
          
        case 'trending':
          // Simple trending: recent works with high engagement
          const scoreA = (a.likes?.length || 0) + (a.comments?.length || 0);
          const scoreB = (b.likes?.length || 0) + (b.comments?.length || 0);
          return scoreB - scoreA;
          
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    setFilteredWorks(filtered);
  };

  // Filter functions
  const toggleMediaType = (type: MediaType) => {
    const newTypes = selectedMediaTypes.includes(type)
      ? selectedMediaTypes.filter(t => t !== type)
      : [...selectedMediaTypes, type];
    
    setSelectedMediaTypes(newTypes);
    applyFilters(works, newTypes, sortBy);
  };

  const selectAllMediaTypes = () => {
    setSelectedMediaTypes(ALL_MEDIA_TYPES);
    applyFilters(works, ALL_MEDIA_TYPES, sortBy);
  };

  const clearMediaTypes = () => {
    setSelectedMediaTypes([]);
    applyFilters(works, [], sortBy);
  };

  const handleSortChange = (option: 'recent' | 'popular' | 'trending') => {
    setSortBy(option);
    applyFilters(works, selectedMediaTypes, option);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorks();
  };

  const handleLike = async (workId: string) => {
    if (!user) {
      handleNavigateToAuth();
      return;
    }
    
    const work = works.find(w => w.id === workId);
    if (!work) return;
    
    const currentLikeState = work.userHasLiked || false;
    const currentCount = work.likes?.length || 0;
    
    // Optimistic update
    setWorks(prev => prev.map(work => {
      if (work.id === workId) {
        return {
          ...work,
          userHasLiked: !currentLikeState,
          likes: currentLikeState 
            ? (work.likes || []).filter(like => like.userId !== user.id)
            : [...(work.likes || []), {
              id: `temp_${Date.now()}`,
              workId,
              userId: user.id,
              createdAt: new Date(),
              user: user
            }]
        };
      }
      return work;
    }));
    
    // Re-apply filters
    applyFilters(
      works.map(w => w.id === workId ? {
        ...w,
        userHasLiked: !currentLikeState,
        likes: currentLikeState 
          ? (w.likes || []).filter(like => like.userId !== user.id)
          : [...(w.likes || []), {
            id: `temp_${Date.now()}`,
            workId,
            userId: user.id,
            createdAt: new Date(),
            user: user
          }]
      } : w),
      selectedMediaTypes,
      sortBy
    );
    
    try {
      // Use socialService.toggleLike
      const newLikeState = await socialService.toggleLike(workId, user.id);
      
      // Fetch updated counts
      const [actualLikeCount, actualUserLiked] = await Promise.all([
        socialService.getLikeCount(workId),
        socialService.isLiked(workId, user.id)
      ]);
      
      // Update with server response
      setWorks(prev => prev.map(work => {
        if (work.id === workId) {
          return {
            ...work,
            userHasLiked: actualUserLiked,
            likes: actualUserLiked 
              ? [...(work.likes || []).filter(l => l.userId !== user.id), {
                  id: `server_${Date.now()}`,
                  workId,
                  userId: user.id,
                  createdAt: new Date(),
                  user: user
                }]
              : (work.likes || []).filter(l => l.userId !== user.id)
          };
        }
        return work;
      }));
      
      // Re-apply filters with server data
      applyFilters(
        works.map(w => w.id === workId ? {
          ...w,
          userHasLiked: actualUserLiked,
          likes: actualUserLiked 
            ? [...(w.likes || []).filter(l => l.userId !== user.id), {
                id: `server_${Date.now()}`,
                workId,
                userId: user.id,
                createdAt: new Date(),
                user: user
              }]
            : (w.likes || []).filter(l => l.userId !== user.id)
        } : w),
        selectedMediaTypes,
        sortBy
      );
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Rollback on error
      setWorks(prev => prev.map(work => {
        if (work.id === workId) {
          return {
            ...work,
            userHasLiked: currentLikeState,
            likes: currentLikeState 
              ? work.likes || []
              : (work.likes || []).filter(like => like.userId !== user.id)
          };
        }
        return work;
      }));
      
      // Re-apply filters with rolled back data
      applyFilters(
        works.map(w => w.id === workId ? {
          ...w,
          userHasLiked: currentLikeState,
          likes: currentLikeState 
            ? w.likes || []
            : (w.likes || []).filter(like => like.userId !== user.id)
        } : w),
        selectedMediaTypes,
        sortBy
      );
    }
  };

  // RENDER FUNCTIONS

  const renderWorkItem = ({ item }: { item: CreativeWork }) => {
    const likeInfo = {
      count: item.likes?.length || 0,
      isLiked: item.userHasLiked || false
    };
    
    const commentCount = item.comments?.length || 0;
    
    return (
      <WorkCard
        work={{
          id: item.id,
          title: item.title,
          assetUrl: item.assetUrl,
          artistId: item.artistId,
          artist: {
            displayName: item.artist?.displayName || 'Unknown Artist',
            username: item.artist?.username,
          },
          mediaType: item.mediaType,
          originalWorkId: item.originalWorkId,
          description: item.description,
          aspectRatio: item.aspectRatio,
        }}
        likeInfo={likeInfo}
        commentCount={commentCount}
        onLikePress={() => handleLike(item.id)}
      />
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colorRoles.ui.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Filter Works</ThemedText>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Icons.Close size={24} color={theme.colorRoles.ui.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterSection}>
            <ThemedText type="body" style={styles.filterTitle}>Media Types</ThemedText>
            <View style={styles.filterActions}>
              <TouchableOpacity onPress={selectAllMediaTypes}>
                <ThemedText type="caption" style={{ color: theme.colorRoles.social.like }}>
                  Select All
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearMediaTypes}>
                <ThemedText type="caption" style={{ color: theme.palette.semantic.error[500] }}>
                  Clear All
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <View style={styles.mediaTypeGrid}>
              {ALL_MEDIA_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mediaTypeFilter,
                    { backgroundColor: selectedMediaTypes.includes(type) 
                      ? theme.colorRoles.social.like 
                      : theme.palette.neutral[100]
                    }
                  ]}
                  onPress={() => toggleMediaType(type)}
                >
                  <ThemedText type="caption" style={[
                    styles.mediaTypeFilterText,
                    { color: selectedMediaTypes.includes(type) 
                      ? theme.colorRoles.ui.text.inverse 
                      : theme.colorRoles.ui.text.secondary
                    }
                  ]}>
                    {mediaUtils.getMediaTypeLabel(type)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            
            <ThemedText type="body" style={styles.filterTitle}>Sort By</ThemedText>
            <View style={styles.sortOptions}>
              {(['recent', 'popular', 'trending'] as const).map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sortOption,
                    { backgroundColor: sortBy === option 
                      ? theme.colorRoles.social.remix 
                      : theme.palette.neutral[100]
                    }
                  ]}
                  onPress={() => handleSortChange(option)}
                >
                  <ThemedText type="body" style={[
                    styles.sortOptionText,
                    { color: sortBy === option 
                      ? theme.colorRoles.ui.text.inverse 
                      : theme.colorRoles.ui.text.secondary
                    }
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <TouchableOpacity 
            style={[styles.applyButton, { backgroundColor: theme.colorRoles.social.remix }]}
            onPress={() => setShowFilterModal(false)}
          >
            <ThemedText type="button" style={{ color: theme.colorRoles.ui.text.inverse }}>
              Apply Filters
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (loading && works.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colorRoles.ui.background }]}>
        <FlatList
          data={[1, 2, 3]} // Show 3 skeleton cards
          renderItem={() => <WorkCardSkeleton />}
          contentContainerStyle={styles.galleryList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colorRoles.ui.background }]}>
      
      {/* Active filters summary */}
      <View style={styles.activeFilters}>
        <ThemedText type="caption">
          Showing {filteredWorks.length} of {works.length} works
          {selectedMediaTypes.length < ALL_MEDIA_TYPES.length && 
            ` • ${selectedMediaTypes.length} media types`
          }
        </ThemedText>
      </View>
      
      {/* Gallery List */}
      <FlatList
        data={filteredWorks}
        renderItem={renderWorkItem}
        keyExtractor={(item: CreativeWork) => item.id}
        contentContainerStyle={styles.galleryList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colorRoles.art.create}
          />
        }
        ListEmptyComponent={
          <GalleryEmptyState 
            onUploadPress={handleNavigateToUpload}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
      
      {/* Filter Modal */}
      {renderFilterModal()}
    </View>
  );
};

// STYLES (keep your existing styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  activeFilters: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  galleryList: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterSection: {
    padding: 20,
  },
  filterTitle: {
    marginBottom: 12,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mediaTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  mediaTypeFilter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  mediaTypeFilterText: {
    fontWeight: '500',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sortOptionText: {
    fontWeight: '500',
  },
  applyButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default GalleryScreen;