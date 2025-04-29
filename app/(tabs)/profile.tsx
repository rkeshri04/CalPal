import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { supabase } from '../../supabaseClient';

const SETTINGS = [
  { label: 'Account Settings', icon: 'settings-outline', onPress: () => {} },
  { label: 'Privacy Policy', icon: 'shield-checkmark-outline', onPress: () => Linking.openURL('https://your-privacy-policy-url.com') },
  { label: 'Terms of Service', icon: 'document-text-outline', onPress: () => Linking.openURL('https://your-terms-url.com') },
  { label: 'Support', icon: 'help-circle-outline', onPress: () => Linking.openURL('mailto:support@example.com') },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); } },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Ionicons name="person-circle" size={80} color={Colors[colorScheme].tint} style={{ marginBottom: 16 }} />
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Profile</Text>
      {email && <Text style={{ color: Colors[colorScheme].text, marginBottom: 24 }}>{email}</Text>}
      <View style={styles.settingsList}>
        {SETTINGS.map((item) => (
          <Pressable key={item.label} style={[styles.settingsItem, { backgroundColor: Colors[colorScheme].card }]} onPress={item.onPress}>
            <Ionicons name={item.icon as any} size={22} color={Colors[colorScheme].tint} style={{ marginRight: 16 }} />
            <Text style={{ color: Colors[colorScheme].text, fontSize: 16 }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={[styles.logoutButton, { backgroundColor: Colors[colorScheme].tint }]} onPress={handleLogout}>
        <Text style={{ color: Colors[colorScheme].background, fontWeight: 'bold' }}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  settingsList: { width: '100%', marginBottom: 24 },
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
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
});
