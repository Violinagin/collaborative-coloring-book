// screens/AgeGateScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertModal } from '../components/AlertModal';

interface AgeGateScreenProps {
  onAgeVerified?: () => void;
  navigation?: any;
  route?: any;
}

// Use the proper type from navigation.ts
const AgeGateScreen: React.FC<AgeGateScreenProps> = ({ onAgeVerified }) => {
  const navigation = useNavigation();
  const [showAgeAlert, setShowAgeAlert] = useState(false);

  const handleAgeVerified = async () => {
    try {
      console.log('A. AgeGateScreen: Setting age_verified to true');
      await AsyncStorage.setItem('age_verified', 'true');
      console.log('B. AgeGateScreen: Done setting storage');
       if (onAgeVerified) {
        onAgeVerified();
      }
    } catch (error) {
      console.error('AgeGateScreen: Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎨 Welcome to ForkArt</Text>
        <Text style={styles.subtitle}>
          This creative community is for users 13 years and older
        </Text>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleAgeVerified}
        >
          <Text style={styles.primaryButtonText}>I'm 13 or Older</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setShowAgeAlert(true)}
        >
          <Text style={styles.secondaryButtonText}>I'm Under 13</Text>
        </TouchableOpacity>
      </View>
      
      <AlertModal
        visible={showAgeAlert}
        title="Age Restriction"
        message="This app is for users 13 years and older..."
        onClose={() => setShowAgeAlert(false)}
        type="info"
        buttonText="OK"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 17,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 16,
  },
});

export default AgeGateScreen;