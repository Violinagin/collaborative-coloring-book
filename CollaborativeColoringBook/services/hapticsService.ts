import * as Haptics from 'expo-haptics';

export const HapticsService = {
  /**
   * Light tap - for subtle feedback (buttons, toggles)
   */
  light: () => {
    if (Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * Medium tap - for more significant actions (switches, important buttons)
   */
  medium: () => {
    if (Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * Heavy tap - for destructive actions (delete, logout)
   */
  heavy: () => {
    if (Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /**
   * Success feedback - for completed actions (upload success, save)
   */
  success: () => {
    if (Haptics.notificationAsync) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /**
   * Warning feedback - for warnings (errors, alerts)
   */
  warning: () => {
    if (Haptics.notificationAsync) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /**
   * Error feedback - for errors (failed actions)
   */
  error: () => {
    if (Haptics.notificationAsync) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  /**
   * Selection feedback - for picking items (segmented controls, pickers)
   */
  selection: () => {
    if (Haptics.selectionAsync) {
      Haptics.selectionAsync();
    }
  },
};