// Onboarding Welcome Screen
// First screen - "The room appears" with minimal design

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../core/theme/useTheme';
import { display, ui } from '../../core/theme/typography';
import { spacing } from '../../core/theme/spacing';
import { OnboardingStackParamList } from '../../core/navigation/routes';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingWelcome'>;

export function OnboardingWelcomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Title fades in after 800ms
    titleOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));
    
    // Subtitle fades in after another 600ms
    subtitleOpacity.value = withDelay(1400, withTiming(1, { duration: 800 }));
    
    // Ready to continue after animations
    setTimeout(() => setIsReady(true), 2200);
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const handlePress = () => {
    if (isReady) {
      navigation.navigate('OnboardingName');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={[styles.container, { backgroundColor: colors.bg_base }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg_base} />
        
        <View style={styles.content}>
          <Animated.Text
            style={[
              styles.title,
              display.xl,
              { color: colors.text_primary },
              titleStyle,
            ]}
          >
            Sanctum
          </Animated.Text>
          
          <Animated.Text
            style={[
              styles.subtitle,
              ui.caption,
              { color: colors.text_muted },
              subtitleStyle,
            ]}
          >
            YOUR ROOM
          </Animated.Text>
        </View>
        
        {isReady && (
          <Text style={[styles.continueHint, ui.micro, { color: colors.text_ghost }]}>
            tap anywhere to continue
          </Text>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 38, // Slightly larger than display.xl for impact
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.md,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  continueHint: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    textAlign: 'center',
  },
});