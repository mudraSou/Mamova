import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { SymptomsStackParams } from '@/navigation';
import { SeverityPill } from '@/components/ui/SeverityPill';
import { ReviewerBadge } from '@/components/ui/ReviewerBadge';
import { palette, typography, spacing, radius, gradients } from '@/theme';
import symptomsData from '@/data/symptoms.json';

type Route = RouteProp<SymptomsStackParams, 'SymptomDetail'>;

export function SymptomDetailScreen() {
  const nav   = useNavigation();
  const route = useRoute<Route>();
  const card  = (symptomsData as any[]).find(c => c.slug === route.params.slug);

  if (!card) return null;

  return (
    <LinearGradient colors={[palette.dark.bg, palette.dark.surface0]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Back */}
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Symptoms</Text>
          </TouchableOpacity>

          {/* Badges */}
          <View style={styles.badges}>
            <SeverityPill severity={card.severity} />
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>{card.category}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{card.title_user}</Text>
          <Text style={styles.clinical}>◎ Clinical: {card.title_clinical}</Text>

          {/* What it is */}
          <View style={styles.introCard}>
            <Text style={styles.sectionHead}>What this likely is</Text>
            <Text style={styles.introText}>{card.what_it_is}</Text>
            {card.peak_timing && (
              <Text style={styles.timing}>Typical timing: {card.peak_timing}</Text>
            )}
          </View>

          {/* Steps */}
          <Text style={styles.sectionTitle}>Immediate relief steps</Text>
          {(card.immediate_relief_steps ?? []).sort((a: any, b: any) => a.order - b.order).map((step: any) => (
            <View key={step.order} style={styles.stepCard}>
              <LinearGradient colors={gradients.button} style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.order}</Text>
              </LinearGradient>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.description}</Text>
              </View>
            </View>
          ))}

          {/* Do's / Don'ts */}
          <View style={styles.dosRow}>
            <View style={[styles.dosBox, styles.dosBg]}>
              <Text style={styles.dosHead}>✓ Do's</Text>
              {(card.dos ?? []).map((d: string, i: number) => (
                <Text key={i} style={styles.dosItem}>• {d}</Text>
              ))}
            </View>
            <View style={[styles.dosBox, styles.dontsBg]}>
              <Text style={[styles.dosHead, styles.dontsHead]}>✕ Don'ts</Text>
              {(card.donts ?? []).map((d: string, i: number) => (
                <Text key={i} style={[styles.dosItem, styles.dontsItem]}>• {d}</Text>
              ))}
            </View>
          </View>

          {/* Red flags */}
          <View style={styles.redFlags}>
            <Text style={styles.redFlagsHead}>⚠ Red flags — see a doctor if…</Text>
            {(card.red_flags ?? []).map((f: string, i: number) => (
              <Text key={i} style={styles.redFlagItem}>• {f}</Text>
            ))}
            {card.recommended_action_if_red_flags && (
              <Text style={styles.redFlagAction}>{card.recommended_action_if_red_flags}</Text>
            )}
          </View>

          {/* Improvement */}
          {card.when_to_expect_improvement && (
            <View style={styles.improvementBlock}>
              <Text style={styles.improvementTitle}>When to expect improvement</Text>
              <Text style={styles.improvementText}>{card.when_to_expect_improvement}</Text>
            </View>
          )}

          {/* Reviewer badge */}
          <ReviewerBadge reviewedById={card.reviewed_by_id} />

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>{card.disclaimer}</Text>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 100, gap: spacing.md },

  back: { paddingVertical: spacing.md, alignSelf: 'flex-start' },
  backText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.softFuchsia },

  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  catBadge: { backgroundColor: palette.dark.surface2, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  catBadgeText: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.darkText.secondary, textTransform: 'uppercase', letterSpacing: 0.6 },

  title:    { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes['3xl'], color: palette.darkText.primary, lineHeight: typography.sizes['3xl'] * 1.2 },
  clinical: { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.muted, fontStyle: 'italic' },

  introCard: { backgroundColor: palette.dark.surface1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  sectionHead: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.sm, color: palette.softFuchsia, textTransform: 'uppercase', letterSpacing: 0.6 },
  introText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.md, color: palette.darkText.primary, lineHeight: typography.sizes.md * 1.65 },
  timing:    { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.sm, color: palette.lightBlush },

  sectionTitle: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.darkText.muted, textTransform: 'uppercase', letterSpacing: 1 },

  stepCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: palette.dark.surface1, borderRadius: radius.lg, padding: spacing.md },
  stepNum:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.sm, color: palette.white },
  stepBody: { flex: 1, gap: 4 },
  stepTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.primary },
  stepDesc:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.65 },

  dosRow: { flexDirection: 'row', gap: spacing.sm },
  dosBox: { flex: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  dosBg:  { backgroundColor: 'rgba(134,239,172,0.08)' },
  dontsBg:{ backgroundColor: 'rgba(248,113,113,0.08)' },
  dosHead:  { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.sm, color: palette.safe, marginBottom: 4 },
  dontsHead:{ color: palette.urgent },
  dosItem:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.5 },
  dontsItem:{ color: palette.darkText.secondary },

  redFlags: { backgroundColor: palette.urgentBg, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, borderWidth: 1, borderColor: `${palette.urgent}33` },
  redFlagsHead: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.sm, color: palette.urgent, marginBottom: 4 },
  redFlagItem:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: '#fca5a5', lineHeight: typography.sizes.sm * 1.5 },
  redFlagAction:{ fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.sm, color: palette.urgent, marginTop: spacing.xs },

  improvementBlock: { backgroundColor: palette.dark.surface1, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  improvementTitle: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.sm, color: palette.darkText.secondary },
  improvementText:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.muted, lineHeight: typography.sizes.sm * 1.65 },

  disclaimer: { fontFamily: typography.fonts.body, fontSize: typography.sizes.xs, color: palette.darkText.muted, fontStyle: 'italic', lineHeight: typography.sizes.xs * 1.7, textAlign: 'center', paddingVertical: spacing.md },
});
