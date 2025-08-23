import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { ThemedText } from '@/components/ThemedText';
import { saveUserProfileToStorage } from '@/store/userProfileSlice';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const userProfile = useSelector((state: RootState) => state.userProfile.profile);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [form, setForm] = React.useState({ age: '', height: '', weight: '', feet: '', inches: '' });
  const [unitSystem, setUnitSystem] = React.useState<'us' | 'metric'>(userProfile?.unitSystem || 'us');

  React.useEffect(() => {
    if (userProfile) {
      setUnitSystem(userProfile.unitSystem || 'us');
      setForm(f => ({
        ...f,
        age: userProfile.age.toString(),
        height: userProfile.unitSystem === 'metric' ? userProfile.height.toString() : '',
        weight: userProfile.unitSystem === 'metric' ? userProfile.weight.toString() : '',
        feet: userProfile.unitSystem === 'us' ? Math.floor(userProfile.height / 30.48).toString() : '',
        inches: userProfile.unitSystem === 'us' ? Math.round((userProfile.height / 2.54) % 12).toString() : '',
      }));
    }
  }, [userProfile]);

  // Convert height/weight for display
  let displayHeight = '';
  let displayWeight = '';
  if (userProfile) {
    if (userProfile.unitSystem === 'us') {
      const feet = Math.floor(userProfile.height / 30.48);
      const inches = Math.round((userProfile.height / 2.54) % 12);
      displayHeight = `${feet} ft ${inches} in`;
      displayWeight = `${(userProfile.weight / 0.453592).toFixed(1)} lbs`;
    } else {
      displayHeight = `${userProfile.height} cm`;
      displayWeight = `${userProfile.weight} kg`;
    }
  }

  // Redux
  const dispatch = useDispatch();
  const handleSave = () => {
    const age = parseInt(form.age);
    let height = 0;
    let weight = 0;
    if (unitSystem === 'us') {
      const feet = parseFloat(form.feet);
      const inches = parseFloat(form.inches);
      height = (feet * 12 + inches) * 2.54;
      weight = parseFloat(form.weight) * 0.453592;
    } else {
      height = parseFloat(form.height);
      weight = parseFloat(form.weight);
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
    dispatch<any>({ type: 'userProfile/setUserProfile', payload: newProfile });
    saveUserProfileToStorage(newProfile);
    setEditModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Ionicons name="person-circle" size={80} color={Colors[colorScheme].tint} />
      {/* <ThemedText type="title" style={{ marginTop: 12, color: Colors[colorScheme].text }}>Profile</ThemedText> */}
      {userProfile ? (
        <View style={{ marginTop: 18, marginBottom: 18, alignItems: 'center' }}>
          <ThemedText style={{ fontSize: 18 }}>Age: <ThemedText style={{ fontWeight: 'bold' }}>{userProfile.age}</ThemedText></ThemedText>
          <ThemedText style={{ fontSize: 18 }}>Height: <ThemedText style={{ fontWeight: 'bold' }}>{displayHeight}</ThemedText></ThemedText>
          <ThemedText style={{ fontSize: 18 }}>Weight: <ThemedText style={{ fontWeight: 'bold' }}>{displayWeight}</ThemedText></ThemedText>
          <ThemedText style={{ fontSize: 18 }}>BMI: <ThemedText style={{ fontWeight: 'bold' }}>{(userProfile.weight / ((userProfile.height / 100) * (userProfile.height / 100))).toFixed(1)}</ThemedText></ThemedText>
        </View>
      ) : (
        <ThemedText style={{ marginVertical: 18, color: Colors[colorScheme].icon }}>No profile data found.</ThemedText>
      )}
      <Pressable style={{ marginBottom: 10, backgroundColor: Colors[colorScheme].tint, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }} onPress={() => setEditModalVisible(true)}>
        <Text style={{ color: Colors[colorScheme].background, fontWeight: 'bold', fontSize: 16 }}>Edit</Text>
      </Pressable>
      <View style={styles.settingsList}>
        <Pressable style={[styles.settingsItem, { backgroundColor: Colors[colorScheme].card }]} onPress={() => {}}>
          <Ionicons name="settings-outline" size={22} color={Colors[colorScheme].tint} style={{ marginRight: 16 }} />
          <Text style={{ color: Colors[colorScheme].text, fontSize: 16 }}>App Settings</Text>
        </Pressable>
        <Pressable style={[styles.settingsItem, { backgroundColor: Colors[colorScheme].card }]} onPress={() => {}}>
          <Ionicons name="trash-outline" size={22} color={Colors[colorScheme].tint} style={{ marginRight: 16 }} />
          <Text style={{ color: Colors[colorScheme].text, fontSize: 16 }}>Clear All Data</Text>
        </Pressable>
      </View>
      
      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].card }]}> 
            <ThemedText type="subtitle" style={styles.modalTitle}>Edit Your Details</ThemedText>
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
              value={form.age}
              onChangeText={v => setForm(f => ({ ...f, age: v }))}
              keyboardType="number-pad"
            />
            {unitSystem === 'us' ? (
              <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                <TextInput
                  style={[styles.manualInput, { flex: 1, backgroundColor: Colors[colorScheme].background, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Height (ft)"
                  placeholderTextColor={Colors[colorScheme].icon}
                  value={form.feet}
                  onChangeText={v => setForm(f => ({ ...f, feet: v }))}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.manualInput, { flex: 1, backgroundColor: Colors[colorScheme].background, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                  placeholder="Height (in)"
                  placeholderTextColor={Colors[colorScheme].icon}
                  value={form.inches}
                  onChangeText={v => setForm(f => ({ ...f, inches: v }))}
                  keyboardType="number-pad"
                />
              </View>
            ) : (
              <TextInput
                style={[styles.manualInput, { backgroundColor: Colors[colorScheme].background, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
                placeholder="Height (cm)"
                placeholderTextColor={Colors[colorScheme].icon}
                value={form.height}
                onChangeText={v => setForm(f => ({ ...f, height: v }))}
                keyboardType="decimal-pad"
              />
            )}
            <TextInput
              style={[styles.manualInput, { backgroundColor: Colors[colorScheme].background, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
              placeholder={unitSystem === 'us' ? 'Weight (lbs)' : 'Weight (kg)'}
              placeholderTextColor={Colors[colorScheme].icon}
              value={form.weight}
              onChangeText={v => setForm(f => ({ ...f, weight: v }))}
              keyboardType="decimal-pad"
            />
            <Pressable style={[styles.manualButton, { backgroundColor: Colors[colorScheme].tint, marginTop: 10 }]} onPress={handleSave}>
              <Text style={{ color: Colors[colorScheme].background, fontWeight: 'bold' }}>Save</Text>
            </Pressable>
            <Pressable style={[styles.manualButton, { backgroundColor: Colors[colorScheme].tabIconDefault, marginTop: 10 }]} onPress={() => setEditModalVisible(false)}>
              <Text style={{ color: Colors[colorScheme].text }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// Add modal styles for overlay and content
const styles = StyleSheet.create({
  container: { flex: 1,alignItems: 'center', padding: 24 },
  settingsList: { width: '100%', marginTop: 24 },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
  manualInput: {
    width: '95%',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  manualButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
  },
});
