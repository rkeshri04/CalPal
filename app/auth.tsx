// import React, { useState } from 'react';
// import { View, TextInput, Button, Text, StyleSheet, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
// import { supabase } from '../supabaseClient';
// import { useRouter } from 'expo-router';
// import { useColorScheme } from '@/hooks/useColorScheme';
// import { Colors } from '@/constants/Colors';
// import { Ionicons } from '@expo/vector-icons';
// import { useDispatch, useSelector } from 'react-redux';
// import { login, restoreSession } from '@/store/authSlice';
// import { RootState } from '@/store';

// export default function AuthScreen() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [message, setMessage] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const router = useRouter();
//   const colorScheme = useColorScheme() ?? 'light';
//   const dispatch = useDispatch();
//   const auth = useSelector((state: RootState) => state.auth);

//   // Restore session on mount
//   React.useEffect(() => { dispatch<any>(restoreSession()); }, [dispatch]);

//   const handleAuth = async () => {
//     setLoading(true);
//     if (isSignUp) {
//       const result = await supabase.auth.signUp({ email, password });
//       setLoading(false);
//       if (result.error) {
//         Alert.alert('Sign Up Error', result.error.message);
//       } else {
//         Alert.alert('Check your email', 'Registration successful! Please check your email to verify your account before logging in.');
//       }
//       return;
//     } else {
//       dispatch<any>(login({ email, password }))
//         .unwrap()
//         .then(() => {
//           setLoading(false);
//           router.replace('/');
//         })
//         .catch((err: string) => {
//           setLoading(false);
//           Alert.alert('Login Error', err);
//         });
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       keyboardVerticalOffset={60}
//     >
//       <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}> 
//         <Text style={[styles.title, { color: Colors[colorScheme].text }]}>{isSignUp ? 'Sign Up' : 'Login'}</Text>
//         {message ? (
//           <Text style={[styles.message, { color: Colors[colorScheme].tint }]}>{message}</Text>
//         ) : (
//           <>
//             <TextInput
//               style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
//               placeholder="Email"
//               placeholderTextColor={Colors[colorScheme].icon}
//               autoCapitalize="none"
//               keyboardType="email-address"
//               value={email}
//               onChangeText={setEmail}
//             />
//             <View style={styles.passwordInputWrapper}>
//               <TextInput
//                 style={[styles.input, styles.passwordInput, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint }]}
//                 placeholder="Password"
//                 placeholderTextColor={Colors[colorScheme].icon}
//                 secureTextEntry={!showPassword}
//                 value={password}
//                 onChangeText={setPassword}
//               />
//               <Pressable
//                 style={styles.eyeButton}
//                 onPress={() => setShowPassword((v) => !v)}
//               >
//                 <Ionicons
//                   name={showPassword ? 'eye-off' : 'eye'}
//                   size={22}
//                   color={Colors[colorScheme].icon}
//                 />
//               </Pressable>
//             </View>
//             <Pressable
//               style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}
//               onPress={handleAuth}
//               disabled={loading}
//             >
//               <Text style={[styles.buttonText, { color: Colors[colorScheme].background }]}> 
//                 {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
//               </Text>
//             </Pressable>
//             <Text style={[styles.switchText, { color: Colors[colorScheme].tint }]} onPress={() => { setIsSignUp(!isSignUp); setMessage(''); }}>
//               {isSignUp ? 'Already have an account? Login' : "Don’t have an account? Sign Up"}
//             </Text>
//           </>
//         )}
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
//   title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
//   input: { width: '100%', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
//   button: { width: '100%', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
//   buttonText: { fontSize: 16, fontWeight: 'bold' },
//   switchText: { marginTop: 20, textAlign: 'center', fontSize: 15 },
//   message: { marginBottom: 20, fontSize: 16, textAlign: 'center', fontWeight: '500' },
//   passwordInputWrapper: {
//     position: 'relative',
//     width: '100%',
//   },
//   passwordInput: {
//     paddingRight: 50, // Add padding to the right to make space for the icon
//   },
//   eyeButton: {
//     position: 'absolute',
//     right: 10,
//     top: 10,
//   },
// });
