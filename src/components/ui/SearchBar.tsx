import React, { useState, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, Text,
  StyleSheet, Platform, Animated,
} from 'react-native';
import { palette, typography, spacing, radius } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search…' }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.spring(focusAnim, { toValue: 1, useNativeDriver: false, speed: 40, bounciness: 0 }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.spring(focusAnim, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.dark.surface3, palette.electricPurple],
  });

  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.dark.surface1, '#fff8f5'],
  });

  // Suppress browser's native black focus ring
  const webStyle = Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as any) : {};

  return (
    <Animated.View style={[styles.container, { borderColor, backgroundColor: bgColor }]}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>⌕</Text>
      <TextInput
        style={[styles.input, webStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.darkText.muted}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.clearBadge}>
            <Text style={styles.clearText}>✕</Text>
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    height: 52,
    gap: spacing.sm,
    borderWidth: 1.5,
  },
  icon:        { fontSize: 20, color: palette.darkText.muted, lineHeight: 22, marginTop: Platform.OS === 'android' ? -2 : 0 },
  iconFocused: { color: palette.electricPurple },
  input: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: palette.darkText.primary,
    paddingVertical: 0,
  },
  clear:      { paddingLeft: spacing.xs },
  clearBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: palette.dark.surface3, alignItems: 'center', justifyContent: 'center' },
  clearText:  { fontSize: 9, color: palette.darkText.muted, fontWeight: '700' },
});
