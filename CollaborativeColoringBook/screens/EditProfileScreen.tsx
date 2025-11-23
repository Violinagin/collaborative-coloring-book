// screens/EditProfileScreen.tsx
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
import { supabase } from '../lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const EditProfileScreen = ({ navigation }: Props) => {
  const { user, session, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  
  // Modal content
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'info'
  });

  // Form state
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
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

  // Update profile (display name, username, bio)
  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!formData.displayName.trim()) {
      showError('Error', 'Display name is required');
      return;
    }

    if (!formData.username.trim()) {
      showError('Error', 'Username is required');
      return;
    }

    setLoading(true);
    try {
      // Update user profile in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          display_name: formData.displayName.trim(),
          username: formData.username.trim().toLowerCase(),
          bio: formData.bio.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local user context
      if (updateUser) {
        await updateUser();
      }

      showSuccess('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showError('Error', error.message || 'Failed to update profile');
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
      // First verify current password by signing in again
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session?.user?.email!,
        password: formData.currentPassword,
      });

      if (signInError) {
        showError('Error', 'Current password is incorrect');
        return;
      }

      // Then update email
      const { error } = await supabase.auth.updateUser({
        email: formData.email.trim(),
      });

      if (error) throw error;

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
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

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
    if (!user) return;

    setDeleteLoading(true);
    try {
      // Note: This will cascade delete due to your foreign key constraints
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      // Sign out after deletion
      await supabase.auth.signOut();
      
      showSuccess('Account Deleted', 'Your account has been successfully deleted.');
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
          <TextInput
            style={styles.input}
            value={formData.username}
            onChangeText={(value) => handleInputChange('username', value)}
            placeholder="Your username"
            autoCapitalize="none"
            maxLength={30}
          />
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
            loading && styles.buttonDisabled
          ]}
          onPress={handleUpdateProfile}
          disabled={loading}
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
            loading && styles.buttonDisabled
          ]}
          onPress={handleUpdateEmail}
          disabled={loading}
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
            loading && styles.buttonDisabled
          ]}
          onPress={handleUpdatePassword}
          disabled={loading}
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
            <Text style={styles.modalText}>
              Are you absolutely sure? This will permanently delete:
              {'\n'}• All your artworks
              {'\n'}• Your colorizations  
              {'\n'}• Your comments and likes
              {'\n'}• Your follow relationships
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalDeleteText}>Delete Forever</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, styles.errorTitle]}>{modalContent.title}</Text>
            <Text style={styles.modalText}>{modalContent.message}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalPrimaryButton]}
              onPress={closeModals}
            >
              <Text style={styles.modalPrimaryText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessAction}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, styles.successTitle]}>{modalContent.title}</Text>
            <Text style={styles.modalText}>{modalContent.message}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalPrimaryButton]}
              onPress={handleSuccessAction}
            >
              <Text style={styles.modalPrimaryText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, styles.infoTitle]}>{modalContent.title}</Text>
            <Text style={styles.modalText}>{modalContent.message}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalPrimaryButton]}
              onPress={closeModals}
            >
              <Text style={styles.modalPrimaryText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Email Confirmation Modal */}
      <Modal
        visible={showEmailConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, styles.infoTitle]}>Check Your Email</Text>
            <Text style={styles.modalText}>
              We sent a confirmation link to your new email address. 
              Please verify it to complete the update.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalPrimaryButton]}
              onPress={closeModals}
            >
              <Text style={styles.modalPrimaryText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#ff4444',
  },
  successTitle: {
    color: '#4CAF50',
  },
  infoTitle: {
    color: '#2196F3',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalDeleteButton: {
    backgroundColor: '#ff4444',
  },
  modalPrimaryButton: {
    backgroundColor: '#007AFF',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalDeleteText: {
    color: 'white',
    fontWeight: '600',
  },
  modalPrimaryText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default EditProfileScreen;