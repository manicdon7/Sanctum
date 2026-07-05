// Biometric Authentication Screen
// Simple biometric unlock screen

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../core/theme/useTheme';
import { useAppStore } from '../../core/stores/useAppStore';
import { display, ui } from '../../core/theme/typography';
import { spacing } from '../../core/theme/spacing';
import { RootStackParamList } from '../../core/navigation/routes';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export function BiometricAuthScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { setAuthenticated } = useAppStore();

  useEffect(() => {
    // Auto-authenticate on screen load
    authenticateWithBiometrics();
  }, []);

  const authenticateWithBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback to no authentication
        handleAuthSuccess();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Sanctum',
        subtitle: 'Use your biometric to access your room',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        handleAuthSuccess();
      } else {
        if (result.error === 'user_cancel') {
          // User cancelled - stay on auth screen
          return;
        }
        
        // Authentication failed
        Alert.alert(
          'Authentication Failed',
          'Please try again or use your device passcode.',
          [
            { text: 'Retry', onPress: authenticateWithBiometrics },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      // Fallback to allowing access
      handleAuthSuccess();
    }
  };

  const handleAuthSuccess = () => {
    setAuthenticated(true);
    navigation.navigate('MainTabs');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_base }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg_base} />
      
      <View style={styles.content}>
        <Text style={[
          styles.title,
          display.lg,
          { color: colors.text_primary },
        ]}>
          Welcome back
        </Text>
        
        <Text style={[
          styles.subtitle,
          ui.body,
          { color: colors.text_secondary },
        ]}>
          Use biometrics to unlock your room
        </Text>
        
        <TouchableOpacity
          onPress={authenticateWithBiometrics}
          style={[
            styles.unlockButton,
            { backgroundColor: colors.accent },
          ]}
        >
          <Text style={[
            styles.unlockButtonText,
            ui.button,
            { color: colors.bg_base },
          ]}>
            Unlock
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl * 2,
  },
  unlockButton: {
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    borderRadius: 24,
    minWidth: 120,
  },
  unlockButtonText: {
    textAlign: 'center',
  },
});