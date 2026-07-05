import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing } from '@/core/theme/spacing';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
        <Feather name={icon} size={28} color={colors.text.muted} />
      </View>
      <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.text.muted }]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="secondary"
            size="sm"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[8],
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.55,
  },
  actionWrap: {
    marginTop: spacing[5],
  },
});
