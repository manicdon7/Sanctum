import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing, radius, layout, cardShadow } from '@/core/theme/spacing';
import { useAppStore } from '@/core/stores/appStore';
import { useLearningStore } from './learningStore';
import { EmptyState } from '@/shared/components/EmptyState';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { Button } from '@/shared/components/Button';

export function DecksListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const encryptionKey = useAppStore((s) => s.encryptionKey);
  const {
    decks,
    cards,
    isLoading,
    loadDecks,
    loadCards,
    createCard,
    deleteCard,
    deleteDeck,
  } = useLearningStore();

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);

  useEffect(() => {
    loadDecks(encryptionKey);
  }, []);

  useEffect(() => {
    if (selectedDeckId) {
      loadCards(selectedDeckId, encryptionKey);
    }
  }, [selectedDeckId]);

  const selectedDeck = decks.find((d) => d.id === selectedDeckId) as any;
  const deckCards = selectedDeckId ? cards[selectedDeckId] || [] : [];

  async function handleAddCard() {
    if (!selectedDeckId || !newCardFront.trim() || !newCardBack.trim()) return;
    setIsSubmittingCard(true);
    try {
      await createCard(selectedDeckId, newCardFront.trim(), newCardBack.trim(), encryptionKey);
      setNewCardFront('');
      setNewCardBack('');
      setShowAddCard(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not create card.');
    } finally {
      setIsSubmittingCard(false);
    }
  }

  async function handleDeleteDeck(deckId: string, deckName: string) {
    Alert.alert('Delete Deck', `Are you sure you want to delete "${deckName}" and all its cards?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteDeck(deckId);
          if (selectedDeckId === deckId) {
            setSelectedDeckId(null);
          }
        },
      },
    ]);
  }

  async function handleDeleteCard(cardId: string) {
    if (!selectedDeckId) return;
    Alert.alert('Delete Card', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteCard(selectedDeckId, cardId);
        },
      },
    ]);
  }

  const accentColor = palette.sage;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (selectedDeckId) {
              setSelectedDeckId(null);
            } else {
              navigation.goBack();
            }
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accentColor }]}>
          {selectedDeck ? selectedDeck.name : 'Manage Decks'}
        </Text>
        {selectedDeckId ? (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: accentColor }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddCard(true);
            }}
          >
            <Feather name="plus" size={18} color={palette.white} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 34 }} />
        )}
      </View>

      {/* Main List */}
      {selectedDeckId === null ? (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="book-open"
              title="No decks to manage"
              description="Go back to the learning nook to create a deck."
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.deckRow, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDeckId(item.id);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.deckInfo}>
                <Text style={[styles.deckName, { color: colors.text.primary }]}>
                  {(item as any).name || 'Untitled Deck'}
                </Text>
                <Text style={[styles.deckMeta, { color: colors.text.muted }]}>
                  Tap to view or add cards
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteDeck(item.id, (item as any).name || '')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.deleteBtn}
              >
                <Feather name="trash-2" size={16} color={palette.crisis} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.flex}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={accentColor} />
            </View>
          ) : (
            <FlatList
              data={deckCards}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  icon="layers"
                  title="No cards in this deck"
                  description="Add your first card to start studying."
                  actionLabel="Add card"
                  onAction={() => setShowAddCard(true)}
                />
              }
              renderItem={({ item }) => (
                <View style={[styles.cardRow, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardLabel, { color: colors.text.muted }]}>FRONT</Text>
                    <Text style={[styles.cardText, { color: colors.text.primary }]} numberOfLines={2}>
                      {item.front}
                    </Text>
                    <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />
                    <Text style={[styles.cardLabel, { color: colors.text.muted }]}>BACK</Text>
                    <Text style={[styles.cardText, { color: colors.text.secondary }]} numberOfLines={3}>
                      {item.bodyBack}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteCard(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.deleteBtn}
                  >
                    <Feather name="trash-2" size={15} color={palette.crisis} />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* Add Card Sheet */}
      <BottomSheet visible={showAddCard} onClose={() => setShowAddCard(false)} title="New Flashcard" height={0.65}>
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetLabel, { color: colors.text.secondary }]}>Front (Question / Prompt)</Text>
          <TextInput
            style={[styles.sheetInput, { backgroundColor: colors.inputBg, color: colors.text.primary, borderColor: colors.border }]}
            placeholder="e.g. Obrigado"
            placeholderTextColor={colors.text.muted}
            value={newCardFront}
            onChangeText={setNewCardFront}
            autoFocus
            returnKeyType="next"
          />
          <Text style={[styles.sheetLabel, { color: colors.text.secondary }]}>Back (Answer / Explanation)</Text>
          <TextInput
            style={[styles.sheetInput, { backgroundColor: colors.inputBg, color: colors.text.primary, borderColor: colors.border, minHeight: 64 }]}
            placeholder="e.g. Thank you (masc.)"
            placeholderTextColor={colors.text.muted}
            value={newCardBack}
            onChangeText={setNewCardBack}
            multiline
            textAlignVertical="top"
          />
          <Button
            label={isSubmittingCard ? 'Saving…' : 'Add card'}
            onPress={handleAddCard}
            loading={isSubmittingCard}
            disabled={!newCardFront.trim() || !newCardBack.trim() || isSubmittingCard}
            fullWidth
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
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

  list: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
    gap: spacing[3],
  },

  // Deck Row
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    ...cardShadow,
  },
  deckInfo: { flex: 1 },
  deckName: { fontFamily: fontFamilies.ui, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  deckMeta: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs, marginTop: 4 },
  deleteBtn: { padding: spacing[2] },

  // Card Row
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    ...cardShadow,
  },
  cardInfo: { flex: 1 },
  cardLabel: { fontFamily: fontFamilies.ui, fontSize: 9, fontWeight: fontWeight.semibold, letterSpacing: 1, marginBottom: 2 },
  cardText: { fontFamily: fontFamilies.ui, fontSize: fontSize.sm, lineHeight: 18 },
  cardDivider: { height: StyleSheet.hairlineWidth, marginVertical: spacing[3] },

  // Sheet
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
