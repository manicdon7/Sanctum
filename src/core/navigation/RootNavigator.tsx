// Root Navigator
// Handles authentication flow and main app navigation

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { useAppStore } from '../stores/useAppStore';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { BiometricAuthScreen } from '../../features/auth/BiometricAuthScreen';
import { routes, type RootStackParamList } from './routes';
import { useTheme } from '../theme/useTheme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors } = useTheme();
  const { onboardingCompleted, isAuthenticated, biometricEnabled } = useAppStore();

  // Determine initial route
  const getInitialRouteName = (): keyof RootStackParamList => {
    if (!onboardingCompleted) {
      return 'Onboarding';
    }
    
    if (biometricEnabled && !isAuthenticated) {
      return 'BiometricAuth';
    }
    
    return 'MainTabs';
  };

  const navigationTheme = {
    dark: true,
    colors: {
      primary: colors.accent,
      background: colors.bg_base,
      card: colors.bg_surface,
      text: colors.text_primary,
      border: colors.divider,
      notification: colors.danger,
    },
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.bg_base} />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          initialRouteName={getInitialRouteName()}
          screenOptions={{
            headerShown: false,
            gestureEnabled: false, // Disable swipe back
            animation: 'fade', // Global fade transition as specified
            animationDuration: 350,
          }}
        >
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingNavigator} 
          />
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabNavigator} 
          />
          <Stack.Screen 
            name="BiometricAuth" 
            component={BiometricAuthScreen}
            options={{
              gestureEnabled: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}