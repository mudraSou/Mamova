import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, typography, spacing, radius } from '@/theme';
import reviewersData from '@/data/reviewers.json';

interface Props {
  reviewedById?: string | null;
}

export function ReviewerBadge({ reviewedById }: Props) {
  if (!reviewedById) {
    return (
      <View style={styles.pending}>
        <Text style={styles.pendingText}>○  Medical review pending</Text>
      </View>
    );
  }

  const r = (reviewersData as any[]).find(x => x.id === reviewedById);
  if (!r) return null;

  const creds    = (r.credentials ?? []).join(', ');
  const location = [r.hospital, r.city].filter(Boolean).join(', ');

  return (
    <View style={styles.badge}>
      <View style={styles.check}>
        <Text style={styles.checkMark}>✓</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>
          Reviewed by {r.title} {r.name}{creds ? ` — ${creds}` : ''}
        </Text>
        <Text style={styles.meta}>
          {r.specialization}{location ? ` · ${location}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(134,239,172,0.06)',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(134,239,172,0.12)',
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(134,239,172,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkMark: {
    fontSize: 10,
    color: palette.safe,
    fontWeight: '700',
  },
  info: { flex: 1, gap: 2 },
  name: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.xs,
    color: palette.safe,
    lineHeight: typography.sizes.xs * 1.5,
  },
  meta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: palette.darkText.muted,
  },

  pending: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  pendingText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: palette.darkText.muted,
    fontStyle: 'italic',
  },
});
