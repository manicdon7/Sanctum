import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { fontFamilies, fontSize, fontWeight } from '@/core/theme/typography';
import { spacing, radius, layout } from '@/core/theme/spacing';
import { useKnowledgeStore } from './knowledgeStore';
import { useAppStore } from '@/core/stores/appStore';
import { type RoomStackParamList } from '@/core/navigation/AppNavigator';

type NoteEditorRouteProp = RouteProp<RoomStackParamList, 'NoteEditor'>;

const FORMATTING_TOOLS = [
  { icon: 'bold' as const,       prefix: '**', suffix: '**' },
  { icon: 'italic' as const,     prefix: '_',  suffix: '_'  },
  { icon: 'link' as const,       prefix: '[',  suffix: '](url)' },
  { icon: 'minus' as const,      prefix: '\n- ', suffix: '' },
  { icon: 'hash' as const,       prefix: '\n# ', suffix: '' },
] as const;

export function NoteEditorScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<NoteEditorRouteProp>();
  const noteId = route.params?.noteId;

  const encryptionKey = useAppStore((s) => s.encryptionKey);
  const { notes, saveNote, updateNote, deleteNote } = useKnowledgeStore();

  const [title, setTitle]   = useState('');
  const [body, setBody]     = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const saveBtnOpacity = useSharedValue(0);

  useEffect(() => {
    if (noteId) {
      const note = notes.find((n) => n.id === noteId);
      if (note) { setTitle(note.title); setBody(note.body); }
    }
  }, [noteId, notes]);

  useEffect(() => {
    const words = body.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    saveBtnOpacity.value = withTiming(title.trim() ? 1 : 0, { duration: 200 });
  }, [body, title]);

  const handleBodyChange = useCallback((text: string) => {
    setBody(text);
  }, []);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Give your note a title.');
      return;
    }
    setIsSaving(true);
    try {
      if (noteId) {
        await updateNote(noteId, title, body, encryptionKey);
      } else {
        await saveNote(title, body, encryptionKey);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch {
      Alert.alert('Save failed', 'Could not save this note.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!noteId) return;
    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(noteId);
          navigation.goBack();
        },
      },
    ]);
  }

  const saveBtnStyle = useAnimatedStyle(() => ({
    opacity: saveBtnOpacity.value,
  }));

  const accentColor = palette.deepMoss;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.wordCount, { color: colors.text.muted }]}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {noteId ? (
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.headerAction}
            >
              <Feather name="trash-2" size={17} color={palette.crisis} />
            </TouchableOpacity>
          ) : null}
          <Animated.View style={saveBtnStyle}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accentColor }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>{isSaving ? 'saving…' : 'save'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Editor */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.editorArea, { paddingBottom: insets.bottom + 80 }]}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {/* Title input */}
        <TextInput
          style={[styles.titleInput, { color: colors.text.primary }]}
          placeholder="Note title"
          placeholderTextColor={colors.text.muted}
          value={title}
          onChangeText={setTitle}
          autoFocus={!noteId}
          returnKeyType="next"
          multiline={false}
        />

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Body textarea */}
        <TextInput
          style={[styles.bodyInput, { color: colors.text.primary }]}
          placeholder="Start writing… markdown is supported"
          placeholderTextColor={colors.text.muted}
          value={body}
          onChangeText={handleBodyChange}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
          autoCorrect
          autoCapitalize="sentences"
          selectionColor={`${accentColor}80`}
        />
      </ScrollView>

      {/* Formatting toolbar */}
      <View style={[styles.toolbar, { backgroundColor: colors.surfaceRaised, borderTopColor: colors.divider, paddingBottom: insets.bottom + 4 }]}>
        {FORMATTING_TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.icon}
            style={styles.toolBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setBody((prev) => `${prev}${tool.prefix}${tool.suffix}`);
            }}
          >
            <Feather name={tool.icon} size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        ))}
        <View style={styles.toolbarSpacer} />
        <TouchableOpacity
          style={[styles.toolBtn, { backgroundColor: `${accentColor}15` }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Feather name="check" size={16} color={accentColor} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  wordCount: { fontFamily: fontFamilies.ui, fontSize: fontSize.xs },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  headerAction: { padding: 4 },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  saveBtnText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: palette.white,
  },

  editorArea: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[5],
  },
  titleInput: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.xl,
    fontWeight: '400',
    letterSpacing: -0.3,
    marginBottom: spacing[4],
    padding: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing[4],
  },
  bodyInput: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.75,
    minHeight: 320,
    padding: 0,
    textAlignVertical: 'top',
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarSpacer: { flex: 1 },
});
