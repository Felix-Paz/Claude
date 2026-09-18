/* Mastery (FCE) — question bank IV: expansion pack 2 (k81–k95, c108–c122, w79–w93, m81–m95). */
window.FCE = window.FCE || {};
FCE.BANK = FCE.BANK || {};
(function(){
var K = [
{id:"k81", s1:"Sara never takes the motorway during rush hour.", key:"AVOIDS", s2:"Sara always ____ the motorway during rush hour.", ans:["avoids taking","avoids using","avoids driving on"], halves:[["avoids"],["taking","using","driving on"]], tags:["ger"], diff:2, exp:"AVOID + -ing.", trap:"'avoids to take' — avoid never accepts a to-infinitive."},
{id:"k82", s1:"I suddenly thought of the answer during dinner.", key:"OCCURRED", s2:"The answer suddenly ____ during dinner.", ans:["occurred to me"], halves:[["occurred"],["to me"]], tags:["fix","prep"], diff:4, exp:"An idea OCCURS TO somebody.", trap:"The preposition is TO — 'occurred me' or 'occurred in me' both fail."},
{id:"k83", s1:"“I didn’t touch your laptop,” said Ben.", key:"DENIED", s2:"Ben ____ my laptop.", ans:["denied touching","denied having touched"], halves:[["denied"],["touching","having touched"]], tags:["rep","ger"], diff:3, exp:"DENY + -ing (deny doing / having done).", trap:"'denied to touch' is impossible; deny pairs with -ing."},
{id:"k84", s1:"“Don’t swim past the buoy,” the lifeguard said to us.", key:"WARNED", s2:"The lifeguard ____ past the buoy.", ans:["warned us not to swim"], halves:[["warned us"],["not to swim"]], tags:["rep"], diff:3, exp:"WARN somebody NOT TO do.", trap:"Order matters: warned us not to swim — 'warned to us' or 'warned us to not swim' lose marks."},
{id:"k85", s1:"My journey to work lasts about an hour.", key:"TAKES", s2:"It ____ an hour to get to work.", ans:["takes me about","takes about","takes me around"], halves:[["takes"],["about","around"]], tags:["fix"], diff:2, exp:"IT TAKES (sb) + time + to do.", trap:"Keep the dummy IT construction."},
{id:"k86", s1:"Tom started learning the cello six months ago.", key:"BEEN", s2:"Tom ____ the cello for six months.", ans:["has been learning"], halves:[["has been"],["learning"]], tags:["aux"], diff:2, exp:"started ago ↔ present perfect continuous + FOR.", trap:"HAS been learning — the continuous shows it’s still happening."},
{id:"k87", s1:"I regret not booking the flights earlier.", key:"ONLY", s2:"If ____ the flights earlier.", ans:["only i had booked","only i'd booked"], halves:[["only i had","only i'd"],["booked"]], tags:["wish"], diff:3, exp:"IF ONLY + past perfect = strong past regret (same grammar as wish).", trap:"Past regret needs HAD booked, not 'booked' alone."},
{id:"k88", s1:"Everyone enjoyed the trip, and I enjoyed it too.", key:"DID", s2:"Everyone enjoyed the trip, and so ____ .", ans:["did i"], halves:[["did"],["i"]], tags:["aux"], diff:2, exp:"SO + auxiliary + subject (echo agreement).", trap:"'so I did' reverses the meaning (= admission); SO DID I = me too."},
{id:"k89", s1:"The printer stopped working, so we dismantled it.", key:"TOOK", s2:"The printer stopped working, so we ____ .", ans:["took it apart"], halves:[["took it"],["apart"]], tags:["pv"], diff:3, exp:"TAKE something APART = dismantle.", trap:"Pronoun goes in the middle: took IT apart, never 'took apart it'."},
{id:"k90", s1:"Look at those clouds — rain is certain.", key:"GOING", s2:"It ____ — look at those clouds.", ans:["is going to rain","'s going to rain"], halves:[["is going","'s going"],["to rain"]], tags:["aux"], diff:1, exp:"Evidence-based prediction → BE GOING TO.", trap:"'it will rain' fits meaning but doesn’t use the key word naturally."},
{id:"k91", s1:"It is forbidden to use phones in the laboratory.", key:"MUST", s2:"Phones ____ in the laboratory.", ans:["must not be used","mustn't be used"], halves:[["must not","mustn't"],["be used"]], tags:["pass","modal"], diff:3, exp:"Prohibition in the passive: MUST NOT BE + participle.", trap:"Don’t drop BE: 'must not used' is the classic loss."},
{id:"k92", s1:"She isn’t old enough to vote yet.", key:"TOO", s2:"She is still ____ .", ans:["too young to vote"], halves:[["too young"],["to vote"]], tags:["comp"], diff:2, exp:"not old enough ↔ TOO + opposite adjective + to-infinitive.", trap:"The adjective flips: young, not old."},
{id:"k93", s1:"“Are you coming to the party?” Lia asked me.", key:"WHETHER", s2:"Lia asked me ____ to the party.", ans:["whether i was coming","whether i was going"], halves:[["whether i"],["was coming","was going"]], tags:["rep"], diff:3, exp:"Reported yes/no question: WHETHER + backshifted tense, statement order.", trap:"No 'was I coming' — keep statement order after whether."},
{id:"k94", s1:"Please continue with your work while I’m away.", key:"CARRY", s2:"Please ____ your work while I’m away.", ans:["carry on with"], halves:[["carry on"],["with"]], tags:["pv"], diff:1, exp:"CARRY ON WITH + noun = continue.", trap:"WITH is needed before the noun."},
{id:"k95", s1:"I find his handwriting impossible to read.", key:"OUT", s2:"I simply cannot make ____ .", ans:["out his handwriting"], halves:[["out"],["his handwriting"]], tags:["pv"], diff:4, exp:"MAKE OUT = manage to read/see/hear.", trap:"make out ≠ make up (invent) ≠ make for (head towards)."},
];
var C = [
{id:"c108", s:"She comes ____ a small village high in the Alps.", ans:["from"], gt:"prep", tags:["prep"], diff:1, exp:"come FROM = origin.", trap:"come OF exists only in old idioms."},
{id:"c109", s:"I’d rather walk home ____ wait half an hour for the bus.", ans:["than"], gt:"comp", tags:["comp","wish"], diff:2, exp:"would rather X THAN Y.", trap:"'rather...that' or 'rather...to' both fail."},
{id:"c110", s:"____ of the twins plays the violin; the other prefers football.", ans:["one"], gt:"det", tags:["det","pron"], diff:2, exp:"ONE of the twins … the other.", trap:"'Each of the twins' would clash with 'the other'."},
{id:"c111", s:"We haven’t seen our cousins ____ ages.", ans:["for","in"], gt:"prep", tags:["prep","aux"], diff:1, exp:"FOR ages (BrE) / IN ages (AmE) = for a long time.", trap:"SINCE ages — since needs a starting point, not a length."},
{id:"c112", s:"Could you turn the music ____ a little? The baby is asleep.", ans:["down"], gt:"adv", tags:["pv"], diff:1, exp:"turn DOWN = reduce volume.", trap:"turn OFF kills it completely — the sentence asks for 'a little'."},
{id:"c113", s:"He is severely allergic ____ nuts, so always check the label.", ans:["to"], gt:"prep", tags:["prep"], diff:2, exp:"allergic TO.", trap:"allergic OF/AT — the partner is to."},
{id:"c114", s:"The coast road was closed ____ to flooding.", ans:["due","owing"], gt:"link", tags:["link","prep"], diff:3, exp:"DUE TO / OWING TO = because of.", trap:"'because to' doesn’t exist; the TO after the gap is the clue."},
{id:"c115", s:"Dinner will be ready in a couple ____ minutes.", ans:["of"], gt:"prep", tags:["prep","det"], diff:1, exp:"a couple OF + plural.", trap:"Dropping OF is informal American — Cambridge wants it."},
{id:"c116", s:"It was ____ first time anyone had beaten the champion on clay.", ans:["the"], gt:"art", tags:["art","fix"], diff:2, exp:"THE first time + past perfect.", trap:"Ordinals take THE."},
{id:"c117", s:"All students must hand ____ their essays by Friday noon.", ans:["in"], gt:"adv", tags:["pv"], diff:2, exp:"hand IN = submit.", trap:"hand OUT = distribute — the direction reverses."},
{id:"c118", s:"____ you ever visit Seville, the cathedral is unmissable.", ans:["should","if"], gt:"aux", tags:["cond","inv"], diff:4, exp:"SHOULD you ever visit = if you ever visit (formal inversion).", trap:"Both work; the elegant exam answer is SHOULD."},
{id:"c119", s:"The harder the exam, ____ sweeter the success.", ans:["the"], gt:"comp", tags:["comp","art"], diff:2, exp:"the + comparative, THE + comparative.", trap:"Both halves need THE."},
{id:"c120", s:"Listen carefully, because this affects each and ____ one of you.", ans:["every"], gt:"det", tags:["det","fix"], diff:3, exp:"each and EVERY one = absolutely everyone (fixed).", trap:"'each and all' isn’t the idiom."},
{id:"c121", s:"The documentary is well ____ watching, despite its length.", ans:["worth"], gt:"fixphrase", tags:["fix","ger"], diff:3, exp:"well WORTH + -ing.", trap:"'well worthy watching' confuses worth/worthy."},
{id:"c122", s:"Many people now work ____ home at least one day a week.", ans:["from"], gt:"prep", tags:["prep"], diff:1, exp:"work FROM home.", trap:"work AT home is location; the set phrase for remote work is from."},
];
var W = [
{id:"w79", s:"The ____ of the night train has been delayed by an hour.", stem:"ARRIVE", ans:["arrival"], tags:["wfnoun"], diff:2, exp:"arrive → arrival (-al noun).", trap:"One R, one L: arrival."},
{id:"w80", s:"Always wear a helmet — for your own ____ .", stem:"SAFE", ans:["safety"], tags:["wfnoun"], diff:1, exp:"safe → safety.", trap:"Not 'safeness'."},
{id:"w81", s:"The ____ of their welcome took us by surprise.", stem:"WARM", ans:["warmth"], tags:["wfnoun","spell"], diff:2, exp:"warm → warmth.", trap:"Just add -TH: warmth (no E)."},
{id:"w82", s:"Her parents watched the graduation with enormous ____ .", stem:"PROUD", ans:["pride"], tags:["wfnoun","spell"], diff:3, exp:"proud → pride (vowel change).", trap:"Irregular: not 'proudness' — PRIDE."},
{id:"w83", s:"Children are taught never to accept lifts from a complete ____ .", stem:"STRANGE", ans:["stranger"], tags:["wfnoun"], diff:2, exp:"strange → stranger (person).", trap:"'a complete strange' misses the person-noun."},
{id:"w84", s:"After ten years abroad, he finally tasted ____ again at home.", stem:"FREE", ans:["freedom"], tags:["wfnoun"], diff:1, exp:"free → freedom (-dom).", trap:"-DOM family: freedom, wisdom, boredom."},
{id:"w85", s:"In his ____ , my grandfather cycled everywhere.", stem:"YOUNG", ans:["youth"], tags:["wfnoun","spell"], diff:3, exp:"young → youth.", trap:"Irregular vowel: y-OU-th."},
{id:"w86", s:"The novel closes with the hero’s quiet ____ .", stem:"DIE", ans:["death"], tags:["wfnoun","spell"], diff:2, exp:"die → death.", trap:"death (noun) / dead (adjective) / died (verb) — three forms."},
{id:"w87", s:"Her closing argument was extremely ____ .", stem:"PERSUADE", ans:["persuasive"], tags:["wfadj"], diff:3, exp:"persuade → persuasive.", trap:"-SIVE: persuasive, not 'persuadive'."},
{id:"w88", s:"This role rewards ____ and fresh thinking.", stem:"CREATE", ans:["creativity"], tags:["wfnoun"], diff:2, exp:"create → creativity.", trap:"'creation' is the thing made; the quality is creativity."},
{id:"w89", s:"There is a world of ____ between hearing and listening.", stem:"DIFFER", ans:["difference"], tags:["wfnoun"], diff:1, exp:"differ → difference.", trap:"-ENCE: difference."},
{id:"w90", s:"We received over fifty ____ for the summer internship.", stem:"APPLY", ans:["applications"], tags:["wfnoun"], diff:3, exp:"apply → applicationS (plural needed after 'fifty').", trap:"The grammar demands plural — singular loses the mark."},
{id:"w91", s:"Thank you so much for the ____ to your wedding.", stem:"INVITE", ans:["invitation"], tags:["wfnoun"], diff:1, exp:"invite → invitation.", trap:"'invitement' doesn’t exist."},
{id:"w92", s:"The museum’s coin ____ is among the finest in Europe.", stem:"COLLECT", ans:["collection"], tags:["wfnoun"], diff:1, exp:"collect → collection.", trap:"Double L? No — one L, double... neither: c-o-l-l-e-c-t-i-o-n keeps the stem’s LL."},
{id:"w93", s:"Take a deep ____ and begin your answer slowly.", stem:"BREATHE", ans:["breath"], tags:["wfnoun","spell"], diff:3, exp:"breathe (verb) → breath (noun) — the final E disappears.", trap:"breath/breathe: the E changes the word class AND the sound."},
];
var M = [
{id:"m81", s:"The two reports differ ____ several important ways.", opts:["in","on","at","by"], cor:0, tags:["prep"], diff:2, exp:"differ IN ways/respects.", trap:"differ FROM something, but differ IN a way."},
{id:"m82", s:"Could you ____ me a favour and post this letter?", opts:["do","make","give","hold"], cor:0, tags:["col","fix"], diff:1, exp:"DO somebody a favour.", trap:"make a favour — the eternal make/do trap, reversed."},
{id:"m83", s:"The squad is ____ up of eleven players and five reserves.", opts:["made","built","formed","set"], cor:0, tags:["pv","col"], diff:2, exp:"be MADE UP OF = consist of.", trap:"'set up' = establish; only MADE pairs with 'up of'."},
{id:"m84", s:"I’m sorry — I never meant to ____ your feelings.", opts:["hurt","harm","damage","injure"], cor:0, tags:["col"], diff:2, exp:"HURT somebody’s feelings.", trap:"damage/injure are physical; feelings are hurt."},
{id:"m85", s:"Let’s ____ a short break and continue after lunch.", opts:["take","make","do","put"], cor:0, tags:["col"], diff:1, exp:"TAKE a break.", trap:"make a break = escape (idiom) — different meaning."},
{id:"m86", s:"The price of fuel has ____ sharply since January.", opts:["risen","raised","arisen","lifted"], cor:0, tags:["col"], diff:3, exp:"RISE (rose, risen) is intransitive — prices rise.", trap:"RAISE needs an object: someone raises prices."},
{id:"m87", s:"It later ____ out that the rumour was completely false.", opts:["turned","ended","came","found"], cor:0, tags:["pv"], diff:2, exp:"it TURNED OUT that… = it was discovered.", trap:"came out = was published/revealed, but 'it came out that' is weaker exam English here."},
{id:"m88", s:"We are ____ forward to hearing from you.", opts:["looking","waiting","hoping","planning"], cor:0, tags:["pv","ger"], diff:1, exp:"LOOK forward to + -ing.", trap:"wait/hope never take 'forward'."},
{id:"m89", s:"He couldn’t ____ the temptation to check his phone.", opts:["resist","refuse","reject","avoid"], cor:0, tags:["col"], diff:3, exp:"RESIST temptation — fixed partnership.", trap:"refuse an offer, reject a proposal, avoid a person — temptation is resisted."},
{id:"m90", s:"____ my opinion, the ending was far too sudden.", opts:["In","On","From","By"], cor:0, tags:["depprep"], diff:1, exp:"IN my opinion.", trap:"'On my opinion' / 'According to my opinion' are the classic misses."},
{id:"m91", s:"The manager ____ us through the new procedure step by step.", opts:["talked","spoke","told","explained"], cor:0, tags:["pv","col"], diff:4, exp:"TALK somebody THROUGH something = explain step by step.", trap:"explain takes 'to us', tell takes object+noun — only talk works with 'through'."},
{id:"m92", s:"Honestly, I’m ____ of doing the same thing every single day.", opts:["tired","angry","annoyed","upset"], cor:0, tags:["prep","col"], diff:2, exp:"TIRED OF + -ing = bored with.", trap:"angry/annoyed take AT/WITH/ABOUT, never OF + -ing."},
{id:"m93", s:"The storm caused serious ____ to the coastal road.", opts:["damage","hurt","injury","break"], cor:0, tags:["col"], diff:2, exp:"cause DAMAGE TO things (injury is for people).", trap:"injury to a road is impossible — roads aren’t alive."},
{id:"m94", s:"Please remain ____ until the seatbelt sign is switched off.", opts:["seated","stood","laid","risen"], cor:0, tags:["col","pass"], diff:3, exp:"remain SEATED — formal announcement language.", trap:"'remain sat' is regional/informal; the exam form is seated."},
{id:"m95", s:"She works weekends to ____ her studies.", opts:["support","earn","win","gain"], cor:0, tags:["col"], diff:3, exp:"SUPPORT your studies/family = pay for.", trap:"earn money, win prizes, gain experience — studies are supported."},
];
FCE.BANK.kwt = FCE.BANK.kwt.concat(K);
FCE.BANK.cloze = FCE.BANK.cloze.concat(C);
FCE.BANK.wf = FCE.BANK.wf.concat(W);
FCE.BANK.mcc = FCE.BANK.mcc.concat(M);
})();
