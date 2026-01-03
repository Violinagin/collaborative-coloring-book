// components/shared/Icon.tsx
import React from 'react';
import {MaterialIcons} from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface IconProps {
    name: string;
    size?: number;
    color?: string;
    [key: string]: any; // For any other props
  }
  
  export const Icon: React.FC<IconProps> = ({ 
    name, 
    size = 24, 
    color, 
    ...props 
  }) => {
    const theme = useTheme();
    return (
      <MaterialIcons 
        name={name as any} // Type assertion to handle MaterialIcons string types
        size={size} 
        color={color || theme.colorRoles.ui.text.primary} 
        {...props} 
      />
    );
  };
  
  // Pre-defined icons with proper typing
  export const Icons = {
  Heart: (props: Omit<IconProps, 'name'>) => <Icon name="favorite" {...props} />,
  HeartOutline: (props: Omit<IconProps, 'name'>) => <Icon name="favorite-outline" {...props} />,
  Comment: (props: Omit<IconProps, 'name'>) => <Icon name="comment" {...props} />,
  Remix: (props: Omit<IconProps, 'name'>) => <Icon name="autorenew" {...props} />,
  Gallery: (props: Omit<IconProps, 'name'>) => <Icon name="grid-view" {...props} />,
  Upload: (props: Omit<IconProps, 'name'>) => <Icon name="add-circle" {...props} />,
  Profile: (props: Omit<IconProps, 'name'>) => <Icon name="person" {...props} />,
  More: (props: Omit<IconProps, 'name'>) => <Icon name="more-vert" {...props} />,
  Close: (props: Omit<IconProps, 'name'>) => <Icon name="close" {...props} />,
  Back: (props: Omit<IconProps, 'name'>) => <Icon name="arrow-back" {...props} />,
  Share: (props: Omit<IconProps, 'name'>) => <Icon name="share" {...props} />,
  Settings: (props: Omit<IconProps, 'name'>) => <Icon name="settings" {...props} />,
  Search: (props: Omit<IconProps, 'name'>) => <Icon name="search" {...props} />,
  Home: (props: Omit<IconProps, 'name'>) => <Icon name="home" {...props} />,
  Edit: (props: Omit<IconProps, 'name'>) => <Icon name="edit" {...props} />,
  Delete: (props: Omit<IconProps, 'name'>) => <Icon name="delete" {...props} />,
  };