import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing, radius, layout, cardShadow } from '@/core/theme/spacing';
import { useAppStore } from '@/core/stores/appStore';
import { useLearningStore } from './learningStore';
import { RoomStackParamList } from '@/core/navigation/AppNavigator';
import { EmptyState } from '@/shared/components/EmptyState';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { Button } from '@/shared/components/Button';

type NavProp = NativeStackNavigationProp<RoomStackParamList, 'LearningNook'>;

export function LearningNookScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const encryptionKey = useAppStore((s) => s.encryptionKey);
  const { decks, streak, isLoading, loadDecks, createDeck, loadStreak } = useLearningStore();

  const [showAddDeck, setShowAddDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadDecks(encryptionKey);
    loadStreak();
  }, []);

  async function handleAddDeck() {
    if (!newDeckName.trim()) return;
    setIsCreating(true);
    try {
      await createDeck(newDeckName.trim(), encryptionKey);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewDeckName('');
      setNewDeckDesc('');
      setShowAddDeck(false);
    } catch {
      Alert.alert('Error', 'Could not create deck.');
    } finally {
      setIsCreating(false);
    }
  }

  const dueCount = 0; // dueCount not yet tracked in store
  const accentColor = palette.sage;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accentColor }]}>Learning Nook</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: accentColor }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddDeck(true);
          }}
        >
          <Feather name="plus" size={18} color={palette.white} />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: palette.amber }]}>🔥 {streak}</Text>
          <Text style={[styles.statLabel, { color: colors.text.muted }]}>day streak</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>{decks.length}</Text>
          <Text style={[styles.statLabel, { color: colors.text.muted }]}>decks</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: dueCount > 0 ? accentColor : colors.text.primary }]}>{dueCount}</Text>
          <Text style={[styles.statLabel, { color: colors.text.muted }]}>due today</Text>
        </View>
      </View>

      {/* Decks list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={accentColor} />
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="book-open"
              title="No decks yet"
              description="Create a flashcard deck to start building your knowledge."
              actionLabel="Create deck"
              onAction={() => setShowAddDeck(true)}
            />
          }
          renderItem={({ item }) => (
            <DeckCard
              deck={{ id: item.id, name: (item as any).name ?? '…', cardCount: 0, dueCount: 0 }}
              colors={colors}
              isDark={isDark}
              onPress={() => navigation.navigate('DecksList')}
              onReview={() => navigation.navigate('FlashcardReview', { deckId: item.id })}
            />
          )}
        />
      )}

      {/* Add deck sheet */}
      <BottomSheet visible={showAddDeck} onClose={() => setShowAddDeck(false)} title="New Deck" height={0.5}>
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetLabel, { color: colors.text.secondary }]}>Deck name</Text>
          <TextInput
            style={[styles.sheetInput, { backgroundColor: colors.inputBg, color: colors.text.primary, borderColor: colors.border }]}
            placeholder="e.g. Portuguese Vocabulary"
            placeholderTextColor={colors.text.muted}
            value={newDeckName}
            onChangeText={setNewDeckName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAddDeck}
          />
          <Button
            label={isCreating ? 'Creating…' : 'Create deck'}
            onPress={handleAddDeck}
            loading={isCreating}
            disabled={!newDeckName.trim() || isCreating}
            fullWidth
          />
        </View>
      </BottomSheet>
    </View>
  );
}

// ── Deck Card ─────────────────────────────────────────────────────────────────

function DeckCard({
  deck,
  colors,
  isDark,
  onPress,
  onReview,
}: {
  deck: { id: string; name: string; cardCount?: number; dueCount?: number };
  colors: typeof lightColors;
  isDark: boolean;
  onPress: () => void;
  onReview: () => void;
}) {
  const due = deck.dueCount ?? 0;
  const total = deck.cardCount ?? 0;
  const progress = total > 0 ? Math.min(1, (total - due) / total) : 0;

  return (
    <View style={[styles.deckCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
      {/* Top accent */}
      <View style={[styles.deckAccent, { backgroundColor: palette.sage }]} />

      <View style={styles.deckBody}>
        <View style={styles.deckHeaderRow}>
          <Text style={[styles.deckName, { color: colors.text.primary }]} numberOfLines={1}>{deck.name}</Text>
          {due > 0 && (
            <View style={[styles.dueBadge, { backgroundColor: `${palette.sage}22` }]}>
              <Text style={[styles.dueBadgeText, { color: palette.sage }]}>{due} due</Text>
            </View>
          )}
        </View>

        <Text style={[styles.deckMeta, { color: colors.text.muted }]}>{total} cards</Text>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
          <View style={[styles.progressFill, { backgroundColor: palette.sage, width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.deckActions}>
          <TouchableOpacity
            style={[styles.deckActionBtn, { borderColor: colors.border }]}
            onPress={onPress}
          >
            <Feather name="edit-2" size={13} color={colors.text.secondary} />
            <Text style={[styles.deckActionText, { color: colors.text.secondary }]}>manage</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deckActionBtn, styles.reviewBtn, { backgroundColor: palette.sage }]}
            onPress={onReview}
            disabled={due === 0}
          >
            <Feather name="zap" size={13} color={due > 0 ? palette.white : `${palette.white}60`} />
            <Text style={[styles.deckActionText, { color: due > 0 ? palette.white : `${palette.white}60` }]}>review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
    fontWeight: '400',
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fontFamilies.ui, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  statLabel: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs, marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28 },

  list: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
    gap: spacing[3],
  },

  deckCard: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...cardShadow,
  },
  deckAccent: { height: 3 },
  deckBody: { padding: spacing[4] },
  deckHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  deckName: { fontFamily: fontFamilies.ui, fontSize: fontSize.base, fontWeight: fontWeight.semibold, flex: 1 },
  dueBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  dueBadgeText: { fontFamily: fontFamilies.ui, fontSize: 11, fontWeight: fontWeight.medium },
  deckMeta: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs, marginBottom: spacing[3] },
  progressTrack: { height: 3, borderRadius: 2, marginBottom: spacing[3], overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  deckActions: { flexDirection: 'row', gap: spacing[2] },
  deckActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  reviewBtn: { borderWidth: 0 },
  deckActionText: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs, fontWeight: fontWeight.medium },

  sheetContent: { padding: layout.screenPadding, gap: spacing[3] },
  sheetLabel: { fontFamily: fontFamilies.ui, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  sheetInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.base,
  },
});
