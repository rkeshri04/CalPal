import React from 'react';
import { Modal, KeyboardAvoidingView, Platform, Animated, View, Pressable, Text, ScrollView, Image, TextInput } from 'react-native';
import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

interface FoodLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: any;
  setForm: (f: any) => void;
  isEdit?: boolean;
  title: string;
}

export const FoodLogModal: React.FC<FoodLogModalProps> = ({ visible, onClose, onSubmit, form, setForm, isEdit, title }) => {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end', margin: 0 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Animated.View style={{ backgroundColor: Colors[colorScheme].background, borderTopLeftRadius: 18, borderTopRightRadius: 18, minHeight: 480, maxHeight: '90%', padding: 20, alignItems: 'center', elevation: 10, width: '100%' }}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: '#ccc', marginBottom: 10 }} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors[colorScheme].tint }}>{title}</Text>
            </View>
            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              {form.image ? (
                <Image source={{ uri: form.image }} style={{ width: 120, height: 120, borderRadius: 12, marginBottom: 12, marginTop: 4 }} />
              ) : null}
              <TextInput style={{ width: '95%', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 16, backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }}
                placeholder="Name*" placeholderTextColor={Colors[colorScheme].icon} value={form.name} onChangeText={(v: string) => setForm((f: any) => ({ ...f, name: v }))} />
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '95%', marginBottom: 4 }}>
                <MaterialCommunityIcons name="currency-usd" size={22} color={Colors[colorScheme].tint} style={{ marginLeft: 2 }} />
                <TextInput style={{ flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 16, marginLeft: 8, backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }}
                  placeholder="Cost*" placeholderTextColor={Colors[colorScheme].icon} value={form.cost} onChangeText={(v: string) => setForm((f: any) => ({ ...f, cost: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '95%', marginBottom: 4 }}>
                <MaterialCommunityIcons name="weight-gram" size={22} color={Colors[colorScheme].tint} style={{ marginLeft: 2 }} />
                <TextInput style={{ flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 16, marginLeft: 8, backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }}
                  placeholder="Weight (g)*" placeholderTextColor={Colors[colorScheme].icon} value={form.weight} onChangeText={(v: string) => setForm((f: any) => ({ ...f, weight: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '95%', marginBottom: 4 }}>
                <MaterialCommunityIcons name="fire" size={22} color={Colors[colorScheme].tint} style={{ marginLeft: 2 }} />
                <TextInput style={{ flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 16, marginLeft: 8, backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }}
                  placeholder="Calories" placeholderTextColor={Colors[colorScheme].icon} value={form.calories} onChangeText={(v: string) => setForm((f: any) => ({ ...f, calories: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '95%', marginBottom: 4 }}>
                <MaterialCommunityIcons name="food-drumstick" size={22} color={Colors[colorScheme].tint} style={{ marginLeft: 2 }} />
                <TextInput style={{ flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 16, marginLeft: 8, backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }}
                  placeholder="Protein (g)" placeholderTextColor={Colors[colorScheme].icon} value={form.protein} onChangeText={(v: string) => setForm((f: any) => ({ ...f, protein: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '95%', marginBottom: 4 }}>
                <MaterialCommunityIcons name="bread-slice" size={22} color={Colors[colorScheme].tint} style={{ marginLeft: 2 }} />
                <TextInput style={{ flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 16, marginLeft: 8, backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }}
                  placeholder="Carbs (g)" placeholderTextColor={Colors[colorScheme].icon} value={form.carbs} onChangeText={(v: string) => setForm((f: any) => ({ ...f, carbs: v }))} keyboardType="decimal-pad" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '95%', marginBottom: 4 }}>
                <MaterialCommunityIcons name="water" size={22} color={Colors[colorScheme].tint} style={{ marginLeft: 2 }} />
                <TextInput style={{ flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 16, marginLeft: 8, backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }}
                  placeholder="Fat (g)" placeholderTextColor={Colors[colorScheme].icon} value={form.fat} onChangeText={(v: string) => setForm((f: any) => ({ ...f, fat: v }))} keyboardType="decimal-pad" />
              </View>
            </ScrollView>
            <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'center' }}>
              <Pressable style={{ paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, alignItems: 'center', backgroundColor: Colors[colorScheme].tabIconDefault }} onPress={onClose}>
                <Text style={{ color: Colors[colorScheme].text }}>Cancel</Text>
              </Pressable>
              <Pressable style={{ paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, alignItems: 'center', backgroundColor: Colors[colorScheme].tint, marginLeft: 12 }} onPress={onSubmit}>
                <Text style={{ color: Colors[colorScheme].background, fontWeight: 'bold' }}>{isEdit ? 'Save' : 'Add'}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};
