import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, SafeAreaView, TextInput, FlatList, Text, Pressable, ActivityIndicator, Keyboard, StyleSheet, Image } from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { BarcodeScannerModalProps, SearchProduct } from '../types/main';

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ visible, onClose, onScanned }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  // Search state
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
    if (visible) {
      setScanned(false);
      setSearch('');
      setSearchResults([]);
      setSearchError(null);
    }
  }, [visible, permission, requestPermission]);

  // Debounced search with Spoonacular API
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const url = `https://api.spoonacular.com/food/products/search?query=${encodeURIComponent(search)}&number=10&apiKey=${SPOONACULAR_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.products && Array.isArray(data.products)) {
          const filteredProducts = data.products.filter(
            (product: any) => product.id && product.title
          );
          setSearchResults(filteredProducts);
        } else {
          setSearchResults([]);
        }
        setSearchLoading(false);
      } catch (error) {
        setSearchError('Failed to fetch products. Please try again.');
        setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search]);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    setScanned(true);
    onScanned(result.data);
  };

  const handleProductSelect = (product: SearchProduct) => {
    setScanned(true);
    setSearch('');
    setSearchResults([]);
    Keyboard.dismiss();
    // Use UPC if available, else fallback to id
    onScanned(product.upc || String(product.id));
  };

  if (!permission) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <ThemedView style={styles.center}>
          <ThemedText>Requesting camera permission...</ThemedText>
        </ThemedView>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <ThemedView style={styles.center}>
          <ThemedText style={styles.permissionText}>
            Camera permission is required to scan barcodes.
          </ThemedText>
          <Pressable
            style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}
            onPress={requestPermission}
          >
            <ThemedText
              style={[styles.buttonText, { color: Colors[colorScheme].background }]}
            >
              Grant Permission
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.button, { backgroundColor: Colors[colorScheme].tabIconDefault, marginTop: 10 }]}
            onPress={onClose}
          >
            <ThemedText
              style={[styles.buttonText, { color: Colors[colorScheme].text }]}
            >
              Close
            </ThemedText>
          </Pressable>
        </ThemedView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <ThemedView style={{ flex: 1 }}>
        {/* Search Bar */}
        <SafeAreaView style={styles.searchBarContainer}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: Colors[colorScheme].card,
                color: Colors[colorScheme].text,
                borderColor: Colors[colorScheme].icon,
              },
            ]}
            placeholder="Search for food..."
            placeholderTextColor={Colors[colorScheme].icon}
            value={search}
            onChangeText={setSearch}
            autoFocus={true}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </SafeAreaView>

        {/* Search Results */}
        {search.length > 0 && (
          <View style={styles.searchResultsContainer}>
            {searchLoading && (
              <ActivityIndicator
                size="small"
                color={Colors[colorScheme].tint}
                style={{ marginVertical: 10 }}
              />
            )}
            {searchError && (
              <ThemedText style={{ color: 'red', textAlign: 'center' }}>
                {searchError}
              </ThemedText>
            )}
            {!searchLoading && searchResults.length === 0 && !searchError && (
              <ThemedText
                style={{ textAlign: 'center', opacity: 0.7, marginVertical: 10 }}
              >
                No results found.
              </ThemedText>
            )}
            <FlatList
              data={searchResults}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.resultRow, { backgroundColor: Colors[colorScheme].background }]}
                  onPress={() => handleProductSelect(item)}
                >
                  {item.image ? (
                    <View style={styles.resultImageWrapper}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.resultImage}
                      />
                    </View>
                  ) : (
                    <View style={styles.resultImagePlaceholder} />
                  )}
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.resultTitle} numberOfLines={1}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={styles.resultBrand} numberOfLines={1}>
                      {item.brand}
                    </ThemedText>
                  </View>
                </Pressable>
              )}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 250 }}
            />
          </View>
        )}

        {/* Camera Scanner (hide if searching) */}
        {(!search || search.length === 0) && (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'code39',
                'code93',
                'code128',
                'pdf417',
                'aztec',
                'datamatrix',
              ],
            }}
          />
        )}

        {/* Cancel Button */}
        <Pressable
          style={[
            styles.button,
            styles.cancelButton,
            { backgroundColor: Colors[colorScheme].tint },
          ]}
          onPress={onClose}
        >
          <ThemedText
            style={[styles.buttonText, { color: Colors[colorScheme].background }]}
          >
            Cancel
          </ThemedText>
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
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: [{ translateX: -75 }],
    borderRadius: 25,
  },
  searchBarContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  searchInput: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  searchResultsContainer: {
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    gap: 10,
    elevation: 1,
  },
  resultImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
    backgroundColor: '#eee',
  },
  resultImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  resultImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  resultTitle: {
    fontWeight: '600',
    fontSize: 15,
  },
  resultBrand: {
    fontSize: 12,
    opacity: 0.7,
  },
});