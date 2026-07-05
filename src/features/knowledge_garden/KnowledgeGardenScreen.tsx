import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing, radius, layout, cardShadow } from '@/core/theme/spacing';
import { useKnowledgeStore } from './knowledgeStore';
import { useAppStore } from '@/core/stores/appStore';
import { RoomStackParamList } from '@/core/navigation/AppNavigator';
import { EmptyState } from '@/shared/components/EmptyState';

type NavProp = NativeStackNavigationProp<RoomStackParamList, 'KnowledgeGarden'>;

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function KnowledgeGardenScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const encryptionKey = useAppStore((s) => s.encryptionKey);
  const { notes, isLoading, loadNotes, deleteNote } = useKnowledgeStore();

  const [search, setSearch] = useState('');

  useEffect(() => { loadNotes(encryptionKey); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
    );
  }, [notes, search]);

  const accentColor = palette.deepMoss;

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
        <Text style={[styles.headerTitle, { color: accentColor }]}>Knowledge Garden</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: accentColor }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('NoteEditor', {});
          }}
        >
          <Feather name="plus" size={18} color={palette.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.text.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search notes…"
          placeholderTextColor={colors.text.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={14} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Note count */}
      <Text style={[styles.countLabel, { color: colors.text.muted }]}>
        {filtered.length} {filtered.length === 1 ? 'note' : 'notes'}
      </Text>

      {/* Notes list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="feather"
            title={search ? 'No matching notes' : 'Garden is empty'}
            description={search ? 'Try a different search term.' : 'Create your first note — ideas, thoughts, anything.'}
            actionLabel={!search ? 'Create note' : undefined}
            onAction={!search ? () => navigation.navigate('NoteEditor', {}) : undefined}
          />
        }
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            colors={colors}
            isDark={isDark}
            onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
            onDelete={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              await deleteNote(item.id);
            }}
          />
        )}
      />
    </View>
  );
}

// ── Note Card ─────────────────────────────────────────────────────────────────

function NoteCard({
  note,
  colors,
  isDark,
  onPress,
  onDelete,
}: {
  note: { id: string; title: string; body: string; tags?: string[]; createdAt: Date };
  colors: typeof lightColors;
  isDark: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const excerpt = note.body.slice(0, 150).replace(/\n+/g, ' ');

  return (
    <TouchableOpacity
      style={[styles.noteCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Green left accent */}
      <View style={[styles.noteAccent, { backgroundColor: palette.deepMoss }]} />

      <View style={styles.noteBody}>
        <View style={styles.noteHeader}>
          <Text style={[styles.noteTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {note.title || 'Untitled'}
          </Text>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={14} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {excerpt ? (
          <Text style={[styles.noteExcerpt, { color: colors.text.secondary }]} numberOfLines={3}>
            {excerpt}
          </Text>
        ) : null}

        <View style={styles.noteMeta}>
          {(note.tags ?? []).slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: `${palette.deepMoss}18` }]}>
              <Text style={[styles.tagText, { color: palette.deepMoss }]}>#{tag}</Text>
            </View>
          ))}
          <Text style={[styles.noteDate, { color: colors.text.muted }]}>
            {formatDate(note.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

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

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    marginHorizontal: layout.screenPadding,
    marginVertical: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    padding: 0,
  },

  countLabel: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing[2],
  },

  list: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing[3],
  },

  noteCard: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...cardShadow,
  },
  noteAccent: { width: 3 },
  noteBody: { flex: 1, padding: spacing[4] },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteTitle: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flex: 1,
    marginRight: spacing[2],
  },
  noteExcerpt: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
    marginBottom: spacing[2],
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tagText: {
    fontFamily: fontFamilies.ui,
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
  noteDate: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    marginLeft: 'auto',
  },
});
