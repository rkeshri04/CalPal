import React, { useEffect, useState, useMemo } from 'react';
import { FlatList, View, Alert, ActivityIndicator, StyleSheet, Pressable, Image, Text, Modal, ScrollView, KeyboardAvoidingView, Platform, TextInput, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Tip, TimeFrame } from '../../types/main';
import { LogEntry } from '@/store/logsSlice';
import { useRouter } from 'expo-router';
import { loadLogsFromStorage, saveLogsToStorage, addLog } from '@/store/logsSlice';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import {
  loadUserProfileFromStorage,
  saveUserProfileToStorage,
  setUserProfile,
  setLastPrompt,
} from '@/store/userProfileSlice';
import { LineChart } from 'react-native-chart-kit';
import { Collapsible } from '@/components/Collapsible';
import { FoodLogModal } from '@/components/FoodLogModal';
import { database, Log, UserProfile } from '../../db/database';

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
  const userProfile = useSelector((state: RootState) => state.userProfile.profile);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({ age: '', height: '', weight: '', feet: '', inches: '' });
  const [unitSystem, setUnitSystem] = useState<'us' | 'metric'>('us');
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiColor, setBmiColor] = useState<string>('#4caf50');
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    dispatch<any>(loadUserProfileFromStorage()).then(() => setProfileLoaded(true));
  }, [dispatch]);

  // Show modal if profile missing (wait for load)
  useEffect(() => {
    if (profileLoaded && !userProfile) {
      setProfileModalVisible(true);
    }
  }, [userProfile, profileLoaded]);

  // Weekly prompt for weight/height update
  useEffect(() => {
    if (userProfile && userProfile.lastPrompt) {
      const last = new Date(userProfile.lastPrompt);
      const now = new Date();
      const diff = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
      if (diff >= 7) {
        Alert.alert(
          'Update your stats',
          'Would you like to log your current weight and height?',
          [
            { text: 'No' },
            {
              text: 'Yes',
              onPress: () => setProfileModalVisible(true),
            },
          ]
        );
        dispatch<any>(setLastPrompt(now.toISOString()));
        saveUserProfileToStorage({ ...userProfile, lastPrompt: now.toISOString() });
      }
    }
  }, [userProfile]);

  // Calculate BMI and color
  useEffect(() => {
    let h = 0;
    let w = 0;
    if (unitSystem === 'us') {
      const feet = parseFloat(profileForm.feet);
      const inches = parseFloat(profileForm.inches);
      h = (feet * 12 + inches) * 2.54; // convert to cm
      w = parseFloat(profileForm.weight) * 0.453592; // lbs to kg
    } else {
      h = parseFloat(profileForm.height);
      w = parseFloat(profileForm.weight);
    }
    if (h > 0 && w > 0) {
      const bmiVal = w / ((h / 100) * (h / 100));
      setBmi(bmiVal);
      if (bmiVal < 18.5) setBmiColor('#2196f3');
      else if (bmiVal < 25) setBmiColor('#4caf50');
      else if (bmiVal < 30) setBmiColor('#ff9800');
      else setBmiColor('#f44336');
    } else {
      setBmi(null);
      setBmiColor('#4caf50');
    }
  }, [profileForm.height, profileForm.weight, profileForm.feet, profileForm.inches, unitSystem]);

  // Handle profile submit
  const handleProfileSubmit = async () => {
    const age = parseInt(profileForm.age);
    let height = 0;
    let weight = 0;
    if (unitSystem === 'us') {
      const feet = parseFloat(profileForm.feet);
      const inches = parseFloat(profileForm.inches);
      height = (feet * 12 + inches) * 2.54; // cm
      weight = parseFloat(profileForm.weight) * 0.453592; // kg
    } else {
      height = parseFloat(profileForm.height);
      weight = parseFloat(profileForm.weight);
    }
    if (!age || !height || !weight) return;
    const now = new Date().toISOString();
    const bmiVal = weight / ((height / 100) * (height / 100));
    const newProfile = {
      age,
      height,
      weight,
      unitSystem,
      bmiHistory: [
        ...(userProfile?.bmiHistory || []),
        { date: now, bmi: bmiVal, weight, height },
      ],
      lastPrompt: now,
    };
    await dispatch<any>(saveUserProfileToStorage(newProfile));
    dispatch<any>(setUserProfile(newProfile));
    setProfileModalVisible(false);
  };

  // Load logs on mount
  useEffect(() => {
    dispatch<any>(loadLogsFromStorage());
  }, [dispatch]);

  // Save logs to WatermelonDB whenever logs change
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

  const handleScanned = async (product: any) => {
    setScannerVisible(false);
    setLoadingProduct(true);
    try {
      const name = product.product_name || 'Unknown Food';
      const image = product.image_url || '';
      const barcode = product.code || '';
      const nutriments = product.nutriments || {};
      const calories = nutriments['energy-kcal'] || nutriments['energy-kcal_100g'] || undefined;
      const fat = nutriments['fat'] || nutriments['fat_100g'] || undefined;
      const carbs = nutriments['carbohydrates'] || nutriments['carbohydrates_100g'] || undefined;
      const protein = nutriments['proteins'] || nutriments['proteins_100g'] || undefined;
      setLoadingProduct(false);
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
                onPress: async (weightValue?: string) => {
                  const now = new Date();
                  const localDate = now.toLocaleDateString('en-CA');
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
                    date: now.toISOString(),
                    localDate,
                  };
                  await database.write(async () => {
                    await database.get<Log>('logs').create(log => {
                      log._raw.id = entry.id;
                      log.name = entry.name;
                      log.image = entry.image;
                      log.barcode = entry.barcode;
                      log.cost = entry.cost;
                      log.weight = entry.weight;
                      log.calories = entry.calories;
                      log.fat = entry.fat;
                      log.carbs = entry.carbs;
                      log.protein = entry.protein;
                      log.date = entry.date;
                      log.localDate = entry.localDate;
                    });
                  });
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

  const promptManual = (barcode: string) => {
    setManualModalVisible(true);
    setManualForm(f => ({ ...f, barcode }));
  };

  const handleManualSubmit = async () => {
    const now = new Date();
    const localDate = now.toLocaleDateString('en-CA');
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
      date: now.toISOString(),
      localDate
    };
    await database.write(async () => {
      await database.get<Log>('logs').create(log => {
        log._raw.id = entry.id;
        log.name = entry.name;
        log.image = entry.image;
        log.barcode = entry.barcode;
        log.cost = entry.cost;
        log.weight = entry.weight;
        log.calories = entry.calories;
        log.fat = entry.fat;
        log.carbs = entry.carbs;
        log.protein = entry.protein;
        log.date = entry.date;
        log.localDate = entry.localDate;
      });
    });
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

  const groupLogsByDay = (logs: LogEntry[]) => {
    const grouped: { [date: string]: LogEntry[] } = {};
    logs.forEach(log => {
      const key = log.localDate || new Date(log.date).toLocaleDateString('en-CA');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    });
    return grouped;
  };

  const logsByDate = useMemo(() => {
    const grouped = groupLogsByDay(logs);
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
        <Image source={{ uri: item.image }} resizeMode="contain" style={styles.cardImage} />
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

  const handleEditSubmit = async () => {
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
      localDate: logs.find(l => l.id === editId)?.localDate || new Date().toLocaleDateString('en-CA'),
    };
    await database.write(async () => {
      const logCollection = database.get<Log>('logs');
      const log = await logCollection.find(editId);
      await log.update((entry: Log) => {
        entry.name = updated.name;
        entry.image = updated.image;
        entry.barcode = updated.barcode;
        entry.cost = updated.cost;
        entry.weight = updated.weight;
        entry.calories = updated.calories;
        entry.fat = updated.fat;
        entry.carbs = updated.carbs;
        entry.protein = updated.protein;
        entry.date = updated.date;
        entry.localDate = updated.localDate;
      });
    });
    dispatch<any>({ type: 'logs/setLogs', payload: logs.map(l => l.id === editId ? updated : l) });
    setEditModalVisible(false);
    setEditId(null);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await database.write(async () => {
            const logCollection = database.get<Log>('logs');
            const log = await logCollection.find(id);
            await log.destroyPermanently();
          });
          dispatch<any>({ type: 'logs/setLogs', payload: logs.filter(l => l.id !== id) });
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {/* Profile Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: Colors[colorScheme].card }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Enter Your Details</ThemedText>
            <View style={{ flexDirection: 'row', marginBottom: 10, gap: 10 }}>
              <Pressable
                style={{ flex: 1, backgroundColor: unitSystem === 'us' ? Colors[colorScheme].tint : Colors[colorScheme].card, borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors[colorScheme].tint }}
                onPress={() => setUnitSystem('us')}
              >
                <Text style={{ color: unitSystem === 'us' ? Colors[colorScheme].background : Colors[colorScheme].text, fontWeight: 'bold' }}>US Standard</Text>
              </Pressable>
              <Pressable
                style={{ flex: 1, backgroundColor: unitSystem === 'metric' ? Colors[colorScheme].tint : Colors[colorScheme].card, borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors[colorScheme].tint }}
                onPress={() => setUnitSystem('metric')}
              >
                <Text style={{ color: unitSystem === 'metric' ? Colors[colorScheme].background : Colors[colorScheme].text, fontWeight: 'bold' }}>Metric</Text>
              </Pressable>
            </View>
            <TextInput
              style={[styles.manualInput, { backgroundColor: Colors[colorScheme].background, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
              placeholder="Age"
              placeholderTextColor={Colors[colorScheme].icon}
              value={profileForm.age}
              onChangeText={v => setProfileForm(f => ({ ...f, age: v }))}
              keyboardType="number-pad"
            />
            {unitSystem === 'us' ? (
              <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                <TextInput
                  style={[styles.manualInput, { flex: 1, backgroundColor: Colors[colorScheme].background, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Height (ft)"
                  placeholderTextColor={Colors[colorScheme].icon}
                  value={profileForm.feet}
                  onChangeText={v => setProfileForm(f => ({ ...f, feet: v }))}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.manualInput, { flex: 1, backgroundColor: Colors[colorScheme].background, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Height (in)"
                  placeholderTextColor={Colors[colorScheme].icon}
                  value={profileForm.inches}
                  onChangeText={v => setProfileForm(f => ({ ...f, inches: v }))}
                  keyboardType="number-pad"
                />
              </View>
            ) : (
              <TextInput
                style={[styles.manualInput, { backgroundColor: Colors[colorScheme].background, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                placeholder="Height (cm)"
                placeholderTextColor={Colors[colorScheme].icon}
                value={profileForm.height}
                onChangeText={v => setProfileForm(f => ({ ...f, height: v }))}
                keyboardType="decimal-pad"
              />
            )}
            <TextInput
              style={[styles.manualInput, { backgroundColor: Colors[colorScheme].background, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
              placeholder={unitSystem === 'us' ? 'Weight (lbs)' : 'Weight (kg)'}
              placeholderTextColor={Colors[colorScheme].icon}
              value={profileForm.weight}
              onChangeText={v => setProfileForm(f => ({ ...f, weight: v }))}
              keyboardType="decimal-pad"
            />
            {bmi && (
              <View style={{ alignItems: 'center', marginVertical: 12 }}>
                <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: bmiColor }}>BMI: {bmi.toFixed(1)}</ThemedText>
                {bmi > 25 && (
                  <ThemedText style={{ color: '#f44336', marginTop: 4 }}>time to lock in and get the dream body!</ThemedText>
                )}
                <LineChart
                  data={{
                    labels: (userProfile?.bmiHistory || []).map(e => e.date.slice(5, 10)),
                    datasets: [
                      { data: (userProfile?.bmiHistory || []).map(e => e.bmi).concat(bmi) },
                    ],
                  }}
                  width={260}
                  height={120}
                  chartConfig={{
                    backgroundGradientFrom: Colors[colorScheme].card,
                    backgroundGradientTo: Colors[colorScheme].card,
                    color: () => bmiColor,
                    labelColor: () => Colors[colorScheme].text,
                    propsForDots: { r: '4', strokeWidth: '2', stroke: bmiColor },
                  }}
                  bezier
                  style={{ borderRadius: 12, marginTop: 8 }}
                />
              </View>
            )}
            <Pressable style={[styles.manualButton, { backgroundColor: Colors[colorScheme].tint, marginTop: 10 }]} onPress={handleProfileSubmit}>
              <Text style={{ color: Colors[colorScheme].background, fontWeight: 'bold' }}>Save</Text>
            </Pressable>
            <Text style={{ fontSize: 12, color: Colors[colorScheme].icon, marginTop: 16, textAlign: 'center' }}>
              No data is stored or sent anywhere. Everything is stored locally.
            </Text>
          </ThemedView>
        </View>
      </Modal>

      {/* Summary Section */}
      <ThemedView style={[styles.sectionContainer, {marginTop:20}]}>
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
        <View style={styles.timeFrameButtons}>
          {timeFrames.map((frame: TimeFrame) => (
            <Pressable
              key={frame}
              style={[
                styles.timeFrameButton,
                { backgroundColor: selectedTimeFrame === frame ? Colors[colorScheme].tint : Colors[colorScheme].card, borderColor:Colors[colorScheme].tint   }
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

      <ThemedView style={[styles.sectionContainer, {marginTop: 20}]}>
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

      <Collapsible title="View scanned foods">
        <ThemedView style={[styles.sectionContainer, {marginLeft: 0}]}>
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
      </Collapsible>

      {loadingProduct && <ActivityIndicator size="large" style={styles.activityIndicatorAbsolute} />}

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleScanned}
      />

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

      <FoodLogModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        onSubmit={handleManualSubmit}
        form={manualForm}
        setForm={setManualForm}
        isEdit={false}
        title="Add Food Manually"
      />
      <FoodLogModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleEditSubmit}
        form={editForm}
        setForm={setEditForm}
        isEdit={true}
        title="Edit Food Log"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionContainer: { marginLeft: 12 },
  summaryValues: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  summaryItem: { alignItems: 'center' },
  summaryAmount: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  timeFrameButtons: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 8 },
  timeFrameButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  timeFrameButtonText: { fontWeight: 'bold', fontSize: 14 },
  pillScroll: { marginBottom: 8 },
  datePill: { backgroundColor: undefined, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, alignItems: 'center', minWidth: 40, borderWidth: 1 },
  logListContent: { paddingVertical: 8, paddingLeft: 16, paddingRight: 4 },
  emptyLogText: { marginTop: 16, textAlign: 'center', opacity: 0.7 },
  logCard: { width: 160, marginRight: 12, marginBottom: 12 },
  cardImage: { width: '100%', height: 80, borderRadius: 8, marginBottom: 8, resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: 80, borderRadius: 8, backgroundColor: '#e0e0e0', marginBottom: 8 },
  cardTitle: { fontWeight: '600', marginBottom: 4, fontSize: 14 },
  cardText: { fontSize: 12, marginBottom: 2 },
  activityIndicatorAbsolute: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.1)' },
  fab: { position: 'absolute', bottom: 90, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabPressed: { opacity: 0.8 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  modalContent: { width: '85%', maxWidth: 400, borderRadius: 15, padding: 20, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6 },
  modalTitle: { marginBottom: 15, fontSize: 18, fontWeight: 'bold' },
  manualInput: { width: '95%', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 16 },
  manualButton: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, alignItems: 'center' },
  fabMenuContainer: { position: 'absolute', right: 30, bottom: 170, alignItems: 'flex-end', zIndex: 10 },
  fabMenuItem: { marginBottom: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  summaryMacrosRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8, marginTop: -8 },
  summaryMacroItem: { alignItems: 'center', minWidth: 70 },
  macroLabel: { fontSize: 12, opacity: 0.7 },
  macroValue: { fontSize: 14, fontWeight: 'bold' },
});