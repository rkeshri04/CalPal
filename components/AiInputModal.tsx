import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Pressable, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface AiInputModalProps {
  visible: boolean;
  text: string;
  setText: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

const AiInputModal: React.FC<AiInputModalProps> = ({ visible, text, setText, loading, onSubmit, onClose }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const inputRef = useRef<TextInput | null>(null);
  const [hasFocusedOnce, setHasFocusedOnce] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSubmit = () => {
    if (!text.trim() || loading) return;
    onSubmit();
  };

  // Auto-focus only the first time the modal is opened
  useEffect(() => {
    if (visible && !hasFocusedOnce && inputRef.current) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setHasFocusedOnce(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, hasFocusedOnce]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom + 150, 110) }]}
        >
          <Pressable
            style={[styles.inputContainer, { borderColor: Colors[colorScheme].tint, backgroundColor: Colors[colorScheme].card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: Colors[colorScheme].text }]}
              placeholder="Tell the AI what you ate..."
              placeholderTextColor={Colors[colorScheme].icon}
              value={text}
              onChangeText={setText}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              style={[styles.sendButton, { backgroundColor: text.trim() && !loading ? Colors[colorScheme].tint : Colors[colorScheme].tabIconDefault }]}
              onPress={handleSubmit}
              disabled={!text.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors[colorScheme].background} />
              ) : (
                <Ionicons name="send" size={18} color={Colors[colorScheme].background} />
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  wrapper: {
    paddingHorizontal: 12,
    // paddingBottom is now dynamic based on safe area insets
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  sendButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AiInputModal;
