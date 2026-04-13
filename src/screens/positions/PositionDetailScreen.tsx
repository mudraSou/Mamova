import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import type { PositionsStackParams } from '@/navigation';
import { ReviewerBadge } from '@/components/ui/ReviewerBadge';
import { palette, typography, spacing, radius, gradients } from '@/theme';
import positionsData from '@/data/positions.json';

type Route = RouteProp<PositionsStackParams, 'PositionDetail'>;

export function PositionDetailScreen() {
  const nav   = useNavigation();
  const route = useRoute<Route>();
  const pos   = (positionsData as any[]).find(p => p.slug === route.params.slug);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  if (!pos) return null;

  const toggleCheck = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <LinearGradient colors={[palette.dark.bg, palette.dark.surface0]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          <TouchableOpacity onPress={() => nav.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Positions</Text>
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient colors={gradients.fuchsia} style={styles.heroIcon}>
              <Text style={styles.heroIconText}>✦</Text>
            </LinearGradient>
            <View style={styles.heroText}>
              <Text style={styles.title}>{pos.title}</Text>
              <Text style={styles.tagline}>{pos.tagline}</Text>
            </View>
          </View>

          {/* Best for tags */}
          <View style={styles.tags}>
            {(pos.best_for ?? []).map((t: string) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Steps */}
          <Text style={styles.sectionTitle}>Step-by-step</Text>
          {(pos.steps ?? []).sort((a: any, b: any) => a.order - b.order).map((step: any) => (
            <View key={step.order} style={styles.stepCard}>
              <LinearGradient colors={gradients.button} style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.order}</Text>
              </LinearGradient>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.instruction}</Text>
                {step.tip && (
                  <View style={styles.tipBox}>
                    <Text style={styles.tipText}>💡 {step.tip}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Latch checklist */}
          <Text style={styles.sectionTitle}>Latch checklist</Text>
          <Text style={styles.checkHint}>Tap each item to check it off during your feed.</Text>
          {(pos.latch_checklist ?? []).map((item: string, i: number) => (
            <TouchableOpacity
              key={i}
              style={[styles.checkItem, checked.has(i) && styles.checkItemDone]}
              onPress={() => toggleCheck(i)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={checked.has(i) ? gradients.button : ['transparent', 'transparent']}
                style={styles.checkBox}
              >
                <Text style={[styles.checkMark, checked.has(i) && styles.checkMarkDone]}>
                  {checked.has(i) ? '✓' : '○'}
                </Text>
              </LinearGradient>
              <Text style={[styles.checkText, checked.has(i) && styles.checkTextDone]}>{item}</Text>
            </TouchableOpacity>
          ))}

          {/* Common mistakes */}
          {(pos.common_mistakes ?? []).length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Common mistakes</Text>
              {pos.common_mistakes.map((m: any, i: number) => (
                <View key={i} style={styles.mistakeCard}>
                  <Text style={styles.mistakeLabel}>Common mistake</Text>
                  <Text style={styles.mistakeText}>{m.mistake}</Text>
                  <Text style={styles.fixLabel}>The fix</Text>
                  <Text style={styles.fixText}>{m.fix}</Text>
                </View>
              ))}
            </>
          )}

          {/* Reviewer badge */}
          <ReviewerBadge reviewedById={pos.reviewed_by_id} />

          <Text style={styles.disclaimer}>{pos.disclaimer}</Text>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 100, gap: spacing.md },

  back: { paddingVertical: spacing.md, alignSelf: 'flex-start' },
  backText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.softFuchsia },

  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: { width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroIconText: { fontSize: 24, color: palette.dark.bg },
  heroText: { flex: 1 },
  title:   { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes['2xl'], color: palette.darkText.primary, lineHeight: typography.sizes['2xl'] * 1.2 },
  tagline: { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag:  { backgroundColor: palette.dark.surface2, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.xs, color: palette.darkText.secondary },

  sectionTitle: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.darkText.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm },
  checkHint:    { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.muted },

  stepCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: palette.dark.surface1, borderRadius: radius.lg, padding: spacing.md },
  stepNum:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.sm, color: palette.white },
  stepBody: { flex: 1, gap: 4 },
  stepTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.primary },
  stepDesc:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.65 },
  tipBox:  { backgroundColor: palette.dark.surface2, borderRadius: radius.md, padding: spacing.sm, marginTop: 4 },
  tipText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.lightBlush, lineHeight: typography.sizes.sm * 1.5 },

  checkItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.dark.surface1, borderRadius: radius.md, padding: spacing.md },
  checkItemDone: { backgroundColor: palette.dark.surface2 },
  checkBox:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: palette.darkText.muted },
  checkMark: { fontSize: 14, color: palette.darkText.muted },
  checkMarkDone: { color: palette.white },
  checkText: { flex: 1, fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.primary, lineHeight: typography.sizes.sm * 1.45 },
  checkTextDone: { color: palette.darkText.secondary, textDecorationLine: 'line-through' },

  mistakeCard: { backgroundColor: palette.dark.surface1, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  mistakeLabel: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.attention, textTransform: 'uppercase', letterSpacing: 0.6 },
  mistakeText:  { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.sm, color: palette.darkText.primary },
  fixLabel:     { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.safe, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  fixText:      { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.5 },

  disclaimer: { fontFamily: typography.fonts.body, fontSize: typography.sizes.xs, color: palette.darkText.muted, fontStyle: 'italic', lineHeight: typography.sizes.xs * 1.7, textAlign: 'center', paddingVertical: spacing.md },
});
