/* ============================================================
   Drum Dojo — engine + UI
   ============================================================ */
const $=id=>document.getElementById(id);
const $$=s=>document.querySelectorAll(s);

/* ---------------- AUDIO ENGINE ---------------- */
let ctx=null, master=null, bus=null, conv=null, revGain=null;
const BUFFERS={};            // decoded real samples by voice id
let samplesReady=false, noiseBuf=null;

function initAudio(){
  if(ctx) return;
  ctx=new (window.AudioContext||window.webkitAudioContext)();
  master=ctx.createGain(); master.gain.value=0.9; master.connect(ctx.destination);
  bus=ctx.createGain(); bus.connect(master);
  conv=ctx.createConvolver(); conv.buffer=makeIR(1.6,2.6);
  revGain=ctx.createGain(); revGain.gain.value=0.13;
  bus.connect(conv); conv.connect(revGain); revGain.connect(master);
}
function makeIR(dur,decay){
  const len=ctx.sampleRate*dur, b=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay);}
  return b;
}
function getNoise(){ if(!noiseBuf){const len=ctx.sampleRate,b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;noiseBuf=b;} return noiseBuf; }
function b64ToBuf(uri){const b=atob(uri.split(",")[1]);const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer;}
function loadSamples(){
  initAudio();
  const S=window.DRUM_SAMPLES||{}; const ids=Object.keys(S);
  return Promise.all(ids.map(id=>new Promise(res=>{
    try{ ctx.decodeAudioData(b64ToBuf(S[id]), buf=>{BUFFERS[id]=buf;res();}, ()=>res()); }
    catch(e){ res(); }
  }))).then(()=>{ samplesReady=true; kitStatus(); });
}
function kitStatus(){
  const n=Object.keys(BUFFERS).length;
  $("kitDot").classList.toggle("ready",n>0);
  $("kitLabel").textContent = n>0 ? `Acoustic kit · ${n} sampled voices` : "Synth kit";
}

/* ---- synthesis helpers (fallback voices + cymbals) ---- */
function env(g,t,a,d,peak){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);}
function tone(type,f,t,dur,peak,glide,gt){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(glide)o.frequency.exponentialRampToValueAtTime(glide,t+(gt||dur));env(g,t,.001,dur,peak);o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.05);}
function nz(t,dur,peak,type,freq,q){const n=ctx.createBufferSource();n.buffer=getNoise();const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;if(q)f.Q.value=q;const g=ctx.createGain();env(g,t,.001,dur,peak);n.connect(f);f.connect(g);g.connect(bus);n.start(t);n.stop(t+dur+.05);}
const Synth={
  kick(t,v=1){tone("sine",125,t,.34,v,48,.10);tone("sine",60,t,.30,v*.7,40,.18);nz(t,.012,v*.5,"highpass",3500);},
  snare(t,v=1){tone("triangle",185,t,.13,v*.45);tone("triangle",330,t,.10,v*.3);nz(t,.20,v*.7,"highpass",1500);nz(t,.16,v*.5,"bandpass",3200,1.2);nz(t,.025,v*.55,"highpass",6500);},
  hat(t,v=1){nz(t,.045,v*.5,"highpass",8000);nz(t,.03,v*.35,"bandpass",11000,2);},
  openhat(t,v=1){nz(t,.38,v*.42,"highpass",7500);nz(t,.3,v*.28,"bandpass",10000,2);},
  ride(t,v=1){tone("triangle",820,t,.4,v*.18);tone("triangle",1180,t,.35,v*.12);nz(t,.5,v*.16,"highpass",5500);},
  crash(t,v=1){nz(t,1.3,v*.5,"highpass",3500);nz(t,1.1,v*.3,"bandpass",7000,1);tone("triangle",520,t,.5,v*.1);},
  rim(t,v=1){tone("square",420,t,.025,v*.5);tone("triangle",1700,t,.03,v*.35);nz(t,.02,v*.3,"highpass",2500);},
  tom(t,v,f){tone("sine",f,t,.34,v*.9,f*.55,.22);nz(t,.02,v*.3,"bandpass",f*2.5,1);},
  tom1(t,v=1){Synth.tom(t,v,220);}, tom2(t,v=1){Synth.tom(t,v,165);}, floor(t,v=1){Synth.tom(t,v,110);},
  click(t,accent){tone("square",accent?2000:1300,t,.03,.32);}
};
function trigger(id,t,vel){
  if(id==="click"){ Synth.click(t,vel); return; }
  if(BUFFERS[id]){
    const s=ctx.createBufferSource(); s.buffer=BUFFERS[id];
    s.playbackRate.value=1+(Math.random()*.03-.015);
    const g=ctx.createGain(); g.gain.value=Math.min(1.6,vel);
    s.connect(g); g.connect(bus); s.start(t);
  } else (Synth[id]||Synth.snare)(t,vel);
}

/* ---------------- STATE ---------------- */
let SEC="course", mode="pattern", current=null;
let playing=false, bpm=90, timer=null, stepIdx=0, nextNoteTime=0, countLeft=0, barCount=0;
let click=true, clickRes="beat", countIn=true, trainer=false, guideMute=false, trade=false;
let song=null, songIdx=0, barsPlayed=0;
let activeLesson=null; // {l,i}
let muted={};
const lookahead=25, scheduleAhead=.12;
const COUNT={4:["","e","&","a"],3:["","&","a"],6:["","ta","la","li","ta","la"],2:["","&"]};

/* ---------------- PERSISTENCE ---------------- */
const KEY="drumdojo.v1";
let store={done:{},vol:85};
function loadStore(){ try{store=Object.assign(store,JSON.parse(localStorage.getItem(KEY)||"{}"));}catch(e){} }
function saveStore(){ try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){} }
const lessonKey=(l,i)=>l+":"+i;

/* ---------------- PATTERN PREP ---------------- */
function r(s){return s.split("").map(c=> c==="X"?2 : c==="x"?1 : c==="o"?3 : 0);}
function pad(s,n){s=s||"";while(s.length<n)s+=".";return s;}
function prep(p){
  if(p._ready) return p;
  if(p.hits){ p.tracks=p.tracks||{}; p.tracks.snare=p.hits; }
  const t={}; let steps=0; const tr=p.tracks||{};
  for(const id in tr){ t[id]=r(tr[id]); steps=Math.max(steps,t[id].length); }
  for(const id in t){ while(t[id].length<steps) t[id].push(0); }
  p._t=t; p._steps=steps; p._stick=p.stick?pad(p.stick,steps):null; p._orn=p.orn?pad(p.orn,steps):null;
  p._ready=true; return p;
}
const findPattern=(sec,name)=>LIB[sec].find(p=>p.name===name);
const findSong=name=>SONGS.find(s=>s.name===name);

/* ---------------- SIDEBAR ---------------- */
function buildSidebar(sec){
  const lib=$("lib"); lib.innerHTML="";
  if(sec==="course"){
    $("libTitle").textContent="Curriculum";
    COURSE.forEach((lvl,li)=>{
      const h=document.createElement("div"); h.className="lvlhdr";
      h.innerHTML=`<b>${lvl.level}</b><div class="bar"></div>`; lib.appendChild(h);
      lvl.lessons.forEach((les,ii)=>{
        const b=document.createElement("button"); b.className="item";
        const done=store.done[lessonKey(li,ii)];
        b.innerHTML=`<span><span class="num">${ii+1}.</span> ${les.title}<span class="meta">target ${les.target} bpm</span></span>${done?'<span class="check">✓</span>':''}`;
        b.onclick=()=>selectLesson(li,ii,b); lib.appendChild(b);
      });
    });
    return;
  }
  if(sec==="song"){
    $("libTitle").textContent="Songs";
    SONGS.forEach((s,i)=>{
      const b=document.createElement("button"); b.className="item";
      b.innerHTML=`<span>${s.name}<span class="meta">${s.parts.length} sections · ${s.bpm} bpm</span></span>`;
      b.onclick=()=>selectSong(s,b); lib.appendChild(b);
      if(i===0) firstBtn=b;
    });
    return;
  }
  $("libTitle").textContent={groove:"Grooves",rudiment:"Rudiments",fill:"Fills"}[sec];
  let lastFam=null; firstBtn=null;
  LIB[sec].forEach((p,i)=>{
    const fam=p.style||p.fam;
    if(fam && fam!==lastFam){ const h=document.createElement("div");h.className="famhdr";h.textContent=fam;lib.appendChild(h);lastFam=fam; }
    const b=document.createElement("button"); b.className="item";
    b.innerHTML=`<span>${p.name}<span class="meta">${p.meter} · ${p.bpm} bpm</span></span><span class="stars">${"★".repeat(p.diff||1)}</span>`;
    b.onclick=()=>selectPattern(p,b); lib.appendChild(b);
    if(i===0) firstBtn=b;
  });
}
let firstBtn=null, activeBtn=null;
function setActive(btn){ if(activeBtn)activeBtn.classList.remove("active"); activeBtn=btn; if(btn)btn.classList.add("active"); }

/* ---------------- SELECTION ---------------- */
function selectSection(sec){
  stop(); SEC=sec; mode = sec==="song"?"song":"pattern";
  $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.sec===sec));
  $("lessonBox").style.display="none"; $("lessonBar").style.display="none";
  $("songStruct").style.display="none"; $("coachBanner").style.display="none";
  activeLesson=null;
  buildSidebar(sec);
  if(sec==="course"){ selectLesson(0,0,$$("#lib .item")[0]); }
  else if(sec==="song"){ if(firstBtn) selectSong(SONGS[0],firstBtn); }
  else { if(firstBtn) selectPattern(LIB[sec][0],firstBtn); }
}

function selectPattern(p,btn){
  stop(); prep(p); current=p; mode="pattern"; muted={};
  setActive(btn);
  renderHeader(p,{});
  $("lessonBox").style.display="none"; $("lessonBar").style.display="none"; $("songStruct").style.display="none";
  setBpm(p.bpm); buildGrid(); buildVoices();
}

function selectLesson(li,ii,btn){
  stop(); const les=COURSE[li].lessons[ii]; activeLesson={l:li,i:ii}; setActive(btn);
  if(les.song){ mode="song"; song=findSong(les.song); songIdx=0; barsPlayed=0; loadPart(0,false); $("songStruct").style.display="flex"; buildSongStruct(); }
  else { mode="pattern"; const p=les.pattern?les.pattern:findPattern(les.ref[0],les.ref[1]); prep(p); current=p; muted={}; $("songStruct").style.display="none"; buildGrid(); buildVoices(); }
  setBpm(les.bpm||current.bpm||90);
  renderHeader(current,{lesson:les});
  // lesson box
  $("lessonBox").style.display="block";
  $("lessonGoal").textContent=les.goal;
  $("lessonFocus").innerHTML=les.focus+(les.tips?("<ul>"+les.tips.map(t=>`<li>${t}</li>`).join("")+"</ul>"):"");
  // lesson bar
  $("lessonBar").style.display="flex";
  const done=store.done[lessonKey(li,ii)];
  $("markBtn").textContent = done? "✓ Completed — Replay next" : "Mark complete & next ▶";
  const total=COURSE.reduce((a,l)=>a+l.lessons.length,0);
  const doneN=Object.keys(store.done).length;
  $("progress").textContent=`Progress: ${doneN}/${total} lessons`;
}

function selectSong(s,btn){
  stop(); mode="song"; song=s; songIdx=0; barsPlayed=0; setActive(btn);
  loadPart(0,false); setBpm(s.bpm);
  renderHeader(current,{song:s});
  $("lessonBox").style.display="none"; $("lessonBar").style.display="none";
  $("songStruct").style.display="flex"; buildSongStruct();
}
function loadPart(i,live){
  const part=song.parts[i]; current=prep(findPattern(part.ref[0],part.ref[1])); muted={};
  if(!live){ buildGrid(); buildVoices(); }
  else { buildGrid(); buildVoices(); }
}

/* ---------------- HEADER ---------------- */
function renderHeader(p,opt){
  let name=p.name, badges="";
  if(opt.song){ name=opt.song.name; badges=`<span class="badge meter">Song</span><span class="badge tempo">${opt.song.bpm} bpm</span>`;
    $("ptnDesc").textContent=opt.song.desc; }
  else if(opt.lesson){ const les=opt.lesson;
    name=`<span style="color:var(--accent3)">Lesson:</span> ${les.title}`;
    badges=`<span class="badge meter">${current.meter||"4/4"}</span><span class="badge tempo">target ${les.target} bpm</span>`;
    $("ptnDesc").textContent = opt.song? opt.song.desc : (current.desc||"");
    if(mode==="song"){ $("ptnDesc").textContent=song.desc; }
  } else {
    badges=`<span class="badge style">${p.style||p.fam||""}</span><span class="badge meter">${p.meter}</span><span class="badge tempo">${p.bpm} bpm</span>`;
    if(p.diff) badges+=`<span class="stars" style="align-self:center">${"★".repeat(p.diff)}</span>`;
    $("ptnDesc").textContent=p.desc||"";
  }
  $("ptnName").innerHTML=name;
  $("badges").innerHTML=badges;
  $("tip").innerHTML = "💡 "+(current.tip||(opt.song?"Use the section timeline above — it highlights the part playing now.":""));
}

/* ---------------- GRID ---------------- */
const activeRows=()=>ROWS.filter(row=>current._t[row.id]);
function cellEl(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function buildGrid(){
  const g=$("grid"); g.innerHTML="";
  const steps=current._steps, sub=current.sub, cmap=COUNT[sub]||null;
  // beat numbers
  const head=document.createElement("tr"); head.appendChild(cellEl("th","rowlabel beatnum","Beat"));
  for(let s=0;s<steps;s++){ const within=s%sub; const lbl=within===0?(Math.floor(s/sub)+1):""; const th=cellEl("th","beatnum"+(within===0?" beatstart":""),lbl); th.dataset.step=s; head.appendChild(th); }
  g.appendChild(head);
  // counting row
  if(cmap){ const tr=document.createElement("tr"); tr.appendChild(cellEl("td","rowlabel countcell","Count"));
    for(let s=0;s<steps;s++){ const within=s%sub; const lbl= within===0?(Math.floor(s/sub)+1):(cmap[within]||""); const td=cellEl("td","countcell"+(within===0?" beathead beatstart":""),lbl); td.dataset.step=s; tr.appendChild(td); }
    g.appendChild(tr);
  }
  // sticking (rudiments)
  if(current._stick){ const tr=document.createElement("tr"); tr.className="sticking"; tr.appendChild(cellEl("td","rowlabel","Sticking"));
    for(let s=0;s<steps;s++){ const ch=current._stick[s]; const td=cellEl("td",(ch==="R"||ch==="L")?ch:"",(ch==="R"||ch==="L")?ch:""); if(s%sub===0)td.classList.add("beatstart"); tr.appendChild(td); }
    g.appendChild(tr);
  }
  // instrument rows
  activeRows().forEach(row=>{
    const tr=document.createElement("tr"); tr.appendChild(cellEl("td","rowlabel",row.label));
    const arr=current._t[row.id];
    for(let s=0;s<steps;s++){
      const td=document.createElement("td"); td.className="cell"+(s%sub===0?" beatstart":""); td.dataset.step=s;
      const v=arr[s]||0;
      if(v===1)td.classList.add("on"); else if(v===2)td.classList.add("on","accent"); else if(v===3)td.classList.add("on","ghost");
      td.appendChild(cellEl("div","dot",""));
      if(row.id==="snare"&&current._orn){const o=current._orn[s];if(o&&o!=="."){const sp=cellEl("span","orn",o);td.appendChild(sp);}}
      tr.appendChild(td);
    }
    g.appendChild(tr);
  });
}
function buildVoices(){
  const v=$("voices"); v.innerHTML='<span class="lbl">Mute / un-mute (play these yourself):</span>';
  activeRows().forEach(row=>{ const b=document.createElement("button"); b.textContent=row.label;
    if(muted[row.id])b.classList.add("muted");
    b.onclick=()=>{muted[row.id]=!muted[row.id];b.classList.toggle("muted",muted[row.id]);}; v.appendChild(b); });
}

/* ---------------- PLAYHEAD ---------------- */
function highlight(step){
  $$(".playcol").forEach(c=>c.classList.remove("playcol"));
  $$(".flash").forEach(c=>c.classList.remove("flash"));
  $$(`[data-step="${step}"]`).forEach(c=>{ c.classList.add("playcol"); if(c.classList.contains("on")) c.classList.add("flash"); });
}
function clearHL(){ $$(".playcol,.flash").forEach(c=>c.classList.remove("playcol","flash")); }

/* ---------------- SONG STRUCTURE ---------------- */
function buildSongStruct(){
  const el=$("songStruct"); el.innerHTML="";
  song.parts.forEach((p,i)=>{ const c=document.createElement("div"); c.className="chip"; c.dataset.i=i;
    c.innerHTML=`<b>${p.label}</b><small>${p.bars} bar${p.bars>1?"s":""}</small>`; el.appendChild(c); });
  highlightPart(0);
}
function highlightPart(i){ $$("#songStruct .chip").forEach(c=>c.classList.toggle("now",+c.dataset.i===i)); }

/* ---------------- SCHEDULER ---------------- */
const stepDur=()=>(60/bpm)/current.sub;
const hum=()=>.92+Math.random()*.14;
function velFor(v){ return (v===2?1.05:v===3?.3:.8)*hum(); }
function muteKitNow(){ // are kit voices silenced this bar?
  if(guideMute) return true;
  if(trade && (barCount%2===1)) return true; // odd bars = "your turn"
  return false;
}
function playSnareOrn(step,time,vel){
  const o=current._orn?current._orn[step]:"."; if(!o||o===".") return;
  if(o==="f") trigger("snare",time-.022,vel*.4);
  else if(o==="d"){ trigger("snare",time-.05,vel*.34); trigger("snare",time-.026,vel*.34); }
  else if(o==="z"){ for(let k=1;k<=3;k++) trigger("snare",time-.012*k,vel*.4); }
}
function scheduleStep(step,time){
  const clickEvery = clickRes==="all"?1:current.sub;
  if(click && step%clickEvery===0) trigger("click",time, step%current.sub===0 && step===0);
  if(!muteKitNow()){
    activeRows().forEach(row=>{ if(muted[row.id])return; const v=current._t[row.id][step]||0;
      if(v>0){ const vel=velFor(v); if(row.id==="snare") playSnareOrn(step,time,vel); trigger(row.id,time,vel); } });
  }
  const delay=(time-ctx.currentTime)*1000;
  setTimeout(()=>{ if(playing) highlight(step); }, Math.max(0,delay));
}
function scheduleCount(beat,time){
  trigger("click",time,beat===0);
  const delay=(time-ctx.currentTime)*1000;
  setTimeout(()=>{ if(playing) $("playBtn").textContent=(4-beat); }, Math.max(0,delay));
}
function setBanner(){
  const el=$("coachBanner");
  if(!trade){ el.style.display="none"; return; }
  el.style.display="flex";
  if(barCount%2===0){ el.className="demo"; el.innerHTML='<span class="big">🔊</span> LISTEN — watch the pattern'; }
  else{ el.className="you"; el.innerHTML='<span class="big">🥁</span> YOUR TURN — play it!'; }
}
function scheduler(){
  while(nextNoteTime < ctx.currentTime + scheduleAhead){
    if(countLeft>0){
      scheduleCount(4-countLeft,nextNoteTime); nextNoteTime+=60/bpm; countLeft--;
      if(countLeft===0){ stepIdx=0; barCount=0; const t=nextNoteTime; setTimeout(()=>{if(playing){$("playBtn").textContent="■"; setBanner();}},Math.max(0,(t-ctx.currentTime)*1000)); }
    } else {
      scheduleStep(stepIdx,nextNoteTime); nextNoteTime+=stepDur(); stepIdx++;
      if(stepIdx>=current._steps){
        stepIdx=0; barCount++;
        const tAt=nextNoteTime;
        if(mode==="song"){
          barsPlayed++;
          if(barsPlayed>=song.parts[songIdx].bars){
            barsPlayed=0; songIdx=(songIdx+1)%song.parts.length; const idx=songIdx; loadPart(idx,true);
            setTimeout(()=>{if(playing)highlightPart(idx);},Math.max(0,(tAt-ctx.currentTime)*1000));
            if(trainer&&songIdx===0) setBpm(Math.min(280,bpm+4));
          }
        } else if(trainer){ setBpm(Math.min(280,bpm+4)); }
        if(trade) setTimeout(()=>{if(playing)setBanner();},Math.max(0,(tAt-ctx.currentTime)*1000));
      }
    }
  }
}

/* ---------------- TRANSPORT ---------------- */
function play(){
  initAudio(); ctx.resume();
  if(!samplesReady) loadSamples();
  playing=true; $("playBtn").classList.add("on");
  if(mode==="song"){ songIdx=0; barsPlayed=0; loadPart(0,true); buildSongStruct(); }
  stepIdx=0; barCount=0; countLeft=countIn?4:0;
  $("playBtn").textContent=countIn?"4":"■";
  setBanner();
  nextNoteTime=ctx.currentTime+.12;
  timer=setInterval(scheduler,lookahead);
}
function stop(){
  playing=false; if(timer)clearInterval(timer); timer=null;
  $("playBtn").textContent="▶"; $("playBtn").classList.remove("on"); clearHL();
  if(!trade) $("coachBanner").style.display="none";
}
function toggle(){ playing?stop():play(); }
function setBpm(v){ bpm=Math.max(30,Math.min(280,Math.round(v))); $("bpmNum").value=bpm; $("bpmRange").value=bpm; }

/* ---------------- TAP TEMPO ---------------- */
let taps=[];
function tap(){ const n=performance.now(); taps=taps.filter(t=>n-t<2000); taps.push(n);
  if(taps.length>=2){ let s=0; for(let i=1;i<taps.length;i++)s+=taps[i]-taps[i-1]; setBpm(60000/(s/(taps.length-1))); } }

/* ---------------- LESSON COMPLETE ---------------- */
function markComplete(){
  if(!activeLesson) return;
  store.done[lessonKey(activeLesson.l,activeLesson.i)]=1; saveStore();
  let l=activeLesson.l, i=activeLesson.i+1;
  if(i>=COURSE[l].lessons.length){ l++; i=0; }
  if(l>=COURSE.length){ l=activeLesson.l; i=activeLesson.i; } // already at the end — stay put
  buildSidebar("course");
  const btns=$$("#lib .item");
  let idx=0; for(let a=0;a<l;a++) idx+=COURSE[a].lessons.length; idx+=i;
  selectLesson(l,i,btns[idx]);
}

/* ---------------- WIRING ---------------- */
function wire(){
  $("nav").addEventListener("click",e=>{const b=e.target.closest("button[data-sec]");if(b)selectSection(b.dataset.sec);});
  $("playBtn").onclick=toggle;
  $("bpmNum").oninput=e=>setBpm(e.target.value);
  $("bpmRange").oninput=e=>setBpm(e.target.value);
  $("tapBtn").onclick=tap;
  $$(".presets button").forEach(b=>b.onclick=()=>setBpm(+b.dataset.bpm));
  $("clickBtn").onclick=e=>{click=!click;e.currentTarget.classList.toggle("on",click);};
  $("clickRes").onchange=e=>{clickRes=e.target.value;};
  $("countBtn").onclick=e=>{countIn=!countIn;e.currentTarget.classList.toggle("on",countIn);};
  $("trainBtn").onclick=e=>{trainer=!trainer;e.currentTarget.classList.toggle("on",trainer);};
  $("guideBtn").onclick=e=>{guideMute=!guideMute;e.currentTarget.classList.toggle("on",guideMute);};
  $("tradeBtn").onclick=e=>{trade=!trade;e.currentTarget.classList.toggle("on",trade); if(!trade)$("coachBanner").style.display="none"; else setBanner();};
  $("vol").value=store.vol; $("vol").oninput=e=>{ store.vol=+e.target.value; if(master)master.gain.value=store.vol/100*1.05; saveStore(); };
  $("markBtn").onclick=markComplete;
  document.addEventListener("keydown",e=>{
    if(e.target.tagName==="INPUT") return;
    if(e.code==="Space"){e.preventDefault();toggle();}
    else if(e.key==="t"||e.key==="T") tap();
    else if(e.key==="ArrowUp"){setBpm(bpm+1);} else if(e.key==="ArrowDown"){setBpm(bpm-1);}
  });
}

/* ---------------- BOOT ---------------- */
loadStore();
wire();
selectSection("course");
loadSamples().catch(()=>{}); // pre-decode acoustic kit
