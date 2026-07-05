// User Store — profile, companion name, context
// Handles the persistent user context that makes Juliet remember

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserContextData {
  name?: string;
  age?: number;
  things_they_care_about: string[];
  things_they_struggle_with: string[];
  current_situation: string;
  communication_preferences: string;
  recent_topics: string[];
  last_mood_pattern: string;
  notes: string; // freeform, updated by Juliet
}

export interface UserState {
  userName: string | null;
  companionName: string;
  contextData: UserContextData;
  lastContextUpdate: number | null;
}

export interface UserActions {
  setUserName: (name: string) => void;
  setCompanionName: (name: string) => void;
  updateContext: (updates: Partial<UserContextData>) => void;
  resetContext: () => void;
}

export type UserStore = UserState & UserActions;

const initialContextData: UserContextData = {
  things_they_care_about: [],
  things_they_struggle_with: [],
  current_situation: '',
  communication_preferences: '',
  recent_topics: [],
  last_mood_pattern: '',
  notes: '',
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      userName: null,
      companionName: 'Juliet',
      contextData: initialContextData,
      lastContextUpdate: null,
      
      // Actions
      setUserName: (name: string) => {
        set({ userName: name });
      },
      
      setCompanionName: (name: string) => {
        set({ companionName: name });
      },
      
      updateContext: (updates: Partial<UserContextData>) => {
        const currentContext = get().contextData;
        const updatedContext = { ...currentContext, ...updates };
        
        set({ 
          contextData: updatedContext,
          lastContextUpdate: Date.now(),
        });
      },
      
      resetContext: () => {
        set({ 
          contextData: initialContextData,
          lastContextUpdate: Date.now(),
        });
      },
    }),
    {
      name: 'sanctum-user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);