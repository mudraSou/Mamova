import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '@/navigation';
import { Button } from '@/components/ui/Button';
import { useProfileStore } from '@/store/profileStore';
import { palette, gradients, typography, spacing, radius } from '@/theme';

type Props = NativeStackScreenProps<RootStackParams, 'Join'>;

export function JoinScreen({ navigation }: Props) {
  const [pin, setPin]         = useState('');
  const [error, setError]     = useState<string | null>(null);
  const { joinByPin, isLoading } = useProfileStore();
  const inputRef = useRef<TextInput>(null);

  const handleJoin = async () => {
    setError(null);
    const cleaned = pin.replace(/\D/g, '');
    if (cleaned.length !== 6) {
      setError('Please enter the full 6-digit PIN.');
      return;
    }
    try {
      await joinByPin(cleaned);
      // On success profileStore sets profile → RootNavigator auto-navigates to Main
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    }
  };

  // Format PIN with a space in the middle: 123 456
  const handleChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setPin(digits);
    if (error) setError(null);
  };

  const displayPin = pin.length > 3
    ? `${pin.slice(0, 3)} ${pin.slice(3)}`
    : pin;

  return (
    <LinearGradient colors={gradients.splash} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>

          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>🔗</Text>
            </View>

            <Text style={styles.title}>Join a shared profile</Text>
            <Text style={styles.sub}>
              Ask the mother to share her 6-digit PIN with you. Enter it below to connect to her profile.
            </Text>

            {/* PIN input */}
            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                style={[styles.pinInput, error ? styles.pinInputError : null]}
                value={displayPin}
                onChangeText={handleChange}
                placeholder="123 456"
                placeholderTextColor={palette.darkText.muted}
                keyboardType="number-pad"
                maxLength={7} // 6 digits + 1 space
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleJoin}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <Button
              label="Connect"
              onPress={handleJoin}
              loading={isLoading}
              size="lg"
            />

            <Text style={styles.note}>
              You'll be able to see the same profile — but only the mother can update it.
            </Text>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  inner: { flex: 1, paddingHorizontal: spacing.lg },

  back:     { paddingTop: spacing.md, paddingBottom: spacing.sm },
  backText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.sm, color: palette.softFuchsia },

  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: palette.dark.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  icon: { fontSize: 36 },

  title: {
    fontFamily: typography.fonts.headlineBold,
    fontSize: typography.sizes['3xl'],
    color: palette.darkText.primary,
    lineHeight: typography.sizes['3xl'] * 1.15,
    textAlign: 'center',
  },
  sub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: palette.darkText.secondary,
    lineHeight: typography.sizes.md * 1.65,
    textAlign: 'center',
  },

  inputWrap: { gap: spacing.xs },
  pinInput: {
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 20,
    fontFamily: typography.fonts.headlineBold,
    fontSize: 32,
    color: palette.darkText.primary,
    borderWidth: 1,
    borderColor: palette.dark.surface3,
    textAlign: 'center',
    letterSpacing: 8,
  },
  pinInputError: { borderColor: palette.urgent },
  errorText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: palette.urgent,
    textAlign: 'center',
  },

  note: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: palette.darkText.muted,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * 1.7,
  },
});
