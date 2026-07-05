import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing, radius, layout } from '@/core/theme/spacing';
import type { RoomStackParamList } from '@/core/navigation/AppNavigator';
import { useLearningStore } from './learningStore';
import { useAppStore } from '@/core/stores/appStore';

type RouteProps = RouteProp<RoomStackParamList, 'FlashcardReview'>;

const DEMO_CARDS = [
  { id: 'd1', front: 'What is the difference between sympathy and empathy?', bodyBack: 'Sympathy is feeling for someone. Empathy is feeling with someone — stepping into their perspective.' },
  { id: 'd2', front: 'What does "sonder" mean?', bodyBack: 'The realization that each passerby has a life as vivid and complex as your own — full of ambitions, routines, and quiet dramas.' },
  { id: 'd3', front: 'What is the Dunning-Kruger effect?', bodyBack: 'A cognitive bias where low-competence people overestimate their ability, while high-competence people underestimate theirs.' },
];

type RatingLabel = { value: 1 | 2 | 3; label: string; color: string; icon: string };

const RATINGS: RatingLabel[] = [
  { value: 1, label: 'Hard',  color: palette.terracotta, icon: 'frown' },
  { value: 2, label: 'OK',    color: palette.amber,      icon: 'meh'   },
  { value: 3, label: 'Easy',  color: palette.sage,       icon: 'smile' },
];

export function FlashcardReviewScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const deckId = route.params?.deckId;

  const encryptionKey = useAppStore((s) => s.encryptionKey);
  const { cards, loadCards, submitReview, isLoading } = useLearningStore();

  const [cardIndex, setCardIndex]   = useState(0);
  const [isFlipped, setIsFlipped]   = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const flipProgress = useSharedValue(0); // 0 = front, 180 = back

  useEffect(() => {
    if (deckId && deckId !== 'demo') loadCards(deckId, encryptionKey);
  }, [deckId]);

  const deckCards = deckId === 'demo' ? DEMO_CARDS : (cards[deckId] ?? []);
  const dueCards  = deckCards.filter((c) => {
    if (!('dueDate' in c)) return true;
    return new Date((c as any).dueDate).getTime() <= Date.now();
  });
  const activeCards = dueCards.length > 0 ? dueCards : deckCards;
  const currentCard = activeCards[cardIndex];
  const progress    = activeCards.length > 0 ? cardIndex / activeCards.length : 0;
  const isDone      = cardIndex >= activeCards.length;

  const handleFlip = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = isFlipped ? 0 : 180;
    flipProgress.value = withTiming(target, { duration: 380, easing: Easing.out(Easing.cubic) });
    setIsFlipped((f) => !f);
  }, [isFlipped, flipProgress]);

  const handleRating = useCallback(async (rating: 1 | 2 | 3) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentCard && deckId !== 'demo') {
      await submitReview(currentCard.id, rating, encryptionKey);
    }
    setReviewedCount((c) => c + 1);
    flipProgress.value = withTiming(0, { duration: 200 });
    setIsFlipped(false);
    setCardIndex((i) => i + 1);
  }, [currentCard, deckId, encryptionKey, submitReview, flipProgress]);

  // Animated front face
  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${interpolate(flipProgress.value, [0, 180], [0, 180], Extrapolation.CLAMP)}deg` }],
    opacity: interpolate(flipProgress.value, [0, 90, 180], [1, 0, 0], Extrapolation.CLAMP),
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  }));

  // Animated back face
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${interpolate(flipProgress.value, [0, 180], [180, 360], Extrapolation.CLAMP)}deg` }],
    opacity: interpolate(flipProgress.value, [0, 90, 180], [0, 0, 1], Extrapolation.CLAMP),
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  }));

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
          <Feather name="x" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={[styles.headerProgress, { color: colors.text.muted }]}>
          {Math.min(cardIndex + 1, activeCards.length)} / {activeCards.length}
        </Text>
        <Text style={[styles.reviewedLabel, { color: accentColor }]}>{reviewedCount} reviewed</Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
        <Animated.View style={[styles.progressFill, { backgroundColor: accentColor, width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <ActivityIndicator color={accentColor} size="large" />
        ) : isDone ? (
          <DoneCard count={reviewedCount} colors={colors} isDark={isDark} onBack={() => navigation.goBack()} />
        ) : !currentCard ? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: colors.text.muted }]}>No cards in this deck yet.</Text>
          </View>
        ) : (
          <>
            {/* Card */}
            <TouchableOpacity
              style={styles.cardContainer}
              onPress={handleFlip}
              activeOpacity={0.95}
            >
              <Animated.View style={[styles.cardFace, frontStyle, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <Text style={[styles.sideLabel, { color: colors.text.muted }]}>QUESTION</Text>
                <Text style={[styles.cardText, { color: colors.text.primary }]}>{currentCard.front}</Text>
                <View style={styles.tapHint}>
                  <Feather name="rotate-cw" size={13} color={colors.text.muted} />
                  <Text style={[styles.tapHintText, { color: colors.text.muted }]}>tap to flip</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.cardFace, backStyle, { backgroundColor: isDark ? '#1F2D27' : '#F0F5F0', borderColor: `${accentColor}40` }]}>
                <Text style={[styles.sideLabel, { color: accentColor }]}>ANSWER</Text>
                <Text style={[styles.cardText, { color: colors.text.primary }]}>{(currentCard as any).bodyBack ?? (currentCard as any).back}</Text>
              </Animated.View>
            </TouchableOpacity>

            {/* Rating buttons — only visible when flipped */}
            {isFlipped && (
              <View style={styles.ratingRow}>
                {RATINGS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.ratingBtn, { borderColor: r.color, backgroundColor: `${r.color}14` }]}
                    onPress={() => handleRating(r.value)}
                    activeOpacity={0.8}
                  >
                    <Feather name={r.icon as any} size={18} color={r.color} />
                    <Text style={[styles.ratingLabel, { color: r.color }]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

// ── Done Card ─────────────────────────────────────────────────────────────────

function DoneCard({ count, colors, isDark, onBack }: { count: number; colors: typeof lightColors; isDark: boolean; onBack: () => void }) {
  return (
    <View style={styles.doneCard}>
      <Text style={styles.doneEmoji}>🌱</Text>
      <Text style={[styles.doneTitle, { color: colors.text.primary }]}>Session complete</Text>
      <Text style={[styles.doneBody, { color: colors.text.secondary }]}>
        You reviewed {count} {count === 1 ? 'card' : 'cards'}. Spaced repetition is doing its work.
      </Text>
      <TouchableOpacity
        style={[styles.doneBtn, { backgroundColor: palette.sage }]}
        onPress={onBack}
      >
        <Text style={styles.doneBtnText}>back to nook</Text>
      </TouchableOpacity>
    </View>
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
  headerProgress: { fontFamily: fontFamilies.ui, fontSize: fontSize.sm },
  reviewedLabel: { fontFamily: fontFamilies.ui, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  progressTrack: { height: 3 },
  progressFill: { height: 3 },

  body: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: fontFamilies.ui, fontSize: fontSize.base },

  // Card
  cardContainer: {
    width: '100%',
    height: 280,
    marginBottom: spacing[6],
  },
  cardFace: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  sideLabel: {
    fontFamily: fontFamilies.ui,
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.5,
    marginBottom: spacing[4],
  },
  cardText: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * 1.55,
    textAlign: 'center',
    fontWeight: '400',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    bottom: spacing[4],
  },
  tapHintText: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs },

  // Rating
  ratingRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  ratingBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  ratingLabel: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs, fontWeight: fontWeight.medium },

  // Done
  doneCard: { alignItems: 'center', gap: spacing[4] },
  doneEmoji: { fontSize: 52 },
  doneTitle: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.xl,
    fontWeight: '400',
  },
  doneBody: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
    textAlign: 'center',
    maxWidth: 280,
  },
  doneBtn: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  doneBtnText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: palette.white,
  },
});
