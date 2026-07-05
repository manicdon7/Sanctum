import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { hitSlop } from '@/core/theme/spacing';

type TabName = 'Room' | 'Growth' | 'Vault' | 'Settings';

const TAB_CONFIG: Record<TabName, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  Room:     { icon: 'home',    label: 'Room'     },
  Growth:   { icon: 'sun',     label: 'Growth'   },
  Vault:    { icon: 'lock',    label: 'Vault'    },
  Settings: { icon: 'sliders', label: 'Settings' },
};

interface TabItemProps {
  name: TabName;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  activeColor: string;
  inactiveColor: string;
  isDark: boolean;
  surfaceColor: string;
}

function TabItem({
  name,
  isFocused,
  onPress,
  onLongPress,
  activeColor,
  inactiveColor,
  isDark,
  surfaceColor,
}: TabItemProps) {
  const config = TAB_CONFIG[name];
  const scale = useSharedValue(1);
  const pillScale = useSharedValue(isFocused ? 1 : 0);
  const pillOpacity = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    pillScale.value = withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 200 });
    pillOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 150 });
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
    opacity: pillOpacity.value,
  }));

  function handlePress() {
    scale.value = withSpring(0.82, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={1}
      hitSlop={hitSlop.sm}
      accessibilityRole="tab"
      accessibilityLabel={config.label}
      accessibilityState={{ selected: isFocused }}
    >
      {/* Active pill background */}
      <Animated.View
        style={[
          styles.activePill,
          pillStyle,
          { backgroundColor: isDark ? 'rgba(212,144,58,0.15)' : 'rgba(212,144,58,0.12)' },
        ]}
      />

      <Animated.View style={iconStyle}>
        <Feather
          name={config.icon}
          size={22}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={isFocused ? 2 : 1.5}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const bottom = Math.max(insets.bottom + 8, 16);

  return (
    <View
      style={[
        styles.container,
        {
          bottom,
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: '#1A1714',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 20,
            },
            android: { elevation: 8 },
          }),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tabName = route.name as TabName;

        if (!TAB_CONFIG[tabName]) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TabItem
            key={route.key}
            name={tabName}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            activeColor={palette.amber}
            inactiveColor={colors.text.muted}
            isDark={isDark}
            surfaceColor={colors.surfaceRaised}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    width: 44,
    height: 36,
    borderRadius: 18,
  },
});
