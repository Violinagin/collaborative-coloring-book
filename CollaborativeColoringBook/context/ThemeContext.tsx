// context/ThemeContext.tsx
import React, { createContext, useContext } from 'react';
import { theme, Theme } from '../styles/theme';

// The issue might be here - let's verify the import
console.log('Imported theme keys:', Object.keys(theme));
console.log('Theme type keys:', Object.keys({} as Theme));

const ThemeContext = createContext<Theme>(theme);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};