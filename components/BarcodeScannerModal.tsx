import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, SafeAreaView, TextInput, FlatList, Text, Pressable, ActivityIndicator, Keyboard, StyleSheet, Image } from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ThemedText } from './ui/ThemedText';
import { ThemedView } from './ui/ThemedView';
import { BarcodeScannerModalProps, SearchProduct, NutritionInfo } from '../types/main';

// Update prop type
type BarcodeScannerModalPropsFixed = Omit<BarcodeScannerModalProps, 'onScanned'> & {
  onScanned: (product: SearchProduct) => void;
};

const FDC_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY as string;

// Helper to map USDA food nutrients to our NutritionInfo type
const mapFdcNutrientsToNutritionInfo = (food: any): NutritionInfo => {
  const nutrition: NutritionInfo = {};
  if (!food || !Array.isArray(food.foodNutrients)) {
    console.log('No foodNutrients array found');
    return nutrition;
  }

  console.log(`Processing ${food.foodNutrients.length} nutrients for ${food.description}`);

  for (const n of food.foodNutrients) {
    // Handle both response formats: direct properties and nested nutrient object
    const name = (n.nutrientName || n.nutrient?.name || '').toLowerCase();
    const nutrientNumber = n.nutrientNumber || n.nutrient?.number;
    const value = n.value || n.amount;
    const unit = (n.unitName || n.nutrient?.unitName || '').toLowerCase();

    // Energy/Calories (nutrient 208)
    if ((name.includes('energy') || nutrientNumber === '208' || nutrientNumber === 208) && (unit === 'kcal' || unit === 'KCAL')) {
      nutrition.calories = value;
      console.log('Found calories:', value);
    }
    // Protein (nutrient 203)
    if ((name.includes('protein') || nutrientNumber === '203' || nutrientNumber === 203) && unit === 'g') {
      nutrition.protein = value;
      console.log('Found protein:', value);
    }
    // Fat (nutrient 204)
    if ((name === 'total lipid (fat)' || name.includes('fat') || nutrientNumber === '204' || nutrientNumber === 204) && unit === 'g') {
      nutrition.fat = value;
      console.log('Found fat:', value);
    }
    // Carbs (nutrient 205)
    if ((name.includes('carbohydrate') || name === 'carbohydrate, by difference' || nutrientNumber === '205' || nutrientNumber === 205) && unit === 'g') {
      nutrition.carbs = value;
      console.log('Found carbs:', value);
    }
  }

  console.log('Final nutrition:', nutrition);
  return nutrition;
};

// Helper to map USDA food to SearchProduct
const mapFdcFoodToSearchProduct = (food: any): SearchProduct => {
  return {
    fdcId: food.fdcId,
    description: food.description,
    brandOwner: food.brandOwner,
    gtinUpc: food.gtinUpc,
    image_url: undefined,
    nutriments: mapFdcNutrientsToNutritionInfo(food),
  };
};

const fetchFdcFoodDetails = async (fdcId: number): Promise<SearchProduct | null> => {
  try {
    const url = `${FDC_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const fullFood = await response.json();
    console.log(`USDA detail for fdcId ${fdcId} nutrients:`, fullFood.foodNutrients?.slice(0, 10));
    return mapFdcFoodToSearchProduct(fullFood);
  } catch (e) {
    console.error('USDA detail fetch error', e);
    return null;
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalPropsFixed> = ({ visible, onClose, onScanned }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  // Search state
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

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

  // Debounced search with USDA FoodData Central API (using /foods/search)
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
        const url = `${FDC_BASE_URL}/foods/search?query=${encodeURIComponent(search)}&pageSize=10&dataType=Branded,Survey (FNDDS)&api_key=${USDA_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('USDA search result (first item)', JSON.stringify(data.foods?.[0], null, 2));
        if (data.foods && Array.isArray(data.foods)) {
          // Fetch detailed info for each result
          const detailedPromises = data.foods.slice(0, 10).map(async (food: any) => {
            if (food.fdcId) {
              const detailed = await fetchFdcFoodDetails(food.fdcId);
              return detailed || mapFdcFoodToSearchProduct(food);
            }
            return mapFdcFoodToSearchProduct(food);
          });
          const mapped = await Promise.all(detailedPromises);
          setSearchResults(mapped.filter(Boolean) as SearchProduct[]);
        } else {
          setSearchResults([]);
        }
        setSearchLoading(false);
      } catch (error) {
        console.error('USDA search error', error);
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

  // Barcode scan handler using USDA FoodData Central
  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    setScanned(true);
    const barcode = String(result.data);
    try {
      const url = `${FDC_BASE_URL}/foods/search?query=${encodeURIComponent(barcode)}&pageSize=1&dataType=Branded&api_key=${USDA_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log('USDA barcode search result', JSON.stringify(data.foods?.[0], null, 2));
      if (data.foods && data.foods.length > 0) {
        const basicFood = data.foods[0];
        console.log('basicFood.fdcId:', basicFood.fdcId);
        let product = mapFdcFoodToSearchProduct(basicFood);
        console.log('product before detail fetch:', product);
        if (basicFood.fdcId) {
          const detailed = await fetchFdcFoodDetails(basicFood.fdcId);
          console.log('detailed product:', detailed);
          if (detailed) product = detailed;
        }
        console.log('final product sent to onScanned:', product);
        onScanned(product);
      } else {
        // Fallback: minimal product with barcode only
        onScanned({
          fdcId: 0,
          description: '',
          brandOwner: '',
          gtinUpc: barcode,
          image_url: undefined,
          nutriments: {},
        });
      }
    } catch (e) {
      console.error('USDA barcode search error', e);
      onScanned({
        fdcId: 0,
        description: '',
        brandOwner: '',
        gtinUpc: barcode,
        image_url: undefined,
        nutriments: {},
      });
    }
  };

  // Product select handler
  const handleProductSelect = async (product: SearchProduct) => {
    setScanned(true);
    setSearch('');
    setSearchResults([]);
    Keyboard.dismiss();

    let finalProduct = product;
    if (product.fdcId) {
      const detailed = await fetchFdcFoodDetails(product.fdcId);
      if (detailed) finalProduct = detailed;
    }

    onScanned(finalProduct);
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
              keyExtractor={(item) => String(item.fdcId || item.gtinUpc || Math.random())}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.resultRow, { backgroundColor: Colors[colorScheme].background }]}
                  onPress={() => handleProductSelect(item)}
                >
                  {item.image_url ? (
                    <View style={styles.resultImageWrapper}>
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.resultImage}
                      />
                    </View>
                  ) : (
                    <View style={styles.resultImagePlaceholder} />
                  )}
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.resultTitle} numberOfLines={1}>
                      {item.description}
                    </ThemedText>
                    <ThemedText style={styles.resultBrand} numberOfLines={1}>
                      {item.brandOwner}
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