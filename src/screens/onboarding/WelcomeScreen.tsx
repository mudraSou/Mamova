import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity,
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
  const slideAnim = useRef(new Animated.Value(32)).current;
  const orb1Scale = useRef(new Animated.Value(0.85)).current;
  const orb2Scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 1000, delay: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800,  delay: 200, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(orb1Scale, { toValue: 1.1, duration: 4000, useNativeDriver: true }),
          Animated.timing(orb1Scale, { toValue: 0.85, duration: 4000, useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(orb2Scale, { toValue: 0.75, duration: 3500, useNativeDriver: true }),
          Animated.timing(orb2Scale, { toValue: 1.05, duration: 3500, useNativeDriver: true }),
        ]),
      ),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={gradients.splash} locations={[0, 0.5, 1]} style={styles.root}>

      {/* Floating ambient orbs — decorative, do not interact */}
      <Animated.View pointerEvents="none" style={[styles.orb, styles.orbTop, { transform: [{ scale: orb1Scale }] }]} />
      <Animated.View pointerEvents="none" style={[styles.orb, styles.orbMid, { transform: [{ scale: orb2Scale }] }]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Brand mark */}
          <View style={styles.brandRow}>
            <LinearGradient colors={gradients.button} style={styles.logoMark}>
              <Text style={styles.logoText}>M</Text>
            </LinearGradient>
            <Text style={styles.appName}>Mamova</Text>
          </View>

          {/* Hero copy */}
          <View style={styles.heroBlock}>
            <Text style={styles.tagline}>You birthed</Text>
            <Text style={styles.tagline}>life.</Text>
            <Text style={[styles.tagline, styles.taglineAccent]}>Now reclaim</Text>
            <Text style={[styles.tagline, styles.taglineAccent]}>yours.</Text>
          </View>

          {/* Divider thread */}
          <View style={styles.thread}>
            <View style={styles.threadDot} />
            <View style={styles.threadLine} />
            <View style={styles.threadDot} />
          </View>

          {/* Sub-copy */}
          <Text style={styles.body}>
            A gentle guide through the 4th trimester. Breastfeeding, recovery, and the questions you're afraid to ask at 3am.
          </Text>

          {/* Pillars */}
          <View style={styles.pillars}>
            {[
              { icon: '◎', label: 'Symptom support' },
              { icon: '✦', label: 'Feeding positions' },
              { icon: '◇', label: 'AI wellness coach' },
            ].map(p => (
              <View key={p.label} style={styles.pillarRow}>
                <Text style={styles.pillarIcon}>{p.icon}</Text>
                <Text style={styles.pillarText}>{p.label}</Text>
              </View>
            ))}
          </View>

        </Animated.View>

        {/* CTAs — pinned to bottom */}
        <Animated.View style={[styles.ctas, { opacity: fadeAnim }]}>
          <Button
            label="Begin your journey"
            onPress={() => navigation.navigate('Onboarding')}
            size="lg"
          />

          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => navigation.navigate('Join')}
            activeOpacity={0.75}
          >
            <Text style={styles.joinBtnText}>Join as partner</Text>
            <Text style={styles.joinBtnSub}> — enter a shared PIN</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Private by design. Your story stays yours.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.lg },

  // ── Floating orbs ─────────────────────────────────────────────
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    pointerEvents: 'none',
  },
  orbTop: {
    width: 340,
    height: 340,
    backgroundColor: palette.electricPurple,
    opacity: 0.11,
    top: -60,
    right: -80,
  },
  orbMid: {
    width: 220,
    height: 220,
    backgroundColor: palette.roseMid,
    opacity: 0.18,
    top: height * 0.28,
    left: -60,
  },
  orbBottom: {
    width: 280,
    height: 280,
    backgroundColor: palette.softFuchsia,
    opacity: 0.09,
    bottom: height * 0.18,
    right: -60,
  },

  content: { flex: 1, justifyContent: 'center', paddingTop: spacing['2xl'] },

  // ── Brand ─────────────────────────────────────────────────────
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoMark: {
    width: 46,
    height: 46,
    borderRadius: 15,
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

  // ── Hero ──────────────────────────────────────────────────────
  heroBlock: { marginBottom: spacing.lg, gap: 0 },
  tagline: {
    fontFamily: typography.fonts.headlineBold,
    fontSize: typography.sizes['4xl'],
    color: palette.darkText.primary,
    lineHeight: typography.sizes['4xl'] * 1.15,
  },
  taglineAccent: {
    color: palette.electricPurple,
  },

  // ── Thread divider ────────────────────────────────────────────
  thread: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  threadDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.roseMid,
  },
  threadLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.roseMid,
    opacity: 0.6,
  },

  // ── Body ──────────────────────────────────────────────────────
  body: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: palette.darkText.secondary,
    lineHeight: typography.sizes.md * 1.75,
    marginBottom: spacing.lg,
    maxWidth: 320,
  },

  // ── Pillars ───────────────────────────────────────────────────
  pillars: { gap: spacing.sm },
  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pillarIcon: { fontSize: 15, color: palette.softFuchsia, width: 22, textAlign: 'center' },
  pillarText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: palette.darkText.secondary,
  },

  // ── CTAs ──────────────────────────────────────────────────────
  ctas: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  joinBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  joinBtnText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: palette.softFuchsia,
  },
  joinBtnSub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: palette.darkText.muted,
  },

  disclaimer: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: palette.darkText.muted,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * 1.6,
  },
});
