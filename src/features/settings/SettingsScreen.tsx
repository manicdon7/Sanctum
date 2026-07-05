// Settings Screen
// A quiet, honest screen. Not a control panel.

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../core/theme/useTheme';
import { useAppStore } from '../../core/stores/useAppStore';
import { useUserStore } from '../../core/stores/useUserStore';
import { spacing } from '../../core/theme/spacing';
import { borderRadius } from '../../core/theme/radius';
import { ui, display } from '../../core/theme/typography';

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingSection({ title, children }: SettingSectionProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.section}>
      <Text style={[
        styles.sectionTitle,
        ui.label,
        { color: colors.text_muted },
      ]}>
        {title}
      </Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

interface SettingItemProps {
  label: string;
  value?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

function SettingItem({ label, value, onPress, children }: SettingItemProps) {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.divider }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.settingLabel, ui.body, { color: colors.text_primary }]}>
        {label}
      </Text>
      {value && (
        <Text style={[styles.settingValue, ui.body, { color: colors.text_secondary }]}>
          {value}
        </Text>
      )}
      {children}
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const {
    colorScheme,
    timeOfDayBackground,
    reduceAnimations,
    biometricEnabled,
    setColorScheme,
    setTimeOfDayBackground,
    setReduceAnimations,
    setBiometricEnabled,
  } = useAppStore();
  
  const {
    companionName,
    setCompanionName,
    resetContext,
  } = useUserStore();
  
  const [editingCompanionName, setEditingCompanionName] = useState(false);
  const [tempCompanionName, setTempCompanionName] = useState(companionName);

  const handleCompanionNameSave = () => {
    if (tempCompanionName.trim()) {
      setCompanionName(tempCompanionName.trim());
    }
    setEditingCompanionName(false);
  };

  const handleContextReset = () => {
    Alert.alert(
      'Forget Everything',
      'This will clear everything Juliet knows about you. Your conversations will remain, but her memory of your patterns and preferences will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetContext,
        },
      ]
    );
  };

  const handleDataExport = () => {
    // TODO: Implement data export
    Alert.alert('Export Data', 'Data export feature coming soon.');
  };

  const handleDataClear = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your notes, conversations, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement full data clear
            Alert.alert('Data Clear', 'Full data clearing coming soon.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_base }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg_base} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        {/* Your Room */}
        <SettingSection title="YOUR ROOM">
          <SettingItem
            label="Theme"
            value={colorScheme === 'system' ? 'Follow System' : colorScheme === 'dark' ? 'Dark' : 'Light'}
            onPress={() => {
              // TODO: Show theme picker
            }}
          />
          
          <SettingItem label="Time-of-day background">
            <TouchableOpacity
              onPress={() => setTimeOfDayBackground(!timeOfDayBackground)}
              style={[
                styles.toggle,
                timeOfDayBackground && { backgroundColor: colors.accent },
              ]}
            >
              <View style={[
                styles.toggleKnob,
                {
                  backgroundColor: timeOfDayBackground ? colors.bg_base : colors.text_ghost,
                  transform: [{ translateX: timeOfDayBackground ? 16 : 0 }],
                },
              ]} />
            </TouchableOpacity>
          </SettingItem>
          
          <SettingItem label="Reduce animations">
            <TouchableOpacity
              onPress={() => setReduceAnimations(!reduceAnimations)}
              style={[
                styles.toggle,
                reduceAnimations && { backgroundColor: colors.accent },
              ]}
            >
              <View style={[
                styles.toggleKnob,
                {
                  backgroundColor: reduceAnimations ? colors.bg_base : colors.text_ghost,
                  transform: [{ translateX: reduceAnimations ? 16 : 0 }],
                },
              ]} />
            </TouchableOpacity>
          </SettingItem>
        </SettingSection>

        {/* Juliet */}
        <SettingSection title={companionName.toUpperCase()}>
          <SettingItem label="Her name">
            {editingCompanionName ? (
              <TextInput
                style={[styles.nameInput, ui.body, { color: colors.text_primary }]}
                value={tempCompanionName}
                onChangeText={setTempCompanionName}
                onSubmitEditing={handleCompanionNameSave}
                onBlur={handleCompanionNameSave}
                autoFocus
                maxLength={20}
              />
            ) : (
              <TouchableOpacity onPress={() => setEditingCompanionName(true)}>
                <Text style={[ui.body, { color: colors.text_secondary }]}>
                  {companionName}
                </Text>
              </TouchableOpacity>
            )}
          </SettingItem>
          
          <SettingItem
            label="Context reset"
            onPress={handleContextReset}
          >
            <Text style={[styles.destructiveText, ui.caption, { color: colors.danger }]}>
              forget what you know about me
            </Text>
          </SettingItem>
        </SettingSection>

        {/* Privacy */}
        <SettingSection title="PRIVACY">
          <SettingItem label="Lock with biometrics">
            <TouchableOpacity
              onPress={() => setBiometricEnabled(!biometricEnabled)}
              style={[
                styles.toggle,
                biometricEnabled && { backgroundColor: colors.accent },
              ]}
            >
              <View style={[
                styles.toggleKnob,
                {
                  backgroundColor: biometricEnabled ? colors.bg_base : colors.text_ghost,
                  transform: [{ translateX: biometricEnabled ? 16 : 0 }],
                },
              ]} />
            </TouchableOpacity>
          </SettingItem>
          
          <View style={styles.privacyNote}>
            <Text style={[
              styles.privacyNoteText,
              ui.micro,
              { color: colors.text_ghost },
            ]}>
              everything stays here
            </Text>
            <Text style={[
              styles.privacyNoteSubtext,
              ui.micro,
              { color: colors.text_ghost },
            ]}>
              your notes, conversations, and everything juliet knows about you live only on this phone. nothing is sent anywhere, ever.
            </Text>
          </View>
        </SettingSection>

        {/* Your Data */}
        <SettingSection title="YOUR DATA">
          <SettingItem
            label="Export everything"
            onPress={handleDataExport}
          />
          
          <SettingItem
            label="Clear all data"
            onPress={handleDataClear}
          >
            <Text style={[styles.destructiveText, ui.caption, { color: colors.danger }]}>
              delete everything
            </Text>
          </SettingItem>
        </SettingSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl * 2,
  },
  sectionTitle: {
    marginBottom: spacing.lg,
    // ALL CAPS + letter spacing as specified
  },
  sectionContent: {
    // Container for section items
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {
    flex: 1,
  },
  settingValue: {
    marginLeft: spacing.md,
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  nameInput: {
    textAlign: 'right',
    minWidth: 80,
  },
  destructiveText: {
    fontStyle: 'italic',
  },
  privacyNote: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  privacyNoteText: {
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  privacyNoteSubtext: {
    lineHeight: 16,
  },
});