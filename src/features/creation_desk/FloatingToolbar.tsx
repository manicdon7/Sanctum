import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { radius, spacing } from '@/core/theme/spacing';
import { springs } from '@/core/theme/animations';

interface FloatingToolbarProps {
  activeTool: 'pen' | 'eraser';
  activeColor: string;
  onChangeTool: (tool: 'pen' | 'eraser') => void;
  onChangeColor: (color: string) => void;
  onAddIdeaCard: () => void;
  onClearCanvas: () => void;
  colors: any;
  visible: boolean;
}

export function FloatingToolbar({
  activeTool,
  activeColor,
  onChangeTool,
  onChangeColor,
  onAddIdeaCard,
  onClearCanvas,
  colors,
  visible,
}: FloatingToolbarProps) {
  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Slides in from the bottom with spring on screen mount,
    // and hides/shows based on drawing active status.
    translateY.value = withSpring(visible ? 0 : 70, springs.default);
    opacity.value = withTiming(visible ? 1 : 0, { duration: 250 });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const colorSwatches = ['#B87461', '#7B9BAF', '#7A9E7E', '#D4903A'];

  return (
    <Animated.View
      style={[
        styles.toolbar,
        { backgroundColor: colors.surface, borderColor: colors.border },
        animatedStyle,
      ]}
    >
      {/* Pen Tool */}
      <TouchableOpacity
        style={[styles.toolBtn, activeTool === 'pen' && { backgroundColor: `${colors.rooms.creation}20` }]}
        onPress={() => onChangeTool('pen')}
      >
        <Feather name="edit-3" size={18} color={activeTool === 'pen' ? colors.rooms.creation : colors.text.secondary} />
      </TouchableOpacity>

      {/* Eraser Tool */}
      <TouchableOpacity
        style={[styles.toolBtn, activeTool === 'eraser' && { backgroundColor: `${colors.rooms.creation}20` }]}
        onPress={() => onChangeTool('eraser')}
      >
        <Feather name="trash-2" size={18} color={activeTool === 'eraser' ? colors.rooms.creation : colors.text.secondary} />
      </TouchableOpacity>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Swatches (only show when pen active) */}
      {activeTool === 'pen' && (
        <View style={styles.swatchRow}>
          {colorSwatches.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.swatch,
                { backgroundColor: color },
                activeColor === color && styles.swatchSelected,
              ]}
              onPress={() => onChangeColor(color)}
            />
          ))}
        </View>
      )}

      {/* Divider */}
      {activeTool === 'pen' && <View style={[styles.divider, { backgroundColor: colors.border }]} />}

      {/* Sticky Note / Idea Card Creator */}
      <TouchableOpacity style={styles.toolBtn} onPress={onAddIdeaCard}>
        <Feather name="file-text" size={18} color={colors.text.secondary} />
      </TouchableOpacity>

      {/* Clear Canvas */}
      <TouchableOpacity style={styles.toolBtn} onPress={onClearCanvas}>
        <Feather name="refresh-cw" size={16} color={colors.text.secondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
  },
  swatchSelected: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
