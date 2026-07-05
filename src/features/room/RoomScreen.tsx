// Room Screen - The Heart of Sanctum
// The most important screen. It is a room. Not a dashboard.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../core/theme/useTheme';
import { useAppStore } from '../../core/stores/useAppStore';
import { useUserStore } from '../../core/stores/useUserStore';
import { useJuliet } from '../../core/juliet/useJuliet';
import { JulietDot } from '../../shared/components/JulietDot';
import { MoodDots } from '../../shared/components/MoodDots';
import { SoundOrbs } from '../../shared/components/SoundOrbs';
import { spacing } from '../../core/theme/spacing';
import { borderRadius } from '../../core/theme/radius';
import { display, ui } from '../../core/theme/typography';
import { palette } from '../../core/theme/colors';
import { shadows } from '../../core/theme/shadows';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Rotating placeholders that change daily
const placeholders = [
  "what's on your mind...",
  "say whatever...",
  "the room is listening...",
  "what happened today...",
  "how are you feeling...",
  "anything worth remembering...",
  "what's stirring...",
  "thoughts, dreams, worries...",
  "the day in brief...",
  "what matters right now...",
];

function getCurrentPlaceholder(): string {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return placeholders[dayOfYear % placeholders.length];
}

function getTimeBasedBackground(): string {
  const hour = new Date().getHours();
  
  if (hour >= 4 && hour < 7) return palette.timeOfDay.dawn;
  if (hour >= 7 && hour < 12) return palette.timeOfDay.morning;
  if (hour >= 12 && hour < 17) return palette.timeOfDay.afternoon;
  if (hour >= 17 && hour < 20) return palette.timeOfDay.evening;
  return palette.timeOfDay.night;
}

export function RoomScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userName } = useUserStore();
  const { timeOfDayBackground } = useAppStore();
  const { sendProactiveMessage } = useJuliet();
  
  const [noteText, setNoteText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Time-of-day background animation
  const backgroundProgress = useSharedValue(0);
  
  useEffect(() => {
    if (timeOfDayBackground) {
      const targetColor = getTimeBasedBackground();
      backgroundProgress.value = withTiming(1, { duration: 180000 }); // 3 minutes
    }
  }, [timeOfDayBackground]);

  // Update time every minute for background transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Send proactive message when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      sendProactiveMessage();
    }, 1000);
    return () => clearTimeout(timer);
  }, [sendProactiveMessage]);

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    if (!timeOfDayBackground) {
      return { backgroundColor: colors.bg_base };
    }
    
    const targetColor = getTimeBasedBackground();
    return {
      backgroundColor: interpolateColor(
        backgroundProgress.value,
        [0, 1],
        [colors.bg_base, targetColor]
      ),
    };
  });

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleNoteSave = () => {
    if (!noteText.trim()) return;
    
    // TODO: Save note to database
    console.log('Note saved:', noteText);
    
    // Clear input and show brief confirmation
    setNoteText('');
    setIsInputFocused(false);
  };

  return (
    <Animated.View style={[styles.container, animatedBackgroundStyle]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Status Bar Area */}
      <View style={[styles.statusArea, { paddingTop: insets.top }]}>
        <Text style={[styles.timeText, { color: colors.text_secondary }]}>
          {formatTime(currentTime)}
        </Text>
        <JulietDot />
      </View>

      {/* Upper Area - Juliet's Presence */}
      <View style={styles.upperArea}>
        {/* TODO: Show Juliet's proactive messages here */}
        <Text style={[styles.userGreeting, display.lg, { color: colors.text_secondary }]}>
          {userName || 'welcome'}
        </Text>
      </View>

      {/* Mood Dots Row */}
      <View style={styles.moodSection}>
        <MoodDots />
      </View>

      {/* Quick Entry Card */}
      <View style={styles.entrySection}>
        <View style={[
          styles.entryCard,
          {
            backgroundColor: colors.bg_card,
            ...shadows.card,
          },
          isInputFocused && styles.entryCardFocused,
        ]}>
          <TextInput
            style={[
              styles.entryInput,
              display.md,
              { color: colors.text_primary },
            ]}
            placeholder={getCurrentPlaceholder()}
            placeholderTextColor={colors.text_ghost}
            value={noteText}
            onChangeText={setNoteText}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => {
              setIsInputFocused(false);
              if (noteText.trim()) {
                handleNoteSave();
              }
            }}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          
          {isInputFocused && (
            <View style={styles.entryToolbar}>
              <TouchableOpacity style={styles.toolbarButton}>
                <Text style={[styles.toolbarIcon, { color: colors.text_muted }]}>🎤</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={handleNoteSave}
              >
                <Text style={[styles.toolbarText, ui.caption, { color: colors.text_muted }]}>
                  save
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {noteText.length === 0 && !isInputFocused && (
          <Text style={[styles.saveConfirmation, ui.micro, { color: colors.text_ghost }]}>
            {/* Shows "note saved" briefly after saving */}
          </Text>
        )}
      </View>

      {/* Sound Orbs */}
      <View style={styles.soundSection}>
        <SoundOrbs />
      </View>

      {/* Music Row */}
      <View style={styles.musicSection}>
        <TouchableOpacity style={[
          styles.musicCard,
          { backgroundColor: colors.bg_card }
        ]}>
          <View style={styles.musicContent}>
            <Text style={[styles.playIcon, { color: colors.text_muted }]}>▶</Text>
            <Text style={[styles.musicText, ui.body, { color: colors.text_muted }]}>
              music
            </Text>
            <View style={styles.waveform}>
              <View style={[styles.waveBar, { backgroundColor: colors.text_ghost }]} />
              <View style={[styles.waveBar, { backgroundColor: colors.text_ghost }]} />
              <View style={[styles.waveBar, { backgroundColor: colors.text_ghost }]} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  timeText: {
    ...ui.caption,
    fontSize: 13,
  },
  upperArea: {
    height: SCREEN_HEIGHT * 0.25, // 25% of screen
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  userGreeting: {
    textAlign: 'center',
    // Lora font, large size for intimate feeling
  },
  moodSection: {
    paddingVertical: spacing.lg,
  },
  entrySection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  entryCard: {
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    minHeight: 80,
  },
  entryCardFocused: {
    // Slight expansion when focused - TODO: add animated height
  },
  entryInput: {
    minHeight: 40,
    textAlignVertical: 'top',
    // Lora font for intimate notebook feel
  },
  entryToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  toolbarButton: {
    padding: spacing.xs,
  },
  toolbarIcon: {
    fontSize: 16,
  },
  toolbarText: {
    // DM Sans caption style
  },
  saveConfirmation: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  soundSection: {
    paddingVertical: spacing.lg,
  },
  musicSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  musicCard: {
    borderRadius: borderRadius.md,
    height: 40,
    justifyContent: 'center',
  },
  musicContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  playIcon: {
    fontSize: 12,
    marginRight: spacing.sm,
  },
  musicText: {
    flex: 1,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveBar: {
    width: 2,
    height: 8,
    borderRadius: 1,
  },
});