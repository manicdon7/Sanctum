import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Lora_400Regular,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import { RootNavigator } from './src/core/navigation/RootNavigator';
import { palette } from './src/core/theme/colors';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    // Simple initialization - add database setup later
    setTimeout(() => {
      setIsReady(true);
    }, 1000);
  }, []);

  // Allow app to start with system fonts if custom fonts fail
  const canStart = isReady;

  if (!canStart) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.dark.accent} size="small" />
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
    backgroundColor: palette.dark.bg_base,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
