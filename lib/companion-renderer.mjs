// Approved illustrated family v4, minimal fur (0.22). See docs/mascot-animations.md.
const chars={
 luma:{name:'Luma',color:'#d9c9f2',message:'Stay as long as you like.',action:'Hug the moon',prop:[255,356,177,151],type:'moon'},
 pip:{name:'Pip',color:'#f2bd72',message:'One small thing at a time.',action:'A little pencil tap',prop:[213,325,44,136],type:'pencil'},
 tock:{name:'Tock',color:'#c7dcf4',message:'There’s room to take your time.',action:'Show the timer',prop:[256,350,127,127],type:'timer'},
 momo:{name:'Momo',color:'#d4e2b9',message:'Something simple will do.',action:'A basket for you',prop:[256,352,143,128],type:'basket'},
 nori:{name:'Nori',color:'#f3c5b5',message:'A little comfort, a little nourishment.',action:'A warm little bowl',prop:[256,355,162,110],type:'bowl'},
 bounce:{name:'Bounce',color:'#f3a6a9',message:'A little stretch counts.',action:'A gentle stretch',prop:[256,203,262,63],type:'band'},
 sunny:{name:'Sunny',color:'#f5df9e',message:'A gentle beginning.',action:'A quiet little bell',prop:[216,335,83,115],type:'bell'}
};
const modes={idle:'Just here',listening:'Listening',thinking:'Thinking',speaking:'Speaking',happy:'Happy',encouraging:'Encouraging',sleepy:'Sleepy',concerned:'Caring',reaction:'Celebrate',action:'Signature move'};
const duration=mode=>mode==='reaction'?3:8;
const furDefaults={strength:.22};
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
const ramp=(t,a,b)=>ease((t-a)/(b-a));
const pulse=(t,a,b,c,d)=>ramp(t,a,b)*(1-ramp(t,c,d));
const mix=(a,b,t)=>a+(b-a)*t;
function poseAt(id,mode,time){
 const t=Math.max(0,time),u=t*Math.PI/4,b=(1-Math.cos(u))/2;
 const blink=1-pulse(t%8,3.55,3.73,3.80,4.02);
 const p={eye:id==='luma'?0:blink,lookX:0,lookY:0,smile:.4,mouth:0,happy:0,care:0,roll:0,y:0,sx:1,sy:1,action:0,wiggle:0,wave:0,cheek:.34,breath:b,fur:t};
 p.sy=1+.018*b;p.sx=1+.008*b;
 if(id==='pip')p.roll=.018*Math.sin(u*2);
 if(id==='tock')p.roll=.018*Math.sin(u*2);
 if(id==='momo')p.roll=.013*Math.sin(u*2);
 if(id==='nori')p.y=-1.1*b;
 if(id==='bounce'){p.y=-3.2*(1-Math.cos(u*4))/2;p.sy+=.006*Math.sin(u*4);}
 if(id==='sunny')p.y=-2*b;
 if(mode==='listening'){p.eye=(id==='luma'?.65:1)*blink;p.lookX=1.1*Math.sin(u);p.roll*=.4;p.wave=.1*b;}
 if(mode==='thinking'){p.eye=(id==='luma'?.55:.85)*blink;p.lookX=2.4;p.lookY=-2.2;p.smile=.08;p.roll+=.022*b;}
 if(mode==='speaking'){p.eye=(id==='luma'?.3:1)*blink;p.mouth=(.2+.8*Math.pow(Math.sin(u*16),2))*(.6+.4*Math.pow(Math.sin(u*3),2));p.smile=.55;}
 if(mode==='happy'){p.eye=0;p.happy=1;p.smile=.85;p.cheek=.43;p.mouth=.18;p.y-=id==='luma'?0:2*b;}
 if(mode==='encouraging'){p.eye=(id==='luma'?.5:.9)*blink;p.smile=.8;p.wave=.25*b;p.roll+=.018*Math.sin(u);}
 if(mode==='sleepy'){p.eye=id==='luma'?0:.18*blink;p.mouth=.6*pulse(t%8,1,2.2,3.4,4.8);p.roll=-.025*b;p.y=2*b;p.smile=.2;}
 if(mode==='concerned'){p.eye=(id==='luma'?.4:.65)*blink;p.care=1;p.smile=.3;p.roll=-.015*b;}
 if(mode==='action'){
  p.action=pulse(t,0.5,2.5,4.7,7.5);p.wiggle=Math.sin(u*4)*p.action;
  if(id==='luma'){p.eye=0;p.roll-=.055*p.action;p.smile=.68;p.sx+=.007*p.action;p.sy-=.007*p.action;}
  if(id==='pip'){p.roll+=.025*p.wiggle;p.smile=.65;}
  if(id==='momo')p.roll+=.025*p.wiggle;
  if(id==='nori'){p.eye=1-.85*p.action;p.smile=.72;}
  if(id==='bounce'){p.sy+=.065*p.action;p.sx-=.023*p.action;p.eye=blink;p.smile=.8;}
  if(id==='sunny')p.roll+=.025*p.wiggle;
 }
 if(mode==='reaction'){
  const r=pulse(t,.05,.6,1.8,2.9);p.eye=0;p.happy=r;p.smile=.4+.5*r;p.mouth=.25*r;
  p.roll=0;p.y=0;p.sx=1;p.sy=1;
  if(id==='bounce'){const hop=Math.pow(Math.max(0,Math.sin(Math.PI*(t-.4)/1.7)),2);p.y=-28*hop;p.sx+=.065*pulse(t,1.9,2.1,2.2,2.5);p.sy-=.07*pulse(t,1.9,2.1,2.2,2.5);}
  else if(id==='pip'){p.y=-7*pulse(t,.25,.55,.65,.95)-5*pulse(t,1,1.25,1.35,1.65);}
  else if(id==='luma'){p.sy+=.015*r;p.sx+=.01*r;}
  else if(id==='sunny')p.y=-5*r;
  else p.roll=.025*Math.sin(t*Math.PI*2/3)*r;
 }
 return p;
}
function blendPose(a,b,t){const p={...b};for(const k of Object.keys(b))if(typeof b[k]==='number')p[k]=mix(a[k]??b[k],b[k],ease(t));return p;}
function sprite(c,img,x,y,w,h,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.drawImage(img,-w/2,-h/2,w,h);c.restore();}
function shadow(c,x,y,rx,ry,opacity){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(76,47,90,${opacity})`);g.addColorStop(1,'rgba(76,47,90,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();c.restore();}
function createRig(assets,makeCanvas){
 const tex=makeCanvas(512,512),drift=makeCanvas(512,512),mask=makeCanvas(512,512),mc=mask.getContext('2d');
 const feather=mc.createRadialGradient(256,292,95,256,292,177);
 feather.addColorStop(0,'rgba(255,255,255,0)');feather.addColorStop(1,'rgba(255,255,255,1)');
 mc.fillStyle=feather;mc.fillRect(0,0,512,512);
 return{assets,tex,tc:tex.getContext('2d'),drift,dc:drift.getContext('2d'),mask};
}
function triangle(c,texture,a,b,d){
 const det=(b.u-a.u)*(d.v-a.v)-(d.u-a.u)*(b.v-a.v);
 const A=((b.x-a.x)*(d.v-a.v)-(d.x-a.x)*(b.v-a.v))/det;
 const B=((b.y-a.y)*(d.v-a.v)-(d.y-a.y)*(b.v-a.v))/det;
 const C=((d.x-a.x)*(b.u-a.u)-(b.x-a.x)*(d.u-a.u))/det;
 const D=((d.y-a.y)*(b.u-a.u)-(b.y-a.y)*(d.u-a.u))/det;
 c.save();c.beginPath();const cx=(a.x+b.x+d.x)/3,cy=(a.y+b.y+d.y)/3;
 for(const [i,p] of [a,b,d].entries()){const dx=p.x-cx,dy=p.y-cy,len=Math.hypot(dx,dy)||1;const x=p.x+dx/len*1.2,y=p.y+dy/len*1.2;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.closePath();c.clip();
 c.transform(A,B,C,D,a.x-A*a.u-C*a.v,a.y-B*a.u-D*a.v);c.drawImage(texture,0,0);c.restore();
}
function furBody(c,rig,time,strength){
 const {tc,tex,assets,drift,dc,mask}=rig;tc.clearRect(0,0,512,512);
 if(!strength){c.drawImage(assets.body,0,0);return;}
 const cycle=(time%8)/2,segment=Math.floor(cycle),phase=ease(cycle-segment),order=['body','furLeft','body','furRight','body'];
 // Keep the body texture still. Only feathered outer fur receives a faint
 // change of drawing, avoiding the previous all-over texture shimmer.
 dc.clearRect(0,0,512,512);dc.globalCompositeOperation='lighter';
 dc.globalAlpha=1-phase;dc.drawImage(assets[order[segment]],0,0);dc.globalAlpha=phase;dc.drawImage(assets[order[segment+1]],0,0);
 dc.globalAlpha=1;dc.globalCompositeOperation='destination-in';dc.drawImage(mask,0,0);dc.globalCompositeOperation='source-over';
 tc.drawImage(assets.body,0,0);tc.globalAlpha=strength;tc.drawImage(drift,0,0);tc.globalAlpha=1;
 const cols=8,rows=10,points=[],angle=time*Math.PI/4;
 for(let j=0;j<=rows;j++){points[j]=[];for(let i=0;i<=cols;i++){
  const x=i*512/cols,y=j*512/rows,r=Math.hypot((x-256)/164,(y-291)/166);
  const edge=clamp((r-.72)/.28),tuft=clamp((210-y)/100),influence=Math.max(edge,tuft);
  const dx=2.8*strength*influence*Math.sin(angle+y*.018),dy=1.65*strength*influence*Math.sin(angle+x*.014+.7);
  points[j][i]={u:x,v:y,x:x+dx,y:y+dy};
 }}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=points[j][i],b=points[j][i+1],d=points[j+1][i],e=points[j+1][i+1];triangle(c,tex,a,b,e);triangle(c,tex,a,e,d);}
}
function eye(c,x,y,open,happy,lookX,lookY){
 c.save();c.translate(x+lookX,y+lookY);c.strokeStyle='#503451';c.fillStyle='#503451';c.lineWidth=2.9;c.lineCap='round';
 const closed=4.6-10*happy,top=mix(closed,-16.6,open),bottom=mix(closed,16,open),w=9.8;
 c.beginPath();c.moveTo(-w,0);c.bezierCurveTo(-w,top,w,top,w,0);c.bezierCurveTo(w,bottom,-w,bottom,-w,0);c.fill();c.stroke();c.clip();
 c.globalAlpha=ramp(open,.35,.85);c.fillStyle='#fff6dc';c.beginPath();c.ellipse(2.5,-5.5,2.5,3,0,0,Math.PI*2);c.fill();c.restore();
}
function limb(c,img,side,rootX,rootY,palmX,palmY){
 const dx=palmX-rootX,dy=palmY-rootY,dist=Math.max(24,Math.hypot(dx,dy));
 const dir=side==='left'?1:-1,angle=Math.atan2(dy,dx)-(dir===1?0:Math.PI),w=Math.max(78,Math.min(135,dist/.56)),h=w*.51;
 c.save();c.translate(rootX,rootY);c.rotate(angle);c.drawImage(img,dir===1?-.20*w:-.80*w,-.5*h,w,h);c.restore();
}
function draw(c,rig,id,mode,time,options={}){
 const a=rig.assets,character=chars[id],p=options.pose||poseAt(id,mode,time),W=c.canvas.width,H=c.canvas.height;
 c.clearRect(0,0,W,H);c.save();c.scale(W/512,H/512);
 if(options.shadow!==false)shadow(c,256,445,118,18,.13);
 const fy=434+p.y; sprite(c,a.foot,211,fy,64,40,-.10);sprite(c,a.foot,299,fy,64,40,.10);
 c.save();c.translate(256,426+p.y);c.rotate(p.roll);c.scale(p.sx,p.sy);c.translate(-256,-426);
 furBody(c,rig,options.furTime??time,options.furStrength??furDefaults.strength);
 if(id==='bounce')sprite(c,a.prop,...character.prop,.15);
 const faceX=-1.8*p.action*(id==='luma'?1:0),faceY=-2*p.action*(id==='luma'?1:0);
 c.save();c.translate(faceX,faceY);
 for(const x of [191,321]){c.save();c.translate(x,269);c.scale(1,.65);const blush=c.createRadialGradient(0,0,0,0,0,22);blush.addColorStop(0,`rgba(235,142,161,${p.cheek})`);blush.addColorStop(1,'rgba(235,142,161,0)');c.fillStyle=blush;c.beginPath();c.arc(0,0,22,0,Math.PI*2);c.fill();c.restore();}
 eye(c,212,248,p.eye,p.happy,p.lookX,p.lookY);eye(c,300,248,p.eye,p.happy,p.lookX,p.lookY);
 const mw=12+4*p.smile;c.strokeStyle='#583854';c.fillStyle='#583854';c.lineWidth=2.9;c.lineCap='round';
 if(p.mouth>.02){c.beginPath();c.ellipse(256,272,mw*.65,1+7*p.mouth,0,0,Math.PI*2);c.fill();}
 else{c.beginPath();c.moveTo(256-mw,267);c.bezierCurveTo(248,275+2*p.smile,264,275+2*p.smile,256+mw,267);c.stroke();}
 c.restore();
 let [px,py,pw,ph]=character.prop,pr=0,lx=201,ly=348,rx=311,ry=348;
 if(id==='luma'){py-=16*p.action;px-=4*p.action;pr=-.07*p.action;lx+=7*p.action;ly-=18*p.action;rx-=7*p.action;ry-=17*p.action;}
 if(id==='pip'){py-=14*p.action+3*p.wiggle;pr=-.28+.11*p.wiggle;lx=211;ly=348-14*p.action-3*p.wiggle;rx=322+12*p.wave;ry=342-28*p.wave;}
 if(id==='tock'){py-=18*p.action;pr=.06*p.wiggle;lx=210;rx=302;ly=ry=349-18*p.action;}
 if(id==='momo'){px+=8*p.wiggle;py-=12*p.action;pr=.055*p.wiggle;lx=208+8*p.wiggle;rx=305+8*p.wiggle;ly=ry=329-12*p.action;}
 if(id==='nori'){py-=14*p.action;lx=204;rx=309;ly=ry=350-14*p.action;}
 if(id==='bounce'){lx=179-57*p.action;rx=333+57*p.action;ly=337-61*p.action;ry=337-61*p.action;}
 if(id==='sunny'){pr=.25*p.wiggle;py-=6*p.action;lx=218;ly=309-6*p.action;rx=322+10*p.wave;ry=344-28*p.wave;}
 if(id!=='bounce'){shadow(c,px,py+7,pw*.46,ph*.38,.10);sprite(c,a.prop,px,py,pw,ph,pr);}
 // Each arm is one continuous painted limb. Shoulder roots fade into the fur.
 limb(c,a.armLeft,'left',153,321,lx,ly);limb(c,a.armRight,'right',359,321,rx,ry);
 c.restore();c.restore();return p;
}
export { chars, modes, duration, furDefaults, poseAt, blendPose, createRig, draw };
