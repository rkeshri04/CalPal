import { Session } from '@supabase/supabase-js';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { store } from '@/store';

import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '../supabaseClient';
import { useRouter } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthChecked(true);
      if (!session) {
        router.replace('../auth'); // Use leading slash
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
      if (!session) {
        router.replace('../auth'); // Use leading slash
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || !authChecked) {
    return null;
  }

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Provider>
  );
}
