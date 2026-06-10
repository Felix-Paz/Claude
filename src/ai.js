// ============================================================
// AI.JS — the CLAUDE CORE cogitation engine.
// Resolution order per request:
//   1. Netlify function (/api/critique) if the site has a server key
//   2. Browser-direct Anthropic API if the visitor pasted their own key
//   3. LOCAL GEARS (analysis.js) — always works, no key required
// Every TIQUE response is generated from the user's actual text.
// ============================================================

import { TIQUES } from './copy.js';
import { localAnalyze, localChat, computeMetrics, metricsBrief } from './analysis.js';
import { MODEL, analysisSchema, analysisPrompt, chatPrompt } from './prompts.js';

const KEY_STORAGE = 'tique.anthropicKey';

let serverAvailable = null; // null = unknown, probed lazily
let browserClient = null;

export function getStoredKey() {
  try { return localStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; }
}
export function setStoredKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch { /* private mode — key lives for the session only */ }
  browserClient = null;
}

async function getBrowserClient() {
  const key = getStoredKey();
  if (!key) return null;
  if (!browserClient) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    browserClient = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  }
  return browserClient;
}

async function probeServer() {
  if (serverAvailable !== null) return serverAvailable;
  try {
    const res = await fetch('/api/critique', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'ping' }),
    });
    if (!res.ok) { serverAvailable = false; return false; }
    const data = await res.json().catch(() => ({}));
    serverAvailable = data.ok === true && data.hasKey === true;
  } catch {
    serverAvailable = false;
  }
  return serverAvailable;
}

/** Which brain is the factory using right now? 'server' | 'browser' | 'local' */
export async function resolveEngine() {
  if (await probeServer()) return 'server';
  if (getStoredKey()) return 'browser';
  return 'local';
}

// ------------------------------------------------------------------
// Engine calls
// ------------------------------------------------------------------
async function serverCall(body) {
  const res = await fetch('/api/critique', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`server ${res.status}`);
  return res.json();
}

async function browserAnalyze(tique, story, mode, brief) {
  const client = await getBrowserClient();
  const { system, user } = analysisPrompt(tique, story, mode, brief);
  // Browser-direct has no serverless timeout, so let the model think.
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { format: analysisSchema() },
  });
  const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
  return JSON.parse(text);
}

async function browserChat(tique, story, mode, result, history, question) {
  const client = await getBrowserClient();
  const { system, messages } = chatPrompt(tique, story, mode, result, history, question);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    output_config: { effort: 'low' },
    system,
    messages,
  });
  return response.content.find((b) => b.type === 'text')?.text ?? '…the creature stares silently.';
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Analyze the story for ALL rooms. Fires per-room requests in parallel;
 * calls onRoom(roomId, result) the moment each verdict is ready.
 * Local results are computed instantly as a baseline; AI results replace
 * them per-room when (if) they arrive. Resolves with {metrics, results, engine}.
 */
export async function analyzeStory(story, mode, onRoom, onEngine) {
  const local = localAnalyze(story, mode);
  const metrics = local.metrics;
  const results = { ...local.results };

  const engine = await resolveEngine();
  onEngine?.(engine);

  if (engine === 'local') {
    // Local gears: stagger delivery slightly so each room still feels "processed".
    for (const t of TIQUES) onRoom?.(t.id, results[t.id]);
    return { metrics, results, engine };
  }

  const brief = metricsBrief(metrics);
  await Promise.all(
    TIQUES.map(async (tique) => {
      try {
        let out;
        if (engine === 'server') {
          out = await serverCall({ kind: 'analyze', tiqueId: tique.id, story, mode, brief });
        } else {
          out = await browserAnalyze(tique, story, mode, brief);
        }
        out.score = Math.max(0, Math.min(10, Math.round(Number(out.score) * 10) / 10));
        out.tips = (out.tips || []).slice(0, 3);
        out.engine = engine;
        results[tique.id] = out;
        onRoom?.(tique.id, out);
      } catch (err) {
        console.warn(`[tique] ${tique.id} fell back to local gears:`, err);
        results[tique.id].fellBack = true;
        onRoom?.(tique.id, results[tique.id]);
      }
    }),
  );
  return { metrics, results, engine };
}

/** Ask one TIQUE a follow-up question. Always answers something. */
export async function askTique(tiqueId, story, mode, result, history, question, metrics) {
  const tique = TIQUES.find((t) => t.id === tiqueId);
  const engine = result.engine === 'local' ? 'local' : await resolveEngine();
  try {
    if (engine === 'server') {
      const out = await serverCall({
        kind: 'chat', tiqueId, story, mode, question,
        result: { score: result.score, oneLiner: result.oneLiner, critique: result.critique },
        history: history.slice(-8),
      });
      return out.text;
    }
    if (engine === 'browser') {
      return await browserChat(tique, story, mode, result, history.slice(-8), question);
    }
  } catch (err) {
    console.warn('[tique] chat fell back to local gears:', err);
  }
  const m = metrics || computeMetrics(story);
  return localChat(tiqueId, question, m, result);
}
