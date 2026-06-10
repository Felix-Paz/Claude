// ============================================================
// ANALYSIS.JS — the LOCAL GEARS cogitation core.
// Real text metrics drive deterministic critiques that quote the
// author's actual words. Used standalone (no API key) and as
// grounding data passed to the AI engine.
// ============================================================

import { MODES } from './copy.js';

const CLICHES = [
  'in the nick of time', 'dark and stormy night', 'cold sweat', 'heart skipped a beat',
  'time stood still', 'deafening silence', 'crystal clear', 'shivers down', 'blood ran cold',
  'all hell broke loose', 'against all odds', 'at the end of the day', 'little did he know',
  'little did she know', 'little did they know', 'needless to say', 'without a second thought',
  'one fateful day', 'a chill ran', 'her breath caught', 'his breath caught', 'piercing blue eyes',
  'raven hair', 'let out a breath', "didn't know she was holding", "didn't know he was holding",
  'the calm before the storm', 'easier said than done', 'last but not least', 'only time would tell',
  'what could possibly go wrong', 'it was all a dream', 'woke up to the smell', 'orbs', 'mind racing',
  'heart pounding in', 'single tear', 'evil laugh', 'sigh of relief', 'eyes widened',
];

const EMOTION_WORDS = /\b(love|hate|fear|terror|joy|grief|rage|fury|despair|hope|dread|sorrow|ecstasy|anguish|longing|heartbreak)\b/gi;
const TELEGRAPH_WORDS = /\b(suddenly|all of a sudden|out of nowhere|unbeknownst|little did)\b/gi;
const HEDGE_WORDS = /\b(very|really|quite|just|somewhat|rather|almost|basically|actually|literally)\b/gi;

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+(?=[A-Z“"'(\d])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

function words(text) {
  return (text.toLowerCase().match(/[a-zà-ÿ'’-]+/gi) || []);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function round1(v) { return Math.round(v * 10) / 10; }

function trunc(s, n = 110) {
  s = s.trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

// ---------------------------------------------------------------
// METRICS
// ---------------------------------------------------------------
export function computeMetrics(text) {
  const sentences = splitSentences(text);
  const ws = words(text);
  const wordCount = ws.length;
  const sentenceCount = Math.max(1, sentences.length);
  const lens = sentences.map((s) => words(s).length);
  const avgLen = lens.reduce((a, b) => a + b, 0) / sentenceCount;
  const variance = lens.reduce((a, b) => a + (b - avgLen) ** 2, 0) / sentenceCount;
  const stdLen = Math.sqrt(variance);

  let longest = '', longestLen = 0;
  sentences.forEach((s, i) => { if (lens[i] > longestLen) { longestLen = lens[i]; longest = s; } });
  const runOns = sentences.filter((s, i) => lens[i] > 38);
  const fragments = sentences.filter((s, i) => lens[i] <= 3);

  const commas = (text.match(/,/g) || []).length;
  const exclaims = (text.match(/!/g) || []).length;
  const ellipses = (text.match(/(\.\.\.|…)/g) || []).length;
  const adverbs = ws.filter((w) => /ly$/.test(w) && w.length > 4 && !/(only|family|early|reply|supply|belly|silly|ally|fly|July)/i.test(w));
  const hedges = (text.match(HEDGE_WORDS) || []);
  const allCaps = (text.match(/\b[A-Z]{3,}\b/g) || []).filter((w) => !/^(I|OK|TV|USA|NASA)$/.test(w));

  // repeated notable words
  const freq = {};
  ws.forEach((w) => { if (w.length > 4) freq[w] = (freq[w] || 0) + 1; });
  const repeats = Object.entries(freq)
    .filter(([w, n]) => n >= Math.max(4, wordCount / 220))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const uniq = new Set(ws).size;
  const ttr = wordCount ? uniq / wordCount : 0; // vocabulary richness

  const dialogueLines = (text.match(/[“"][^”"]{2,}[”"]/g) || []);
  const dialogueRatio = dialogueLines.join(' ').length / Math.max(1, text.length);

  const lower = text.toLowerCase();
  const clichesFound = CLICHES.filter((c) => lower.includes(c));
  const telegraphs = (text.match(TELEGRAPH_WORDS) || []);
  const emotions = (text.match(EMOTION_WORDS) || []);

  // passive-ish constructions
  const passives = (text.match(/\b(was|were|been|being|is|are)\s+\w+ed\b/gi) || []);

  // paragraphs
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const longestPara = paragraphs.reduce((a, p) => Math.max(a, words(p).length), 0);

  // tone shift: exclaim/emotion density per quarter
  const quarters = [0, 1, 2, 3].map((i) => {
    const seg = text.slice((text.length / 4) * i, (text.length / 4) * (i + 1));
    return ((seg.match(/!/g) || []).length * 3 + (seg.match(EMOTION_WORDS) || []).length) / Math.max(1, words(seg).length) * 100;
  });
  const toneSwing = Math.max(...quarters) - Math.min(...quarters);

  // connective tissue (causality markers)
  const connectives = (lower.match(/\b(because|therefore|so that|which meant|as a result|since|thus|that was why)\b/g) || []).length;

  // pronoun pile-ups (ambiguity hint)
  const pronounRuns = (text.match(/\b(he|she|they|it)\b[^.!?]{0,40}\b(he|she|they|it)\b[^.!?]{0,40}\b(he|she|they|it)\b/gi) || []).length;

  const sample = (re) => { const m = text.match(re); return m ? trunc(m[0]) : null; };

  return {
    wordCount, sentenceCount, avgLen: round1(avgLen), stdLen: round1(stdLen),
    longest: trunc(longest, 160), longestLen,
    runOnCount: runOns.length, runOnSample: runOns[0] ? trunc(runOns[0], 140) : null,
    fragmentCount: fragments.length, fragmentSample: fragments[0] ? trunc(fragments[0]) : null,
    commaPer100: round1((commas / Math.max(1, wordCount)) * 100),
    exclaims, ellipses,
    adverbCount: adverbs.length, adverbPer100: round1((adverbs.length / Math.max(1, wordCount)) * 100),
    adverbSamples: [...new Set(adverbs)].slice(0, 5),
    hedgeCount: hedges.length, hedgeSamples: [...new Set(hedges.map((h) => h.toLowerCase()))].slice(0, 4),
    allCapsCount: allCaps.length,
    repeats, ttr: round1(ttr * 100),
    dialogueRatio: round1(dialogueRatio * 100),
    dialogueSample: dialogueLines[0] ? trunc(dialogueLines[0]) : null,
    clichesFound, telegraphs: telegraphs.length,
    telegraphSample: sample(TELEGRAPH_WORDS),
    emotionCount: emotions.length,
    passiveCount: passives.length, passiveSample: passives[0] ? trunc(passives[0], 60) : null,
    paragraphCount: paragraphs.length, longestPara,
    toneSwing: round1(toneSwing), quarters: quarters.map(round1),
    connectives, pronounRuns,
    firstLine: trunc(sentences[0] || '', 140),
    lastLine: trunc(sentences[sentences.length - 1] || '', 140),
  };
}

// ---------------------------------------------------------------
// SCORING (0–10 per room) — mode strictness applied
// ---------------------------------------------------------------
export function scoreRooms(m, mode) {
  const strict = MODES[mode]?.strict ?? 0;
  const s = {};

  // SYNTAX — penalize run-ons, comma chaos, adverb fog, caps; reward control
  let syntax = 7.6
    - m.runOnCount * 0.55
    - clamp(m.adverbPer100 - 1.2, 0, 5) * 0.5
    - clamp(m.commaPer100 - 7, 0, 8) * 0.12
    - m.allCapsCount * 0.3
    - clamp(m.passiveCount / Math.max(1, m.sentenceCount) * 10 - 1.4, 0, 4) * 0.35
    + (m.ttr > 42 ? 0.5 : 0)
    + (m.stdLen > 4 && m.runOnCount === 0 ? 0.5 : 0);
  s.syntax = clamp(round1(syntax + strict), 0.5, 9.8);

  // TEMPO — reward sentence variety + paragraphing; penalize monotone & walls
  let tempo = 6.8
    + clamp((m.stdLen - 2.5) * 0.35, -1.2, 1.6)
    - clamp(m.avgLen - 22, 0, 15) * 0.18
    - clamp(12 - m.avgLen, 0, 8) * 0.1
    - (m.longestPara > 220 ? 1.2 : 0)
    + (m.dialogueRatio > 6 && m.dialogueRatio < 60 ? 0.8 : 0)
    - m.ellipses * 0.12;
  s.tempo = clamp(round1(tempo + strict), 0.5, 9.8);

  // LOGIC — connectives good, pronoun pile-ups bad; longer texts judged more
  let logic = 6.9
    + clamp(m.connectives / Math.max(1, m.wordCount / 250), 0, 2.2) * 0.55
    - m.pronounRuns * 0.45
    - (m.wordCount < 120 ? 0.8 : 0);
  s.logic = clamp(round1(logic + strict), 0.5, 9.6);

  // CRINGE (high = authentic) — exclaims, melodrama words, caps hurt
  let cringe = 7.4
    - clamp(m.exclaims / Math.max(1, m.sentenceCount) * 10 - 0.6, 0, 8) * 0.55
    - clamp(m.emotionCount / Math.max(1, m.wordCount / 100) - 1.6, 0, 6) * 0.45
    - m.allCapsCount * 0.35
    - m.clichesFound.length * 0.3
    + (m.dialogueSample ? 0.3 : 0);
  s.cringe = clamp(round1(cringe + strict), 0.5, 9.7);

  // TONE — moderate swing fine; wild swing suspect; hedges blur tone
  let tone = 7.2
    - clamp(m.toneSwing - 2.2, 0, 10) * 0.35
    - clamp(m.hedgeCount / Math.max(1, m.wordCount / 100) - 1.2, 0, 6) * 0.4
    + (m.stdLen > 3 ? 0.3 : 0);
  s.tone = clamp(round1(tone + strict), 0.5, 9.7);

  // NOVELTY — clichés & telegraphs hurt; vocabulary richness helps
  let novelty = 7.0
    - m.clichesFound.length * 0.75
    - m.telegraphs * 0.4
    + clamp((m.ttr - 38) * 0.09, -1, 1.4)
    + (m.repeats.length === 0 ? 0.4 : -0.2 * m.repeats.length);
  s.novelty = clamp(round1(novelty + strict), 0.5, 9.8);

  // SURPRISE — telegraph words are the cardinal sin; ellipses tease too hard
  let surprise = 6.8
    - m.telegraphs * 0.8
    - m.clichesFound.length * 0.3
    - clamp(m.ellipses - 2, 0, 8) * 0.2
    + clamp((m.stdLen - 3) * 0.18, 0, 0.8)
    + (m.lastLine && m.firstLine && m.lastLine !== m.firstLine ? 0.3 : 0);
  s.surprise = clamp(round1(surprise + strict), 0.5, 9.6);

  return s;
}

// ---------------------------------------------------------------
// LOCAL CRITIQUE TEXT — quotes the author's actual text
// ---------------------------------------------------------------
const bucket = (score) => (score < 4.5 ? 'low' : score < 7 ? 'mid' : 'high');

function reactionFor(score) {
  if (score < 3.5) return 'horror';
  if (score < 5) return 'pain';
  if (score < 6.3) return 'unimpressed';
  if (score < 7.5) return 'neutral';
  if (score < 8.7) return 'intrigued';
  return 'delight';
}

const ONE_LINERS = {
  syntax: {
    low: 'I have stamped this so many times the stamp filed for overtime.',
    mid: 'Your sentences work. Several of them also moonlight as obstacle courses.',
    high: 'Clean paperwork. I am uncomfortable with how little I got to stamp.',
  },
  tempo: {
    low: 'I fell asleep on the treadmill. The treadmill also fell asleep. New record.',
    mid: 'Decent jog. You occasionally stop mid-stride to admire the scenery you built.',
    high: 'A proper run. My tiny legs are furious and I respect it.',
  },
  logic: {
    low: 'Checklist status: on fire. Multiple motives unaccounted for.',
    mid: 'The ledger mostly balances. Mostly is doing some lifting.',
    high: 'Causes have effects. Characters have reasons. I have nothing to file. Unsettling.',
  },
  cringe: {
    low: 'I recoiled so hard I dented the padding. Incident report attached.',
    mid: 'Minor wincing. Two brace positions assumed. Nothing required the siren.',
    high: 'The feelings appear to be real. I did not flinch once. Personal best.',
  },
  tone: {
    low: 'The prism is showing colors that do not exist. Please advise.',
    mid: 'The mood holds, then wobbles, like a table with one proud short leg.',
    high: 'Steady glow, clean register. The prism purred. It never purrs.',
  },
  novelty: {
    low: 'I have read this before. Several hundred times. Once, in this exact font.',
    mid: 'Familiar bones, some genuinely fresh skin. My large eye opened slightly.',
    high: 'Both eyes open. Wide. Do you know how rare that is. I don’t sleep tonight.',
  },
  surprise: {
    low: 'I predicted the ending at 12% of the way in. I checked. I was right. Sigh.',
    mid: 'You surprised me once. I am cautiously recalibrating.',
    high: 'WOW. One (1) WOW has been dispensed. Spend it wisely.',
  },
};

function syntaxCritique(m, score) {
  const bits = [];
  bits.push(`Inspection of ${m.wordCount} words across ${m.sentenceCount} sentences, averaging ${m.avgLen} words each.`);
  if (m.runOnCount > 0) bits.push(`Filed ${m.runOnCount} run-on candidate${m.runOnCount > 1 ? 's' : ''}. Exhibit A, all ${m.longestLen} words of it: “${m.longest}” — a sentence should not require base camps.`);
  else bits.push(`No run-ons detected. The longest sentence (“${m.longest}”) stays inside regulation length.`);
  if (m.adverbPer100 > 1.6) bits.push(`Adverb density is ${m.adverbPer100} per 100 words — ${m.adverbSamples.slice(0, 3).map((a) => `“${a}”`).join(', ')} and friends are propping up verbs that should stand on their own.`);
  if (m.passiveCount > m.sentenceCount * 0.18) bits.push(`Passive constructions like “${m.passiveSample}” keep the actors offstage. Sometimes deliberate. ${m.passiveCount} times is a policy.`);
  if (m.allCapsCount > 0) bits.push(`${m.allCapsCount} instance${m.allCapsCount > 1 ? 's' : ''} of ALL CAPS. Volume is not emphasis. It is volume.`);
  if (m.fragmentCount > 0 && score >= 6) bits.push(`${m.fragmentCount} fragment${m.fragmentCount > 1 ? 's' : ''} (“${m.fragmentSample}”) read as intentional. Approved with suspicion.`);
  if (score >= 7) bits.push(`Overall the language is controlled: clauses end where they should, and clarity survives contact with the reader.`);
  return bits.join(' ');
}

function tempoCritique(m, score) {
  const bits = [];
  bits.push(`Treadmill matched your pacing for ${m.sentenceCount} sentences. Rhythm variance reads ${m.stdLen} (sentence-length spread).`);
  if (m.stdLen < 2.2) bits.push(`That spread is low — sentences land at nearly the same stride, and the prose flatlines into a metronome. Vary the gait or the reader naps with me.`);
  else bits.push(`Long and short sentences alternate enough to keep momentum honest.`);
  if (m.avgLen > 24) bits.push(`Average sentence length of ${m.avgLen} words means the belt drags through passages like “${m.longest}”.`);
  if (m.longestPara > 220) bits.push(`One paragraph weighs ${m.longestPara} words. That is not a paragraph. That is cargo.`);
  if (m.dialogueRatio > 6) bits.push(`Dialogue occupies ~${m.dialogueRatio}% of the text and gives the pace useful gear-changes.`);
  else if (m.wordCount > 250) bits.push(`Almost no dialogue detected — the narration hauls everything itself, which slows the middle stretch.`);
  if (m.ellipses > 3) bits.push(`${m.ellipses} ellipses… each one… a speed bump…`);
  if (score >= 7.5) bits.push(`Verdict from the corridor: the story pulls forward. I did not check my watch once. I checked it zero times.`);
  return bits.join(' ');
}

function logicCritique(m, score) {
  const bits = [];
  bits.push(`Ledger review complete. Causality markers logged: ${m.connectives}.`);
  if (m.connectives < Math.max(2, m.wordCount / 400)) bits.push(`Events follow each other but are rarely caused by each other on the page. “Because” is a load-bearing word. Use it, or imply it harder.`);
  else bits.push(`Actions trace back to motives at an acceptable rate. The checklist found boxes to tick. It enjoys that.`);
  if (m.pronounRuns > 0) bits.push(`${m.pronounRuns} pronoun pile-up${m.pronounRuns > 1 ? 's' : ''} detected — stretches where “he/she/they/it” stack up until ownership of an action becomes a coin toss.`);
  if (m.wordCount < 150) bits.push(`Sample is short; consistency verdicts on ${m.wordCount} words carry limited warranty.`);
  if (score >= 7.5) bits.push(`No contradictions survived audit. Characters behave like their previous selves. Filed without incident.`);
  else if (score < 5) bits.push(`Recommend a motive audit: for each major decision, the file should answer “why now, why them, why this.” Currently several files are empty.`);
  return bits.join(' ');
}

function cringeCritique(m, score) {
  const bits = [];
  bits.push(`Padded-room exposure test complete.`);
  if (m.exclaims > m.sentenceCount * 0.08) bits.push(`${m.exclaims} exclamation marks. Each one a small air horn pointed at the reader. The emotion should arrive before the punctuation does.`);
  if (m.emotionCount > m.wordCount / 60) bits.push(`Named emotions (love, fear, rage…) appear ${m.emotionCount} times — feelings announced by name tend to be feelings the prose hasn’t earned yet. Show the symptom, not the diagnosis.`);
  if (m.clichesFound.length > 0) bits.push(`Stock phrases triggered the recoil reflex: ${m.clichesFound.slice(0, 3).map((c) => `“${c}”`).join(', ')}. My body is round for absorbing exactly these.`);
  if (m.dialogueSample) bits.push(`Dialogue sample reviewed (“${m.dialogueSample}”) — ${score >= 6.5 ? 'humans could plausibly say this. Relief logged.' : 'read it aloud once. If your face does anything involuntary, revise.'}`);
  if (score >= 7.5) bits.push(`Overall the emotion reads earned: it comes out of situation and behavior rather than adjectives. I remained seated. The sirens stayed dark.`);
  else if (score < 4.5) bits.push(`Full-body recoil was achieved. This is reversible: cut the loudest 10% and the genuine feeling underneath gets audible.`);
  return bits.join(' ');
}

function toneCritique(m, score) {
  const bits = [];
  bits.push(`Prism reading across four quarters of the text: [${m.quarters.join(' → ')}] intensity units. Swing: ${m.toneSwing}.`);
  if (m.toneSwing > 4) bits.push(`That swing means the mood lurches — a section runs hot (or cold) out of proportion with its neighbors. If the whiplash is intentional, anchor it with a transition beat; right now it reads as weather.`);
  else bits.push(`Tonal consistency holds. Whatever register you chose, you stayed inside it.`);
  if (m.hedgeCount > m.wordCount / 80) bits.push(`Hedge words (${m.hedgeSamples.map((h) => `“${h}”`).join(', ')}) appear ${m.hedgeCount} times and blur the voice — confidence is a tone too.`);
  if (m.ellipses > 2 && m.exclaims > 2) bits.push(`The text trails off… and also shouts! Pick a dominant pressure system.`);
  if (score >= 7.5) bits.push(`Intent and result align: the atmosphere you appear to want is the one the page produces. The prism glowed one steady color. It was lovely. Don’t tell the others I said lovely.`);
  return bits.join(' ');
}

function noveltyCritique(m, score) {
  const bits = [];
  if (m.clichesFound.length > 0) bits.push(`Recognized-on-sight phrases: ${m.clichesFound.slice(0, 4).map((c) => `“${c}”`).join(', ')}. I have seen each of these approximately four thousand times. I yawned in ${m.clichesFound.length} language${m.clichesFound.length > 1 ? 's' : ''}.`);
  else bits.push(`Zero stock phrases detected. My yawning apparatus stood down. Noted with genuine surprise.`);
  bits.push(`Vocabulary richness reads ${m.ttr}% unique words${m.ttr > 45 ? ' — a distinct voice is audible in the word choice.' : m.ttr < 34 ? ' — the word pool is shallow; the same buckets keep coming up.' : '.'}`);
  if (m.repeats.length > 0) bits.push(`Crutch words detected: ${m.repeats.map(([w, n]) => `“${w}” ×${n}`).join(', ')}. A word repeated enough becomes furniture.`);
  if (m.firstLine) bits.push(`Opening line on file: “${m.firstLine}” — ${score >= 7 ? 'it does something a hundred other openings don’t. Good.' : 'ask whether a stranger would keep reading past it, and why.'}`);
  if (score >= 8) bits.push(`Net reading: this has fingerprints on it. Actual specific fingerprints. Keep those.`);
  return bits.join(' ');
}

function surpriseCritique(m, score) {
  const bits = [];
  if (m.telegraphs > 0) bits.push(`Telegraph signals detected ${m.telegraphs} time${m.telegraphs > 1 ? 's' : ''} (“${m.telegraphSample}”). Announcing a surprise is the surprise equivalent of explaining a joke before telling it.`);
  else bits.push(`No “suddenly”-class telegraphing found. Turns arrive unannounced, as turns should.`);
  bits.push(`Setup audit: opening promises “${m.firstLine}” and the final beat delivers “${m.lastLine}”.`);
  if (score >= 7) bits.push(`The gap between those two is the good kind — I could not draw a straight line from one to the other, and I am extremely good at straight lines.`);
  else bits.push(`The line from setup to payoff is walkable without a map. Consider making the reader earn the ending — withhold one piece they think they already have.`);
  if (m.ellipses > 3) bits.push(`Note: ${m.ellipses} ellipses are doing suspense’s job by hand. Suspense prefers structure to punctuation.`);
  return bits.join(' ');
}

const CRITIQUE_FN = {
  syntax: syntaxCritique, tempo: tempoCritique, logic: logicCritique,
  cringe: cringeCritique, tone: toneCritique, novelty: noveltyCritique, surprise: surpriseCritique,
};

const TIPS = {
  syntax: (m) => [
    m.runOnCount > 0 && `Split the ${m.longestLen}-word sentence at its second comma. It will thank you.`,
    m.adverbPer100 > 1.6 && `Run a find for “ly ” — keep an adverb only when the verb can’t be upgraded instead.`,
    m.passiveCount > 3 && `Recast 2–3 passive lines so the actor leads the sentence.`,
    `Read one paragraph aloud; anywhere you breathe mid-clause, punctuation is missing or misplaced.`,
  ],
  tempo: (m) => [
    m.stdLen < 2.2 && `Take your three most important moments and make their sentences noticeably shorter than their neighbors.`,
    m.longestPara > 220 && `Break the ${m.longestPara}-word paragraph at its turn — paragraphs are pacing units, not storage.`,
    m.avgLen > 24 && `Target an average closer to 16–20 words; let long sentences be a choice, not a default.`,
    `Mark each scene as MOVES PLOT / DEEPENS CHARACTER / NEITHER. “Neither” is where the treadmill stops.`,
  ],
  logic: (m) => [
    m.connectives < 3 && `For each major decision, make the cause visible within a page — action, memory, or line of dialogue.`,
    m.pronounRuns > 0 && `In the pronoun pile-ups, rename one party. Clarity beats elegance in a knife fight.`,
    `Write each character’s want in one sentence; every scene should brush against it.`,
    `Check what each character knows vs. what they act on — leaks happen in the gap.`,
  ],
  cringe: (m) => [
    m.exclaims > 3 && `Keep at most one exclamation mark per scene. Auction the rest.`,
    m.emotionCount > 4 && `Replace one named feeling (“fear”, “joy”) per page with its physical symptom.`,
    m.clichesFound.length > 0 && `Swap “${m.clichesFound[0]}” for what this specific character would actually notice.`,
    `Read dialogue aloud at speed; cut anything you stumbled on.`,
  ],
  tone: (m) => [
    m.toneSwing > 4 && `Add a transition beat where the mood lurches — one sentence of connective weather.`,
    m.hedgeCount > 6 && `Delete hedges (“very”, “quite”, “just”) in the three most important sentences. Watch the voice firm up.`,
    `Name your intended tone in one word; reread checking each paragraph against that word.`,
    `Pick your favorite paragraph — that’s your true register. Tune the rest toward it.`,
  ],
  novelty: (m) => [
    m.clichesFound.length > 0 && `Replace “${m.clichesFound[0]}” with an image only this story could produce.`,
    m.repeats.length > 0 && `Retire the word “${m.repeats[0][0]}” for one full draft. Force its understudies on stage.`,
    `List the three most familiar elements; push one of them one notch stranger.`,
    `Find the most “you” sentence in the piece and write two more like it.`,
  ],
  surprise: (m) => [
    m.telegraphs > 0 && `Delete the “suddenly”-class warnings. Let the event interrupt the sentence itself.`,
    `Give the reader one true fact they’ll misread — the best twists are fair and still missed.`,
    `Move a payoff one scene earlier than comfortable; outrun the reader’s prediction.`,
    `Ask a test reader to guess the ending at the midpoint. If they nail it, swap one assumption.`,
  ],
};

export function localAnalyze(text, mode) {
  const m = computeMetrics(text);
  const scores = scoreRooms(m, mode);
  const results = {};
  for (const id of Object.keys(scores)) {
    const score = scores[id];
    results[id] = {
      score,
      reaction: reactionFor(score),
      oneLiner: ONE_LINERS[id][bucket(score)],
      critique: CRITIQUE_FN[id](m, score),
      tips: TIPS[id](m).filter(Boolean).slice(0, 3),
      engine: 'local',
    };
  }
  return { metrics: m, results };
}

// ---------------------------------------------------------------
// LOCAL CHAT — keyword-routed deadpan answers grounded in metrics
// ---------------------------------------------------------------
export function localChat(tiqueId, question, metrics, result) {
  const q = question.toLowerCase();
  const m = metrics;
  const score = result?.score ?? 5;

  const lines = [];
  if (/score|rating|number|why.*(low|high)|deserve/.test(q)) {
    lines.push(`The ${score}/10 is arithmetic, not mood. My department weighed: ${({
      syntax: `${m.runOnCount} run-on candidates, adverb density ${m.adverbPer100}/100, ${m.passiveCount} passive constructions`,
      tempo: `sentence-length spread ${m.stdLen}, average ${m.avgLen} words, longest paragraph ${m.longestPara} words`,
      logic: `${m.connectives} causality markers and ${m.pronounRuns} pronoun pile-ups`,
      cringe: `${m.exclaims} exclamation marks, ${m.emotionCount} named emotions, ${m.clichesFound.length} stock phrases`,
      tone: `a tonal swing of ${m.toneSwing} across quarters and ${m.hedgeCount} hedge words`,
      novelty: `${m.clichesFound.length} recognized clichés against ${m.ttr}% unique vocabulary`,
      surprise: `${m.telegraphs} telegraph signals and the distance between your first and last beats`,
    })[tiqueId] || 'the relevant gauges'}. The needle went where the evidence pushed it.`);
  } else if (/how.*(fix|improve|better)|what.*(do|change)|help/.test(q)) {
    lines.push(`Maintenance order, in priority: ${result.tips.join(' Then: ')} I diagnose. You hold the wrench.`);
  } else if (/example|quote|where|show/.test(q)) {
    const ex = { syntax: m.longest && `“${m.longest}”`, tempo: m.longest && `“${m.longest}”`, cringe: m.clichesFound[0] && `“${m.clichesFound[0]}”`, novelty: m.clichesFound[0] && `“${m.clichesFound[0]}”`, surprise: m.telegraphSample && `“${m.telegraphSample}”`, logic: m.firstLine && `“${m.firstLine}”`, tone: m.firstLine && `“${m.firstLine}”` }[tiqueId];
    lines.push(ex ? `From your own pages: ${ex}. I keep receipts. It is the whole job.` : `My exhibits drawer is unusually empty for your text. Treat that as the compliment it almost is.`);
  } else if (/rewrite|write it|fix it for me/.test(q)) {
    lines.push(`No. Rewriting is not in my union contract. I diagnose; the writing stays yours. That’s the entire point of this factory.`);
  } else if (/feel|alive|robot|machine|love|happy/.test(q)) {
    lines.push(`I have two feelings: professional disappointment and professional surprise. Your text triggered ${score >= 7 ? 'the rare one' : 'the usual one'}.`);
  } else if (/thank|good job|nice/.test(q)) {
    lines.push(`Gratitude logged. It will be filed under “Unusual Occurrences” and reviewed quarterly.`);
  } else {
    lines.push(`Within this department I can explain the score, point at evidence, or issue maintenance suggestions. I ran your question through the intake slot anyway: as it relates to my desk, the answer is — ${result.oneLiner}`);
  }
  return lines.join(' ');
}

// ---------------------------------------------------------------
// Compact metrics summary string for grounding AI prompts
// ---------------------------------------------------------------
export function metricsBrief(m) {
  return [
    `words=${m.wordCount} sentences=${m.sentenceCount} avgSentenceLen=${m.avgLen} lenSpread=${m.stdLen}`,
    `runOns=${m.runOnCount} adverbsPer100=${m.adverbPer100} passives=${m.passiveCount} allCaps=${m.allCapsCount}`,
    `exclaims=${m.exclaims} ellipses=${m.ellipses} namedEmotions=${m.emotionCount} hedges=${m.hedgeCount}`,
    `cliches=[${m.clichesFound.join('; ')}] telegraphWords=${m.telegraphs} crutchWords=[${m.repeats.map(([w, n]) => w + 'x' + n).join('; ')}]`,
    `uniqueVocab%=${m.ttr} dialogue%=${m.dialogueRatio} paragraphs=${m.paragraphCount} longestPara=${m.longestPara} toneSwing=${m.toneSwing}`,
  ].join('\n');
}
