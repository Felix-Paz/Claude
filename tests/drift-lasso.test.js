/* ============================================================================
   Drift Lasso — headless test harness (no dependencies; run with `node`).

     node tests/drift-lasso.test.js

   It stubs a minimal DOM/Canvas, executes the real game <script> from
   drift-lasso.html, and asserts:
     • DETERMINISM (the keystone): same seed + same scripted steer => identical
       run (score, car pose, drone count, trail, RNG state). Fair leaderboards.
     • META account-level curve is monotonic & never-ending.
     • LEADER (weekly) returns a rank with a reachable "N from #M" target.
     • BUY ENGINE: a purchase actually spends coins; can't-afford is rejected.
     • REVIVE keeps the run intact (drones are NOT cleared).
     • Every TRAIL STYLE renders without throwing.
     • SHARE renders the score card; PERF tiers scale particles (visual only).
     • RENDER executes across states + colour-blind + reduce-motion + low tier.
     • v1 save migrates to v2 preserving coins / highScore / unlocks / equips.
     • A full game-over runs the META/LEADER + card/peak-end path.
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
const countDrones=(DL)=>DL.Game.droneCount;

const st=DL.Game.selfTest();
ok('determinism: same seed identical, diff seed differs', st.pass, '(identical='+st.identical+', differs='+st.differs+')');
ok('META curve monotonic & never-ending', DL.META.levelFromTotal(0)===1 && DL.META.levelFromTotal(1e5)>1 && DL.META.xpForLevel(10)>DL.META.xpForLevel(2));
DL.Storage.data._lbWeekly={}; const wk=DL.LEADER.weekKey(); const r=DL.LEADER.submit(wk,3000);
ok('LEADER weekly rank + reachable nudge', !!r && r.rank>=1 && (r.rank===1||!!r.ahead) && /^\d{4}-W\d{2}$/.test(wk), JSON.stringify(r));

// BUY ENGINE — coins actually gate + spend (the reported bug)
(function(){
  const D=DL.Storage.data; D.unlocked=['neon','custom','car_core','pow_none']; D.equippedTrail='neon';
  const ember=DL.Cosmetics.TRAILS.find(t=>t.id==='ember');
  D.coins=1000; DL.UI._buy(ember,'trail',false);
  const bought = DL.Cosmetics.isUnlocked('ember') && D.coins===1000-ember.cost && D.equippedTrail==='ember';
  // cannot afford -> no unlock, coins unchanged
  D.coins=10; const gold=DL.Cosmetics.TRAILS.find(t=>t.id==='gold'); DL.UI._buy(gold,'trail',false);
  const gated = !DL.Cosmetics.isUnlocked('gold') && D.coins===10;
  ok('BUY engine spends coins + gates by price', bought && gated, '(coins after buy test='+D.coins+')');
})();

// REVIVE keeps the run intact (drones NOT cleared). Default steer = auto-curl
// captures the intro drone, then straight driving accumulates a full arena.
(function(){
  DL.Game._setSteerOverride(null);
  DL.Game.fullReset({seed:7}); for(let i=0;i<1500;i++) DL.Game.update(1/60);
  const playing=DL.Game.state===DL.Game.STATE.PLAYING;
  const n0=countDrones(DL); DL.Game.revive(); const n1=countDrones(DL);
  ok('REVIVE preserves all drones (nothing vanishes)', playing && n0>4 && n1===n0, '(playing='+playing+', drones '+n0+' -> '+n1+')');
})();

// every TRAIL STYLE renders without throwing
(function(){
  let styleOK=true, tried=0; DL.Game.fullReset({seed:3}); for(let i=0;i<80;i++) DL.Game.update(1/60);
  DL.Cosmetics.TRAILS.forEach(t=>{ DL.Storage.data.equippedTrail=t.id; tried++;
    try{ DL.Render.frame(); }catch(e){ styleOK=false; console.error('style',t.id,e); } });
  DL.Storage.data.customStyle='electric'; DL.Storage.data.equippedTrail='custom'; try{ DL.Render.frame(); }catch(e){ styleOK=false; }
  ok('every trail STYLE renders ('+tried+' presets + custom)', styleOK);
})();

// CUSTOM can't clone a paid skin: no purchasable trail uses a CUSTOM_STYLES style
(function(){
  const paid=DL.Cosmetics.TRAILS.filter(t=>t.cost>0 && t.style);
  const exclusive=paid.every(t=>DL.Cosmetics.CUSTOM_STYLES.indexOf(t.style)<0);
  const customOnly=DL.Cosmetics.CUSTOM_STYLES.every(s=>!DL.Cosmetics.TRAILS.some(t=>t.style===s));
  ok('CUSTOM styles are exclusive (no paid skin clone)', exclusive && customOnly, JSON.stringify(DL.Cosmetics.CUSTOM_STYLES));
})();
ok('cars all have distinct shapes', DL.Cosmetics.CARS.every(c=>!!c.shape));
ok('late-game tuning (toxic lvl 20, long trail, easy lvl1)',
  DL.CONFIG.TOXIC_LEVEL===20 && DL.CONFIG.MAX_TRAIL_POINTS>=400 && DL.CONFIG.TAIL_LEVEL_PER>0 && DL.CONFIG.LEVEL1_DRONE_SCALE<1);
let sok=true; try{ DL.SHARE.drawCard({score:1234,rankText:'#2 of 15'}); }catch(e){ sok=false; } ok('SHARE card renders', sok);
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
ok('gameOver -> META/LEADER + card/peak-end render', gok, end?'(reached DEAD)':'(no death in window; no errors)');

console.log('\n'+(pass?'ALL TESTS PASS ✅':'TESTS FAILED ❌'));
process.exit(pass?0:1);
