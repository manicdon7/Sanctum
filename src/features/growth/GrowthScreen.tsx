import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  StatusBar,
  Alert,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing, radius, layout, cardShadow } from '@/core/theme/spacing';
import { useGrowthStore } from './growthStore';
import { ReframeService } from './ReframeService';
import { useAppStore } from '@/core/stores/appStore';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { Button } from '@/shared/components/Button';

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function GrowthScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const encryptionKey = useAppStore((s) => s.encryptionKey);
  const { companionUseCloud, aiModelChoice } = useAppStore();
  const { goals, attempts, loadGoals, loadAttempts, createGoal, createAttempt, archiveGoal } = useGrowthStore();

  const [activeTab, setActiveTab] = useState<'attempts' | 'goals'>('attempts');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddAttempt, setShowAddAttempt] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [attemptOutcome, setAttemptOutcome] = useState<'worked' | 'didnt_land'>('worked');
  const [attemptNotes, setAttemptNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Underline indicator for tab
  const tabIndicatorLeft = useSharedValue(0);

  useEffect(() => {
    loadGoals(encryptionKey);
    loadAttempts(encryptionKey);
  }, []);

  useEffect(() => {
    tabIndicatorLeft.value = withTiming(activeTab === 'attempts' ? 0 : 1, { duration: 220 });
  }, [activeTab]);

  const totalAttempts = attempts.length;
  const workedCount   = attempts.filter((a) => a.outcome === 'worked').length;
  const successRate   = totalAttempts > 0 ? Math.round((workedCount / totalAttempts) * 100) : 0;

  async function handleCreateGoal() {
    if (!newGoalName.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createGoal(newGoalName.trim(), newGoalDesc.trim(), encryptionKey);
      setNewGoalName(''); setNewGoalDesc('');
      setShowAddGoal(false);
    } catch {
      Alert.alert('Error', 'Could not create goal.');
    }
  }

  async function handleCreateAttempt() {
    if (!selectedGoalId) {
      Alert.alert('Select a goal', 'Choose which goal this attempt is for.');
      return;
    }
    setIsSubmitting(true);
    try {
      let reframe: string | null = null;
      if (attemptOutcome === 'didnt_land') {
        const r = await ReframeService.generateReframe(attemptNotes, encryptionKey);
        reframe = r.text;
      }
      await createAttempt(selectedGoalId, attemptOutcome, attemptNotes, reframe, encryptionKey);
      setAttemptNotes(''); setSelectedGoalId('');
      setShowAddAttempt(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not save attempt.');
    } finally { setIsSubmitting(false); }
  }

  const accentColor = palette.sage;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Page header */}
      <View style={[styles.pageHeader, { paddingTop: insets.top + 12, borderBottomColor: colors.divider }]}>
        <Text style={[styles.pageTitle, { color: colors.text.primary }]}>Growth</Text>
        <Text style={[styles.pageSubtitle, { color: colors.text.muted }]}>a record of your practice</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats card ── */}
        <View style={[styles.statsCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <View style={styles.statsRow}>
            {/* Donut */}
            <View style={styles.donutWrap}>
              <Svg width={84} height={84} viewBox="0 0 84 84">
                <Circle cx={42} cy={42} r={30} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth={7} fill="none" />
                {totalAttempts > 0 && (
                  <Circle
                    cx={42} cy={42} r={30}
                    stroke={accentColor}
                    strokeWidth={7}
                    fill="none"
                    strokeDasharray={188}
                    strokeDashoffset={188 - (successRate / 100) * 188}
                    strokeLinecap="round"
                    transform="rotate(-90 42 42)"
                  />
                )}
              </Svg>
              <View style={styles.donutCenter}>
                <Text style={[styles.donutPct, { color: colors.text.primary }]}>{successRate}%</Text>
                <Text style={[styles.donutLabel, { color: colors.text.muted }]}>landed</Text>
              </View>
            </View>

            {/* Metrics */}
            <View style={styles.metricsCol}>
              <StatChip label="practices" value={String(totalAttempts)} colors={colors} />
              <StatChip label="worked" value={String(workedCount)} colors={colors} valueColor={accentColor} />
              <StatChip label="goals" value={String(goals.length)} colors={colors} />
            </View>
          </View>
        </View>

        {/* ── Tab bar ── */}
        <View style={[styles.tabs, { borderBottomColor: colors.divider }]}>
          {(['attempts', 'goals'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab ? accentColor : colors.text.muted },
              ]}>
                {tab === 'attempts' ? 'Attempts' : 'Goals'}
              </Text>
              {activeTab === tab && (
                <View style={[styles.tabUnderline, { backgroundColor: accentColor }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        {activeTab === 'attempts' ? (
          <View style={styles.section}>
            {attempts.length === 0 ? (
              <EmptyState
                icon="target"
                title="No attempts yet"
                description="Log a practice attempt — what you tried and how it went."
                actionLabel="Log attempt"
                onAction={() => setShowAddAttempt(true)}
              />
            ) : (
              attempts.slice(0, 30).map((attempt) => {
                const goal = goals.find((g) => g.id === attempt.goalId);
                return (
                  <AttemptRow
                    key={attempt.id}
                    attempt={attempt}
                    goalName={goal?.name ?? 'Unknown goal'}
                    colors={colors}
                    isDark={isDark}
                  />
                );
              })
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {goals.length === 0 ? (
              <EmptyState
                icon="flag"
                title="No goals yet"
                description="Create a goal — something you want to practice or build."
                actionLabel="Add goal"
                onAction={() => setShowAddGoal(true)}
              />
            ) : (
              goals.map((goal) => {
                const goalAttempts = attempts.filter((a) => a.goalId === goal.id);
                const worked = goalAttempts.filter((a) => a.outcome === 'worked').length;
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    attemptCount={goalAttempts.length}
                    workedCount={worked}
                    colors={colors}
                    isDark={isDark}
                    onArchive={() => archiveGoal(goal.id)}
                  />
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accentColor, bottom: insets.bottom + 84 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          activeTab === 'attempts' ? setShowAddAttempt(true) : setShowAddGoal(true);
        }}
      >
        <Feather name="plus" size={22} color={palette.white} />
      </TouchableOpacity>

      {/* Add Goal Sheet */}
      <BottomSheet visible={showAddGoal} onClose={() => setShowAddGoal(false)} title="New Goal" height={0.55}>
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetLabel, { color: colors.text.secondary }]}>Goal name</Text>
          <TextInput
            style={[styles.sheetInput, { backgroundColor: colors.inputBg, color: colors.text.primary, borderColor: colors.border }]}
            placeholder="e.g. Meditate 10 min daily"
            placeholderTextColor={colors.text.muted}
            value={newGoalName}
            onChangeText={setNewGoalName}
            autoFocus
          />
          <Text style={[styles.sheetLabel, { color: colors.text.secondary }]}>Description (optional)</Text>
          <TextInput
            style={[styles.sheetInput, { backgroundColor: colors.inputBg, color: colors.text.primary, borderColor: colors.border, minHeight: 72 }]}
            placeholder="Why does this matter to you?"
            placeholderTextColor={colors.text.muted}
            value={newGoalDesc}
            onChangeText={setNewGoalDesc}
            multiline
            textAlignVertical="top"
          />
          <Button label="Create goal" onPress={handleCreateGoal} disabled={!newGoalName.trim()} fullWidth />
        </View>
      </BottomSheet>

      {/* Add Attempt Sheet */}
      <BottomSheet visible={showAddAttempt} onClose={() => setShowAddAttempt(false)} title="Log Attempt" height={0.7}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sheetLabel, { color: colors.text.secondary }]}>Which goal?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing[4] }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {goals.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.goalChip,
                    { borderColor: selectedGoalId === g.id ? accentColor : colors.border },
                    selectedGoalId === g.id && { backgroundColor: `${accentColor}15` },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedGoalId(g.id);
                  }}
                >
                  <Text style={[styles.goalChipText, { color: selectedGoalId === g.id ? accentColor : colors.text.secondary }]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.sheetLabel, { color: colors.text.secondary }]}>Outcome</Text>
          <View style={styles.outcomeRow}>
            <TouchableOpacity
              style={[styles.outcomeBtn, { borderColor: attemptOutcome === 'worked' ? accentColor : colors.border },
                attemptOutcome === 'worked' && { backgroundColor: `${accentColor}15` }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAttemptOutcome('worked'); }}
            >
              <Feather name="check-circle" size={16} color={attemptOutcome === 'worked' ? accentColor : colors.text.muted} />
              <Text style={[styles.outcomeBtnText, { color: attemptOutcome === 'worked' ? accentColor : colors.text.secondary }]}>Worked</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.outcomeBtn, { borderColor: attemptOutcome === 'didnt_land' ? palette.dustyBlue : colors.border },
                attemptOutcome === 'didnt_land' && { backgroundColor: `${palette.dustyBlue}15` }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAttemptOutcome('didnt_land'); }}
            >
              <Feather name="minus-circle" size={16} color={attemptOutcome === 'didnt_land' ? palette.dustyBlue : colors.text.muted} />
              <Text style={[styles.outcomeBtnText, { color: attemptOutcome === 'didnt_land' ? palette.dustyBlue : colors.text.secondary }]}>Not yet</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sheetLabel, { color: colors.text.secondary }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.sheetInput, { backgroundColor: colors.inputBg, color: colors.text.primary, borderColor: colors.border, minHeight: 80 }]}
            placeholder="What happened? How did it feel?"
            placeholderTextColor={colors.text.muted}
            value={attemptNotes}
            onChangeText={setAttemptNotes}
            multiline
            textAlignVertical="top"
          />

          <Button
            label={isSubmitting ? 'Saving…' : 'Save attempt'}
            onPress={handleCreateAttempt}
            loading={isSubmitting}
            disabled={!selectedGoalId || isSubmitting}
            fullWidth
          />
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ label, value, colors, valueColor }: { label: string; value: string; colors: typeof lightColors; valueColor?: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={[styles.statValue, { color: valueColor ?? colors.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text.muted }]}>{label}</Text>
    </View>
  );
}

function AttemptRow({ attempt, goalName, colors, isDark }: { attempt: any; goalName: string; colors: typeof lightColors; isDark: boolean }) {
  const worked = attempt.outcome === 'worked';
  return (
    <View style={[styles.attemptRow, { borderBottomColor: colors.divider }]}>
      <View style={[styles.outcomeIcon, { backgroundColor: worked ? `${palette.sage}18` : `${palette.dustyBlue}18` }]}>
        <Feather name={worked ? 'check' : 'minus'} size={14} color={worked ? palette.sage : palette.dustyBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.attemptGoal, { color: colors.text.primary }]}>{goalName}</Text>
        {attempt.notes ? (
          <Text style={[styles.attemptNotes, { color: colors.text.secondary }]} numberOfLines={2}>{attempt.notes}</Text>
        ) : null}
        {attempt.reframe ? (
          <Text style={[styles.attemptReframe, { color: colors.text.muted }]} numberOfLines={2}>↳ {attempt.reframe}</Text>
        ) : null}
      </View>
      <Text style={[styles.attemptDate, { color: colors.text.muted }]}>{formatDate(new Date(attempt.attemptedAt))}</Text>
    </View>
  );
}

function GoalCard({ goal, attemptCount, workedCount, colors, isDark, onArchive }: { goal: any; attemptCount: number; workedCount: number; colors: typeof lightColors; isDark: boolean; onArchive: () => void }) {
  return (
    <View style={[styles.goalCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
      <View style={styles.goalCardHeader}>
        <Text style={[styles.goalName, { color: colors.text.primary }]} numberOfLines={1}>{goal.name}</Text>
        <TouchableOpacity onPress={onArchive} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="archive" size={14} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
      {goal.description ? (
        <Text style={[styles.goalDesc, { color: colors.text.secondary }]} numberOfLines={2}>{goal.description}</Text>
      ) : null}
      <View style={styles.goalStats}>
        <Text style={[styles.goalStatText, { color: colors.text.muted }]}>{attemptCount} attempts · {workedCount} landed</Text>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageTitle: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize['2xl'],
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[5],
  },
  statsCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
    marginBottom: spacing[5],
    ...cardShadow,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[5] },
  donutWrap: { width: 84, height: 84, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutPct: { fontFamily: fontFamilies.ui, fontSize: 16, fontWeight: fontWeight.semibold },
  donutLabel: { fontFamily: fontFamilies.ui, fontSize: 9, letterSpacing: 0.5 },
  metricsCol: { flex: 1, gap: spacing[2] },
  statChip: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statValue: { fontFamily: fontFamilies.ui, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  statLabel: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs },

  // Tabs
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: spacing[4] },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', position: 'relative' },
  tabText: { fontFamily: fontFamilies.ui, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  tabUnderline: { position: 'absolute', bottom: -1, left: '20%', right: '20%', height: 2, borderRadius: 1 },

  section: { gap: spacing[3] },

  // Attempt row
  attemptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  outcomeIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  attemptGoal: { fontFamily: fontFamilies.ui, fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: 2 },
  attemptNotes: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs, lineHeight: 16, marginBottom: 2 },
  attemptReframe: { fontFamily: fontFamilies.journal, fontSize: fontSize.xs, lineHeight: 16, fontStyle: 'italic' },
  attemptDate: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs, marginTop: 2 },

  // Goal card
  goalCard: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
    ...cardShadow,
  },
  goalCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  goalName: { fontFamily: fontFamilies.ui, fontSize: fontSize.base, fontWeight: fontWeight.semibold, flex: 1 },
  goalDesc: { fontFamily: fontFamilies.ui, fontSize: fontSize.sm, lineHeight: 18, marginBottom: spacing[2] },
  goalStats: {},
  goalStatText: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs },

  // FAB
  fab: {
    position: 'absolute',
    right: layout.screenPadding,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: palette.sage, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 }, android: { elevation: 8 } }),
  },

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
  goalChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  goalChipText: { fontFamily: fontFamilies.ui, fontSize: fontSize.sm },
  outcomeRow: { flexDirection: 'row', gap: spacing[3] },
  outcomeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  outcomeBtnText: { fontFamily: fontFamilies.ui, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
});
