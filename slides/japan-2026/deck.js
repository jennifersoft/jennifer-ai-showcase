// 이 덱 전용: 배경 네트워크 캔버스와 슬라이드별 단계 연출(hooks)
net('net');net('net2');

// slide 5: step1 prompt, step2 AI tile flies in
hooks['s-dash']=st=>{const t=document.getElementById('aiTile'),p=document.getElementById('ptext');
  if(st===0){t.classList.remove('in');p._tok=(p._tok||0)+1;p.textContent=''}
  // 프롬프트 입력이 끝나면 다음을 누르지 않아도 위젯이 들어온다
  if(st===1)typer(p,'PagerDutyのインシデントをダッシュボードに表示して',45).then(k=>{if(p._tok===k&&slides[cur].id==='s-dash'&&step===1)setTimeout(()=>{if(p._tok===k&&step===1)fwd()},500)});
  if(st===2){p._tok++;p.textContent='PagerDutyのインシデントをダッシュボードに表示して';t.classList.add('in')}};

// slide 7: particles flowing both ways
(function(){const c=document.getElementById('flow'),x=c.getContext('2d');c.width=1920;c.height=1080;const P=[];
  (function f(){if(document.getElementById('s-both').classList.contains('on')){
    if(Math.random()<.5)P.push({x:700,y:560+Math.random()*40,v:6+Math.random()*4,c:'#9A91E6'});
    if(Math.random()<.5)P.push({x:1220,y:680+Math.random()*40,v:-(6+Math.random()*4),c:'#4FB3FF'});
    x.clearRect(0,0,1920,1080);
    for(const p of P){p.x+=p.v;x.fillStyle=p.c;x.globalAlpha=.9;x.beginPath();x.arc(p.x,p.y,5,0,7);x.fill();
      x.globalAlpha=.25;x.fillRect(p.v>0?p.x-40:p.x,p.y-1.5,40,3)}x.globalAlpha=1;
    for(let i=P.length-1;i>=0;i--)if(P[i].x>1230||P[i].x<690)P.splice(i,1)}
    requestAnimationFrame(f)})()})();

// slide 9: adapter pipeline
const CODE=[
['c','// PagerDutyAdapter.kt（実際のコードから抜粋）'],
['k','class'],[' ',' PagerDutyAdapter : EventHandler {\n'],
[' ','  '],['k','override fun'],[' ',' on(eventData: Array<EventData>) {\n'],
[' ','    '],['k','val'],[' ',' properties = ConfUtil.getPagerDutyProperties()\n'],
[' ','    if (properties.integrationKey.isNullOrEmpty()) {\n      LogUtil.error('],['s','"PagerDuty integration_key is not configured."'],[' ',')\n      return\n    }\n'],
[' ','    for (event in eventData) {\n'],
[' ','      '],['k','val'],[' ',' pdData = PagerDutyData(properties, event)\n'],
[' ','      PagerDutyClient(pdData).push()  '],['c','// Events API v2'],
[' ','    }\n  }\n}']];
hooks['s-adapter']=async st=>{
  const P='JENNIFERの障害イベントをPagerDutyに送るアダプターを作って';
  const p=document.getElementById('ptext2'),code=document.getElementById('code'),toast=document.getElementById('toast'),steps=[...document.querySelectorAll('.step')];
  const run=code._run=(code._run||0)+1,alive=()=>code._run===run&&cur===slides.indexOf(document.getElementById('s-adapter'));
  document.getElementById('pdshot').classList.toggle('in',st===5);
  if(st===0){toast.classList.remove('in');steps.forEach(s=>s.classList.remove('done'));code.innerHTML='';delete code.dataset.done;p._tok=(p._tok||0)+1;p.textContent='';return}
  // 프롬프트 입력이 끝나면 다음을 누르지 않아도 코드 생성(답변)이 시작된다
  if(st===1){typer(p,P,45).then(k=>{if(p._tok===k&&alive()&&step===1)setTimeout(()=>{if(p._tok===k&&alive()&&step===1)fwd()},500)});return}
  p._tok++;p.textContent=P;
  if(st===2){code.innerHTML='';for(const[cls,txt]of CODE){const sp=document.createElement('span');if(cls!==' ')sp.className=cls;code.appendChild(sp);
    for(const ch of txt){if(!alive())return;sp.textContent+=ch;await wait(10)}if(cls==='c')code.appendChild(document.createTextNode('\n'))}code.dataset.done='1';steps[0].classList.add('done');return}
  const full=()=>{if(code.dataset.done)return;code.innerHTML='';for(const[cls,txt]of CODE){const sp=document.createElement('span');if(cls!==' ')sp.className=cls;sp.textContent=txt;code.appendChild(sp);if(cls==='c')code.appendChild(document.createTextNode('\n'))}code.dataset.done='1'};
  if(st>=3)full();
  if(st===3){for(let i=0;i<3;i++){if(!alive())return;steps[i].classList.add('done');await wait(450)}return}
  if(st>=4){steps.forEach(s=>s.classList.add('done'));toast.classList.add('in')}};
