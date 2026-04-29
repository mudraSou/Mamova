import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '@/navigation';
import { Button } from '@/components/ui/Button';
import { useProfileStore } from '@/store/profileStore';
import { palette, gradients, typography, spacing, radius } from '@/theme';

type Props = NativeStackScreenProps<RootStackParams, 'PinReveal'>;

function copyToClipboard(text: string) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    navigator.clipboard?.writeText(text).catch(() => {});
  } else {
    // Native — use Clipboard API if available
    try {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(text);
    } catch { /* clipboard not installed — silently skip */ }
  }
}

export function PinRevealScreen({ route, navigation }: Props) {
  const { pin } = route.params;
  const { profile } = useProfileStore();
  const [copied, setCopied] = useState(false);

  const displayPin = `${pin.slice(0, 3)} ${pin.slice(3)}`;

  const handleCopy = () => {
    copyToClipboard(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    // profileStore already has the profile set — RootNavigator will switch to Main
    navigation.replace('Main');
  };

  return (
    <LinearGradient colors={gradients.splash} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>

          {/* Top illustration */}
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🔑</Text>
          </View>

          <Text style={styles.title}>Your profile is ready</Text>
          <Text style={styles.sub}>
            Share this PIN with{profile?.partner_name ? ` ${profile.partner_name}` : ' your partner'} so they can see your profile and stay connected to what you're going through.
          </Text>

          {/* PIN card */}
          <View style={styles.pinCard}>
            <Text style={styles.pinLabel}>Your shared PIN</Text>
            <Text style={styles.pinValue}>{displayPin}</Text>

            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.75}>
              <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy PIN'}</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.steps}>
            {[
              `Ask ${profile?.partner_name ?? 'your partner'} to open Mamova`,
              'They tap "Join as partner" on the welcome screen',
              'They enter this PIN to connect',
            ].map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>

          <Button label="Let's go" onPress={handleDone} size="lg" />

          <Text style={styles.note}>
            You can always find this PIN in your profile settings.
          </Text>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
    justifyContent: 'center',
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
    textAlign: 'center',
    lineHeight: typography.sizes['3xl'] * 1.15,
  },
  sub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: palette.darkText.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * 1.65,
  },

  pinCard: {
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.dark.surface3,
  },
  pinLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
    color: palette.darkText.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  pinValue: {
    fontFamily: typography.fonts.headlineBold,
    fontSize: 44,
    color: palette.electricPurple,
    letterSpacing: 10,
  },
  copyBtn: {
    backgroundColor: palette.dark.surface2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  copyBtnText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: palette.softFuchsia,
  },

  steps: { gap: spacing.md },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.softFuchsia,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
    color: palette.white,
  },
  stepText: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: palette.darkText.secondary,
    lineHeight: typography.sizes.sm * 1.65,
  },

  note: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: palette.darkText.muted,
    textAlign: 'center',
  },
});
