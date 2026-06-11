/* Mastery (FCE) — question bank V: hard pack (k96–k110, c123–c137, w94–w108, m96–m110)
   + 3 extra mock passages. Focus: structures students statistically fail. */
window.FCE = window.FCE || {};
FCE.BANK = FCE.BANK || {};
(function(){
var K = [
{id:"k96", s1:"They say the castle is over a thousand years old.", key:"SAID", s2:"The castle is ____ over a thousand years old.", ans:["said to be"], halves:[["said"],["to be"]], tags:["pass","rep"], diff:5, exp:"Impersonal passive: X is SAID TO BE…", trap:"'is said that' needs IT as subject — with 'the castle', use said to be."},
{id:"k97", s1:"It was wrong of you to read my diary.", key:"SHOULD", s2:"You ____ my diary.", ans:["should not have read","shouldn't have read"], halves:[["should not have","shouldn't have"],["read"]], tags:["modal"], diff:4, exp:"Past criticism: SHOULD NOT HAVE + participle.", trap:"'shouldn't read' criticises the future, not the past."},
{id:"k98", s1:"The thief got away although the alarm went off.", key:"SPITE", s2:"The thief got away in ____ going off.", ans:["spite of the alarm","spite of the alarm's"], halves:[["spite of"],["the alarm"]], tags:["link","ger"], diff:5, exp:"in SPITE OF + noun + -ing.", trap:"The -ing after the gap forces a noun phrase, not a clause."},
{id:"k99", s1:"I only recognised her when she took off her glasses.", key:"UNTIL", s2:"It was not ____ off her glasses that I recognised her.", ans:["until she took"], halves:[["until"],["she took"]], tags:["inv","link"], diff:5, exp:"Cleft: It was not UNTIL … THAT …", trap:"Keep normal order inside the cleft: until she took."},
{id:"k100", s1:"“Let’s split the bill,” said Marco.", key:"SUGGESTED", s2:"Marco ____ the bill.", ans:["suggested splitting","suggested that they split","suggested they split"], halves:[["suggested"],["splitting","they split"]], tags:["rep","ger"], diff:3, exp:"suggest + -ing / that-clause.", trap:"Never 'suggested to split'."},
{id:"k101", s1:"Maybe Ana didn’t get my message.", key:"MIGHT", s2:"Ana ____ my message.", ans:["might not have got","might not have received","mightn't have got"], halves:[["might not have","mightn't have"],["got","received"]], tags:["modal"], diff:4, exp:"Past possibility: MIGHT NOT HAVE + participle.", trap:"'might not get' moves it to the future."},
{id:"k102", s1:"Tina finds noisy offices difficult to work in.", key:"IT", s2:"Tina finds ____ work in noisy offices.", ans:["it difficult to","it hard to"], halves:[["it difficult","it hard"],["to"]], tags:["pron","fix"], diff:4, exp:"find IT + adjective + to-infinitive.", trap:"The dummy IT cannot be skipped."},
{id:"k103", s1:"Booking early is advisable because seats sell out.", key:"BETTER", s2:"You had ____ because seats sell out.", ans:["better book early"], halves:[["better"],["book early"]], tags:["modal"], diff:3, exp:"HAD better + bare infinitive.", trap:"No TO after had better."},
{id:"k104", s1:"The two paintings are practically identical.", key:"DIFFERENCE", s2:"There is hardly ____ the two paintings.", ans:["any difference between"], halves:[["any difference"],["between"]], tags:["det","col"], diff:4, exp:"hardly ANY difference BETWEEN.", trap:"BETWEEN two things, AMONG more."},
{id:"k105", s1:"Everyone must obey the safety rules, with no exceptions.", key:"EXCEPTION", s2:"Everyone must obey the safety rules ____ .", ans:["without exception","without any exception"], halves:[["without"],["exception"]], tags:["fix"], diff:3, exp:"WITHOUT EXCEPTION = no exceptions allowed.", trap:"Singular, no article: without exception."},
{id:"k106", s1:"Hard work was the reason for her promotion.", key:"RESULT", s2:"She was promoted as ____ her hard work.", ans:["a result of"], halves:[["a result"],["of"]], tags:["depprep"], diff:2, exp:"as A RESULT OF + noun.", trap:"All three little words count: a + result + of."},
{id:"k107", s1:"I started writing this report two hours ago and I haven’t finished.", key:"BEEN", s2:"I ____ this report for two hours.", ans:["have been writing"], halves:[["have been"],["writing"]], tags:["aux"], diff:3, exp:"Unfinished action: present perfect continuous.", trap:"'have written' suggests it's finished — contradicts the sentence."},
{id:"k108", s1:"“Why didn’t you call me, Leo?” asked Mia.", key:"WHY", s2:"Mia asked Leo ____ called her.", ans:["why he had not","why he hadn't"], halves:[["why he"],["had not","hadn't"]], tags:["rep"], diff:4, exp:"Reported question + backshift to past perfect negative.", trap:"Statement order and HAD NOT — two traps in one."},
{id:"k109", s1:"If you hadn’t helped me, I wouldn’t have passed.", key:"FOR", s2:"Had it not been ____ , I wouldn’t have passed.", ans:["for your help"], halves:[["for"],["your help"]], tags:["cond","inv"], diff:5, exp:"Inverted third conditional idiom: Had it not been FOR + noun.", trap:"The most advanced conditional Cambridge tests — learn it whole."},
{id:"k110", s1:"This is the most boring film I have ever seen.", key:"NEVER", s2:"I have ____ boring film.", ans:["never seen such a","never watched such a"], halves:[["never seen","never watched"],["such a"]], tags:["det","comp"], diff:4, exp:"superlative ↔ NEVER + such a + adjective + noun.", trap:"SUCH A — both words needed."},
];
var C = [
{id:"c123", s:"____ having apologised twice, he still felt guilty.", ans:["despite"], gt:"link", tags:["link","ger"], diff:4, exp:"DESPITE + having + participle.", trap:"Capital position + -ing → despite, not although."},
{id:"c124", s:"Seldom ____ such a young player won the tournament.", ans:["has"], gt:"aux", tags:["inv","aux"], diff:5, exp:"Negative adverb start → inversion: Seldom HAS X won.", trap:"'Seldom a young player has' misses the inversion."},
{id:"c125", s:"The instructions were difficult to make sense ____ .", ans:["of"], gt:"prep", tags:["fix","prep"], diff:4, exp:"make sense OF something — the preposition strands at the end.", trap:"Easy to miss the stranded OF entirely."},
{id:"c126", s:"____ it not been for the map, we would still be lost.", ans:["had"], gt:"aux", tags:["cond","inv"], diff:5, exp:"HAD it not been for = without (inverted conditional).", trap:"The H-word is the whole grammar here."},
{id:"c127", s:"You can borrow the car, ____ condition that you refuel it.", ans:["on"], gt:"prep", tags:["depprep","cond"], diff:3, exp:"ON condition that = only if.", trap:"IN condition is the near-miss."},
{id:"c128", s:"The meeting dragged ____ for nearly three hours.", ans:["on"], gt:"adv", tags:["pv"], diff:2, exp:"drag ON = continue tediously.", trap:"drag OUT needs an object."},
{id:"c129", s:"Little ____ she know what was waiting at home.", ans:["did"], gt:"aux", tags:["inv","aux"], diff:5, exp:"LITTLE did she know — fixed inverted opener.", trap:"Story-telling inversion; literal 'she knew little' breaks it."},
{id:"c130", s:"We’d better leave now, ____ we’ll miss the last train.", ans:["otherwise","or"], gt:"link", tags:["link","cond"], diff:2, exp:"OTHERWISE = if not.", trap:"'unless' can't sit between two full clauses like this."},
{id:"c131", s:"He’s not so much shy ____ extremely careful with strangers.", ans:["as"], gt:"comp", tags:["comp","fix"], diff:5, exp:"not so much X AS Y = more Y than X.", trap:"Rare but loved by examiners: the partner is AS."},
{id:"c132", s:"There were far ____ applicants than expected this year.", ans:["fewer","more"], gt:"det", tags:["det","comp"], diff:2, exp:"far FEWER/MORE + plural countable + than.", trap:"'less applicants' is the famous countable error."},
{id:"c133", s:"____ whom should I address the complaint?", ans:["to"], gt:"prep", tags:["prep","rel"], diff:4, exp:"Formal fronting: TO whom.", trap:"address something TO somebody."},
{id:"c134", s:"The patient is well ____ the way to a full recovery.", ans:["on"], gt:"fixphrase", tags:["fix"], diff:3, exp:"be (well) ON the way to.", trap:"IN the way = blocking; ON the way = progressing."},
{id:"c135", s:"I’m not used to ____ spoken to like that.", ans:["being"], gt:"vform", tags:["ger","pass"], diff:5, exp:"used to + BEING + participle (passive gerund).", trap:"'to be spoken' fails — after used to, the -ing form."},
{id:"c136", s:"Rarely have I tasted ____ delicious a meal.", ans:["so"], gt:"comp", tags:["comp","inv"], diff:5, exp:"SO + adjective + A + noun (literary).", trap:"'such delicious a meal' is the wrong frame; with this order it's SO."},
{id:"c137", s:"He gave up smoking once and ____ all last year.", ans:["for"], gt:"fixphrase", tags:["fix"], diff:3, exp:"once and FOR all = definitively.", trap:"Fixed phrase — no variations."},
];
var W = [
{id:"w94", s:"Job ____ among graduates fell again last month.", stem:"EMPLOY", ans:["unemployment"], tags:["wfnoun","wfneg"], diff:3, exp:"'fell' + good news → UNemployment.", trap:"Read the logic: employment falling would be bad news."},
{id:"w95", s:"The hotel was luxurious ____ comparison with our usual campsite.", stem:"BY", ans:["by"], tags:["depprep"], diff:3, exp:"BY/IN comparison with.", trap:"This one is a preposition disguised as word formation — stay alert."},
{id:"w96", s:"Her ____ to detail makes her reports outstanding.", stem:"ATTENTIVE", ans:["attentiveness","attention"], tags:["wfnoun"], diff:4, exp:"attentive → attentiveness (also accepted: attention).", trap:"-NESS builds nouns from adjectives."},
{id:"w97", s:"The witness gave a ____ account of the accident.", stem:"DETAIL", ans:["detailed"], tags:["wfadj"], diff:2, exp:"detail → detailed (adjective).", trap:"'detailful' doesn't exist."},
{id:"w98", s:"Some critics found the ending deeply ____ .", stem:"SATISFY", ans:["unsatisfying","dissatisfying","satisfying"], tags:["wfadj","wfneg"], diff:4, exp:"critics + 'deeply' → likely UNsatisfying; positive also grammatical.", trap:"unsatisfying (thing) vs dissatisfied (person)."},
{id:"w99", s:"Thanks to GPS, getting lost is now largely ____ .", stem:"AVOID", ans:["avoidable"], tags:["wfadj"], diff:3, exp:"avoid → avoidable.", trap:"'avoidible' — it's -ABLE here."},
{id:"w100", s:"The sheer ____ of the bridge takes visitors’ breath away.", stem:"HIGH", ans:["height"], tags:["wfnoun","spell"], diff:2, exp:"high → height.", trap:"h-e-i-g-h-t — five letters people scramble."},
{id:"w101", s:"Critics praised the film’s stunning ____ .", stem:"PHOTOGRAPH", ans:["photography"], tags:["wfnoun"], diff:2, exp:"photograph → photography (the art).", trap:"photographS would be the pictures, not the craft."},
{id:"w102", s:"It would be ____ to ignore the warning signs.", stem:"RESPONSIBLE", ans:["irresponsible"], tags:["wfadj","wfneg"], diff:3, exp:"ignore warnings = IRresponsible (ir- before r).", trap:"unresponsible doesn't exist."},
{id:"w103", s:"The library has ____ access to online journals.", stem:"LIMIT", ans:["unlimited"], tags:["wfadj","wfneg"], diff:3, exp:"libraries boast UNlimited access.", trap:"Polarity: 'limited access' would rarely be advertised."},
{id:"w104", s:"We apologise for any ____ this delay may cause.", stem:"CONVENIENT", ans:["inconvenience"], tags:["wfnoun","wfneg"], diff:3, exp:"apologise for → INconvenience.", trap:"Prefix + suffix: in-convenien-ce."},
{id:"w105", s:"The team showed great ____ in the final minutes.", stem:"DETERMINE", ans:["determination"], tags:["wfnoun"], diff:2, exp:"determine → determination.", trap:"Keep the full -ATION."},
{id:"w106", s:"Old appliances are far less energy-____ than new ones.", stem:"EFFICIENT", ans:["efficient"], tags:["wfadj"], diff:2, exp:"energy-EFFICIENT — compound adjective keeps base form.", trap:"Sometimes the 'transformation' is recognising no change is needed."},
{id:"w107", s:"The court ruled the contract ____ and void.", stem:"NULL", ans:["null"], tags:["wfadj","fix"], diff:5, exp:"null and void — fixed legal doublet.", trap:"Another no-change trap inside a fixed phrase."},
{id:"w108", s:"She answered every question with complete ____ .", stem:"CONFIDENT", ans:["confidence"], tags:["wfnoun"], diff:1, exp:"confident → confidence.", trap:"-ENCE noun."},
];
var M = [
{id:"m96", s:"The committee finally ____ to a decision at midnight.", opts:["came","reached","arrived","got"], cor:0, tags:["col","prep"], diff:3, exp:"COME TO a decision (reach takes no 'to').", trap:"The TO in the sentence eliminates reach."},
{id:"m97", s:"His new novel ____ on his childhood in Cádiz.", opts:["draws","pulls","drags","picks"], cor:0, tags:["pv","col"], diff:4, exp:"DRAW ON = use as a source.", trap:"draw on experience/memories — high-band collocation."},
{id:"m98", s:"____ but a miracle can save the team now.", opts:["Nothing","Anything","Something","All"], cor:0, tags:["fix","det"], diff:4, exp:"NOTHING BUT = only.", trap:"anything but = definitely not — the exact opposite."},
{id:"m99", s:"The CEO refused to ____ on the takeover rumours.", opts:["comment","mention","discuss","refer"], cor:0, tags:["prep","col"], diff:3, exp:"COMMENT ON.", trap:"mention/discuss take a direct object; refer needs TO."},
{id:"m100", s:"They ____ the picnic until the following Sunday.", opts:["put off","put away","put down","put out"], cor:0, tags:["pv"], diff:1, exp:"PUT OFF = postpone.", trap:"The other particles change everything: away=store, down=insult, out=extinguish."},
{id:"m101", s:"I was ____ the impression that the tickets were free.", opts:["under","in","on","at"], cor:0, tags:["depprep","fix"], diff:4, exp:"be UNDER the impression = believe (wrongly).", trap:"IN the impression is the standard miss."},
{id:"m102", s:"The trip was cancelled, much to our ____ .", opts:["disappointment","disappointed","disappointing","disappoint"], cor:0, tags:["wfnoun","fix"], diff:3, exp:"much to our + NOUN (disappointment/surprise/relief).", trap:"The frame demands a noun."},
{id:"m103", s:"You ____ as well take the early train — the late one is full.", opts:["might","could","would","should"], cor:0, tags:["modal","fix"], diff:4, exp:"MIGHT as well = there's no better option.", trap:"Fixed: might as well, not 'could as well'."},
{id:"m104", s:"The festival attracts visitors from all ____ the world.", opts:["over","around","across","along"], cor:0, tags:["prep","fix"], diff:1, exp:"all OVER the world.", trap:"'around the world' works alone, but ALL pairs with OVER."},
{id:"m105", s:"It’s high time we ____ this old printer.", opts:["replaced","replace","will replace","have replaced"], cor:0, tags:["wish"], diff:4, exp:"It's high time + PAST simple.", trap:"Past form, present meaning — the eternal trap."},
{id:"m106", s:"The lecture was so dull that half the audience ____ off.", opts:["dozed","slept","dreamt","passed"], cor:0, tags:["pv","col"], diff:3, exp:"DOZE OFF = fall asleep gradually.", trap:"sleep off = cure by sleeping; pass off = (of events) take place."},
{id:"m107", s:"Could you ____ the children while I’m at the dentist?", opts:["see to","look at","watch out","care"], cor:0, tags:["pv"], diff:4, exp:"SEE TO = take care of.", trap:"look AFTER would work — look AT does not; see to is the tested gem."},
{id:"m108", s:"Her version of events doesn’t quite ____ up with his.", opts:["tie","match","fit","go"], cor:0, tags:["pv","col"], diff:5, exp:"TIE UP WITH = be consistent with.", trap:"match needs no 'up with'; the frame decides."},
{id:"m109", s:"I’ll take the job — the salary is too good to ____ down.", opts:["turn","put","let","take"], cor:0, tags:["pv"], diff:2, exp:"TURN DOWN = reject.", trap:"too good to turn down — semi-fixed."},
{id:"m110", s:"We got completely soaked — it was raining cats and ____ .", opts:["dogs","cows","frogs","buckets"], cor:0, tags:["fix"], diff:1, exp:"raining cats and DOGS.", trap:"A gift question — never overthink an idiom you know."},
];
FCE.BANK.kwt = FCE.BANK.kwt.concat(K);
FCE.BANK.cloze = FCE.BANK.cloze.concat(C);
FCE.BANK.wf = FCE.BANK.wf.concat(W);
FCE.BANK.mcc = FCE.BANK.mcc.concat(M);

/* ---- extra mock passages ---- */
FCE.BANK.passages.p1.push({ id:"pp1c", title:"The man who walks every street",
 text:"Ten years ago, Matt Green (1) up his job as an engineer to walk every single street in New York — more than 13,000 kilometres of them. He survives on a tiny budget, (2) on friends’ sofas and occasionally house-sitting. What began as a personal challenge has (3) into something closer to a vocation. Green photographs hand-painted shop signs, churchyards and community gardens, and his blog has built up a devoted (4) . He insists he is in no (5) to finish: the point, he says, is to notice things. Most of us, he argues, (6) our own neighbourhoods for granted and could not describe the buildings we pass daily. Walking forces him to pay close (7) to detail. “Every street,” he says, “contains something worth stopping (8) .”",
 gaps:[
  {n:1, opts:["gave","put","took","set"], cor:0, exp:"GIVE UP a job = quit.", tags:["pv"]},
  {n:2, opts:["crashing","landing","falling","dropping"], cor:0, exp:"CRASH ON a sofa = sleep there (informal).", tags:["pv","col"]},
  {n:3, opts:["grown","turned","changed","moved"], cor:0, exp:"GROW INTO = develop into.", tags:["pv"]},
  {n:4, opts:["following","audience","crowd","attendance"], cor:0, exp:"build up a FOLLOWING.", tags:["col"]},
  {n:5, opts:["hurry","speed","urgency","haste"], cor:0, exp:"in no HURRY to.", tags:["fix"]},
  {n:6, opts:["take","get","hold","keep"], cor:0, exp:"TAKE something for granted.", tags:["fix"]},
  {n:7, opts:["attention","notice","care","interest"], cor:0, exp:"PAY ATTENTION TO.", tags:["col"]},
  {n:8, opts:["for","at","by","to"], cor:0, exp:"worth stopping FOR.", tags:["prep"]},
 ]});
FCE.BANK.passages.p3.push({ id:"pp3c", title:"The teenage brain",
 text:"Adolescence has a poor reputation, but neuroscientists now offer a more (1)SYMPATHY view. The teenage brain is not a faulty adult brain; it is a highly (2)FLEX learning machine. Risk-taking, often seen as simple (3)MATURE, is partly the cost of a brain wired for (4)EXPLORE. Teenagers respond far more strongly to social reward, which explains their deep (5)SENSE to peer opinion. The same wiring, however, brings real (6)ADVANTAGE: teenagers learn languages and instruments with remarkable (7)EASY. Schools that understand this can turn a stormy period into one of extraordinary (8)ACHIEVE.",
 gaps:[
  {n:1, stem:"SYMPATHY", ans:["sympathetic"], exp:"sympathy → sympathetic.", tags:["wfadj"]},
  {n:2, stem:"FLEX", ans:["flexible"], exp:"flex → flexible.", tags:["wfadj"]},
  {n:3, stem:"MATURE", ans:["immaturity"], exp:"negative noun: IMmaturity.", tags:["wfnoun","wfneg"]},
  {n:4, stem:"EXPLORE", ans:["exploration"], exp:"explore → exploration.", tags:["wfnoun"]},
  {n:5, stem:"SENSE", ans:["sensitivity"], exp:"sense → sensitivity.", tags:["wfnoun"]},
  {n:6, stem:"ADVANTAGE", ans:["advantages"], exp:"plural: real advantageS.", tags:["wfnoun"]},
  {n:7, stem:"EASY", ans:["ease"], exp:"easy → ease (noun).", tags:["wfnoun","spell"]},
  {n:8, stem:"ACHIEVE", ans:["achievement"], exp:"achieve → achievement.", tags:["wfnoun"]},
 ]});
FCE.BANK.passages.p3.push({ id:"pp3d", title:"Why maps lie",
 text:"Every flat map of the world is, strictly speaking, a (1)DECEIVE. Turning a sphere into a rectangle is a mathematical (2)POSSIBLE, so every projection makes a compromise. The famous Mercator map, prized by sailors for its (3)USE, makes Greenland look (4)ENORMOUS larger than it really is. Such distortions are not always innocent: critics argue they have shaped our (5)PERCEIVE of which countries matter. Newer projections aim for greater (6)FAIR, showing areas in true proportion. The lesson is not to abandon maps but to read them with healthy (7)SUSPECT — and to remember that even the most (8)SCIENCE image of the world contains a point of view.",
 gaps:[
  {n:1, stem:"DECEIVE", ans:["deception"], exp:"deceive → deception.", tags:["wfnoun","spell"]},
  {n:2, stem:"POSSIBLE", ans:["impossibility"], exp:"prefix + suffix: impossibility.", tags:["wfnoun","wfneg"]},
  {n:3, stem:"USE", ans:["usefulness"], exp:"use → usefulness.", tags:["wfnoun"]},
  {n:4, stem:"ENORMOUS", ans:["enormously"], exp:"adverb before comparative: enormously larger.", tags:["wfadv"]},
  {n:5, stem:"PERCEIVE", ans:["perception"], exp:"perceive → perception.", tags:["wfnoun","spell"]},
  {n:6, stem:"FAIR", ans:["fairness"], exp:"fair → fairness.", tags:["wfnoun"]},
  {n:7, stem:"SUSPECT", ans:["suspicion"], exp:"suspect → suspicion.", tags:["wfnoun","spell"]},
  {n:8, stem:"SCIENCE", ans:["scientific"], exp:"science → scientific.", tags:["wfadj"]},
 ]});
})();
