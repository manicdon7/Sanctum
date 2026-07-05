// Juliet Store — conversation history, streaming state
// Manages all Juliet interactions and conversation state

import { create } from 'zustand';

export interface JulietMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface JulietState {
  messages: JulietMessage[];
  currentSessionId: string | null;
  isStreaming: boolean;
  isThinking: boolean;
  lastResponse: number | null;
  dotPulseState: 'normal' | 'processing' | 'waiting'; // controls Juliet dot animation
}

export interface JulietActions {
  addMessage: (message: Omit<JulietMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setThinking: (thinking: boolean) => void;
  setDotPulseState: (state: 'normal' | 'processing' | 'waiting') => void;
  startNewSession: () => void;
  clearConversation: () => void;
}

export type JulietStore = JulietState & JulietActions;

export const useJulietStore = create<JulietStore>()((set, get) => ({
  // Initial state
  messages: [],
  currentSessionId: null,
  isStreaming: false,
  isThinking: false,
  lastResponse: null,
  dotPulseState: 'normal',
  
  // Actions
  addMessage: (message) => {
    const newMessage: JulietMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    set((state) => ({
      messages: [...state.messages, newMessage],
      lastResponse: message.role === 'assistant' ? Date.now() : state.lastResponse,
    }));
  },
  
  updateLastMessage: (content: string) => {
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage) {
        lastMessage.content = content;
      }
      
      return { messages };
    });
  },
  
  setStreaming: (streaming: boolean) => {
    set({ 
      isStreaming: streaming,
      dotPulseState: streaming ? 'processing' : 'normal',
    });
  },
  
  setThinking: (thinking: boolean) => {
    set({ 
      isThinking: thinking,
      dotPulseState: thinking ? 'processing' : 'normal',
    });
  },
  
  setDotPulseState: (state: 'normal' | 'processing' | 'waiting') => {
    set({ dotPulseState: state });
  },
  
  startNewSession: () => {
    const sessionId = `session_${Date.now()}`;
    set({ currentSessionId: sessionId });
  },
  
  clearConversation: () => {
    set({
      messages: [],
      currentSessionId: null,
      isStreaming: false,
      isThinking: false,
      lastResponse: null,
      dotPulseState: 'normal',
    });
  },
}));