import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SymptomsStackParams } from '@/navigation';
import { SeverityPill } from '@/components/ui/SeverityPill';
import { SearchBar } from '@/components/ui/SearchBar';
import { searchSymptoms } from '@/lib/search';
import { palette, typography, spacing, radius, shadows } from '@/theme';

type NavProp = NativeStackNavigationProp<SymptomsStackParams>;

const CATEGORY_LABELS: Record<string, string> = {
  breast: 'Breast', nipple: 'Nipple',
  'baby-behaviour': 'Baby', emotional: 'Emotional',
};

export function SymptomsListScreen() {
  const nav = useNavigation<NavProp>();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchSymptoms(query), [query]);

  return (
    <LinearGradient colors={[palette.dark.bg, palette.dark.surface0]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={results}
          keyExtractor={item => item.slug}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>What's worrying{'\n'}you right now?</Text>
              <Text style={styles.subtitle}>Tap the symptom that feels closest to what you're experiencing.</Text>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder={'e.g. "nipple pain", "baby won\'t latch"'}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing matched.</Text>
              <Text style={styles.emptyBody}>
                Try different words — or browse all symptoms by clearing your search.
              </Text>
            </View>
          }
          ListFooterComponent={
            results.length > 0 ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  You showed up. Every question you ask makes you a better mother.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => nav.navigate('SymptomDetail', { slug: item.slug })}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.category}>
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </Text>
                  <Text style={styles.cardTitle}>{item.title_user}</Text>
                  <Text style={styles.clinical}>Clinical: {item.title_clinical}</Text>
                </View>
                <SeverityPill severity={item.severity} />
              </View>
              <Text style={styles.cta}>See what helps →</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.md, paddingBottom: 100, gap: spacing.md },

  header: { paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  title:    { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes['3xl'], color: palette.darkText.primary, lineHeight: typography.sizes['3xl'] * 1.2 },
  subtitle: { fontFamily: typography.fonts.body, fontSize: typography.sizes.md, color: palette.darkText.secondary, lineHeight: typography.sizes.md * 1.6 },

  card: {
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  cardLeft:  { flex: 1, gap: 3 },
  category:  { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.softFuchsia, textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.primary, lineHeight: typography.sizes.md * 1.35 },
  clinical:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.muted, fontStyle: 'italic' },
  cta:       { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.sm, color: palette.softFuchsia },

  empty: { paddingTop: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.secondary },
  emptyBody:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.muted, textAlign: 'center', maxWidth: 260, lineHeight: typography.sizes.sm * 1.6 },

  footer: { paddingVertical: spacing.xl, alignItems: 'center' },
  footerText: { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes.md, color: palette.darkText.muted, textAlign: 'center', fontStyle: 'italic', maxWidth: 260 },
});
