import React, { useState } from 'react';
import { View, TextInput, StyleSheet, PanResponder, Text, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, TouchableOpacity } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';

import { fontFamilies, fontSize } from '@/core/theme/typography';
import { radius, spacing } from '@/core/theme/spacing';

interface IdeaCardProps {
  id: string;
  x: number;
  y: number;
  text: string;
  onChangeText: (text: string) => void;
  onLongPress: () => void;
  onDelete: () => void;
  colors: any;
}

export function IdeaCard({
  id: _id,
  x,
  y,
  text,
  onChangeText,
  onLongPress,
  onDelete,
  colors,
}: IdeaCardProps) {
  const isDark = colors.background === '#1C1815';

  // Draggable offsets
  const offsetX = useSharedValue(x);
  const offsetY = useSharedValue(y);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const dragGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.05);
    })
    .onChange((event) => {
      offsetX.value += event.changeX;
      offsetY.value += event.changeY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      onLongPress();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const composedGesture = Gesture.Exclusive(dragGesture, longPressGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#2E271F' : '#FFF9F2',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          },
          animatedStyle,
        ]}
      >
        <View style={styles.cardHeader}>
          <Feather name="anchor" size={12} color={colors.text.muted} />
          <TouchableOpacityBtn icon="x" size={12} color={colors.text.muted} onPress={onDelete} />
        </View>

        <TextInput
          style={[styles.input, { color: colors.text.primary, fontFamily: fontFamilies.journal }]}
          placeholder="write idea…"
          placeholderTextColor={colors.text.muted}
          value={text}
          onChangeText={onChangeText}
          multiline
        />

        <Text style={[styles.hintText, { color: colors.text.muted }]}>
          hold to plant in garden
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

// Simple button helper inside components to keep standard compatibility
function TouchableOpacityBtn({ icon, size, color, onPress }: { icon: any; size: number; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Feather name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: 150,
    minHeight: 140,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing[3],
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  input: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  hintText: {
    fontFamily: fontFamilies.ui,
    fontSize: 9,
    letterSpacing: 0.3,
    marginTop: spacing[2],
    opacity: 0.6,
    textTransform: 'lowercase',
  },
});
