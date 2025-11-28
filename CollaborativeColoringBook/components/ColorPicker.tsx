// components/ColorPicker.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B195', '#F67280', '#C06C84', '#6C5B7B', '#355C7D'
];

interface ColorPickerProps {
  onColorSelect: (color: string) => void;
  selectedColor?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  onColorSelect, 
  selectedColor 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a Color:</Text>
      <View style={styles.colorsContainer}>
        {COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColor
            ]}
            onPress={() => onColorSelect(color)}
          />
        ))}
      </View>
      {selectedColor && (
        <Text style={styles.selectedText}>
          Selected: <Text style={{ color: selectedColor }}>■</Text> {selectedColor}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#333',
    transform: [{ scale: 1.1 }],
  },
  selectedText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
});