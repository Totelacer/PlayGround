(()=>{'use strict';
const canvas=document.querySelector('#c'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s),menu=$('#menu'),result=$('#result'),hud=$('#hud'),touch=$('#touch');
const W=3600,waterY=560,keys={left:false,right:false},stars=[],plats=[];let dpr=1,cw=0,ch=0,mode='menu',last=0,elapsed=0,camera=0,toastTimer=0,runStars=0,particles=[],best=+(localStorage.getItem('dontSplashBest')||0);
const player={x:95,y:0,vx:0,vy:0,w:28,h:42,ground:false,grace:0,invuln:0};
function resize(){dpr=Math.min(devicePixelRatio||1,2);cw=innerWidth;ch=innerHeight;canvas.width=cw*dpr;canvas.height=ch*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();
function rnd(a,b){return a+Math.random()*(b-a)}
function build(){plats.length=stars.length=particles.length=0;plats.push({x:0,y:474,w:260,type:0});let x=235,y=474,i=0;while(x<W-180){let dx=rnd(220,278);x+=dx;y=Math.max(397,Math.min(484,y+rnd(-37,37)));plats.push({x,y,w:rnd(132,163),type:++i%3});x+=0}plats.push({x:W-190,y:465,w:300,type:0,goal:true});for(let n=1;n<=5;n++){let p=plats[Math.round(n*(plats.length-2)/6)];stars.push({x:p.x+p.w/2,y:p.y-66,got:false,phase:rnd(0,6)})}player.x=95;player.y=plats[0].y-player.h;player.vx=player.vy=0;player.ground=true;player.grace=0;camera=0;elapsed=0;runStars=0;updateHUD()}
function start(){build();mode='play';menu.classList.add('hidden');result.classList.add('hidden');hud.classList.add('show');touch.style.display='';$('#hint').style.display='';$('#best').textContent=best?`PERSONAL BEST  ${format(best)}`:'YOUR BEST RUN WILL SHOW HERE';last=performance.now()}
function format(t){let n=Math.floor(t);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}
function showToast(t){let e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),1250)}
function end(won){if(mode!=='play')return;mode=won?'win':'lose';$('#resultTag').textContent=won?'DOCK REACHED!':'SPLASH!';$('#resultTitle').textContent=won?'You stayed dry!':'The water wins…';$('#resultText').textContent=won?'A flawless crossing (well, almost). Ready for another tide trial?':'One little dip, and it’s back to the start. Time your jumps and keep moving!';$('#finalTime').textContent=format(elapsed);$('#finalStars').textContent=`${runStars} / ${stars.length}`;result.classList.remove('hidden');hud.classList.remove('show');touch.style.display='none';$('#hint').style.display='none';if(won&&(!best||elapsed<best)){best=elapsed;localStorage.setItem('dontSplashBest',best);$('#resultText').textContent='New personal best! You crossed the water without a single splash.'}}
function updateHUD(){$('#time').textContent=format(elapsed);$('#stars').textContent=`${runStars} / ${stars.length}`;$('#progress').style.width=`${Math.min(100,player.x/(W-80)*100)}%`}
function jump(){if(mode!=='play')return;if(player.ground||player.grace>0){player.vy=-640;player.ground=false;player.grace=0;sound(440,.07)}}
let audio;function sound(f,d){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();let o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch{}}
function update(dt){if(mode!=='play')return;elapsed+=dt;player.invuln=Math.max(0,player.invuln-dt);const dir=(keys.right?1:0)-(keys.left?1:0);player.vx+=dir*1750*dt;if(!dir)player.vx*=Math.pow(.001,dt);player.vx=Math.max(-260,Math.min(325,player.vx));player.x=Math.max(5,Math.min(W-45,player.x+player.vx*dt));player.vy+=1500*dt;let oldY=player.y;player.y+=player.vy*dt;player.ground=false;
for(const p of plats){if(player.x+player.w>p.x&&player.x<p.x+p.w&&oldY+player.h<=p.y+8&&player.y+player.h>=p.y&&player.vy>=0){player.y=p.y-player.h;player.vy=0;player.ground=true;player.grace=.12;if(p.goal){end(true);return}}}
if(!player.ground)player.grace=Math.max(0,player.grace-dt);
for(const s of stars)if(!s.got&&Math.abs(player.x+player.w/2-s.x)<27&&Math.abs(player.y+player.h/2-s.y)<35){s.got=true;runStars++;sound(760,.18);showToast('STAR FOUND! ✨')}
if(player.y>waterY+15){end(false);return}camera=Math.max(0,Math.min(W-cw,(player.x-cw*.34)));updateHUD();
}
function rr(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function draw(){const sky=ctx.createLinearGradient(0,0,0,ch);sky.addColorStop(0,'#102d50');sky.addColorStop(.64,'#3b91a8');sky.addColorStop(1,'#82d1c8');ctx.fillStyle=sky;ctx.fillRect(0,0,cw,ch);
// sun and distant islands
ctx.globalAlpha=.72;ctx.fillStyle='#ffe9a4';ctx.beginPath();ctx.arc(cw*.81,ch*.2,38,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
ctx.fillStyle='#3c8492';ctx.beginPath();ctx.moveTo(0,ch*.60);for(let x=0;x<=cw+40;x+=40)ctx.lineTo(x,ch*(.57+Math.sin(x*.009)*.025));ctx.lineTo(cw,ch);ctx.lineTo(0,ch);ctx.fill();
let yo=ch-640;ctx.save();ctx.translate(-camera,yo);
// water
let wg=ctx.createLinearGradient(0,waterY,0,640);wg.addColorStop(0,'#27b9c5');wg.addColorStop(.45,'#127d9f');wg.addColorStop(1,'#075072');ctx.fillStyle=wg;ctx.fillRect(camera,waterY,W,130);
ctx.strokeStyle='#b4fff080';ctx.lineWidth=2;for(let i=0;i<34;i++){let x=(i*173+elapsed*45)%(W+120)-40,y=waterY+18+(i*47)%110;ctx.beginPath();ctx.ellipse(x,y,13+(i%4)*4,2,0,0,Math.PI*2);ctx.stroke()}
// sandy horizon details
for(let i=0;i<13;i++){let x=i*315+30;ctx.globalAlpha=.12;ctx.fillStyle='#d9ffff';ctx.beginPath();ctx.ellipse(x,waterY+7,85,5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
// start and finish docks
for(const p of plats){ctx.fillStyle='rgba(0,28,44,.20)';ctx.beginPath();ctx.ellipse(p.x+p.w/2,p.y+18,p.w*.55,12,0,0,Math.PI*2);ctx.fill();let col=p.goal?'#f0c46e':p.type===1?'#96d17d':p.type===2?'#66c7b0':'#b8e288';rr(p.x,p.y,p.w,20,10,col);rr(p.x+8,p.y+3,p.w-16,5,3,'#ffffff55');ctx.fillStyle=p.goal?'#fff3b3':'#46785e';ctx.fillRect(p.x+12,p.y+16,p.w-24,4);
if(p.goal){ctx.fillStyle='#fff0a6';ctx.font='700 18px system-ui';ctx.fillText('FINISH',p.x+85,p.y-22);ctx.fillStyle='#ffe574';ctx.beginPath();ctx.moveTo(p.x+p.w-44,p.y-75);ctx.lineTo(p.x+p.w-44,p.y-7);ctx.lineTo(p.x+p.w-7,p.y-7);ctx.closePath();ctx.fill();ctx.fillStyle='#e87580';ctx.fillRect(p.x+p.w-44,p.y-75,2,70)} }
// collectible stars
for(const s of stars)if(!s.got){let sy=s.y+Math.sin(elapsed*3+s.phase)*6;ctx.save();ctx.translate(s.x,sy);ctx.rotate(elapsed*.9+s.phase);ctx.shadowColor='#ffe66d';ctx.shadowBlur=18;ctx.fillStyle='#ffe776';ctx.beginPath();for(let j=0;j<10;j++){let a=j*Math.PI/5,r=j%2?7:14;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.restore()}
// player shadow and cute runner
ctx.fillStyle='#002d4280';ctx.beginPath();ctx.ellipse(player.x+14,player.y+player.h+4,18,5,0,0,Math.PI*2);ctx.fill();
let bounce=player.ground?Math.sin(elapsed*13)*1.5:0,x=player.x,y=player.y+bounce;ctx.save();if(player.invuln>0&&Math.floor(elapsed*18)%2)ctx.globalAlpha=.38;
// legs
ctx.strokeStyle='#193c55';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+10,y+32);ctx.lineTo(x+8,y+40);ctx.moveTo(x+20,y+32);ctx.lineTo(x+22,y+40);ctx.stroke();
rr(x+3,y+11,23,24,9,'#ffb875');rr(x+3,y+20,23,13,7,'#ff708f');ctx.fillStyle='#ffcb95';ctx.beginPath();ctx.arc(x+14,y+9,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#15364b';ctx.beginPath();ctx.arc(x+10,y+8,1.4,0,7);ctx.arc(x+18,y+8,1.4,0,7);ctx.fill();ctx.strokeStyle='#a95a55';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x+14,y+10,3,0,Math.PI);ctx.stroke();ctx.fillStyle='#633e52';ctx.beginPath();ctx.arc(x+14,y+2,11,Math.PI,Math.PI*2);ctx.fill();ctx.restore();
ctx.restore();
// soft clouds drift above the course
for(let i=0;i<6;i++){let x=((i*270-elapsed*8-camera*.08)%(cw+320)+cw+320)%(cw+320)-100,y=75+(i%3)*49;ctx.globalAlpha=.22;ctx.fillStyle='#e3ffff';ctx.beginPath();ctx.ellipse(x,y,34,11,0,0,7);ctx.ellipse(x+22,y-5,22,13,0,0,7);ctx.ellipse(x+42,y,28,10,0,0,7);ctx.fill();ctx.globalAlpha=1}
if(mode==='paused'){ctx.fillStyle='#03112288';ctx.fillRect(0,0,cw,ch);rr(cw/2-145,ch/2-65,290,130,22,'#0b2947ee');ctx.textAlign='center';ctx.fillStyle='#f4fbff';ctx.font='600 35px Fredoka, sans-serif';ctx.fillText('PAUSED',cw/2,ch/2-3);ctx.fillStyle='#9fbccc';ctx.font='14px system-ui';ctx.fillText('Press ESC or tap Ⅱ to keep going',cw/2,ch/2+27);ctx.textAlign='left'}
}
function frame(now){let dt=Math.min(.035,(now-last)/1000||0);last=now;if(mode==='play')update(dt);draw();requestAnimationFrame(frame)}
$('#start').addEventListener('click',start);$('#again').addEventListener('click',start);$('#pause').addEventListener('click',()=>{if(mode==='play')mode='paused';else if(mode==='paused')mode='play'});
function keydown(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','a','A','d','D','w','W','Escape'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')keys.left=true;if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')keys.right=true;if([' ','ArrowUp','w','W'].includes(e.key))jump();if(e.key==='Escape'){if(mode==='play')mode='paused';else if(mode==='paused')mode='play'}}
function keyup(e){if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')keys.left=false;if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')keys.right=false}addEventListener('keydown',keydown);addEventListener('keyup',keyup);addEventListener('blur',()=>{keys.left=keys.right=false});
for(const b of touch.querySelectorAll('button')){const k=b.dataset.key;const down=e=>{e.preventDefault();if(k==='jump')jump();else keys[k]=true};const up=e=>{e.preventDefault();if(k!=='jump')keys[k]=false};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up)}
$('#best').textContent=best?`PERSONAL BEST  ${format(best)}`:'YOUR BEST RUN WILL SHOW HERE';build();last=performance.now();requestAnimationFrame(frame);
})();

