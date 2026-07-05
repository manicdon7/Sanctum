// Main Juliet Hook
// Central interface for all Juliet interactions

import { useCallback, useEffect } from 'react';
import { useJulietStore } from '../stores/useJulietStore';
import { useUserStore } from '../stores/useUserStore';
import { useAppStore } from '../stores/useAppStore';
import { useAmbianceStore } from '../stores/useAmbianceStore';
import { pollinations, ChatMessage } from './pollinations';
import { buildSystemPrompt } from './systemPrompt';
import { contextSummary } from './contextSummary';

export function useJuliet() {
  const julietStore = useJulietStore();
  const userStore = useUserStore();
  const appStore = useAppStore();
  const ambianceStore = useAmbianceStore();

  // Calculate room state for system prompt
  const getRoomState = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: string;
    if (hour >= 4 && hour < 7) timeOfDay = 'dawn';
    else if (hour >= 7 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 20) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const activeSounds = Object.keys(ambianceStore.activeSounds);
    const daysSinceFirst = appStore.lastNoteTimestamp 
      ? Math.floor((Date.now() - appStore.lastNoteTimestamp) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      mood: appStore.currentMoodIndex,
      timeOfDay,
      activeAmbiance: activeSounds,
      lastNoteTimestamp: appStore.lastNoteTimestamp,
      daysSinceFirstSession: daysSinceFirst,
    };
  }, [appStore.currentMoodIndex, appStore.lastNoteTimestamp, ambianceStore.activeSounds]);

  // Send message to Juliet
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message immediately
    julietStore.addMessage({
      role: 'user',
      content: content.trim(),
    });

    // Start Juliet's thinking state
    julietStore.setThinking(true);

    try {
      // Build conversation history for API
      const messages: ChatMessage[] = [];
      
      // Add system prompt with current context
      const contextData = await contextSummary.read();
      const roomState = getRoomState();
      const systemPrompt = buildSystemPrompt(
        contextSummary.formatForPrompt(contextData),
        roomState
      );
      
      messages.push({
        role: 'system',
        content: systemPrompt,
      });

      // Add recent conversation history (last 10 messages)
      const recentMessages = julietStore.messages.slice(-10);
      recentMessages.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      // Add the current message
      messages.push({
        role: 'user',
        content: content.trim(),
      });

      // Wait for Juliet's thinking pause (600-1200ms)
      const thinkingDelay = 600 + Math.random() * 600;
      await new Promise(resolve => setTimeout(resolve, thinkingDelay));

      julietStore.setThinking(false);
      julietStore.setStreaming(true);

      // Add empty assistant message for streaming
      julietStore.addMessage({
        role: 'assistant',
        content: '',
      });

      // Stream response
      let fullResponse = '';
      for await (const chunk of pollinations.streamChat(messages)) {
        fullResponse = chunk.content;
        julietStore.updateLastMessage(fullResponse);

        if (chunk.finished) {
          break;
        }

        // Small delay between chunks for natural typing feel
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Update context after meaningful conversations
      if (julietStore.messages.length >= 4) {
        const conversationText = julietStore.messages
          .slice(-6) // Last 6 messages
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        contextSummary.update(conversationText, contextData);
      }

    } catch (error) {
      console.error('Juliet error:', error);
      
      // Add error fallback message
      julietStore.addMessage({
        role: 'assistant',
        content: "i'm a bit quiet tonight — something's not connecting right. but i'm still here.",
      });
    } finally {
      julietStore.setStreaming(false);
      julietStore.setThinking(false);
    }
  }, [julietStore, getRoomState]);

  // Proactive message when user opens room
  const sendProactiveMessage = useCallback(async () => {
    const now = Date.now();
    const lastResponse = julietStore.lastResponse;
    
    // Only send proactive messages if:
    // 1. No recent conversation (>4 hours)
    // 2. Not already in a conversation
    // 3. User has been away for a while
    
    if (lastResponse && (now - lastResponse) < 4 * 60 * 60 * 1000) {
      return; // Recent conversation exists
    }

    if (julietStore.messages.length > 0 && julietStore.messages[julietStore.messages.length - 1].role === 'assistant') {
      return; // Last message was from Juliet
    }

    const roomState = getRoomState();
    const contextData = await contextSummary.read();
    
    // Build a simple greeting based on context
    let greeting = '';
    
    if (roomState.timeOfDay === 'morning') {
      greeting = 'hey. how\'s the morning treating you?';
    } else if (roomState.timeOfDay === 'evening') {
      greeting = 'hey. how was today?';
    } else if (roomState.timeOfDay === 'night') {
      greeting = 'hey. late night?';
    } else {
      greeting = 'hey.';
    }

    // Add some context-aware variations
    if (contextData.last_mood_pattern && contextData.last_mood_pattern.includes('tired')) {
      greeting = 'you\'ve been up late a few nights in a row.';
    }

    julietStore.addMessage({
      role: 'assistant',
      content: greeting,
    });
  }, [julietStore, getRoomState]);

  // Web search capability
  const searchWeb = useCallback(async (query: string) => {
    try {
      julietStore.setThinking(true);
      
      julietStore.addMessage({
        role: 'assistant',
        content: 'let me look that up...',
      });

      const result = await pollinations.searchWeb(query);
      
      julietStore.addMessage({
        role: 'assistant',
        content: result,
      });
      
    } catch (error) {
      julietStore.addMessage({
        role: 'assistant',
        content: 'i couldn\'t search for that right now — no signal. but i\'m still here.',
      });
    } finally {
      julietStore.setThinking(false);
    }
  }, [julietStore]);

  // Update dot pulse state based on user activity
  useEffect(() => {
    const now = Date.now();
    const lastResponse = julietStore.lastResponse;
    
    if (!lastResponse) {
      julietStore.setDotPulseState('normal');
      return;
    }
    
    const hoursSinceLastResponse = (now - lastResponse) / (1000 * 60 * 60);
    
    if (hoursSinceLastResponse > 48) {
      julietStore.setDotPulseState('waiting');
    } else {
      julietStore.setDotPulseState('normal');
    }
  }, [julietStore.lastResponse]);

  return {
    messages: julietStore.messages,
    isStreaming: julietStore.isStreaming,
    isThinking: julietStore.isThinking,
    dotPulseState: julietStore.dotPulseState,
    companionName: userStore.companionName,
    sendMessage,
    sendProactiveMessage,
    searchWeb,
    clearConversation: julietStore.clearConversation,
  };
}