import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { lightColors, darkColors } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { layout, hitSlop } from '@/core/theme/spacing';

interface HeaderProps {
  title: string;
  /** Show back chevron and pop navigation on press */
  showBack?: boolean;
  /** Tint color for the title and icon (defaults to theme primary) */
  accentColor?: string;
  /** Right-side action */
  rightAction?: {
    icon: keyof typeof Feather.glyphMap;
    onPress: () => void;
    accessibilityLabel: string;
  };
  /** Called when back is pressed instead of default navigation.goBack() */
  onBack?: () => void;
  /** Additional bottom padding (e.g. when no border below) */
  bottomPad?: number;
}

export function Header({
  title,
  showBack = false,
  accentColor,
  rightAction,
  onBack,
  bottomPad = 0,
}: HeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const titleColor = accentColor ?? colors.text.primary;
  const iconColor  = accentColor ?? colors.text.secondary;

  function handleBack() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          paddingBottom: 12 + bottomPad,
          borderBottomColor: colors.divider,
          backgroundColor: colors.background,
        },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Left — back button */}
      <View style={styles.side}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleBack}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="chevron-left" size={24} color={iconColor} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Centre — title */}
      <Text
        style={[styles.title, { color: titleColor }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Right — action */}
      <View style={[styles.side, styles.sideRight]}>
        {rightAction ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              rightAction.onPress();
            }}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel={rightAction.accessibilityLabel}
          >
            <Feather name={rightAction.icon} size={20} color={iconColor} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  iconBtn: {
    padding: 4,
  },
});
