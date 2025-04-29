import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={styles.container}>
      <Ionicons name="person-circle" size={80} color={Colors[colorScheme].tint} />
      {/* <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Profile</Text> */}
      {/* <Text style={{ color: Colors[colorScheme].text, marginBottom: 24 }}>
        This is your local profile. All data is stored on your device.
      </Text> */}
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
    </View>
  );
}

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
});
