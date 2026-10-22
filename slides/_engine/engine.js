// 공통 슬라이드 엔진: 이동·단계(hooks)·노트·목록·전체화면·라이브 iframe 조작 모드, typer/wait/net 도우미, 미니 차트(canvas[data-chart])
const stage=document.getElementById('stage'),slides=[...document.querySelectorAll('.slide')];
let cur=0,step=0,t0=null;
function fit(){const ov=document.body.classList.contains('ov');const s=Math.min(innerWidth/1920,innerHeight/1080)*(ov?.98:1);stage.style.transform=`translate(-50%,-50%) scale(${s})`;stage.style.visibility="visible";layoutOverview(ov)}
// 목록 보기: 슬라이드를 격자로 배치한다 (5열)
function layoutOverview(ov){const cols=5,rows=Math.ceil(slides.length/cols),gap=24,cw=(1920-gap*(cols+1))/cols,sc=Math.min(cw/1920,(1080-gap*(rows+1))/rows/1080),ch=1080*sc,oy=(1080-rows*ch-gap*(rows+1))/2;
  slides.forEach((el,i)=>{el.style.transform=ov?`translate(${gap+(i%cols)*(cw+gap)}px,${oy+gap+Math.floor(i/cols)*(ch+gap)}px) scale(${sc})`:''})}
addEventListener('resize',fit);fit();
const hooks={};
// ?preview=1: 발표 중 대본(stage) 화면 오른쪽에 작게 넣는 미리보기. 조작 막대를 숨기고 각 장의 마지막 단계(완성된 화면)를 보여 준다
const PREVIEW=new URLSearchParams(location.search).has('preview');
if(PREVIEW)document.body.classList.add('preview');
function go(i){
  i=Math.max(0,Math.min(slides.length-1,i));
  slides[cur].querySelectorAll('.live.interact').forEach(l=>l.classList.remove('interact'));
  slides[cur].classList.remove('on');cur=i;const s=slides[i];
  // replay entrance
  s.querySelectorAll('[data-a]').forEach(e=>{e.style.transition='none';});
  void s.offsetWidth;s.querySelectorAll('[data-a]').forEach(e=>e.style.transition='');
  s.classList.add('on');
  document.getElementById('pg').textContent=`${i+1} / ${slides.length}`;
  // 발표자만 아는 표시: 개요 뒤에 부연 설명이 있는 장은 진행 막대 색이 바뀐다(engine.css)
  document.getElementById('pg').dataset.kind=s.dataset.scriptKind==='overview'?'overview':'detail';
  document.getElementById('bar').style.width=`${(i+1)/slides.length*100}%`;
  hideNextHint();
  // data-autoplay 장은 들어오자마자 모든 단계를 순서대로 자동 재생한다(→ 는 바로 다음 장)
  // 다시 들어와도 처음부터 재생되게, 이전 방문에서 나타난 단계 요소를 되돌린다
  s.querySelectorAll('[data-step]').forEach(e=>{e.classList.remove('shown','typing','translated');clearTimeout(e._t);clearTimeout(e._tr)});
  step=s.hasAttribute('data-autoplay')||PREVIEW?steps():0;showStep();hooks[s.id]&&hooks[s.id](step);
  try{history.replaceState(null,'','#s'+(i+1))}catch(e){}
}
addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(e.target.closest('button,a')&&[' ','Enter'].includes(e.key))return;
  if(['ArrowRight','PageDown',' ','Enter'].includes(e.key)){e.preventDefault();fwd()}
  else if(['ArrowLeft','PageUp','Backspace'].includes(e.key)){e.preventDefault();go(cur-1)}
  else if(e.code==='KeyF')full();
  else if(e.code==='KeyI')toggleInteract();
  else if(e.code==='KeyT'){const tr=[...slides[cur].querySelectorAll('.msg.tr.shown')];const to=!tr.every(m=>m.classList.contains('translated'));tr.forEach(m=>m.classList.toggle('translated',to));scrollChat(slides[cur])}
  else if(e.code==='KeyO')overview();else if(e.key==='Home')go(0);else if(e.key==='End')go(slides.length-1);
});
document.getElementById('viewport').addEventListener('click',e=>{if(e.target.closest('button'))return;if(slides[cur].querySelector('.live.interact')){e.target.closest('.live')||toggleInteract();return}e.clientX>innerWidth/3?fwd():go(cur-1)});
document.getElementById('prev').onclick=()=>go(cur-1);
document.getElementById('next').onclick=fwd;
function steps(){return +(slides[cur].dataset.steps||0)}
// 단계 표시. data-step="N" 인 요소는 N 단계부터 보이고(.shown), .chat 은 새 메시지가 보이도록 아래로 스크롤한다.
const TR_HOLD=1500; // 원문(한국어)이 보인 뒤 번역 스트리밍을 시작하기까지
// 번역 전환: 말풍선 전체를 한 번에 크로스페이드한다. 원문(.ko)과 번역(.ja)을 CSS 에서 같은 칸에 겹쳐 두어 말풍선 크기가 바뀌지 않는다.
function streamTranslate(e,done){e.classList.add('translated');done()}
function showStep(){const n=steps();document.getElementById('st').textContent=n?`▸ ${step}/${n}`:'';
  const s=slides[cur];
  // 이번 단계에서 새로 나타나는 채팅 메시지는 하나씩: 내 말풍선은 바로, AI 말풍선은 '입력 중…' 뒤에 나타난다
  // at[단계] = 그 단계 채팅이 끝나는 시각. 채팅이 아닌 [data-step](캡처·화면)은 자기 단계의 채팅이 끝난 뒤 나타난다
  let delay=0;const at={};
  s.querySelectorAll('[data-step]').forEach(e=>{const show=+e.dataset.step<=step,was=e.classList.contains('shown');
    if(!show){e.classList.remove('shown','typing','translated','streaming','streamed');e.querySelector('.st')?.remove();e._tok=(e._tok||0)+1;clearTimeout(e._t);clearTimeout(e._tr);return}
    if(was)return;
    if(e.matches('.chat .msg')&&!reduce){const ai=e.classList.contains('ai');
      e._t=setTimeout(()=>{e.classList.add('shown');if(ai){e.classList.add('typing');e._t=setTimeout(()=>{e.classList.remove('typing');scrollChat(s)},900)}scrollChat(s)},delay);
      // .tr 말풍선: 원문(한국어)이 먼저 보이고, 잠시 뒤 번역(일본어)으로 바뀐다
      // 원문(한국어)을 TR_HOLD ms 동안 읽을 수 있게 보여 준 뒤 번역(일본어)으로 바꾼다
      if(e.classList.contains('tr'))e._tr=setTimeout(()=>streamTranslate(e,()=>scrollChat(s)),delay+(ai?900:0)+TR_HOLD);
      delay+=(+e.dataset.hold||0)+(e.classList.contains('tr')?(ai?900:0)+TR_HOLD+700:(ai?1500:500));at[e.dataset.step]=delay}
    else{e._t=setTimeout(()=>e.classList.add('shown'),at[e.dataset.step]??delay)}});
  scrollChat(s);
  // 단계 연출(채팅 등)이 모두 끝나면 '다음 장' 안내를 띄운다
  // 모든 장 공통: 마지막 단계까지 왔으면 연출이 끝난 뒤 띄운다. 영상 장(.playlist)은 영상이 끝날 때 따로 띄운다.
  clearTimeout(s._doneT);if(step>=steps()&&!s.querySelector('.playlist')){const wait=s.querySelector('[data-step]')?delay+900:(hooks[s.id]?2500:1200);s._doneT=setTimeout(()=>{if(slides[cur]===s)showNextHint()},wait)}}
function scrollChat(s){
  // data-active-step="N": 지금 보이는 마지막 채팅 메시지의 단계와 같은 요소를 강조한다(예: 오른쪽 설명 카드)
  const lastMsg=[...s.querySelectorAll('.chat .msg[data-step].shown')].pop();
  s.querySelectorAll('[data-active-step]').forEach(el=>el.classList.toggle('active',!!lastMsg&&el.dataset.activeStep===lastMsg.dataset.step));
  // 처음에는 맨 위부터 보여 주고, 새 메시지가 아래로 넘칠 때만 그 메시지의 '시작'이 보이도록 올린다(끝부분만 보이지 않게)
  s.querySelectorAll('.chat').forEach(c=>{const last=[...c.querySelectorAll('[data-step].shown')].pop();
    if(!last){c.scrollTop=0;return}
    const top=last.offsetTop,bottom=top+last.offsetHeight;
    if(bottom>c.scrollTop+c.clientHeight)c.scrollTo({top:Math.max(0,top-16),behavior:reduce?'auto':'smooth'})})}
function fwd(){t0??=Date.now();if(step<steps()){step++;showStep();hooks[slides[cur].id]&&hooks[slides[cur].id](step)}else go(cur+1)}
setInterval(()=>{if(t0==null)return;const e=Math.floor((Date.now()-t0)/1000);const tm=document.getElementById('tm');tm.textContent=String(e/60|0).padStart(2,'0')+':'+String(e%60).padStart(2,'0');tm.style.color=e>780?'#F6A621':''},1000);
// 라이브 iframe 조작 모드: 켜면 iframe이 클릭·키보드를 받는다. 끄려면 iframe 바깥(슬라이드 여백)을 클릭한다.
function toggleInteract(){const l=slides[cur].querySelector('.live');if(!l||!l.querySelector('iframe'))return;l.classList.toggle('interact');if(!l.classList.contains('interact'))window.focus()}
function full(){try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{})}catch(e){}}
document.getElementById('fs').onclick=full;
function overview(){document.body.classList.toggle('ov');fit()}
document.getElementById('ov').onclick=overview;
slides.forEach((el,i)=>el.addEventListener('click',e=>{if(document.body.classList.contains('ov')){e.stopPropagation();document.body.classList.remove('ov');fit();go(i)}}));
// 대본의 세로 스크롤·핀치 확대는 슬라이드 이동으로 처리하지 않는다.
const touchViewport=document.getElementById('viewport');let swipeStart=null;
touchViewport.addEventListener('touchstart',e=>{
  swipeStart=e.touches.length===1&&!e.target.closest('button,a,input,textarea,select,.live.interact,.playlist')
    ?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;
},{passive:true});
touchViewport.addEventListener('touchend',e=>{
  const start=swipeStart;swipeStart=null;if(!start||e.touches.length||e.changedTouches.length!==1)return;
  const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
  if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.25)dx<0?fwd():go(cur-1);
},{passive:true});
touchViewport.addEventListener('touchcancel',()=>{swipeStart=null},{passive:true});

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
    for(const p of P){x.fillStyle='rgba(154,145,230,.8)';x.beginPath();x.arc(p.x,p.y,2.5,0,7);x.fill()}
    if(!reduce)requestAnimationFrame(f)})()}


// 움직이는 목업 차트: <canvas data-chart="line|bars|heat|xview" data-c="#색" data-max="100" data-unit="ms">
// line·bars·xview 는 Y축 눈금(0·절반·최대)과 X축(시간)을 같이 그린다. 축 색은 테마 토큰(--sub, --line)을 따른다.
const charts=[...document.querySelectorAll('canvas[data-chart]')].map(c=>({c,x:c.getContext('2d'),type:c.dataset.chart,col:c.dataset.c||'#9A91E6',max:+(c.dataset.max||100),unit:c.dataset.unit||'',d:Array.from({length:60},(_,i)=>50+Math.sin(i/5)*20+Math.random()*15),pts:[]}));
function size(o){const w=o.c.clientWidth||400,h=o.c.clientHeight||150;if(o.c.width!==w*2){o.c.width=w*2;o.c.height=h*2}return[o.c.width,o.c.height]}
const tokens={};
function token(name,fb){return tokens[name]??=(getComputedStyle(document.documentElement).getPropertyValue(name).trim()||fb)}
const AX={l:92,b:42,t:12,r:8};
// 축 글자: 1000ms 이상은 초(s), 그 외 1000 이상은 k
function fmt(v,unit){if(v<1000)return Math.round(v)+unit;const n=(v/1000).toFixed(v%1000?1:0);return unit==='ms'?n+'s':n+'k'+unit}
// 축과 격자를 그리고 그림 영역 {x,y,w,h} 를 돌려준다
function axes(x,w,h,max,unit,xl){const sub=token('--sub','#8E9CB3'),line=token('--line','#24344F'),pw=w-AX.l-AX.r,ph=h-AX.t-AX.b;
  x.font='500 26px '+token('--mono','monospace');x.textBaseline='middle';
  for(const f of [0,.5,1]){const y=AX.t+ph-f*ph;x.strokeStyle=line;x.lineWidth=f?1:2;x.globalAlpha=f?.6:1;x.beginPath();x.moveTo(AX.l,y);x.lineTo(w-AX.r,y);x.stroke();x.globalAlpha=1;
    x.fillStyle=sub;x.textAlign='right';x.fillText(fmt(max*f,unit),AX.l-14,y)}
  x.textBaseline='alphabetic';xl.forEach((t,i)=>{x.textAlign=i===0?'left':i===xl.length-1?'right':'center';x.fillText(t,AX.l+pw*i/(xl.length-1),h-4)});
  return{x:AX.l,y:AX.t,w:pw,h:ph}}
let tick=0;
function draw(){tick++;
  for(const o of charts){if(!o.c.closest('.slide.on'))continue;const[w,h]=size(o),x=o.x;x.clearRect(0,0,w,h);
    // 데이터는 약 1초마다 한 칸씩만 흐른다(너무 빨리 움직이지 않게)
    if(tick%60===0){o.d.shift();o.d.push(Math.max(5,Math.min(95,o.d[o.d.length-1]+(Math.random()-.5)*14)))}
    if(o.type==='line'){const a=axes(x,w,h,o.max,o.unit,['-10m','-5m','now']);x.beginPath();o.d.forEach((v,i)=>{const px=a.x+i/(o.d.length-1)*a.w,py=a.y+a.h-v/100*a.h;i?x.lineTo(px,py):x.moveTo(px,py)});
      x.strokeStyle=o.col;x.lineWidth=4;x.lineJoin='round';x.stroke();x.lineTo(a.x+a.w,a.y+a.h);x.lineTo(a.x,a.y+a.h);x.fillStyle=o.col+'22';x.fill()}
    else if(o.type==='bars'){const a=axes(x,w,h,o.max,o.unit,['-12m','-6m','now']),n=12,bw=a.w/n;for(let i=0;i<n;i++){const v=o.d[o.d.length-n+i];x.fillStyle=o.c.dataset.c||(v>75?'#F6A621':'#4FB3FF');x.fillRect(a.x+i*bw+6,a.y+a.h-v/100*a.h,bw-12,v/100*a.h)}}
    else if(o.type==='eq'){// 제니퍼 액티브 서비스 이퀄라이저: X축은 대상(인스턴스), 막대는 서비스 1건씩 쌓인 칸, 색은 경과 시간 구간
      const names=(o.c.dataset.names||'gw-01,gw-02,order-api,payment,member,batch').split(','),n=names.length;
      if(!o.eq||tick%120===0){o.eq=names.map((_,i)=>{const cnt=Math.max(0,Math.round((o.eq?.[i]?.length??3)+(Math.random()-.5)*3));return Array.from({length:Math.min(cnt,9)},()=>{const r=Math.random();return r<.55?0:r<.78?1:r<.92?2:3}).sort((p,q)=>q-p)})}
      const sub=token('--sub','#8E9CB3'),line=token('--line','#24344F'),pw=w-16,ph=h-AX.b-34,cw=pw/n,seg=Math.min(22,ph/10),cols=['#3D9BFF','#3DDC97','#F6A621','#E5484D'];
      x.strokeStyle=line;x.lineWidth=2;x.beginPath();x.moveTo(8,34+ph);x.lineTo(w-8,34+ph);x.stroke();
      x.font='500 24px '+token('--mono','monospace');x.textAlign='center';
      o.eq.forEach((arr,i)=>{const cx=8+i*cw,bw=cw*.62,bx=cx+(cw-bw)/2;
        arr.forEach((c,k)=>{x.fillStyle=cols[c];x.fillRect(bx,34+ph-(k+1)*seg+3,bw,seg-6)});
        x.fillStyle=token('--fg','#EEF1F6');x.font='700 26px '+token('--mono','monospace');x.fillText(arr.length,cx+cw/2,34+ph-arr.length*seg-10);
        x.fillStyle=sub;x.font='500 22px '+token('--mono','monospace');x.fillText(names[i],cx+cw/2,h-6)})}
    else if(o.type==='heat'){const cols=30,rows=6,cw=w/cols,rh=h/rows;for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
      const v=(Math.sin((i+tick/20)/3+j)+1)/2;x.fillStyle=`rgba(154,145,230,${.12+v*.8})`;x.fillRect(i*cw+2,j*rh+2,cw-4,rh-4)}}
    else if(o.type==='xview'){const a=axes(x,w,h,+(o.c.dataset.max||8000),o.c.dataset.unit||'ms',['-5m','-2.5m','now']);
      if(o.pts.length<400||tick%2===0){for(let k=0;k<3;k++)o.pts.push({t:tick,y:Math.random()<.08?Math.random()*.9:Math.random()*.3})}
      o.pts=o.pts.filter(p=>tick-p.t<300);for(const p of o.pts){const px=a.x+a.w-(tick-p.t)/300*a.w,py=a.y+a.h-p.y*a.h-4;x.fillStyle=p.y>.6?'#FF6B35':p.y>.3?'#FFC24B':'#4FB3FF';x.fillRect(px,py,5,5)}}
  }
  requestAnimationFrame(draw)}
draw();

// playlist: 슬라이드가 보일 때 영상을 차례로 재생하고, 다른 장으로 가면 멈춘다. 탭을 누르면 그 영상으로 이동.
(function(){
  const lists=[...document.querySelectorAll('.playlist')];
  for(const pl of lists){
    const v=pl.querySelector('video'),tabs=[...pl.querySelectorAll('.pl-tabs li')];let idx=0;
    const start=()=>{tabs.forEach((t,k)=>t.classList.toggle('on',k===idx));pl.dataset.o=tabs[idx].dataset.orient||'';v.src=tabs[idx].dataset.src;v.play().catch(()=>{})};
    // data-orient 가 portrait ↔ landscape 로 바뀌면 휴대폰이 90도 도는 전환을 넣는다(영상 속 휴대폰 위치에 맞춘 윤곽)
    const phone=document.createElement('div');phone.className='pl-phone';pl.querySelector('.pl-stage')?.appendChild(phone);
    const dim=document.createElement('div');dim.className='pl-dim';pl.querySelector('.pl-stage')?.appendChild(dim);
    let busy=false;
    const play=(i,force)=>{const next=(i+tabs.length)%tabs.length,from=tabs[idx]?.dataset.orient,to=tabs[next].dataset.orient;
      const turn=!force&&from&&to&&from!==to&&!reduce&&phone.isConnected;idx=next;
      if(!turn||busy){start();return}
      busy=true;v.pause();pl.classList.add('turning');phone.className='pl-phone '+from;void phone.offsetWidth;
      requestAnimationFrame(()=>{phone.className='pl-phone '+to+' go'});
      setTimeout(()=>{start();setTimeout(()=>{pl.classList.remove('turning');phone.className='pl-phone';busy=false},250)},900)};
    v.addEventListener('ended',()=>{if(idx===tabs.length-1&&slides[cur]===pl.closest('.slide'))showNextHint();play(idx+1)});
    // data-max="초": 그 시간까지만 재생하고 다음 영상으로 (긴 영상을 줄여 보여줄 때)
    v.addEventListener('timeupdate',()=>{const max=+tabs[idx].dataset.max||v.duration;if(!max)return;
      tabs[idx].style.setProperty('--p',Math.min(100,v.currentTime/max*100)+'%');
      if(tabs[idx].dataset.max&&v.currentTime>=max){if(idx===tabs.length-1)showNextHint();play(idx+1)}});
    tabs.forEach((t,k)=>t.addEventListener('click',e=>{e.stopPropagation();play(k)}));
    pl.addEventListener('click',e=>e.stopPropagation());
    const slide=pl.closest('.slide');let wasOn=false;
    setInterval(()=>{const on=slide.classList.contains('on')&&!document.body.classList.contains('ov');
      if(on&&!wasOn){idx=0;play(0,true)} else if(!on&&wasOn)v.pause(); wasOn=on},300);
  }
})();


// '다음 장' 안내: 채팅·영상 장이 끝나면 오른쪽에 반투명 큰 화살표. 누르면 다음 장
const nextHint=document.createElement('button');nextHint.id='next-hint';nextHint.setAttribute('aria-label','次へ');nextHint.innerHTML='<span>NEXT</span><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
nextHint.addEventListener('click',e=>{e.stopPropagation();go(cur+1)});document.body.appendChild(nextHint);
function showNextHint(){if(cur<slides.length-1&&!document.body.classList.contains('ov')){nextHint.classList.toggle('on-sec',slides[cur].classList.contains('sec'));nextHint.classList.add('show')}}
function hideNextHint(){nextHint.classList.remove('show');slides.forEach(s=>clearTimeout(s._doneT))}

// 주소의 #sN 으로 그 장을 연다. 미리보기 iframe 은 대본 화면이 장을 넘길 때 #sN 만 바꾸므로 hashchange 로 따라간다
// deck.js 의 hooks 가 등록된 뒤에 이동하도록 DOMContentLoaded 에서 처음 한 번 맞춘다
function fromHash(){const m=/^#s(\d+)$/.exec(location.hash);if(m&&+m[1]-1!==cur)go(+m[1]-1);else if(PREVIEW&&cur===0&&!m)go(0)}
addEventListener('hashchange',fromHash);
addEventListener('DOMContentLoaded',fromHash);
