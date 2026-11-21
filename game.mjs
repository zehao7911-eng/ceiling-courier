import {bridge} from './sdk.mjs';
const $=id=>document.getElementById(id);
const canvas=document.querySelector('canvas'), T=THREE;
const key='ceiling-courier-v1';
const names=['Fern Ring','Orchid Loop','Citrus Bay','Night Bloom','Sun Vault'];
const clean=p=>({next:Math.min(4,Math.max(0,Math.floor(Number(p?.next)||0))),best:Math.max(0,Math.floor(Number(p?.best)||0)),done:p?.done===true,rewards:{like:p?.rewards?.like===true,comment:p?.rewards?.comment===true}});
let save=clean();try{save=clean(JSON.parse(localStorage.getItem(key)));}catch{}
function persist(){try{localStorage.setItem(key,JSON.stringify(save));}catch{}}
let scene,renderer,camera,actor,pod,limbs=[],stage,gateMeshes=[],garden;
const sdk=bridge({read:()=>save,write:(p,merge)=>{
 const incoming=clean(p);
 save=merge?clean({next:Math.max(save.next,incoming.next),best:Math.max(save.best,incoming.best),done:save.done||incoming.done,rewards:{like:save.rewards.like||incoming.rewards.like,comment:save.rewards.comment||incoming.rewards.comment}}):incoming;
 persist();
},changed:e=>{if(e.type==='reward')$('status').textContent=e.kind==='like'?'GOLD VISOR UNLOCKED':'ROSE VISOR UNLOCKED';if(phase==='home')home();}});
let phase='home', level=0, distance=0, side=0, altitude=0, clock=0, gates=[], hits=0, chain=0, points=0, lives=3, message=0, nextGate=0, audio;
const mat=new Map(), cube=new T.BoxGeometry(1,1,1), sphere=new T.SphereGeometry(1,14,10), drum=new T.CylinderGeometry(1,1,1,16);
function shape(parent,g,color,x,y,z,sx,sy,sz){
 if(!mat.has(color))mat.set(color,new T.MeshStandardMaterial({color,roughness:.53}));
 const o=new T.Mesh(g,mat.get(color));o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;
}
const box=(p,c,x,y,z,a,b,d)=>shape(p,cube,c,x,y,z,a,b,d);
const ball=(p,c,x,y,z,a,b,d)=>shape(p,sphere,c,x,y,z,a,b,d);
function build(){
 renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;
 scene=new T.Scene();scene.background=new T.Color('#071f36');scene.fog=new T.FogExp2('#0e3042',.032);
 camera=new T.PerspectiveCamera(56,1,.1,95);
 scene.add(new T.HemisphereLight('#dcfff2','#518c9a',1.5));
 const sun=new T.DirectionalLight('#fff2c4',2.4);sun.position.set(-4,8,6);scene.add(sun);
 actor=new T.Group();scene.add(actor);
 const shell='#ffb452',joint='#1d3b51',trim='#ffedc1';
 ball(actor,shell,0,.93,0,.44,.48,.32);
 ball(actor,trim,0,1.47,0,.42,.34,.35);
 ball(actor,'#10445b',0,1.46,-.24,.34,.23,.16);
 for(const s of [-1,1]){
   ball(actor,'#65ffe0',s*.13,1.49,-.38,.054,.063,.021);
   ball(actor,shell,s*.38,1.46,0,.1,.14,.13);
   const arm=new T.Group();arm.position.set(s*.43,1.15,0);actor.add(arm);limbs.push(arm);
   ball(arm,joint,0,-.18,0,.116,.27,.11);ball(arm,trim,0,-.4,0,.13,.14,.13);
   const leg=new T.Group();leg.position.set(s*.21,.6,0);actor.add(leg);limbs.push(leg);
   ball(leg,joint,0,-.22,0,.14,.29,.13);box(leg,shell,0,-.49,-.08,.26,.18,.42);
 }
 box(actor,joint,0,.97,.275,.58,.55,.22);
 pod=ball(actor,'#a9ffd3',0,1.02,.42,.21,.25,.14);
 for(let i=0;i<3;i++)box(actor,trim,0,.79+i*.16,.49,.45,.035,.12);
 const resize=()=>{renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.updateProjectionMatrix();};
 addEventListener('resize',resize);resize();
}
function course(n){
 const count=9+n*3;
 return Array.from({length:count},(_,i)=>({z:15+i*(n<2?9:8),side:i===0?0:((i*7+Math.floor(i/(n+2))+n)%4<2?0:1)}));
}
function setStage(n){
 if(stage)scene.remove(stage);
 stage=new T.Group();scene.add(stage);gateMeshes=[];
 gates=course(n);
 const length=gates.at(-1).z+13, paint=['#245863','#564063','#36614f','#363e74','#745145'][n];
 for(const y of [0,6]){
   box(stage,paint,0,y-.12,-length/2,6,.24,length+10);
   for(const x of [-2.8,-1.4,1.4,2.8])box(stage,'#88c9c1',x,y+.006,-length/2,.055,.04,length+8);
 }
 for(let z=2;z>-length-4;z-=5){
   for(const x of [-3,3]){
     box(stage,'#a4c7bc',x,3,z,.22,6,.28);
     box(stage,'#2e6971',x,3,z-2.4,.13,.28,4.6);
     if(Math.round(z)%2===0){
       box(stage,'#c77d5f',x*.87,.29,z,1,.56,1.65);
       for(let j=0;j<4;j++){
         const leaf=ball(stage,j%2?'#36ab84':'#80cf86',x*.87+(j%2-.5)*.4,.87,z-.58+j*.35,.16,.42,.23);
         leaf.rotation.z=(j%2-.5)*.9;
       }
     }
   }
   box(stage,'#ffda9b',0,5.91,z,5.8,.09,.11);
 }
 for(const g of gates){
   const group=new T.Group();stage.add(group);group.position.z=-g.z;
   const y=g.side?4.95:1.05;
   box(group,'#eb655b',0,y,0,5.64,1.99,.4);
   for(let j=-2;j<=2;j++){const stripe=box(group,'#ffe2a7',j*.99,y,.23,.15,1.4,.05);stripe.rotation.z=-.55;}
   for(const x of [-2.63,2.63])ball(group,'#ffd69c',x,y,.27,.11,.11,.09);
   const token=shape(group,drum,'#ffdb71',0,g.side?.9:5.1,0,.26,.1,.26);token.rotation.x=Math.PI/2;
   gateMeshes.push({group,token});
 }
 garden=new T.Group();garden.position.set(0,0,-length+4);stage.add(garden);
 box(garden,'#df9565',0,.42,0,3.6,.8,2.2);
 const stem=shape(garden,drum,'#4bd396',0,1.2,0,.15,1.9,.15);
 for(let j=0;j<8;j++){
   const a=j*Math.PI/4;
   const petal=ball(garden,'#ff9eab',Math.cos(a)*.67,2.12+Math.sin(a)*.67,0,.23,.43,.17);
   petal.rotation.z=a-Math.PI/2;
 }
 ball(garden,'#ffe082',0,2.12,.09,.32,.32,.22);
 garden.scale.setScalar(.26);
}
function sound(freq){
 try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});
 const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
 o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*1.55,t+.16);g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g);g.connect(audio.destination);o.start();o.stop(t+.19);
 }catch{}
}
function panel(title,desc,label,fn,eyebrow='ORBITAL GREENHOUSE'){
 $('panel').hidden=false;
 $('panel').innerHTML='<small>'+eyebrow+'</small><h1>'+title+'</h1><p>'+desc+'</p><button>'+label+'</button>';
 $('panel').querySelector('button').onclick=fn;
}
function home(){
 phase='home';
 const support=sdk.support();
 const bonus=[support.like&&!save.rewards.like?'Like for a gold visor.':'',support.comment&&!save.rewards.comment?'Comment for a rose visor.':''].filter(Boolean).join(' ');
 panel('CEILING<br>COURIER','Carry a seed through the greenhouse. Tap to switch surfaces and dodge the red gates.'+(bonus?' <br>'+bonus:''),save.next?'CONTINUE ROUTE':'START DELIVERY',()=>start(save.next));
}
function start(n){
 sound(280);setStage(n);level=n;phase='intro';clock=0;distance=side=altitude=hits=chain=points=nextGate=0;lives=3;
 $('panel').hidden=true;$('action').hidden=false;$('route').textContent=names[n];$('status').textContent='SEED ON BOARD';hud();
 sdk.prepare();sdk.start();
}
function hud(){
 $('meter').value=nextGate/gates.length;
 $('score').textContent='♥'.repeat(lives)+'  '+points;
}
function flip(){if(phase!=='run')return;side=1-side;sound(side?330:210);}
function finish(won){
 phase=won?'bloom':'loss';clock=0;$('action').hidden=true;$('status').textContent=won?'SEED DELIVERED':'DELIVERY INTERRUPTED';sdk.end();
 if(won){save.next=Math.max(save.next,Math.min(4,level+1));save.done||=level===4;}
 save.best=Math.max(save.best,points);persist();sdk.save();
 if(!won)panel('Try that route again',hits+' gates cleared · '+points+' points','RETRY',()=>start(level),names[level]);
}
$('action').onclick=flip;canvas.onpointerdown=flip;
addEventListener('keydown',e=>{if(e.code==='Space'&&phase==='run'&&e.target.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat)flip();}});
addEventListener('pagehide',()=>{sdk.stop();persist();});
try{build();setStage(0);home();}catch{panel('3D could not start','Open this game in a browser with WebGL enabled.','RETRY',()=>location.reload());throw Error('WebGL startup failed');}
let prev=performance.now();
function frame(now){
 requestAnimationFrame(frame);const dt=Math.min(.04,(now-prev)/1000);prev=now;if(document.hidden)return;
 clock+=dt;
 if(phase==='intro'&&clock>1.35){phase='run';clock=0;$('status').textContent='TAP TO FLIP';message=1.25;}
 if(phase==='run'){
   altitude=T.MathUtils.damp(altitude,side,12,dt);
   distance+=(5.2+level*.7)*dt;
   const gate=gates[nextGate];
   if(gate&&distance>=gate.z){
     const clear=gate.side?altitude<.39:altitude>.61;
     if(clear){hits++;chain++;points+=100+Math.min(chain-1,5)*20;sound(530+chain*34);gateMeshes[nextGate].token.visible=false;}
     else{lives--;chain=0;sound(115);}
     $('status').textContent=clear?(chain>1?'CLEAN ×'+chain:'CLEAN PASS'):'BUMP!';
     message=.82;nextGate++;hud();if(!lives)finish(false);
   }
   if(phase==='run'&&nextGate===gates.length&&distance>=gates.at(-1).z+6)finish(true);
   if((message-=dt)<0&&phase==='run')$('status').textContent='';
 }
 if(phase==='bloom'&&clock>1.7){
   phase='won';
   panel(level===4?'The vault is alive!':'Delivery complete',hits+'/'+gates.length+' clean passes · '+points+' points',level===4?'RUN THE TOUR AGAIN':'NEXT GREENHOUSE',()=>start(level===4?0:level+1),names[level]);
 }
 const moving=phase==='run', step=moving?Math.sin(now*.013):0;
 actor.position.set(0,.1+altitude*5.78,-distance);
 actor.rotation.z=altitude*Math.PI;
 limbs.forEach((limb,i)=>limb.rotation.x=step*(i===0||i===3?.55:-.55));
 pod.rotation.y=now*.0015;
 pod.material.color.set(save.rewards.comment?'#ff9ac3':save.rewards.like?'#ffda78':'#a9ffd3');
 if(phase==='intro'){actor.rotation.y=Math.sin(Math.PI*clock/1.35)*2.7;limbs[0].rotation.z=Math.sin(clock*16)*.55;}
 else{actor.rotation.y=0;limbs[0].rotation.z=0;}
 const blooming=phase==='bloom'||phase==='won';
 if(blooming){
   const growth=phase==='won'?1:Math.min(1,clock/1.15);
   garden.scale.setScalar(.26+growth*.9);garden.rotation.y=Math.sin(growth*5)*.23;
   pod.visible=false;
 }else pod.visible=true;
 const close=phase==='home'||phase==='intro';
 camera.position.set(close?2.55:blooming?2.4:0,close?3.45:3.1,-distance+(close?5.4:7.1));
 camera.lookAt(0,close?2.1:3,-distance-(blooming?4:close?.8:8));
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
