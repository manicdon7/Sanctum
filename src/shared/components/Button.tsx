import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { palette, lightColors } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { radius, hitSlop } from '@/core/theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize   = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
  fullWidth?: boolean;
}

const SIZE_CONFIG: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 8,  paddingHorizontal: 16, fontSize: fontSize.sm },
  md: { paddingVertical: 13, paddingHorizontal: 24, fontSize: fontSize.base },
  lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: fontSize.md },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  haptic = true,
  fullWidth = false,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sizeConfig = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;

  function handlePressIn() {
    scale.value = withTiming(0.96, { duration: 80 });
  }

  function handlePressOut() {
    scale.value = withTiming(1, { duration: 100 });
  }

  async function handlePress() {
    if (isDisabled) return;
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }

  const containerStyle = [
    styles.base,
    {
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
    },
    variant === 'primary'   && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost'     && styles.ghost,
    variant === 'danger'    && styles.danger,
    isDisabled              && styles.disabled,
    fullWidth               && { alignSelf: 'stretch' as const },
    style,
  ];

  const labelStyle = [
    styles.label,
    { fontSize: sizeConfig.fontSize },
    variant === 'primary'   && styles.labelPrimary,
    variant === 'secondary' && styles.labelSecondary,
    variant === 'ghost'     && styles.labelGhost,
    variant === 'danger'    && styles.labelDanger,
    isDisabled              && styles.labelDisabled,
    textStyle,
  ];

  return (
    <Animated.View style={[animStyle, fullWidth && { alignSelf: 'stretch' }]}>
      <TouchableOpacity
        style={containerStyle}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        hitSlop={hitSlop.sm}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? palette.white : palette.amber}
          />
        ) : (
          <Text style={labelStyle}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 44,
  },

  // Variants
  primary: {
    backgroundColor: palette.amber,
    borderColor: palette.amber,
    ...Platform.select({
      ios: { shadowColor: palette.amber, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: palette.amber,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: 'transparent',
    borderColor: palette.crisis,
  },
  disabled: {
    opacity: 0.45,
  },

  // Labels
  label: {
    fontFamily: fontFamilies.ui,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
  labelPrimary: {
    color: palette.white,
  },
  labelSecondary: {
    color: palette.amber,
  },
  labelGhost: {
    color: palette.amber,
  },
  labelDanger: {
    color: palette.crisis,
  },
  labelDisabled: {
    opacity: 0.7,
  },
});
