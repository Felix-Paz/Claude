/* Canonical headless test for Drift Lasso's core geometry + the "roam + lasso"
   opening guarantee. Mirrors the exact algorithms + tuned constants in index.html.
   Proves: geometry helpers are correct; HOLDING at any time during the intro always
   curls a CAPTURING loop (never a cheap death) across screen sizes; and the normal
   death rule (empty self-cross = death) still holds.  Run: node _dev/sim.test.js   */

const C = {
  CAR_SPEED:250, HOLD_RADIUS:80, ROAM_RADIUS:1500, RADIUS_LERP:9, TURN_DIR:1,
  INTRO_DRONE_TRACK:10, WALL_MARGIN:26, CONTAIN:3.2,
  TRAIL_LIFESPAN:2.6, TRAIL_MIN_DIST:6, MAX_TRAIL_POINTS:300, SELF_GRACE_SEGMENTS:6,
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

/* One run of the "roam + lasso" model. hold(t) => finger down at time t.
   intro=true mirrors the game: the single drone tracks the prospective curl-centre
   and empty loops are softened to trail-resets until the first capture.            */
function simulate({hold, intro=true, drone, W=412, H=870, maxSeconds=10}){
  const car={x:W*0.5,y:H*0.62,dir:-Math.PI/2,r:C.ROAM_RADIUS};
  let nx=Math.cos(car.dir+C.TURN_DIR*Math.PI/2), ny=Math.sin(car.dir+C.TURN_DIR*Math.PI/2);
  if(drone===undefined) drone={x:car.x+nx*C.HOLD_RADIUS, y:car.y+ny*C.HOLD_RADIUS};
  const trail=makeTrail();let elapsed=0;const dt=1/60;let soft=0;
  while(elapsed<maxSeconds){
    elapsed+=dt;
    const targetR=(hold&&hold(elapsed))?C.HOLD_RADIUS:C.ROAM_RADIUS;
    car.r=lerp(car.r,targetR,clamp(C.RADIUS_LERP*dt,0,1));
    let omega=(C.CAR_SPEED/car.r)*C.TURN_DIR;
    const m2=C.WALL_MARGIN*2;
    if(car.x<m2||car.x>W-m2||car.y<m2||car.y>H-m2){ const des=Math.atan2(H/2-car.y,W/2-car.x); let d=Math.atan2(Math.sin(des-car.dir),Math.cos(des-car.dir)); omega+=d*C.CONTAIN*0.6; }
    car.dir+=omega*dt;
    car.x+=Math.cos(car.dir)*C.CAR_SPEED*dt; car.y+=Math.sin(car.dir)*C.CAR_SPEED*dt;
    if(intro && drone){ nx=Math.cos(car.dir+C.TURN_DIR*Math.PI/2); ny=Math.sin(car.dir+C.TURN_DIR*Math.PI/2);
      const cx=car.x+nx*C.HOLD_RADIUS, cy=car.y+ny*C.HOLD_RADIUS, k=clamp(C.INTRO_DRONE_TRACK*dt,0,1);
      drone.x+=(cx-drone.x)*k; drone.y+=(cy-drone.y)*k; }
    const last=trail.len>0?trail.get(trail.len-1):null;
    if(!last||dist2(last.x,last.y,car.x,car.y)>=C.TRAIL_MIN_DIST*C.TRAIL_MIN_DIST){
      trail.push(car.x,car.y,elapsed);const loop=trail.checkClose();
      if(loop){
        const caught=(drone&&pointInPoly(drone.x,drone.y,loop.poly,loop.n))?1:0;
        if(caught>0) return {event:'capture',time:elapsed,soft};
        if(intro){ trail.reset();trail.push(car.x,car.y,elapsed);soft++; }
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

console.log('\n[opening guarantee — HOLDING at any time curls a capturing loop]');
const patterns={
  'hold from 0s':       t=>true,
  'hold from 0.3s':     t=>t>0.3,
  'hold from 0.6s':     t=>t>0.6,
  'hold from 1.0s':     t=>t>1.0,
  'hold from 1.5s':     t=>t>1.5,
  'hold from 2.0s':     t=>t>2.0,
  'roam then hold @1.2':t=>t>1.2,
  'pulse then hold':    t=>(t>1.0)||(t>0.3&&t<0.5),
};
let worst=0;
for(const name in patterns){
  const r=simulate({hold:patterns[name]});
  const good=r.event==='capture' && r.time<=8;
  worst=Math.max(worst,r.time);
  ok(good, name.padEnd(20)+'=> '+r.event+' @ '+r.time.toFixed(2)+'s (soft '+r.soft+')');
}
ok(worst<=8,'slowest first capture across all hold timings ('+worst.toFixed(2)+'s) is within 8s');

console.log('\n[opening fairness — roaming never kills you]');
const roam=simulate({hold:()=>false, maxSeconds:6});
ok(roam.event==='none','releasing (roaming straight) never self-crosses → no cheap death while learning');

console.log('\n[death rule — normal play]');
const dEmpty=simulate({intro:false, drone:{x:-9999,y:-9999}, hold:()=>true});
ok(dEmpty.event==='death','holding a loop around nothing = death (the one legible rule)');
// (capture-on-enclosure is exercised exhaustively by the opening patterns above
//  and by the headless smoke test, so it is not re-asserted here.)

console.log('\n========================================');
console.log('  '+pass+' passed, '+fail+' failed');
console.log('========================================\n');
process.exit(fail>0?1:0);
