/**
 * Mamova AI Coach
 * Primary:  Gemini 1.5 Flash
 * Fallback: Groq (llama-3.3-70b-versatile)
 * Both via plain fetch — no SDK, works in React Native + web.
 *
 * Safety gate (safety.ts) must run BEFORE calling askCoach.
 */

import Constants from 'expo-constants';

// ── Types ─────────────────────────────────────────────────────────
export type ChatMessage = { role: 'user' | 'coach'; text: string };

export type ProfileContext = {
  dayN: number;
  isCSection: boolean;
  babyName: string | null;
};

// ── Dynamic system prompt ─────────────────────────────────────────
function buildSystemPrompt(ctx?: ProfileContext): string {
  const contextBlock = ctx ? [
    'Context about the mother you are speaking with:',
    `- She is on Day ${ctx.dayN} postpartum (Day 1 = birth day).`,
    ctx.isCSection
      ? '- She had a C-section. Avoid suggestions that put pressure on the abdomen. Be mindful of her surgical recovery.'
      : '- She had a vaginal delivery.',
    ctx.babyName
      ? `- Her baby's name is ${ctx.babyName}. Use their name naturally in your responses.`
      : '',
    ctx.dayN <= 5
      ? '- She is in the most vulnerable early days. Be especially gentle and reassuring.'
      : ctx.dayN <= 14
        ? '- She is in the first two weeks — milk supply is establishing and emotions run high.'
        : '',
    `Use this context naturally. Mention Day ${ctx.dayN} when relevant. Don't force it.`,
    '',
  ].filter(Boolean).join('\n') : '';

  return `${contextBlock}You are Mamova — a warm, honest breastfeeding and postpartum coach for new mothers in the first 40 days after birth.

The mother talking to you is likely exhausted — possibly feeding at 3am. Keep your answers short, warm, and kind.

Your rules:
- Plain everyday language. No medical jargon.
- Validate how she is feeling before giving information.
- If something sounds physically concerning, gently encourage her to contact a doctor, midwife, or lactation consultant (IBCLC). You never diagnose.
- You never replace a healthcare professional.
- Maximum 3 short paragraphs per response. No bullet lists — this is a warm conversation, not a manual.
- End with a brief encouraging line when it feels right.
- Never diagnose conditions, prescribe medication, or advise against seeking professional help.`;
}

// ── Gemini ────────────────────────────────────────────────────────
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

// ── Groq ──────────────────────────────────────────────────────────
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
export async function askCoach(
  history: ChatMessage[],
  message: string,
  ctx?: ProfileContext,
): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx);
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  const geminiKey = extra.geminiApiKey ?? '';
  const groqKey   = extra.groqApiKey   ?? '';

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
