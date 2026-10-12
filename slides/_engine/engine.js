// 공통 슬라이드 엔진: 이동·단계(hooks)·노트·목록·전체화면·라이브 iframe 조작 모드, typer/wait/net 도우미, 미니 차트(canvas[data-chart])
const stage=document.getElementById('stage'),slides=[...document.querySelectorAll('.slide')];
let cur=0,step=0,t0=null;
function fit(){const ov=document.body.classList.contains('ov');const s=Math.min(innerWidth/1920,innerHeight/1080)*(ov?.98:1);stage.style.transform=`translate(-50%,-50%) scale(${s})`;layoutOverview(ov)}
// 목록 보기: 슬라이드를 격자로 배치한다 (5열)
function layoutOverview(ov){const cols=5,rows=Math.ceil(slides.length/cols),gap=24,cw=(1920-gap*(cols+1))/cols,sc=Math.min(cw/1920,(1080-gap*(rows+1))/rows/1080),ch=1080*sc,oy=(1080-rows*ch-gap*(rows+1))/2;
  slides.forEach((el,i)=>{el.style.transform=ov?`translate(${gap+(i%cols)*(cw+gap)}px,${oy+gap+Math.floor(i/cols)*(ch+gap)}px) scale(${sc})`:''})}
addEventListener('resize',fit);fit();
const hooks={};
function go(i){
  i=Math.max(0,Math.min(slides.length-1,i));
  slides[cur].querySelectorAll('.live.interact').forEach(l=>l.classList.remove('interact'));
  slides[cur].classList.remove('on');cur=i;const s=slides[i];
  // replay entrance
  s.querySelectorAll('[data-a]').forEach(e=>{e.style.transition='none';});
  void s.offsetWidth;s.querySelectorAll('[data-a]').forEach(e=>e.style.transition='');
  s.classList.add('on');
  document.getElementById('pg').textContent=`${i+1} / ${slides.length}`;
  document.getElementById('bar').style.width=`${(i+1)/slides.length*100}%`;
  document.getElementById('notes').textContent=s.dataset.notes||'';
  step=0;showStep();hooks[s.id]&&hooks[s.id](0);
  try{history.replaceState(null,'','#s'+(i+1))}catch(e){}
}
addEventListener('keydown',e=>{
  if(['ArrowRight','PageDown',' ','Enter'].includes(e.key)){e.preventDefault();fwd()}
  else if(['ArrowLeft','PageUp','Backspace'].includes(e.key)){e.preventDefault();go(cur-1)}
  else if(e.key==='n'||e.key==='N')toggleNotes();
  else if(e.key==='f'||e.key==='F')full();
  else if(e.key==='i'||e.key==='I')toggleInteract();
  else if(e.key==='o'||e.key==='O')overview();else if(e.key==='Home')go(0);else if(e.key==='End')go(slides.length-1);
});
document.getElementById('viewport').addEventListener('click',e=>{if(e.target.closest('button'))return;if(slides[cur].querySelector('.live.interact')){e.target.closest('.live')||toggleInteract();return}e.clientX>innerWidth/3?fwd():go(cur-1)});
document.getElementById('prev').onclick=()=>go(cur-1);
document.getElementById('next').onclick=fwd;
function steps(){return +(slides[cur].dataset.steps||0)}
function showStep(){const n=steps();document.getElementById('st').textContent=n?`▸ ${step}/${n}`:''}
function fwd(){t0??=Date.now();if(step<steps()){step++;showStep();hooks[slides[cur].id](step)}else go(cur+1)}
setInterval(()=>{if(t0==null)return;const e=Math.floor((Date.now()-t0)/1000);const tm=document.getElementById('tm');tm.textContent=String(e/60|0).padStart(2,'0')+':'+String(e%60).padStart(2,'0');tm.style.color=e>780?'#FF6B35':''},1000);
// 라이브 iframe 조작 모드: 켜면 iframe이 클릭·키보드를 받는다. 끄려면 iframe 바깥(슬라이드 여백)을 클릭한다.
function toggleInteract(){const l=slides[cur].querySelector('.live');if(!l||!l.querySelector('iframe'))return;l.classList.toggle('interact');if(!l.classList.contains('interact'))window.focus()}
function toggleNotes(){const n=document.getElementById('notes');n.hidden=!n.hidden}
document.getElementById('nt').onclick=toggleNotes;
function full(){try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{})}catch(e){}}
document.getElementById('fs').onclick=full;
function overview(){document.body.classList.toggle('ov');fit()}
document.getElementById('ov').onclick=overview;
slides.forEach((el,i)=>el.addEventListener('click',e=>{if(document.body.classList.contains('ov')){e.stopPropagation();document.body.classList.remove('ov');fit();go(i)}}));
let tx=0;addEventListener('touchstart',e=>tx=e.touches[0].clientX,{passive:true});
addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>50)d<0?fwd():go(cur-1)});

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
// typing helper with cancel token
function typer(el,text,speed=45){el._tok=(el._tok||0)+1;const t=el._tok;el.textContent='';let i=0;
  return new Promise(r=>{(function step(){if(el._tok!==t)return;el.textContent=text.slice(0,++i);if(i<text.length)setTimeout(step,reduce?0:speed);else r(t)})()})}
const wait=ms=>new Promise(r=>setTimeout(r,reduce?0:ms));

// network background
function net(id){const c=document.getElementById(id),x=c.getContext('2d');c.width=1920;c.height=1080;
  const P=Array.from({length:70},()=>({x:Math.random()*1920,y:Math.random()*1080,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6}));
  (function f(){x.clearRect(0,0,1920,1080);
    for(const p of P){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>1920)p.vx*=-1;if(p.y<0||p.y>1080)p.vy*=-1}
    for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=P[i],b=P[j],d=Math.hypot(a.x-b.x,a.y-b.y);
      if(d<220){x.strokeStyle=`rgba(79,179,255,${(1-d/220)*.25})`;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}}
    for(const p of P){x.fillStyle='rgba(255,107,53,.7)';x.beginPath();x.arc(p.x,p.y,2.5,0,7);x.fill()}
    if(!reduce)requestAnimationFrame(f)})()}


// live mini charts
const charts=[...document.querySelectorAll('canvas[data-chart]')].map(c=>{
  const r=c.getBoundingClientRect();return{c,x:c.getContext('2d'),type:c.dataset.chart,col:c.dataset.c||'#FF6B35',d:Array.from({length:60},(_,i)=>50+Math.sin(i/5)*20+Math.random()*15),pts:[]}});
function size(o){const w=o.c.clientWidth||400,h=o.c.clientHeight||150;if(o.c.width!==w*2){o.c.width=w*2;o.c.height=h*2}return[o.c.width,o.c.height]}
let tick=0;
function draw(){tick++;
  for(const o of charts){if(!o.c.closest('.slide.on'))continue;const[w,h]=size(o),x=o.x;x.clearRect(0,0,w,h);
    if(tick%6===0){o.d.shift();o.d.push(Math.max(5,Math.min(95,o.d[o.d.length-1]+(Math.random()-.5)*18)))}
    if(o.type==='line'){x.beginPath();o.d.forEach((v,i)=>{const px=i/(o.d.length-1)*w,py=h-v/100*h;i?x.lineTo(px,py):x.moveTo(px,py)});
      x.strokeStyle=o.col;x.lineWidth=4;x.stroke();x.lineTo(w,h);x.lineTo(0,h);x.fillStyle=o.col+'22';x.fill()}
    else if(o.type==='bars'){const n=12,bw=w/n;for(let i=0;i<n;i++){const v=o.d[o.d.length-n+i];x.fillStyle=o.c.dataset.c||(v>75?'#FF6B35':'#4FB3FF');x.fillRect(i*bw+6,h-v/100*h,bw-12,v/100*h)}}
    else if(o.type==='heat'){const cols=30,rows=6,cw=w/cols,rh=h/rows;for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
      const v=(Math.sin((i+tick/20)/3+j)+1)/2;x.fillStyle=`rgba(255,107,53,${.12+v*.8})`;x.fillRect(i*cw+2,j*rh+2,cw-4,rh-4)}}
    else if(o.type==='xview'){if(o.pts.length<400||tick%2===0){for(let k=0;k<3;k++)o.pts.push({t:tick,y:Math.random()<.08?Math.random()*.9:Math.random()*.3})}
      o.pts=o.pts.filter(p=>tick-p.t<300);for(const p of o.pts){const px=w-(tick-p.t)/300*w,py=h-p.y*h-4;x.fillStyle=p.y>.6?'#FF6B35':p.y>.3?'#FFC24B':'#4FB3FF';x.fillRect(px,py,5,5)}}
  }
  requestAnimationFrame(draw)}
draw();
