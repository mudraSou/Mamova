import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParams } from '@/navigation';
import { SeverityPill } from '@/components/ui/SeverityPill';
import { useProfileStore } from '@/store/profileStore';
import { palette, gradients, typography, spacing, radius, shadows } from '@/theme';
import symptomsData from '@/data/symptoms.json';
import positionsData from '@/data/positions.json';

type NavProp = BottomTabNavigationProp<MainTabParams>;

// ── Time-aware greeting ───────────────────────────────────────────
function getGreeting(babyName?: string | null): { title: string; sub: string } {
  const h = new Date().getHours();
  const n = babyName ? `, ${babyName}` : '';
  if (h >= 1 && h < 5)  return { title: `3am is the hardest hour${n}.`,   sub: "You're still here. That's everything." };
  if (h >= 5 && h < 9)  return { title: `Good morning${n}.`,              sub: 'One feed at a time.' };
  if (h >= 9 && h < 17) return { title: `Hi${n}.`,                         sub: "What's worrying you today?" };
  if (h >= 17 && h < 21) return { title: `Evening${n}.`,                   sub: "You've done so much today." };
  return                         { title: `Night feed${n}?`,                sub: "We've got you." };
}

// ── Day-relevant symptom matching ─────────────────────────────────
const DAY_RANGES = [
  { days: [1, 3],  kw: ['afterpain', 'colostrum', 'first day', 'first 24'] },
  { days: [3, 7],  kw: ['day 3', 'day 4', 'day 5', 'milk comes in', 'engorg'] },
  { days: [5, 14], kw: ['cracked', 'mastit', 'first week', 'week 1', 'week 2'] },
  { days: [7, 30], kw: ['cluster', 'supply', 'week 2', 'week 3', 'week 4'] },
  { days: [14, 42],kw: ['ppd', 'postpartum depression', 'emotional', 'week 5'] },
];

function isDayRelevant(card: any, dayN: number): boolean {
  const text = ((card.peak_timing ?? '') + ' ' + (card.what_it_is ?? '')).toLowerCase();
  return DAY_RANGES.some(r => dayN >= r.days[0] && dayN <= r.days[1] && r.kw.some(k => text.includes(k)));
}

export function HomeScreen() {
  const nav       = useNavigation<NavProp>();
  const { profile, dayN, isCSection } = useProfileStore();
  const day       = dayN();
  const csection  = isCSection();
  const { title, sub } = getGreeting(profile?.baby_name);

  const todayCards = useMemo(
    () => (symptomsData as any[]).filter(c => isDayRelevant(c, day)).slice(0, 3),
    [day],
  );

  const featSlug   = csection ? 'football-hold' : 'cradle-hold';
  const featured   = (positionsData as any[]).find(p => p.slug === featSlug);

  return (
    <LinearGradient colors={[palette.dark.bg, palette.dark.surface0]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Day badge + greeting ──────────────────────────── */}
          <View style={styles.header}>
            <LinearGradient colors={gradients.fuchsia} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day {day}</Text>
            </LinearGradient>
            <Text style={styles.greetTitle}>{title}</Text>
            <Text style={styles.greetSub}>{sub}</Text>
          </View>

          {/* ── Quick access row ──────────────────────────────── */}
          <View style={styles.quickRow}>
            {[
              { label: "What's wrong?", icon: '◎', tab: 'Symptoms' },
              { label: 'How to feed',   icon: '✦', tab: 'Positions' },
              { label: 'Ask me',        icon: '◆', tab: 'Coach' },
            ].map(({ label, icon, tab }) => (
              <TouchableOpacity
                key={tab}
                style={styles.quickBtn}
                onPress={() => nav.navigate(tab as keyof MainTabParams)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickIcon}>{icon}</Text>
                <Text style={styles.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Today's symptom cards ─────────────────────────── */}
          {todayCards.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Common around Day {day}</Text>
              {todayCards.map((card: any) => (
                <TouchableOpacity
                  key={card.slug}
                  style={styles.symptomCard}
                  activeOpacity={0.8}
                  onPress={() => nav.navigate('Symptoms', { screen: 'SymptomDetail', params: { slug: card.slug } })}
                >
                  <SeverityPill severity={card.severity} />
                  <Text style={styles.symptomTitle}>{card.title_user}</Text>
                  <Text style={styles.symptomCta}>See what helps →</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Featured position ────────────────────────────── */}
          {featured && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {csection ? 'Recommended for C-section recovery' : 'Good place to start'}
              </Text>
              <TouchableOpacity
                style={styles.positionCard}
                activeOpacity={0.8}
                onPress={() => nav.navigate('Positions', { screen: 'PositionDetail', params: { slug: featured.slug } })}
              >
                <View style={styles.positionIcon}>
                  <Text style={styles.positionIconText}>✦</Text>
                </View>
                <View style={styles.positionText}>
                  <Text style={styles.positionTitle}>{featured.title}</Text>
                  <Text style={styles.positionTagline}>{featured.tagline}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Affirmation ───────────────────────────────────── */}
          <LinearGradient colors={['rgba(124,58,237,0.15)', 'rgba(192,132,252,0.08)']}
                          style={styles.affirmation}>
            <Text style={styles.affirmTitle}>You showed up. That's everything.</Text>
            <Text style={styles.affirmBody}>
              Every question you ask makes you a better mother. We're here at any hour.
            </Text>
            <Text style={styles.affirmDeco}>✦</Text>
          </LinearGradient>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 100, gap: spacing.lg },

  // Header
  header: { paddingTop: spacing.lg, gap: spacing.sm },
  dayBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: radius.full,
  },
  dayBadgeText: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.dark.bg, textTransform: 'uppercase', letterSpacing: 1.2 },
  greetTitle: { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes['3xl'], color: palette.darkText.primary, lineHeight: typography.sizes['3xl'] * 1.2 },
  greetSub:   { fontFamily: typography.fonts.body, fontSize: typography.sizes.md, color: palette.darkText.secondary },

  // Quick row
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickBtn: {
    flex: 1, paddingVertical: spacing.md,
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.lg,
    alignItems: 'center', gap: spacing.xs,
  },
  quickIcon:  { fontSize: 22, color: palette.softFuchsia },
  quickLabel: { fontFamily: typography.fonts.bodyBold, fontSize: 10, color: palette.darkText.secondary, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },

  // Sections
  section: { gap: spacing.sm },
  sectionTitle: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.darkText.muted, textTransform: 'uppercase', letterSpacing: 1 },

  // Symptom card
  symptomCard: {
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  symptomTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.primary, lineHeight: typography.sizes.md * 1.35 },
  symptomCta:   { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.sm, color: palette.softFuchsia },

  // Position card
  positionCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  positionIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.dark.surface2, alignItems: 'center', justifyContent: 'center' },
  positionIconText: { fontSize: 20, color: palette.softFuchsia },
  positionText: { flex: 1 },
  positionTitle:   { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.primary },
  positionTagline: { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.4 },
  chevron: { fontSize: 24, color: palette.darkText.muted },

  // Affirmation
  affirmation: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, overflow: 'hidden' },
  affirmTitle:  { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes.lg, color: palette.softFuchsia },
  affirmBody:   { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.7 },
  affirmDeco:   { fontSize: 32, color: palette.electricPurple, opacity: 0.4, position: 'absolute', right: spacing.lg, bottom: spacing.sm },
});
