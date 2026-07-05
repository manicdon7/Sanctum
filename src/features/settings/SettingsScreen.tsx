import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing, radius, layout } from '@/core/theme/spacing';
import { useAppStore, type AmbientTrack } from '@/core/stores/appStore';

const APP_VERSION = '1.0.0';

// ── Setting Row ────────────────────────────────────────────────────────────────

interface SettingRowProps {
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  label: string;
  value?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  colors: typeof lightColors;
}

function SettingRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  chevron = false,
  destructive = false,
  colors,
}: SettingRowProps) {
  const labelColor = destructive ? palette.crisis : colors.text.primary;
  const defaultIconColor = iconColor ?? (destructive ? palette.crisis : colors.text.secondary);

  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.divider }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${defaultIconColor}16` }]}>
        <Feather name={icon} size={16} color={defaultIconColor} />
      </View>
      <Text style={[styles.settingLabel, { color: labelColor, flex: 1 }]}>{label}</Text>
      {value !== undefined ? <View style={styles.settingValue}>{value}</View> : null}
      {chevron ? <Feather name="chevron-right" size={16} color={colors.text.muted} style={{ marginLeft: 4 }} /> : null}
    </TouchableOpacity>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label, colors }: { label: string; colors: typeof lightColors }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>{label}</Text>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const biometricEnabled   = useAppStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAppStore((s) => s.setBiometricEnabled);
  const companionUseCloud  = useAppStore((s) => s.companionUseCloud);
  const setCompanionUseCloud = useAppStore((s) => s.setCompanionUseCloud);
  const ambientTrack       = useAppStore((s) => s.ambientTrack);
  const setAmbientTrack    = useAppStore((s) => s.setAmbientTrack);
  const ambientVolume      = useAppStore((s) => s.ambientVolume);
  const setAmbientVolume   = useAppStore((s) => s.setAmbientVolume);
  const lock               = useAppStore((s) => s.lock);

  const AMBIENT_OPTIONS: AmbientTrack[] = ['none', 'rain', 'lofi'];

  function handleToggleBiometric(val: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBiometricEnabled(val);
  }

  function handleToggleCloud(val: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompanionUseCloud(val);
  }

  function handleLock() {
    Alert.alert('Lock Sanctum', 'Lock and return to the lock screen?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Lock', onPress: () => lock() },
    ]);
  }

  function handleAmbientCycle() {
    const idx = AMBIENT_OPTIONS.indexOf(ambientTrack);
    const next = AMBIENT_OPTIONS[(idx + 1) % AMBIENT_OPTIONS.length]!;
    setAmbientTrack(next);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.pageHeader, { paddingTop: insets.top + 12, borderBottomColor: colors.divider }]}>
        <Text style={[styles.pageTitle, { color: colors.text.primary }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Privacy & Security ── */}
        <SectionHeader label="PRIVACY & SECURITY" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <SettingRow
            icon="lock"
            iconColor={palette.amber}
            label="Biometric unlock"
            value={
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: colors.border, true: `${palette.amber}60` }}
                thumbColor={biometricEnabled ? palette.amber : colors.text.muted}
              />
            }
            colors={colors}
          />
          <SettingRow
            icon="shield"
            iconColor={palette.success}
            label="Encryption"
            value={<Text style={[styles.valueText, { color: colors.text.muted }]}>AES-256-GCM</Text>}
            colors={colors}
          />
          <SettingRow
            icon="log-out"
            label="Lock now"
            onPress={handleLock}
            chevron
            colors={colors}
          />
        </View>

        {/* ── Ambient Sound ── */}
        <SectionHeader label="AMBIENT SOUND" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <SettingRow
            icon="music"
            iconColor={palette.dustyBlue}
            label="Track"
            value={
              <TouchableOpacity onPress={handleAmbientCycle}>
                <Text style={[styles.valueText, { color: palette.dustyBlue }]}>
                  {ambientTrack === 'none' ? 'off' : ambientTrack}
                </Text>
              </TouchableOpacity>
            }
            colors={colors}
          />
        </View>

        {/* ── AI Companion ── */}
        <SectionHeader label="AI COMPANION" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <SettingRow
            icon="cloud"
            iconColor={palette.deepMoss}
            label="Cloud AI (Pollinations)"
            value={
              <Switch
                value={companionUseCloud}
                onValueChange={handleToggleCloud}
                trackColor={{ false: colors.border, true: `${palette.deepMoss}60` }}
                thumbColor={companionUseCloud ? palette.deepMoss : colors.text.muted}
              />
            }
            colors={colors}
          />
          <View style={[styles.noteRow, { borderTopColor: colors.divider }]}>
            <Feather name="info" size={12} color={colors.text.muted} />
            <Text style={[styles.noteText, { color: colors.text.muted }]}>
              Cloud AI uses Pollinations — no account required. Prompts are sent to a third-party server. Disable for full offline privacy.
            </Text>
          </View>
        </View>

        {/* ── About ── */}
        <SectionHeader label="ABOUT" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <SettingRow
            icon="info"
            label="Version"
            value={<Text style={[styles.valueText, { color: colors.text.muted }]}>v{APP_VERSION}</Text>}
            colors={colors}
          />
          <SettingRow
            icon="heart"
            label="Open source"
            onPress={() => Linking.openURL('https://github.com/sanctum-app')}
            chevron
            colors={colors}
          />
          <SettingRow
            icon="shield"
            label="Privacy policy"
            onPress={() => Linking.openURL('https://sanctum-app.dev/privacy')}
            chevron
            colors={colors}
          />
        </View>

        {/* ── Encryption note ── */}
        <View style={[styles.encryptionNote, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="lock" size={13} color={colors.text.muted} />
          <Text style={[styles.encryptionNoteText, { color: colors.text.muted }]}>
            Your encryption key never leaves this device. Sanctum cannot access your data — not even the developer.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

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

  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
  },

  sectionHeader: {
    fontFamily: fontFamilies.ui,
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: spacing[5],
  },

  section: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
  },
  settingIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
  },
  settingValue: {
    marginLeft: 'auto',
  },
  valueText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
  },

  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noteText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    lineHeight: 16,
    flex: 1,
  },

  encryptionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[5],
    padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  encryptionNoteText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    lineHeight: 17,
    flex: 1,
  },
});
