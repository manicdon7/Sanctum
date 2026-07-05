import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing, radius, layout, cardShadow } from '@/core/theme/spacing';
import { useAppStore } from '@/core/stores/appStore';
import { useVaultStore } from './vaultStore';
import { MediaCard } from './MediaCard';
import { ExportService } from './ExportService';
import { clearKey } from '@/core/encryption/keyDerivation';
import { getDB } from '@/core/db/client';
import {
  entries, moods, notes, noteLinks, flashcardDecks,
  flashcardCards, reviewLog, goals, goalAttempts, mediaFiles, settings,
} from '@/core/db/schema';
import { EmptyState } from '@/shared/components/EmptyState';

type FilterType = 'all' | 'photo' | 'video' | 'voice' | 'document';

const FILTER_LABELS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all',      label: 'All',       icon: 'grid' },
  { key: 'photo',    label: 'Photos',    icon: 'image' },
  { key: 'video',    label: 'Videos',    icon: 'film' },
  { key: 'voice',    label: 'Voice',     icon: 'mic' },
  { key: 'document', label: 'Documents', icon: 'file-text' },
];

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export function VaultScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const encryptionKey = useAppStore((s) => s.encryptionKey);
  const lock = useAppStore((s) => s.lock);
  const { media, isLoading, loadMedia, addMedia, deleteMedia } = useVaultStore();

  const [isExporting, setIsExporting] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => { loadMedia(encryptionKey); }, []);

  const filteredMedia = filter === 'all' ? media : media.filter((m) => m.type === filter);

  async function handlePickMedia() {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!result.granted) {
      Alert.alert('Permission required', 'Sanctum needs gallery access to import media.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
    });
    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;
    const asset = pickerResult.assets[0];
    const name = asset.fileName || `import_${Date.now()}.${asset.uri.split('.').pop()}`;
    const type = asset.type === 'video' ? 'video' : 'photo';
    try {
      await addMedia(asset.uri, name, type, asset.fileSize || 0, asset.duration ? asset.duration / 1000 : null, encryptionKey);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Import failed', 'Could not encrypt and save the file.');
    }
  }

  async function handleExport() {
    Alert.alert(
      'Export everything',
      'Creates a zip of all your entries and media — decrypted for portability. Opens in Obsidian.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setIsExporting(true);
            try { await ExportService.exportAll(encryptionKey); }
            catch (err) { Alert.alert('Export failed', String(err)); }
            finally { setIsExporting(false); }
          },
        },
      ],
    );
  }

  async function handleDeleteEverything() {
    Alert.alert(
      'Delete everything?',
      'Permanently wipes all entries, notes, media, and settings from this device. Cannot be undone.',
      [
        { text: 'Keep everything', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDB();
              await db.delete(entries);
              await db.delete(moods);
              await db.delete(notes);
              await db.delete(noteLinks);
              await db.delete(flashcardDecks);
              await db.delete(flashcardCards);
              await db.delete(reviewLog);
              await db.delete(goals);
              await db.delete(goalAttempts);
              await db.delete(mediaFiles);
              await db.delete(settings);
              await clearKey();
              lock();
            } catch {
              Alert.alert('Wipe failed', 'Could not delete all data. Clear app storage manually.');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Page header */}
      <View style={[styles.pageHeader, { paddingTop: insets.top + 12, borderBottomColor: colors.divider }]}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text.primary }]}>Vault</Text>
          <Text style={[styles.pageSubtitle, { color: colors.text.muted }]}>your private media</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleExport}
            disabled={isExporting}
          >
            {isExporting
              ? <ActivityIndicator size="small" color={palette.amber} />
              : <Feather name="download" size={16} color={colors.text.secondary} />
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: palette.amber }]}
            onPress={handlePickMedia}
          >
            <Feather name="plus" size={18} color={palette.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterRow, { borderBottomColor: colors.divider }]}
      >
        {FILTER_LABELS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              { borderColor: filter === f.key ? palette.amber : colors.border },
              filter === f.key && { backgroundColor: `${palette.amber}14` },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(f.key);
            }}
          >
            <Text style={[
              styles.filterChipText,
              { color: filter === f.key ? palette.amber : colors.text.secondary },
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Media grid */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.amber} />
        </View>
      ) : filteredMedia.length === 0 ? (
        <EmptyState
          icon="lock"
          title={filter === 'all' ? 'Vault is empty' : `No ${filter}s yet`}
          description="Everything you import is encrypted before it's stored. Tap + to add something."
          actionLabel="Import"
          onAction={handlePickMedia}
        />
      ) : (
        <FlatList
          data={filteredMedia}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 100 }]}
          columnWrapperStyle={{ gap: spacing[3] }}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <MediaCard
                media={{
                  id: item.id,
                  type: item.type,
                  encryptedUri: item.encryptedUri,
                  thumbnailUri: item.thumbnailUri,
                  name: item.name,
                  sizeBytes: item.sizeBytes,
                  durationMs: item.durationMs,
                  recordedAt: item.recordedAt,
                }}
                onPress={() => Alert.alert(item.name, `${formatBytes(item.sizeBytes)} · ${item.type}`)}
                onDelete={() => Alert.alert('Delete?', item.name, [
                  { text: 'Keep', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteMedia(item.id) },
                ])}
              />
            </View>
          )}
        />
      )}

      {/* Footer actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 80, borderTopColor: colors.divider }]}>
        <TouchableOpacity style={styles.deleteRow} onPress={handleDeleteEverything}>
          <Feather name="trash-2" size={13} color={palette.crisis} />
          <Text style={[styles.deleteText, { color: palette.crisis }]}>Delete everything from this device</Text>
        </TouchableOpacity>
        <View style={[styles.encryptionBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="lock" size={11} color={colors.text.muted} />
          <Text style={[styles.encryptionText, { color: colors.text.muted }]}>AES-256-GCM encrypted</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageTitle: { fontFamily: fontFamilies.journal, fontSize: fontSize['2xl'], fontWeight: '400', letterSpacing: -0.4 },
  pageSubtitle: { fontFamily: fontFamilies.ui, fontSize: fontSize.sm, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  filterChipText: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs, fontWeight: fontWeight.medium },

  grid: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
  },

  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[3],
    alignItems: 'center',
    gap: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteText: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  encryptionText: { fontFamily: fontFamilies.ui, fontSize: 10, letterSpacing: 0.3 },
});
