import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { MenuProvider } from 'react-native-popup-menu';

import { useColorScheme } from '@/hooks/useColorScheme';

import { database, Log, UserProfile } from '../db/database';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const logsCollection = database.collections.get<Log>('logs');
  //       const allLogs = await logsCollection.query().fetch();

  //       const userProfilesCollection = database.collections.get<UserProfile>('user_profiles');
  //       const allProfiles = await userProfilesCollection.query().fetch();

  //       // Extract raw values for logging
  //       const logsData = allLogs.map(log => log._raw);
  //       const profilesData = allProfiles.map(profile => profile._raw);

  //       console.log('The user ate:', logsData);
  //       console.log('User Profiles:', profilesData);
  //     } catch (error) {
  //       console.error('Error querying WatermelonDB:', error);
  //     }
  //   })();
  // }, []);


  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <MenuProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </MenuProvider>
    </Provider>
  );
}
