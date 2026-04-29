/**
 * Mamova Design System — Color Tokens
 * "You birthed life. Now reclaim yours."
 *
 * Palette family: Warm ivory → Dusty coral → Sage teal → Mint frost
 * Philosophy: Light and airy. Warm like morning light; cool like a deep breath.
 * Not clinical. Not cold. Honest and gentle.
 */

export const palette = {
  // ── Warm tones ───────────────────────────────────────────────
  deepViolet:      '#fdf2e9',   // warm ivory — main background canvas
  violetDark:      '#f7e8d8',   // slightly deeper warm
  violetMid:       '#edc9b0',   // warm sand-tan — mid surfaces
  electricPurple:  '#d4766a',   // dusty coral-rose — primary action
  electricDim:     '#bc5d52',   // deep coral — pressed state
  softFuchsia:     '#5e9e94',   // dusty sage-teal — secondary accent
  lightBlush:      '#f0a080',   // warm peach — highlights, active states
  blushDim:        '#e0906a',   // peach pressed

  // ── Surface layers (warm light theme) ───────────────────────
  dark: {
    bg:       '#fdf8f3',   // warm white — root background
    surface0: '#faf2ea',   // barely warm step up
    surface1: '#ffffff',   // card face
    surface2: '#fdf0e8',   // elevated card — subtle warmth
    surface3: '#edd8cc',   // borders, chips
    overlay:  'rgba(60, 35, 25, 0.45)',
  },

  // ── Surface layers (alternate) ──────────────────────────────
  light: {
    bg:       '#fdf8f3',
    surface0: '#f5ebe0',
    surface1: '#ffffff',
    surface2: '#f5f0ec',
    surface3: '#e8ddd5',
    overlay:  'rgba(60, 35, 25, 0.50)',
  },

  // ── Text ─────────────────────────────────────────────────────
  darkText: {
    primary:   '#2c1a10',   // warm near-black
    secondary: '#7a4e3c',   // warm medium brown
    muted:     '#b08878',   // warm muted
    inverse:   '#fdf8f3',   // light text (for any dark surfaces)
  },

  lightText: {
    primary:   '#2c1a10',
    secondary: '#7a4e3c',
    muted:     '#b08878',
    inverse:   '#fdf8f3',
  },

  // ── Semantic ─────────────────────────────────────────────────
  urgent:       '#d95a48',   // warm red
  urgentBg:     '#fde8e4',   // soft warm red wash
  attention:    '#d49058',   // warm amber
  attentionBg:  '#fdf0e0',   // soft amber wash
  safe:         '#5a9e78',   // sage green
  safeBg:       '#e0f5e8',   // soft green wash

  // ── Always ───────────────────────────────────────────────────
  white:       '#ffffff',
  black:       '#000000',
  transparent: 'transparent',
} as const;

// ── Gradient presets ─────────────────────────────────────────────
export const gradients = {
  // Warm coral → cool sage
  brand: ['#d4766a', '#5e9e94'] as const,
  brandReverse: ['#5e9e94', '#d4766a'] as const,

  // Button — warm coral to peach
  button: ['#d4766a', '#f0a080'] as const,
  buttonPressed: ['#bc5d52', '#d4766a'] as const,

  // Card — clean white to warm
  card: ['#ffffff', '#fdf0e8'] as const,

  // Warm peach accent — used for banners, badges, CTAs
  fuchsia: ['#f5c0b0', '#f0a080'] as const,

  // Splash / onboarding — warm cream → dusty rose → cool sage mist
  splash: ['#fdf2e9', '#f0c8b8', '#bcd8d4'] as const,
} as const;
