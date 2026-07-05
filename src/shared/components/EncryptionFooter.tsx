import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { lightColors, darkColors } from '@/core/theme/colors';
import { typography, fontFamilies } from '@/core/theme/typography';
import { spacing } from '@/core/theme/spacing';

interface EncryptionFooterProps {
  style?: object;
}

/**
 * Persistent "encrypted on this device" footer bar.
 * Always visible on Vent Corner and Vault. Trust must be felt in
 * the moment of writing, not just promised in a settings screen.
 */
export function EncryptionFooter({ style }: EncryptionFooterProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: colors.border },
        style,
      ]}
    >
      <Feather name="lock" size={11} color={colors.text.muted} />
      <Text
        style={[
          styles.text,
          typography.caption,
          { fontFamily: fontFamilies.ui, color: colors.text.muted },
        ]}
      >
        encrypted on this device
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  text: {
    letterSpacing: 0.3,
  },
});
