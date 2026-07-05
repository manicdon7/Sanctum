import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBiometric } from '@/shared/hooks/useBiometric';
import { useAppStore } from '@/core/stores/appStore';
import { deriveKey, storeKey, loadKey } from '@/core/encryption/keyDerivation';
import { Button } from '@/shared/components/Button';
import { palette } from '@/core/theme/colors';
import { fontFamilies, fontSize } from '@/core/theme/typography';
import { spacing, layout } from '@/core/theme/spacing';

const CREDENTIAL_SALT = 'sanctum_credential_v1';

type UnlockState = 'idle' | 'authenticating' | 'unlocking' | 'error';

export function LockScreen() {
  const { authenticate } = useBiometric();
  const unlock = useAppStore((s) => s.unlock);
  const biometricEnabled = useAppStore((s) => s.biometricEnabled);
  const insets = useSafeAreaInsets();

  const [unlockState, setUnlockState] = useState<UnlockState>('idle');
  const [failCount, setFailCount]     = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Animations
  const wordmarkOpacity   = useSharedValue(0);
  const wordmarkTranslateY = useSharedValue(12);
  const subtitleOpacity   = useSharedValue(0);
  const buttonOpacity     = useSharedValue(0);
  const glowScale         = useSharedValue(0.85);
  const glowOpacity       = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance
    wordmarkOpacity.value    = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    wordmarkTranslateY.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });

    subtitleOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    buttonOpacity.value   = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });

    // Ambient glow — slow pulse
    glowOpacity.value = withTiming(0.18, { duration: 1000 });
    glowScale.value   = withRepeat(
      withSequence(
        withTiming(1,    { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.82, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  useEffect(() => {
    // Auto-trigger biometric on mount
    handleUnlock();
  }, []);

  const handleUnlock = useCallback(async () => {
    if (unlockState === 'authenticating' || unlockState === 'unlocking') return;
    setUnlockState('authenticating');
    setErrorMessage('');

    if (!biometricEnabled) {
      setUnlockState('unlocking');
      try {
        let key = await loadKey();
        if (!key) {
          key = await deriveKey(CREDENTIAL_SALT);
          await storeKey(key);
        }
        unlock(key);
      } catch {
        setErrorMessage('Something went wrong. Please try again.');
        setUnlockState('error');
      }
      return;
    }

    const result = await authenticate('Unlock Sanctum — your private space');

    if (!result.success) {
      if (result.reason === 'cancelled') {
        setUnlockState('idle');
        return;
      }
      setFailCount((c) => c + 1);
      setErrorMessage('Try again');
      setUnlockState('error');
      return;
    }

    setUnlockState('unlocking');
    try {
      let key = await loadKey();
      if (!key) {
        key = await deriveKey(CREDENTIAL_SALT);
        await storeKey(key);
      }
      unlock(key);
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setUnlockState('error');
    }
  }, [unlockState, authenticate, unlock, biometricEnabled]);

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const isLoading = unlockState === 'authenticating' || unlockState === 'unlocking';

  const buttonLabel = !biometricEnabled
    ? (isLoading ? 'entering…' : 'enter sanctum')
    : (isLoading ? 'unlocking…' : 'unlock');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={palette.espresso} />

      {/* Ambient glow — warm amber bloom */}
      <Animated.View style={[styles.ambientGlow, glowStyle]} />

      <View style={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}>

        {/* Wordmark block */}
        <View style={styles.wordmarkBlock}>
          <Animated.Text style={[styles.wordmark, wordmarkStyle]}>
            Sanctum
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            your private space
          </Animated.Text>
        </View>

        {/* Spacer */}
        <View style={styles.flex} />

        {/* Error message */}
        {unlockState === 'error' && errorMessage ? (
          <Text style={styles.errorText}>
            {errorMessage}
            {failCount > 2 ? '\nUse your passcode if needed.' : ''}
          </Text>
        ) : null}

        {/* Unlock button */}
        <Animated.View style={[styles.buttonWrap, buttonStyle]}>
          <Button
            label={buttonLabel}
            onPress={handleUnlock}
            loading={isLoading}
            style={styles.unlockButton}
            textStyle={styles.unlockButtonText}
            variant="secondary"
            size="lg"
            fullWidth
          />
        </Animated.View>

        {/* Biometric hint */}
        <Text style={styles.hint}>
          {biometricEnabled
            ? (Platform.OS === 'ios' ? 'Face ID · Touch ID · Passcode' : 'Fingerprint · PIN')
            : 'tap to enter'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.espresso,
  },
  ambientGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: palette.amber,
    alignSelf: 'center',
    top: '18%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding + 8,
  },
  wordmarkBlock: {
    alignItems: 'center',
    gap: spacing[2],
  },
  wordmark: {
    fontFamily: fontFamilies.journal,
    fontSize: 56,
    fontWeight: '400',
    color: palette.inkLight,
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    color: palette.inkMutedLight,
    letterSpacing: 2,
    textTransform: 'lowercase',
    textAlign: 'center',
  },
  flex: { flex: 1 },
  errorText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    color: '#C48A8A',
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: fontSize.sm * 1.6,
  },
  buttonWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  unlockButton: {
    borderColor: `${palette.amber}55`,
    backgroundColor: `${palette.amber}14`,
  },
  unlockButtonText: {
    color: palette.amber,
    letterSpacing: 1,
  },
  hint: {
    fontFamily: fontFamilies.ui,
    fontSize: 11,
    color: palette.inkMutedLight,
    letterSpacing: 0.5,
    opacity: 0.45,
    marginTop: spacing[2],
    textAlign: 'center',
  },
});
