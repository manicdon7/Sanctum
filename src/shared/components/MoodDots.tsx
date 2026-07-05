// Mood Dots Component  
// 5 color dots for mood selection - colors are the language

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../core/theme/useTheme';
import { useAppStore } from '../../core/stores/useAppStore';
import { spacing } from '../../core/theme/spacing';

// The 5 mood colors - gradient from cool grey-blue through warm amber to deep rose
const moodColors = [
  '#6B7B8C', // Cool grey-blue
  '#8B9B7A', // Warmer grey-green  
  '#B5A082', // Neutral warm beige
  '#C17F3E', // Warm amber
  '#B5726E', // Deep rose
] as const;

interface MoodDotsProps {
  onMoodSelect?: (moodIndex: number) => void;
}

export function MoodDots({ onMoodSelect }: MoodDotsProps) {
  const { colors } = useTheme();
  const { currentMoodIndex, setCurrentMood } = useAppStore();
  
  const scales = moodColors.map(() => useSharedValue(1));

  const handleMoodSelect = (index: number) => {
    // Light haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Spring animation for selected dot
    scales[index].value = withSpring(0.9, { damping: 8, stiffness: 400 }, () => {
      scales[index].value = withSpring(1.0, { damping: 12, stiffness: 300 });
    });
    
    setCurrentMood(index);
    onMoodSelect?.(index);
  };

  return (
    <View style={styles.container}>
      {moodColors.map((color, index) => {
        const isSelected = currentMoodIndex === index;
        
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [{ scale: scales[index].value }],
        }));
        
        return (
          <TouchableOpacity
            key={index}
            onPress={() => handleMoodSelect(index)}
            style={styles.dotContainer}
            activeOpacity={0.8}
          >
            <Animated.View style={animatedStyle}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: color,
                    width: isSelected ? 24 : 18, // Selected dot grows
                    height: isSelected ? 24 : 18,
                    borderRadius: isSelected ? 12 : 9,
                  },
                  isSelected && {
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                ]}
              />
              
              {/* Subtle glow ring for selected dot */}
              {isSelected && (
                <View
                  style={[
                    styles.glowRing,
                    {
                      borderColor: `${color}40`, // 25% opacity
                    },
                  ]}
                />
              )}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.xl,
  },
  dotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm, // Larger touch target
  },
  dot: {
    // Size set dynamically based on selection
  },
  glowRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    top: -4,
    left: -4,
  },
});