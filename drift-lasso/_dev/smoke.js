/* Headless runtime smoke test. Mocks just enough of the DOM / Canvas2D /
   WebAudio surface to actually EXECUTE index.html's script: boot it, force a
   run, simulate holding/releasing across ~4s of frames (exercising capture,
   particles, popups, FX, audio), then click every UI button (shop, daily,
   revive, double-coins, play-again, mute) and drain any ad animations.
   Goal: prove the whole thing initializes and runs without throwing.        */

const fs=require('fs');

/* ---- a tiny "universal" mock node: known members are real-ish, the rest are
        harmless no-op functions so unexpected calls never crash ---- */
const listeners=new Map(); // el -> {type -> [fn]}
function on(el,type,fn){ let m=listeners.get(el); if(!m){m={};listeners.set(el,m);} (m[type]||(m[type]=[])).push(fn); }
function fire(el,type,ev){ const m=listeners.get(el); if(m&&m[type]) m[type].slice().forEach(fn=>fn(ev||{})); }

function gradient(){ return { addColorStop(){} }; }
function makeCtx(){
  const noop=()=>{};
  const ctx={
    canvas:null,
    setTransform:noop, transform:noop, scale:noop, translate:noop, rotate:noop, save:noop, restore:noop,
    fillRect:noop, clearRect:noop, strokeRect:noop,
    beginPath:noop, closePath:noop, moveTo:noop, lineTo:noop, arc:noop, rect:noop, quadraticCurveTo:noop, bezierCurveTo:noop,
    fill:noop, stroke:noop, clip:noop,
    fillText:noop, strokeText:noop, measureText:()=>({width:10}),
    drawImage:noop, putImageData:noop, getImageData:()=>({data:new Uint8ClampedArray(4)}),
    createRadialGradient:gradient, createLinearGradient:gradient, createPattern:()=>({}),
    // settable style props (just stored)
    fillStyle:'#000', strokeStyle:'#000', lineWidth:1, lineCap:'butt', lineJoin:'miter',
    globalAlpha:1, globalCompositeOperation:'source-over', font:'10px', textAlign:'left', textBaseline:'top',
    shadowBlur:0, shadowColor:'#000', filter:'none',
  };
  return ctx;
}

let elId=0;
function makeEl(tag){
  const id=++elId;
  const children=[];
  const el={
    _tag:tag, _id:id, nodeType:1,
    style:new Proxy({},{get:()=>'' ,set:()=>true}),
    dataset:{},
    classList:{ _s:new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(c,f){ if(f===undefined){ this._s.has(c)?this._s.delete(c):this._s.add(c);} else { f?this._s.add(c):this._s.delete(c);} return this._s.has(c);}, contains(c){return this._s.has(c);} },
    children, width:300, height:150,
    textContent:'', innerHTML:'', value:'',
    appendChild(c){ children.push(c); return c; },
    removeChild(c){ const i=children.indexOf(c); if(i>=0)children.splice(i,1); return c; },
    setAttribute(k,v){ this['__'+k]=v; }, removeAttribute(k){ delete this['__'+k]; }, getAttribute(k){ return this['__'+k]; },
    addEventListener(t,fn){ on(this,t,fn); }, removeEventListener(){},
    closest(){ return null; }, querySelector(){ return null; }, querySelectorAll(){ return []; },
    getBoundingClientRect(){ return {left:0,top:0,right:this.width,bottom:this.height,width:this.width,height:this.height}; },
    focus(){}, blur(){}, click(){ fire(this,'click',{target:this,preventDefault(){}}); },
  };
  if(tag==='canvas'){ const c=makeCtx(); c.canvas=el; el.getContext=()=>c; }
  return el;
}

/* ---- document / window / globals ---- */
const byId=new Map();
const ELEMENT_IDS=['game','flash','btn-shop','btn-mute','over','over-eyebrow','over-headline','over-score','over-best','over-newbest','over-near','over-coins','btn-revive','btn-double','btn-again','next-name','next-coins','next-bar','btn-openshop','shop','shop-coins','shop-grid','btn-shop-close','daily','daily-streak','daily-sub','daily-amount','btn-daily-claim','ad','ad-title','ad-sub','ad-bar','ad-skip','toast'];
ELEMENT_IDS.forEach(id=>{ const el=makeEl(id==='game'?'canvas':'div'); el.id=id; byId.set(id,el); });

const documentMock={
  hidden:false, activeElement:null, documentElement:makeEl('html'), body:makeEl('body'),
  getElementById:(id)=>byId.get(id)|| (byId.set(id,makeEl('div')), byId.get(id)),
  createElement:(t)=>makeEl(t),
  addEventListener:(t,fn)=>on(documentMock,t,fn), removeEventListener(){},
};

let rafQueue=[]; let perfNow=0;
const windowMock={
  innerWidth:412, innerHeight:870, devicePixelRatio:2,
  addEventListener:(t,fn)=>on(windowMock,t,fn), removeEventListener(){},
  requestAnimationFrame:(cb)=>{ rafQueue.push(cb); return rafQueue.length; },
  AudioContext:function(){ return makeAudioCtx(); },
};

/* WebAudio mock (universal no-op nodes) */
function makeParam(){ return { value:0, setValueAtTime(){}, setTargetAtTime(){}, exponentialRampToValueAtTime(){}, linearRampToValueAtTime(){}, cancelScheduledValues(){} }; }
function makeNode(extra){ return Object.assign({ connect(){return this;}, disconnect(){}, start(){}, stop(){}, gain:makeParam(), frequency:makeParam(), detune:makeParam(), type:'sine', buffer:null }, extra||{}); }
function makeAudioCtx(){
  return {
    state:'running', currentTime:0, sampleRate:44100, destination:makeNode(),
    resume(){ this.state='running'; return Promise.resolve(); }, suspend(){},
    createGain:()=>makeNode(), createOscillator:()=>makeNode(), createBiquadFilter:()=>makeNode(),
    createBufferSource:()=>makeNode(), createBuffer:(ch,len)=>({ getChannelData:()=>new Float32Array(len) }),
  };
}

/* localStorage mock */
const store=new Map();
const localStorageMock={ getItem:(k)=>store.has(k)?store.get(k):null, setItem:(k,v)=>store.set(k,String(v)), removeItem:(k)=>store.delete(k), clear:()=>store.clear() };

/* install globals */
global.window=windowMock; global.document=documentMock;
global.localStorage=localStorageMock;
global.performance={ now:()=>perfNow };
global.requestAnimationFrame=windowMock.requestAnimationFrame;
global.cancelAnimationFrame=(id)=>{};
global.navigator={ userAgent:'node' };
// expose window props as bare globals where the code uses them
global.AudioContext=windowMock.AudioContext;

/* ---- load + execute the game ---- */
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const code=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const vm=require('vm');
const sandbox={ window:windowMock, document:documentMock, localStorage:localStorageMock,
  performance:global.performance, requestAnimationFrame:global.requestAnimationFrame,
  cancelAnimationFrame:global.cancelAnimationFrame, navigator:global.navigator,
  AudioContext:windowMock.AudioContext, console, Math, Date, JSON, parseInt, parseFloat,
  isNaN, setTimeout:(fn)=>{ fn(); return 0; }, clearTimeout:()=>{}, Array, Object, String, Number };
sandbox.globalThis=sandbox; sandbox.module=undefined;
vm.createContext(sandbox);

let failures=0;
function step(label,fn){ try{ fn(); console.log('  ✓',label); }catch(e){ failures++; console.log('  ✗ THREW in',label+':',e&&e.stack?e.stack.split('\n').slice(0,3).join(' | '):e); } }

console.log('\n[boot]');
step('execute script + boot()', ()=>{ vm.runInContext(code,sandbox,{filename:'game.js'}); });
const DL=sandbox.window.DriftLasso;
step('DriftLasso exposed', ()=>{ if(!DL||!DL.Game) throw new Error('window.DriftLasso missing'); });

console.log('\n[input + gameplay frames]');
step('first interaction (pointerdown) unlocks audio', ()=>{ fire(windowMock,'pointerdown',{target:byId.get('game'),cancelable:true,preventDefault(){}}); });
step('force a run (fullReset -> PLAYING)', ()=>{ DL.Game.fullReset(); });
function pump(n){ for(let i=0;i<n && rafQueue.length;i++){ const cb=rafQueue.shift(); perfNow+=16.7; cb(perfNow); } }
step('pump 60 frames while HOLDING (tighten -> first capture)', ()=>{ pump(60); });
step('release + pump 120 frames (widen, spawns, combos)', ()=>{ fire(windowMock,'pointerup',{}); pump(120); });
step('hold again + pump 90 frames', ()=>{ fire(windowMock,'pointerdown',{target:byId.get('game'),cancelable:true,preventDefault(){}}); pump(90); });
step('tab-away then back (visibilitychange)', ()=>{ documentMock.hidden=true; fire(documentMock,'visibilitychange',{}); pump(3); documentMock.hidden=false; fire(documentMock,'visibilitychange',{}); pump(10); });
step('resize event', ()=>{ windowMock.innerWidth=375; windowMock.innerHeight=667; fire(windowMock,'resize',{}); pump(3); });
step('keyboard input (space)', ()=>{ fire(windowMock,'keydown',{code:'Space',preventDefault(){}}); pump(5); fire(windowMock,'keyup',{code:'Space'}); pump(5); });

console.log('\n[state report]');
step('game advanced (score is a number, state valid)', ()=>{ const s=DL.Game.score; if(typeof s!=='number'||isNaN(s)) throw new Error('score not a number: '+s); console.log('      score='+Math.round(s)+' combo='+DL.Game.combo+' coins='+DL.Storage.data.coins+' state='+DL.Game.state); });

console.log('\n[UI + ad buttons]');
function clickAndDrain(id){ fire(byId.get(id),'click',{target:byId.get(id),preventDefault(){}}); pump(40); }
step('open shop (builds skin previews)', ()=>{ clickAndDrain('btn-shop'); });
step('shop back', ()=>{ clickAndDrain('btn-shop-close'); });
step('mute toggle', ()=>{ clickAndDrain('btn-mute'); clickAndDrain('btn-mute'); });
step('daily claim', ()=>{ if(byId.get('btn-daily-claim')) clickAndDrain('btn-daily-claim'); });
step('double-coins (rewarded ad path)', ()=>{ clickAndDrain('btn-double'); });
step('open shop + tap a locked skin (rewarded/unlock path)', ()=>{ clickAndDrain('btn-shop'); const grid=byId.get('shop-grid'); if(grid.children.length){ fire(grid.children[grid.children.length-1],'click',{target:grid.children[grid.children.length-1],preventDefault(){}}); pump(40);} clickAndDrain('btn-shop-close'); });
step('revive (rewarded ad path)', ()=>{ clickAndDrain('btn-revive'); });
step('play again (interstitial + full reset)', ()=>{ for(let i=0;i<4;i++) clickAndDrain('btn-again'); });
step('pump 120 more frames after all interactions', ()=>{ pump(120); });

console.log('\n[stress — long random run]');
step('5000 frames of random input + periodic restarts (no crash, score stays finite)', ()=>{
  for(let i=0;i<5000;i++){
    if(i%7===0) fire(windowMock, Math.random()<0.5?'pointerdown':'pointerup', {target:byId.get('game'),cancelable:true,preventDefault(){}});
    if(i%900===0) DL.Game.fullReset();
    const cb=rafQueue.shift(); perfNow+=16.7; if(cb) cb(perfNow);
    const s=DL.Game.score; if(typeof s!=='number'||!isFinite(s)) throw new Error('score went non-finite at frame '+i);
  }
  console.log('      survived 5000 frames; final state='+DL.Game.state+' coins='+DL.Storage.data.coins);
});

console.log('\n[persistence]');
step('save round-trips through localStorage', ()=>{ DL.Storage.set('coins', 12345); DL.Storage.load(); if(DL.Storage.data.coins!==12345) throw new Error('coins did not persist'); });

console.log('\n========================================');
console.log(failures===0?'  SMOKE TEST PASSED — no runtime errors':('  '+failures+' STEP(S) THREW'));
console.log('========================================\n');
process.exit(failures>0?1:0);
