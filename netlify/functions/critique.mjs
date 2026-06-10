// ============================================================
// NETLIFY FUNCTION — /api/critique
// Server-side Claude core for the TIQUE factory.
// Requires the ANTHROPIC_API_KEY environment variable on the
// Netlify site; without it the function reports hasKey:false and
// the front-end runs on LOCAL GEARS (or a visitor-provided key).
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { TIQUES } from '../../src/copy.js';
import { MODEL, analysisSchema, analysisPrompt, chatPrompt } from '../../src/prompts.js';

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'bad_json' });
  }

  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);

  if (body.kind === 'ping') return json(200, { ok: true, hasKey });
  if (!hasKey) return json(503, { error: 'no_key' });

  const tique = TIQUES.find((t) => t.id === body.tiqueId);
  if (!tique) return json(400, { error: 'unknown_tique' });
  if (typeof body.story !== 'string' || !body.story.trim()) return json(400, { error: 'empty_story' });
  if (body.story.length > 400_000) return json(413, { error: 'story_too_large' });
  const mode = ['draft', 'finished', 'pitch'].includes(body.mode) ? body.mode : 'draft';

  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

  try {
    if (body.kind === 'analyze') {
      const { system, user } = analysisPrompt(tique, body.story, mode, String(body.brief || ''));
      // Thinking stays off here: synchronous Netlify functions have a
      // ~10s budget and the seven room verdicts run as parallel calls.
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: user }],
        output_config: { format: analysisSchema() },
      });
      const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
      return json(200, JSON.parse(text));
    }

    if (body.kind === 'chat') {
      const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
      const result = body.result || { score: 5, oneLiner: '', critique: '' };
      const question = String(body.question || '').slice(0, 600);
      const { system, messages } = chatPrompt(tique, body.story, mode, result, history, question);
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1000,
        output_config: { effort: 'low' },
        system,
        messages,
      });
      const text = response.content.find((b) => b.type === 'text')?.text ?? '…';
      return json(200, { text });
    }

    return json(400, { error: 'unknown_kind' });
  } catch (err) {
    console.error('[critique fn]', err);
    const status = err?.status >= 400 && err?.status < 600 ? 502 : 500;
    return json(status, { error: 'upstream_failed', detail: String(err?.message || err).slice(0, 300) });
  }
};

export const config = { path: '/api/critique' };
