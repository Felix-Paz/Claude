/* Canonical headless test for Drift Lasso's geometry + the DIRECT-STEERING model
   (← / → or A / D on desktop; hold left/right screen half on phone).
   Proves: geometry helpers are correct; steering EITHER way from the opening wraps
   a drone fast (across screen sizes); driving straight never self-crosses; and the
   one death rule (empty self-cross) still holds.  Run: node _dev/sim.test.js       */

const C = {
  CAR_SPEED:250, TURN_RATE:2.7, STEER_LERP:16, WALL_MARGIN:26, CONTAIN:3.2,
  TRAIL_LIFESPAN:2.6, TRAIL_MIN_DIST:6, MAX_TRAIL_POINTS:300, SELF_GRACE_SEGMENTS:6,
};
const LASSO_R=C.CAR_SPEED/C.TURN_RATE; // ~92.6

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dist2=(ax,ay,bx,by)=>{const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy;};
const _hit={x:0,y:0};
function segHit(ax,ay,bx,by,cx,cy,dx,dy,OUT){
  const r1=bx-ax,r2=by-ay,s1=dx-cx,s2=dy-cy;const denom=r1*s2-r2*s1;if(denom===0)return false;
  const t=((cx-ax)*s2-(cy-ay)*s1)/denom;const u=((cx-ax)*r2-(cy-ay)*r1)/denom;
  if(t>0&&t<1&&u>0&&u<1){OUT.x=ax+t*r1;OUT.y=ay+t*r2;return true;}return false;
}
function pointInPoly(px,py,poly,n){let inside=false;for(let i=0,j=n-1;i<n;j=i++){const xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y;if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
function polyArea(poly,n){let a=0;for(let i=0,j=n-1;i<n;j=i++){a+=(poly[j].x+poly[i].x)*(poly[j].y-poly[i].y);}return Math.abs(a/2);}

function makeTrail(){
  const cap=C.MAX_TRAIL_POINTS;const pts=new Array(cap);for(let i=0;i<cap;i++)pts[i]={x:0,y:0,t:0};
  const scratch=new Array(cap);for(let i=0;i<cap;i++)scratch[i]={x:0,y:0};
  let head=0,len=0;const get=(i)=>pts[(head+i)%cap];
  return { get len(){return len;}, get, reset(){head=0;len=0;},
    push(x,y,t){let idx;if(len<cap){idx=(head+len)%cap;len++;}else{idx=head;head=(head+1)%cap;}const p=pts[idx];p.x=x;p.y=y;p.t=t;},
    dropOld(now,life){while(len>0&&now-get(0).t>life){head=(head+1)%cap;len--;}},
    checkClose(){
      if(len<4)return null;
      const hx0=get(len-2).x,hy0=get(len-2).y,hx1=get(len-1).x,hy1=get(len-1).y,maxI=len-3-C.SELF_GRACE_SEGMENTS;
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

/* steer(t) => -1 / 0 / +1. intro=true softens empty loops to trail-resets. */
function simulate({steer, intro=true, drones, W=412, H=870, maxSeconds=8}){
  const car={x:W*0.5,y:H*0.62,dir:-Math.PI/2}; let steerSmooth=0;
  const dr=(drones||[]).map(d=>({x:d.x,y:d.y}));
  const trail=makeTrail();let elapsed=0;const dt=1/60;let soft=0;
  while(elapsed<maxSeconds){
    elapsed+=dt;
    steerSmooth += ((steer?steer(elapsed):0)-steerSmooth)*clamp(C.STEER_LERP*dt,0,1);
    let omega=steerSmooth*C.TURN_RATE;
    const m=C.WALL_MARGIN*2.2;
    if(car.x<m||car.x>W-m||car.y<m||car.y>H-m){ const des=Math.atan2(H/2-car.y,W/2-car.x); const diff=Math.atan2(Math.sin(des-car.dir),Math.cos(des-car.dir)); const edge=clamp((m-Math.min(car.x,car.y,W-car.x,H-car.y))/m,0,1); omega+=diff*C.CONTAIN*edge; }
    car.dir+=omega*dt; car.x+=Math.cos(car.dir)*C.CAR_SPEED*dt; car.y+=Math.sin(car.dir)*C.CAR_SPEED*dt;
    const last=trail.len>0?trail.get(trail.len-1):null;
    if(!last||dist2(last.x,last.y,car.x,car.y)>=C.TRAIL_MIN_DIST*C.TRAIL_MIN_DIST){
      trail.push(car.x,car.y,elapsed);const loop=trail.checkClose();
      if(loop){
        let caught=0; for(const d of dr){ if(pointInPoly(d.x,d.y,loop.poly,loop.n)) caught++; }
        if(caught>0) return {event:'capture',time:elapsed,soft};
        if(intro){ trail.reset();trail.push(car.x,car.y,elapsed);soft++; }
        else return {event:'death',time:elapsed,soft};
      }
    }
    trail.dropOld(elapsed,C.TRAIL_LIFESPAN);
  }
  return {event:'none',time:elapsed,soft};
}
// the opening clump (matches fullReset): drones at the left- and right-turn centres + ahead
function clump(W=412,H=870){ const cx=W*0.5, cy=H*0.62; return [{x:cx-LASSO_R,y:cy},{x:cx+LASSO_R,y:cy},{x:cx,y:cy-LASSO_R*1.1}]; }

/* ============================ ASSERTIONS ============================ */
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log('  ✓',m);} else {fail++;console.log('  ✗ FAIL:',m);} }

console.log('\n[geometry]');
ok(segHit(0,0,10,10, 0,10,10,0, _hit) && Math.abs(_hit.x-5)<1e-9,'crossing diagonals meet at (5,5)');
ok(!segHit(0,0,1,0, 0,1,1,1, _hit),'parallel non-touching segments do not cross');
ok(!segHit(0,0,1,1, 1,1,2,2, _hit),'segments sharing an endpoint are NOT a cross (forgiving joints)');
const sq=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
ok(pointInPoly(5,5,sq,4) && !pointInPoly(15,5,sq,4),'point-in-polygon in/out');
ok(Math.abs(polyArea(sq,4)-100)<1e-9,'shoelace area = 100');

console.log('\n[opening — steering EITHER way from the start wraps a drone fast]');
const sizes=[[412,870],[390,844],[360,640],[768,1024],[834,1112],[320,568]];
let worst=0, allGood=true;
for(const [W,H] of sizes){
  const L=simulate({W,H,steer:()=>-1,drones:clump(W,H)});
  const R=simulate({W,H,steer:()=>+1,drones:clump(W,H)});
  const good=L.event==='capture'&&L.time<=6 && R.event==='capture'&&R.time<=6;
  if(!good)allGood=false; worst=Math.max(worst,L.time,R.time);
  ok(good, W+'x'+H+': steer-left '+L.event+' @'+L.time.toFixed(2)+'s, steer-right '+R.event+' @'+R.time.toFixed(2)+'s');
}
ok(allGood,'both first-steer directions capture within 6s on every screen size (worst '+worst.toFixed(2)+'s)');

console.log('\n[fairness — driving straight never kills you]');
const straight=simulate({steer:()=>0, drones:[], intro:false, maxSeconds:6});
ok(straight.event==='none','no input = drive straight = never self-cross (no cheap death)');

console.log('\n[death rule — normal play]');
const empty=simulate({steer:()=>1, drones:[], intro:false});
ok(empty.event==='death','steering a full loop around nothing = death (the one legible rule)');

console.log('\n========================================');
console.log('  '+pass+' passed, '+fail+' failed');
console.log('========================================\n');
process.exit(fail>0?1:0);
