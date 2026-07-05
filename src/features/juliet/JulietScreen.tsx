// Juliet Conversation Screen
// Full conversation interface - not a chatbot, but a quiet conversation

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Microphone, PaperPlaneRight } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../core/theme/useTheme';
import { useJuliet } from '../../core/juliet/useJuliet';
import { useUserStore } from '../../core/stores/useUserStore';
import { JulietDot } from '../../shared/components/JulietDot';
import { display, ui } from '../../core/theme/typography';
import { spacing } from '../../core/theme/spacing';
import { borderRadius } from '../../core/theme/radius';
import { JulietMessage } from '../../core/stores/useJulietStore';

interface MessageBubbleProps {
  message: JulietMessage;
  colors: any;
}

function MessageBubble({ message, colors }: MessageBubbleProps) {
  const isJuliet = message.role === 'assistant';
  
  return (
    <View style={[
      styles.messageContainer,
      isJuliet ? styles.julietMessageContainer : styles.userMessageContainer,
    ]}>
      {isJuliet && (
        <View style={[styles.julietIndicator, { backgroundColor: colors.juliet }]} />
      )}
      
      <View style={[
        styles.messageBubble,
        isJuliet ? {
          backgroundColor: colors.juliet_dim,
          borderBottomLeftRadius: 4,
        } : {
          backgroundColor: colors.bg_card,
          borderBottomRightRadius: 4,
        },
      ]}>
        <Text style={[
          isJuliet ? display.md : ui.body,
          { color: colors.text_primary },
        ]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export function JulietScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { companionName } = useUserStore();
  const { messages, isStreaming, isThinking, sendMessage } = useJuliet();
  
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim() && !isStreaming && !isThinking) {
      sendMessage(inputText.trim());
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: JulietMessage }) => (
    <MessageBubble message={item} colors={colors} />
  );

  const renderThinkingIndicator = () => {
    if (!isThinking) return null;
    
    return (
      <View style={styles.thinkingContainer}>
        <View style={[styles.julietIndicator, { backgroundColor: colors.juliet }]} />
        <View style={[styles.thinkingBubble, { backgroundColor: colors.juliet_dim }]}>
          <Text style={[styles.thinkingDots, { color: colors.juliet }]}>
            ⋯
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bg_base }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg_base} />
      
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor: colors.bg_base,
          paddingTop: insets.top,
          borderBottomColor: colors.divider,
        },
      ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={colors.text_secondary} />
        </TouchableOpacity>
        
        <Text style={[
          styles.headerTitle,
          ui.body,
          { color: colors.text_secondary },
        ]}>
          {companionName}
        </Text>
        
        <JulietDot size={9} />
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderThinkingIndicator}
      />

      {/* Input */}
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: colors.bg_elevated,
          borderTopColor: colors.divider,
          paddingBottom: insets.bottom,
        },
      ]}>
        <TouchableOpacity style={styles.voiceButton}>
          <Microphone size={20} color={colors.text_muted} />
        </TouchableOpacity>
        
        <TextInput
          style={[
            styles.textInput,
            ui.body,
            { color: colors.text_primary },
          ]}
          placeholder="say anything..."
          placeholderTextColor={colors.text_ghost}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          multiline
          maxLength={500}
        />
        
        {inputText.trim().length > 0 && (
          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendButton}
            disabled={isStreaming || isThinking}
          >
            <PaperPlaneRight 
              size={20} 
              color={colors.accent} 
              weight="regular"
            />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 14,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  messageContainer: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  julietMessageContainer: {
    alignSelf: 'flex-start',
    marginRight: spacing.xl,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    marginLeft: spacing.xl,
  },
  julietIndicator: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: spacing.sm,
    marginBottom: 2,
  },
  messageBubble: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    maxWidth: '85%',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  thinkingBubble: {
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: 4,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  thinkingDots: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 0.5,
  },
  voiceButton: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.sm,
  },
  sendButton: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
});