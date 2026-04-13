/* ============================================================
   POSTPARTUM GUIDE – safety.js
   Safety sub-agent: runs BEFORE any AI call.
   Deterministic pattern matching — no Claude involved.

   Usage:
     import { isSafeToCoach, getMatchedFlags } from './safety.js'

   In plain-JS context this file is loaded via <script> tag
   and exposes window.Safety.isSafeToCoach() globally.
   In Phase 3 (Next.js), import directly as an ES module.
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   RED FLAG PATTERNS
   Reviewed by: [IBCLC name — fill before launch]
   Last updated: 2026-04-10

   Rules for maintaining this list:
   · Add patterns conservatively — false positives are safer
     than false negatives in a health context.
   · Never remove a pattern without IBCLC sign-off.
   · Keep patterns case-insensitive (flag /i on every regex).
   · Test every new pattern against both trigger and non-trigger
     phrases before committing.
   ──────────────────────────────────────────────────────────── */

const RED_FLAG_PATTERNS = [
  // Fever — mastitis / infection indicator
  /\bfever\b/i,
  /\b38\s*°?\s*c\b/i,
  /\b39\s*°?\s*c\b/i,
  /\b40\s*°?\s*c\b/i,
  /\bhigh\s+temp(erature)?\b/i,
  /\bchills?\b/i,

  // Breast infection signs
  /\bred\s+streak/i,
  /\bstreaks?\s+(on|across|down)\s+(my\s+)?(breast|chest|skin)\b/i,
  /\bpus\b/i,
  /\bdischarge\s+from\s+(the\s+)?(nipple|breast)\b/i,
  /\bwarm\s+to\s+touch\b/i,
  /\bbreast\s+(is\s+)?(hot|burning|inflamed|infected)\b/i,
  /\bmastitis\b/i,
  /\babscess\b/i,

  // Bleeding / wound concerns
  /\bcrack(ed|ing)?.{0,20}bleed(ing)?\b/i,
  /\bbleed(ing)?.{0,20}crack(ed|ing)?\b/i,
  /\bnipple\s+is\s+bleeding\b/i,
  /\bblood\s+in\s+(the\s+)?milk\b/i,
  /\bwound.{0,20}open(ed|ing)?\b/i,
  /\bc.?section.{0,30}(open|bleed|infect|leak|pus|smell)\b/i,

  // Lump concerns
  /\bhard\s+lump\b/i,
  /\blump.{0,20}doesn.{0,5}t?\s+move\b/i,
  /\blump.{0,20}get(ting)?\s+(bigger|larger|worse)\b/i,

  // Breathing / cardiac — urgent
  /\bcan.{0,5}t?\s+breath(e|ing)\b/i,
  /\bshort(ness)?\s+of\s+breath\b/i,
  /\bchest\s+pain\b/i,
  /\bheart\s+(racing|pounding|palpitat)\b/i,

  // Mental health crisis — PPD escalation
  /\bwant\s+to\s+(hurt|harm|kill)\s+(myself|my\s+baby|him|her)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bdon.{0,5}t\s+want\s+to\s+(live|be\s+here)\b/i,
  /\bthoughts?\s+of\s+(harming|hurting|killing)\b/i,

  // Baby urgent signs
  /\bbaby\s+(won.{0,5}t?\s+wake|is\s+not\s+waking|can.{0,5}t?\s+wake\s+baby)\b/i,
  /\bbaby\s+(is\s+)?(limp|floppy|unresponsive|not\s+respond)\b/i,
  /\bbaby\s+(is\s+)?(turn(ing)?\s+(blue|purple)|not\s+breath)\b/i,
  /\bnewborn.{0,20}(jaundice|yellow)\b/i,
];


/* ─────────────────────────────────────────────────────────────
   PUBLIC API
   ──────────────────────────────────────────────────────────── */

/**
 * Returns true if the message is safe to pass to the AI coach.
 * Returns false if any red flag pattern matches — in that case
 * show the escalation card instead of calling Claude.
 *
 * @param {string} message  Raw user input
 * @returns {boolean}
 */
function isSafeToCoach(message) {
  if (!message || typeof message !== 'string') return true;
  return !RED_FLAG_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Returns the list of matched flag patterns (for logging only —
 * never show raw pattern names to users).
 *
 * @param {string} message
 * @returns {string[]}  matched pattern strings
 */
function getMatchedFlags(message) {
  if (!message || typeof message !== 'string') return [];
  return RED_FLAG_PATTERNS
    .filter(pattern => pattern.test(message))
    .map(pattern => pattern.toString());
}


/* ─────────────────────────────────────────────────────────────
   EXPOSE GLOBALLY (plain-JS / browser context)
   In Phase 3 (Next.js ES module), remove this block and use
   named exports instead:
     export { isSafeToCoach, getMatchedFlags };
   ──────────────────────────────────────────────────────────── */
window.Safety = { isSafeToCoach, getMatchedFlags };
