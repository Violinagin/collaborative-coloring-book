// components/shared/ThemedText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ThemedTextProps extends TextProps {
  type?: 'title' | 'subtitle' | 'body' | 'caption' | 'button';
  color?: string;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  type = 'body',
  style,
  color,
  ...props
}) => {
  const theme = useTheme();
  
  const textStyles = {
    title: {
      fontSize: theme.typography.heading.fontSize,
      fontWeight: theme.typography.heading.fontWeight,
      lineHeight: theme.typography.heading.lineHeight,
    },
    subtitle: {
      fontSize: theme.typography.subheading.fontSize,
      fontWeight: theme.typography.subheading.fontWeight,
      lineHeight: theme.typography.subheading.lineHeight,
    },
    body: {
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.body.fontWeight,
      lineHeight: theme.typography.body.lineHeight,
    },
    caption: {
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.caption.fontWeight,
      lineHeight: theme.typography.caption.lineHeight,
    },
    button: {
      fontSize: theme.typography.button.fontSize,
      fontWeight: theme.typography.button.fontWeight,
      lineHeight: theme.typography.button.lineHeight,
    },
  };
  
  return (
    <Text
      style={[
        {
          color: color || theme.colorRoles.ui.text.primary,
        },
        textStyles[type],
        style,
      ]}
      {...props}
    />
  );
};