import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  StatusBar,
  Alert,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing, radius, layout, cardShadow } from '@/core/theme/spacing';
import { useVentStore, TAG_COLORS } from './ventStore';
import { useAppStore } from '@/core/stores/appStore';
import { EncryptionFooter } from '@/shared/components/EncryptionFooter';
import { EmptyState } from '@/shared/components/EmptyState';
import { CrisisCard } from '@/shared/components/CrisisCard';
import { detectCrisis } from '@/core/constants/crisis';

function formatDate(d: Date): string {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function VentCornerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const encryptionKey = useAppStore((s) => s.encryptionKey);
  const { entries, draft, draftTagColor, loadEntries, saveEntry, setDraft, setDraftTagColor, deleteEntry } =
    useVentStore();

  const [showCrisis, setShowCrisis] = useState(false);
  const [view, setView] = useState<'write' | 'entries'>('write');
  const crisisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveBtnOpacity = useSharedValue(0);
  const saveBtnTranslate = useSharedValue(8);

  useEffect(() => {
    loadEntries(encryptionKey);
  }, []);

  useEffect(() => {
    const hasContent = draft.trim().length > 0;
    saveBtnOpacity.value = withTiming(hasContent ? 1 : 0, { duration: 200 });
    saveBtnTranslate.value = withTiming(hasContent ? 0 : 8, { duration: 200 });
  }, [draft]);

  const handleTextChange = useCallback((text: string) => {
    setDraft(text);
    if (crisisTimer.current) clearTimeout(crisisTimer.current);
    crisisTimer.current = setTimeout(() => {
      if (detectCrisis(text)) setShowCrisis(true);
    }, 800);
  }, [setDraft]);

  const handleSave = useCallback(async () => {
    if (!draft.trim()) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveEntry(draft, draftTagColor, encryptionKey, 'vent');
    setView('entries');
  }, [draft, draftTagColor, encryptionKey, saveEntry]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteEntry(id);
        },
      },
    ]);
  }, [deleteEntry]);

  const saveBtnStyle = useAnimatedStyle(() => ({
    opacity: saveBtnOpacity.value,
    transform: [{ translateY: saveBtnTranslate.value }],
  }));

  const accentColor = palette.dustyBlue;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: accentColor }]}>Vent Corner</Text>

        {/* View toggle */}
        <View style={[styles.viewToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'write' && { backgroundColor: accentColor }]}
            onPress={() => setView('write')}
          >
            <Feather name="edit-2" size={14} color={view === 'write' ? palette.white : colors.text.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'entries' && { backgroundColor: accentColor }]}
            onPress={() => setView('entries')}
          >
            <Feather name="list" size={14} color={view === 'entries' ? palette.white : colors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {view === 'write' ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.writeArea, { paddingBottom: insets.bottom + 80 }]}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {showCrisis && <CrisisCard onDismiss={() => setShowCrisis(false)} />}

          {/* Writing space */}
          <TextInput
            style={[styles.textInput, { color: colors.text.primary }]}
            multiline
            placeholder="start wherever you are…"
            placeholderTextColor={colors.text.muted}
            value={draft}
            onChangeText={handleTextChange}
            textAlignVertical="top"
            scrollEnabled={false}
            selectionColor={`${accentColor}80`}
            autoCorrect
            autoCapitalize="sentences"
          />

          {/* Tag color dots */}
          <View style={styles.tagRow}>
            <Text style={[styles.tagLabel, { color: colors.text.muted }]}>tag</Text>
            {TAG_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.tagDot,
                  { backgroundColor: c },
                  draftTagColor === c && styles.tagDotActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDraftTagColor(c);
                }}
                accessibilityLabel={`Tag color ${c}`}
              />
            ))}
          </View>

          <EncryptionFooter />
        </ScrollView>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="feather"
              title="Nothing here yet"
              description="Your vents will appear here. Write whenever you need to."
              actionLabel="Write now"
              onAction={() => setView('write')}
            />
          }
          renderItem={({ item }) => (
            <VentEntryCard
              entry={item}
              colors={colors}
              isDark={isDark}
              onDelete={() => handleDelete(item.id)}
            />
          )}
        />
      )}

      {/* Floating save button */}
      {view === 'write' && (
        <Animated.View style={[styles.saveWrap, { bottom: insets.bottom + 20 }, saveBtnStyle]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accentColor }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Feather name="check" size={18} color={palette.white} />
            <Text style={styles.saveBtnText}>save</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

// ── Entry Card ────────────────────────────────────────────────────────────────

function VentEntryCard({
  entry,
  colors,
  isDark,
  onDelete,
}: {
  entry: { id: string; body: string; tagColor?: string | null; createdAt: Date };
  colors: typeof lightColors;
  isDark: boolean;
  onDelete: () => void;
}) {
  const tagColor = entry.tagColor ?? palette.dustyBlue;
  const preview = entry.body.slice(0, 180).replace(/\n+/g, ' ');

  return (
    <View
      style={[
        styles.entryCard,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
        cardShadow,
      ]}
    >
      {/* Tag accent */}
      <View style={[styles.entryAccent, { backgroundColor: tagColor }]} />

      <View style={styles.entryContent}>
        <Text style={[styles.entryBody, { color: colors.text.primary }]} numberOfLines={4}>
          {preview}
        </Text>
        <View style={styles.entryFooter}>
          <Text style={[styles.entryDate, { color: colors.text.muted }]}>
            {formatDate(entry.createdAt)}
          </Text>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="trash-2" size={14} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  toggleBtn: {
    padding: 8,
    borderRadius: 8,
  },

  // Write area
  writeArea: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[5],
  },
  textInput: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.75,
    minHeight: 280,
    textAlignVertical: 'top',
    marginBottom: spacing[5],
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing[4],
  },
  tagLabel: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
  },
  tagDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  tagDotActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.white,
  },

  // Save button
  saveWrap: {
    position: 'absolute',
    right: layout.screenPadding,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.full,
    ...Platform.select({
      ios: { shadowColor: palette.dustyBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  saveBtnText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: palette.white,
  },

  // Entries list
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
    gap: spacing[3],
  },
  entryCard: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  entryAccent: {
    width: 3,
  },
  entryContent: {
    flex: 1,
    padding: spacing[4],
  },
  entryBody: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.65,
    marginBottom: spacing[3],
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryDate: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
  },
});
