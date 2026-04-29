import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
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
function getGreeting(motherName?: string | null, babyName?: string | null): {
  icon: string; title: string; sub: string;
} {
  const h    = new Date().getHours();
  const name = motherName ? motherName.split(' ')[0] : null;
  const baby = babyName   ? babyName.split(' ')[0]   : null;
  const hi   = name ? `${name}.` : 'mama.';
  const bstr = baby ? ` and ${baby}` : '';

  if (h >= 1 && h < 5)   return { icon: '🌙', title: `3am, ${hi}`,         sub: `You're still here${bstr}. That is everything.` };
  if (h >= 5 && h < 9)   return { icon: '🌅', title: `Good morning, ${hi}`, sub: `One feed at a time${bstr}.` };
  if (h >= 9 && h < 17)  return { icon: '☀️', title: `Hello, ${hi}`,        sub: `What's on your mind today?` };
  if (h >= 17 && h < 21) return { icon: '🌤', title: `Evening, ${hi}`,      sub: `You've done so much today.` };
  return                          { icon: '🌙', title: `Night feed, ${hi}`,  sub: `We've got you${bstr}.` };
}

// ── Daily affirmations (cycles by calendar day) ───────────────────
const AFFIRMATIONS = [
  { quote: 'Every question you ask\nis an act of love.',         note: "You showed up. That's everything." },
  { quote: 'Your body did something\nextraordinary.',            note: 'Be patient with it. Be patient with yourself.' },
  { quote: 'There is no perfect way\nto do this.',              note: 'There is only your way, and it is enough.' },
  { quote: 'The hard nights are\nnot forever.',                 note: 'You are building something that lasts.' },
  { quote: 'Asking for help is\npart of mothering.',            note: 'Strength and softness live together.' },
  { quote: 'Rest is not laziness.\nIt is how you heal.',        note: 'Your baby needs a mother who is recovering.' },
  { quote: 'You are learning\nas they are learning.',           note: 'Neither of you has done this before.' },
];
function getDailyAffirmation() {
  return AFFIRMATIONS[Math.floor(Date.now() / 86_400_000) % AFFIRMATIONS.length];
}

// ── Day-relevant symptom matching ─────────────────────────────────
const DAY_RANGES = [
  { days: [1,  3],  kw: ['afterpain', 'colostrum', 'first day', 'first 24'] },
  { days: [3,  7],  kw: ['day 3', 'day 4', 'day 5', 'milk comes in', 'engorg'] },
  { days: [5, 14],  kw: ['cracked', 'mastit', 'first week', 'week 1', 'week 2'] },
  { days: [7, 30],  kw: ['cluster', 'supply', 'week 2', 'week 3', 'week 4'] },
  { days: [14, 42], kw: ['ppd', 'postpartum depression', 'emotional', 'week 5'] },
];
function isDayRelevant(card: any, dayN: number): boolean {
  const text = ((card.peak_timing ?? '') + ' ' + (card.what_it_is ?? '')).toLowerCase();
  return DAY_RANGES.some(r => dayN >= r.days[0] && dayN <= r.days[1] && r.kw.some(k => text.includes(k)));
}

export function HomeScreen() {
  const nav  = useNavigation<NavProp>();
  const { profile, dayN, isCSection } = useProfileStore();
  const day  = dayN();
  const csect = isCSection();
  const { icon, title, sub } = getGreeting(profile?.mother_name, profile?.baby_name);
  const affirmation = getDailyAffirmation();

  const todayCards = useMemo(
    () => (symptomsData as any[]).filter(c => isDayRelevant(c, day)).slice(0, 3),
    [day],
  );

  const featSlug = csect ? 'football-hold' : 'cradle-hold';
  const featured = (positionsData as any[]).find(p => p.slug === featSlug);

  return (
    <LinearGradient colors={[palette.dark.bg, palette.dark.surface0]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Hero header ─────────────────────────────────── */}
          <LinearGradient colors={gradients.dawn} style={styles.heroHeader}>
            <View style={styles.dayPill}>
              <View style={styles.dayPillDot} />
              <Text style={styles.dayPillText}>Day {day} of your journey</Text>
            </View>
            <View style={styles.greetRow}>
              <Text style={styles.greetIcon}>{icon}</Text>
              <Text style={styles.greetTitle}>{title}</Text>
            </View>
            <Text style={styles.greetSub}>{sub}</Text>
            <View style={styles.heroThread}>
              <View style={styles.heroThreadLine} />
              <Text style={styles.heroThreadGlyph}>✦</Text>
              <View style={styles.heroThreadLine} />
            </View>
          </LinearGradient>

          {/* ── Quick access ────────────────────────────────── */}
          <View style={styles.quickRow}>
            {([
              { label: "What's\nwrong?", icon: '◎', tab: 'Symptoms',  color: palette.electricPurple },
              { label: 'How to\nfeed',   icon: '✦', tab: 'Positions', color: palette.softFuchsia   },
              { label: 'Ask\nMamova',    icon: '◇', tab: 'Coach',     color: palette.softRose      },
            ] as const).map(({ label, icon: ic, tab, color }) => (
              <Pressable
                key={tab}
                style={({ pressed }) => [styles.quickBtn, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
                onPress={() => nav.navigate(tab as keyof MainTabParams)}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: color + '1a' }]}>
                  <Text style={[styles.quickIcon, { color }]}>{ic}</Text>
                </View>
                <Text style={styles.quickLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {/* ── Today's symptoms ────────────────────────────── */}
          {todayCards.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Common around Day {day}</Text>
              </View>
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

          {/* ── Featured position ───────────────────────────── */}
          {featured && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionAccent, { backgroundColor: palette.softFuchsia }]} />
                <Text style={styles.sectionTitle}>
                  {csect ? 'Gentle for C-section recovery' : 'A good place to start'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.positionCard}
                activeOpacity={0.8}
                onPress={() => nav.navigate('Positions', { screen: 'PositionDetail', params: { slug: featured.slug } })}
              >
                <View style={styles.positionIconWrap}>
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

          {/* ── Daily affirmation ───────────────────────────── */}
          <LinearGradient colors={gradients.affirmation} style={styles.affirmCard}>
            <View style={styles.affirmAccentBar} />
            <View style={styles.affirmInner}>
              <Text style={styles.affirmQuote}>{affirmation.quote}</Text>
              <Text style={styles.affirmNote}>{affirmation.note}</Text>
              <Text style={styles.affirmByline}>— Mamova</Text>
            </View>
            <Text style={styles.affirmDeco}>✦</Text>
          </LinearGradient>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: spacing.lg },

  // Hero header
  heroHeader: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderBottomLeftRadius: radius['2xl'],
    borderBottomRightRadius: radius['2xl'],
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(212,118,106,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
  },
  dayPillDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.electricPurple },
  dayPillText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.xs, color: palette.electricPurple, textTransform: 'uppercase', letterSpacing: 1 },
  greetRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  greetIcon:   { fontSize: 28, marginTop: 2 },
  greetTitle:  { flex: 1, fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes['3xl'], color: palette.darkText.primary, lineHeight: typography.sizes['3xl'] * 1.2 },
  greetSub:    { fontFamily: typography.fonts.body, fontSize: typography.sizes.md, color: palette.darkText.secondary, lineHeight: typography.sizes.md * 1.5, paddingLeft: 36 },
  heroThread:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, paddingLeft: 36, paddingRight: spacing.xl },
  heroThreadLine:  { flex: 1, height: 1, backgroundColor: palette.electricPurple, opacity: 0.18 },
  heroThreadGlyph: { fontSize: 12, color: palette.electricPurple, opacity: 0.4 },

  // Quick access
  quickRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  quickBtn: {
    flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.xl,
    alignItems: 'center', gap: spacing.sm,
    ...shadows.sm,
  },
  quickIconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  quickIcon:     { fontSize: 20 },
  quickLabel:    { fontFamily: typography.fonts.bodySemiBold, fontSize: 10, color: palette.darkText.secondary, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', lineHeight: 14 },

  // Sections
  section:       { gap: spacing.sm, paddingHorizontal: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: palette.electricPurple },
  sectionTitle:  { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.xs, color: palette.darkText.muted, textTransform: 'uppercase', letterSpacing: 1 },

  // Symptom card
  symptomCard: { backgroundColor: palette.dark.surface1, borderRadius: radius.xl, padding: spacing.md, gap: spacing.xs, ...shadows.sm },
  symptomTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.primary, lineHeight: typography.sizes.md * 1.35 },
  symptomCta:   { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.sm, color: palette.softFuchsia },

  // Position card
  positionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.dark.surface1, borderRadius: radius.xl, padding: spacing.md, ...shadows.sm },
  positionIconWrap: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: palette.dark.surface2, alignItems: 'center', justifyContent: 'center' },
  positionIconText: { fontSize: 22, color: palette.softFuchsia },
  positionText:     { flex: 1 },
  positionTitle:    { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.primary },
  positionTagline:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.4 },
  chevron:          { fontSize: 26, color: palette.darkText.muted, marginRight: -4 },

  // Affirmation
  affirmCard: { marginHorizontal: spacing.md, borderRadius: radius.xl, padding: spacing.lg, flexDirection: 'row', gap: spacing.md, overflow: 'hidden' },
  affirmAccentBar: { width: 3, borderRadius: 2, backgroundColor: palette.softRose, flexShrink: 0 },
  affirmInner:  { flex: 1, gap: 6 },
  affirmQuote:  { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes.lg, color: palette.softRose, lineHeight: typography.sizes.lg * 1.4 },
  affirmNote:   { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.65 },
  affirmByline: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.xs, color: palette.darkText.muted, letterSpacing: 0.5, marginTop: 2 },
  affirmDeco:   { position: 'absolute', right: spacing.lg, bottom: spacing.sm, fontSize: 28, color: palette.softRose, opacity: 0.22 },
});
