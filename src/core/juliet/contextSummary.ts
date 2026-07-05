// User Context Summary Management
// Handles reading, writing, and updating the persistent context that makes Juliet remember

import * as SecureStore from 'expo-secure-store';
import { UserContextData, useUserStore } from '../stores/useUserStore';
import { pollinations } from './pollinations';

const CONTEXT_KEY = 'juliet_user_context';

export class ContextSummary {
  static async read(): Promise<UserContextData> {
    try {
      const stored = await SecureStore.getItemAsync(CONTEXT_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to read user context:', error);
    }
    
    // Return empty context if none found
    return {
      things_they_care_about: [],
      things_they_struggle_with: [],
      current_situation: '',
      communication_preferences: '',
      recent_topics: [],
      last_mood_pattern: '',
      notes: '',
    };
  }

  static async write(context: UserContextData): Promise<void> {
    try {
      await SecureStore.setItemAsync(CONTEXT_KEY, JSON.stringify(context));
    } catch (error) {
      console.error('Failed to write user context:', error);
    }
  }

  static async update(
    conversationHistory: string,
    currentContext: UserContextData
  ): Promise<UserContextData> {
    // Use Juliet to analyze the conversation and update context
    const analysisPrompt = `Based on this conversation and existing context, update what you know about this person. Focus on:
- Things they care about (interests, values, people)
- Things they struggle with (challenges, fears, patterns)
- Their current situation (work, relationships, life phase)
- How they prefer to communicate
- Recent topics they've mentioned
- Their mood patterns

Be concise but insightful. Only include things that seem genuinely important to remember.

Existing context:
${JSON.stringify(currentContext, null, 2)}

Recent conversation:
${conversationHistory}

Respond with updated JSON in this exact format:
{
  "name": "their name if mentioned",
  "age": number or null,
  "things_they_care_about": ["item1", "item2"],
  "things_they_struggle_with": ["struggle1", "struggle2"], 
  "current_situation": "brief description",
  "communication_preferences": "how they like to communicate",
  "recent_topics": ["topic1", "topic2"],
  "last_mood_pattern": "recent emotional pattern",
  "notes": "any other important observations"
}`;

    try {
      const response = await pollinations.quickResponse(analysisPrompt);
      
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const updatedContext = JSON.parse(jsonMatch[0]) as UserContextData;
        
        // Merge with existing context, preserving important fields
        const mergedContext: UserContextData = {
          ...currentContext,
          ...updatedContext,
          // Combine arrays instead of replacing
          things_they_care_about: [
            ...new Set([
              ...currentContext.things_they_care_about,
              ...updatedContext.things_they_care_about,
            ])
          ].slice(-10), // Keep last 10 items
          things_they_struggle_with: [
            ...new Set([
              ...currentContext.things_they_struggle_with,
              ...updatedContext.things_they_struggle_with,
            ])
          ].slice(-10),
          recent_topics: updatedContext.recent_topics.slice(-5), // Keep last 5 topics
        };

        await this.write(mergedContext);
        
        // Update the store as well
        useUserStore.getState().updateContext(mergedContext);
        
        return mergedContext;
      }
    } catch (error) {
      console.error('Failed to update context:', error);
    }

    // Return unchanged context if update fails
    return currentContext;
  }

  static formatForPrompt(context: UserContextData): string {
    if (!context || Object.keys(context).length === 0) {
      return 'No context available yet — this is a new user.';
    }

    const parts: string[] = [];
    
    if (context.name) {
      parts.push(`Name: ${context.name}`);
    }
    
    if (context.age) {
      parts.push(`Age: ${context.age}`);
    }
    
    if (context.things_they_care_about.length > 0) {
      parts.push(`Cares about: ${context.things_they_care_about.join(', ')}`);
    }
    
    if (context.things_they_struggle_with.length > 0) {
      parts.push(`Struggles with: ${context.things_they_struggle_with.join(', ')}`);
    }
    
    if (context.current_situation) {
      parts.push(`Current situation: ${context.current_situation}`);
    }
    
    if (context.communication_preferences) {
      parts.push(`Communication style: ${context.communication_preferences}`);
    }
    
    if (context.recent_topics.length > 0) {
      parts.push(`Recent topics: ${context.recent_topics.join(', ')}`);
    }
    
    if (context.last_mood_pattern) {
      parts.push(`Mood pattern: ${context.last_mood_pattern}`);
    }
    
    if (context.notes) {
      parts.push(`Notes: ${context.notes}`);
    }

    return parts.join('\n');
  }

  static async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(CONTEXT_KEY);
      useUserStore.getState().resetContext();
    } catch (error) {
      console.error('Failed to clear context:', error);
    }
  }
}

export const contextSummary = ContextSummary;