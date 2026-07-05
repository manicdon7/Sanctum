// Sound Orbs Component
// Horizontal row of softly glowing orbs for ambient sound control

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../core/theme/useTheme';
import { useAmbiance } from '../../core/ambiance/useAmbiance';
import { roomTracks } from '../../core/ambiance/tracks';
import { spacing } from '../../core/theme/spacing';
import { borderRadius } from '../../core/theme/radius';
import { ui } from '../../core/theme/typography';

interface SoundOrbProps {
  trackId: string;
  name: string;
  icon: string;
  tint: string;
  isActive: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
}

function SoundOrb({ trackId, name, icon, tint, isActive, onToggle, onLongPress }: SoundOrbProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Pulse animation for active orbs
  React.useEffect(() => {
    if (isActive) {
      pulseScale.value = withRepeat(
        withTiming(1.06, { duration: 2000 }),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isActive]);

  const handlePress = () => {
    // Light haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Press animation
    scale.value = withSpring(0.92, { damping: 10, stiffness: 400 }, () => {
      scale.value = withSpring(1.0, { damping: 12, stiffness: 300 });
    });
    
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { scale: pulseScale.value },
    ],
  }));

  const tintColor = isActive ? tint : `${tint}60`; // 38% opacity when inactive

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={styles.orbContainer}
    >
      <Animated.View style={animatedStyle}>
        <View
          style={[
            styles.orb,
            {
              backgroundColor: `${tintColor}20`, // 12% opacity background
              borderColor: isActive ? `${tint}60` : 'transparent',
            },
          ]}
        >
          {/* Icon placeholder - in real implementation, use phosphor icons */}
          <Text style={[styles.icon, { color: tintColor }]}>
            {icon}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function SoundOrbs() {
  const { toggleSound, activeSounds } = useAmbiance();

  return (
    <View style={styles.container}>
      <View style={styles.orbRow}>
        {roomTracks.map((track) => (
          <SoundOrb
            key={track.id}
            trackId={track.id}
            name={track.name}
            icon={track.icon}
            tint={track.tint}
            isActive={!!activeSounds[track.id]?.isPlaying}
            onToggle={() => toggleSound(track.id)}
            onLongPress={() => {
              // TODO: Show volume slider for this sound
            }}
          />
        ))}
        
        {/* "..." orb for full sounds screen */}
        <TouchableOpacity
          style={styles.orbContainer}
          onPress={() => {
            // TODO: Navigate to full Sounds screen
          }}
        >
          <View style={[styles.orb, styles.moreOrb]}>
            <Text style={styles.moreIcon}>⋯</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  orbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orbContainer: {
    alignItems: 'center',
    padding: spacing.xs, // Larger touch target
  },
  orb: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.orb,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOrb: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  icon: {
    fontSize: 20,
    // In real implementation, replace with phosphor icons
  },
  moreIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
  },
});