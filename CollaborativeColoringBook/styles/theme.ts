// styles/theme.ts - CLEANED UP VERSION
export const palette = {
    // BRAND COLORS (with tints and shades)
    brand: {
      primary: {
        50: '#fefce8',
        100: '#fef9c3',
        500: '#eab308', // Main brand color - Yellow
        600: '#ca8a04',
        900: '#713f12',
      },
      secondary: {
        100: '#f3e8ff',
        500: '#a855f7', // Creative purple - for likes!
        900: '#581c87', // Deep accent
      },
    },
    
    // NEUTRAL - UI foundation
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      500: '#64748b',
      700: '#334155',
      900: '#0f172a',
    },
    
    // SEMANTIC - Clear user feedback
    semantic: {
      success: '#22c55e', // Green - for successes
      error: '#ef4444',   // Warm red - for errors/danger
      warning: '#F57B0A', // Orange - for warnings
      info: '#3b82f6',    // Blue - for information
    }
  }
  
  // Usage-specific color mappings (this is what components should use)
  export const colorRoles = {
    // SOCIAL INTERACTIONS
    social: {
      like: palette.brand.secondary[500],    // 💜 Purple hearts! (a855f7)
      remix: palette.brand.primary[500],     // 🎨 Yellow - creative action
      comment: palette.brand.primary[500],   // 💬 Yellow - conversations
      follow: palette.semantic.success,      // ✅ Green - positive connection
      share: palette.neutral[700],           // 🔗 Neutral - sharing
    },
    
    // ART ACTIONS
    art: {
      create: palette.brand.primary[500],    // ✏️ Yellow - drawing/creating
      upload: palette.semantic.success,      // 📤 Green - successful upload
      delete: palette.semantic.error,        // 🗑️ Red - destructive action
      download: palette.semantic.info,       // 📥 Blue - download/export
    },
    
    // UI ELEMENTS
    ui: {
      background: palette.neutral[50],
      card: '#ffffff',
      border: palette.neutral[200],
      
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