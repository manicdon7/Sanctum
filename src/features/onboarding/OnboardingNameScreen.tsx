// Onboarding Name Screen
// "what should i call you?" with minimal input

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowRight } from 'phosphor-react-native';

import { useTheme } from '../../core/theme/useTheme';
import { display, ui } from '../../core/theme/typography';
import { spacing } from '../../core/theme/spacing';
import { OnboardingStackParamList } from '../../core/navigation/routes';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingName'>;

export function OnboardingNameScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const inputRef = useRef<TextInput>(null);
  
  const [name, setName] = useState('');
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Auto-focus input when screen loads
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  useEffect(() => {
    // Show next button when name has at least 2 characters
    buttonOpacity.value = withTiming(
      name.trim().length >= 2 ? 1 : 0,
      { duration: 300 }
    );
  }, [name]);

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonOpacity.value }],
  }));

  const handleNext = () => {
    if (name.trim().length >= 2) {
      navigation.navigate('OnboardingJuliet', { userName: name.trim() });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg_base }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg_base} />
      
      <View style={styles.content}>
        <Text
          style={[
            styles.question,
            display.lg,
            { color: colors.text_primary },
          ]}
        >
          what should i call you?
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              display.md,
              {
                color: colors.text_primary,
                borderBottomColor: colors.accent,
              },
            ]}
            placeholder="your name..."
            placeholderTextColor={colors.text_ghost}
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleNext}
            returnKeyType="next"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
          />
        </View>
      </View>
      
      <Animated.View style={[styles.nextButton, buttonStyle]}>
        <TouchableOpacity
          onPress={handleNext}
          style={styles.nextButtonTouchable}
          disabled={name.trim().length < 2}
        >
          <ArrowRight 
            size={24} 
            color={colors.accent} 
            weight="regular"
          />
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  question: {
    textAlign: 'center',
    marginBottom: spacing.xl * 2,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    // Lora font for intimate feel
  },
  nextButton: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    right: spacing.xl,
  },
  nextButtonTouchable: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});