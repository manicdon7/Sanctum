import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { typography, fontFamilies, fontSize } from '@/core/theme/typography';
import { spacing, radius } from '@/core/theme/spacing';
import { useAppStore } from '@/core/stores/appStore';
import { useKnowledgeStore } from '@/features/knowledge_garden/knowledgeStore';
import { FloatingToolbar } from './FloatingToolbar';
import { IdeaCard } from './IdeaCard';
import {
  calculateStrokeAttributes,
  pointsToSvgPath,
  type StrokePath,
  type Point,
} from './StrokeEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RoomStackParamList } from '@/core/navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<RoomStackParamList, 'CreationDesk'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IdeaCardState {
  id: string;
  x: number;
  y: number;
  text: string;
}

export function CanvasScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const encryptionKey = useAppStore((s) => s.encryptionKey);
  const saveGardenNote = useKnowledgeStore((s) => s.saveNote);

  // Canvas View transform properties for pan/zoom
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);

  // Drawing tools state
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState('#B87461'); // Terracotta default
  const [toolbarVisible, setToolbarVisible] = useState(true);

  // Paths list
  const [paths, setPaths] = useState<StrokePath[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  // Idea cards list
  const [ideaCards, setIdeaCards] = useState<IdeaCardState[]>([]);

  const drawingActive = useRef(false);
  const hideToolbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handles hiding/showing the floating toolbar during drawing activity
  const triggerDrawingActivity = () => {
    setToolbarVisible(false);
    if (hideToolbarTimeoutRef.current) clearTimeout(hideToolbarTimeoutRef.current);
  };

  const stopDrawingActivity = () => {
    // Show toolbar after touch pause
    hideToolbarTimeoutRef.current = setTimeout(() => {
      setToolbarVisible(true);
    }, 250);
  };

  const handleAddIdeaCard = () => {
    const id = Math.random().toString(36).slice(2);
    // Center it on screen taking current offsets into account
    const newCard: IdeaCardState = {
      id,
      x: -translateX.value + SCREEN_WIDTH / 2 - 75,
      y: -translateY.value + SCREEN_HEIGHT / 2 - 70,
      text: '',
    };
    setIdeaCards((prev) => [...prev, newCard]);
  };

  const handleUpdateIdeaCardText = (id: string, text: string) => {
    setIdeaCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, text } : card))
    );
  };

  const handleDeleteIdeaCard = (id: string) => {
    setIdeaCards((prev) => prev.filter((card) => card.id !== id));
  };

  // Draggable Sticky-note → Plant into Knowledge Garden handler
  const handlePlantIdea = async (card: IdeaCardState) => {
    if (!card.text.trim()) {
      Alert.alert('Empty note', 'Write something on the idea card before planting it.');
      return;
    }

    Alert.alert(
      'Plant in garden?',
      'This will add this note to your Knowledge Garden and open it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Plant',
          onPress: async () => {
            try {
              // Title derived from first line
              const lines = card.text.split('\n');
              const title = lines[0]?.slice(0, 40) || 'Planted Idea';
              const body = card.text;

              // Save note to SQLite DB
              const noteId = await saveGardenNote(title, body, encryptionKey);

              // Remove card from canvas
              handleDeleteIdeaCard(card.id);

              // Navigate
              navigation.navigate('NoteEditor', { noteId });
            } catch (err) {
              Alert.alert('Planting failed', 'Could not save the idea note.');
            }
          },
        },
      ]
    );
  };

  const handleClearCanvas = () => {
    Alert.alert('Clear canvas?', 'This deletes all sketches.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setPaths([]) },
    ]);
  };

  // ── Drawing Gestures ──

  const drawGesture = Gesture.Pan()
    .onStart((event) => {
      if (tool !== 'pen') return;
      drawingActive.current = true;
      triggerDrawingActivity();

      const startPoint: Point = {
        x: (event.x - translateX.value) / scale.value,
        y: (event.y - translateY.value) / scale.value,
        time: Date.now(),
      };
      setCurrentPath([startPoint]);
    })
    .onChange((event) => {
      if (!drawingActive.current) return;
      const pt: Point = {
        x: (event.x - translateX.value) / scale.value,
        y: (event.y - translateY.value) / scale.value,
        time: Date.now(),
      };
      setCurrentPath((prev) => [...prev, pt]);
    })
    .onEnd(() => {
      if (!drawingActive.current) return;
      drawingActive.current = false;
      stopDrawingActivity();

      if (currentPath.length > 1) {
        // Calculate physical attributes using speed heuristics
        const attr = calculateStrokeAttributes(currentPath, 3, penColor);
        const pathData: StrokePath = {
          id: Math.random().toString(36).slice(2),
          points: currentPath,
          color: penColor,
          widths: attr.widths,
          opacity: attr.opacity,
        };
        setPaths((prev) => [...prev, pathData]);
      }
      setCurrentPath([]);
    });

  // ── Pan/Zoom Canvas View Gestures ──

  const panCanvasGesture = Gesture.Pan()
    .onStart(() => {
      if (drawingActive.current) return;
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (drawingActive.current) return;
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    });

  const pinchCanvasGesture = Gesture.Pinch()
    .onStart(() => {
      if (drawingActive.current) return;
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      if (drawingActive.current) return;
      scale.value = Math.max(0.3, Math.min(3, startScale.value * event.scale));
    });

  // Composed Gestures
  const canvasComposedGesture = Gesture.Simultaneous(panCanvasGesture, pinchCanvasGesture);

  const canvasAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.secondary }]}>creation desk</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleClearCanvas}>
            <Feather name="trash-2" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Canvas workspace */}
      <GestureDetector gesture={tool === 'pen' ? drawGesture : canvasComposedGesture}>
        <View style={styles.canvasContainer}>
          <Animated.View style={[styles.canvasContent, canvasAnimatedStyle]}>
            {/* Draw Sketch Paths */}
            <Svg style={StyleSheet.absoluteFill}>
              {paths.map((p) => (
                <Path
                  key={p.id}
                  d={pointsToSvgPath(p.points)}
                  fill="transparent"
                  stroke={p.color}
                  strokeWidth={p.widths[0] || 3} // simple base fallback
                  opacity={p.opacity}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {/* Currently active drawing path */}
              {currentPath.length > 1 && (
                <Path
                  key="active-path"
                  d={pointsToSvgPath(currentPath)}
                  fill="transparent"
                  stroke={penColor}
                  strokeWidth={3}
                  opacity={0.95}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </Svg>

            {/* Draggable Sticky Idea Cards */}
            {ideaCards.map((card) => (
              <IdeaCard
                key={card.id}
                id={card.id}
                x={card.x}
                y={card.y}
                text={card.text}
                onChangeText={(text) => handleUpdateIdeaCardText(card.id, text)}
                onLongPress={() => handlePlantIdea(card)}
                onDelete={() => handleDeleteIdeaCard(card.id)}
                colors={colors}
              />
            ))}
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Floating Toolbar */}
      <FloatingToolbar
        activeTool={tool}
        activeColor={penColor}
        onChangeTool={setTool}
        onChangeColor={setPenColor}
        onAddIdeaCard={handleAddIdeaCard}
        onClearCanvas={handleClearCanvas}
        colors={colors}
        visible={toolbarVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    zIndex: 10,
  },
  title: { ...typography.caption, fontFamily: fontFamilies.ui, letterSpacing: 1.5 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  canvasContent: {
    width: SCREEN_WIDTH * 3,
    height: SCREEN_HEIGHT * 3,
    // Start centered in the massive virtual workspace
    left: -SCREEN_WIDTH,
    top: -SCREEN_HEIGHT,
  },
});
