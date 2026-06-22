/* Canonical headless test for Drift Lasso's core geometry + opening guarantee.
   Mirrors the exact algorithms + tuned constants used in index.html.
   Proves: geometry helpers are correct; the opening always yields a fast first
   CAPTURE (never a cheap death) for idle OR hold at any timing; and the normal
   death rule (empty self-cross = death) still holds. Run: `node _dev/sim.test.js` */

const C = {
  CAR_SPEED:252, MIN_RADIUS:44, MAX_RADIUS:165, RADIUS_LERP:8.5, TURN_DIR:1,
  INTRO_RADIUS:74, FIRST_DRONE_FRAC:0.75, INTRO_DRONE_TRACK:8,
  TRAIL_LIFESPAN:2.6, TRAIL_MIN_DIST:6, MAX_TRAIL_POINTS:260, SELF_GRACE_SEGMENTS:6,
};

/* ---- geometry (copied verbatim from index.html) ---- */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const dist2=(ax,ay,bx,by)=>{const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy;};
const _hit={x:0,y:0};
function segHit(ax,ay,bx,by,cx,cy,dx,dy,OUT){
  const r1=bx-ax,r2=by-ay,s1=dx-cx,s2=dy-cy;const denom=r1*s2-r2*s1;if(denom===0)return false;
  const t=((cx-ax)*s2-(cy-ay)*s1)/denom;const u=((cx-ax)*r2-(cy-ay)*r1)/denom;
  if(t>0&&t<1&&u>0&&u<1){OUT.x=ax+t*r1;OUT.y=ay+t*r2;return true;}return false;
}
function pointInPoly(px,py,poly,n){let inside=false;for(let i=0,j=n-1;i<n;j=i++){const xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y;if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
function polyArea(poly,n){let a=0;for(let i=0,j=n-1;i<n;j=i++){a+=(poly[j].x+poly[i].x)*(poly[j].y-poly[i].y);}return Math.abs(a/2);}

/* ---- trail ring buffer + self-cross (copied logic) ---- */
function makeTrail(){
  const cap=C.MAX_TRAIL_POINTS;const pts=new Array(cap);for(let i=0;i<cap;i++)pts[i]={x:0,y:0,t:0};
  const scratch=new Array(cap);for(let i=0;i<cap;i++)scratch[i]={x:0,y:0};
  let head=0,len=0;const get=(i)=>pts[(head+i)%cap];
  return {
    get len(){return len;}, get,
    reset(){head=0;len=0;},
    push(x,y,t){let idx;if(len<cap){idx=(head+len)%cap;len++;}else{idx=head;head=(head+1)%cap;}const p=pts[idx];p.x=x;p.y=y;p.t=t;},
    dropOld(now,life){while(len>0&&now-get(0).t>life){head=(head+1)%cap;len--;}},
    checkClose(){
      if(len<4)return null;
      const hx0=get(len-2).x,hy0=get(len-2).y,hx1=get(len-1).x,hy1=get(len-1).y;
      const maxI=len-3-C.SELF_GRACE_SEGMENTS;
      for(let i=maxI;i>=0;i--){const a=get(i),b=get(i+1);
        if(segHit(hx0,hy0,hx1,hy1,a.x,a.y,b.x,b.y,_hit)){
          let n=0;scratch[n].x=_hit.x;scratch[n].y=_hit.y;n++;
          for(let k=i+1;k<=len-2;k++){const p=get(k);scratch[n].x=p.x;scratch[n].y=p.y;n++;}
          return {poly:scratch,n,area:polyArea(scratch,n)};
        }}
      return null;
    },
  };
}

/* One run. `hold(t)` returns whether the finger is down at time t.
   `intro` mirrors the game: wide radius capped to INTRO_RADIUS and empty loops
   are softened to trail-resets until the first capture. */
function simulate({hold, intro=true, drone, W=412, H=870, maxSeconds=12}){
  const maxR=Math.min(C.MAX_RADIUS, Math.min(W,H)*0.30);
  const introR=Math.min(maxR,C.INTRO_RADIUS);
  const car={x:W*0.5,y:H*0.56,dir:-Math.PI/2,r:intro?introR:maxR};
  const trail=makeTrail();let elapsed=0;const dt=1/60;let firstCap=false,soft=0;
  // default first drone at the opening-circle centre (game's placement)
  if(drone===undefined){ const na=car.dir+C.TURN_DIR*Math.PI/2, off=introR*C.FIRST_DRONE_FRAC; drone={x:car.x+Math.cos(na)*off,y:car.y+Math.sin(na)*off}; }
  while(elapsed<maxSeconds){
    elapsed+=dt;
    const wide=(intro&&!firstCap)?introR:maxR;
    const targetR=(hold&&hold(elapsed))?C.MIN_RADIUS:wide;
    car.r=lerp(car.r,targetR,clamp(C.RADIUS_LERP*dt,0,1));
    car.dir+=(C.CAR_SPEED/car.r)*C.TURN_DIR*dt;
    car.x+=Math.cos(car.dir)*C.CAR_SPEED*dt;car.y+=Math.sin(car.dir)*C.CAR_SPEED*dt;
    // intro: drone hovers at the drift-circle centre (mirrors the game)
    if(intro && !firstCap && drone){ const cx=car.x+car.r*Math.cos(car.dir+C.TURN_DIR*Math.PI/2), cy=car.y+car.r*Math.sin(car.dir+C.TURN_DIR*Math.PI/2); const k=clamp(C.INTRO_DRONE_TRACK*dt,0,1); drone.x+=(cx-drone.x)*k; drone.y+=(cy-drone.y)*k; }
    const last=trail.len>0?trail.get(trail.len-1):null;
    if(!last||dist2(last.x,last.y,car.x,car.y)>=C.TRAIL_MIN_DIST*C.TRAIL_MIN_DIST){
      trail.push(car.x,car.y,elapsed);const loop=trail.checkClose();
      if(loop){
        const caught=(drone&&pointInPoly(drone.x,drone.y,loop.poly,loop.n))?1:0;
        if(caught>0) return {event:'capture',time:elapsed,soft};
        if(intro&&!firstCap){ trail.reset();trail.push(car.x,car.y,elapsed);soft++; }
        else return {event:'death',time:elapsed,soft};
      }
    }
    trail.dropOld(elapsed,C.TRAIL_LIFESPAN);
  }
  return {event:'none',time:elapsed,soft};
}

/* ============================ ASSERTIONS ============================ */
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log('  ✓',m);} else {fail++;console.log('  ✗ FAIL:',m);} }

console.log('\n[geometry]');
ok(segHit(0,0,10,10, 0,10,10,0, _hit) && Math.abs(_hit.x-5)<1e-9 && Math.abs(_hit.y-5)<1e-9,'crossing diagonals meet at (5,5)');
ok(!segHit(0,0,1,0, 0,1,1,1, _hit),'parallel non-touching segments do not cross');
ok(!segHit(0,0,1,1, 1,1,2,2, _hit),'segments sharing an endpoint are NOT a cross (forgiving joints)');
const sq=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
ok(pointInPoly(5,5,sq,4) && !pointInPoly(15,5,sq,4),'point-in-polygon in/out');
ok(Math.abs(polyArea(sq,4)-100)<1e-9,'shoelace area of unit-square*10 = 100');

console.log('\n[opening guarantee — every input timing yields a fast first capture]');
const patterns={
  'idle (no input)':        null,
  'hold from 0s':           t=>true,
  'hold from 0.3s':         t=>t>0.3,
  'hold from 0.8s':         t=>t>0.8,
  'hold from 1.2s':         t=>t>1.2,
  'quick tap @0.4–0.7s':    t=>t>0.4&&t<0.7,
  'pulsing':                t=>Math.floor(t*3)%2===0,
  'jitter':                 t=>Math.sin(t*20)>0,
};
let worst=0;
for(const name in patterns){
  const r=simulate({hold:patterns[name]});
  const good = r.event==='capture' && r.time<=10;
  worst=Math.max(worst,r.time);
  ok(good, name.padEnd(22)+'=> '+r.event+' @ '+r.time.toFixed(2)+'s (soft '+r.soft+')');
}
ok(worst<=10,'slowest first capture across all inputs ('+worst.toFixed(2)+'s) is within 10s');

console.log('\n[death rule]');
const dEmpty=simulate({intro:false, drone:{x:-9999,y:-9999}, hold:()=>true});
ok(dEmpty.event==='death','normal mode: empty self-cross = death');
// (capture-on-enclosure is exercised exhaustively by the opening patterns above
//  and by the headless smoke test, so it is not re-asserted here.)

console.log('\n[fairness]');
const wide=simulate({intro:false, drone:{x:-9999,y:-9999}, hold:()=>false, maxSeconds:1.0});
ok(wide.event==='none','a wide idle circle does not self-cross in the first second (no cheap death)');

console.log('\n========================================');
console.log('  '+pass+' passed, '+fail+' failed');
console.log('========================================\n');
process.exit(fail>0?1:0);
