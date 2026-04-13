import React from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet, Platform,
} from 'react-native';
import { palette, typography, spacing, radius } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search…' }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.darkText.muted}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clear} hitSlop={8}>
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 20,
    color: palette.darkText.muted,
    lineHeight: 22,
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },
  input: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: palette.darkText.primary,
    paddingVertical: 0,
  },
  clear: {
    paddingLeft: spacing.xs,
  },
  clearText: {
    fontSize: 12,
    color: palette.darkText.muted,
  },
});
