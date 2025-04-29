import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FlatList, View, Button, Alert, ActivityIndicator, StyleSheet, Pressable, Image, Modal, Dimensions } from 'react-native'; // Added Modal, Dimensions
import { loadLogsFromStorage, saveLogsToStorage, addLog, LogEntry } from '@/store/logsSlice';
import { RootState } from '@/store';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tip, TimeFrame } from '../../types/main';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const dispatch = useDispatch();
  const logs = useSelector((state: RootState) => state.logs.entries);
  const colorScheme = useColorScheme() ?? 'light';
  const [scannerVisible, setScannerVisible] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1W');
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [tipModalVisible, setTipModalVisible] = useState(false);

  useEffect(() => {
    dispatch<any>(loadLogsFromStorage());
  }, [dispatch]);

  useEffect(() => {
    saveLogsToStorage(logs);
  }, [logs]);

  const getFilteredLogs = (timeFrame: TimeFrame): LogEntry[] => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    switch (timeFrame) {
      case '1D':
        return logs.filter(l => (now.getTime() - new Date(l.date).getTime()) < oneDay);
      case '1W':
        return logs.filter(l => (now.getTime() - new Date(l.date).getTime()) < 7 * oneDay);
      case '1M':
        return logs.filter(l => (now.getTime() - new Date(l.date).getTime()) < 30 * oneDay);
      case 'All':
      default:
        return logs;
    }
  };

  const filteredLogs = getFilteredLogs(selectedTimeFrame);
  const totalSpent = filteredLogs.reduce((sum: number, l: LogEntry) => sum + l.cost, 0);
  const totalWeight = filteredLogs.reduce((sum: number, l: LogEntry) => sum + l.weight, 0);

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
      Alert.prompt('Enter Cost', `How much did \"${name}\" cost?`, [
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

  const tips: Tip[] = [
    {
      id: '1',
      short: 'Swap snacks for fruits/veg',
      long: 'Replacing processed snacks like chips or cookies with fruits or vegetables is a great way to reduce calorie intake and increase nutrient consumption. It often saves money too, as fresh produce can be cheaper per serving than packaged snacks. Try apples with peanut butter, carrots with hummus, or a handful of berries.',
    },
    {
      id: '2',
      short: 'Cook at home more often',
      long: 'Restaurant meals and takeout often contain higher amounts of sodium, unhealthy fats, and calories compared to home-cooked meals. Cooking at home gives you full control over ingredients and portion sizes, leading to better health outcomes and significant cost savings over time.',
    },
    {
      id: '3',
      short: 'Drink water, not sugary drinks',
      long: 'Sodas, sweetened juices, and energy drinks are major sources of added sugar and empty calories. Switching to water, unsweetened tea, or sparkling water can drastically reduce your sugar intake, aid hydration, and help with weight management without costing much.',
    },
    // Add more tips as needed
  ];

  const handleTipPress = (tip: Tip) => {
    setSelectedTip(tip);
    setTipModalVisible(true);
    // Animation logic would go here in a more advanced implementation
  };

  const renderLogCard = ({ item }: { item: LogEntry }) => (
    <ThemedView style={[styles.card, styles.logCard, { backgroundColor: Colors[colorScheme].card }]}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder} />
      )}
      <ThemedText style={styles.cardTitle} numberOfLines={1}>{item.name}</ThemedText>
      <ThemedText style={styles.cardText}>Cost: ${item.cost.toFixed(2)}</ThemedText>
      <ThemedText style={styles.cardText}>Weight: {item.weight}g</ThemedText>
      <ThemedText style={styles.cardDate}>{new Date(item.date).toLocaleDateString()}</ThemedText>
    </ThemedView>
  );

  const timeFrames: TimeFrame[] = ['1D', '1W', '1M', 'All'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>

      {/* Summary Section */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="title">Summary ({selectedTimeFrame})</ThemedText>
        <View style={styles.summaryValues}>
          <View style={styles.summaryItem}>
            <ThemedText type="subtitle">Spent</ThemedText>
            <ThemedText style={styles.summaryAmount}>${totalSpent.toFixed(2)}</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText type="subtitle">Weight</ThemedText>
            <ThemedText style={styles.summaryAmount}>{totalWeight.toFixed(1)}g</ThemedText>
          </View>
        </View>
        {/* Time Frame Buttons */}
        <View style={styles.timeFrameButtons}>
          {timeFrames.map((frame) => (
            <Pressable
              key={frame}
              style={[
                styles.timeFrameButton,
                { backgroundColor: selectedTimeFrame === frame ? Colors[colorScheme].tint : Colors[colorScheme].tabIconDefault }
              ]}
              onPress={() => setSelectedTimeFrame(frame)}
            >
              <ThemedText style={[
                styles.timeFrameButtonText,
                { color: selectedTimeFrame === frame ? Colors[colorScheme].background : Colors[colorScheme].text }
              ]}>
                {frame}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>

      {/* Tips Section - 2 Column Grid */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Tips for You</ThemedText>
        <View style={styles.tipsGrid}>
          {tips.map((tip) => (
            <Pressable key={tip.id} onPress={() => handleTipPress(tip)} style={styles.tipCardContainer}>
              <ThemedView style={[styles.card, styles.tipCard, { backgroundColor: Colors[colorScheme].card }]}>
                <ThemedText style={styles.tipTextShort}>{tip.short}</ThemedText>
                {/* Placeholder for icon or image if desired */}
              </ThemedView>
            </Pressable>
          ))}
        </View>
      </ThemedView>

      {/* Log Cards Section */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Recent Logs</ThemedText>
        {logs.length > 0 ? (
          <FlatList
            data={logs.slice().reverse()} // Show newest first, reverse a copy
            keyExtractor={item => item.id}
            renderItem={renderLogCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.logListContent}
          />
        ) : (
          <ThemedText style={styles.emptyLogText}>No logs yet. Scan something to get started!</ThemedText>
        )}
      </ThemedView>

      {/* Actions Section - FAB */}
      {loadingProduct && <ActivityIndicator size="large" style={styles.activityIndicatorAbsolute} />}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleScanned}
      />

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: Colors[colorScheme].tint },
          pressed && styles.fabPressed,
        ]}
        onPress={() => setScannerVisible(true)}
        disabled={loadingProduct}
      >
        <Ionicons name="add" size={32} color={Colors[colorScheme].background} />
      </Pressable>

      {/* Tip Detail Modal */}
      <Modal
        animationType="fade" // Simple fade for now
        transparent={true}
        visible={tipModalVisible}
        onRequestClose={() => {
          setTipModalVisible(!tipModalVisible);
          setSelectedTip(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: Colors[colorScheme].card }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>{selectedTip?.short}</ThemedText>
            <ThemedText style={styles.modalText}>{selectedTip?.long}</ThemedText>
            <Pressable
              style={[styles.modalCloseButton, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={() => setTipModalVisible(false)}
            >
              <ThemedText style={{ color: Colors[colorScheme].background }}>Close</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const cardMargin = 8;
const cardSize = (width / 2) - (16 * 2); // Screen width / 2 columns - (horizontal padding * 2)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    paddingTop: 12,
  },
  summaryValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  timeFrameButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  timeFrameButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  timeFrameButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  tipsGrid: { // Container for the 2-column tips
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Distribute space between cards
    marginHorizontal: -cardMargin, // Counteract card margins for alignment
  },
  tipCardContainer: { // Wrapper for each card to handle width and margin
    width: '50%', // Two columns
    paddingHorizontal: cardMargin, // Spacing between columns
    marginBottom: cardMargin * 2, // Spacing between rows
  },
  card: { // Base card style (reused)
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipCard: { // Specific styles for tip cards
    // width: cardSize, // Let container handle width
    height: cardSize * 0.8, // Make it slightly rectangular, adjust as needed for squareness
    justifyContent: 'center', // Center text vertically
    alignItems: 'center', // Center text horizontally
  },
  tipTextShort: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  logListContent: {
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 4,
  },
  emptyLogText: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  logCard: {
    width: 160,
    marginRight: 12,
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 14,
  },
  cardText: {
    fontSize: 12,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.6,
    textAlign: 'right',
  },
  activityIndicatorAbsolute: { // Style for centered activity indicator
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)', // Optional: dim background
  },
  fab: { // Floating Action Button style
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabPressed: {
    opacity: 0.8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dim background
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalTitle: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalCloseButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
});
