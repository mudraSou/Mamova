import React, { useState, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
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

// ── Animated card: spring press + hover highlight ─────────────────
function PositionCard({ item, onPress }: { item: any; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = useState(false);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 25, bounciness: 6 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      activeOpacity={1}
      style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}
    >
      <Animated.View
        style={[styles.card, hovered && styles.cardHovered, { transform: [{ scale }] }]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <LinearGradient colors={hovered ? [palette.electricPurple, palette.lightBlush] : gradients.button} style={styles.iconBox}>
          <Text style={styles.icon}>✦</Text>
        </LinearGradient>
        <View style={styles.cardText}>
          <Text style={[styles.difficulty, hovered && styles.difficultyHovered]}>
            {DIFFICULTY[item.difficulty] ?? item.difficulty}
          </Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.tagline}>{item.tagline}</Text>
          <View style={styles.tags}>
            {(item.best_for ?? []).slice(0, 2).map((t: string) => (
              <View key={t} style={[styles.tag, hovered && styles.tagHovered]}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={[styles.chevron, hovered && styles.chevronHovered]}>›</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

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
              <Text style={styles.emptyBody}>Try different words — or clear your search to browse all positions.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PositionCard item={item} onPress={() => nav.navigate('PositionDetail', { slug: item.slug })} />
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  list:     { paddingHorizontal: spacing.md, paddingBottom: 100, gap: spacing.md },
  header:   { paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  title:    { fontFamily: typography.fonts.headlineBold, fontSize: typography.sizes['3xl'], color: palette.darkText.primary, lineHeight: typography.sizes['3xl'] * 1.2 },
  subtitle: { fontFamily: typography.fonts.body, fontSize: typography.sizes.md, color: palette.darkText.secondary, lineHeight: typography.sizes.md * 1.6 },

  card:        { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: palette.dark.surface1, borderRadius: radius.xl, padding: spacing.md, ...shadows.sm, borderWidth: 1, borderColor: 'transparent' },
  cardHovered: { backgroundColor: palette.dark.surface2, borderColor: palette.dark.surface3 },
  iconBox:     { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  icon:        { fontSize: 20, color: palette.white },
  cardText:    { flex: 1, gap: 3 },
  difficulty:         { fontFamily: typography.fonts.bodyBold, fontSize: typography.sizes.xs, color: palette.softFuchsia, textTransform: 'uppercase', letterSpacing: 0.6 },
  difficultyHovered:  { color: palette.electricPurple },
  cardTitle:   { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.primary },
  tagline:     { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.secondary, lineHeight: typography.sizes.sm * 1.4 },
  tags:        { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag:         { backgroundColor: palette.dark.surface2, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagHovered:  { backgroundColor: palette.dark.surface3 },
  tagText:     { fontFamily: typography.fonts.body, fontSize: 10, color: palette.darkText.muted },
  chevron:         { fontSize: 24, color: palette.darkText.muted, marginTop: 8 },
  chevronHovered:  { color: palette.electricPurple },

  empty:      { paddingTop: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.md, color: palette.darkText.secondary },
  emptyBody:  { fontFamily: typography.fonts.body, fontSize: typography.sizes.sm, color: palette.darkText.muted, textAlign: 'center', maxWidth: 260, lineHeight: typography.sizes.sm * 1.6 },
});
