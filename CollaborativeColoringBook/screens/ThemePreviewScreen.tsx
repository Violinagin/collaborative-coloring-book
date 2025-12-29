// screens/ThemePreviewScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const ThemePreviewScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  const ColorSwatch = ({ color, name, textColor = '#000' }: { 
    color: string; 
    name: string; 
    textColor?: string;
  }) => (
    <View style={styles.swatchContainer}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[styles.swatchName, { color: textColor }]}>{name}</Text>
      <Text style={[styles.swatchHex, { color: textColor }]}>{color}</Text>
    </View>
  );

  const ColorSection = ({ title, colors }: { 
    title: string; 
    colors: { [key: string]: string };
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.colorGrid}>
        {Object.entries(colors).map(([key, value]) => (
          <ColorSwatch
            key={key}
            color={value}
            name={key}
            textColor={parseInt(key) >= 500 ? '#fff' : '#000'}
          />
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colorRoles.ui.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colorRoles.interactive.link }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colorRoles.ui.text.primary }]}>
          🎨 Theme Reference
        </Text>
      </View>

      {/* Primary Colors */}
      <ColorSection title="🎨 Primary (Yellow)" colors={theme.palette.brand.primary} />
      
      {/* Secondary Colors */}
      <ColorSection title="💜 Secondary (Purple)" colors={theme.palette.brand.secondary} />
      
      {/* Navigation Colors */}
      <ColorSection title="🔵 Navigation (Blue)" colors={theme.palette.navigation} />
      
      {/* Neutral Colors */}
      <ColorSection title="⚫ Neutrals" colors={theme.palette.neutral} />
      
      {/* Semantic Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Semantic Colors</Text>
        <View style={styles.colorGrid}>
          <ColorSwatch 
            color={theme.palette.semantic.success[500]} 
            name="Success" 
            textColor="#fff"
          />
          <ColorSwatch 
            color={theme.palette.semantic.error[500]} 
            name="Error" 
            textColor="#fff"
          />
          <ColorSwatch 
            color={theme.palette.semantic.warning[500]} 
            name="Warning" 
            textColor="#fff"
          />
        </View>
      </View>
      
      {/* Color Roles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎭 Color Roles</Text>
        <View style={styles.colorGrid}>
          <ColorSwatch 
            color={theme.colorRoles.social.like} 
            name="Like" 
            textColor="#fff"
          />
          <ColorSwatch 
            color={theme.colorRoles.social.comment} 
            name="Comment" 
            textColor="#fff"
          />
          <ColorSwatch 
            color={theme.colorRoles.social.remix} 
            name="Remix" 
            textColor="#fff"
          />
          <ColorSwatch 
            color={theme.colorRoles.social.follow} 
            name="Follow" 
          />
          <ColorSwatch 
            color={theme.colorRoles.interactive.link} 
            name="Link" 
            textColor="#fff"
          />
          <ColorSwatch 
            color={theme.colorRoles.art.create} 
            name="Create" 
          />
        </View>
      </View>
      
      {/* Typography Preview */}
      <View style={[styles.section, { padding: theme.spacing.lg }]}>
        <Text style={[styles.sectionTitle, { color: theme.colorRoles.ui.text.primary }]}>
          📝 Typography
        </Text>
        <View style={styles.typographySection}>
          <Text style={[
            styles.typographySample,
            {
              fontSize: theme.typography.heading.fontSize,
              fontWeight: theme.typography.heading.fontWeight,
              lineHeight: theme.typography.heading.lineHeight,
              color: theme.colorRoles.ui.text.primary,
            }
          ]}>
            Heading
          </Text>
          <Text style={[
            styles.typographySample,
            {
              fontSize: theme.typography.subheading.fontSize,
              fontWeight: theme.typography.subheading.fontWeight,
              lineHeight: theme.typography.subheading.lineHeight,
              color: theme.colorRoles.ui.text.primary,
            }
          ]}>
            Subheading
          </Text>
          <Text style={[
            styles.typographySample,
            {
              fontSize: theme.typography.body.fontSize,
              fontWeight: theme.typography.body.fontWeight,
              lineHeight: theme.typography.body.lineHeight,
              color: theme.colorRoles.ui.text.primary,
            }
          ]}>
            Body Text
          </Text>
          <Text style={[
            styles.typographySample,
            {
              fontSize: theme.typography.caption.fontSize,
              fontWeight: theme.typography.caption.fontWeight,
              lineHeight: theme.typography.caption.lineHeight,
              color: theme.colorRoles.ui.text.secondary,
            }
          ]}>
            Caption Text
          </Text>
        </View>
      </View>
      
      {/* Spacing Preview */}
      <View style={[styles.section, { padding: theme.spacing.lg }]}>
        <Text style={[styles.sectionTitle, { color: theme.colorRoles.ui.text.primary }]}>
          📏 Spacing Scale
        </Text>
        <View style={styles.spacingSection}>
          {Object.entries(theme.spacing).map(([key, value]) => (
            <View key={key} style={styles.spacingItem}>
              <View style={[
                styles.spacingVisual,
                { 
                  width: value,
                  backgroundColor: theme.colorRoles.social.like,
                }
              ]} />
              <Text style={[
                styles.spacingLabel,
                { color: theme.colorRoles.ui.text.secondary }
              ]}>
                {key}: {value}px
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatchContainer: {
    width: 100,
    alignItems: 'center',
    marginBottom: 16,
  },
  swatch: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  swatchName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  swatchHex: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  typographySection: {
    gap: 16,
  },
  typographySample: {
    marginBottom: 4,
  },
  spacingSection: {
    gap: 12,
  },
  spacingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spacingVisual: {
    height: 20,
    borderRadius: 4,
  },
  spacingLabel: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
});

export default ThemePreviewScreen;