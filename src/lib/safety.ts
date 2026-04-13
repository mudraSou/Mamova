/**
 * Mamova Safety Gate
 * Deterministic regex patterns — runs BEFORE any AI call.
 * False positives (escalating when not strictly needed) are intentional.
 * A mother's safety > precision.
 *
 * Port of safety.js from the web version, adapted for TypeScript.
 */

const RED_FLAG_PATTERNS: RegExp[] = [
  // ── Fever ─────────────────────────────────────────────────────
  /\bfever\b/i,
  /\btemperature\s+(is\s+)?(above|over|high)\b/i,
  /\b3[89]\s*\.?\s*[0-9]?\s*(degrees|°|celsius|c\b)/i,

  // ── Infection signs ───────────────────────────────────────────
  /\bred\s+streak/i,
  /\bpus\b/i,
  /\bmastitis\b/i,
  /\babscess\b/i,
  /\binfect(ed|ion)\b/i,
  /\bbreast\s+(is\s+)?(hot|swollen|hard\s+and\s+red)\b/i,

  // ── Bleeding ──────────────────────────────────────────────────
  /\bbleed(ing)?\b/i,
  /\bcrack(ed|ing)?.{0,20}blood\b/i,
  /\bblood\s+in\s+(the\s+)?milk\b/i,
  /\bwound.{0,20}open(ed|ing)?\b/i,

  // ── Mental health crisis ──────────────────────────────────────
  /\bwant\s+to\s+(hurt|harm|kill)\s+(myself|my\s+baby|him|her)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bdon.{0,5}t\s+want\s+to\s+(live|be\s+here)\b/i,
  /\bthoughts?\s+of\s+(harming|hurting|killing)\b/i,
  /\bcan.{0,5}t\s+go\s+on\b/i,

  // ── Baby emergency ────────────────────────────────────────────
  /\bbaby\s+(won.{0,5}t?\s+wake|is\s+not\s+waking|can.{0,5}t?\s+wake)\b/i,
  /\bbaby\s+(is\s+)?(limp|floppy|unresponsive)\b/i,
  /\bbaby\s+(is\s+)?(turn(ing)?\s+(blue|purple)|not\s+breath)\b/i,
  /\bbaby\s+(is\s+)?not\s+respond/i,
  /\bnewborn.{0,20}(seizure|convuls)/i,

  // ── Breathing / cardiac ───────────────────────────────────────
  /\bcan.{0,5}t\s+breath(e|ing)\b/i,
  /\bchest\s+(pain|tight(ness)?)\b/i,
  /\bheart\s+(racing|pounding|irregular)\b/i,
  /\bpassing\s+out\b/i,
  /\bdizzy\s+and\s+can.{0,5}t\b/i,

  // ── Postpartum haemorrhage ────────────────────────────────────
  /\bsoaking.{0,20}(pad|sheet|cloth)\b/i,
  /\bheavy\s+bleed(ing)?\b/i,
  /\bpass(ing)?\s+clots?\b/i,
];

const MENTAL_HEALTH_PATTERNS = RED_FLAG_PATTERNS.slice(14, 19);
const BABY_EMERGENCY_PATTERNS = RED_FLAG_PATTERNS.slice(19, 24);
const BLEEDING_PATTERNS       = RED_FLAG_PATTERNS.slice(10, 14);
const INFECTION_PATTERNS      = RED_FLAG_PATTERNS.slice(3, 10);

export type EscalationCategory =
  | 'mental_health'
  | 'baby_emergency'
  | 'bleeding'
  | 'infection'
  | 'default';

/**
 * Returns true when the message is safe to send to the AI coach.
 * Returns false when any red-flag pattern matches — show escalation card instead.
 */
export function isSafeToCoach(message: string): boolean {
  return !RED_FLAG_PATTERNS.some(p => p.test(message));
}

/**
 * Returns which escalation category best matches the message.
 * Only call this when isSafeToCoach() returns false.
 */
export function classifyEscalation(message: string): EscalationCategory {
  if (MENTAL_HEALTH_PATTERNS.some(p => p.test(message)))  return 'mental_health';
  if (BABY_EMERGENCY_PATTERNS.some(p => p.test(message))) return 'baby_emergency';
  if (BLEEDING_PATTERNS.some(p => p.test(message)))       return 'bleeding';
  if (INFECTION_PATTERNS.some(p => p.test(message)))      return 'infection';
  return 'default';
}

/** Returns matched pattern strings for internal logging only — never shown to user. */
export function getMatchedFlags(message: string): string[] {
  return RED_FLAG_PATTERNS
    .filter(p => p.test(message))
    .map(p => p.source);
}
