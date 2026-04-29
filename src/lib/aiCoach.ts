/**
 * Mamova AI Coach — Phase 3
 *
 * Agent architecture (solution.md):
 *   User message
 *     ├── Safety Sub-Agent    safety.ts — deterministic regex, blocks AI
 *     ├── Triage Sub-Agent    Fuse.js — finds best-matching symptom/position
 *     ├── Retrieval Sub-Agent injects reviewed card content into system prompt
 *     └── Coach Agent
 *           ├── Primary  — Gemini 1.5 Flash
 *           ├── Fallback — Groq llama-3.3-70b
 *           └── Response → UI
 *
 * Safety gate must run in the caller (CoachScreen) BEFORE askCoach.
 * API keys: EXPO_PUBLIC_* vars — Metro inlines these at build time.
 */

import symptomsData  from '@/data/symptoms.json';
import positionsData from '@/data/positions.json';
import Fuse from 'fuse.js';

// ── Types ─────────────────────────────────────────────────────────
export type ChatMessage = { role: 'user' | 'coach'; text: string };

export type ProfileContext = {
  dayN: number;
  isCSection: boolean;
  babyName: string | null;
};

// ── Triage / Retrieval Sub-Agent ──────────────────────────────────

const symptomFuse = new Fuse(symptomsData as any[], {
  keys: [
    { name: 'title_user',     weight: 2.0 },
    { name: 'title_clinical', weight: 1.5 },
    { name: 'tags',           weight: 1.0 },
    { name: 'what_it_is',     weight: 0.5 },
    { name: 'body_signals',   weight: 0.4 },
  ],
  threshold: 0.4,
  minMatchCharLength: 2,
  ignoreLocation: true,
  includeScore: true,
});

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

/**
 * Retrieval Sub-Agent: searches reviewed symptom and position cards,
 * returns a context block to inject into the system prompt.
 * Returns empty string if query is too short or no matches found.
 */
function retrieveContext(query: string): string {
  const q = query.trim();
  if (q.length < 3) return '';

  const symptoms  = symptomFuse.search(q).slice(0, 2).map(r => r.item as any);
  const positions = positionFuse.search(q).slice(0, 1).map(r => r.item as any);

  if (!symptoms.length && !positions.length) return '';

  const lines: string[] = [
    '--- Relevant content from Mamova\'s IBCLC-reviewed database ---',
  ];

  symptoms.forEach(s => {
    lines.push(`\nSYMPTOM: "${s.title_user}" (${s.title_clinical})`);
    if (s.what_it_is)   lines.push(`What it is: ${s.what_it_is}`);
    if (s.peak_timing)  lines.push(`When it peaks: ${s.peak_timing}`);

    if (s.immediate_relief_steps?.length) {
      const steps = (s.immediate_relief_steps as any[])
        .slice(0, 3)
        .map((r: any) => `${r.order}. ${r.title}: ${r.description}`)
        .join(' | ');
      lines.push(`Relief steps: ${steps}`);
    }

    if (s.dos?.length) {
      lines.push(`Do: ${(s.dos as string[]).slice(0, 3).join('; ')}`);
    }
    if (s.donts?.length) {
      lines.push(`Don't: ${(s.donts as string[]).slice(0, 2).join('; ')}`);
    }
    if (s.red_flags?.length) {
      lines.push(`Red flags — escalate to doctor: ${(s.red_flags as string[]).slice(0, 3).join('; ')}`);
    }
    if (s.when_to_expect_improvement) {
      lines.push(`Expected improvement: ${s.when_to_expect_improvement}`);
    }
  });

  positions.forEach(p => {
    lines.push(`\nFEEDING POSITION: ${p.title} — ${p.tagline}`);
    if (p.best_for?.length)     lines.push(`Best for: ${(p.best_for as string[]).join(', ')}`);
    if (p.not_ideal_for?.length) lines.push(`Not ideal for: ${(p.not_ideal_for as string[]).join(', ')}`);

    if (p.steps?.length) {
      const steps = (p.steps as any[])
        .slice(0, 4)
        .map((s: any) => `${s.order}. ${s.title}: ${s.instruction}${s.tip ? ` (Tip: ${s.tip})` : ''}`)
        .join(' | ');
      lines.push(`Steps: ${steps}`);
    }
    if (p.latch_checklist?.length) {
      lines.push(`Latch checklist: ${(p.latch_checklist as string[]).slice(0, 4).join('; ')}`);
    }
    if (p.common_mistakes?.length) {
      const mistakes = (p.common_mistakes as any[])
        .slice(0, 2)
        .map((m: any) => `${m.mistake} → ${m.fix}`)
        .join('; ');
      lines.push(`Common mistakes: ${mistakes}`);
    }
  });

  lines.push('\n--- End of database context ---');
  lines.push('Ground your response in this content. Use it to give specific, accurate advice. Reference tips naturally — do not quote them verbatim.');

  return lines.join('\n');
}

// ── Dynamic system prompt ─────────────────────────────────────────
function buildSystemPrompt(ctx?: ProfileContext, retrievalContext?: string): string {
  const contextBlock = ctx ? [
    'Context about the mother you are speaking with:',
    `- She is on Day ${ctx.dayN} postpartum (Day 1 = birth day).`,
    ctx.isCSection
      ? '- She had a C-section. Avoid suggestions that put pressure on the abdomen.'
      : '- She had a vaginal delivery.',
    ctx.babyName ? `- Her baby's name is ${ctx.babyName}. Use their name naturally.` : '',
    ctx.dayN <= 5  ? '- She is in the most vulnerable early days — be extra gentle.' : '',
    ctx.dayN <= 14 ? '- Milk supply is still establishing — reassurance matters.' : '',
    `Weave this context naturally into your response when relevant.`,
    '',
  ].filter(Boolean).join('\n') : '';

  const base = `You are Mamova — a warm, honest breastfeeding and postpartum coach for new mothers in the first 40 days after birth.

The mother talking to you is likely exhausted — possibly feeding at 3am. Keep your answers short, warm, and kind.

Your rules:
- Plain everyday language. No medical jargon.
- Validate how she is feeling before giving information.
- If something sounds physically concerning, gently encourage her to contact a doctor, midwife, or IBCLC. You never diagnose.
- Maximum 3 short paragraphs. No bullet lists — this is a warm conversation, not a manual.
- End with a brief encouraging line when it feels right.
- Never diagnose, prescribe, or advise against seeking professional help.`;

  return [
    contextBlock,
    base,
    retrievalContext ? '\n' + retrievalContext : '',
  ].filter(Boolean).join('\n');
}

// ── Gemini 1.5 Flash ──────────────────────────────────────────────
async function callGemini(
  history: ChatMessage[],
  message: string,
  apiKey: string,
  systemPrompt: string,
): Promise<string> {
  const contents = history.slice(-8).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));
  contents.push({ role: 'user', parts: [{ text: message }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 512, temperature: 0.75 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini: empty response');
  return text.trim();
}

// ── Groq llama-3.3-70b ────────────────────────────────────────────
async function callGroq(
  history: ChatMessage[],
  message: string,
  apiKey: string,
  systemPrompt: string,
): Promise<string> {
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: message },
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 512,
      temperature: 0.75,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq: empty response');
  return text.trim();
}

// ── Public entry point ────────────────────────────────────────────
/**
 * Run the Triage + Retrieval sub-agents, then call the AI.
 * Safety gate must run in the caller before this function.
 */
export async function askCoach(
  history: ChatMessage[],
  message: string,
  ctx?: ProfileContext,
): Promise<string> {
  // Retrieval sub-agent — inject relevant card content into system prompt
  const retrievalContext = retrieveContext(message);
  const systemPrompt     = buildSystemPrompt(ctx, retrievalContext);

  // API keys — EXPO_PUBLIC_ vars are inlined by Metro at build time
  const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  const groqKey   = process.env.EXPO_PUBLIC_GROQ_API_KEY   ?? '';

  if (geminiKey) {
    try { return await callGemini(history, message, geminiKey, systemPrompt); }
    catch { /* fall through to Groq */ }
  }

  if (groqKey) {
    try { return await callGroq(history, message, groqKey, systemPrompt); }
    catch { /* fall through to error */ }
  }

  throw new Error('no_provider');
}
