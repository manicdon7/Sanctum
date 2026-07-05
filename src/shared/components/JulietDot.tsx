// Juliet Dot Component
// The signature design element - 9px soft-purple circle that pulses

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../../core/theme/useTheme';
import { useJulietStore } from '../../core/stores/useJulietStore';
import { animations } from '../../core/theme/animations';

interface JulietDotProps {
  size?: number;
}

export function JulietDot({ size = 9 }: JulietDotProps) {
  const { colors } = useTheme();
  const dotPulseState = useJulietStore((state) => state.dotPulseState);
  
  const scale = useSharedValue(1);

  useEffect(() => {
    let duration: number;
    
    switch (dotPulseState) {
      case 'processing':
        duration = animations.duration.julietActive; // 1.2s - she's thinking
        break;
      case 'waiting':
        duration = animations.duration.julietWaiting; // 6s - user hasn't spoken in 48h
        break;
      default:
        duration = animations.duration.julietPulse; // 4s - normal state
        break;
    }

    scale.value = withRepeat(
      withTiming(1.12, {
        duration: duration / 2,
        easing: animations.easing.breathe, // Easing.inOut(Easing.sin)
      }),
      -1, // infinite
      true // reverse (back to 1.0)
    );
  }, [dotPulseState, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: colors.juliet,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: {
    // Size and color set dynamically
  },
});