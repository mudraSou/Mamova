import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  type ViewStyle, type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { palette, gradients, typography, spacing, radius } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading, disabled, fullWidth = true, icon, style,
}: ButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isPrimary  = variant === 'primary';
  const isDisabled = disabled || loading;

  const sizeStyles: Record<Size, { height: number; fontSize: number; px: number }> = {
    sm: { height: 40, fontSize: typography.sizes.sm, px: spacing.md },
    md: { height: 52, fontSize: typography.sizes.md, px: spacing.lg },
    lg: { height: 60, fontSize: typography.sizes.lg, px: spacing.xl },
  };

  const { height, fontSize, px } = sizeStyles[size];

  const containerStyle: ViewStyle = {
    height,
    borderRadius: radius.full,
    paddingHorizontal: px,
    opacity: isDisabled ? 0.45 : 1,
    width: fullWidth ? '100%' : undefined,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    ...style,
  };

  const textStyle: TextStyle = {
    fontFamily: typography.fonts.bodyBold,
    fontSize,
    letterSpacing: 0.3,
  };

  if (isPrimary) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={containerStyle}
      >
        <LinearGradient
          colors={gradients.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.inner, { borderRadius: radius.full }]}
        >
          {loading
            ? <ActivityIndicator color={palette.white} size="small" />
            : <>
                {icon}
                <Text style={[textStyle, { color: palette.white }]}>{label}</Text>
              </>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<Exclude<Variant, 'primary'>, { bg: string; text: string; border?: string }> = {
    secondary: { bg: palette.dark.surface2,   text: palette.lightBlush,    border: palette.dark.surface3 },
    ghost:     { bg: 'transparent',            text: palette.softFuchsia,   border: undefined },
    danger:    { bg: palette.urgentBg,          text: palette.urgent,        border: undefined },
  };

  const vs = variantStyles[variant as Exclude<Variant, 'primary'>];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        containerStyle,
        styles.inner,
        {
          backgroundColor: vs.bg,
          borderWidth: vs.border ? 1 : 0,
          borderColor: vs.border,
        },
      ]}
    >
      {loading
        ? <ActivityIndicator color={vs.text} size="small" />
        : <>
            {icon}
            <Text style={[textStyle, { color: vs.text }]}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
