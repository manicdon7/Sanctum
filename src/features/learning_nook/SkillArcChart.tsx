import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { fontFamilies } from '@/core/theme/typography';
import { spacing } from '@/core/theme/spacing';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SkillArcChartProps {
  percentage: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  colors: any;
}

export function SkillArcChart({
  percentage,
  size = 80,
  strokeWidth = 6,
  color,
  label,
  colors,
}: SkillArcChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const progress = useSharedValue(0);

  useEffect(() => {
    // Very slow fill animation on mount (1200ms, Easing.out(Easing.cubic))
    progress.value = withTiming(percentage / 100, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated progress arc */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedCircleProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        <Text style={[styles.percentageText, { color: colors.text.primary, fontFamily: fontFamilies.ui }]}>
          {Math.round(percentage)}%
        </Text>
      </View>
      <Text style={[styles.label, { color: colors.text.secondary, fontFamily: fontFamilies.ui }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  svg: {
    position: 'absolute',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'lowercase',
  },
});
