import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '@/navigation';
import { Button } from '@/components/ui/Button';
import { palette, gradients, typography, spacing } from '@/theme';

type Props = NativeStackScreenProps<RootStackParams, 'Welcome'>;
const { height } = Dimensions.get('window');

export function WelcomeScreen({ navigation }: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={gradients.splash} locations={[0, 0.5, 1]} style={styles.root}>
      {/* Ambient orb */}
      <View style={styles.orb} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Brand mark */}
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <Text style={styles.appName}>Mamova</Text>
          </View>

          {/* Hero copy */}
          <View style={styles.heroBlock}>
            <Text style={styles.tagline}>You birthed life.</Text>
            <Text style={[styles.tagline, styles.taglineAccent]}>Now reclaim yours.</Text>
          </View>

          {/* Sub-copy */}
          <Text style={styles.body}>
            Your guide through the 4th trimester — breastfeeding, recovery, and everything in between.
          </Text>

          {/* Pillars */}
          <View style={styles.pillars}>
            {['Breastfeeding guidance', 'Symptom support', 'AI wellness coach'].map(p => (
              <View key={p} style={styles.pillarRow}>
                <View style={styles.pillarDot} />
                <Text style={styles.pillarText}>{p}</Text>
              </View>
            ))}
          </View>

        </Animated.View>

        {/* CTAs — pinned to bottom */}
        <Animated.View style={[styles.ctas, { opacity: fadeAnim }]}>
          <Button
            label="Get started"
            onPress={() => navigation.navigate('Login')}
            size="lg"
          />
          <Text style={styles.disclaimer}>
            Free. Private. No data leaves your device until you choose.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.lg },

  orb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: palette.electricPurple,
    opacity: 0.15,
    top: height * 0.1,
    right: -80,
    transform: [{ scale: 1.5 }],
  },

  content: { flex: 1, justifyContent: 'center', paddingTop: spacing['2xl'] },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.electricPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: typography.fonts.headlineBold,
    fontSize: 22,
    color: palette.white,
  },
  appName: {
    fontFamily: typography.fonts.headlineBold,
    fontSize: typography.sizes['2xl'],
    color: palette.darkText.primary,
    letterSpacing: -0.5,
  },

  heroBlock: { marginBottom: spacing.lg },
  tagline: {
    fontFamily: typography.fonts.headlineBold,
    fontSize: typography.sizes['4xl'],
    color: palette.darkText.primary,
    lineHeight: typography.sizes['4xl'] * 1.2,
  },
  taglineAccent: {
    color: palette.softFuchsia,
  },

  body: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: palette.darkText.secondary,
    lineHeight: typography.sizes.md * 1.7,
    marginBottom: spacing.xl,
    maxWidth: 320,
  },

  pillars: { gap: spacing.sm },
  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pillarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.softFuchsia,
  },
  pillarText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: palette.darkText.secondary,
  },

  ctas: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  disclaimer: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: palette.darkText.muted,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * 1.6,
  },
});
