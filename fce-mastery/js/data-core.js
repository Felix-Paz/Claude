/* FCE Mastery — core knowledge layer: skill taxonomy, grammar rules,
   Cambridge pattern intelligence, memory hooks. All local, no APIs. */
window.FCE = window.FCE || {};

/* ---------- Skill taxonomy ----------
   weight = estimated marks (of 36 in Use of English) that typically hinge on this skill.
   Used by the coach to compute "this weakness costs ≈ X marks". */
FCE.TAGS = {
  prep:   {name:'Prepositions',            group:'Vocabulary', weight:4.5,
    rule:'Prepositions in FCE are rarely about place or time — they are about <b>dependent combinations</b> you must know as chunks: <b>keen ON, depend ON, insist ON, different FROM, responsible FOR, famous FOR, good AT, succeed IN, consist OF, similar TO, married TO</b>. Learn verb/adjective/noun + preposition as a single word. In Open Cloze, if the gap follows an adjective or verb, ask: which preposition does this word "own"?',
    tips:['Learn word + preposition as ONE unit, never separately.','In Open Cloze, look at the word BEFORE the gap first.','Make personal example sentences: "I am keen ON…" with your real hobbies.']},
  depprep:{name:'Fixed prepositional phrases', group:'Vocabulary', weight:2.5,
    rule:'English glues prepositions into fixed phrases: <b>in charge of, in favour of, on behalf of, by accident, on purpose, at first, in the end / at the end, out of the blue, in case of, under way, on the verge of, as a result of, in addition to</b>. Cambridge loves gapping the small word in the middle or at the start. These cannot be worked out by logic — only by familiarity.',
    tips:['Read the whole phrase aloud three times — rhythm helps memory.','Group them by preposition: ON purpose / ON behalf / ON the verge.','If a gap sits inside a phrase that "sounds idiomatic", trust the chunk.']},
  pv:     {name:'Phrasal verbs',            group:'Vocabulary', weight:3.5,
    rule:'FCE tests high-frequency phrasal verbs, usually as a paraphrase: postpone = <b>put off</b>, cancel = <b>call off</b>, reject = <b>turn down</b>, tolerate = <b>put up with</b>, invent/think of = <b>come up with</b>, recover from = <b>get over</b>, resemble = <b>take after</b>, quit = <b>give up</b>, exhaust supply = <b>run out of</b>, continue = <b>carry/go on</b>. In Key Word Transformations the phrasal verb often hides inside a passive: "The match WAS CALLED OFF."',
    tips:['Learn phrasal verbs with their one-word synonym (postpone → put off).','Practise them inside passives: "was put off", "has been turned down".','Particles carry meaning: OFF = cancelled/away, UP = completely, ON = continuing.']},
  fix:    {name:'Fixed expressions & idioms', group:'Vocabulary', weight:3.5,
    rule:'Cambridge recycles a core set of expressions: <b>make up your mind, take part in, take advantage of, pay attention to, take place, make an effort, do harm, make the most of, it’s no use / there’s no point in, can’t help -ing, it goes without saying, as far as I’m concerned, no matter how</b>. In transformations they are usually the "second key" alongside a grammar change.',
    tips:['MAKE = create/decide (make a decision, make progress). DO = activity/duty (do harm, do your best). TAKE = opportunity/time (take part, take advantage).','When a KWT gives you a noun key (PART, MIND, ATTENTION), an expression is almost certainly required.','Collect "expression families": take part in / take place / take after / take advantage of.']},
  col:    {name:'Collocations',             group:'Vocabulary', weight:4,
    rule:'Collocations are word marriages: <b>heavy rain</b> (not strong), <b>strong coffee</b> (not powerful), <b>fast food</b> but <b>a quick meal</b>, <b>catch a cold, miss the bus, break a record, keep a promise, reach an agreement, draw a conclusion, raise money, earn a living, lose your temper</b>. Part 1 (Multiple-Choice Cloze) is essentially a collocation exam: all four options "mean" the same; only one collocates.',
    tips:['In Part 1, ignore meaning first — ask which option PARTNERS the nearby noun.','Record collocations as pairs, never single words.','Wrong-but-tempting options in past papers are tomorrow’s correct answers — learn all four.']},
  link:   {name:'Linking words',            group:'Grammar', weight:3,
    rule:'Master the contrast set: <b>although/though/even though + clause</b>, <b>despite/in spite of + noun or -ing</b>, <b>whereas/while</b> for contrast, <b>unless</b> = if not, <b>as long as / provided (that)</b> = on condition that, <b>in case</b> = preparation for a possibility (NOT "if"), <b>whether</b> after prepositions and with "or not". The #1 trap: <b>despite</b> is never followed by "of"; <b>in spite</b> always is.',
    tips:['DESPITE + noun/-ing. ALTHOUGH + subject + verb. Never mix.','IN CASE prepares ("take an umbrella in case it rains") — IF reacts.','UNLESS already contains "not" — never add another negative.']},
  rel:    {name:'Relative clauses',         group:'Grammar', weight:2,
    rule:'<b>who</b> (people), <b>which</b> (things, and whole previous ideas: ", which surprised everyone"), <b>whose</b> (possession), <b>where</b> (places, when the clause is complete without an object), <b>what</b> = "the thing(s) that" (Much of WHAT he said…). After commas (non-defining), THAT is forbidden — use which/who. Prepositions can move: "the town in which I grew up" = "the town (which) I grew up in".',
    tips:['Comma before the gap? → which/who, never that.','If the relative clause is already complete (he grew up THERE), use WHERE.','WHAT never follows a noun — it replaces noun + that.']},
  pron:   {name:'Pronouns & reflexives',    group:'Grammar', weight:1.5,
    rule:'Watch reflexives (<b>hurt himself, enjoy yourselves, by myself</b> = alone), reciprocals (<b>each other / one another</b>), and substitution (<b>one/ones, so</b> in "I think so", <b>neither/so do I</b>). Open Cloze often gaps "each" in "each other" or "it" in dummy-subject patterns ("found IT hard to…").',
    tips:['"by + reflexive" = alone; "on + my own" — don’t blend them.','Check verbs that need a dummy IT: find it hard, make it clear.','EACH other — not "every other" — for two-way actions.']},
  art:    {name:'Articles',                 group:'Grammar', weight:2,
    rule:'FCE-level article gaps: <b>the</b> with superlatives, ordinals, unique things, "the same/the only/the first", musical instruments (play THE violin), comparative correlatives (<b>THE more… THE better</b>), and fixed chunks (<b>out of THE blue, on THE other hand, at THE moment</b>). <b>A/AN</b> appears in "make AN effort", "have A go", "as A result". Zero article with general plurals and abstract nouns.',
    tips:['"The more…, the better" — both gaps are THE.','Fixed phrases own their articles: make AN effort, take THE trouble.','If the noun is unique-in-context, use THE even first mention.']},
  det:    {name:'Determiners & quantifiers', group:'Grammar', weight:2,
    rule:'High-value items: <b>hardly ANY, NO + noun, NONE of, EVERY/EACH, BOTH/EITHER/NEITHER, FEW vs A FEW, LITTLE vs A LITTLE, TOO much/many, ENOUGH, SUCH a, WHICHEVER/WHATEVER, ANOTHER vs OTHER</b>. Open Cloze loves "hardly any", "none of", and "such a".',
    tips:['FEW/LITTLE (without "a") = almost none — negative feeling.','NEITHER of + plural noun + singular verb (formally).','ENOUGH goes AFTER adjectives (cool enough) but BEFORE nouns (enough time).']},
  aux:    {name:'Auxiliaries & question tags', group:'Grammar', weight:2.5,
    rule:'Auxiliaries surface in: perfect forms (<b>have/has/had + participle</b>), continuous passives (<b>are BEING cleaned</b>), echo forms (<b>neither DID Tom, so DO I</b>), inversion (<b>rarely DO we see…</b>), comparative ellipsis (…than I <b>HAVE</b>), and future perfect (<b>will HAVE finished</b>). In Open Cloze, a participle right after the gap screams have/has/had/been/being.',
    tips:['Gap + past participle? Try have/has/had/been/being first.','"Neither/So" + AUXILIARY + subject — copy the tense of the first verb.','BY + future time → will HAVE + participle (future perfect).']},
  modal:  {name:'Modals & deduction',       group:'Grammar', weight:2,
    rule:'Past deduction is the exam favourite: <b>must have + participle</b> (sure it happened), <b>can’t/couldn’t have</b> (sure it didn’t), <b>may/might/could have</b> (possible). Also: <b>should have</b> (criticism), <b>needn’t have</b> (did it, wasn’t necessary), <b>had better</b>, <b>be supposed to</b> (rules/expectations), <b>be allowed to</b> (permission in passives).',
    tips:['"I’m sure he DIDN’T" → can’t have + participle (NOT mustn’t have).','LET has no passive — use BE ALLOWED TO.','HAD better (never "would better") + bare infinitive.']},
  cond:   {name:'Conditionals',             group:'Grammar', weight:2.5,
    rule:'Beyond the basic three: <b>unless, provided that, as long as, in case, otherwise</b>, mixed conditionals ("If I had taken the map, I would not BE lost now"), and inverted conditionals (<b>Had I known…, Should you need…</b>). KWT pattern: a past regret → third conditional with WOULD/WOULDN’T HAVE + participle.',
    tips:['Regret about the past → IF + had + participle, WOULD HAVE + participle.','Never put WOULD inside the IF-clause.','SHOULD you need anything = If you need anything (formal inversion).']},
  wish:   {name:'Wish / rather / time',     group:'Grammar', weight:1.5,
    rule:'<b>wish + past simple</b> (present regret), <b>wish + past perfect</b> (past regret), <b>wish + would</b> (annoying habit). <b>would rather + subject + PAST</b> ("I’d rather you CAME early"), <b>it’s (high) time + PAST</b> ("It’s time we LEFT"). The tense goes BACK although the meaning is present/future.',
    tips:['I wish I HAD studied = past regret (very common in KWT).','I’d rather YOU + past simple — the past is not about time here.','"It’s time we went" — past form, present meaning.']},
  pass:   {name:'Passive & causative',      group:'Grammar', weight:2.5,
    rule:'KWT loves switching voice: "They are building X" → "X <b>is being built</b>"; and the causative <b>have/get something done</b>: "A mechanic repaired my car" → "I <b>had my car repaired</b>". After MAKE in the passive, TO returns: "We <b>were made TO wait</b>". LET becomes <b>be allowed to</b>.',
    tips:['Causative order: HAVE + object + PARTICIPLE (had my car repaired).','Continuous passive needs BEING: is/was being built.','make someone do → BE MADE TO DO (to reappears).']},
  inv:    {name:'Inversion & emphasis',     group:'Grammar', weight:1.5,
    rule:'After negative adverbials the auxiliary jumps before the subject: <b>No sooner HAD we sat down than…, Hardly HAD they arrived when…, Not only DOES she sing…, Rarely DO we see…, Under no circumstances SHOULD you…, On no account MUST you…</b>. NO SOONER pairs with THAN; HARDLY pairs with WHEN.',
    tips:['NO SOONER … THAN / HARDLY … WHEN — never mix the pairs.','The inversion uses an auxiliary, exactly like a question.','Spot the trigger words at the start: No sooner, Hardly, Not only, Seldom, Rarely, Little.']},
  rep:    {name:'Reported speech',          group:'Grammar', weight:2,
    rule:'Backshift tenses (will→would, can→could, present→past), shift time words (tomorrow→<b>the following day</b>, yesterday→the previous day/the day before). Reported questions use statement order: "Where do you live?" → "asked me where I <b>lived</b>" (no DO, no question mark). Reporting verbs carry patterns: <b>accuse sb OF -ing, apologise FOR -ing, congratulate sb ON -ing, insist ON -ing, suggest -ing, warn sb NOT to, refuse TO, admit -ing, deny -ing</b>.',
    tips:['Reported question = statement word order, no auxiliary DO.','The reporting verb decides the structure — learn verb + pattern as one chunk.','tomorrow → the following day; ago → before.']},
  comp:   {name:'Comparatives & "as…as"',   group:'Grammar', weight:2,
    rule:'Key transforms: "X is cheaper than Y" ↔ "Y is <b>not as/so cheap as</b> X" (notice the adjective flips back to its base form). Also: <b>the + comparative, the + comparative</b> ("The sooner, the better"), <b>far/much + comparative</b>, <b>twice as … as</b>, and <b>less … than</b>. In KWT, keep the comparison direction straight — that is the trap.',
    tips:['not as + BASE adjective + as (never the -er form).','"The more you practise, THE better you get" — double THE.','Check WHO is bigger/cheaper after rewriting — direction reverses easily.']},
  ger:    {name:'Gerunds & infinitives',    group:'Grammar', weight:2.5,
    rule:'Chunks that decide the form: <b>suggest/enjoy/avoid/admit/deny/can’t help/it’s no use/worth/look forward to/be used to + -ING</b>; <b>manage/refuse/decide/afford/promise + TO</b>; meaning-changers: <b>remember/forget/regret/stop/try</b> (remember POSTING = memory of a past action; remember TO POST = duty). After prepositions, ALWAYS -ing — including the famous <b>to</b> in "look forward TO seeING".',
    tips:['Preposition → -ING. No exceptions ("after leavING", "without sayING").','LOOK FORWARD TO + -ing — "to" here is a preposition.','REGRET + -ing = past action you’re sorry about (the KWT favourite).']},
  wfnoun: {name:'Word formation: nouns',    group:'Word building', weight:2.5,
    rule:'Suffixes: <b>-tion/-sion (decide→decision, explain→explanation), -ment (improve→improvement), -ness (aware→awareness), -ity (able→ability, curious→curiosity), -ence/-ance (patient→patience, assist→assistance), -ship (member→membership), -hood (child→childhood), -dom (free→freedom, bore→boredom), -th (grow→growth, strong→strength, long→length, deep→depth, wide→width)</b>. Check singular/plural — a verb like "were" before the gap forces a plural noun.',
    tips:['Read the WHOLE sentence — does grammar demand plural? (many …S)','-th nouns change the vowel: strong→strength, long→length.','Person or thing? employER gives work, employEE receives it.']},
  wfadj:  {name:'Word formation: adjectives', group:'Word building', weight:2.2,
    rule:'Suffixes: <b>-ful/-less, -ous (danger→dangerous), -al (nature→natural), -ive (compete→competitive), -able/-ible (rely→reliable, resist→irresistible), -ic (science→scientific), -ed/-ing (satisfied vs satisfying)</b>. Classic traps: <b>economic</b> (of the economy) vs <b>economical</b> (money-saving); <b>sensitive</b> vs <b>sensible</b>. -ED = how you feel; -ING = what causes the feeling.',
    tips:['Bored person, boring film — feelings get -ED.','rely → reliable (y→i), resist → irresistible (double trap: ir- and -ible).','economic policy / economical car — meaning decides.']},
  wfadv:  {name:'Word formation: adverbs',  group:'Word building', weight:1.3,
    rule:'Usually adjective + <b>-ly</b>, with spelling shifts: <b>true→truly, whole→wholly, easy→easily, automatic→automatically (-ally after -ic)</b>. Sentence-position adverbs from FCE: <b>(un)fortunately, surprisingly, increasingly</b>. If the gap sits between subject and verb, or describes a verb/adjective, an adverb is likely.',
    tips:['-ic → -ically (automatically, scientifically). Almost no exceptions.','true → truly, whole → wholly: the E disappears.','A gap before an adjective ("____ difficult") is usually an adverb.']},
  wfverb: {name:'Word formation: verbs',    group:'Word building', weight:1,
    rule:'Prefixes/suffixes that build verbs: <b>en- (large→enlarge, able→enable, sure→ensure), -en (strong→strengthen, wide→widen, short→shorten), -ise/-ize (modern→modernise), -ify (simple→simplify)</b>.',
    tips:['-EN attaches to adjectives of size/degree: widen, deepen, shorten.','EN- at the front: enable, enrich, encourage, ensure.','Need a verb? Look for a missing action between subject and object.']},
  wfneg:  {name:'Negative prefixes',        group:'Word building', weight:1.8,
    rule:'THE Word Formation trap: the sentence logic demands a NEGATIVE. <b>un- (unable, unlikely, unemployment), in- (informal), im- before m/p (impossible, impatient), il- before l (illegal), ir- before r (irregular, irresponsible), dis- (dishonest, disagree, dissatisfied), mis- (misunderstand, misbehave)</b>. Read for words like "but, however, failed, refused, without" — they flip the polarity.',
    tips:['ALWAYS ask: positive or negative? before writing the word.','im- before m/p (impatient), il- before l (illegal), ir- before r (irregular).','dis+satisfied keeps double S: dissatisfied.']},
  spell:  {name:'Spelling shifts',          group:'Word building', weight:1.2,
    rule:'Cambridge marks spelling strictly. Danger words: <b>pronunciation</b> (not pronOUnciation), <b>explanation</b> (not explaination), <b>maintenance, argument</b> (no E), <b>truly, repetition, curiosity, anxiety, height</b> (vs high), <b>choice, loss, weight, flight</b>.',
    tips:['pronounce → pronUnciation; explain → explAnation.','argue → argument (drop the E).','Write the word, then spell-check it backwards letter by letter.']},
};

/* ---------- Open Cloze gap-type meta (for the heatmap) ---------- */
FCE.GAPTYPES = {
  prep:{name:'Prepositions', freq:5}, art:{name:'Articles', freq:4},
  link:{name:'Conjunctions / linkers', freq:4}, aux:{name:'Auxiliary verbs', freq:4},
  modal:{name:'Modal verbs', freq:3}, rel:{name:'Relative pronouns', freq:4},
  pron:{name:'Pronouns', freq:3}, det:{name:'Determiners / quantifiers', freq:3},
  adv:{name:'Adverbs / particles', freq:3}, vform:{name:'Verb forms', freq:3},
  comp:{name:'Comparatives', freq:2}, fixphrase:{name:'Fixed phrases', freq:5},
};

/* ---------- Cambridge Pattern Intelligence ----------
   freq: 1–5 stars = how often this pattern shows up in official papers.
   lose: note on where students typically lose the mark. */
FCE.PATTERNS = [
  {id:'pt-causative', match:['had my','have my','had her','had his','have it','got my'], tags:['pass'], freq:5, name:'have something done', lose:'Students write "I repaired my car" instead of "I had my car repaired".'},
  {id:'pt-passive-being', match:['is being','was being','are being'], tags:['pass'], freq:4, name:'continuous passive (is being done)', lose:'The word BEING gets dropped.'},
  {id:'pt-wish-past', match:['wish i had','wish she had','wish he had'], tags:['wish'], freq:5, name:'wish + past perfect', lose:'Past regret written with simple past instead of past perfect.'},
  {id:'pt-nosooner', match:['no sooner had'], tags:['inv'], freq:4, name:'No sooner had … than', lose:'Pairing it with WHEN instead of THAN.'},
  {id:'pt-hardly', match:['hardly had'], tags:['inv'], freq:4, name:'Hardly had … when', lose:'Forgetting the inversion (hardly THEY HAD).'},
  {id:'pt-notonly', match:['not only does','not only did','not only is'], tags:['inv'], freq:3, name:'Not only + inversion', lose:'Writing "Not only she sings" without the auxiliary.'},
  {id:'pt-asas', match:['not as','not so','as far as','as long as','as soon as'], tags:['comp','fix'], freq:5, name:'as … as family', lose:'Using the comparative form inside as…as ("not as cheaper as").'},
  {id:'pt-thethe', match:['the more','the sooner','the better','the harder'], tags:['comp','art'], freq:4, name:'the + comparative, the + comparative', lose:'Dropping one of the THEs.'},
  {id:'pt-deduction', match:['must have','can’t have','cannot have','couldn’t have','might have'], tags:['modal'], freq:5, name:'modal + have + participle', lose:'"mustn’t have" used for impossibility (it should be CAN’T have).'},
  {id:'pt-despite', match:['in spite of','despite'], tags:['link'], freq:5, name:'despite / in spite of + noun/-ing', lose:'"despite of" — the most famous FCE error.'},
  {id:'pt-pointin', match:['no point in','no use','not worth'], tags:['fix','ger'], freq:4, name:'no point in / no use / not worth + -ing', lose:'Following these with TO + infinitive.'},
  {id:'pt-lookfwd', match:['looking forward to','look forward to'], tags:['pv','ger'], freq:5, name:'look forward to + -ing', lose:'"look forward to SEE you".'},
  {id:'pt-usedto', match:['used to','accustomed to'], tags:['ger'], freq:5, name:'used to do vs be used to doing', lose:'Mixing past habit (used to DO) with familiarity (be used to DOING).'},
  {id:'pt-suggest', match:['suggested going','suggest going','suggested that'], tags:['rep','ger'], freq:4, name:'suggest + -ing / that-clause', lose:'"suggested to go" — suggest never takes to-infinitive.'},
  {id:'pt-accuse', match:['accused','apologised for','apologized for','congratulated','insisted on','blamed','prevented'], tags:['rep','prep'], freq:5, name:'reporting verb + preposition + -ing', lose:'Wrong preposition: accuse OF, blame FOR, congratulate ON, insist ON, prevent FROM.'},
  {id:'pt-firsttime', match:['first time i have','first time i’ve'], tags:['fix'], freq:4, name:'It’s the first time + present perfect', lose:'Using simple present ("first time I eat").'},
  {id:'pt-ittook', match:['it took'], tags:['fix'], freq:4, name:'It took (sb) + time + to do', lose:'Forgetting the dummy IT.'},
  {id:'pt-rather', match:['would rather','’d rather'], tags:['wish'], freq:4, name:'would rather + sb + PAST', lose:'"I’d rather you COME" instead of CAME.'},
  {id:'pt-unless', match:['unless'], tags:['cond','link'], freq:4, name:'unless = if not', lose:'Double negative: "unless you don’t revise".'},
  {id:'pt-madeto', match:['made to','allowed to'], tags:['pass'], freq:4, name:'be made TO do / be allowed to', lose:'Dropping TO after passive MAKE.'},
  {id:'pt-takepart', match:['took part in','take part in'], tags:['fix'], freq:4, name:'take part in = participate', lose:'Missing the preposition IN.'},
  {id:'pt-runout', match:['run out of'], tags:['pv'], freq:4, name:'run out of', lose:'Dropping OF: "we ran out milk".'},
  {id:'pt-putoff-passive', match:['was put off','was called off','was turned down'], tags:['pv','pass'], freq:5, name:'phrasal verb inside a passive', lose:'Reordering or losing the particle: "was put it off".'},
  {id:'pt-incase', match:['in case'], tags:['link'], freq:4, name:'in case + present', lose:'Writing "in case of you need" or using WILL after in case.'},
  {id:'pt-succeed', match:['succeeded in'], tags:['prep','ger'], freq:3, name:'succeed IN -ing ↔ manage TO do', lose:'Crossing the patterns: "succeeded to pass".'},
];

/* ---------- Memory hooks (hand-crafted for the classic offenders) ---------- */
FCE.HOOKS = [
  {k:'put off', h:'Picture PUTting the calendar OFF the wall to move the concert to another month. PUT OFF = postpone.'},
  {k:'call off', h:'The referee CALLS everyone OFF the pitch — game cancelled. CALL OFF = cancel.'},
  {k:'turn down', h:'A job offer slides across the desk; you TURN the paper face-DOWN. TURN DOWN = reject.'},
  {k:'put up with', h:'Your noisy neighbour upstairs: you look UP at the ceiling and stay PUT. PUT UP WITH = tolerate.'},
  {k:'come up with', h:'An idea bubble COMES UP from your head WITH a "ding!". COME UP WITH = think of/invent.'},
  {k:'get over', h:'Illness is a wall — you climb OVER it and you’re healthy on the other side. GET OVER = recover from.'},
  {k:'take after', h:'A child TAKEs the family photo AFTER the mother and looks identical in it. TAKE AFTER = resemble a relative.'},
  {k:'run out of', h:'You RUN OUT OF the kitchen shaking the empty milk carton. RUN OUT OF = have none left.'},
  {k:'give up', h:'You GIVE your cigarettes UP to the sky and walk away. GIVE UP = quit.'},
  {k:'look forward to seeing', h:'You lean FORWARD at the window, eyes wide, already SEEING the visit in your mind — that’s why -ING follows: look forward to seeING.'},
  {k:'carry on', h:'You CARRY your bag and keep walking ON and on. CARRY ON = continue.'},
  {k:'set off', h:'The alarm goes off — time to SET OFF on the journey. SET OFF = start a journey.'},
  {k:'come across', h:'Crossing the attic you trip ACROSS an old photo album. COME ACROSS = find by chance.'},
  {k:'make up your mind', h:'Your MIND is an unMADE bed; deciding = MAKING it neatly. MAKE UP YOUR MIND = decide.'},
  {k:'in charge of', h:'The boss’s phone is always IN CHARGE (battery 100%) because she’s IN CHARGE OF everything.'},
  {k:'on purpose', h:'A purse placed exactly in the centre of the table — someone put it there ON PURPOSE (deliberately).'},
  {k:'by accident', h:'You knock the same purse off — BY ACCIDENT. ON purpose ↔ BY accident: opposite prepositions.'},
  {k:'take part in', h:'The race organiser hands you your PART of the route map — you TAKE it and you’re IN. TAKE PART IN = participate.'},
  {k:'take advantage of', h:'A sale sign: you TAKE the ADVANTAGE bag OF free stuff. TAKE ADVANTAGE OF = use an opportunity.'},
  {k:'pay attention to', h:'Attention costs money here: you PAY a coin TO the teacher every time you listen. PAY ATTENTION TO.'},
  {k:'keen on', h:'A KEEN fan leans ON the stage barrier at a concert. KEEN ON = enthusiastic about.'},
  {k:'depend on', h:'A pendant hangs (de-PENDs) ON its chain. DEPEND ON.'},
  {k:'insist on', h:'You stamp your foot ON the floor, insisting. INSIST ON + -ing.'},
  {k:'responsible for', h:'The FOReman is responsible FOR the factory. RESPONSIBLE FOR.'},
  {k:'famous for', h:'FOUR stars on the walk of fame — famous FOR something. FAMOUS FOR.'},
  {k:'good at', h:'Darts champion: good AT hitting the target (@ looks like a dartboard). GOOD AT.'},
  {k:'different from', h:'Two roads split FROM one point and become different. DIFFERENT FROM.'},
  {k:'similar to', h:'Two arrows pointing TO the same place look similar. SIMILAR TO.'},
  {k:'married to', h:'You walk TO the altar, towards your partner. MARRIED TO (never "with").'},
  {k:'succeed in', h:'The winner’s cup has SUCCESS engraved INside it. SUCCEED IN + -ing.'},
  {k:'accuse of', h:'The judge points: "OFficially accused!" ACCUSE somebody OF + -ing.'},
  {k:'apologise for', h:'You bring FOUR flowers to say sorry. APOLOGISE FOR + -ing.'},
  {k:'congratulate on', h:'You pat the winner ON the back. CONGRATULATE somebody ON + -ing.'},
  {k:'prevent from', h:'A barrier stops the crowd FROM entering. PREVENT somebody FROM + -ing.'},
  {k:'out of the blue', h:'A package falls from a clear BLUE sky — totally unexpected. OUT OF THE BLUE.'},
  {k:'no sooner had', h:'A racing clock: NO SOONER HAD the gun fired THAN they ran. Pair: no sooner…THAN.'},
  {k:'hardly had', h:'HARDLY HAD you sat down WHEN the doorbell rang. Pair: hardly…WHEN.'},
  {k:'it’s no use', h:'A broken umbrella in a storm — IT’S NO USE carryING it. No use + -ing.'},
  {k:'worth visiting', h:'A town stamped with a price tag "WORTH it" — the old town IS WORTH VISITing (-ing!).'},
  {k:'used to living', h:'BE USED TO + -ING = familiar: picture yourself comfortably LIVING inside the word USED.'},
  {k:'in case', h:'A suitCASE by the door packed IN CASE it rains. IN CASE = preparation, not condition.'},
  {k:'as long as', h:'A LONG rope ties the deal together: you can borrow it AS LONG AS you return it.'},
  {k:'the following day', h:'In reported speech "tomorrow" walks one step behind — it FOLLOWS: THE FOLLOWING DAY.'},
];

/* Template-based hook generator for items without a hand-written hook.
   Deterministic (seeded by the word) so each student-word pair feels stable. */
FCE.makeHook = function(word, context){
  var w = String(word||'').trim(); if(!w) return '';
  var lw = w.toLowerCase();
  for (var i=0;i<FCE.HOOKS.length;i++){
    if (lw.indexOf(FCE.HOOKS[i].k) !== -1 || FCE.HOOKS[i].k.indexOf(lw) !== -1) return FCE.HOOKS[i].h;
  }
  var seed = 0; for (var j=0;j<lw.length;j++) seed = (seed*31 + lw.charCodeAt(j)) >>> 0;
  var scenes = ['a tiny exam hall on the moon','your kitchen at midnight','the Cambridge exam room','a crowded metro carriage','your grandmother’s garden','a silent library where one phone rings'];
  var actions = ['written in giant neon letters','tattooed on a whale that swims past the window','baked into a birthday cake','printed on every umbrella','shouted by a parrot wearing glasses','carved into an ice sculpture that refuses to melt'];
  var scene = scenes[seed % scenes.length], action = actions[(seed>>3) % actions.length];
  var chunk = lw.length > 3 ? (lw.slice(0,Math.ceil(lw.length/2)) + ' + ' + lw.slice(Math.ceil(lw.length/2))) : lw;
  var out = 'Picture ' + scene + ': “' + w.toUpperCase() + '” is ' + action + '. Say it three times as you see it.';
  if (context) out += ' Anchor it to the chunk: “' + context + '”.';
  out += ' (Chunk it: ' + chunk + '.)';
  return out;
};

/* ---------- Spelling intelligence ----------
   FCE danger words. def = the in-game clue (NEVER contains the word or its stem).
   cue = the memory tip, shown only AFTER answering. bad = misspellings students produce. */
FCE.SPELL = [
 {w:'pronunciation', bad:['pronounciation','pronuntiation'], def:'NOUN · the way a word sounds when you say it. “Her ____ of English is almost perfect.”', cue:'the verb has “nounce”, the noun drops the O: pron-UN-ciation'},
 {w:'explanation', bad:['explaination','explenation'], def:'NOUN · a statement that makes something clear. “The teacher gave a clear ____ of the rule.”', cue:'the verb’s AI disappears: expl-A-nation'},
 {w:'argument', bad:['arguement','argumment'], def:'NOUN · an angry discussion; a reason given for an opinion. “They had a heated ____ about money.”', cue:'the E of “argue” drops before -ment'},
 {w:'maintenance', bad:['maintainance','maintenence'], def:'NOUN · the work of keeping something in good condition. “The lift is closed for ____.”', cue:'main-TEN-ance — the “tain” becomes “ten”'},
 {w:'truly', bad:['truely'], def:'ADVERB · really, sincerely. “I am ____ sorry for the delay.”', cue:'“true” loses its E before -ly'},
 {w:'repetition', bad:['repeatition','repitition'], def:'NOUN · doing or saying the same thing again. “Learning needs constant ____.”', cue:'no “eat” inside: rep-E-tition'},
 {w:'curiosity', bad:['curiousity'], def:'NOUN · the desire to know or discover things. “Pure ____ made her open the box.”', cue:'the U of -ous drops: curi-O-sity'},
 {w:'anxiety', bad:['anxiousity','anxity'], def:'NOUN · a feeling of worry or nervousness. “Exams give many students ____.”', cue:'the adjective’s -ous vanishes: anx-I-ety'},
 {w:'height', bad:['hight','heigth'], def:'NOUN · how tall something is. “The ____ of the tower is 90 metres.”', cue:'spelled like “eight” with an H: h-EIGHT'},
 {w:'weight', bad:['weigth','wieght'], def:'NOUN · how heavy something is. “The bridge supports a ____ of 40 tonnes.”', cue:'keep the GH before the T, like “eight”'},
 {w:'belief', bad:['beleif','believe'], def:'NOUN · a feeling that something is true. “It is my firm ____ that practice beats talent.”', cue:'I before E, and the noun has no V: belie-F'},
 {w:'choice', bad:['choise','choize'], def:'NOUN · the act of picking between options. “Going freelance was a brave ____.”', cue:'-ICE ending, like “ice”'},
 {w:'strength', bad:['strenght','strenth'], def:'NOUN · physical or mental power. “Exercise builds ____ and confidence.”', cue:'the GTH comes last: stren-GTH'},
 {w:'length', bad:['lenght','lenth'], def:'NOUN · how long something is. “The ____ of the film is two hours.”', cue:'same family as strength: len-GTH'},
 {w:'depth', bad:['deepth','dept'], def:'NOUN · how deep something is. “Divers measured the ____ of the lake.”', cue:'the long EE shrinks: d-e-p-t-h'},
 {w:'knowledge', bad:['knowlege','nowledge'], def:'NOUN · the information and understanding you have. “She has a deep ____ of history.”', cue:'a silent K, then a LEDGE: know-LEDGE'},
 {w:'environment', bad:['enviroment','enviornment'], def:'NOUN · the natural world around us. “Plastic waste damages the ____.”', cue:'the quiet N survives: enviro-N-ment'},
 {w:'government', bad:['goverment'], def:'NOUN · the group of people who run a country. “The ____ announced new taxes.”', cue:'govern + ment: the N of “govern” stays'},
 {w:'beginning', bad:['begining'], def:'NOUN · the first part of something. “The ____ of the story is slow.”', cue:'the N doubles: begi-NN-ing'},
 {w:'accommodation', bad:['accomodation','acommodation'], def:'NOUN · a place to stay or live. “The job offers free ____.”', cue:'generous house: two C, two M'},
 {w:'achievement', bad:['acheivement','achivement'], def:'NOUN · something done successfully after effort. “Passing FCE is a real ____.”', cue:'I before E: ach-IE-vement'},
 {w:'beautiful', bad:['beutiful','beautifull'], def:'ADJECTIVE · very pleasing to look at. “The view from the cliff is ____.”', cue:'b-e-a-u start, ONE final L'},
 {w:'business', bad:['buisness','bussiness'], def:'NOUN · commercial activity; a company. “She runs a small ____ in town.”', cue:'“busy” changes Y to I: busi-ness'},
 {w:'comfortable', bad:['confortable','comfortble'], def:'ADJECTIVE · making you feel physically relaxed. “This sofa is incredibly ____.”', cue:'coMfort with M, never N'},
 {w:'convenient', bad:['convinient','conveniant'], def:'ADJECTIVE · easy to use; causing no difficulty. “The hotel is ____ for the station.”', cue:'-IENT ending: conven-IENT'},
 {w:'definitely', bad:['definately','definetly'], def:'ADVERB · certainly, without doubt. “I will ____ come to your party.”', cue:'“finite” lives inside: de-FINITE-ly'},
 {w:'embarrassment', bad:['embarassment','embarrasment'], def:'NOUN · the feeling of being ashamed or shy. “Forgetting her name caused real ____.”', cue:'double R AND double S'},
 {w:'existence', bad:['existance'], def:'NOUN · the state of being real. “Scientists doubt the creature’s ____.”', cue:'-ENCE, not -ance'},
 {w:'experience', bad:['experiance','expirience'], def:'NOUN · knowledge from doing things. “The job requires sales ____.”', cue:'-IENCE ending: exper-IENCE'},
 {w:'foreign', bad:['foriegn','forein'], def:'ADJECTIVE · from another country. “She speaks three ____ languages.”', cue:'a rule-breaker: E before I, with a silent G'},
 {w:'forty', bad:['fourty'], def:'NUMBER · the number after thirty-nine. “The course lasts ____ hours.”', cue:'“four” loses its U here'},
 {w:'grateful', bad:['greatful'], def:'ADJECTIVE · feeling thankful. “I am deeply ____ for your help.”', cue:'from gratitude, not from “great”: GRATE-ful'},
 {w:'immediately', bad:['inmediately','immediatly'], def:'ADVERB · at once, without delay. “Call the doctor ____.”', cue:'IMM- at the start, -ELY at the end'},
 {w:'necessary', bad:['neccessary','necesary'], def:'ADJECTIVE · needed, essential. “Booking is not ____.”', cue:'one Collar, two Sleeves: one C, double S'},
 {w:'occasion', bad:['ocassion','occassion'], def:'NOUN · a particular time or special event. “The dinner was a formal ____.”', cue:'double C, single S'},
 {w:'opportunity', bad:['oportunity','opportunaty'], def:'NOUN · a chance to do something. “The course is a great ____ to improve.”', cue:'double P at the door: o-PP-ortunity'},
 {w:'recommend', bad:['reccomend','recomend'], def:'VERB · to suggest something as good. “Can you ____ a restaurant?”', cue:'one C, double M'},
 {w:'restaurant', bad:['restaurante','restorant'], def:'NOUN · a place where meals are served. “We booked a table at the new ____.”', cue:'French middle: rest-AU-rant'},
 {w:'rhythm', bad:['rythm','rithym'], def:'NOUN · a regular repeated pattern of sound. “Drummers must keep the ____.”', cue:'Rhythm Helps Your Two Hips Move'},
 {w:'separate', bad:['seperate'], def:'VERB/ADJECTIVE · to divide; not joined. “Please ____ the recycling from the rubbish.”', cue:'there is A RAT in sep-A-RAT-e'},
 {w:'successful', bad:['succesful','sucessful'], def:'ADJECTIVE · achieving what you wanted. “Her third attempt was finally ____.”', cue:'double C, double S, one L'},
 {w:'until', bad:['untill'], def:'PREPOSITION · up to a time. “Wait here ____ six o’clock.”', cue:'one L (although “till” has two)'},
 {w:'writing', bad:['writting'], def:'NOUN · the activity of producing text. “Her ____ has improved this term.”', cue:'one T (but “written” has two)'},
];

/* Closed-class word lists — lets the engine diagnose WHAT KIND of word the student
   wrote vs what the gap needed ("you wrote a preposition; this needs a relative pronoun"). */
FCE.WORDCLASS = {
 art:['a','an','the'],
 modal:['can','could','may','might','must','should','would','shall','ought','need'],
 aux:['be','been','being','am','is','are','was','were','have','has','had','do','does','did','will'],
 rel:['who','whom','whose','which','where','what'],
 pron:['it','he','she','they','them','him','her','himself','herself','themselves','myself','yourself','yourselves','itself','ourselves','each','other','another','one','ones','mine','yours','everybody','everyone','something','anything','nothing'],
 det:['any','no','some','every','both','either','neither','few','little','much','many','more','most','several','such','enough','all','half','whatever','whichever','none','plenty'],
 comp:['than','as','more','less','most','least','better','worse','sooner','rather'],
 link:['and','but','or','so','because','although','though','while','whereas','unless','if','whether','when','that','nor','once','provided','despite','however','therefore','moreover','otherwise'],
 prep:['at','by','for','from','in','of','off','on','out','to','with','under','between','during','without','since','until','after','before','about','against','among','behind','below','beyond','into','onto','past','per','through','towards','toward','upon','within','across','along','around','near','besides','behind','above','outside','inside'],
 advpart:['up','down','back','away','forward','over','round','ahead','apart','aside','along'],
};
FCE.CLASSNAMES = { art:'article', modal:'modal verb', aux:'auxiliary verb', rel:'relative pronoun',
 pron:'pronoun', det:'determiner', comp:'comparison word', link:'linking word', prep:'preposition', advpart:'adverb particle' };
FCE.GT2CLASS = { prep:'prep', art:'art', link:'link', aux:'aux', modal:'modal', rel:'rel', pron:'pron', det:'det', adv:'advpart', comp:'comp', fixphrase:null, vform:null };

/* Mistake-cause taxonomy (Mistake DNA) */
FCE.CAUSES = {
  gap:    {name:'Never learned it',    icon:'🕳️', advice:'a knowledge gap — study the rule card, then re-test tomorrow'},
  mix:    {name:'Mixed two things up', icon:'🔀', advice:'an interference error — drill the two confused items SIDE BY SIDE until they separate'},
  slip:   {name:'Slip / misread',      icon:'👁️', advice:'an attention slip — slow down 2 seconds and re-read the words around the gap'},
  trap:   {name:'The trap got me',     icon:'🎣', advice:'classic Cambridge bait — learn the trap pattern itself, not just the answer'},
  time:   {name:'Time pressure',       icon:'⏱️', advice:'a speed issue — practise this type with the timer visible'},
  spell:  {name:'Spelling',            icon:'✍️', advice:'a spelling loss — write the word out by hand 3 times, letters matter at Cambridge'},
};

/* Confidence levels */
FCE.CONF = {
  g:{name:'Guessing', icon:'🎲'},
  f:{name:'Fairly sure', icon:'🤔'},
  s:{name:'Certain', icon:'💪'},
};

/* Badges */
FCE.BADGES = [
  {id:'first',   icon:'🌱', name:'First Steps',      desc:'Complete your diagnostic'},
  {id:'q50',     icon:'🏋️', name:'Half Century', desc:'Answer 50 questions'},
  {id:'q200',    icon:'🏆', name:'Double Century',   desc:'Answer 200 questions'},
  {id:'streak3', icon:'🔥', name:'On Fire',          desc:'3-day study streak'},
  {id:'streak7', icon:'⚡',       name:'Unstoppable',      desc:'7-day study streak'},
  {id:'perfect10',icon:'🎯', name:'Perfect Ten',     desc:'10 correct in a row'},
  {id:'comeback',icon:'🦸', name:'Comeback',         desc:'Master an item you failed 3 times'},
  {id:'calib',   icon:'🧭', name:'Well Calibrated',  desc:'90%+ accuracy on "Certain" answers (25+ tries)'},
  {id:'mock',    icon:'📝', name:'Dress Rehearsal',  desc:'Complete a full mock test'},
  {id:'mock30',  icon:'🎖️', name:'Mock Master', desc:'Score 30+/36 in a mock test'},
  {id:'allparts',icon:'🧩', name:'All-Rounder',      desc:'Practise all four task types'},
  {id:'bookworm',icon:'📖', name:'Bookworm',         desc:'Open your Personal Grammar Book'},
  {id:'speller', icon:'🐝', name:'Spelling Bee',     desc:'A perfect Spelling Gym round'},
  {id:'wants',   icon:'🎯', name:'Deliberate One',   desc:'Master 3 items from your Mastery List'},
  {id:'emg',     icon:'🚨', name:'Crunch Mode',      desc:'Activate 7-Day Emergency Mode'},
];

/* Weekly challenges (deterministic per ISO week) */
FCE.CHALLENGES = [
  {id:'c-kwt', name:'Transformation Surgeon', desc:'Answer 30 Key Word Transformations', type:'kwt', n:30},
  {id:'c-oc',  name:'Cloze Hunter',           desc:'Answer 40 Open Cloze gaps', type:'cloze', n:40},
  {id:'c-acc', name:'Sniper Week',            desc:'Get 60 questions correct', type:'correct', n:60},
  {id:'c-wf',  name:'Word Builder',           desc:'Answer 30 Word Formation items', type:'wf', n:30},
];
