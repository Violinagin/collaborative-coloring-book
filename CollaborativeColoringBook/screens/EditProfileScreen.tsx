// screens/EditProfileScreen.tsx - REFACTORED to use services
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api/users';
import { authService } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const EditProfileScreen = ({ navigation }: Props) => {
  const { user, session, loadLeanUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  
  // Validation states
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  
  // Modal content
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'info'
  });

  // Get user data safely with fallbacks
  const userData = user || {
    id: session?.user?.id || '',
    displayName: '',
    username: '',
    bio: '',
  };

  // Form state
  const [formData, setFormData] = useState({
    displayName: userData.displayName || '',
    username: userData.username || '',
    bio: userData.bio || '',
    email: session?.user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Handle form input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear username validation when typing
    if (field === 'username') {
      setUsernameError(null);
      setIsUsernameAvailable(null);
    }
  };

  // Show modal functions
  const showError = (title: string, message: string) => {
    setModalContent({ title, message, type: 'error' });
    setShowErrorModal(true);
  };

  const showSuccess = (title: string, message: string) => {
    setModalContent({ title, message, type: 'success' });
    setShowSuccessModal(true);
  };

  const showInfo = (title: string, message: string) => {
    setModalContent({ title, message, type: 'info' });
    setShowInfoModal(true);
  };

  const showEmailConfirm = () => {
    setShowEmailConfirmModal(true);
  };

  // Close all modals
  const closeModals = () => {
    setShowErrorModal(false);
    setShowSuccessModal(false);
    setShowInfoModal(false);
    setShowEmailConfirmModal(false);
    setShowDeleteModal(false);
  };

  // Check username availability
  const checkUsernameAvailability = async () => {
    if (!formData.username.trim()) {
      setUsernameError('Username is required');
      return;
    }

    if (formData.username.toLowerCase() === userData.username?.toLowerCase()) {
      setIsUsernameAvailable(true); // Same as current username
      return;
    }

    setCheckingUsername(true);
    try {
      const isAvailable = await userService.checkUsernameAvailability(
        formData.username,
        userData.id
      );
      
      setIsUsernameAvailable(isAvailable);
      if (!isAvailable) {
        setUsernameError('Username is already taken');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Could not check username availability');
    } finally {
      setCheckingUsername(false);
    }
  };

  // Update profile (display name, username, bio)
  const handleUpdateProfile = async () => {
    if (!userData.id) {
      showError('Error', 'User not found');
      return;
    }

    // Validation
    if (!formData.displayName.trim()) {
      showError('Error', 'Display name is required');
      return;
    }

    if (!formData.username.trim()) {
      showError('Error', 'Username is required');
      return;
    }

    // Check username if changed
    if (formData.username.toLowerCase() !== userData.username?.toLowerCase()) {
      const isAvailable = await userService.checkUsernameAvailability(
        formData.username,
        userData.id
      );
      
      if (!isAvailable) {
        showError('Error', 'Username is already taken');
        return;
      }
    }

    setLoading(true);
    try {
      // Use userService to update profile
      await userService.updateProfile(userData.id, {
        displayName: formData.displayName.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim(),
      });

      // Refresh user data from context
      if (loadLeanUserProfile) {
        await loadLeanUserProfile();
      }

      showSuccess('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Handle specific error cases
      if (error.code === '23505') {
        showError('Error', 'Username already exists');
      } else {
        showError('Error', error.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update email
  const handleUpdateEmail = async () => {
    if (!formData.email.trim() || !formData.currentPassword) {
      showError('Error', 'Please enter email and current password');
      return;
    }

    if (formData.email === session?.user?.email) {
      showInfo('Info', 'Email is the same as current email');
      return;
    }

    setLoading(true);
    try {
      // Use authService to update email
      await authService.updateEmail(
        session?.user?.email!,
        formData.email.trim(),
        formData.currentPassword
      );

      showEmailConfirm();
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      console.error('Error updating email:', error);
      showError('Error', error.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword) {
      showError('Error', 'Please enter current and new password');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showError('Error', 'New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      showError('Error', 'New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Verify current password first
      const isValid = await authService.verifyPassword(
        session?.user?.email!,
        formData.currentPassword
      );
      
      if (!isValid) {
        showError('Error', 'Current password is incorrect');
        return;
      }

      // Use authService to update password
      await authService.updatePassword(formData.newPassword);

      showSuccess('Success', 'Password updated successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      console.error('Error updating password:', error);
      showError('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!userData.id) return;

    setDeleteLoading(true);
    try {
      // Sign out first
      await authService.signOut();
      
      // Delete user account using userService
      await userService.deleteAccount(userData.id);

      showSuccess('Account Deleted', 'Your account has been successfully deleted.');
      
      // Navigate to auth flow after a delay
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }, 1500);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      showError('Error', error.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleSuccessAction = () => {
    closeModals();
    navigation.goBack();
  };

  // Refresh user data on mount
  React.useEffect(() => {
    if (loadLeanUserProfile) {
      loadLeanUserProfile();
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Profile Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.displayName}
            onChangeText={(value) => handleInputChange('displayName', value)}
            placeholder="Your display name"
            maxLength={50}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username *</Text>
          <View style={styles.usernameContainer}>
            <TextInput
              style={[styles.input, usernameError && styles.inputError]}
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              placeholder="Your username"
              autoCapitalize="none"
              maxLength={30}
            />
            <TouchableOpacity
              style={[styles.checkButton, checkingUsername && styles.checkButtonDisabled]}
              onPress={checkUsernameAvailability}
              disabled={checkingUsername || !formData.username.trim()}
            >
              {checkingUsername ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.checkButtonText}>Check</Text>
              )}
            </TouchableOpacity>
          </View>
          {usernameError && (
            <Text style={styles.errorText}>{usernameError}</Text>
          )}
          {isUsernameAvailable === true && !usernameError && (
            <Text style={styles.successText}>✓ Username is available</Text>
          )}
          <Text style={styles.helperText}>
            Usernames can only contain letters, numbers, and underscores
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            onChangeText={(value) => handleInputChange('bio', value)}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>
            {formData.bio.length}/500 characters
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button, 
            styles.primaryButton, 
            (loading || !formData.displayName.trim() || !formData.username.trim()) && styles.buttonDisabled
          ]}
          onPress={handleUpdateProfile}
          disabled={loading || !formData.displayName.trim() || !formData.username.trim()}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Email Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email Address</Text>
        <Text style={styles.currentEmail}>
          Current: {session?.user?.email}
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password *</Text>
          <TextInput
            style={styles.input}
            value={formData.currentPassword}
            onChangeText={(value) => handleInputChange('currentPassword', value)}
            placeholder="Enter current password"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button, 
            styles.secondaryButton, 
            (!formData.email.trim() || !formData.currentPassword || loading) && styles.buttonDisabled
          ]}
          onPress={handleUpdateEmail}
          disabled={!formData.email.trim() || !formData.currentPassword || loading}
        >
          <Text style={styles.secondaryButtonText}>Update Email</Text>
        </TouchableOpacity>
      </View>

      {/* Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password *</Text>
          <TextInput
            style={styles.input}
            value={formData.currentPassword}
            onChangeText={(value) => handleInputChange('currentPassword', value)}
            placeholder="Enter current password"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password *</Text>
          <TextInput
            style={styles.input}
            value={formData.newPassword}
            onChangeText={(value) => handleInputChange('newPassword', value)}
            placeholder="Enter new password"
            secureTextEntry
          />
          <Text style={styles.helperText}>Minimum 6 characters</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password *</Text>
          <TextInput
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm new password"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button, 
            styles.secondaryButton, 
            (!formData.currentPassword || !formData.newPassword || loading) && styles.buttonDisabled
          ]}
          onPress={handleUpdatePassword}
          disabled={!formData.currentPassword || !formData.newPassword || loading}
        >
          <Text style={styles.secondaryButtonText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={[styles.section, styles.dangerSection]}>
        <Text style={styles.dangerSectionTitle}>Danger Zone</Text>
        <Text style={styles.dangerText}>
          Once you delete your account, there is no going back. Please be certain.
        </Text>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={confirmDeleteAccount}
        >
          <Text style={styles.dangerButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Modals remain the same... */}
      {/* ... (Keep all your existing modal code) ... */}
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  usernameContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  checkButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  checkButtonDisabled: {
    opacity: 0.6,
  },
  checkButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 4,
  },
  successText: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  currentEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerSection: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#ff4444',
  },
  dangerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: '#ff4444',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;