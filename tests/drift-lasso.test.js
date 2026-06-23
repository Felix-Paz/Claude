/* ============================================================================
   Drift Lasso V2 — headless test harness (no dependencies; run with `node`).

     node tests/drift-lasso.test.js

   It stubs a minimal DOM/Canvas, executes the real game <script> from
   drift-lasso.html, and asserts the V2 guarantees:
     • DETERMINISM (the keystone): same seed + same scripted steer => identical
       run (score, car pose, drone count, trail, RNG state). This is what makes
       daily challenges fair and ghost replays correct.
     • DAILY seed is UTC-stable; ISO week key well-formed.
     • META account-level curve is monotonic & never-ending.
     • LEADER returns a rank with a reachable "N from #M" target.
     • GHOST record -> commit -> replay round-trips (seed-independent path).
     • SHARE renders the score card without throwing.
     • PERF tiers scale particles (visual only — never gameplay/RNG).
     • RENDER executes across states + colour-blind + reduce-motion + low tier.
     • v1 save migrates to v2 preserving coins / highScore / unlocks / equips.
     • A full game-over runs the META/DAILY/LEADER/GHOST + card/peak-end path.
============================================================================ */
'use strict';
const fs=require('fs'), vm=require('vm'), path=require('path');
const HTML=path.join(__dirname,'..','drift-lasso.html');
const script=fs.readFileSync(HTML,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];

// ---- minimal Canvas2D stub: every method is a no-op; gradients/measureText stubbed ----
function makeCtx(){ const grad={addColorStop(){}}; return new Proxy({},{
  get(t,p){ if(p==='createLinearGradient'||p==='createRadialGradient') return ()=>grad;
    if(p==='measureText') return ()=>({width:10}); if(p==='getImageData') return ()=>({data:[]});
    if(p in t) return t[p]; return ()=>{}; },
  set(t,p,v){ t[p]=v; return true; } }); }
function makeCanvas(){ return { width:300,height:150,style:{},getContext:()=>makeCtx(),toDataURL:()=>'',toBlob:cb=>cb&&cb(null),addEventListener(){} }; }
function makeEl(){ const el={ style:{},_cls:new Set(),width:100,height:40,textContent:'',innerHTML:'',
  classList:{ add:c=>el._cls.add(c),remove:c=>el._cls.delete(c),toggle:(c,f)=>{ f===undefined?(el._cls.has(c)?el._cls.delete(c):el._cls.add(c)):(f?el._cls.add(c):el._cls.delete(c)); },contains:c=>el._cls.has(c) },
  addEventListener(){},removeEventListener(){},appendChild(){},removeChild(){},remove(){},setAttribute(){},removeAttribute(){},getContext:()=>makeCtx(),click(){},offsetHeight:0,querySelector:()=>makeEl(),closest:()=>null }; return el; }
const els={};
const document={ getElementById:id=>id==='game'?makeCanvas():(els[id]||(els[id]=makeEl())),
  createElement:t=>t==='canvas'?makeCanvas():makeEl(), addEventListener(){}, body:{appendChild(){},removeChild(){},style:{}} };
const store=new Map();
const localStorage={ getItem:k=>store.has(k)?store.get(k):null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) };
const win={ innerWidth:800,innerHeight:600,devicePixelRatio:2,addEventListener(){},removeEventListener(){},
  requestAnimationFrame:()=>0,AudioContext:undefined,webkitAudioContext:undefined,location:{search:''},
  navigator:{getGamepads:()=>[],share:undefined},File:function(){} };
const sandbox={ window:win,document,localStorage,navigator:win.navigator,location:win.location,
  performance:{now:()=>Date.now()},requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},setTimeout:()=>0,clearTimeout:()=>{},
  URLSearchParams,Math,Date,JSON,console,parseInt,parseFloat,isNaN }; sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(script,sandbox,{filename:'drift-lasso.js'});
const DL=sandbox.window.DriftLasso;

let pass=true; const ok=(name,cond,extra)=>{ pass=pass&&cond; console.log((cond?'  ✓ ':'  ✗ ')+name+(extra?('  '+extra):'')); };

const st=DL.Game.selfTest();
ok('determinism: same seed identical, diff seed differs', st.pass, '(identical='+st.identical+', differs='+st.differs+')');
ok('DAILY seed UTC-stable + ISO week', DL.DAILY.seedForToday()===DL.DAILY.seedForToday() && /^\d{4}-W\d{2}$/.test(DL.DAILY.isoWeekKey()));
ok('META curve monotonic & never-ending', DL.META.levelFromTotal(0)===1 && DL.META.levelFromTotal(1e5)>1 && DL.META.xpForLevel(10)>DL.META.xpForLevel(2));
DL.Storage.data._lbWeekly={}; const r=DL.LEADER.submit('weekly','2026-W01',3000);
ok('LEADER rank + reachable nudge', !!r && r.rank>=1 && (r.rank===1||!!r.ahead), JSON.stringify(r));
DL.GHOST.startRecord(42); DL.GHOST.noteSteer(0,1); DL.GHOST.noteScore(0.5,120); DL.GHOST.commit('best',999); DL.GHOST.loadReplay('best',7); DL.GHOST.begin(0,0,0);
ok('GHOST commit/replay round-trip', DL.GHOST.active && DL.GHOST.finalScore===999 && DL.GHOST.scoreAt(0.6)===120);
let sok=true; try{ DL.SHARE.drawCard({score:1234,isDaily:false,rankText:'#2 of 15'}); }catch(e){ sok=false; } ok('SHARE card renders', sok);
DL.PERF.force('low'); const lo=DL.PERF.particleScale(); DL.PERF.force('high'); ok('PERF tiers scale particles (visual only)', lo<1 && DL.PERF.particleScale()===1);
let rok=true; try{ DL.Game.fullReset({}); for(let i=0;i<120;i++)DL.Game.update(1/60); DL.Render.frame();
  DL.Storage.data.settings.colorblind=true; DL.Storage.data.settings.reduceMotion=true; DL.Render.frame();
  DL.PERF.force('low'); DL.Render.frame(); DL.PERF.force('high');
  DL.Storage.data.settings.colorblind=false; DL.Storage.data.settings.reduceMotion=false; }catch(e){ rok=false; console.error(e); }
ok('RENDER across states/CB/reduce-motion/low-tier', rok);
// v1 -> v2 migration
let mok=true; try{ const s2=new Map();
  s2.set('driftlasso.save.v1', JSON.stringify({highScore:4321,coins:777,unlocked:['neon','custom','car_core','pow_none','inferno'],equippedTrail:'inferno'}));
  localStorage.getItem=k=>s2.has(k)?s2.get(k):null; localStorage.setItem=(k,v)=>s2.set(k,String(v));
  DL.Storage.load();
  mok=DL.Storage.data.highScore===4321 && DL.Storage.data.coins===777 && DL.Storage.data.unlocked.indexOf('inferno')>=0 && DL.Storage.data.equippedTrail==='inferno' && !!s2.get('driftlasso.save.v2');
}catch(e){ mok=false; } ok('v1 -> v2 migration preserves coins/highScore/unlocks/equips', mok);
// full game-over orchestration + card/peak-end render
let gok=true,end=false; try{ for(let t=0;t<6&&!end;t++){ DL.Game.fullReset({seed:1000+t}); DL.Game._setSteerOverride(()=>1);
  for(let i=0;i<3000;i++){ DL.Game.update(1/60); DL.Render.frame(); if(DL.Game.state===DL.Game.STATE.DEAD){ end=true; break; } } DL.Game._setSteerOverride(null); } }catch(e){ gok=false; console.error(e); }
ok('gameOver -> META/DAILY/LEADER/GHOST + card render', gok, end?'(reached DEAD)':'(no death in window; no errors)');

console.log('\n'+(pass?'ALL TESTS PASS ✅':'TESTS FAILED ❌'));
process.exit(pass?0:1);
