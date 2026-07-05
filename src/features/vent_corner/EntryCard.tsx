import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { lightColors, darkColors } from '@/core/theme/colors';
import { typography, fontFamilies, fontSize } from '@/core/theme/typography';
import { spacing, radius } from '@/core/theme/spacing';
import { durations } from '@/core/theme/animations';
import { TAG_COLORS } from './ventStore';

interface DecryptedEntry {
  id: string;
  body: string;
  tagColor: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EntryCardProps {
  entry: DecryptedEntry;
  onDelete: () => void;
  onChangeTagColor: (color: string) => void;
}

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function EntryCard({ entry, onDelete, onChangeTagColor }: EntryCardProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const [showActions, setShowActions] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const actionsHeight = useSharedValue(0);
  const actionsOpacity = useSharedValue(0);

  const isOld = Date.now() - entry.createdAt.getTime() > SIXTY_DAYS_MS;
  const tagColor = entry.tagColor ?? colors.rooms.vent;

  const toggleActions = () => {
    const next = !showActions;
    setShowActions(next);
    actionsHeight.value = withTiming(next ? 44 : 0, { duration: durations.normal });
    actionsOpacity.value = withTiming(next ? 1 : 0, { duration: durations.normal });
  };

  const actionsStyle = useAnimatedStyle(() => ({
    height: actionsHeight.value,
    opacity: actionsOpacity.value,
    overflow: 'hidden',
  }));

  return (
    <TouchableOpacity
      onLongPress={toggleActions}
      activeOpacity={0.95}
      delayLongPress={400}
    >
      <View
        className={`flex-row rounded-2xl border border-black/10 dark:border-white/10 mb-3 overflow-hidden ${
          isOld ? 'opacity-60' : 'opacity-100'
        }`}
      >
        {/* Native Blur Layer */}
        <BlurView
          intensity={30}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.45)',
            },
          ]}
        />
        {/* Left accent bar */}
        <View style={{ backgroundColor: tagColor }} className="w-1" />

        <View className="flex-1 p-4">
          {/* Entry text preview */}
          <Text
            style={[
              styles.bodyText,
              { color: colors.text.primary },
            ]}
            numberOfLines={3}
          >
            {entry.body}
          </Text>

          {/* Timestamp */}
          <Text style={[styles.timestamp, { color: colors.text.muted }]}>
            {formatRelativeTime(entry.createdAt)}
          </Text>

          {/* Long-press actions — No swipe-to-delete to avoid accidental trigger */}
          <Animated.View style={actionsStyle}>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setShowColorPicker(!showColorPicker);
                }}
              >
                <Text style={[styles.actionText, { color: tagColor }]}>color</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
                <Text style={[styles.actionText, { color: colors.text.muted }]}>remove</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Color picker */}
          {showColorPicker && (
            <View style={styles.colorPicker}>
              {TAG_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    color === tagColor && styles.colorSwatchSelected,
                  ]}
                  onPress={() => {
                    onChangeTagColor(color);
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  bodyText: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.65,
    marginBottom: spacing[2],
  },
  timestamp: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[4],
    paddingTop: spacing[2],
    marginTop: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  actionBtn: {
    paddingVertical: spacing[1],
  },
  actionText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingTop: spacing[2],
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
