import Fuse from 'fuse.js';
import symptomsData from '@/data/symptoms.json';
import positionsData from '@/data/positions.json';

// ── Symptom search ────────────────────────────────────────────────
const symptomFuse = new Fuse(symptomsData as any[], {
  keys: [
    { name: 'title_user',     weight: 2.0 },
    { name: 'title_clinical', weight: 1.5 },
    { name: 'tags',           weight: 1.0 },
    { name: 'body_signals',   weight: 0.5 },
    { name: 'what_it_is',     weight: 0.4 },
  ],
  threshold: 0.4,
  minMatchCharLength: 2,
  ignoreLocation: true,
  includeScore: true,
});

// ── Position search ───────────────────────────────────────────────
const positionFuse = new Fuse(positionsData as any[], {
  keys: [
    { name: 'title',    weight: 2.0 },
    { name: 'tagline',  weight: 1.5 },
    { name: 'best_for', weight: 1.0 },
  ],
  threshold: 0.4,
  minMatchCharLength: 2,
  ignoreLocation: true,
  includeScore: true,
});

export function searchSymptoms(query: string): any[] {
  if (!query.trim()) return symptomsData as any[];
  return symptomFuse.search(query).map(r => r.item);
}

export function searchPositions(query: string): any[] {
  if (!query.trim()) return positionsData as any[];
  return positionFuse.search(query).map(r => r.item);
}

// ── Triage: returns best slug + confidence for BDD tests and future triage UI ──
export type TriageResult = { slug: string | null; confidence: 'high' | 'low' };

export function triageLocally(query: string): TriageResult {
  const q = query.trim().slice(0, 300);
  if (q.length < 2) return { slug: null, confidence: 'low' };
  const results = symptomFuse.search(q);
  if (!results.length) return { slug: null, confidence: 'low' };
  const top = results[0];
  const confidence = (top.score ?? 1) < 0.25 ? 'high' : 'low';
  return { slug: top.item.slug ?? null, confidence };
}
