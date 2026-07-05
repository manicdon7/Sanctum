// Main Tab Navigator
// Custom bottom tab bar with 4 tabs: Room, Juliet, Sounds, Settings

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { RoomScreen } from '../../features/room/RoomScreen';
import { JulietScreen } from '../../features/juliet/JulietScreen';
import { SoundsScreen } from '../../features/sounds/SoundsScreen';
import { SettingsScreen } from '../../features/settings/SettingsScreen';
import { CustomTabBar } from './CustomTabBar';
import { type MainTabParamList } from './routes';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false, // Preload all screens for smooth transitions
      }}
    >
      <Tab.Screen 
        name="Room" 
        component={RoomScreen}
        options={{
          tabBarLabel: 'Room',
          tabBarIcon: 'house',
        }}
      />
      <Tab.Screen 
        name="Juliet" 
        component={JulietScreen}
        options={{
          tabBarLabel: 'Juliet',
          tabBarIcon: 'chat-circle-dots',
        }}
      />
      <Tab.Screen 
        name="Sounds" 
        component={SoundsScreen}
        options={{
          tabBarLabel: 'Sounds',
          tabBarIcon: 'musical-note',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: 'gear',
        }}
      />
    </Tab.Navigator>
  );
}