// Custom Tab Bar
// Minimal 4-tab bar with phosphor icons only, no labels

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, ChatCircleDots, MusicNote, Gear } from 'phosphor-react-native';

import { useTheme } from '../theme/useTheme';
import { spacing } from '../theme/spacing';

const iconMap = {
  Room: House,
  Juliet: ChatCircleDots,
  Sounds: MusicNote,
  Settings: Gear,
} as const;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.tabBar,
      { 
        backgroundColor: colors.bg_elevated,
        borderTopColor: colors.divider,
        paddingBottom: insets.bottom,
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || route.name;
        const isFocused = state.index === index;

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

        const IconComponent = iconMap[route.name as keyof typeof iconMap];
        
        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            <IconComponent
              size={22}
              weight="regular" // Always outline weight as specified
              color={isFocused ? colors.accent : colors.text_ghost}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 0.5,
    // No shadow above it — just a divider line as specified
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
});