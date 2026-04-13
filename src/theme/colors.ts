/**
 * Mamova Design System — Color Tokens
 * "You birthed life. Now reclaim yours."
 *
 * Palette family: Deep violet → Electric purple → Soft fuchsia → Light blush
 * Philosophy: Dark-first. The app feels like a private, empowering space —
 * not a clinical tool. Rich violet atmosphere, never cold.
 */

export const palette = {
  // ── Brand spectrum ───────────────────────────────────────────
  deepViolet:      '#1a1133',   // primary dark surface
  violetDark:      '#130d26',   // deeper — used for overlays, modals
  violetMid:       '#2d1b69',   // mid-depth surface
  electricPurple:  '#7c3aed',   // primary action color
  electricDim:     '#6d28d9',   // pressed state
  softFuchsia:     '#c084fc',   // secondary accent
  lightBlush:      '#f0abfc',   // highlights, pills, warm accents
  blushDim:        '#e879f9',   // pressed blush

  // ── Surface layers (dark theme) ──────────────────────────────
  dark: {
    bg:       '#1a1133',   // root background
    surface0: '#1f1540',   // one step up
    surface1: '#261a4d',   // card background
    surface2: '#2d1f5a',   // elevated card
    surface3: '#361f6b',   // tooltip, popover
    overlay:  'rgba(26, 17, 51, 0.82)',  // modal scrim
  },

  // ── Surface layers (light theme) ────────────────────────────
  light: {
    bg:       '#faf5ff',   // warm violet-tinted white
    surface0: '#f3e8ff',   // subtle purple wash
    surface1: '#ffffff',   // card face
    surface2: '#f5f3ff',   // elevated card
    surface3: '#ede9fe',   // tag, chip background
    overlay:  'rgba(26, 17, 51, 0.60)',
  },

  // ── Text (dark theme) ────────────────────────────────────────
  darkText: {
    primary:   '#f5f0ff',   // near-white, warm violet tint
    secondary: '#c4b5fd',   // muted purple-white
    muted:     '#7c6fa0',   // dim
    inverse:   '#1a1133',   // dark text on light surfaces
  },

  // ── Text (light theme) ───────────────────────────────────────
  lightText: {
    primary:   '#1a1133',
    secondary: '#4c1d95',
    muted:     '#7c3aed',
    inverse:   '#f5f0ff',
  },

  // ── Semantic ─────────────────────────────────────────────────
  urgent:       '#f87171',   // red flag — warm, not clinical
  urgentBg:     '#3f1515',
  attention:    '#fbbf24',   // yellow
  attentionBg:  '#3f2a00',
  safe:         '#86efac',   // green — reassuring
  safeBg:       '#052e16',

  // ── Always ───────────────────────────────────────────────────
  white:       '#ffffff',
  black:       '#000000',
  transparent: 'transparent',
} as const;

// ── Gradient presets ─────────────────────────────────────────────
export const gradients = {
  // Main hero gradient — violet to fuchsia
  brand: ['#1a1133', '#7c3aed'] as const,
  brandReverse: ['#7c3aed', '#1a1133'] as const,

  // Button gradient
  button: ['#7c3aed', '#c084fc'] as const,
  buttonPressed: ['#6d28d9', '#a855f7'] as const,

  // Card gradient — subtle depth
  card: ['#261a4d', '#1f1540'] as const,

  // Fuchsia highlight — used for banners, CTAs
  fuchsia: ['#c084fc', '#f0abfc'] as const,

  // Splash / onboarding full-screen
  splash: ['#1a1133', '#2d1b69', '#4c1d95'] as const,
} as const;
