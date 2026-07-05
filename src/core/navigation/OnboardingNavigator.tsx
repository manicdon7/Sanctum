// Onboarding Navigator
// Three-screen onboarding flow as specified

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingWelcomeScreen } from '../../features/onboarding/OnboardingWelcomeScreen';
import { OnboardingNameScreen } from '../../features/onboarding/OnboardingNameScreen';
import { OnboardingJulietScreen } from '../../features/onboarding/OnboardingJulietScreen';
import { type OnboardingStackParamList } from './routes';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'fade',
        animationDuration: 350,
      }}
    >
      <Stack.Screen 
        name="OnboardingWelcome" 
        component={OnboardingWelcomeScreen} 
      />
      <Stack.Screen 
        name="OnboardingName" 
        component={OnboardingNameScreen} 
      />
      <Stack.Screen 
        name="OnboardingJuliet" 
        component={OnboardingJulietScreen} 
      />
    </Stack.Navigator>
  );
}