import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { palette } from '@/core/theme/colors';
import { typography, fontFamilies, fontSize } from '@/core/theme/typography';
import { spacing, radius } from '@/core/theme/spacing';
import { CRISIS_RESOURCES } from '@/core/constants/crisis';

interface CrisisCardProps {
  onDismiss: () => void;
}

/**
 * CrisisCard — surfaces immediately when distress patterns are detected.
 * This is the ONE place in Sanctum that interrupts without being asked.
 * Calm, not alarming. Prominent, not aggressive.
 * Uses the reserved crisis color (#C0392B family) — nowhere else in the app.
 */
export function CrisisCard({ onDismiss }: CrisisCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#2A1A1A' : '#FDF3F3' }]}>
      <View style={styles.header}>
        <Feather name="heart" size={16} color={palette.crisis} />
        <Text style={[styles.headerText, { color: palette.crisis }]}>
          you don't have to carry this alone
        </Text>
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={16} color={palette.inkMutedDark} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.body, { color: isDark ? palette.inkSecondaryLight : palette.inkSecondaryDark }]}>
        If something feels heavier than writing can reach, here are people trained to listen right now:
      </Text>

      {CRISIS_RESOURCES.slice(0, 3).map((resource) => (
        <TouchableOpacity
          key={resource.name}
          style={styles.resource}
          onPress={() => {
            if (resource.url) Linking.openURL(resource.url);
          }}
        >
          <Text style={[styles.resourceName, { color: isDark ? palette.inkLight : palette.inkDark }]}>
            {resource.name}
          </Text>
          {resource.number ? (
            <Text style={[styles.resourceNumber, { color: palette.crisis }]}>
              {resource.number}
            </Text>
          ) : null}
          <Text style={[styles.resourceAvailable, { color: isDark ? palette.inkMutedLight : palette.inkMutedDark }]}>
            {resource.available}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${palette.crisis}30`,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  headerText: {
    flex: 1,
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  body: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.65,
    marginBottom: spacing[3],
  },
  resource: {
    paddingVertical: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: `${palette.crisis}20`,
  },
  resourceName: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: 2,
  },
  resourceNumber: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  resourceAvailable: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
  },
});
