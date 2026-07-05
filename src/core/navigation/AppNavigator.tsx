import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CustomTabBar } from './CustomTabBar';
import { RoomScreen }              from '@/features/room/RoomScreen';
import { GrowthScreen }            from '@/features/growth/GrowthScreen';
import { VaultScreen }             from '@/features/vault/VaultScreen';
import { SettingsScreen }          from '@/features/settings/SettingsScreen';
import { VentCornerScreen }        from '@/features/vent_corner/VentCornerScreen';
import { LearningNookScreen }      from '@/features/learning_nook/LearningNookScreen';
import { CanvasScreen }            from '@/features/creation_desk/CanvasScreen';
import { KnowledgeGardenScreen }   from '@/features/knowledge_garden/KnowledgeGardenScreen';
import { NoteEditorScreen }        from '@/features/knowledge_garden/NoteEditorScreen';
import { DecksListScreen }         from '@/features/learning_nook/DecksListScreen';
import { FlashcardReviewScreen }   from '@/features/learning_nook/FlashcardReviewScreen';

export type TabParamList = {
  Room:     undefined;
  Growth:   undefined;
  Vault:    undefined;
  Settings: undefined;
};

export type RoomStackParamList = {
  RoomHome:        undefined;
  VentCorner:      undefined;
  LearningNook:    undefined;
  DecksList:       undefined;
  FlashcardReview: { deckId: string };
  CreationDesk:    undefined;
  KnowledgeGarden: undefined;
  NoteEditor:      { noteId?: string };
};

const Tab      = createBottomTabNavigator<TabParamList>();
const RoomStack = createNativeStackNavigator<RoomStackParamList>();

function RoomStackNavigator() {
  return (
    <RoomStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <RoomStack.Screen name="RoomHome"        component={RoomScreen} />
      <RoomStack.Screen name="VentCorner"      component={VentCornerScreen} />
      <RoomStack.Screen name="LearningNook"    component={LearningNookScreen} />
      <RoomStack.Screen name="DecksList"       component={DecksListScreen} />
      <RoomStack.Screen name="FlashcardReview" component={FlashcardReviewScreen} />
      <RoomStack.Screen name="CreationDesk"    component={CanvasScreen} />
      <RoomStack.Screen name="KnowledgeGarden" component={KnowledgeGardenScreen} />
      <RoomStack.Screen name="NoteEditor"      component={NoteEditorScreen} />
    </RoomStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Room"     component={RoomStackNavigator} />
      <Tab.Screen name="Growth"   component={GrowthScreen} />
      <Tab.Screen name="Vault"    component={VaultScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
