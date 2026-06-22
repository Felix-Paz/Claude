/* Explore a bulletproof opening: find an intro release-radius + drone placement
   so that NO first action can cause a cheap death, and a first capture always
   lands fast — whether the player idles or holds, and whenever they start. */
const C={CAR_SPEED:252,MIN_RADIUS:44,RADIUS_LERP:8.5,TURN_DIR:1,TRAIL_LIFESPAN:2.6,TRAIL_MIN_DIST:6,MAX_TRAIL_POINTS:260,SELF_GRACE_SEGMENTS:6};
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,dist2=(ax,ay,bx,by)=>{const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy;};
const _hit={x:0,y:0};
function segHit(ax,ay,bx,by,cx,cy,dx,dy,O){const r1=bx-ax,r2=by-ay,s1=dx-cx,s2=dy-cy,den=r1*s2-r2*s1;if(den===0)return false;const t=((cx-ax)*s2-(cy-ay)*s1)/den,u=((cx-ax)*r2-(cy-ay)*r1)/den;if(t>0&&t<1&&u>0&&u<1){O.x=ax+t*r1;O.y=ay+t*r2;return true;}return false;}
function pointInPoly(px,py,p,n){let ins=false;for(let i=0,j=n-1;i<n;j=i++){const xi=p[i].x,yi=p[i].y,xj=p[j].x,yj=p[j].y;if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))ins=!ins;}return ins;}
function polyArea(p,n){let a=0;for(let i=0,j=n-1;i<n;j=i++)a+=(p[j].x+p[i].x)*(p[j].y-p[i].y);return Math.abs(a/2);}
function makeTrail(){const cap=C.MAX_TRAIL_POINTS,pts=new Array(cap);for(let i=0;i<cap;i++)pts[i]={x:0,y:0,t:0};const sc=new Array(cap);for(let i=0;i<cap;i++)sc[i]={x:0,y:0};let head=0,len=0;const get=i=>pts[(head+i)%cap];
 return{get len(){return len;},get,reset(){head=0;len=0;},push(x,y,t){let idx;if(len<cap){idx=(head+len)%cap;len++;}else{idx=head;head=(head+1)%cap;}const p=pts[idx];p.x=x;p.y=y;p.t=t;},dropOld(now,l){while(len>0&&now-get(0).t>l){head=(head+1)%cap;len--;}},
 checkClose(){if(len<4)return null;const hx0=get(len-2).x,hy0=get(len-2).y,hx1=get(len-1).x,hy1=get(len-1).y,maxI=len-3-C.SELF_GRACE_SEGMENTS;for(let i=maxI;i>=0;i--){const a=get(i),b=get(i+1);if(segHit(hx0,hy0,hx1,hy1,a.x,a.y,b.x,b.y,_hit)){let n=0;sc[n].x=_hit.x;sc[n].y=_hit.y;n++;for(let k=i+1;k<=len-2;k++){const p=get(k);sc[n].x=p.x;sc[n].y=p.y;n++;}return{poly:sc,n,area:polyArea(sc,n)};}}return null;}};}

function run({W=400,H=800,introR,droneOff,holdStart,intro=true,maxSeconds=12}){
  const car={x:W*0.5,y:H*0.56,dir:-Math.PI/2,r:introR};
  // drone at car + droneOff along the turn-side normal (cos(dir+pi/2),sin(dir+pi/2))
  const nx=Math.cos(car.dir+Math.PI/2),ny=Math.sin(car.dir+Math.PI/2);
  const drone={x:car.x+nx*droneOff,y:car.y+ny*droneOff,spawn:1};
  const trail=makeTrail();let elapsed=0;const dt=1/60;let softResets=0;
  while(elapsed<maxSeconds){elapsed+=dt;
    const hold=holdStart>=0&&elapsed>=holdStart;
    const targetR=hold?C.MIN_RADIUS:introR;
    car.r=lerp(car.r,targetR,clamp(C.RADIUS_LERP*dt,0,1));
    car.dir+=(C.CAR_SPEED/car.r)*C.TURN_DIR*dt;
    car.x+=Math.cos(car.dir)*C.CAR_SPEED*dt;car.y+=Math.sin(car.dir)*C.CAR_SPEED*dt;
    const last=trail.len>0?trail.get(trail.len-1):null;
    if(!last||dist2(last.x,last.y,car.x,car.y)>=C.TRAIL_MIN_DIST*C.TRAIL_MIN_DIST){
      trail.push(car.x,car.y,elapsed);const loop=trail.checkClose();
      if(loop){let caught=pointInPoly(drone.x,drone.y,loop.poly,loop.n)?1:0;
        if(caught>0)return{event:'capture',time:elapsed,softResets};
        if(intro){trail.reset();trail.push(car.x,car.y,elapsed);softResets++;}
        else return{event:'death',time:elapsed,softResets};
      }}
    trail.dropOld(elapsed,C.TRAIL_LIFESPAN);
  }
  return{event:'none',time:elapsed,softResets,drone};
}

// search introR and droneOff
const holdStarts=[-1,0,0.15,0.3,0.5,0.8,1.2,2.0]; // -1 = pure idle
let best=null;
for(let introR=72;introR<=104;introR+=2){
 for(let off=introR*0.6;off<=introR*1.05;off+=4){
  let worstTime=0,allCapture=true,maxSoft=0;
  for(const hs of holdStarts){
    const r=run({introR,droneOff:off,holdStart:hs});
    if(r.event!=='capture'){allCapture=false;break;}
    worstTime=Math.max(worstTime,r.time);maxSoft=Math.max(maxSoft,r.softResets);
  }
  if(allCapture){
    const score=worstTime+maxSoft*0.5;
    if(!best||score<best.score)best={introR,off:+off.toFixed(1),worstTime:+worstTime.toFixed(2),maxSoft,score};
  }
 }
}
console.log('best opening:',JSON.stringify(best));
// detail for the winner
if(best){
  console.log('\nper-input outcomes at introR='+best.introR+', droneOff='+best.off+':');
  for(const hs of holdStarts){const r=run({introR:best.introR,droneOff:best.off,holdStart:hs});
    console.log('  holdStart='+(hs<0?'IDLE':hs+'s')+' => '+r.event+' @ '+r.time.toFixed(2)+'s (softResets '+r.softResets+')');}
  // sanity: normal-mode empty loop still dies
  const d=run({introR:best.introR,droneOff:9999,holdStart:0,intro:false});
  console.log('\nnormal-mode empty-loop check => '+d.event+' @ '+d.time.toFixed(2)+'s (expect death)');
}
