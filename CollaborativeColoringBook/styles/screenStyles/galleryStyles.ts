// styles/screenStyles/galleryStyles.ts
import { StyleSheet, Dimensions } from 'react-native';
import { Theme } from '../theme';

const { width } = Dimensions.get('window');

export const createGalleryStyles = (theme: Theme) => {
  // Calculate responsive values
  const cardWidth = width - theme.spacing.lg * 2;
  const isSmallScreen = width < 375;
  
  return StyleSheet.create({
    // Container & Layout
    container: {
      flex: 1,
      backgroundColor: theme.colorRoles.ui.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colorRoles.ui.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl * 2,
    },
    gallery: {
      padding: theme.spacing.sm,
    },
    
    // Header & Filters
    activeFilters: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colorRoles.ui.background,
    },
    activeFiltersText: {
      fontSize: theme.typography.caption.fontSize,
      color: theme.colorRoles.ui.text.secondary,
    },
    
    // Artwork Cards
    workCard: {
      backgroundColor: theme.colorRoles.ui.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      margin: theme.spacing.sm,
      width: cardWidth,
      alignSelf: 'center',
      ...theme.shadows.md,
    },
    workImage: {
      width: '100%',
      height: isSmallScreen ? 280 : 350,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.palette.neutral[100],
    },
    workInfo: {
      marginTop: theme.spacing.sm,
    },
    
    // Text Styles
    title: {
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
      color: theme.colorRoles.ui.text.primary,
      lineHeight: theme.typography.body.lineHeight,
    },
    artist: {
      fontSize: theme.typography.caption.fontSize,
      color: theme.colorRoles.social.remix,
      marginTop: theme.spacing.xs,
      lineHeight: theme.typography.caption.lineHeight,
    },
    description: {
      fontSize: theme.typography.caption.fontSize,
      color: theme.colorRoles.ui.text.secondary,
      marginTop: theme.spacing.xs,
      lineHeight: theme.typography.caption.lineHeight,
    },
    loadingText: {
      fontSize: theme.typography.body.fontSize,
      color: theme.colorRoles.ui.text.secondary,
      marginTop: theme.spacing.md,
    },
    emptyText: {
      fontSize: theme.typography.subheading.fontSize,
      color: theme.colorRoles.ui.text.secondary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: theme.typography.body.fontSize,
      color: theme.colorRoles.ui.text.secondary,
      textAlign: 'center',
    },
    
    // Badges & Actions
    badgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    likeCommentRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
    },
    commentButton: {
      backgroundColor: theme.palette.neutral[100],
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
    commentButtonText: {
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
      color: theme.colorRoles.ui.text.secondary,
      marginLeft: theme.spacing.xs,
    },
    remixButton: {
      backgroundColor: theme.colorRoles.social.remix,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      minWidth: 80,
    },
    remixButtonText: {
      color: theme.colorRoles.ui.text.inverse,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
      textAlign: 'center',
    },
    
    // Filter Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colorRoles.ui.card,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colorRoles.ui.border,
    },
    modalTitle: {
      fontSize: theme.typography.subheading.fontSize,
      fontWeight: theme.typography.subheading.fontWeight,
      color: theme.colorRoles.ui.text.primary,
    },
    closeButton: {
      fontSize: 24,
      color: theme.colorRoles.ui.text.secondary,
    },
    filterSection: {
      padding: theme.spacing.lg,
    },
    filterTitle: {
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
      color: theme.colorRoles.ui.text.primary,
      marginBottom: theme.spacing.md,
    },
    filterActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    filterAction: {
      fontSize: theme.typography.caption.fontSize,
      textDecorationLine: 'underline',
    },
    mediaTypeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    mediaTypeFilter: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.palette.neutral[100],
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    mediaTypeFilterText: {
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '500',
      color: theme.colorRoles.ui.text.secondary,
    },
    mediaTypeFilterSelected: {
      backgroundColor: theme.colorRoles.social.like,
    },
    mediaTypeFilterTextSelected: {
      color: theme.colorRoles.ui.text.inverse,
    },
    sortOptions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    sortOption: {
      flex: 1,
      padding: theme.spacing.md,
      backgroundColor: theme.palette.neutral[100],
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    sortOptionText: {
      fontSize: theme.typography.body.fontSize,
      fontWeight: '500',
      color: theme.colorRoles.ui.text.secondary,
    },
    sortOptionSelected: {
      backgroundColor: theme.colorRoles.social.remix,
    },
    sortOptionTextSelected: {
      color: theme.colorRoles.ui.text.inverse,
      fontWeight: '600',
    },
    applyButton: {
      backgroundColor: theme.colorRoles.social.remix,
      margin: theme.spacing.lg,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
    },
    applyButtonText: {
      color: theme.colorRoles.ui.text.inverse,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
    },
    
    // Upload FAB
    uploadFab: {
      position: 'absolute',
      bottom: theme.spacing.xl,
      right: theme.spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.lg,
    },
    uploadFabText: {
      fontSize: 24,
      color: theme.colorRoles.ui.text.inverse,
      fontWeight: 'bold',
    },
  });
};

// Optional: Export type for the styles
export type GalleryStyles = ReturnType<typeof createGalleryStyles>;