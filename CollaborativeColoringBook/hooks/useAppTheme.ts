// hooks/useAppTheme.ts
import { useTheme } from '../context/ThemeContext';

export const useAppTheme = () => {
  const theme = useTheme();
  
  return {
    colors: {
      tabActive: theme.colorRoles.art.create,
      tabInactive: theme.colorRoles.ui.text.secondary,
      tabBackground: theme.colorRoles.ui.card,
      tabBorder: theme.colorRoles.ui.border,
    },
    spacing: theme.spacing,
  };
};