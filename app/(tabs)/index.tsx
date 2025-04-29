import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FlatList, View, Alert, ActivityIndicator, StyleSheet, Pressable, Image, Modal, Dimensions, Text, ScrollView, KeyboardAvoidingView, Platform, TextInput, Animated } from 'react-native';
import { RootState } from '@/store';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tip, TimeFrame } from '../../types/main';
import { LogEntry } from '@/store/logsSlice';
import { useRouter } from 'expo-router';
import { loadLogsFromStorage, saveLogsToStorage, addLog } from '@/store/logsSlice';
import * as SecureStore from 'expo-secure-store';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

const { width } = Dimensions.get('window');
const timeFrames: TimeFrame[] = ['1D', '1W', '1M', 'All'];

export default function HomeScreen() {
  const dispatch = useDispatch();
  const logs = useSelector((state: RootState) => state.logs.entries);
  const colorScheme = useColorScheme() ?? 'light';
  const [scannerVisible, setScannerVisible] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1W');
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const fabMenuOptions = [
    { label: 'Scan Barcode', action: () => { setFabMenuVisible(false); setScannerVisible(true); } },
    { label: 'Add Food Manually', action: () => { setFabMenuVisible(false); promptManual(''); } },
  ];
  const router = useRouter();

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
  const totalCalories = filteredLogs.reduce((sum: number, l: LogEntry) => sum + (l.calories || 0), 0);
  const totalFat = filteredLogs.reduce((sum: number, l: LogEntry) => sum + (l.fat || 0), 0);
  const totalCarbs = filteredLogs.reduce((sum: number, l: LogEntry) => sum + (l.carbs || 0), 0);
  const totalProtein = filteredLogs.reduce((sum: number, l: LogEntry) => sum + (l.protein || 0), 0);

  // Update handleScanned to accept a product object
  const handleScanned = async (product: any) => {
    setScannerVisible(false);
    setLoadingProduct(true);
    try {
      // Extract product info from Open Food Facts
      const name = product.product_name || 'Unknown Food';
      const image = product.image_url || '';
      const barcode = product.code || '';
      const nutriments = product.nutriments || {};
      const calories = nutriments['energy-kcal'] || nutriments['energy-kcal_100g'] || undefined;
      const fat = nutriments['fat'] || nutriments['fat_100g'] || undefined;
      const carbs = nutriments['carbohydrates'] || nutriments['carbohydrates_100g'] || undefined;
      const protein = nutriments['proteins'] || nutriments['proteins_100g'] || undefined;
      setLoadingProduct(false);
      // Prompt for cost and weight
      Alert.prompt('Enter Cost', `How much did "${name}" cost?`, [
        {
          text: 'Cancel', style: 'cancel',
        },
        {
          text: 'Add',
          onPress: (costValue?: string) => {
            Alert.prompt('Enter Weight (g)', 'How much did it weigh?', [
              {
                text: 'Cancel', style: 'cancel',
              },
              {
                text: 'Add',
                onPress: (weightValue?: string) => {
                  const entry = {
                    id: Date.now().toString(),
                    name,
                    image,
                    barcode,
                    cost: parseFloat(costValue ?? '') || 0,
                    weight: parseFloat(weightValue ?? '') || 0,
                    calories: calories ? Number(calories) : undefined,
                    fat: fat ? Number(fat) : undefined,
                    carbs: carbs ? Number(carbs) : undefined,
                    protein: protein ? Number(protein) : undefined,
                    date: new Date().toISOString(),
                  };
                  dispatch<any>(addLog(entry));
                },
              },
            ], 'plain-text');
          },
        },
      ], 'plain-text', '');
    } catch (e) {
      setLoadingProduct(false);
      Alert.alert('Error', 'Could not fetch product info. Please enter details manually.');
      promptManual(product.code || '');
    }
  };

  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    barcode: '',
    image: '',
    cost: '',
    weight: '',
    calories: '',
    fat: '',
    carbs: '',
    protein: '',
  });

  const handleManualSubmit = () => {
    const entry = {
      id: Date.now().toString(),
      name: manualForm.name || 'Unknown Food',
      barcode: manualForm.barcode || '',
      image: manualForm.image || '',
      cost: parseFloat(manualForm.cost) || 0,
      weight: parseFloat(manualForm.weight) || 0,
      calories: parseFloat(manualForm.calories) || 0,
      fat: parseFloat(manualForm.fat) || 0,
      carbs: parseFloat(manualForm.carbs) || 0,
      protein: parseFloat(manualForm.protein) || 0,
      date: new Date().toISOString(),
    };
    dispatch<any>(addLog(entry));
    setManualModalVisible(false);
    setManualForm({
      name: '',
      barcode: '',
      image: '',
      cost: '',
      weight: '',
      calories: '',
      fat: '',
      carbs: '',
      protein: '',
    });
  };

  function promptManual(barcode: string) {
    setManualModalVisible(true);
    setManualForm(f => ({ ...f, barcode }));
  }

  // Group logs by date for pills
  const logsByDate = useMemo(() => {
    const grouped: Record<string, LogEntry[]> = {};
    logs.forEach(log => {
      const date = log.date.slice(0, 10);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(log);
    });
    // Sort dates ascending (oldest left, newest right)
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [logs]);
  const [selectedLogDate, setSelectedLogDate] = useState<string | null>(logsByDate[0]?.[0] || null);
  useEffect(() => {
    if (logsByDate.length > 0 && !selectedLogDate) setSelectedLogDate(logsByDate[0][0]);
  }, [logsByDate]);

  const renderLogCard = ({ item }: { item: LogEntry }) => (
    <ThemedView style={[styles.logCard, { backgroundColor: Colors[colorScheme].card }]}> 
      <View style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}>
        <Menu>
          <MenuTrigger>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors[colorScheme].icon} />
          </MenuTrigger>
          <MenuOptions customStyles={{ optionsContainer: { borderRadius: 10, width: 120 } }}>
            <MenuOption onSelect={() => handleEdit(item)} text="Edit" />
            <MenuOption onSelect={() => handleDelete(item.id)} text="Delete" />
          </MenuOptions>
        </Menu>
      </View>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder} />
      )}
      <ThemedText style={styles.cardTitle} numberOfLines={1}>{item.name}</ThemedText>
      <ThemedText style={styles.cardText}>Cost: ${item.cost.toFixed(2)}</ThemedText>
      <ThemedText style={styles.cardText}>Weight: {item.weight}g</ThemedText>
      <ThemedText style={styles.cardText}>Calories: {item.calories ? item.calories.toFixed(0) : '--'}</ThemedText>
      <ThemedText style={styles.cardText}>Fat: {item.fat ? item.fat.toFixed(1) : '--'}g | Carbs: {item.carbs ? item.carbs.toFixed(1) : '--'}g | Protein: {item.protein ? item.protein.toFixed(1) : '--'}g</ThemedText>
    </ThemedView>
  );

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState(manualForm);
  const [editId, setEditId] = useState<string | null>(null);

  const handleEdit = (log: LogEntry) => {
    setEditForm({
      name: log.name,
      barcode: log.barcode,
      image: log.image || '',
      cost: log.cost.toString(),
      weight: log.weight.toString(),
      calories: log.calories?.toString() || '',
      fat: log.fat?.toString() || '',
      carbs: log.carbs?.toString() || '',
      protein: log.protein?.toString() || '',
    });
    setEditId(log.id);
    setEditModalVisible(true);
  };
  const handleEditSubmit = () => {
    if (!editId) return;
    const updated = {
      id: editId,
      name: editForm.name,
      barcode: editForm.barcode,
      image: editForm.image,
      cost: parseFloat(editForm.cost) || 0,
      weight: parseFloat(editForm.weight) || 0,
      calories: parseFloat(editForm.calories) || 0,
      fat: parseFloat(editForm.fat) || 0,
      carbs: parseFloat(editForm.carbs) || 0,
      protein: parseFloat(editForm.protein) || 0,
      date: logs.find(l => l.id === editId)?.date || new Date().toISOString(),
    };
    dispatch<any>({ type: 'logs/setLogs', payload: logs.map(l => l.id === editId ? updated : l) });
    setEditModalVisible(false);
    setEditId(null);
  };
  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch<any>({ type: 'logs/setLogs', payload: logs.filter(l => l.id !== id) }) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}> 
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
          <View style={styles.summaryItem}>
            <ThemedText type="subtitle">Calories</ThemedText>
            <ThemedText style={styles.summaryAmount}>{totalCalories.toFixed(0)}</ThemedText>
          </View>
        </View>
        <View style={styles.summaryMacrosRow}>
          <View style={styles.summaryMacroItem}><ThemedText style={styles.macroLabel}>Fat</ThemedText><ThemedText style={styles.macroValue}>{totalFat.toFixed(1)}g</ThemedText></View>
          <View style={styles.summaryMacroItem}><ThemedText style={styles.macroLabel}>Carbs</ThemedText><ThemedText style={styles.macroValue}>{totalCarbs.toFixed(1)}g</ThemedText></View>
          <View style={styles.summaryMacroItem}><ThemedText style={styles.macroLabel}>Protein</ThemedText><ThemedText style={styles.macroValue}>{totalProtein.toFixed(1)}g</ThemedText></View>
        </View>
        {/* Time Frame Buttons */}
        <View style={styles.timeFrameButtons}>
          {timeFrames.map((frame: TimeFrame) => (
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

      {/* Pills for recent log dates */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Recent Days</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll} contentContainerStyle={{ paddingVertical: 8 }}>
          {logsByDate.map(([date]) => (
            <Pressable
              key={date}
              style={[styles.datePill, { backgroundColor: selectedLogDate === date ? Colors[colorScheme].tint : Colors[colorScheme].card, borderColor: Colors[colorScheme].tint }, selectedLogDate === date && { borderWidth: 2 }]}
              onPress={() => setSelectedLogDate(date)}
            >
              <Text style={{ color: selectedLogDate === date ? Colors[colorScheme].background : Colors[colorScheme].text, fontWeight: 'bold' }}>{parseInt(date.slice(-2), 10)}</Text>
              <Text style={{ color: selectedLogDate === date ? Colors[colorScheme].background : Colors[colorScheme].text, fontSize: 10 }}>{date.slice(5, 7)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Log Cards Section for selected day */}
      <ThemedView style={styles.sectionContainer}>
        {selectedLogDate && logsByDate.find(([d]) => d === selectedLogDate)?.[1].length ? (
          <FlatList
            data={logsByDate.find(([d]) => d === selectedLogDate)?.[1] || []}
            keyExtractor={item => item.id}
            renderItem={renderLogCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.logListContent}
          />
        ) : (
          <ThemedText style={styles.emptyLogText}>No logs for this day.</ThemedText>
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

      {/* Floating Action Button Menu */}
      {fabMenuVisible && (
        <View style={styles.fabMenuContainer}>
          {fabMenuOptions.map((opt, idx) => (
            <Pressable
              key={opt.label}
              style={[styles.fabMenuItem, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={opt.action}
            >
              <Text style={{ color: Colors[colorScheme].background, fontWeight: 'bold' }}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: Colors[colorScheme].tint },
          pressed && styles.fabPressed,
        ]}
        onPress={() => setFabMenuVisible((v) => !v)}
        disabled={loadingProduct}
      >
        <Ionicons name={fabMenuVisible ? 'close' : 'add'} size={32} color={Colors[colorScheme].background} />
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

      {/* Manual Add Modal as a bottom sheet overlay */}
      <Modal
        visible={manualModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setManualModalVisible(false)}
      >
        <KeyboardAvoidingView style={styles.bottomSheetOverlay}>
          <Animated.View style={[styles.bottomSheet, { backgroundColor: Colors[colorScheme].background }]}> 
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={styles.sheetHandle} />
              <Text style={[styles.manualModalTitle, { color: Colors[colorScheme].tint }]}>Add Food Manually</Text>
            </View>
            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
              <TextInput style={[styles.manualInput, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                placeholder="Name*" placeholderTextColor={Colors[colorScheme].icon} value={manualForm.name} onChangeText={(v: string) => setManualForm(f => ({ ...f, name: v }))} />
              {/* <TextInput style={[styles.manualInput, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                placeholder="Barcode (optional)" placeholderTextColor={Colors[colorScheme].icon} value={manualForm.barcode} onChangeText={(v: string) => setManualForm(f => ({ ...f, barcode: v }))} />
              <TextInput style={[styles.manualInput, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                placeholder="Image URL (optional)" placeholderTextColor={Colors[colorScheme].icon} value={manualForm.image} onChangeText={(v: string) => setManualForm(f => ({ ...f, image: v }))} /> */}
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="currency-usd" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Cost*" placeholderTextColor={Colors[colorScheme].icon} value={manualForm.cost} onChangeText={(v: string) => setManualForm(f => ({ ...f, cost: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="weight-gram" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Weight (g)*" placeholderTextColor={Colors[colorScheme].icon} value={manualForm.weight} onChangeText={(v: string) => setManualForm(f => ({ ...f, weight: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="fire" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Calories" placeholderTextColor={Colors[colorScheme].icon} value={manualForm.calories} onChangeText={(v: string) => setManualForm(f => ({ ...f, calories: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="food-drumstick" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Protein (g)" placeholderTextColor={Colors[colorScheme].icon} value={manualForm.protein} onChangeText={(v: string) => setManualForm(f => ({ ...f, protein: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="bread-slice" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Carbs (g)" placeholderTextColor={Colors[colorScheme].icon} value={manualForm.carbs} onChangeText={(v: string) => setManualForm(f => ({ ...f, carbs: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="water" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Fat (g)" placeholderTextColor={Colors[colorScheme].icon} value={manualForm.fat} onChangeText={(v: string) => setManualForm(f => ({ ...f, fat: v }))} keyboardType="decimal-pad" />
              </View>
            </ScrollView>
            <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'center' }}>
              <Pressable style={[styles.manualButton, { backgroundColor: Colors[colorScheme].tabIconDefault }]} onPress={() => setManualModalVisible(false)}>
                <Text style={{ color: Colors[colorScheme].text }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.manualButton, { backgroundColor: Colors[colorScheme].tint, marginLeft: 12 }]} onPress={handleManualSubmit}>
                <Text style={{ color: Colors[colorScheme].background, fontWeight: 'bold' }}>Add</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal (similar to manual add) */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <Animated.View style={[styles.bottomSheet, { backgroundColor: Colors[colorScheme].background }]}> 
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={styles.sheetHandle} />
              <Text style={[styles.manualModalTitle, { color: Colors[colorScheme].tint }]}>Edit Food Log</Text>
            </View>
            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
              <TextInput style={[styles.manualInput, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                placeholder="Name*" placeholderTextColor={Colors[colorScheme].icon} value={editForm.name} onChangeText={(v: string) => setEditForm(f => ({ ...f, name: v }))} />
              {/* <TextInput style={[styles.manualInput, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                placeholder="Barcode (optional)" placeholderTextColor={Colors[colorScheme].icon} value={editForm.barcode} onChangeText={(v: string) => setEditForm(f => ({ ...f, barcode: v }))} /> */}
              {/* <TextInput style={[styles.manualInput, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                placeholder="Image URL (optional)" placeholderTextColor={Colors[colorScheme].icon} value={editForm.image} onChangeText={(v: string) => setEditForm(f => ({ ...f, image: v }))} /> */}
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="currency-usd" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Cost*" placeholderTextColor={Colors[colorScheme].icon} value={editForm.cost} onChangeText={(v: string) => setEditForm(f => ({ ...f, cost: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="weight-gram" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Weight (g)*" placeholderTextColor={Colors[colorScheme].icon} value={editForm.weight} onChangeText={(v: string) => setEditForm(f => ({ ...f, weight: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="fire" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Calories" placeholderTextColor={Colors[colorScheme].icon} value={editForm.calories} onChangeText={(v: string) => setEditForm(f => ({ ...f, calories: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="food-drumstick" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Protein (g)" placeholderTextColor={Colors[colorScheme].icon} value={editForm.protein} onChangeText={(v: string) => setEditForm(f => ({ ...f, protein: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="bread-slice" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Carbs (g)" placeholderTextColor={Colors[colorScheme].icon} value={editForm.carbs} onChangeText={(v: string) => setEditForm(f => ({ ...f, carbs: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={styles.nutrientRow}>
                <MaterialCommunityIcons name="water" size={22} color={Colors[colorScheme].tint} style={styles.nutrientIcon} />
                <TextInput style={[styles.manualInputNutrient, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Fat (g)" placeholderTextColor={Colors[colorScheme].icon} value={editForm.fat} onChangeText={(v: string) => setEditForm(f => ({ ...f, fat: v }))} keyboardType="decimal-pad" />
              </View>
            </ScrollView>
            <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'center' }}>
              <Pressable style={[styles.manualButton, { backgroundColor: Colors[colorScheme].tabIconDefault }]} onPress={() => setEditModalVisible(false)}>
                <Text style={{ color: Colors[colorScheme].text }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.manualButton, { backgroundColor: Colors[colorScheme].tint, marginLeft: 12 }]} onPress={handleEditSubmit}>
                <Text style={{ color: Colors[colorScheme].background, fontWeight: 'bold' }}>Save</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionContainer: {
    marginTop: 20
  },
  sectionTitle: {
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
  pillScroll: {
    marginBottom: 8,
  },
  datePill: {
    backgroundColor: undefined, // will be set dynamically
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 40,
    borderWidth: 1,
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
  fab: {
    position: 'absolute',
    bottom: 90, // move above tab bar
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
  fabMenuContainer: {
    position: 'absolute',
    right: 30,
    bottom: 170, // Increased from 100 to 170 to move menu higher above the button
    alignItems: 'flex-end',
    zIndex: 10,
  },
  fabMenuItem: {
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  summaryMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    marginTop: -8,
  },
  summaryMacroItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  macroLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomSheet: {
    width: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
    minHeight: 480,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  manualInput: {
    width: '95%',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  manualInputNutrient: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
    marginLeft: 8,
  },
  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '95%',
    marginBottom: 4,
  },
  nutrientIcon: {
    marginLeft: 2,
  },
  manualModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  manualButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
  },
});
