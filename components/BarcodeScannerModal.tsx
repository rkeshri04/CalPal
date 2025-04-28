import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Button, StyleSheet, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ visible, onClose, onScanned }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      Camera.requestCameraPermissionsAsync().then(({ status }) => {
        setHasPermission(status === 'granted');
      });
      setScanned(false);
    }
  }, [visible]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    onScanned(data);
  };

  if (hasPermission === null) {
    return <Modal visible={visible} transparent><View style={styles.center}><Text>Requesting camera permission...</Text></View></Modal>;
  }
  if (hasPermission === false) {
    return <Modal visible={visible} transparent><View style={styles.center}><Text>No access to camera</Text><Button title="Close" onPress={onClose} /></View></Modal>;
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={{ flex: 1 }}
        />
        <Button title="Cancel" onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
});
