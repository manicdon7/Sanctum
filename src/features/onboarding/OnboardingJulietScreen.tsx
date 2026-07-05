// Onboarding Juliet Screen
// Juliet introduces herself and user can optionally rename her

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../core/theme/useTheme';
import { useUserStore } from '../../core/stores/useUserStore';
import { useAppStore } from '../../core/stores/useAppStore';
import { JulietDot } from '../../shared/components/JulietDot';
import { display, ui } from '../../core/theme/typography';
import { spacing } from '../../core/theme/spacing';
import { OnboardingStackParamList, RootStackParamList } from '../../core/navigation/routes';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
type RouteProp_ = RouteProp<OnboardingStackParamList, 'OnboardingJuliet'>;

export function OnboardingJulietScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp_>();
  const { userName } = route.params;
  
  const { setUserName, setCompanionName } = useUserStore();
  const { setOnboardingCompleted } = useAppStore();
  
  const [customName, setCustomName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  
  const dotOpacity = useSharedValue(0);
  const message1Opacity = useSharedValue(0);
  const message2Opacity = useSharedValue(0);
  const message3Opacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  const messages = [
    "hi. i'm juliet — i'll be around.",
    "you can rename me whatever you like, whenever.",
    "this is your room. do whatever you need.",
  ];

  useEffect(() => {
    // Juliet dot appears first
    dotOpacity.value = withTiming(1, { duration: 500 });
    
    // Messages appear in sequence
    message1Opacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    
    setTimeout(() => {
      message2Opacity.value = withTiming(1, { duration: 800 });
    }, 2000);
    
    setTimeout(() => {
      message3Opacity.value = withTiming(1, { duration: 800 });
      buttonOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    }, 3000);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const message1Style = useAnimatedStyle(() => ({
    opacity: message1Opacity.value,
  }));

  const message2Style = useAnimatedStyle(() => ({
    opacity: message2Opacity.value,
  }));

  const message3Style = useAnimatedStyle(() => ({
    opacity: message3Opacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleComplete = () => {
    // Save user data
    setUserName(userName);
    if (customName.trim()) {
      setCompanionName(customName.trim());
    }
    
    // Mark onboarding complete and navigate to main app
    setOnboardingCompleted(true);
    navigation.navigate('MainTabs');
  };

  const toggleNameInput = () => {
    setShowNameInput(!showNameInput);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_base }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg_base} />
      
      {/* Juliet Dot */}
      <Animated.View style={[styles.dotContainer, dotStyle]}>
        <JulietDot size={9} />
      </Animated.View>
      
      <View style={styles.content}>
        {/* Juliet's Messages */}
        <View style={styles.messagesContainer}>
          <Animated.Text
            style={[
              styles.message,
              display.lg,
              { color: colors.juliet },
              message1Style,
            ]}
          >
            {messages[0]}
          </Animated.Text>
          
          <Animated.Text
            style={[
              styles.message,
              display.lg,
              { color: colors.juliet },
              message2Style,
            ]}
          >
            {messages[1]}
          </Animated.Text>
          
          <Animated.Text
            style={[
              styles.message,
              display.lg,
              { color: colors.juliet },
              message3Style,
            ]}
          >
            {messages[2]}
          </Animated.Text>
        </View>
        
        {/* Optional Name Input */}
        {showNameInput && (
          <View style={styles.nameInputContainer}>
            <TextInput
              style={[
                styles.nameInput,
                display.md,
                {
                  color: colors.text_primary,
                  borderBottomColor: colors.juliet,
                },
              ]}
              placeholder="call me..."
              placeholderTextColor={colors.text_ghost}
              value={customName}
              onChangeText={setCustomName}
              autoFocus
              maxLength={20}
            />
          </View>
        )}
        
        {/* Action Buttons */}
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          {!showNameInput && (
            <TouchableOpacity onPress={toggleNameInput} style={styles.renameLink}>
              <Text style={[
                styles.renameLinkText,
                ui.caption,
                { color: colors.text_muted },
              ]}>
                (call me...)
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={handleComplete}
            style={[
              styles.continueButton,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text style={[
              styles.continueButtonText,
              ui.button,
              { color: colors.bg_base },
            ]}>
              let's go
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dotContainer: {
    position: 'absolute',
    top: spacing.xl * 2,
    right: spacing.lg,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  messagesContainer: {
    marginBottom: spacing.xl * 2,
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    // Lora font for Juliet's intimate voice
  },
  nameInputContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  nameInput: {
    textAlign: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minWidth: 150,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  renameLink: {
    marginBottom: spacing.lg,
  },
  renameLinkText: {
    // Small muted link style
  },
  continueButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  continueButtonText: {
    // DM Sans button style
  },
});