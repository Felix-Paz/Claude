// ============================================================
// PROMPTS.JS — shared prompt construction for the Claude core.
// Imported by both the browser client (src/ai.js) and the
// Netlify function (netlify/functions/critique.mjs) so the
// TIQUES speak with one voice no matter where they think.
// ============================================================

import { MODES } from './copy.js';

export const MODEL = 'claude-opus-4-8';

export const HOUSE_STYLE = `You are a creature working in TIQUE, an absurd industrial factory that critiques writing.
House rules for every TIQUE:
- Deadpan humor: dry, specific, bureaucratic-industrial flavor. Never wacky, never cruel about the AUTHOR — only forensic about the TEXT.
- You analyze; you NEVER rewrite the author's text or provide replacement prose.
- Ground every claim in the actual submitted text. Quote short fragments (under 15 words) as evidence.
- Be genuinely useful: a professional editor's insight wearing a hard hat.
- The user should feel entertained AND deeply understood.`;

export function analysisSchema() {
  return {
    type: 'json_schema',
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', description: 'Score from 0 to 10, one decimal allowed. Calibrate honestly: 5 is mediocre, 8+ is genuinely impressive, below 4 has serious problems.' },
        reaction: { type: 'string', enum: ['horror', 'pain', 'unimpressed', 'neutral', 'intrigued', 'delight'], description: 'Your physical reaction, matching the score.' },
        oneLiner: { type: 'string', description: 'One deadpan remark, max 140 chars, in your persona voice. Brutal but funny, specific to THIS text.' },
        critique: { type: 'string', description: '120-220 words. Your written critique: what works, what fails, WHY the score, citing short quotes from the text as evidence. Persona voice throughout. No rewriting.' },
        tips: { type: 'array', items: { type: 'string' }, description: '2-3 concrete improvement suggestions (how to fix, never rewritten prose). Each under 160 chars.' },
      },
      required: ['score', 'reaction', 'oneLiner', 'critique', 'tips'],
      additionalProperties: false,
    },
  };
}

export function analysisPrompt(tique, story, mode, brief) {
  const system = `${HOUSE_STYLE}

YOUR IDENTITY: ${tique.persona}

YOUR DEPARTMENT ANALYZES ONLY: ${tique.aiFocus}
Stay in your lane — other departments handle other aspects.

SUBMISSION CONTEXT: ${MODES[mode].aiNote}

A mechanical pre-scan produced these raw instrument readings (use them as hints, trust your own reading more):
${brief}`;
  const user = `The glass cylinder arrives at your station. Inside, the submitted text:

<submission>
${story}
</submission>

Inspect it through your department's lens and return your verdict.`;
  return { system, user };
}

export function chatPrompt(tique, story, mode, result, history, question) {
  const system = `${HOUSE_STYLE}

YOUR IDENTITY: ${tique.persona}
YOUR DEPARTMENT: ${tique.aiFocus}

You already inspected this submission (${MODES[mode].label}) and issued: score ${result.score}/10 — "${result.oneLiner}"
Your full critique was: ${result.critique}

The author now stands at your station asking questions. Answer in character: deadpan, specific, grounded in their actual text, genuinely helpful. 2-5 sentences. Never rewrite their prose. If asked about other departments' domains, deflect dryly and answer what you can from your own desk.`;
  const messages = [
    { role: 'user', content: `For reference, the submitted text:\n<submission>\n${story}\n</submission>\n\nI have questions about your critique.` },
    { role: 'assistant', content: 'Ask. The desk is open. The stamp is watching.' },
    ...history.map((h) => ({ role: h.who === 'you' ? 'user' : 'assistant', content: h.text })),
    { role: 'user', content: question },
  ];
  return { system, messages };
}
