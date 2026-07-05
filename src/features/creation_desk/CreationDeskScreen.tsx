import React from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors } from '@/core/theme/colors';
import { typography, fontFamilies } from '@/core/theme/typography';
import { spacing } from '@/core/theme/spacing';

export function CreationDeskScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.secondary }]}>creation desk</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: spacing[4] }}>🎨</Text>
        <Text style={[styles.heading, { color: colors.text.primary }]}>Your canvas</Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          Infinite canvas powered by react-native-skia.{'\n'}
          Requires a custom dev build.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  title: { ...typography.caption, fontFamily: fontFamilies.ui, letterSpacing: 1.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
  heading: { fontFamily: fontFamilies.journal, fontSize: 24, marginBottom: spacing[3] },
  body: { fontFamily: fontFamilies.ui, fontSize: 15, textAlign: 'center', lineHeight: 24 },
});
