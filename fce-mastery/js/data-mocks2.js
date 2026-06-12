/* Mastery (FCE) — mock passage expansion II: +3 Part 1, +2 Part 2, +3 Part 3.
   Pools after this file: P1 ×6 · P2 ×8 · P3 ×7 → 336 passage combinations,
   each paired with 6 random transformations from the 130-item KWT pool. */
window.FCE = window.FCE || {};
(function(){
var P = FCE.BANK.passages;

/* ---------------- Part 1 (multiple-choice cloze) ---------------- */
P.p1.push({ id:"pp1d", title:"The sound of silence",
 text:"Open-plan offices were supposed to (1) communication between colleagues. (2) to expectations, however, many employees now wear headphones simply to be left alone. Constant chatter makes it hard to (3) track of demanding tasks, and the figures back this up: researchers (4) out an experiment in which volunteers did mental arithmetic while recorded conversations played, and they made (5) more mistakes than in silence. Interestingly, it is not noise as (6) that harms concentration, but speech we can understand — the brain insists on listening. This is why several companies are installing soundproof booths where workers can (7) refuge from the din. Silence, it turns (8) , is a luxury worth paying for.",
 gaps:[
  {n:1, opts:["boost","raise","lift","grow"], cor:0, exp:"BOOST communication — raise pairs with questions/prices, not communication.", tags:["col"]},
  {n:2, opts:["Contrary","Opposite","Against","Reverse"], cor:0, exp:"CONTRARY to expectations — fixed opener.", tags:["depprep","fix"]},
  {n:3, opts:["keep","hold","stay","remain"], cor:0, exp:"KEEP track of.", tags:["fix","col"]},
  {n:4, opts:["carried","brought","made","took"], cor:0, exp:"CARRY OUT an experiment.", tags:["pv","col"]},
  {n:5, opts:["far","much","very","so"], cor:0, exp:"FAR more mistakes — 'much more' fails with countables.", tags:["comp","det"]},
  {n:6, opts:["such","well","far","long"], cor:0, exp:"not X AS SUCH = not X in itself.", tags:["fix"]},
  {n:7, opts:["take","make","do","put"], cor:0, exp:"TAKE refuge.", tags:["fix","col"]},
  {n:8, opts:["out","up","over","round"], cor:0, exp:"it TURNS OUT = it is revealed.", tags:["pv"]},
 ]});
P.p1.push({ id:"pp1e", title:"A nose for the job",
 text:"Few professions (1) such a long apprenticeship as perfumery. Trainees must learn to (2) apart hundreds of similar scents, a skill that can take (3) to a decade to develop. Students begin (4) memorising simple materials such as vanilla and cedar; only later are they (5) to blend their own compositions. The work demands patience and an excellent (6) , since a perfumer must recall thousands of smells without hesitation. Mistakes are part of the process — a single wrong note can (7) a whole formula — but those who persist describe the moment a perfume finally (8) together as unforgettable.",
 gaps:[
  {n:1, opts:["demand","order","charge","instruct"], cor:0, exp:"DEMAND an apprenticeship/effort.", tags:["col"]},
  {n:2, opts:["tell","say","speak","talk"], cor:0, exp:"TELL apart = distinguish.", tags:["pv","fix"]},
  {n:3, opts:["up","out","in","off"], cor:0, exp:"take UP TO a decade.", tags:["fix","prep"]},
  {n:4, opts:["by","at","on","to"], cor:0, exp:"begin BY + -ing.", tags:["prep","ger"]},
  {n:5, opts:["allowed","let","admitted","agreed"], cor:0, exp:"be ALLOWED to — LET has no passive.", tags:["pass","modal"]},
  {n:6, opts:["memory","remembrance","reminder","souvenir"], cor:0, exp:"an excellent MEMORY — the other three are false friends.", tags:["col"]},
  {n:7, opts:["ruin","injure","wound","crack"], cor:0, exp:"RUIN a formula/plan.", tags:["col"]},
  {n:8, opts:["comes","goes","turns","falls"], cor:0, exp:"COME together = succeed as a whole.", tags:["pv"]},
 ]});
P.p1.push({ id:"pp1f", title:"The borrowed bicycle revolution",
 text:"City bike-sharing schemes have (1) off all over the world. What (2) as an eccentric experiment in 1960s Amsterdam is now part of daily life from Paris to Hangzhou: riders simply (3) a code to unlock the nearest bicycle and pay a few cents per ride. Supporters say the schemes (4) congestion and give commuters healthy exercise into the bargain. Not every project has been a success, (5) . Some cities found bikes dumped in canals or vandalised (6) repair. Yet operators argue such problems can be (7) with better design and fairer pricing — and that the humble bicycle still has a major part to (8) in urban life.",
 gaps:[
  {n:1, opts:["taken","set","put","got"], cor:0, exp:"TAKE OFF = suddenly become successful.", tags:["pv"]},
  {n:2, opts:["began","opened","entered","formed"], cor:0, exp:"what BEGAN as X.", tags:["col"]},
  {n:3, opts:["enter","insert","introduce","include"], cor:0, exp:"ENTER a code — introduce/include are classic false friends.", tags:["col"]},
  {n:4, opts:["ease","calm","soothe","comfort"], cor:0, exp:"EASE congestion/pressure.", tags:["col"]},
  {n:5, opts:["however","although","despite","whereas"], cor:0, exp:"sentence-final HOWEVER.", tags:["link"]},
  {n:6, opts:["beyond","above","across","behind"], cor:0, exp:"BEYOND repair = impossible to fix.", tags:["fix","prep"]},
  {n:7, opts:["overcome","overtaken","overdone","overlooked"], cor:0, exp:"OVERCOME problems.", tags:["col"]},
  {n:8, opts:["play","make","do","take"], cor:0, exp:"a part to PLAY.", tags:["fix","col"]},
 ]});

/* ---------------- Part 2 (open cloze) ---------------- */
P.p2.push({ id:"pp2g", title:"The people who count birds",
 text:"Every December, thousands of volunteers give (1) a whole weekend to count the birds in their area. The tradition dates (2) to the year 1900, when a naturalist proposed counting birds instead of shooting them. Anyone can take part, (3) matter how little they know about wildlife: beginners are simply paired (4) experienced birdwatchers and handed a notebook. (5) the data shows, year after year, is that several common species are quietly disappearing — information scientists could never gather (6) their own. The count goes ahead even (7) bad weather makes it difficult, and the atmosphere is famously friendly. If you enjoy your first weekend, nothing stops you (8) joining again next year.",
 gaps:[
  {n:1, ans:["up"], gt:"adv", exp:"GIVE UP a weekend = sacrifice it.", tags:["pv"]},
  {n:2, ans:["back"], gt:"adv", exp:"date BACK to + year.", tags:["pv","fix"]},
  {n:3, ans:["no"], gt:"fixphrase", exp:"NO matter how.", tags:["fix"]},
  {n:4, ans:["with"], gt:"prep", exp:"paired WITH.", tags:["prep","pass"]},
  {n:5, ans:["what"], gt:"rel", exp:"WHAT the data shows is… (the thing that).", tags:["rel"]},
  {n:6, ans:["on"], gt:"fixphrase", exp:"ON their own = by themselves.", tags:["fix","pron"]},
  {n:7, ans:["when","if","though"], gt:"link", exp:"even WHEN/IF/THOUGH + clause.", tags:["link"]},
  {n:8, ans:["from"], gt:"prep", exp:"stop somebody FROM + -ing.", tags:["prep","ger"]},
 ]});
P.p2.push({ id:"pp2h", title:"The quiet carriage",
 text:"Most long-distance trains in this country now include a quiet carriage, (1) phone calls and loud music are banned. Passengers (2) phones ring there can expect a chorus of angry looks. The rules are simple; (3) , a surprising number of people ignore them. Some travellers pretend not (4) have noticed the signs, while others speak so loudly that they might (5) well be using a megaphone. Conductors, for their part, are reluctant to get involved (6) arguments with customers. Even (7) , regular commuters insist the carriage is still calmer than the rest of the train. Next time you travel with work to do, it might be worth trying it (8) .",
 gaps:[
  {n:1, ans:["where"], gt:"rel", exp:"a carriage WHERE calls are banned.", tags:["rel"]},
  {n:2, ans:["whose"], gt:"rel", exp:"passengers WHOSE phones ring.", tags:["rel"]},
  {n:3, ans:["however","nevertheless","nonetheless"], gt:"link", exp:"sentence-initial contrast adverb.", tags:["link"]},
  {n:4, ans:["to"], gt:"prep", exp:"pretend not TO have noticed.", tags:["ger"]},
  {n:5, ans:["as"], gt:"fixphrase", exp:"might AS well = there's no difference.", tags:["fix","modal"]},
  {n:6, ans:["in"], gt:"prep", exp:"get involved IN.", tags:["prep"]},
  {n:7, ans:["so"], gt:"fixphrase", exp:"even SO = despite that.", tags:["fix","link"]},
  {n:8, ans:["out"], gt:"adv", exp:"try it OUT = test it.", tags:["pv"]},
 ]});

/* ---------------- Part 3 (word formation) ---------------- */
P.p3.push({ id:"pp3e", title:"The science of laughter",
 text:"(1)RESEARCH have long wondered why humans laugh. The first clue is that laughter is above all a (2)SOCIETY activity: we are thirty times more likely to laugh in company than alone, and the sound itself is highly (3)INFECT — hearing a laugh makes us want to join in. (4)SCIENCE studies have even shown that rats produce laughing squeaks when tickled, a (5)DISCOVER that surprised almost everyone. The benefits are real: laughter lowers stress and strengthens social (6)CONNECT. It also shapes how others see us, since people who laugh easily are judged more (7)TRUST. All in all, a good giggle remains one of life’s most (8)EFFECT medicines.",
 gaps:[
  {n:1, stem:"RESEARCH", ans:["researchers"], exp:"Person noun, plural: researcherS.", tags:["wfnoun"]},
  {n:2, stem:"SOCIETY", ans:["social"], exp:"society → social.", tags:["wfadj"]},
  {n:3, stem:"INFECT", ans:["infectious"], exp:"infect → infectious.", tags:["wfadj","spell"]},
  {n:4, stem:"SCIENCE", ans:["scientific"], exp:"science → scientific.", tags:["wfadj"]},
  {n:5, stem:"DISCOVER", ans:["discovery"], exp:"discover → discovery.", tags:["wfnoun"]},
  {n:6, stem:"CONNECT", ans:["connections"], exp:"Plural needed: connectionS.", tags:["wfnoun"]},
  {n:7, stem:"TRUST", ans:["trustworthy"], exp:"trust → trustworthy.", tags:["wfadj"]},
  {n:8, stem:"EFFECT", ans:["effective"], exp:"effect → effective.", tags:["wfadj"]},
 ]});
P.p3.push({ id:"pp3f", title:"Restoring the old cinema",
 text:"After decades of (1)NEGLECT, the town’s art-deco cinema has finally reopened. The building’s (2)ORIGIN features — mirrored walls, velvet seats, a painted ceiling — were hidden under layers of grey paint until a group of volunteers set to work. They scraped and polished with extraordinary (3)DEDICATE, often late into the night. (4)GRADUAL, the hall recovered its former glory. The reopening attracted wide press (5)COVER, and locals queued round the block to admire the (6)ASTONISH transformation. Ticket sales since then have exceeded all (7)EXPECT — proof that heritage and (8)ENTERTAIN can happily share a roof.",
 gaps:[
  {n:1, stem:"NEGLECT", ans:["neglect"], exp:"No-change trap: 'decades of neglect' — the stem already fits as a noun.", tags:["wfnoun"]},
  {n:2, stem:"ORIGIN", ans:["original"], exp:"origin → original.", tags:["wfadj"]},
  {n:3, stem:"DEDICATE", ans:["dedication"], exp:"dedicate → dedication.", tags:["wfnoun"]},
  {n:4, stem:"GRADUAL", ans:["gradually"], exp:"Sentence adverb: graduALLY (double L).", tags:["wfadv","spell"]},
  {n:5, stem:"COVER", ans:["coverage"], exp:"press COVERAGE (-age).", tags:["wfnoun"]},
  {n:6, stem:"ASTONISH", ans:["astonishing"], exp:"-ING: the transformation causes the feeling.", tags:["wfadj"]},
  {n:7, stem:"EXPECT", ans:["expectations"], exp:"exceed all expectationS — plural.", tags:["wfnoun"]},
  {n:8, stem:"ENTERTAIN", ans:["entertainment"], exp:"entertain → entertainment.", tags:["wfnoun"]},
 ]});
P.p3.push({ id:"pp3g", title:"The language of bees",
 text:"Honeybees possess one of the most (1)REMARK communication systems in nature. A (2)RETURN scout performs a figure-of-eight dance on the honeycomb to describe food she has found: the angle of the dance gives the (3)DIRECT of the flowers relative to the sun, while its (4)LONG indicates the distance — a code of almost (5)BELIEVE precision. Bees also make collective (6)DECIDE about new nest sites. Rival scouts advertise competing locations, dancing more (7)ENERGY for better sites, until the swarm settles on a winner. It is, biologists like to joke, a democracy rather more (8)IMPRESS than many human ones.",
 gaps:[
  {n:1, stem:"REMARK", ans:["remarkable"], exp:"remark → remarkable.", tags:["wfadj"]},
  {n:2, stem:"RETURN", ans:["returning"], exp:"a returning scout — -ING adjective.", tags:["wfadj"]},
  {n:3, stem:"DIRECT", ans:["direction"], exp:"direct → direction.", tags:["wfnoun"]},
  {n:4, stem:"LONG", ans:["length"], exp:"long → length (vowel change).", tags:["wfnoun","spell"]},
  {n:5, stem:"BELIEVE", ans:["unbelievable"], exp:"'almost' + amazement → UNbelievable.", tags:["wfadj","wfneg"]},
  {n:6, stem:"DECIDE", ans:["decisions"], exp:"Plural: decisionS.", tags:["wfnoun","spell"]},
  {n:7, stem:"ENERGY", ans:["energetically"], exp:"energy → energetic → energetically: double suffix.", tags:["wfadv"]},
  {n:8, stem:"IMPRESS", ans:["impressive"], exp:"impress → impressive.", tags:["wfadj"]},
 ]});
})();
