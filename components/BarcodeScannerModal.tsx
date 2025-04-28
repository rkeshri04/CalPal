import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Button, StyleSheet, Pressable } from 'react-native'; // Added Pressable
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useColorScheme } from '@/hooks/useColorScheme'; // Import hook
import { Colors } from '@/constants/Colors'; // Import Colors
import { ThemedText } from './ThemedText'; // Import ThemedText for consistent styling
import { ThemedView } from './ThemedView'; // Import ThemedView

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ visible, onClose, onScanned }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const colorScheme = useColorScheme() ?? 'light'; // Get color scheme

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
    if (visible) {
      setScanned(false); // Reset scanned state when modal becomes visible
    }
  }, [visible, permission, requestPermission]);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => { // Renamed for clarity
    setScanned(true);
    onScanned(result.data);
  };

  if (!permission) {
    // Permissions are still loading
    return (
      <Modal visible={visible} transparent animationType="fade">
        <ThemedView style={styles.center}>
          <ThemedText>Requesting camera permission...</ThemedText>
        </ThemedView>
      </Modal>
    );
  }

  if (!permission.granted) {
    // Permissions are not granted
    return (
      <Modal visible={visible} transparent animationType="fade">
        <ThemedView style={styles.center}>
          <ThemedText style={styles.permissionText}>Camera permission is required to scan barcodes.</ThemedText>
          {/* Use Pressable for better styling */}
          <Pressable style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]} onPress={requestPermission}>
            <ThemedText style={[styles.buttonText, { color: Colors[colorScheme].background }]}>Grant Permission</ThemedText>
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: Colors[colorScheme].tabIconDefault, marginTop: 10 }]} onPress={onClose}>
            <ThemedText style={[styles.buttonText, { color: Colors[colorScheme].text }]}>Close</ThemedText>
          </Pressable>
        </ThemedView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      {/* Use ThemedView for background color */}
      <ThemedView style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code39',
              'code93', 'code128', 'pdf417', 'aztec', 'datamatrix',
            ],
          }}
        />
        {/* Use Pressable for Cancel button */}
        <Pressable style={[styles.button, styles.cancelButton, { backgroundColor: Colors[colorScheme].tint }]} onPress={onClose}>
          <ThemedText style={[styles.buttonText, { color: Colors[colorScheme].background }]}>Cancel</ThemedText>
        </Pressable>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Add padding
    // Background color applied by ThemedView
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  button: { // Common button style
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150, // Ensure minimum width
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: { // Specific style for cancel button in scanner view
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: [{ translateX: -75 }], // Center button (half of minWidth)
    borderRadius: 25, // Make it more rounded
  },
});
