// Sounds & Music Screen
// Two sections: ambient sounds and music library

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../core/theme/useTheme';
import { useAmbiance } from '../../core/ambiance/useAmbiance';
import { ambianceTracks } from '../../core/ambiance/tracks';
import { spacing } from '../../core/theme/spacing';
import { borderRadius } from '../../core/theme/radius';
import { ui, display } from '../../core/theme/typography';

export function SoundsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    activeSounds,
    layerMode,
    masterVolume,
    toggleSound,
    setLayerMode,
    setMasterVolume,
  } = useAmbiance();

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
        {/* Ambient Sounds Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[
              styles.sectionTitle,
              ui.label,
              { color: colors.text_muted },
            ]}>
              THE ROOM
            </Text>
            
            <TouchableOpacity
              onPress={() => setLayerMode(!layerMode)}
              style={styles.layerToggle}
            >
              <Text style={[
                styles.layerToggleText,
                ui.caption,
                { color: colors.text_muted },
              ]}>
                layer sounds: {layerMode ? 'on' : 'off'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.soundGrid}>
            {ambianceTracks.map((track) => {
              const isActive = !!activeSounds[track.id]?.isPlaying;
              
              return (
                <TouchableOpacity
                  key={track.id}
                  onPress={() => toggleSound(track.id)}
                  style={[
                    styles.soundCard,
                    {
                      backgroundColor: isActive 
                        ? `${track.tint}20` 
                        : `${track.tint}08`,
                    },
                    isActive && {
                      borderColor: `${track.tint}60`,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={[styles.soundIcon, { color: track.tint }]}>
                    {track.icon}
                  </Text>
                  <Text style={[
                    styles.soundName,
                    ui.caption,
                    { color: isActive ? colors.text_primary : colors.text_secondary },
                  ]}>
                    {track.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Master Volume */}
          <View style={styles.volumeSection}>
            <Text style={[
              styles.volumeLabel,
              ui.micro,
              { color: colors.text_ghost },
            ]}>
              master volume
            </Text>
            {/* TODO: Add volume slider component */}
            <View style={[styles.volumeSlider, { backgroundColor: colors.bg_card }]}>
              <View
                style={[
                  styles.volumeFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${masterVolume * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Music Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            ui.label,
            { color: colors.text_muted },
          ]}>
            MUSIC
          </Text>
          
          {/* Juliet Suggestion Card (placeholder) */}
          <View style={[
            styles.suggestionCard,
            { backgroundColor: colors.juliet_dim },
          ]}>
            <Text style={[
              styles.suggestionText,
              display.md,
              { color: colors.juliet },
            ]}>
              the rain sounds like it might help tonight
            </Text>
            <TouchableOpacity style={styles.suggestionButton}>
              <Text style={[
                styles.suggestionButtonText,
                ui.button,
                { color: colors.juliet },
              ]}>
                put it on
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Music Library Placeholder */}
          <View style={[styles.musicPlaceholder, { backgroundColor: colors.bg_card }]}>
            <Text style={[
              styles.placeholderText,
              ui.body,
              { color: colors.text_secondary },
            ]}>
              music library access coming soon
            </Text>
            <Text style={[
              styles.placeholderSubtext,
              ui.micro,
              { color: colors.text_ghost },
            ]}>
              juliet will ask permission to access your music
            </Text>
          </View>
        </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    // ALL CAPS + letter spacing as specified
  },
  layerToggle: {
    padding: spacing.xs,
  },
  layerToggleText: {
    // Small toggle text
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  soundCard: {
    width: '48%',
    height: 100,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  soundIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  soundName: {
    textAlign: 'center',
  },
  volumeSection: {
    alignItems: 'center',
  },
  volumeLabel: {
    marginBottom: spacing.sm,
  },
  volumeSlider: {
    width: '60%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 2,
  },
  suggestionCard: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  suggestionText: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  suggestionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'currentColor',
  },
  suggestionButtonText: {
    // Button text style
  },
  musicPlaceholder: {
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  placeholderSubtext: {
    textAlign: 'center',
  },
});