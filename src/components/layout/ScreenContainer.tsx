import React from 'react';
import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing } from '@/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  gradient?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function ScreenContainer({
  children, scroll = true, gradient = false, style, contentStyle,
}: ScreenContainerProps) {
  const bg = gradient
    ? undefined
    : { backgroundColor: palette.dark.bg };

  const inner = (
    <SafeAreaView style={[styles.safe, bg, style]} edges={['top', 'left', 'right']}>
      {scroll
        ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        )
        : (
          <View style={[styles.fill, contentStyle]}>{children}</View>
        )
      }
    </SafeAreaView>
  );

  if (gradient) {
    return (
      <LinearGradient colors={[palette.dark.bg, palette.dark.surface0, palette.dark.bg]}
                      locations={[0, 0.4, 1]}
                      style={styles.fill}>
        {inner}
      </LinearGradient>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  fill:    { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing['3xl'] },
});
