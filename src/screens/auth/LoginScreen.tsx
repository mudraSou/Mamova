import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '@/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { palette, gradients, typography, spacing, radius } from '@/theme';

type Props = NativeStackScreenProps<RootStackParams, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const { sendMagicLink }       = useAuthStore();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSend = async () => {
    if (!isValidEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setLoading(true);
    const { error: err } = await sendMagicLink(email.trim());
    setLoading(false);
    if (err) { setError(err); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <LinearGradient colors={gradients.splash} style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.sentBlock}>
            <View style={styles.sentIcon}>
              <Text style={styles.sentEmoji}>✉️</Text>
            </View>
            <Text style={styles.sentTitle}>Check your inbox</Text>
            <Text style={styles.sentBody}>
              We sent a link to{'\n'}<Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.sentHint}>
              No password to remember. Tap the link and you're in.
            </Text>
          </View>
          <TouchableOpacity onPress={() => setSent(false)} style={styles.resend}>
            <Text style={styles.resendText}>Wrong email? Go back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradients.splash} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Sign in to Mamova</Text>
            <Text style={styles.subtitle}>
              We'll send a magic link — no password needed.{'\n'}Works perfectly at 3am.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Your email</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={email}
                onChangeText={v => { setEmail(v); setError(null); }}
                placeholder="hello@example.com"
                placeholderTextColor={palette.darkText.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <Button
              label={loading ? 'Sending…' : 'Send magic link'}
              onPress={handleSend}
              loading={loading}
              disabled={!email.length}
              size="lg"
            />

            <Text style={styles.privacy}>
              🔒 Your email is only used for sign-in. Never sold, never shared.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  kav:  { flex: 1 },

  back: { paddingVertical: spacing.md, alignSelf: 'flex-start' },
  backText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: palette.softFuchsia,
  },

  content: { flex: 1, justifyContent: 'center', gap: spacing.lg },

  title: {
    fontFamily: typography.fonts.headlineBold,
    fontSize: typography.sizes['3xl'],
    color: palette.darkText.primary,
    lineHeight: typography.sizes['3xl'] * 1.15,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: palette.darkText.secondary,
    lineHeight: typography.sizes.md * 1.7,
  },

  fieldGroup: { gap: spacing.sm },
  label: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.sm,
    color: palette.darkText.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: palette.darkText.primary,
    borderWidth: 1,
    borderColor: palette.dark.surface3,
  },
  inputError: { borderColor: palette.urgent },
  errorText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: palette.urgent,
  },

  privacy: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: palette.darkText.muted,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * 1.6,
  },

  // Sent state
  sentBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  sentIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: palette.dark.surface1,
    alignItems: 'center', justifyContent: 'center',
  },
  sentEmoji:     { fontSize: 36 },
  sentTitle: {
    fontFamily: typography.fonts.headlineBold,
    fontSize: typography.sizes['2xl'],
    color: palette.darkText.primary,
    textAlign: 'center',
  },
  sentBody: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: palette.darkText.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * 1.6,
  },
  emailHighlight: { color: palette.lightBlush, fontFamily: typography.fonts.bodySemiBold },
  sentHint: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: palette.darkText.muted,
    textAlign: 'center',
  },
  resend: { paddingBottom: spacing.xl, alignSelf: 'center' },
  resendText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: palette.softFuchsia,
  },
});
