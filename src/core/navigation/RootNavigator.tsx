import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Easing } from 'react-native-reanimated';

import { useAppStore } from '@/core/stores/appStore';
import { LockScreen } from '@/features/room/LockScreen';
import { DecoyScreen } from '@/features/settings/DecoyScreen';
import { AppNavigator } from './AppNavigator';

export type RootStackParamList = {
  Lock: undefined;
  App: undefined;
  Decoy: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isUnlocked = useAppStore((s) => s.isUnlocked);
  const decoyActive = useAppStore((s) => s.decoyActive);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        {decoyActive ? (
          <Stack.Screen name="Decoy" component={DecoyScreen} />
        ) : !isUnlocked ? (
          <Stack.Screen name="Lock" component={LockScreen} />
        ) : (
          <Stack.Screen name="App" component={AppNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
