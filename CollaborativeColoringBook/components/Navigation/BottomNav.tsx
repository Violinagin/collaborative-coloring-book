// components/Navigation/BottomNav.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Icons } from '../shared/Icon';

export const BottomNav: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  // Screens that show bottom nav
  const shouldShowBottomNav = [
    'Gallery',
    'Upload', 
    'Profile',
  ].includes(route.name);

  if (!shouldShowBottomNav) {
    return null;
  }

  const tabs = [
    { key: 'Gallery', icon: 'Gallery', label: 'Gallery' },
    { key: 'Upload', icon: 'Upload', label: 'Upload' },
    { key: 'Profile', icon: 'Profile', label: 'Profile' },
  ];

  const isActive = (tabKey: string) => route.name === tabKey;

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: theme.colorRoles.ui.card,
        borderTopColor: theme.colorRoles.ui.border,
      }
    ]}>
      {tabs.map((tab) => {
        const IconComponent = Icons[tab.icon as keyof typeof Icons];
        const active = isActive(tab.key);
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => navigation.navigate(tab.key as never)}
          >
            {IconComponent && (
              <IconComponent
                size={24}
                color={active ? theme.colorRoles.art.create : theme.colorRoles.ui.text.secondary}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    padding: 12,
    alignItems: 'center',
  },
});