// components/GlobalUploadManager.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { storageService } from '../services/upload/storageService';

export const GlobalUploadManager = () => {
  const [activeUploads, setActiveUploads] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const uploads = storageService.getActiveUploads();
      setActiveUploads(uploads);
      setVisible(uploads.length > 0);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCancelAll = () => {
    storageService.cancelAllUploads();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Uploads in Progress</Text>
          <Text style={styles.count}>
            {activeUploads.length} upload{activeUploads.length !== 1 ? 's' : ''} active
          </Text>
          <TouchableOpacity 
            style={styles.cancelAllButton}
            onPress={handleCancelAll}
          >
            <Text style={styles.cancelAllButtonText}>Cancel All Uploads</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.closeButtonText}>Minimize</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  count: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  cancelAllButton: {
    backgroundColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelAllButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#007AFF',
  },
});