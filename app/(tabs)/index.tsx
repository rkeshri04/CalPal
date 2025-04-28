import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FlatList, View, Button, Alert, ActivityIndicator } from 'react-native';
import { loadLogsFromStorage, saveLogsToStorage, addLog, LogEntry } from '@/store/logsSlice';
import { RootState } from '@/store';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';

import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const logs = useSelector((state: RootState) => state.logs.entries);

  useEffect(() => {
    dispatch<any>(loadLogsFromStorage());
  }, [dispatch]);

  useEffect(() => {
    saveLogsToStorage(logs);
  }, [logs]);

  // Calculate summary (example: last 7 days)
  const now = new Date();
  const last7Days = logs.filter((l: LogEntry) => (now.getTime() - new Date(l.date).getTime()) < 7 * 24 * 60 * 60 * 1000);
  const totalSpent = last7Days.reduce((sum: number, l: LogEntry) => sum + l.cost, 0);
  const totalWeight = last7Days.reduce((sum: number, l: LogEntry) => sum + l.weight, 0);

  const [scannerVisible, setScannerVisible] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const handleScanned = async (barcode: string) => {
    setScannerVisible(false);
    setLoadingProduct(true);
    try {
      // Fetch product info from Open Food Facts
      const apiKey = process.env.EXPO_PUBLIC_OPENFOODFACTS_API_KEY;
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_quantity,nutriments,brands,code,ecoscore_score,image_front_url`;
      const res = await fetch(url, {
        headers: apiKey ? { 'User-Agent': apiKey } : {},
      });
      const data = await res.json();
      setLoadingProduct(false);
      if (!data.product) {
        Alert.alert('Not found', 'No product found for this barcode. Please enter details manually.');
        promptManual(barcode);
        return;
      }
      const product = data.product;
      const name = product.product_name || 'Unknown Food';
      const image: string = product.image_front_url ?? '';
      let weight: number = 0;
      if (typeof product.product_quantity === 'number') {
        weight = product.product_quantity;
      } else if (typeof product.nutriments?.serving_size === 'string') {
        const match = product.nutriments.serving_size.match(/\d+/);
        weight = match ? parseFloat(match[0]) : 0;
      }
      // No price in Open Food Facts, so prompt for cost
      Alert.prompt('Enter Cost', `How much did "${name}" cost?`, [
        {
          text: 'Cancel', style: 'cancel',
        },
        {
          text: 'Add',
          onPress: (costValue?: string) => {
            const entry: LogEntry = {
              id: Date.now().toString(),
              name,
              image,
              barcode,
              cost: parseFloat(costValue ?? '') || 0,
              weight,
              date: new Date().toISOString(),
            };
            dispatch(addLog(entry));
          },
        },
      ], 'plain-text', '');
    } catch (e) {
      setLoadingProduct(false);
      Alert.alert('Error', 'Could not fetch product info. Please enter details manually.');
      promptManual(barcode);
    }
  };

  function promptManual(barcode: string) {
    let cost = '';
    let weight = '';
    Alert.prompt('Enter Cost', 'How much did it cost?', [
      {
        text: 'Cancel', style: 'cancel',
      },
      {
        text: 'Next',
        onPress: (costValue?: string) => {
          cost = costValue ?? '';
          Alert.prompt('Enter Weight (g)', 'How much did it weigh?', [
            {
              text: 'Cancel', style: 'cancel',
            },
            {
              text: 'Add',
              onPress: (weightValue?: string) => {
                weight = weightValue ?? '';
                const entry: LogEntry = {
                  id: Date.now().toString(),
                  name: 'Scanned Food',
                  barcode,
                  cost: parseFloat(cost) || 0,
                  weight: parseFloat(weight) || 0,
                  date: new Date().toISOString(),
                };
                dispatch(addLog(entry));
              },
            },
          ], 'plain-text');
        },
      },
    ], 'plain-text');
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      {/* Summary */}
      <ThemedView style={{ marginBottom: 16 }}>
        <ThemedText type="title">Last 7 Days</ThemedText>
        <ThemedText>Money Spent: ${totalSpent.toFixed(2)}</ThemedText>
        <ThemedText>Weight Gained: {totalWeight.toFixed(1)}g</ThemedText>
      </ThemedView>
      {/* Tips */}
      <ThemedView style={{ marginBottom: 16 }}>
        <ThemedText type="subtitle">Tips</ThemedText>
        <ThemedText>Try healthy snacks or homemade food to save money and improve your health!</ThemedText>
      </ThemedView>
      {/* Log Cards */}
      <ThemedText type="subtitle">Recent Logs</ThemedText>
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
        renderItem={({ item }) => (
          <View style={{ width: 160, marginRight: 12, backgroundColor: '#eee', borderRadius: 12, padding: 8 }}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={{ width: '100%', height: 80, borderRadius: 8 }} />
            ) : (
              <View style={{ width: '100%', height: 80, backgroundColor: '#ccc', borderRadius: 8 }} />
            )}
            <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
            <ThemedText>Cost: ${item.cost}</ThemedText>
            <ThemedText>Weight: {item.weight}g</ThemedText>
            <ThemedText style={{ fontSize: 10 }}>{new Date(item.date).toLocaleDateString()}</ThemedText>
          </View>
        )}
      />
      {/* Barcode Scanner Button */}
      <Button title="Scan Food/Barcode" onPress={() => setScannerVisible(true)} />
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleScanned}
      />
      {loadingProduct && <ActivityIndicator size="large" style={{ marginTop: 16 }} />}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
