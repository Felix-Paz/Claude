/* Tune + prove the opening for the NEW "roam + lasso" control model:
     RELEASE -> drive nearly straight (roam);  HOLD -> curl into a loop (lasso).
   The old idle-auto-capture trick can't apply (idle now drives straight), so the
   guarantee becomes: holding at ANY time captures, because during the intro the
   drone hovers at the centre of the circle the car WOULD carve if it held now
   (car + R_curl * turn-side normal). Verify across hold timings + arena sizes. */
const C={CAR_SPEED:250,TRAIL_LIFESPAN:2.6,TRAIL_MIN_DIST:6,MAX_TRAIL_POINTS:300,SELF_GRACE_SEGMENTS:6,RADIUS_LERP:9,TURN_DIR:1,WALL_MARGIN:26,CONTAIN:3.2};
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,dist2=(ax,ay,bx,by)=>{const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy;};
const _h={x:0,y:0};
function segHit(ax,ay,bx,by,cx,cy,dx,dy,O){const r1=bx-ax,r2=by-ay,s1=dx-cx,s2=dy-cy,den=r1*s2-r2*s1;if(den===0)return false;const t=((cx-ax)*s2-(cy-ay)*s1)/den,u=((cx-ax)*r2-(cy-ay)*r1)/den;if(t>0&&t<1&&u>0&&u<1){O.x=ax+t*r1;O.y=ay+t*r2;return true;}return false;}
function pIn(px,py,p,n){let ins=false;for(let i=0,j=n-1;i<n;j=i++){const xi=p[i].x,yi=p[i].y,xj=p[j].x,yj=p[j].y;if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))ins=!ins;}return ins;}
function T(){const cap=C.MAX_TRAIL_POINTS,pts=[];for(let i=0;i<cap;i++)pts[i]={x:0,y:0,t:0};const sc=[];for(let i=0;i<cap;i++)sc[i]={x:0,y:0};let head=0,len=0;const g=i=>pts[(head+i)%cap];
 return{get len(){return len;},g,reset(){head=0;len=0;},push(x,y,t){let i;if(len<cap){i=(head+len)%cap;len++;}else{i=head;head=(head+1)%cap;}const p=pts[i];p.x=x;p.y=y;p.t=t;},drop(now,l){while(len>0&&now-g(0).t>l){head=(head+1)%cap;len--;}},
 close(){if(len<4)return null;const x0=g(len-2).x,y0=g(len-2).y,x1=g(len-1).x,y1=g(len-1).y,mI=len-3-C.SELF_GRACE_SEGMENTS;for(let i=mI;i>=0;i--){const a=g(i),b=g(i+1);if(segHit(x0,y0,x1,y1,a.x,a.y,b.x,b.y,_h)){let n=0;sc[n].x=_h.x;sc[n].y=_h.y;n++;for(let k=i+1;k<=len-2;k++){const p=g(k);sc[n].x=p.x;sc[n].y=p.y;n++;}return{poly:sc,n};}}return null;}};}

function run(W,H,Rcurl,Rwide,K,hold,maxSec=8){
  const car={x:W*0.5,y:H*0.62,dir:-Math.PI/2,r:Rwide};
  // intro drone starts at the prospective curl centre
  let nx=Math.cos(car.dir+C.TURN_DIR*Math.PI/2),ny=Math.sin(car.dir+C.TURN_DIR*Math.PI/2);
  const dr={x:car.x+nx*Rcurl,y:car.y+ny*Rcurl};
  const tr=T();let e=0;const dt=1/60;let soft=0;
  while(e<maxSec){e+=dt;const h=hold(e);const tR=h?Rcurl:Rwide;car.r=lerp(car.r,tR,clamp(C.RADIUS_LERP*dt,0,1));
   let omega=(C.CAR_SPEED/car.r)*C.TURN_DIR;
   // soft containment toward centre near walls
   const m2=C.WALL_MARGIN*2;
   if(car.x<m2||car.x>W-m2||car.y<m2||car.y>H-m2){const des=Math.atan2(H/2-car.y,W/2-car.x);let d=Math.atan2(Math.sin(des-car.dir),Math.cos(des-car.dir));omega+=d*C.CONTAIN*0.6;}
   car.dir+=omega*dt;car.x+=Math.cos(car.dir)*C.CAR_SPEED*dt;car.y+=Math.sin(car.dir)*C.CAR_SPEED*dt;
   // drone tracks the (current) prospective curl centre
   nx=Math.cos(car.dir+C.TURN_DIR*Math.PI/2);ny=Math.sin(car.dir+C.TURN_DIR*Math.PI/2);
   const cx=car.x+nx*Rcurl,cy=car.y+ny*Rcurl;const k=clamp(K*dt,0,1);dr.x+=(cx-dr.x)*k;dr.y+=(cy-dr.y)*k;
   const last=tr.len>0?tr.g(tr.len-1):null;
   if(!last||dist2(last.x,last.y,car.x,car.y)>=36){tr.push(car.x,car.y,e);const lp=tr.close();
    if(lp){if(pIn(dr.x,dr.y,lp.poly,lp.n))return{ev:"cap",t:e,soft};tr.reset();tr.push(car.x,car.y,e);soft++;}}
   tr.drop(e,C.TRAIL_LIFESPAN);}
  return{ev:"none",t:maxSec,soft};
}
const sizes=[[412,870],[390,844],[360,640],[768,1024],[320,568],[834,1112]];
const pats={h0:_=>true,h03:t=>t>0.3,h06:t=>t>0.6,h1:t=>t>1.0,h15:t=>t>1.5,h2:t=>t>2.0,h3:t=>t>3.0,
            roamThenHold:t=>t>1.2, pulseThenHold:t=>(t>1.0)||(t>0.3&&t<0.5)};
let best=null;
for(const Rcurl of [72,80,88,96]) for(const K of [6,9,13]){
  let ok=0,tot=0,worst=0;
  for(const [W,H] of sizes) for(const k in pats){tot++;const r=run(W,H,Rcurl,1500,K,pats[k]);if(r.ev==="cap"&&r.t<=8){ok++;worst=Math.max(worst,r.t);}}
  if(ok===tot && (!best||worst<best.worst)) best={Rcurl,K,worst:+worst.toFixed(2),ok,tot};
  console.log("Rcurl="+Rcurl+" K="+K+" => "+ok+"/"+tot+(ok===tot?"  worst="+worst.toFixed(2)+"s":""));
}
console.log("\nBEST:",JSON.stringify(best));
if(best){console.log("\nper-pattern @ 412x870:");for(const k in pats){const r=run(412,870,best.Rcurl,1500,best.K,pats[k]);console.log("  "+k.padEnd(14)+r.ev+" @"+r.t.toFixed(2)+"s soft:"+r.soft);}}
