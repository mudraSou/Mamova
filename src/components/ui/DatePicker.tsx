import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette, typography, spacing, radius } from '@/theme';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Props {
  value: string | null;         // ISO YYYY-MM-DD or null
  onChange: (iso: string) => void;
  maxDate?: Date;               // defaults to today
  minDate?: Date;
}

export function DatePicker({ value, onChange, maxDate, minDate }: Props) {
  const today  = new Date();
  const maxD   = maxDate ?? today;

  const initDate = value ? new Date(value + 'T00:00:00') : today;
  const [viewYear,  setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());   // 0–11

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  // ── Navigation ────────────────────────────────────────────────
  const canGoPrev = !(minDate &&
    viewYear === minDate.getFullYear() &&
    viewMonth === minDate.getMonth());

  const canGoNext = !(
    viewYear  === maxD.getFullYear() &&
    viewMonth === maxD.getMonth()
  );

  const goPrev = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else                  { setViewMonth(m => m - 1); }
  };

  const goNext = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else                   { setViewMonth(m => m + 1); }
  };

  // ── Calendar grid ─────────────────────────────────────────────
  const firstWeekday  = new Date(viewYear, viewMonth, 1).getDay();  // 0=Sun
  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (day: number) =>
    !!selectedDate &&
    selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth()    === viewMonth &&
    selectedDate.getDate()     === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth()    === viewMonth &&
    today.getDate()     === day;

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (d > maxD) return true;
    if (minDate && d < minDate) return true;
    return false;
  };

  const handleSelect = (day: number) => {
    if (isDisabled(day)) return;
    const mm  = String(viewMonth + 1).padStart(2, '0');
    const dd  = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
  };

  return (
    <View style={styles.container}>

      {/* ── Month / year header ─────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goPrev}
          disabled={!canGoPrev}
          activeOpacity={0.7}
          style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
        >
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>

        <TouchableOpacity
          onPress={goNext}
          disabled={!canGoNext}
          activeOpacity={0.7}
          style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
        >
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Day-of-week labels ──────────────────────────────── */}
      <View style={styles.row}>
        {DAY_LABELS.map(d => (
          <View key={d} style={styles.cell}>
            <Text style={styles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {/* ── Date grid ───────────────────────────────────────── */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`e${idx}`} style={styles.cell} />;
          }
          const sel  = isSelected(day);
          const tod  = isToday(day);
          const dis  = isDisabled(day);

          return (
            <TouchableOpacity
              key={`d${day}`}
              style={styles.cell}
              onPress={() => handleSelect(day)}
              disabled={dis}
              activeOpacity={0.75}
            >
              <View style={[
                styles.circle,
                sel && styles.circleSelected,
                tod && !sel && styles.circleToday,
              ]}>
                <Text style={[
                  styles.dayText,
                  sel  && styles.dayTextSelected,
                  dis  && styles.dayTextDisabled,
                  tod && !sel && styles.dayTextToday,
                ]}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Selected date confirmation ──────────────────────── */}
      {selectedDate && (
        <View style={styles.confirmRow}>
          <Text style={styles.confirmText}>
            Selected: {selectedDate.toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.dark.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.dark.surface3,
    padding: spacing.md,
    gap: spacing.xs,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  monthLabel: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.md,
    color: palette.darkText.primary,
  },
  navBtn: {
    width: 36, height: 36,
    borderRadius: radius.full,
    backgroundColor: palette.dark.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.3 },
  navArrow: {
    fontSize: 22,
    color: palette.darkText.primary,
    lineHeight: 24,
  },

  // Grid
  row:  { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  cell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayLabel: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: 10,
    color: palette.darkText.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  circle: {
    width: 34, height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: {
    backgroundColor: palette.electricPurple,
  },
  circleToday: {
    borderWidth: 1.5,
    borderColor: palette.electricPurple,
  },

  dayText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: palette.darkText.primary,
  },
  dayTextSelected: {
    color: palette.white,
    fontFamily: typography.fonts.bodyBold,
  },
  dayTextDisabled: {
    color: palette.darkText.muted,
    opacity: 0.35,
  },
  dayTextToday: {
    color: palette.electricPurple,
    fontFamily: typography.fonts.bodyBold,
  },

  // Confirmation strip
  confirmRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.dark.surface2,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: palette.electricPurple,
  },
});
