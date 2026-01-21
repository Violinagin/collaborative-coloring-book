// styles/theme.ts - CLEANED UP VERSION
export const palette = {
    // BRAND COLORS (with tints and shades)
    brand: {
        primary: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            500: '#eab308',    // Your yellow
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
          },
      secondary: {
        50: '#faf5ff',     // Very light - for subtle backgrounds
        100: '#f3e8ff',    // Light - for follows, subtle states
        200: '#e9d5ff',    // Light-medium - for hover states
        300: '#d8b4fe',    // Medium-light - for likes (your light purple)
        400: '#c084fc',    // Medium - for comments
        500: '#a855f7',    // Standard - your current purple
        600: '#9333ea',    // Medium-dark - for emphasis
        700: '#7c3aed',    // Dark - for pressed states
        800: '#6d28d9',    // Very dark - for strong emphasis
        900: '#581c87',    // Deep - for remix (your deep purple)
      },
    },

    // NAVIGATION BLUES
  navigation: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',    // Your blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
    
    // NEUTRAL - UI foundation
    neutral: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
    
    // SEMANTIC - Clear user feedback
    semantic: {
        success: {
          50: '#f0fdf4',
          500: '#22c55e',  // Your green
          900: '#14532d',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',  // Your red
          900: '#7f1d1d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          900: '#78350f',
        },
        info: '#3b82f6',    // Blue - for information
      }

  }
  
  // Usage-specific color mappings (this is what components should use)
  export const colorRoles = {
    // SOCIAL INTERACTIONS
    social: {
        like: palette.brand.secondary[300],    // Light purple (#d8b4fe)
        comment: palette.brand.secondary[400], // Medium purple (#c084fc)
        remix: palette.brand.secondary[900],   // Deep purple (#581c87)
        follow: palette.brand.secondary[100],  // Very light purple (#f3e8ff)
        share: palette.neutral[500],           // Neutral gray
      },
    
    // ART ACTIONS
    art: {
        create: palette.brand.primary[500],    // Yellow for creation
        upload: palette.semantic.success[500], // Green for upload success
        delete: palette.semantic.error[500],   // Red for delete
        download: palette.navigation[500],     // Blue for download
      },
    
    // UI ELEMENTS
    ui: {
      background: palette.neutral[50],
      card: '#ffffff',
      border: palette.neutral[200],
      header: palette.neutral[400],
      
      text: {
        primary: palette.neutral[900],
        secondary: palette.neutral[500],
        disabled: palette.neutral[500],
        inverse: '#ffffff',     // For text on colored backgrounds
      },
      
      state: {
        hover: palette.neutral[100],
        active: palette.neutral[200],
        selected: palette.brand.primary[50], // Light yellow for selection
      }
    },

    // INTERACTIVE ELEMENTS
  interactive: {
    link: palette.navigation[500],     // Blue links
    active: palette.navigation[700],   // Active blue
    tabActive: palette.brand.primary[500], // Yellow for active tabs
    tabInactive: palette.neutral[500],     // Gray for inactive
  },
    
    // NAVIGATION
    navigation: {
      tabActive: palette.brand.primary[500],
      tabInactive: palette.neutral[500],
      header: palette.neutral[900],
    }
  }
  
  // Spacing scale (based on 4px grid)
  export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  }
  
  // Typography scale
  export const typography = {
    heading: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    subheading: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    }
  }
  
  // Border radius scale
  export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 999,
  }
  
  // Shadow definitions
  export const shadows = {
    sm: {
      shadowColor: palette.neutral[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: palette.neutral[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: palette.neutral[900],
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    }
  }
  
  // Complete theme export
  export const theme = {
    palette,
    colorRoles,
    spacing,
    typography,
    borderRadius,
    shadows,
  }
  
  export type Theme = typeof theme