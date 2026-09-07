(function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const norm=s=>(s??'').toString().trim().toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[.!,:;?]+$/g,'').replace(/\s+/g,' ');
const esc=s=>(s??'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function markup(mount){
  mount.innerHTML=`<div class="kp-game"><div class="kp-world"></div><div class="kp-stars"></div><div class="kp-decor"></div><div class="kp-vignette"></div><header class="kp-topbar"><div class="kp-mission"><small>ТЕКУЩАЯ КОМАНДА</small><strong class="missionText">Загрузка…</strong><span class="groupCount"></span></div><div class="kp-score"><div class="kp-pill"><b class="scoreVal">0</b><span>очков</span></div><div class="kp-pill"><b class="errVal">0</b><span>ошибок</span></div></div></header><div class="kp-toast" role="status"></div><div class="kp-field"></div><div class="kp-beam"></div><div class="kp-vacuum"><img src="assets/vacuum.png" alt="Космический пылесос"></div><div class="kp-controls"><label class="themeControl">Тема <select class="themeSelect" aria-label="Выберите тему"><option value="parts-of-speech-demo">Части речи</option><option value="participle-suffixes">Суффиксы причастий</option></select></label><label class="speedControl">Скорость <input class="speedRange" type="range" min="0.35" max="1.65" step="0.05"></label><button class="kp-btn grabBtn">Захват</button><button class="kp-btn soundBtn">Звук: вкл.</button><button class="kp-btn repairBtn">Ремонтный отсек</button><button class="kp-btn cherry resetBtn">Сбросить</button></div><div class="kp-modal"><div class="kp-panel"><h2>Ремонтный отсек</h2><p class="sub">Исправь ошибки полёта. Регистр и знак вопроса не мешают проверке.</p><div class="kp-summary"></div><div class="repairList"></div><div class="panelActions"><button class="kp-btn closeRepair">Вернуться в полёт</button></div></div></div></div>`;
  return mount.firstElementChild;
}

function start(config,opts={}){
  if(!config?.groups?.length)throw Error('В упражнении нет гнёзд');
  const mount=typeof opts.mount==='string'?document.querySelector(opts.mount):(opts.mount||document.body);
  const root=markup(mount),q=s=>root.querySelector(s),field=q('.kp-field'),world=q('.kp-world'),decor=q('.kp-decor'),vac=q('.kp-vacuum'),beam=q('.kp-beam'),mission=q('.missionText'),count=q('.groupCount'),toast=q('.kp-toast'),scoreEl=q('.scoreVal'),errEl=q('.errVal'),range=q('.speedRange'),themeSelect=q('.themeSelect'),modal=q('.kp-modal'),list=q('.repairList'),summary=q('.kp-summary');
  const key='kp:progress:'+(config.id||'game');
  const answerOf=item=>(item.repairAnswer??(Array.isArray(item.repairAnswers)?item.repairAnswers[0]:item.repairAnswers)??'').toString().trim();
  const repairOptions=[...new Map([...config.groups.flatMap(g=>(g.items||[]).map(answerOf)),...(config.repairOptions||[])].map(x=>(x??'').toString().trim()).filter(Boolean).map(x=>[x,x])).values()];
  const shuffled=values=>{const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out};
  const state={groupIndex:0,items:[],errors:[],score:0,speed:clamp(+config.speed||.75,.35,1.65),pointer:{x:innerWidth*.52,y:innerHeight*.58},vac:{x:innerWidth*.52,y:innerHeight*.58},facing:-1,cameraX:0,last:performance.now(),running:true,active:false,muted:false,finished:false,decor:[]};
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved)Object.assign(state,saved)}catch(e){}
  state.items=[];state.decor=[];state.groupIndex=clamp(+state.groupIndex||0,0,config.groups.length-1);state.speed=clamp(+state.speed||.75,.35,1.65);
  const bounds=()=>{const r=root.getBoundingClientRect();return{w:r.width,h:r.height,left:r.left,top:r.top,worldW:r.width*3.8}};
  const save=()=>{try{localStorage.setItem(key,JSON.stringify({groupIndex:state.groupIndex,errors:state.errors,score:state.score,speed:state.speed,muted:state.muted,finished:state.finished,cameraX:state.cameraX}))}catch(e){}};
  let audio;
  function sound(type){if(state.muted)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const n=audio.currentTime,g=audio.createGain(),o=audio.createOscillator(),s={ok:[260,760,.32,'sine'],bad:[155,105,.27,'square'],burst:[90,440,.52,'sine'],suck:[520,130,.42,'triangle']}[type];o.type=s[3];o.frequency.setValueAtTime(s[0],n);o.frequency.exponentialRampToValueAtTime(s[1],n+s[2]);g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(type==='bad'?.06:.13,n+.02);g.gain.exponentialRampToValueAtTime(.0001,n+s[2]);o.connect(g);g.connect(audio.destination);o.start(n);o.stop(n+s[2]+.03)}catch(e){}}
  function msg(text){toast.textContent=text;toast.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>toast.classList.remove('show'),1400)}
  function anchor(){const r=vac.getBoundingClientRect(),b=root.getBoundingClientRect();return{x:r.left-b.left+r.width*(state.facing>0?.8:.2),y:r.top-b.top+r.height*.5}}

  function addDecor(){
    const src=['decor_comet.png','decor_crystal_cluster.png','decor_orb_rock.png'],b=bounds();
    for(let i=0;i<14;i++){
      const el=document.createElement('img'),type=i%3,depth=.32+Math.random()*.82,near=depth>.78;
      el.src='assets/'+src[type];el.alt='';el.className='decor-object';decor.appendChild(el);
      state.decor.push({el,wx:Math.random()*b.worldW,y:90+Math.random()*(b.h-180),vx:(type?10:65)*(Math.random()<.5?-1:1)*(1+Math.random()),vy:(Math.random()-.5)*8,rot:Math.random()*360,vr:(Math.random()-.5)*7,depth,size:((type?68:86)+Math.random()*100)*(near?1.2:.88)});
    }
  }
  function burst(x,y){sound('burst');const el=document.createElement('div');el.className='kp-burst';el.style.cssText=`left:${x}px;top:${y}px`;field.appendChild(el);for(let i=0;i<18;i++){const p=document.createElement('i');p.style.setProperty('--a',i*20+'deg');p.style.setProperty('--d',55+Math.random()*95+'px');el.appendChild(p)}setTimeout(()=>el.remove(),1100)}

  function prepareItems(group){
    const items=(group.items||[]).filter(item=>item?.text).map(item=>({...item}));
    const minimum=clamp(+config.settings?.minCorrectTargets||1,1,3);
    const correct=items.filter(item=>item.correct);
    if(!correct.length)return null;
    for(let i=correct.length;i<minimum;i++)items.push({...correct[i%correct.length],generated:true});
    const targets=items.filter(item=>item.correct),distractors=items.filter(item=>!item.correct),spread=new Array(items.length);
    const slots=targets.length>=3?[1,Math.floor(items.length/2),items.length-2]:targets.length===2?[Math.floor(items.length/2),items.length-2]:[Math.floor(items.length/2)];
    targets.forEach((item,i)=>{let slot=slots[Math.min(i,slots.length-1)];while(spread[slot])slot=(slot+1)%spread.length;spread[slot]=item});
    distractors.forEach(item=>spread[spread.findIndex(x=>!x)]=item);
    return spread;
  }

  function spawn(index){
    state.items.forEach(o=>o.el.remove());state.items=[];
    if(index>=config.groups.length){state.active=false;state.finished=true;mission.textContent='Основной полёт завершён';count.textContent=`Пройдено гнёзд: ${config.groups.length}`;save();msg('Полёт завершён!');setTimeout(openRepair,700);return}
    const g=config.groups[index],data=prepareItems(g),b=bounds();
    if(!data){msg('Гнездо пересобирается: правильные цели не найдены');setTimeout(()=>spawn(index+1),900);return}
    const correctCount=data.filter(x=>x.correct).length;
    state.finished=false;state.groupIndex=index;state.active=false;state.cameraX=(b.worldW-b.w)/2;
    mission.textContent=g.prompt||'Лови правильный ответ';count.textContent=`Гнездо ${index+1} из ${config.groups.length} · целей: ${correctCount}`;
    burst(b.w*.5,b.h*.48);
    setTimeout(()=>{
      data.forEach((item,i)=>{
        const el=document.createElement('div'),textLength=[...item.text].length,maxCapsuleWidth=clamp(b.w*.7,220,340),w=clamp(Math.max(b.w*.2,150+textLength*4),156,maxCapsuleWidth),h=w*.57,lane=data.length===1?.5:.08+i*(.84/(data.length-1));
        el.className='kp-capsule';el.innerHTML=`<img src="assets/capsule.png" alt=""><div class="kp-word">${esc(item.text)}</div>`;
        const preferredSize=textLength>24?14:textLength>17?16:textLength>11?18:22,fitSize=(w-34)/Math.max(1,textLength*.58);
        el.lastElementChild.style.fontSize=Math.max(13,Math.min(preferredSize,fitSize)).toFixed(1)+'px';field.appendChild(el);
        const direction=Math.random()<.5?-1:1;
        state.items.push({item,el,wx:clamp(lane*b.worldW-w/2,12,b.worldW-w-12),y:clamp(115+(i%3)*(b.h-285)/2+Math.random()*32,100,b.h-h-70),vx:direction*(9+Math.random()*11),vy:(Math.random()-.5)*18,angle:0,vr:direction*(1.2+Math.random()*1.5),w,h,dead:false});
      });
      state.active=correctCount>0;
      save();
    },650);
  }

  function nearest(){const a=anchor();let o,d=Infinity;state.items.forEach(x=>{if(x.dead)return;const sx=x.wx-state.cameraX,nd=Math.hypot(sx+x.w/2-a.x,x.y+x.h/2-a.y);if(nd<d){o=x;d=nd}});return{o,d}}
  function beamTo(o,on){if(!o||!on){beam.classList.remove('on');return}o.el.classList.add('sucking');const a=anchor(),sx=o.wx-state.cameraX,dx=sx+o.w/2-a.x,dy=o.y+o.h/2-a.y;beam.style.cssText=`left:${a.x}px;top:${a.y}px;width:${Math.hypot(dx,dy)}px;transform:rotate(${Math.atan2(dy,dx)}rad)`;beam.classList.add('on')}
  function fail(o,text){sound('bad');vac.classList.add('error');setTimeout(()=>vac.classList.remove('error'),520);if(o){o.vx*=-1.5;o.vy*=-1.5;o.el.classList.add('wrong');setTimeout(()=>o.el.classList.remove('wrong'),600)}msg(text)}
  function capture(){
    if(!state.active||modal.classList.contains('open'))return;
    const n=nearest(),radius=+config.settings?.captureRadius||150;
    if(!n.o||n.d>radius)return fail(null,'Подлети входом пылесоса ближе к капсуле');
    const o=n.o;
    if(!o.item.correct){state.errors.push({id:Date.now()+'-'+Math.random(),text:o.item.text,command:config.groups[state.groupIndex].prompt,prompt:o.item.repairPrompt||`Какой вопрос задаётся к слову «${o.item.text}»?`,answer:answerOf(o.item),result:o.item.repairResult||'',repaired:false});errEl.textContent=state.errors.length;save();return fail(o,'Ошибка отправлена в Ремонтный отсек')}
    sound('suck');state.score++;scoreEl.textContent=state.score;o.dead=true;beamTo(o,true);vac.classList.add('capture');
    const a=anchor(),sx=o.wx-state.cameraX,groupDone=!state.items.some(x=>!x.dead&&x.item.correct);
    if(groupDone)state.active=false;
    o.el.animate([{left:sx+'px',top:o.y+'px',opacity:1},{left:a.x-o.w/2+'px',top:a.y-o.h/2+'px',transform:'rotate(150deg) scale(.06)',opacity:0}],{duration:520,easing:'cubic-bezier(.3,.05,.3,1)',fill:'forwards'}).onfinish=()=>{
      o.el.remove();beamTo(null,false);vac.classList.remove('capture');sound('ok');save();
      if(groupDone){msg('Все цели гнезда собраны');setTimeout(()=>spawn(state.groupIndex+1),config.burstPauseMs||1200)}
    };
  }

  function movePointer(e){const b=bounds(),next={x:clamp(e.clientX-b.left,25,b.w-25),y:clamp(e.clientY-b.top,90,b.h-55)},dx=next.x-state.pointer.x;if(Math.abs(dx)>=8){state.facing=dx>0?1:-1;vac.classList.toggle('face-right',state.facing>0)}state.pointer=next}
  root.addEventListener('pointermove',movePointer);
  root.addEventListener('pointerdown',e=>{if(e.target.closest('.kp-controls,.kp-modal'))return;movePointer(e);capture()});
  q('.grabBtn').onclick=capture;

  function openRepair(){state.running=false;renderRepair();modal.classList.add('open')}
  function renderRepair(){
    const done=state.errors.filter(e=>e.repaired).length;
    summary.innerHTML=`<div class="kp-pill"><b>${state.errors.length}</b><span>ошибок в полёте</span></div><div class="kp-pill"><b>${done}</b><span>отремонтировано</span></div><div class="kp-pill"><b>${state.errors.length-done}</b><span>осталось</span></div>`;list.innerHTML='';
    if(!state.errors.length){list.innerHTML='<div class="repair-card done"><div class="repair-word">Идеальный полёт ✨</div><div>Ошибок нет.</div></div>';return}
    state.errors.forEach(e=>{const card=document.createElement('div'),correct=(e.answer??(e.answers||[])[0]??'').toString().trim(),options=shuffled([...new Set([...repairOptions,correct].filter(Boolean))]);card.className='repair-card'+(e.repaired?' done':'');card.innerHTML=`<div class="repair-command">${esc(e.command||'')}</div><div class="repair-word">${esc(e.text)}</div><div>${esc(e.prompt)}</div>${e.repaired?`<div class="repair-result">✓ ${esc(e.result||'Исправлено')}</div>`:`<div class="repair-form"><select aria-label="Выберите ответ"><option value="">Выберите ответ…</option>${options.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select><button class="kp-btn amber">Проверить</button></div><div class="repair-msg"></div>`}`;if(!e.repaired){const select=card.querySelector('select'),message=card.querySelector('.repair-msg'),check=()=>{if(select.value.trim()===correct){e.repaired=true;e.answer=correct;delete e.answers;save();sound('ok');renderRepair()}else{sound('bad');message.textContent='Пока неверно. Попробуй ещё раз.';message.className='repair-msg repair-error'}};card.querySelector('button').onclick=check;select.onchange=()=>{message.textContent=''}}list.appendChild(card)})
  }
  q('.repairBtn').onclick=openRepair;q('.closeRepair').onclick=()=>{modal.classList.remove('open');state.running=true;state.last=performance.now()};
  themeSelect.value=config.id==='participle-suffixes-v1'?'participle-suffixes':'parts-of-speech-demo';themeSelect.onchange=()=>{const url=new URL(location.href);url.searchParams.delete('preview');url.searchParams.set('game',themeSelect.value);location.href=url.toString()};
  range.value=state.speed;range.oninput=()=>{state.speed=+range.value;save()};
  const soundBtn=q('.soundBtn'),soundLabel=()=>soundBtn.textContent=state.muted?'Звук: выкл.':'Звук: вкл.';soundBtn.onclick=()=>{state.muted=!state.muted;soundLabel();save()};soundLabel();
  q('.resetBtn').onclick=()=>{if(confirm('Сбросить весь прогресс и начать заново?')){localStorage.removeItem(key);state.errors=[];state.score=0;state.finished=false;state.cameraX=0;scoreEl.textContent=errEl.textContent='0';modal.classList.remove('open');state.running=true;spawn(0)}};

  function tick(t){
    const dt=Math.min(.035,(t-state.last)/1000||0),b=bounds();state.last=t;
    state.vac.x+=(state.pointer.x-state.vac.x)*Math.min(1,dt*8);state.vac.y+=(state.pointer.y-state.vac.y)*Math.min(1,dt*8);
    vac.style.transform=`translate3d(${state.vac.x-vac.offsetWidth*.38}px,${state.vac.y-vac.offsetHeight*.48}px,0)`;
    if(state.running){
      const edge=.2,normalized=state.vac.x/b.w,cameraVelocity=normalized<edge?-(edge-normalized)/edge:normalized>1-edge?(normalized-(1-edge))/edge:0;
      state.cameraX=clamp(state.cameraX+cameraVelocity*340*dt*state.speed,0,b.worldW-b.w);
      for(let i=0;i<state.items.length;i++){
        const a=state.items[i];if(a.dead)continue;
        for(let j=i+1;j<state.items.length;j++){const c=state.items[j];if(c.dead)continue;const dx=c.wx-a.wx,dy=c.y-a.y,d=Math.hypot(dx,dy)||1,min=(a.w+c.w)*.72;if(d<min){const push=(min-d)*dt*3;a.vx-=dx/d*push;a.vy-=dy/d*push;c.vx+=dx/d*push;c.vy+=dy/d*push}}
        a.wx+=a.vx*dt*state.speed;a.y+=a.vy*dt*state.speed;
        if(a.wx<6||a.wx>b.worldW-a.w-6){a.vx*=-1;a.wx=clamp(a.wx,6,b.worldW-a.w-6)}
        if(a.y<95||a.y>b.h-a.h-68){a.vy*=-1;a.y=clamp(a.y,95,b.h-a.h-68)}
        const sx=a.wx-state.cameraX;a.el.style.width=a.w+'px';a.el.style.height=a.h+'px';a.el.style.left=sx+'px';a.el.style.top=a.y+'px';a.el.style.visibility=(sx>-a.w-20&&sx<b.w+20)?'visible':'hidden';
      }
      state.decor.forEach(d=>{d.wx+=d.vx*dt*state.speed*d.depth;d.y+=d.vy*dt*state.speed;d.rot+=d.vr*dt*state.speed;if(d.wx<-d.size)d.wx=b.worldW+d.size;if(d.wx>b.worldW+d.size)d.wx=-d.size;if(d.y<70)d.y=b.h-70;if(d.y>b.h-55)d.y=80;const sx=d.wx-state.cameraX*d.depth;d.el.style.cssText=`width:${d.size}px;left:${sx}px;top:${d.y}px;transform:rotate(${d.rot}deg);opacity:${.28+d.depth*.38};visibility:${sx>-d.size&&sx<b.w+d.size?'visible':'hidden'}`});
    }
    const travel=state.cameraX/(b.worldW-b.w||1);world.style.backgroundPosition=`${-state.cameraX*.22}px 50%`;world.style.transform=`scale(1.08) translateX(${(0.5-travel)*1.5}%)`;
    const n=nearest();state.items.forEach(o=>o.el.classList.toggle('near',o===n.o&&n.d<(+config.settings?.captureRadius||150)));
    requestAnimationFrame(tick);
  }

  addDecor();scoreEl.textContent=state.score;errEl.textContent=state.errors.length;spawn(state.finished?0:state.groupIndex);requestAnimationFrame(tick);
  return{state,openRepair,capture};
}
window.Kosmopylesos={start,normalize:norm};
})();
