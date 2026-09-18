/* Mastery (FCE) — passage pack III: completes the fixed-paper system.
   +3 standard passages (pp1g, pp1h, pp3h) and +12 CHALLENGE passages (B2+/C1-edge:
   subtler collocations, trickier word formation, less sign-posted cloze gaps).
   Every passage belongs to exactly ONE fixed mock paper — see data-papers.js. */
window.FCE = window.FCE || {};
FCE.BANK = FCE.BANK || {};
(function(){
var P = FCE.BANK.passages;

/* ---------- STANDARD Part 1 ---------- */
P.p1.push({
id:"pp1g", title:"The window-box gardener", level:"standard",
text:"When Rosa moved into a sixth-floor flat, she assumed her gardening days were over. The flat (1) a noisy street and had no balcony, only a narrow ledge. Rather than give up, she decided to (2) the most of it. She fixed two window boxes to the ledge, (3) them with herbs, and watered them every morning before work. To her neighbours’ surprise, the herbs (4) so well that people began stopping in the street to look up. Rosa now (5) seeds with half the building. Gardening, she says, is not about space; it is about paying (6) attention to whatever space you have. Her latest project is persuading the landlord to (7) the residents to plant the flat roof — and judging by his recent silence on the subject, he is seriously (8) it.",
gaps:[
 {n:1, opts:["overlooked","oversaw","overtook","overheard"], cor:0, exp:"OVERLOOK = have a view of from above. Oversee = supervise people.", tags:["col"]},
 {n:2, opts:["take","do","make","get"], cor:2, exp:"MAKE the most of = use as fully as possible.", tags:["fix"]},
 {n:3, opts:["filled","poured","loaded","stocked"], cor:0, exp:"FILL a container WITH something. You pour liquid; you stock a shop.", tags:["col","prep"]},
 {n:4, opts:["thrived","prospered","boomed","succeeded"], cor:0, exp:"plants THRIVE = grow strongly. Businesses boom, people prosper.", tags:["col"]},
 {n:5, opts:["divides","shares","parts","splits"], cor:1, exp:"SHARE something WITH somebody.", tags:["col","prep"]},
 {n:6, opts:["near","exact","close","strict"], cor:2, exp:"pay CLOSE attention — fixed intensifier.", tags:["col"]},
 {n:7, opts:["allow","let","agree","approve"], cor:0, exp:"ALLOW somebody TO do. LET takes the bare infinitive; agree/approve don’t take object + to-infinitive.", tags:["ger","pass"]},
 {n:8, opts:["wondering","considering","thinking","debating about"], cor:1, exp:"CONSIDER + noun/-ing, no preposition. THINK would need ABOUT.", tags:["ger"]},
]});
P.p1.push({
id:"pp1h", title:"Learning to juggle", level:"standard",
text:"Juggling looks impossible until somebody breaks it (1) into steps. My instructor, a retired circus performer, began by making me (2) a single ball from hand to hand for a full week. I was desperate to move on, but he refused to let me (3) corners. “Drop a thousand balls,” he said cheerfully, “and you will be a juggler.” He was right. Once my hands knew the rhythm, the second ball almost taught (4) . The third took longer, and I nearly gave (5) hope of ever managing it. What kept me going was a simple piece of (6) : practise beside a bed, so the balls land softly and you waste no energy bending down. Within a month I could juggle while walking, much to the (7) of my flatmates, who had (8) my chances at zero.",
gaps:[
 {n:1, opts:["down","up","off","out"], cor:0, exp:"BREAK something DOWN into steps = divide into parts.", tags:["pv"]},
 {n:2, opts:["to throw","throwing","throw","thrown"], cor:2, exp:"MAKE somebody DO — bare infinitive after make.", tags:["ger","pass"]},
 {n:3, opts:["take","cut","trim","skip"], cor:1, exp:"CUT corners = do something the careless, easy way.", tags:["fix"]},
 {n:4, opts:["itself","himself","myself","oneself"], cor:0, exp:"the ball almost taught ITSELF — reflexive agrees with the subject.", tags:["pron"]},
 {n:5, opts:["off","away","up","in"], cor:2, exp:"GIVE UP hope of -ing.", tags:["pv","ger"]},
 {n:6, opts:["advise","advice","recommendation","tip"], cor:1, exp:"a piece of ADVICE (uncountable, spelled with C). 'A piece of recommendation/tip' fails; advise is the verb.", tags:["spell","col"]},
 {n:7, opts:["amazement","amaze","amazingness","amazing"], cor:0, exp:"much to the AMAZEMENT of — a noun must follow 'the'.", tags:["wfnoun"]},
 {n:8, opts:["rated","marked","scored","graded"], cor:0, exp:"RATE somebody's chances AT = assess them.", tags:["col","prep"]},
]});

/* ---------- STANDARD Part 3 ---------- */
P.p3.push({
id:"pp3h", title:"The school radio station", level:"standard",
text:"Our school radio station began as a lunchtime experiment and is now a source of real (1)PROUD for everyone involved. The studio — a converted storeroom — looks (2)PROFESSION enough to fool visitors, and the weekly schedule is planned with impressive (3)EFFICIENT . Pupils handle everything themselves, from the (4)CHOOSE of music to interviews with local figures. Teachers admit they were (5)DOUBT at first, fearing chaos on the airwaves. Instead, the project has improved attendance, boosted (6)CONFIDENT , and given shy students an (7)EXPECT route into public speaking. The next ambition is a podcast, which the team insists is entirely (8)ACHIEVE before the summer.",
gaps:[
 {n:1, stem:"PROUD", ans:["pride"], exp:"proud → pride (irregular noun).", tags:["wfnoun","spell"]},
 {n:2, stem:"PROFESSION", ans:["professional"], exp:"profession → professional.", tags:["wfadj","spell"]},
 {n:3, stem:"EFFICIENT", ans:["efficiency"], exp:"efficient → efficiency.", tags:["wfnoun"]},
 {n:4, stem:"CHOOSE", ans:["choice"], exp:"choose → choice (vowel change).", tags:["wfnoun","spell"]},
 {n:5, stem:"DOUBT", ans:["doubtful"], exp:"doubt → doubtful (adjective).", tags:["wfadj"]},
 {n:6, stem:"CONFIDENT", ans:["confidence"], exp:"confident → confidence.", tags:["wfnoun","spell"]},
 {n:7, stem:"EXPECT", ans:["unexpected"], exp:"expect → UNexpected — the negative prefix is needed: an unexpected route.", tags:["wfneg"]},
 {n:8, stem:"ACHIEVE", ans:["achievable"], exp:"achieve → achievable.", tags:["wfadj","spell"]},
]});

/* ---------- CHALLENGE Part 1 (subtler collocations, C1-edge) ---------- */
P.p1.push({
id:"pp1i", title:"The myth of the photographic memory", level:"challenge",
text:"Popular culture is fond of characters who glance at a page and (1) every word for ever. Memory researchers, however, remain deeply sceptical: under laboratory conditions, nobody has ever (2) the existence of a truly photographic memory. What the best rememberers actually do (3) to something less magical and more interesting. They encode information in vivid scenes, (4) new facts to familiar places, and rehearse at widening intervals. In other words, exceptional memory is a skill (5) through technique rather than a gift. The broader implication is encouraging: (6) the methods are learnable, ordinary students can (7) the gap dramatically. The brain you were born with matters less than the (8) you make of it.",
gaps:[
 {n:1, opts:["contain","retain","obtain","sustain"], cor:1, exp:"RETAIN = keep in memory. The -tain family, separated only by prefix.", tags:["col"]},
 {n:2, opts:["demonstrated","displayed","exposed","performed"], cor:0, exp:"DEMONSTRATE the existence of = prove.", tags:["col"]},
 {n:3, opts:["gets","falls","comes","turns"], cor:2, exp:"COME DOWN TO = be essentially a matter of.", tags:["pv"]},
 {n:4, opts:["weld","staple","anchor","cement"], cor:2, exp:"ANCHOR new facts TO familiar places — the memory-technique metaphor. Weld/staple are physical-only; cement wants relationships.", tags:["col"]},
 {n:5, opts:["acquired","received","earned","collected"], cor:0, exp:"a skill ACQUIRED through practice.", tags:["col"]},
 {n:6, opts:["since","although","unless","whereas"], cor:0, exp:"SINCE = because (the logic is cause, not contrast or condition).", tags:["link"]},
 {n:7, opts:["narrow","thin","slim","tighten"], cor:0, exp:"NARROW the gap — the fixed pair.", tags:["col"]},
 {n:8, opts:["effort","use","work","practice"], cor:1, exp:"the USE you make of it — 'make use of', relativised.", tags:["fix"]},
]});
P.p1.push({
id:"pp1j", title:"Reading the weather at sea", level:"challenge",
text:"Long before satellites, sailors crossed oceans by (1) of accumulated observation. A ring around the moon (2) rain within a day; a steady fall in pressure gave (3) of worse to come. Such knowledge was hard (4) , passed from captain to apprentice over years of shared watches. Modern forecasting has not made it obsolete. Yacht crews are still trained to (5) the sky against the official forecast, because conditions at sea can (6) with astonishing speed. More than one skipper has been (7) the embarrassment of a ruined voyage by noticing what the clouds were doing while the radio promised sunshine. At sea, the sky always (8) the final word.",
gaps:[
 {n:1, opts:["sake","help","way","virtue"], cor:3, exp:"BY VIRTUE OF = thanks to. 'By way of' = via / as a form of; sake and help build different phrases.", tags:["depprep"]},
 {n:2, opts:["foretold","guessed","supposed","reckoned"], cor:0, exp:"an omen FORETOLD rain = was a sign of it. Guess/suppose/reckon need a human subject.", tags:["col"]},
 {n:3, opts:["warning","signal","notice","alarm"], cor:0, exp:"GIVE WARNING OF — fixed phrase. (Give notice = resign!)", tags:["col","fix"]},
 {n:4, opts:["gained","won","earned","achieved"], cor:2, exp:"hard-EARNED knowledge.", tags:["col"]},
 {n:5, opts:["see","watch","read","look"], cor:2, exp:"READ the sky = interpret it.", tags:["col"]},
 {n:6, opts:["deteriorate","collapse","decay","descend"], cor:0, exp:"conditions DETERIORATE = get worse.", tags:["col","spell"]},
 {n:7, opts:["spared","excused","forgiven","pardoned"], cor:0, exp:"SPARE somebody the embarrassment → passive: be spared the embarrassment.", tags:["col","pass"]},
 {n:8, opts:["holds","has","keeps","owns"], cor:1, exp:"HAVE the final word — idiom.", tags:["fix"]},
]});
P.p1.push({
id:"pp1k", title:"The slow rise of the repair café", level:"challenge",
text:"The first repair café opened in Amsterdam in 2009, and the idea has since (1) on remarkably. The format could hardly be simpler: volunteers with soldering irons and sewing machines (2) up shop in a community hall, and residents bring whatever has stopped working. Toasters are taken (3) , trouser hems are rescued, and a surprising number of “dead” laptops turn out to need nothing more than a cable. Organisers are quick to (4) out that the point is not merely thrift. Every repaired kettle is a small (5) against a culture that treats objects as disposable. Visitors also (6) something harder to measure: the confidence to open things up. Many arrive (7) that electronics are beyond them and leave having fixed their own headphones — a shift in attitude that, campaigners argue, (8) far beyond the workshop door.",
gaps:[
 {n:1, opts:["caught","taken","picked","carried"], cor:0, exp:"CATCH ON = become popular.", tags:["pv"]},
 {n:2, opts:["put","set","stand","turn"], cor:1, exp:"SET UP SHOP = establish yourself somewhere to work.", tags:["pv","fix"]},
 {n:3, opts:["apart","away","down","off"], cor:0, exp:"TAKE APART = disassemble.", tags:["pv"]},
 {n:4, opts:["spell","point","set","mark"], cor:1, exp:"POINT OUT that = draw attention to.", tags:["pv"]},
 {n:5, opts:["refusal","protest","denial","disagreement"], cor:1, exp:"a small PROTEST AGAINST. Refusal takes TO, denial OF, disagreement WITH.", tags:["col","prep"]},
 {n:6, opts:["gain","win","reach","earn"], cor:0, exp:"GAIN confidence.", tags:["col"]},
 {n:7, opts:["convinced","persuaded","determined","resolved"], cor:0, exp:"arrive CONVINCED THAT — persuaded would need somebody doing the persuading.", tags:["col"]},
 {n:8, opts:["arrives","extends","enlarges","escapes"], cor:1, exp:"EXTENDS far beyond = reaches past.", tags:["col"]},
]});
P.p1.push({
id:"pp1l", title:"How cities sound at night", level:"challenge",
text:"Acousticians who study cities after dark describe a soundscape utterly (1) from the daytime one. With traffic reduced to a murmur, noises that normally go (2) — a distant train, fox cries, the hum of substations — suddenly (3) themselves felt. Researchers in Berlin spent two years recording the same street corner at 3 a.m., and their archive (4) some surprising conclusions. Night noise, they found, is judged less by volume than by meaning: a neighbour’s heels on a wooden floor will (5) more complaints than a louder but anonymous motorway. The team now advises planners to stop (6) noise purely in decibels and to take its character into (7) as well. A city that merely quietens the night, they argue, has only done half the job; the real prize is a night that sounds (8) home.",
gaps:[
 {n:1, opts:["distinct","apart","separate","contrary"], cor:0, exp:"DISTINCT FROM = clearly different from.", tags:["col","prep"]},
 {n:2, opts:["unheard","unnoticed","missing","ignored"], cor:1, exp:"GO UNNOTICED — the fixed pair.", tags:["fix","pass"]},
 {n:3, opts:["have","get","make","find"], cor:2, exp:"MAKE themselves felt — idiom.", tags:["fix"]},
 {n:4, opts:["yielded","granted","donated","awarded"], cor:0, exp:"YIELD conclusions/results — the research verb.", tags:["col"]},
 {n:5, opts:["pull","draw","drag","fetch"], cor:1, exp:"DRAW complaints/criticism = attract.", tags:["col"]},
 {n:6, opts:["measuring","counting","timing","sizing"], cor:0, exp:"MEASURE noise in decibels — measure in units.", tags:["ger","col"]},
 {n:7, opts:["thought","account","mind","regard"], cor:1, exp:"take something INTO ACCOUNT.", tags:["depprep"]},
 {n:8, opts:["of","as","like","with"], cor:2, exp:"sounds LIKE home — sound + like + noun.", tags:["prep"]},
]});

/* ---------- CHALLENGE Part 2 (less sign-posted gaps) ---------- */
P.p2.push({
id:"pp2i", title:"On keeping a diary", level:"challenge",
text:"Diarists rarely agree on why they write. Some treat the page as a confessional, others as little (1) than an appointment book with opinions. What unites them is the discipline itself: a few lines every night, no matter (2) tired they are. Research suggests the habit pays unexpected dividends. People who write briefly about their day report sleeping better, (3) is hardly what you would predict from an activity that revisits its stresses. One explanation is that naming a worry cuts it (4) to size; once captured, it no longer circles the mind demanding attention. (5) it not for this calming effect, the practice would probably have died out long (6) . Instead, sales of paper notebooks keep rising — proof, if proof (7) needed, that some technologies survive (8) being officially obsolete.",
gaps:[
 {n:1, ans:["more"], gt:"comp", exp:"little MORE than = hardly anything more than.", tags:["comp"]},
 {n:2, ans:["how"], gt:"adv", exp:"no matter HOW tired — concession.", tags:["link"]},
 {n:3, ans:["which"], gt:"rel", exp:"…, WHICH is hardly what you would predict — relative referring to the whole clause.", tags:["rel"]},
 {n:4, ans:["down"], gt:"adv", exp:"CUT something DOWN TO SIZE — idiom.", tags:["pv","fix"]},
 {n:5, ans:["were"], gt:"aux", exp:"WERE it not for = if it were not for (formal inversion).", tags:["cond","inv"]},
 {n:6, ans:["ago","since"], gt:"adv", exp:"died out long AGO (long SINCE also survives in formal style).", tags:["fix"]},
 {n:7, ans:["were","be"], gt:"aux", exp:"if proof WERE needed — subjunctive in a fixed phrase ('if proof be needed' is the older form).", tags:["cond","pass"]},
 {n:8, ans:["despite"], gt:"prep", exp:"survive DESPITE being obsolete — preposition + -ing.", tags:["link","ger"]},
]});
P.p2.push({
id:"pp2j", title:"The chess prodigy who walked away", level:"challenge",
text:"At twelve, Marta Ruiz was the youngest national champion her country had (1) produced. By sixteen she had beaten three grandmasters; by nineteen she had stopped playing (2) . Journalists assumed burnout, but Marta tells it differently. Chess, she says, had begun to crowd (3) everything else she might become. Hardly (4) she finished one tournament when preparation for the next began. Nor was it the losing that wore her down: it was winning, and discovering how little the victories changed. (5) eventually freed her was a chance remark from her grandmother, to (6) she still owes, she says, her sense of proportion: “A life should not fit on sixty-four squares.” Marta now coaches twice a week — on (7) that the children also bring a hobby that has nothing to do (8) chess.",
gaps:[
 {n:1, ans:["ever"], gt:"adv", exp:"the youngest champion the country had EVER produced.", tags:["comp","aux"]},
 {n:2, ans:["altogether","completely","entirely"], gt:"adv", exp:"stopped playing ALTOGETHER = completely.", tags:["fix"]},
 {n:3, ans:["out"], gt:"adv", exp:"CROWD OUT = leave no room for.", tags:["pv"]},
 {n:4, ans:["had"], gt:"aux", exp:"HARDLY HAD she finished … when — inversion after hardly.", tags:["inv","aux"]},
 {n:5, ans:["what"], gt:"rel", exp:"WHAT eventually freed her was… — what-cleft as subject.", tags:["rel","inv"]},
 {n:6, ans:["whom"], gt:"rel", exp:"to WHOM she still owes — after a preposition, whom.", tags:["rel"]},
 {n:7, ans:["condition"], gt:"fixphrase", exp:"ON CONDITION THAT = provided that.", tags:["fix","cond"]},
 {n:8, ans:["with"], gt:"prep", exp:"have nothing to do WITH.", tags:["depprep"]},
]});
P.p2.push({
id:"pp2k", title:"Why we forget names", level:"challenge",
text:"Few memory failures embarrass us (1) reliably as forgetting a name seconds after hearing it. The explanation is unflattering but simple: most of the time we never store the name at (2) . During introductions, attention is busy elsewhere — judging first impressions, planning what to say — and the name slides past (3) being processed. Psychologists call this an encoding failure, (4) distinguish it from genuine forgetting. The cure follows from the diagnosis. Repeat the name aloud at (5) twice in the first minute; attach it to a feature, a job, anything with meaning; and if it has (6) slipped away, ask again immediately — far (7) insulting the other person, doing so signals that their name is worth the trouble. People would much (8) be asked twice than be avoided at the next meeting.",
gaps:[
 {n:1, ans:["as","so"], gt:"comp", exp:"as/SO reliably AS — the first half of the comparison.", tags:["comp"]},
 {n:2, ans:["all"], gt:"fixphrase", exp:"not … AT ALL.", tags:["fix"]},
 {n:3, ans:["without"], gt:"prep", exp:"slides past WITHOUT being processed.", tags:["prep","ger","pass"]},
 {n:4, ans:["to"], gt:"prep", exp:"…, TO distinguish it from — infinitive of purpose.", tags:["ger"]},
 {n:5, ans:["least"], gt:"fixphrase", exp:"AT LEAST twice.", tags:["fix"]},
 {n:6, ans:["already","still","somehow"], gt:"adv", exp:"if it has ALREADY slipped away (still/somehow also natural).", tags:["aux"]},
 {n:7, ans:["from"], gt:"prep", exp:"FAR FROM insulting the other person, doing so… = it does not insult them at all.", tags:["fix","inv"]},
 {n:8, ans:["rather","sooner"], gt:"modal", exp:"would much RATHER/SOONER be asked — preference + passive.", tags:["wish","pass"]},
]});
P.p2.push({
id:"pp2l", title:"The lighthouse keepers’ last shift", level:"challenge",
text:"When automation finally reached the last manned lighthouse in 1998, the three keepers (1) duty had spent a combined seventy years on the rock. Theirs was a working life like (2) other: eight weeks on, four off, the routine governed entirely by the light. (3) so much as a minute’s lateness was tolerated at lighting-up time, whatever the weather threw at them. Visitors imagined loneliness; the keepers spoke instead of rhythm, and of a silence it took weeks to learn to hear. Now that the lamps come (4) by themselves at dusk, only the buildings remain, many of them converted into holiday lets. Former keepers are sometimes hired to show guests (5) the towers — wry tours in which nostalgia is kept firmly (6) control. Asked whether the old service should (7) been preserved, one replied that progress was right to come, “but it might at (8) have knocked first.”",
gaps:[
 {n:1, ans:["on"], gt:"prep", exp:"the keepers ON duty.", tags:["depprep"]},
 {n:2, ans:["no"], gt:"det", exp:"a life like NO other.", tags:["det","fix"]},
 {n:3, ans:["not"], gt:"adv", exp:"NOT so much as a minute’s lateness — emphatic negative.", tags:["inv","det"]},
 {n:4, ans:["on"], gt:"adv", exp:"the lamps COME ON = start working, by themselves.", tags:["pv"]},
 {n:5, ans:["around","round","over"], gt:"adv", exp:"show guests AROUND/ROUND the towers.", tags:["pv"]},
 {n:6, ans:["under"], gt:"prep", exp:"kept firmly UNDER control.", tags:["depprep"]},
 {n:7, ans:["have"], gt:"aux", exp:"should HAVE been preserved — perfect modal passive.", tags:["modal","pass"]},
 {n:8, ans:["least"], gt:"fixphrase", exp:"might AT LEAST have knocked.", tags:["fix"]},
]});

/* ---------- CHALLENGE Part 3 (harder derivations: negatives, plurals, double shifts) ---------- */
P.p3.push({
id:"pp3i", title:"The psychology of queueing", level:"challenge",
text:"Queueing feels like wasted time, yet our reaction to it is anything but simple. Studies show that (1)CERTAIN about how long a wait will last annoys people far more than the wait itself, which is why airports now display (2)MISLEAD generous estimates that the real queue then beats. Equally important is the (3)PERCEIVE of fairness: a single winding line is slower for some, but the sight of latecomers overtaking is so (4)BEAR for most of us that companies avoid multiple lines wherever possible. Clever design can make a wait feel (5)CONSIDER shorter than it is — mirrors by lifts, for instance, cut complaints (6)DRAMA . None of this, researchers concede, makes queueing enjoyable. It merely keeps our natural (7)PATIENT within socially acceptable limits, and turns a daily irritation into something (8)ENDURE .",
gaps:[
 {n:1, stem:"CERTAIN", ans:["uncertainty"], exp:"certain → UNcertainty — negative prefix AND noun suffix (double shift).", tags:["wfneg","wfnoun"]},
 {n:2, stem:"MISLEAD", ans:["misleadingly"], exp:"mislead → misleadingLY — an adverb is needed to modify 'generous'.", tags:["wfadv"]},
 {n:3, stem:"PERCEIVE", ans:["perception"], exp:"perceive → perception.", tags:["wfnoun","spell"]},
 {n:4, stem:"BEAR", ans:["unbearable"], exp:"bear → UNbearable — negative + -able.", tags:["wfneg","wfadj"]},
 {n:5, stem:"CONSIDER", ans:["considerably"], exp:"consider → considerably (adverb modifying 'shorter').", tags:["wfadv"]},
 {n:6, stem:"DRAMA", ans:["dramatically"], exp:"drama → dramatically.", tags:["wfadv","spell"]},
 {n:7, stem:"PATIENT", ans:["impatience"], exp:"patient → IMpatience — negative prefix + noun.", tags:["wfneg","wfnoun","spell"]},
 {n:8, stem:"ENDURE", ans:["endurable"], exp:"endure → endurable = bearable.", tags:["wfadj"]},
]});
P.p3.push({
id:"pp3j", title:"Volcano tourism", level:"challenge",
text:"Every year, thousands of travellers pay for the (1)FORGET experience of standing at the rim of an active volcano. The attraction is easy to grasp: nowhere else does the planet feel so alive, so vast, so completely (2)DIFFER to human plans. Yet the industry walks an ethical tightrope. Guides face constant (3)PRESS to approach closer than official limits allow, and the (4)COMPARE safety of recent years has bred complacency. Volcanologists point out that eruptions remain fundamentally (5)PREDICT , however good the monitoring. After the 2019 tragedy in New Zealand, several operators were judged to have shown a (6)REGRET lack of caution. The lesson is not that such journeys should end, but that their (7)POPULAR must never be allowed to outweigh the mountain’s (8)DENY power to surprise.",
gaps:[
 {n:1, stem:"FORGET", ans:["unforgettable"], exp:"forget → UNforgettable — negative prefix + double T + -able.", tags:["wfneg","wfadj","spell"]},
 {n:2, stem:"DIFFER", ans:["indifferent"], exp:"differ → INdifferent (to) = unmoved by — a meaning shift, not just 'different'.", tags:["wfneg","wfadj","spell"]},
 {n:3, stem:"PRESS", ans:["pressure"], exp:"press → pressure.", tags:["wfnoun"]},
 {n:4, stem:"COMPARE", ans:["comparative"], exp:"compare → comparative safety.", tags:["wfadj"]},
 {n:5, stem:"PREDICT", ans:["unpredictable"], exp:"predict → UNpredictable.", tags:["wfneg","wfadj"]},
 {n:6, stem:"REGRET", ans:["regrettable"], exp:"regret → regrettable — double T.", tags:["wfadj","spell"]},
 {n:7, stem:"POPULAR", ans:["popularity"], exp:"popular → popularity.", tags:["wfnoun"]},
 {n:8, stem:"DENY", ans:["undeniable"], exp:"deny → UNdeniable.", tags:["wfneg","wfadj"]},
]});
P.p3.push({
id:"pp3k", title:"Night trains across Europe", level:"challenge",
text:"After decades of (1)STEADY decline, the European night train is enjoying an unlikely revival. Operators who once cut sleeper routes as (2)PROFIT now reopen them to satisfy travellers hunting for alternatives to short flights. The appeal is partly practical — you board at dusk and arrive, (3)REFRESH , in a new capital at dawn — and partly romantic, for trains retain an (4)EXPLAIN hold on the imagination. The new services are not cheap, and critics question their (5)RELY in winter. Supporters reply that early teething troubles were (6)AVOID , given how quickly the network grew, and point to booking figures of remarkable (7)STRONG . Whether the revival lasts will depend, as ever, on (8)PUNCTUAL — the one virtue no sleeping passenger ever forgives a railway for lacking.",
gaps:[
 {n:1, stem:"STEADY", ans:["steady"], exp:"No change — STEADY already fits 'decades of steady decline'. Cambridge plants exactly one of these to test nerve.", tags:["wfadj"]},
 {n:2, stem:"PROFIT", ans:["unprofitable"], exp:"profit → UNprofitable — routes were cut BECAUSE unprofitable.", tags:["wfneg","wfadj"]},
 {n:3, stem:"REFRESH", ans:["refreshed"], exp:"refresh → refreshed (participle adjective describing 'you').", tags:["wfadj"]},
 {n:4, stem:"EXPLAIN", ans:["inexplicable"], exp:"explain → INexplicable = impossible to explain. The hardest shift in the set.", tags:["wfneg","wfadj","spell"]},
 {n:5, stem:"RELY", ans:["reliability"], exp:"rely → reliability.", tags:["wfnoun","spell"]},
 {n:6, stem:"AVOID", ans:["unavoidable"], exp:"avoid → UNavoidable.", tags:["wfneg","wfadj"]},
 {n:7, stem:"STRONG", ans:["strength"], exp:"strong → strength.", tags:["wfnoun","spell"]},
 {n:8, stem:"PUNCTUAL", ans:["punctuality"], exp:"punctual → punctuality.", tags:["wfnoun"]},
]});
P.p3.push({
id:"pp3l", title:"The restoration of silence", level:"challenge",
text:"Acoustic ecologists argue that genuine quiet has become one of the rarest (1)OCCUR in the natural world. Even remote valleys suffer the (2)AVOID drone of aircraft, and recordings made in national parks reveal a (3)WORRY rise in mechanical noise over thirty years. The campaign for protected “quiet zones” therefore strikes many as perfectly (4)REASON . Opponents, however, find the proposals (5)PRACTICE , arguing that no agency can police the sky. Campaigners respond that the goal is less (6)AMBITION than critics claim: not the (7)ELIMINATE of all sound, but the preservation of places where natural sound still dominates. Anyone who has heard a dawn chorus undisturbed will confirm that the experience is (8)PRICE .",
gaps:[
 {n:1, stem:"OCCUR", ans:["occurrences"], exp:"occur → occurrences — double C, double R, AND the plural after 'one of the rarest'.", tags:["wfnoun","spell"]},
 {n:2, stem:"AVOID", ans:["unavoidable"], exp:"avoid → UNavoidable drone.", tags:["wfneg","wfadj"]},
 {n:3, stem:"WORRY", ans:["worrying"], exp:"worry → worrying (adjective).", tags:["wfadj"]},
 {n:4, stem:"REASON", ans:["reasonable"], exp:"reason → reasonable.", tags:["wfadj"]},
 {n:5, stem:"PRACTICE", ans:["impractical"], exp:"practice → IMpractical — the negative prefix becomes IM- before P.", tags:["wfneg","wfadj","spell"]},
 {n:6, stem:"AMBITION", ans:["ambitious"], exp:"ambition → ambitious — 'less ambitious than critics claim'.", tags:["wfadj"]},
 {n:7, stem:"ELIMINATE", ans:["elimination"], exp:"eliminate → elimination.", tags:["wfnoun"]},
 {n:8, stem:"PRICE", ans:["priceless"], exp:"price → priceless = beyond price (NOT 'expensive').", tags:["wfadj"]},
]});
})();
