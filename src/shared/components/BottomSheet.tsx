import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { radius, spacing } from '@/core/theme/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Height as fraction of screen (0-1) or fixed dp */
  height?: number | `${number}%`;
  /** If true, tapping the backdrop closes the sheet */
  closeOnBackdrop?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  height = 0.6,
  closeOnBackdrop = true,
}: BottomSheetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const sheetHeight =
    typeof height === 'number' && height <= 1
      ? SCREEN_HEIGHT * height
      : typeof height === 'number'
      ? height
      : (SCREEN_HEIGHT * parseFloat(height)) / 100;

  const translateY = useSharedValue(sheetHeight + 100);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.8 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(sheetHeight + 100, { duration: 280, easing: Easing.in(Easing.cubic) });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={closeOnBackdrop ? onClose : undefined}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kvContainer}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              height: sheetHeight,
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Handle pill */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Title */}
          {title ? (
            <View style={[styles.titleRow, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.titleText, { color: colors.text.primary }]}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[styles.closeText, { color: colors.text.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kvContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  closeText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.base,
  },
});
