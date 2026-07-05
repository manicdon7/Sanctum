import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  AppState,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing, radius, layout, cardShadow } from '@/core/theme/spacing';
import { PROMPTS, PROMPT_WINDOW_DAYS } from '@/core/constants/prompts';
import { useAppStore } from '@/core/stores/appStore';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { getDB } from '@/core/db/client';
import { promptsShown } from '@/core/db/schema';
import { lt } from 'drizzle-orm';
import { type RoomStackParamList } from '@/core/navigation/AppNavigator';
import { AmbientPlayer, type AmbientTrack } from '@/shared/utils/AmbientPlayer';
import { ReframeService } from '@/features/growth/ReframeService';
import { BottomSheet } from '@/shared/components/BottomSheet';

type NavProp = NativeStackNavigationProp<RoomStackParamList, 'RoomHome'>;

// ── Time-of-day ─────────────────────────────────────────────────────────────

interface GradientStop { hour: number; top: string; bottom: string }

const GRADIENT_STOPS: GradientStop[] = [
  { hour: 5,  top: '#F2C5A0', bottom: '#E8A87C' },
  { hour: 10, top: '#FDF4E8', bottom: '#F5EDE0' },
  { hour: 16, top: '#F5D08A', bottom: '#E8A855' },
  { hour: 19, top: '#C97240', bottom: '#9B4E25' },
  { hour: 22, top: '#1A1825', bottom: '#1A1714' },
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerpHex(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
}

function getGradientForHour(h: number): { top: string; bottom: string } {
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const curr = GRADIENT_STOPS[i]!;
    const next = GRADIENT_STOPS[i + 1]!;
    if (h >= curr.hour && h < next.hour) {
      const t = (h - curr.hour) / (next.hour - curr.hour);
      return { top: lerpHex(curr.top, next.top, t), bottom: lerpHex(curr.bottom, next.bottom, t) };
    }
  }
  const last = GRADIENT_STOPS[GRADIENT_STOPS.length - 1]!;
  return { top: last.top, bottom: last.bottom };
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return 'still up?';
  if (h < 12) return 'good morning';
  if (h < 17) return 'good afternoon';
  if (h < 21) return 'good evening';
  return 'good night';
}

// ── Rooms ────────────────────────────────────────────────────────────────────

const ROOMS = [
  {
    id: 'VentCorner' as const,
    label: 'Vent Corner',
    description: 'Write freely, no judgment',
    icon: 'feather' as const,
    color: palette.dustyBlue,
  },
  {
    id: 'LearningNook' as const,
    label: 'Learning Nook',
    description: 'Flashcard decks & review',
    icon: 'book-open' as const,
    color: palette.sage,
  },
  {
    id: 'CreationDesk' as const,
    label: 'Creation Desk',
    description: 'Canvas & ideas',
    icon: 'edit-3' as const,
    color: palette.terracotta,
  },
  {
    id: 'KnowledgeGarden' as const,
    label: 'Knowledge Garden',
    description: 'Notes & thought graph',
    icon: 'git-branch' as const,
    color: palette.deepMoss,
  },
];

const MOODS = [
  { key: 'devastated', value: 1, emoji: '😔' },
  { key: 'sad',        value: 2, emoji: '😕' },
  { key: 'neutral',    value: 3, emoji: '😐' },
  { key: 'good',       value: 4, emoji: '🙂' },
  { key: 'joyful',     value: 5, emoji: '😄' },
] as const;

// ── Prompt selection ─────────────────────────────────────────────────────────

async function selectPrompt(): Promise<typeof PROMPTS[number]> {
  try {
    const db = getDB();
    const cutoff = new Date(Date.now() - PROMPT_WINDOW_DAYS * 86400_000);
    const shown = await db.select().from(promptsShown).where(lt(promptsShown.shownAt, cutoff));
    const shownIds = new Set(shown.map((r) => r.promptId));
    const pool = PROMPTS.filter((p) => !shownIds.has(p.id));
    const chosen = (pool.length > 0 ? pool : PROMPTS)[Math.floor(Math.random() * (pool.length > 0 ? pool : PROMPTS).length)]!;
    await db
      .insert(promptsShown)
      .values({ promptId: chosen.id, shownAt: new Date() })
      .onConflictDoUpdate({ target: promptsShown.promptId, set: { shownAt: new Date() } });
    return chosen;
  } catch {
    return PROMPTS[0]!;
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

export function RoomScreen() {
  const navigation = useNavigation<NavProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();

  const ambientTrack  = useAppStore((s) => s.ambientTrack);
  const ambientVolume = useAppStore((s) => s.ambientVolume);
  const companionUseCloud = useAppStore((s) => s.companionUseCloud);
  const aiModelChoice = useAppStore((s) => s.aiModelChoice);

  const [prompt, setPrompt]       = useState(PROMPTS[0]!);
  const [bgGradient, setBgGradient] = useState(() => getGradientForHour(new Date().getHours()));
  const [todayMood, setTodayMood]   = useState<number | null>(null);
  const [showCompanion, setShowCompanion] = useState(false);
  const [chatInput, setChatInput]   = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [affirmLoading, setAffirmLoading] = useState(false);

  // Breathing animation for prompt card
  const breatheScale = useSharedValue(1);
  const gridOpacity  = useSharedValue(0);

  useEffect(() => {
    selectPrompt().then(setPrompt);
    gridOpacity.value = withTiming(1, { duration: 400 });

    if (!reduceMotion) {
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.012, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0,   { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }

    const interval = setInterval(() => {
      const d = new Date();
      setBgGradient(getGradientForHour(d.getHours() + d.getMinutes() / 60));
    }, 60_000);

    return () => clearInterval(interval);
  }, [reduceMotion]);

  // Ambient audio
  useEffect(() => {
    const parent = navigation.getParent();
    const resume = () => {
      if (ambientTrack !== 'none') AmbientPlayer.play(ambientTrack, ambientVolume).catch(() => {});
    };
    const pause = () => AmbientPlayer.stop().catch(() => {});

    if (ambientTrack !== 'none') AmbientPlayer.play(ambientTrack, ambientVolume).catch(() => {});

    const focusSub  = parent?.addListener('focus', resume);
    const blurSub   = parent?.addListener('blur', pause);
    const appSub    = AppState.addEventListener('change', (s) => s === 'active' ? resume() : pause());

    return () => {
      focusSub?.();
      blurSub?.();
      appSub.remove();
    };
  }, [navigation, ambientTrack, ambientVolume]);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));
  const gridStyle = useAnimatedStyle(() => ({ opacity: gridOpacity.value }));

  async function handlePromptRefresh() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (companionUseCloud || aiModelChoice) {
      setAffirmLoading(true);
      try {
        const text = await ReframeService.generateAffirmation();
        if (text) { setPrompt({ id: Date.now(), text, category: 'reflection' }); return; }
      } catch {} finally { setAffirmLoading(false); }
    }
    selectPrompt().then(setPrompt);
  }

  async function handleSendChat() {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput('');
    const history = [...chatHistory, { role: 'user' as const, content: msg }];
    setChatHistory(history);
    setChatLoading(true);
    try {
      const systemMsg = {
        role: 'system' as const,
        content: 'You are a warm, gentle companion in a private sanctuary. Listen, validate, comfort — 1-3 sentences, no exclamation marks.',
      };
      const reply = await ReframeService.chat([systemMsg, ...history]);
      setChatHistory([...history, { role: 'assistant', content: reply }]);
    } catch {
      setChatHistory([...history, { role: 'assistant', content: 'I am here with you. Take a slow breath.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: bgGradient.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* Gradient overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgGradient.bottom, opacity: 0.55 }]} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text.primary }]}>{getGreeting()}</Text>
            <Text style={[styles.subGreeting, { color: colors.text.secondary }]}>your private space</Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: `${colors.surface}CC`, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.getParent()?.navigate('Settings');
            }}
            accessibilityLabel="Settings"
          >
            <Feather name="settings" size={17} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* ── Mood Check-in ── */}
        <View style={[styles.moodCard, { backgroundColor: `${colors.surfaceRaised}E0`, borderColor: colors.border }]}>
          <Text style={[styles.moodLabel, { color: colors.text.secondary }]}>How are you right now?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.moodBtn,
                  todayMood === m.value && { backgroundColor: `${palette.amber}22`, borderColor: `${palette.amber}66` },
                  todayMood !== m.value && { borderColor: 'transparent' },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTodayMood(m.value);
                }}
                accessibilityLabel={m.key}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Daily Prompt ── */}
        <Animated.View style={breatheStyle}>
          <View style={[styles.promptCard, { backgroundColor: `${colors.surfaceRaised}E8`, borderColor: colors.border }]}>
            <View style={styles.promptHeader}>
              <Text style={[styles.promptHint, { color: colors.text.muted }]}>daily prompt</Text>
              <TouchableOpacity
                onPress={handlePromptRefresh}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Refresh prompt"
              >
                {affirmLoading
                  ? <ActivityIndicator size="small" color={colors.text.muted} />
                  : <Feather name="refresh-cw" size={14} color={colors.text.muted} />
                }
              </TouchableOpacity>
            </View>
            <Text style={[styles.promptText, { color: colors.text.primary }]}>
              "{prompt.text}"
            </Text>
          </View>
        </Animated.View>

        {/* ── Rooms Grid ── */}
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>your rooms</Text>
        <Animated.View style={[styles.roomsGrid, gridStyle]}>
          {ROOMS.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              colors={colors}
              isDark={isDark}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate(room.id);
              }}
            />
          ))}
        </Animated.View>

        {/* ── AI Companion button ── */}
        {(companionUseCloud || aiModelChoice) ? (
          <TouchableOpacity
            style={[styles.companionBtn, { backgroundColor: `${colors.surface}CC`, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCompanion(true);
            }}
          >
            <View style={[styles.companionDot, { backgroundColor: `${palette.amber}33` }]}>
              <Feather name="message-circle" size={16} color={palette.amber} />
            </View>
            <View style={styles.companionText}>
              <Text style={[styles.companionTitle, { color: colors.text.primary }]}>Talk with your companion</Text>
              <Text style={[styles.companionSub, { color: colors.text.muted }]}>Private · free · judgment-free</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* ── Companion Chat Sheet ── */}
      <BottomSheet
        visible={showCompanion}
        onClose={() => setShowCompanion(false)}
        title="Your Companion"
        height={0.72}
      >
        <CompanionChat
          history={chatHistory}
          input={chatInput}
          onChangeInput={setChatInput}
          onSend={handleSendChat}
          loading={chatLoading}
          colors={colors}
          isDark={isDark}
        />
      </BottomSheet>
    </View>
  );
}

// ── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  colors,
  isDark,
  onPress,
}: {
  room: typeof ROOMS[number];
  colors: typeof lightColors;
  isDark: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.roomCardWrap, animStyle]}>
      <TouchableOpacity
        style={[
          styles.roomCard,
          {
            backgroundColor: isDark ? colors.surface : colors.surfaceRaised,
            borderColor: colors.border,
          },
        ]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 12, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1,    { damping: 12, stiffness: 250 }); }}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={room.label}
      >
        {/* Accent bar */}
        <View style={[styles.roomAccent, { backgroundColor: room.color }]} />

        <View style={[styles.roomIconWrap, { backgroundColor: `${room.color}18` }]}>
          <Feather name={room.icon} size={20} color={room.color} />
        </View>

        <Text style={[styles.roomName, { color: colors.text.primary }]} numberOfLines={1}>
          {room.label}
        </Text>
        <Text style={[styles.roomDesc, { color: colors.text.muted }]} numberOfLines={2}>
          {room.description}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Companion Chat ────────────────────────────────────────────────────────────

function CompanionChat({
  history,
  input,
  onChangeInput,
  onSend,
  loading,
  colors,
  isDark,
}: {
  history: { role: 'user' | 'assistant'; content: string }[];
  input: string;
  onChangeInput: (t: string) => void;
  onSend: () => void;
  loading: boolean;
  colors: typeof lightColors;
  isDark: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [history]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: layout.screenPadding, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <Text style={[styles.chatEmpty, { color: colors.text.muted }]}>
            This is your private space to think out loud. Say anything.
          </Text>
        ) : null}
        {history.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.chatBubble,
              msg.role === 'user'
                ? { alignSelf: 'flex-end', backgroundColor: `${palette.amber}22`, borderColor: `${palette.amber}40` }
                : { alignSelf: 'flex-start', backgroundColor: isDark ? colors.surface : colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.chatText, { color: colors.text.primary }]}>{msg.content}</Text>
          </View>
        ))}
        {loading ? (
          <View style={[styles.chatBubble, { alignSelf: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.text.muted} />
          </View>
        ) : null}
      </ScrollView>

      {/* Input row */}
      <View style={[styles.chatInputRow, { borderTopColor: colors.divider, backgroundColor: colors.surfaceRaised }]}>
        <TextInput
          style={[styles.chatInput, { backgroundColor: colors.inputBg, color: colors.text.primary }]}
          placeholder="Say something…"
          placeholderTextColor={colors.text.muted}
          value={input}
          onChangeText={onChangeInput}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={onSend}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[styles.chatSend, { backgroundColor: input.trim() ? palette.amber : colors.border }]}
          onPress={onSend}
          disabled={!input.trim() || loading}
        >
          <Feather name="send" size={16} color={input.trim() ? palette.white : colors.text.muted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: layout.screenPadding },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  greeting: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize['2xl'],
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  // Mood
  moodCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  moodLabel: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    marginBottom: spacing[3],
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  moodEmoji: { fontSize: 22 },

  // Prompt
  promptCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[5],
    marginBottom: spacing[5],
    ...cardShadow,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  promptHint: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    letterSpacing: 0.8,
    textTransform: 'lowercase',
  },
  promptText: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.65,
    letterSpacing: 0.1,
  },

  // Section title
  sectionTitle: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },

  // Rooms grid
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  roomCardWrap: {
    width: '47.5%',
  },
  roomCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
    overflow: 'hidden',
    ...cardShadow,
  },
  roomAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  roomIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  roomName: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  roomDesc: {
    fontFamily: fontFamilies.ui,
    fontSize: 11,
    lineHeight: 15,
  },

  // Companion
  companionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  companionDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companionText: { flex: 1 },
  companionTitle: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  companionSub: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  // Chat
  chatEmpty: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.6,
    textAlign: 'center',
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
    fontStyle: 'italic',
  },
  chatBubble: {
    maxWidth: '80%',
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chatText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.55,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing[3],
    gap: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chatInput: {
    flex: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    maxHeight: 100,
  },
  chatSend: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
