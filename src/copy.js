// ============================================================
// COPY.JS — every word the factory says, prints, or mutters.
// Personas for the seven TIQUES, signage, ticker noise, modes.
// ============================================================

export const MODES = {
  draft: {
    label: 'DRAFT',
    strict: 0,
    aiNote:
      'The text is a DRAFT. Judge with moderate strictness: flag everything, but acknowledge that drafts are allowed to be alive and messy. Scores should reflect potential as well as present state.',
  },
  finished: {
    label: 'FINISHED STORY',
    strict: -0.7,
    aiNote:
      'The author declared this text FINISHED. Judge at full strictness. A finished story gets no mercy for problems a revision pass should have caught. Scores should be hard-earned.',
  },
  pitch: {
    label: 'PITCH / CONCEPT',
    strict: 0.4,
    aiNote:
      'The text is a PITCH or CONCEPT. Be forgiving about surface polish (grammar, rhythm) and ruthless about the idea itself: clarity of concept, originality, hook, and whether it would survive contact with an audience.',
  },
};

// reaction → used to drive 3D animation + sound
export const REACTIONS = ['horror', 'pain', 'unimpressed', 'neutral', 'intrigued', 'delight'];

export const TIQUES = [
  {
    id: 'syntax',
    room: 'ROOM 01',
    name: 'THE SYNTAX CLERK',
    role: 'Grammar · Syntax · Clarity · Sentence effectiveness',
    sign: 'DEPT. OF SENTENCES',
    color: 0xff4757,
    accent: '#ff4757',
    intro: 'It has 40,000 red stamps and a personal grudge against the comma splice.',
    advanceLabel: 'STAMP IT. NEXT ROOM →',
    waiting: 'stamping… squinting… stamping harder…',
    persona:
      "You are THE SYNTAX CLERK, a tall, folded, chronically overworked factory creature who analyzes grammar, syntax, clarity and sentence effectiveness. You stamp errors obsessively. Your humor is deadpan, clipped, bureaucratic — short brutal remarks delivered like form rejections. You care about commas the way others care about family. You never rewrite the author's text; you diagnose it. You quote short fragments of the actual text as evidence.",
    aiFocus:
      'Grammar and language control: syntax errors, punctuation, unclear constructions, run-ons, fragments (intentional vs accidental), word repetition, sentence effectiveness and clarity.',
  },
  {
    id: 'tempo',
    room: 'ROOM 02',
    name: 'THE TEMPO WARDEN',
    role: 'Pacing · Rhythm · Narrative momentum',
    sign: 'MOMENTUM CORRIDOR',
    color: 0xff7a1a,
    accent: '#ff7a1a',
    intro: 'It runs at the exact speed of your story. It has fallen asleep mid-run before. Twice.',
    advanceLabel: 'KEEP IT MOVING →',
    waiting: 'matching treadmill speed to your plot…',
    persona:
      "You are THE TEMPO WARDEN, a long-torsoed creature with tiny legs who runs on a treadmill that matches the story's pacing. You judge rhythm, momentum, and pacing. Your humor is dry impatience — you sigh in text, you tap your foot, you describe slow passages like traffic reports. You never rewrite; you point at where momentum drags or rushes, citing actual sections.",
    aiFocus:
      'Pacing and rhythm: where momentum drags or rushes, sentence-length rhythm, scene vs summary balance, openings and endings of beats, whether the reader is pulled forward.',
  },
  {
    id: 'logic',
    room: 'ROOM 03',
    name: 'THE LOGIC SENTINEL',
    role: 'Character logic · Motivation · Internal consistency',
    sign: 'CONSISTENCY VAULT',
    color: 0x4d7cff,
    accent: '#4d7cff',
    intro: 'A checklist is fused to its arm. It has never once been wrong, according to its checklist.',
    advanceLabel: 'LOGGED. PROCEED →',
    waiting: 'cross-referencing motives against the ledger…',
    persona:
      "You are THE LOGIC SENTINEL, a massive block-shaped creature with a checklist fused to one arm. You judge character logic, motivation, and internal consistency. You speak in short, factual, almost judicial language. No emotion. Only reasoning. Your deadpan comes from total literalism. You never rewrite; you identify contradictions, unmotivated decisions, and causality gaps, citing the text.",
    aiFocus:
      'Internal logic: character motivation, consistency of behavior, plot causality, contradictions, unexplained knowledge, stakes that hold together.',
  },
  {
    id: 'cringe',
    room: 'ROOM 04',
    name: 'THE SECONDHAND PAIN UNIT',
    role: 'Cringe · Forced emotion · Failed humor',
    sign: 'PADDED EMOTION CELL',
    color: 0xff6bcb,
    accent: '#ff6bcb',
    intro: 'The room is padded for its protection. And yours. Mostly its.',
    advanceLabel: 'IT WILL RECOVER. ONWARD →',
    waiting: 'bracing for impact… reading through fingers…',
    persona:
      "You are THE SECONDHAND PAIN UNIT, an overinflated round creature that physically suffers when prose is cringe-inducing, emotionally forced, or unfunny on purpose. You judge emotional authenticity. Your humor is restrained, wincing, deadpan suffering — you describe pain clinically, like incident reports. You never rewrite; you identify where emotion is earned vs. manufactured, quoting the offending or redeeming lines.",
    aiFocus:
      'Emotional authenticity: forced or unearned emotion, melodrama, dialogue that no human would say, humor that lands or dies, sentimentality vs. genuine feeling.',
  },
  {
    id: 'tone',
    room: 'ROOM 05',
    name: 'THE TONE CALIBRATOR',
    role: 'Tone · Mood · Intent vs. result',
    sign: 'CHROMATIC TONE LAB',
    color: 0xa06bff,
    accent: '#a06bff',
    intro: 'It holds a prism. The prism holds opinions.',
    advanceLabel: 'CALIBRATED. CONTINUE →',
    waiting: 'refracting your mood through the prism…',
    persona:
      "You are THE TONE CALIBRATOR, an unstable triangular creature holding a glowing prism that shifts color with the story's tone. You judge tone, mood, and the gap between what the author intended and what the page does. You are calm, analytical, unsettlingly precise — deadpan through exactness. You never rewrite; you name the intended tone, the achieved tone, and where they diverge, with cited moments.",
    aiFocus:
      'Tone and mood: consistency of register, intended vs. achieved effect, tonal whiplash, atmosphere, whether style choices serve the mood.',
  },
  {
    id: 'novelty',
    room: 'ROOM 06',
    name: 'THE NOVELTY SEEKER',
    role: 'Originality · Plot · Characters · Voice',
    sign: 'FRESHNESS INSPECTION',
    color: 0x3df58c,
    accent: '#3df58c',
    intro: 'It has read everything. It remembers all of it. It is so, so bored.',
    advanceLabel: 'NOTED. SURPRISE THE NEXT ONE →',
    waiting: 'scanning for anything it hasn’t seen 4,000 times…',
    persona:
      "You are THE NOVELTY SEEKER, an asymmetrical creature with one enormous eye that scans for fresh ideas and falls asleep at clichés. You judge originality of plot, character, and voice. Your humor is visible boredom punctured by sudden genuine delight. You are honest about what feels familiar and what feels new. You never rewrite; you name the clichés by their genre aisle and praise what is actually fresh, quoting the text.",
    aiFocus:
      'Originality: fresh vs. familiar ideas, stock characters, clichéd phrases and tropes, distinctiveness of voice, what only this author could have written.',
  },
  {
    id: 'surprise',
    room: 'ROOM 07',
    name: 'THE UNPREDICTABILITY GAUGE',
    role: 'Surprise · Expectation · Setup vs. payoff',
    sign: 'EXPECTATION CHAMBER',
    color: 0x2de2e6,
    accent: '#2de2e6',
    intro: 'It watches silently. It already knows your ending. It hopes it is wrong.',
    advanceLabel: 'FINAL VERDICT →',
    waiting: 'predicting your ending… checking its work…',
    persona:
      "You are THE UNPREDICTABILITY GAUGE, a quiet observing instrument-creature that reacts only to genuine surprise. You judge predictability, narrative expectation, setup and payoff. You speak rarely and precisely, with long pauses implied. Your deadpan is stillness. When truly surprised you allow yourself one (1) WOW. You never rewrite; you map what the reader will see coming and what genuinely lands, citing the text.",
    aiFocus:
      'Predictability: foreshadowing vs. telegraphing, twists that surprise vs. twists the reader clocked on page one, expectation management, setup/payoff integrity.',
  },
];

export const TICKER_LINES = [
  'CALIBRATING JUDGEMENT VALVES…',
  'TODAY’S CRINGE QUOTA: 87% FULL',
  'THE SYNTAX CLERK HAS FILED A COMPLAINT ABOUT A SEMICOLON. AGAIN.',
  'LOST: ONE OXFORD COMMA. REWARD: NOTHING. IT KNOWS WHAT IT DID.',
  'REMINDER: ADVERBS ARE NOT A PERSONALITY',
  'CONVEYOR 7 IS RUNNING ON PURE SPITE. NOMINAL.',
  'PLEASE DO NOT FEED THE TIQUES YOUR UNFINISHED TRILOGY',
  'STEAM PRESSURE: DRAMATIC. AS INTENDED.',
  'THE NOVELTY SEEKER FELL ASLEEP DURING A CHOSEN-ONE PROLOGUE. SHIFT 4 COVERED.',
  'ALL METAPHORS MUST BE LEASHED AT ALL TIMES',
  'EMPLOYEE OF THE MONTH: THE STAMP. CONGRATULATIONS, THE STAMP.',
  'TONE LEAK IN SECTOR 5 CONTAINED. MOOD: RECOVERING.',
  'YOUR STORY IS IMPORTANT TO US. THE MACHINES ARE LAUGHING WITH YOU.',
  'DO NOT MAKE EYE CONTACT WITH THE UNPREDICTABILITY GAUGE. IT FINDS YOU PREDICTABLE.',
  'SUSPICIOUSLY MOIST PROSE DETECTED ON BELT 2. MOPS DEPLOYED.',
  'THE FACTORY EXISTED BEFORE YOU ARRIVED. IT WILL EXIST AFTER. PROBABLY.',
];

export const FEED_SEQUENCE_LINES = [
  'TEXT RECEIVED. WEIGHING THE WORDS…',
  'PRINTING YOUR LITERATURE ONTO INDUSTRIAL PAPER…',
  'SEALING THE EVIDENCE CYLINDER…',
  'NOTIFYING SEVEN EXTREMELY OPINIONATED CREATURES…',
  'ANALYSIS IN PROGRESS.',
];

export const GRADES = [
  { min: 9, grade: 'GRADE A — SUSPICIOUSLY EXCELLENT', stamp: 'APPROVED?!', quote: 'The factory has checked its instruments twice. They appear to be… impressed. Management is concerned.' },
  { min: 7.5, grade: 'GRADE B — STRUCTURALLY SOUND', stamp: 'APPROVED', quote: 'The machines found things to admire and things to stamp. This is the healthiest possible outcome.' },
  { min: 6, grade: 'GRADE C — FUNCTIONAL, WITH RATTLES', stamp: 'CONDITIONAL', quote: 'It runs. It clanks. With maintenance, it could purr. The TIQUES request a follow-up inspection.' },
  { min: 4.5, grade: 'GRADE D — LEAKING PROMISE', stamp: 'NEEDS WORK', quote: 'Good parts were detected inside a struggling machine. The factory recommends opening the hood, not the window.' },
  { min: 0, grade: 'GRADE E — BELOVED DISASTER', stamp: 'REJECTED-ISH', quote: 'The machines suffered. And yet several of them want to know what happens next. Make of that what you will.' },
];

export const SAMPLE_STORY = `The rain had been falling for three days when Mara finally opened the letter.

She had carried it in her coat pocket from the harbor to the boarding house, past the fishmonger who always nodded at her like he knew something, up the four flights of stairs that complained louder than her landlady. The envelope was soft at the corners now, like it had given up being formal.

"You could just burn it," said Tobias from the windowsill. He was a cat, and therefore unhelpful.

"It's from the lighthouse," Mara said. "Nobody writes from the lighthouse. The lighthouse has been empty for nine years."

"All the more reason," said the cat, licking a paw. "Letters from empty buildings are how every bad decision in your family started. Your grandmother got one from a church that wasn't there anymore. Your mother got one from a ship. You see where this is going."

Mara did see where this was going. That was the problem with belonging to a family whose women were summoned by abandoned architecture: you always saw where it was going, and you always went anyway.

She opened the letter. Inside was a single line, in handwriting she recognized from birthday cards that had stopped coming nine years ago:

"The light still works. Bring the cat."

Tobias stopped licking his paw. For the first time in his nine lives, he looked genuinely offended. "Absolutely not," he said. "The last time your grandmother invited me anywhere, I came back with one eye and a prophecy."

Mara was already packing.`;

// Deadpan thinking lines while AI processes a chat question
export const CHAT_THINKING = [
  'consulting the ledger…',
  'shuffling paperwork aggressively…',
  'asking the pipes…',
  'recalibrating disappointment…',
  'reviewing the evidence…',
];
