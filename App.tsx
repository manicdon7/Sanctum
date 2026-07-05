import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
} from '@expo-google-fonts/nunito-sans';
import {
  SourceSerif4_400Regular,
  SourceSerif4_600SemiBold,
} from '@expo-google-fonts/source-serif-4';
import * as ScreenCapture from 'expo-screen-capture';

import { RootNavigator } from '@/core/navigation/RootNavigator';
import { initDB } from '@/core/db/client';
import { useAppStore } from '@/core/stores/appStore';
import { palette } from '@/core/theme/colors';
import { ShakeDetector } from '@/shared/utils/ShakeDetector';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const decoyModeEnabled = useAppStore((s) => s.decoyModeEnabled);
  const setDecoyActive = useAppStore((s) => s.setDecoyActive);

  const [fontsLoaded] = useFonts({
    NunitoSans: NunitoSans_400Regular,
    NunitoSansMedium: NunitoSans_500Medium,
    NunitoSansSemibold: NunitoSans_600SemiBold,
    SourceSerif4: SourceSerif4_400Regular,
    SourceSerif4Semibold: SourceSerif4_600SemiBold,
  });

  useEffect(() => {
    // Initialize database on mount
    initDB()
      .then(() => setDbReady(true))
      .catch((e: Error) => {
        console.error('[Sanctum] DB init error:', e.message);
        setDbError(e.message);
        // Still mark ready — app should function even if DB init fails
        setDbReady(true);
      });
  }, []);

  // Accelerometer Shake Panic detection gesture
  useEffect(() => {
    if (decoyModeEnabled) {
      ShakeDetector.startListening(() => {
        setDecoyActive(true);
      });
    } else {
      ShakeDetector.stopListening();
    }
    return () => {
      ShakeDetector.stopListening();
    };
  }, [decoyModeEnabled]);

  // Screen capture prevention — applies globally when decoy mode is enabled
  // TODO: Manual test required on real Android device before shipping decoy mode
  // If recent-apps thumbnail still shows app content after this call, do NOT ship decoy mode
  useEffect(() => {
    if (decoyModeEnabled) {
      ScreenCapture.preventScreenCaptureAsync().catch((e) => {
        console.warn('[Sanctum] Screen capture prevention failed:', e);
      });
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    }
  }, [decoyModeEnabled]);

  // Non-blocking font fallback — app starts with system fonts if custom fonts fail
  const isReady = dbReady; // fonts failing is acceptable — don't block

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.amber} size="small" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: palette.espresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
