import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, typography, radius } from '@/theme';

type Severity = 'red' | 'yellow' | 'green';

const CONFIG: Record<Severity, { bg: string; text: string; label: string }> = {
  red:    { bg: palette.urgentBg,    text: palette.urgent,    label: 'Urgent care'       },
  yellow: { bg: palette.attentionBg, text: palette.attention, label: 'Attention needed'  },
  green:  { bg: palette.safeBg,      text: palette.safe,      label: 'All good'          },
};

export function SeverityPill({ severity }: { severity: Severity }) {
  const { bg, text, label } = CONFIG[severity] ?? CONFIG.green;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  label: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
