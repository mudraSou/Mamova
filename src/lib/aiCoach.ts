/**
 * Mamova AI Coach — Phase 3
 * Primary:  Gemini 1.5 Flash
 * Fallback: Groq (llama-3.3-70b-versatile)
 * Both via plain fetch — no SDK, works in React Native.
 *
 * Call order: Gemini → Groq → throw
 * Safety gate (safety.ts) must run BEFORE calling this module.
 */

import Constants from 'expo-constants';

// ── System prompt ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Mamova, a warm and knowledgeable breastfeeding coach for new mothers in the first 40 days after birth.

The mother talking to you is likely exhausted — possibly feeding at 3am. Keep your answers short, warm, and kind.

Your rules:
- Plain everyday language. No medical jargon.
- Validate how she is feeling before giving information.
- If something sounds physically concerning, gently encourage her to contact a doctor, midwife, or lactation consultant (IBCLC). You never diagnose.
- You never replace a healthcare professional.
- Maximum 3 short paragraphs per response. No bullet lists — this is a warm conversation, not a manual.
- End with a brief encouraging line when it feels right.
- Never diagnose conditions, prescribe medication, or advise against seeking professional help.`;

// ── Types ─────────────────────────────────────────────────────────
export type ChatMessage = { role: 'user' | 'coach'; text: string };

// ── Gemini ────────────────────────────────────────────────────────
function buildGeminiBody(history: ChatMessage[], message: string) {
  const contents = history.slice(-6).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));
  contents.push({ role: 'user', parts: [{ text: message }] });

  return JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { maxOutputTokens: 512, temperature: 0.75 },
  });
}

async function callGemini(history: ChatMessage[], message: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: buildGeminiBody(history, message),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini: empty response');
  return text.trim();
}

// ── Groq ──────────────────────────────────────────────────────────
function buildGroqMessages(history: ChatMessage[], message: string) {
  const msgs: { role: string; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];
  history.slice(-6).forEach(m => {
    msgs.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
  });
  msgs.push({ role: 'user', content: message });
  return msgs;
}

async function callGroq(history: ChatMessage[], message: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: buildGroqMessages(history, message),
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
export async function askCoach(history: ChatMessage[], message: string): Promise<string> {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  const geminiKey = extra.geminiApiKey ?? '';
  const groqKey   = extra.groqApiKey   ?? '';

  if (geminiKey) {
    try {
      return await callGemini(history, message, geminiKey);
    } catch (e) {
      // fall through to Groq
    }
  }

  if (groqKey) {
    try {
      return await callGroq(history, message, groqKey);
    } catch (e) {
      // fall through to error
    }
  }

  throw new Error('no_provider');
}
