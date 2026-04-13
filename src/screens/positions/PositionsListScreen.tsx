import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PositionsStackParams } from '@/navigation';
import { SearchBar } from '@/components/ui/SearchBar';
import { searchPositions } from '@/lib/search';
import { palette, typography, spacing, radius, shadows, gradients } from '@/theme';

type NavProp = NativeStackNavigationProp<PositionsStackParams>;

const DIFFICULTY: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced',
};

export function PositionsListScreen() {
  const nav = useNavigation<NavProp>();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchPositions(query), [query]);

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
              <Text style={styles.title}>How to feed</Text>
              <Text style={styles.subtitle}>Pick the position that feels right for you and your baby today.</Text>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder={'e.g. "c-section", "side lying", "newborn"'}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing matched.</Text>
              <Text style={styles.emptyBody}>
                Try different words — or clear your search to browse all positions.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => nav.navigate('PositionDetail', { slug: item.slug })}
              activeOpacity={0.8}
            >
              <LinearGradient colors={gradients.button} style={styles.iconBox}>
                <Text style={styles.icon}>✦</Text>
              </LinearGradient>
              <View style={styles.cardText}>
                <Text style={styles.difficulty}>{DIFFICULTY[item.difficulty] ?? item.difficulty}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.tagline}>{item.tagline}</Text>
                <View style={styles.tags}>
                  {(item.best_for ?? []).slice(0, 2).map((t: string) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
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
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.lg, padding: spacing.md,
    ...shadows.sm,
  },
  iconBox: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  icon:     { fontSize: 20, color: palette.white },
  cardText: { flex: 1, gap: 3 },
  difficulty: { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.softFuchsia, textTransform: 'uppercase', letterSpacing: 0.6 },
  cardTitle:  { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.primary },
  tagline:    { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.4 },
  tags:       { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag:        { backgroundColor: palette.dark.surface2, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText:    { fontFamily: typography.fonts.body, fontSize: 10, color: palette.darkText.muted },
  chevron:    { fontSize: 24, color: palette.darkText.muted, marginTop: 8 },

  empty: { paddingTop: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.secondary },
  emptyBody:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.muted, textAlign: 'center', maxWidth: 260, lineHeight: typography.sizes.sm * 1.6 },
});
