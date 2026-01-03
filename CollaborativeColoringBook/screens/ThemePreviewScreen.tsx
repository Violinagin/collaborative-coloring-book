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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ThemePreviewScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const ColorSwatch = ({ 
    color, 
    name, 
    textColor = '#000' 
  }: { 
    color: string; 
    name: string; 
    textColor?: string;
  }) => (
    <View style={styles.swatchContainer}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[styles.swatchName, { color: textColor }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.swatchHex, { color: textColor }]} numberOfLines={1}>
        {color}
      </Text>
    </View>
  );

  const ColorSection = ({ 
    title, 
    colors,
    showNumbers = true
  }: { 
    title: string; 
    colors: { [key: string]: any };
    showNumbers?: boolean;
  }) => {
    // Flatten nested color objects
    const flattenColors: { [key: string]: string } = {};
    
    const flatten = (obj: any, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('#')) {
          flattenColors[`${prefix}${key}`] = value;
        } else if (typeof value === 'object' && value !== null) {
          flatten(value, `${prefix}${key}.`);
        }
      });
    };
    
    flatten(colors);

    return (
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { color: theme.colorRoles.ui.text.primary }
        ]}>
          {title}
        </Text>
        <View style={styles.colorGrid}>
          {Object.entries(flattenColors).map(([key, value]) => {
            // Determine text color based on background brightness
            const hex = value.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const textColor = brightness > 125 ? '#000000' : '#FFFFFF';

            return (
              <ColorSwatch
                key={key}
                color={value}
                name={showNumbers ? key : key.split('.').pop() || key}
                textColor={textColor}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { 
      backgroundColor: theme.colorRoles.ui.background 
    }]}>
      {/* Header */}
      <View style={[
        styles.header,
        { 
          borderBottomColor: theme.colorRoles.ui.border,
          backgroundColor: theme.colorRoles.ui.card
        }
      ]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[
            styles.backButtonText,
            { color: theme.colorRoles.interactive.link }
          ]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[
          styles.title,
          { color: theme.colorRoles.ui.text.primary }
        ]}>
          🎨 Theme Reference
        </Text>
      </View>

      {/* Primary Colors */}
      <ColorSection 
        title="🎨 Primary (Yellow)" 
        colors={theme.palette.brand.primary}
      />
      
      {/* Secondary Colors */}
      <ColorSection 
        title="💜 Secondary (Purple)" 
        colors={theme.palette.brand.secondary}
      />
      
      {/* Navigation Colors */}
      <ColorSection 
        title="🔵 Navigation (Blue)" 
        colors={theme.palette.navigation}
      />
      
      {/* Neutral Colors */}
      <ColorSection 
        title="⚫ Neutrals" 
        colors={theme.palette.neutral}
      />
      
      {/* Semantic Colors */}
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { color: theme.colorRoles.ui.text.primary }
        ]}>
          ⚠️ Semantic Colors
        </Text>
        <View style={styles.colorGrid}>
          {Object.entries(theme.palette.semantic).map(([category, colors]) => {
            if (typeof colors === 'object' && colors[500]) {
              const hex = colors[500];
              const brightness = parseInt(hex.replace('#', ''), 16) > 0x7FFFFF;
              const textColor = brightness ? '#000000' : '#FFFFFF';

              return (
                <ColorSwatch
                  key={category}
                  color={hex}
                  name={category.charAt(0).toUpperCase() + category.slice(1)}
                  textColor={textColor}
                />
              );
            }
            return null;
          })}
        </View>
      </View>
      
      {/* Color Roles */}
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { color: theme.colorRoles.ui.text.primary }
        ]}>
          🎭 Color Roles
        </Text>
        <View style={styles.colorGrid}>
          <ColorSwatch 
            color={theme.colorRoles.social.like} 
            name="Like" 
          />
          <ColorSwatch 
            color={theme.colorRoles.social.comment} 
            name="Comment" 
          />
          <ColorSwatch 
            color={theme.colorRoles.social.remix} 
            name="Remix" 
          />
          <ColorSwatch 
            color={theme.colorRoles.social.follow} 
            name="Follow" 
          />
          <ColorSwatch 
            color={theme.colorRoles.social.share} 
            name="Share" 
          />
          <ColorSwatch 
            color={theme.colorRoles.interactive.link} 
            name="Link" 
          />
          <ColorSwatch 
            color={theme.colorRoles.interactive.active} 
            name="Active" 
          />
          <ColorSwatch 
            color={theme.colorRoles.interactive.tabActive} 
            name="Tab Active" 
          />
          <ColorSwatch 
            color={theme.colorRoles.art.create} 
            name="Create" 
          />
          <ColorSwatch 
            color={theme.colorRoles.art.upload} 
            name="Upload" 
          />
          <ColorSwatch 
            color={theme.colorRoles.art.delete} 
            name="Delete" 
          />
          <ColorSwatch 
            color={theme.colorRoles.art.download} 
            name="Download" 
          />
        </View>
      </View>
      
      {/* UI Colors */}
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { color: theme.colorRoles.ui.text.primary }
        ]}>
          🖥️ UI Colors
        </Text>
        <View style={styles.colorGrid}>
          <ColorSwatch 
            color={theme.colorRoles.ui.background} 
            name="Background" 
          />
          <ColorSwatch 
            color={theme.colorRoles.ui.card} 
            name="Card" 
          />
          <ColorSwatch 
            color={theme.colorRoles.ui.border} 
            name="Border" 
          />
          <ColorSwatch 
            color={theme.colorRoles.ui.text.primary} 
            name="Text Primary" 
          />
          <ColorSwatch 
            color={theme.colorRoles.ui.text.secondary} 
            name="Text Secondary" 
          />
          <ColorSwatch 
            color={theme.colorRoles.ui.text.disabled} 
            name="Text Disabled" 
          />
          <ColorSwatch 
            color={theme.colorRoles.ui.text.inverse} 
            name="Text Inverse" 
          />
        </View>
      </View>
      
      {/* Typography Preview */}
      <View style={[styles.section, { 
        padding: theme.spacing.lg,
        backgroundColor: theme.colorRoles.ui.card,
        marginHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.md
      }]}>
        <Text style={[
          styles.sectionTitle,
          { color: theme.colorRoles.ui.text.primary }
        ]}>
          📝 Typography
        </Text>
        <View style={styles.typographySection}>
          <View style={styles.typographyItem}>
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
              styles.typographyMeta,
              { color: theme.colorRoles.ui.text.secondary }
            ]}>
              {theme.typography.heading.fontSize}px • {theme.typography.heading.fontWeight} • Line: {theme.typography.heading.lineHeight}px
            </Text>
          </View>
          
          <View style={styles.typographyItem}>
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
              styles.typographyMeta,
              { color: theme.colorRoles.ui.text.secondary }
            ]}>
              {theme.typography.subheading.fontSize}px • {theme.typography.subheading.fontWeight} • Line: {theme.typography.subheading.lineHeight}px
            </Text>
          </View>
          
          <View style={styles.typographyItem}>
            <Text style={[
              styles.typographySample,
              {
                fontSize: theme.typography.body.fontSize,
                fontWeight: theme.typography.body.fontWeight,
                lineHeight: theme.typography.body.lineHeight,
                color: theme.colorRoles.ui.text.primary,
              }
            ]}>
              Body Text - The quick brown fox jumps over the lazy dog.
            </Text>
            <Text style={[
              styles.typographyMeta,
              { color: theme.colorRoles.ui.text.secondary }
            ]}>
              {theme.typography.body.fontSize}px • {theme.typography.body.fontWeight} • Line: {theme.typography.body.lineHeight}px
            </Text>
          </View>
          
          <View style={styles.typographyItem}>
            <Text style={[
              styles.typographySample,
              {
                fontSize: theme.typography.caption.fontSize,
                fontWeight: theme.typography.caption.fontWeight,
                lineHeight: theme.typography.caption.lineHeight,
                color: theme.colorRoles.ui.text.secondary,
              }
            ]}>
              Caption Text - Additional information or labels
            </Text>
            <Text style={[
              styles.typographyMeta,
              { color: theme.colorRoles.ui.text.secondary }
            ]}>
              {theme.typography.caption.fontSize}px • {theme.typography.caption.fontWeight} • Line: {theme.typography.caption.lineHeight}px
            </Text>
          </View>
          
          <View style={styles.typographyItem}>
            <Text style={[
              styles.typographySample,
              {
                fontSize: theme.typography.button.fontSize,
                fontWeight: theme.typography.button.fontWeight,
                lineHeight: theme.typography.button.lineHeight,
                color: theme.colorRoles.ui.text.inverse,
                backgroundColor: theme.colorRoles.art.create,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.borderRadius.md,
                alignSelf: 'flex-start',
              }
            ]}>
              Button Text
            </Text>
            <Text style={[
              styles.typographyMeta,
              { color: theme.colorRoles.ui.text.secondary }
            ]}>
              {theme.typography.button.fontSize}px • {theme.typography.button.fontWeight} • Line: {theme.typography.button.lineHeight}px
            </Text>
          </View>
        </View>
      </View>
      
      {/* Spacing Preview */}
      <View style={[styles.section, { 
        padding: theme.spacing.lg,
        backgroundColor: theme.colorRoles.ui.card,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.xl,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.md
      }]}>
        <Text style={[
          styles.sectionTitle,
          { color: theme.colorRoles.ui.text.primary }
        ]}>
          📏 Spacing Scale
        </Text>
        <View style={styles.spacingSection}>
          {Object.entries(theme.spacing).map(([key, value]) => (
            <View key={key} style={styles.spacingItem}>
              <View style={[
                styles.spacingVisual,
                { 
                  width: value,
                  backgroundColor: theme.colorRoles.social.comment,
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
      
      {/* Border Radius Preview */}
      <View style={[styles.section, { 
        padding: theme.spacing.lg,
        backgroundColor: theme.colorRoles.ui.card,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.xl,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.md
      }]}>
        <Text style={[
          styles.sectionTitle,
          { color: theme.colorRoles.ui.text.primary }
        ]}>
          🔲 Border Radius
        </Text>
        <View style={styles.borderRadiusSection}>
          {Object.entries(theme.borderRadius).map(([key, value]) => (
            <View key={key} style={styles.borderRadiusItem}>
              <View style={[
                styles.borderRadiusVisual,
                { 
                  width: 60,
                  height: 60,
                  borderRadius: value,
                  backgroundColor: theme.colorRoles.social.like,
                }
              ]} />
              <Text style={[
                styles.borderRadiusLabel,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
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
    textAlign: 'center',
  },
  swatchHex: {
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  typographySection: {
    gap: 20,
  },
  typographyItem: {
    marginBottom: 12,
  },
  typographySample: {
    marginBottom: 4,
  },
  typographyMeta: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  spacingSection: {
    gap: 16,
  },
  spacingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  spacingVisual: {
    height: 20,
    borderRadius: 4,
  },
  spacingLabel: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  borderRadiusSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  borderRadiusItem: {
    alignItems: 'center',
    gap: 8,
  },
  borderRadiusVisual: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  borderRadiusLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default ThemePreviewScreen;