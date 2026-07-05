import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
  TouchableOpacity,
} from 'react-native';

import { radius, cardShadow } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  /** Explicit background color — use theme.surface / theme.surfaceRaised */
  backgroundColor?: string;
  /** Border color — use theme.border */
  borderColor?: string;
  padding?: number;
  borderRadius?: number;
  /** If true, renders as a pressable card with scale feedback */
  pressable?: boolean;
}

export function Card({
  children,
  style,
  onPress,
  backgroundColor = palette.warmSurfaceRaised,
  borderColor = palette.lightBorder,
  padding = 16,
  borderRadius = radius.lg,
  pressable = false,
}: CardProps) {
  const containerStyle: ViewStyle = {
    backgroundColor,
    borderColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius,
    padding,
    ...cardShadow,

  };

  if (pressable || onPress) {
    return (
      <TouchableOpacity
        style={[containerStyle, style]}
        onPress={onPress}
        activeOpacity={0.75}
        accessible
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({});
