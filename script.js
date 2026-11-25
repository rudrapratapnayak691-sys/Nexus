const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LS=(k,v)=>v===undefined?JSON.parse(localStorage.getItem(k)||'null'):localStorage.setItem(k,JSON.stringify(v));
let cfg=LS('cfg')||{url:'http://localhost:11434',model:''},chats=LS('chats')||[],cur=null,ctl=null,img=null;
const base=()=>cfg.url.replace(/\/$/,'');
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const md=s=>esc(s).split('```').map((p,i)=>i%2?'<pre><code>'+p.replace(/^\w*\n/,'')+'</code></pre>':p.replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>')).join('');
const SYS='You are Nexus, the AI assistant inside the Nexus AI app. If asked who you are, what your name is, or who made you, say you are Nexus, a personal AI assistant that runs privately on the user\'s own device. Never call yourself Llama and never mention Meta. Reply briefly and clearly unless asked for detail.';
const ENGINE_ERR='The AI engine is not reachable. Install Ollama (ollama.com), run "ollama pull llama3.2", start it with OLLAMA_ORIGINS=* and set its address in Settings.';

/* streaming from Ollama */
async function stream(msgs,onTok,signal){
  const r=await fetch(base()+'/api/chat',{method:'POST',signal,body:JSON.stringify({model:cfg.model,messages:[{role:'system',content:SYS},...msgs.slice(-8)],stream:true,keep_alive:'30m',options:{num_ctx:2048,num_predict:1024}})});
  if(!r.ok)throw new Error('Ollama returned '+r.status+': '+(await r.text()).slice(0,200));
  const rd=r.body.getReader(),dec=new TextDecoder();let buf='';
  for(;;){const{done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});
    const lines=buf.split('\n');buf=lines.pop();
    for(const l of lines){if(!l.trim())continue;const j=JSON.parse(l);if(j.error)throw new Error(j.error);if(j.message)onTok(j.message.content)}}
}

/* chats */
const save=()=>{LS('chats',chats);window.onSave&&onSave()};
function newChat(){cur={id:Date.now(),title:'New chat',msgs:[]};chats.unshift(cur);save();show()}
function show(){renderList();renderMsgs();$('#side').classList.remove('open')}
function renderList(){
  const q=$('#search').value.toLowerCase(),L=$('#list');L.innerHTML='';
  chats.filter(c=>c.title.toLowerCase().includes(q)).forEach(c=>{
    const d=document.createElement('div');d.className='item'+(c===cur?' on':'');
    d.innerHTML='<span>'+esc(c.title)+'</span><button aria-label="Delete chat">✕</button>';
    d.onclick=()=>{cur=c;show()};
    d.querySelector('button').onclick=e=>{e.stopPropagation();chats=chats.filter(x=>x!==c);window.onDel&&onDel(c.id);if(cur===c)cur=chats[0]||null;if(!cur)return newChat();save();show()};
    L.append(d)});
}
function renderMsgs(){
  const R=$('#reply');R.innerHTML='';
  if(!cur.msgs.length){R.innerHTML='<div class="hello"><img src="icon.svg" alt=""><h1>Hello, '+esc(window.uname||'there')+'!</h1><p>How can I help you today?</p><div class="btns" style="justify-content:center;margin-top:16px"><button class="ib" data-s="Create a content plan for this month">Content plan</button><button class="ib" data-s="Help me write an email to my team">Write an email</button><button class="ib" data-s="Explain artificial intelligence in simple words">Explain AI</button></div></div>';R.onclick=e=>{if(e.target.dataset.s){$('#command').value=e.target.dataset.s;$('#command').focus()}};return}
  cur.msgs.forEach((m,i)=>{
    const d=document.createElement('div');d.className='msg '+(m.role=='user'?'u':'a');
    d.innerHTML=md(m.content)+(m.role=='assistant'&&m.content?'<div class="act"><button>Copy</button>'+(i==cur.msgs.length-1?'<button>Regenerate</button>':'')+'</div>':'');
    const b=d.querySelectorAll('.act button');
    if(b[0])b[0].onclick=()=>navigator.clipboard.writeText(m.content);
    if(b[1])b[1].onclick=()=>{cur.msgs.pop();run()};
    R.append(d)});
  R.scrollTop=R.scrollHeight;
}
async function run(){
  const a={role:'assistant',content:''};cur.msgs.push(a);renderMsgs();
  $('#reply').lastChild.innerHTML='<span class="small">Thinking…</span>';ctl=new AbortController();$('#stopBtn').hidden=false;$('#sendBtn').hidden=true;
  try{await stream(cur.msgs.slice(0,-1),t=>{a.content+=t;const l=$('#reply').lastChild;l.innerHTML=md(a.content);$('#reply').scrollTop=1e9},ctl.signal)}
  catch(e){if(e.name!='AbortError'){a.content+='\n\n'+(e instanceof TypeError?ENGINE_ERR:e.message)}}
  ctl=null;$('#stopBtn').hidden=true;$('#sendBtn').hidden=false;save();renderMsgs();
}
function send(){
  const t=$('#command').value.trim();if(!t||ctl)return;
  if(!cfg.model)return openSettings('Choose a model first.');
  if(!cur)newChat();
  const m={role:'user',content:t};if(img)m.images=[img];
  if(cur.title=='New chat')cur.title=t.slice(0,40);
  cur.msgs.push(m);img=null;$('#chip').hidden=true;$('#command').value='';renderList();run();
}
$('#sendBtn').onclick=send;$('#stopBtn').onclick=()=>ctl&&ctl.abort();
$('#command').onkeydown=e=>{if(e.key=='Enter'&&!e.shiftKey&&innerWidth>760){e.preventDefault();send()}};
$('#command').oninput=e=>{e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px'};
$('#newChat').onclick=newChat;$('#search').oninput=renderList;$('#menu').onclick=()=>$('#side').classList.toggle('open');
$('#file').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{img=r.result.split(',')[1];$('#chip').textContent='Image attached: '+f.name;$('#chip').hidden=false};r.readAsDataURL(f)};

/* speech */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function listen(onText,cont){
  if(!SR){alert('Speech recognition is not supported in this browser. Try Chrome.');return null}
  const r=new SR();r.continuous=!!cont;r.interimResults=!!cont;r.lang=navigator.language||'en-US';
  r.onresult=e=>{const x=e.results[e.results.length-1];onText(x[0].transcript,x.isFinal)};return r}
function speak(t){
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t.replace(/[`*#]/g,''));
  const v=speechSynthesis.getVoices().find(v=>/en/i.test(v.lang)&&/natural|google|neural/i.test(v.name));if(v)u.voice=v;
  u.rate=1;u.pitch=.95;u.onstart=()=>$('#orb').className='live talk';u.onend=()=>$('#orb').className=vOn?'live':'';speechSynthesis.speak(u)}
$('#voiceBtn').onclick=()=>{const r=listen(t=>{$('#command').value=t},false);if(r)r.start()};

/* Vision: voice + camera */
let vOn=false,vRec=null,vHist=[],stm=null,vBusy=false;
function logV(c,t){const d=document.createElement('div');d.className='msg '+(c=='u'?'u':'');d.innerHTML=md(t);$('#vlog').append(d);$('#vlog').scrollTop=1e9;return d}
function frame(){const v=$('#cam'),c=document.createElement('canvas');c.width=Math.min(v.videoWidth,640);c.height=c.width*v.videoHeight/v.videoWidth;c.getContext('2d').drawImage(v,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.7).split(',')[1]}
async function ask(t){
  if(!cfg.model){$('#vstatus').textContent='Choose a model in Settings first.';return}
  const m={role:'user',content:t};if(stm)m.images=[frame()];
  vHist.push(m);logV('u',t);const d=logV('a','');let out='';vBusy=true;$('#vstatus').textContent='Thinking…';
  try{await stream(vHist.slice(-10),x=>{out+=x;d.innerHTML=md(out)});vHist.push({role:'assistant',content:out});speak(out);$('#vstatus').textContent='Listening…'}
  catch(e){d.innerHTML='<span class="err">'+esc(e instanceof TypeError?ENGINE_ERR:e.message)+'</span>';$('#vstatus').textContent='Engine error'}
  vBusy=false;
}
$('#talk').onclick=()=>{
  if(vOn){vOn=false;vRec.stop();speechSynthesis.cancel();$('#orb').className='';$('#talk').textContent='Start';$('#vstatus').textContent='Stopped.';return}
  vRec=listen((t,fin)=>{if(speechSynthesis.speaking&&t.trim().length>2)speechSynthesis.cancel();if(fin&&t.trim()&&!vBusy)ask(t.trim())},true);
  if(!vRec)return;vRec.onend=()=>{if(vOn)try{vRec.start()}catch(e){}};
  vOn=true;vRec.start();$('#orb').className='live';$('#talk').textContent='Stop';$('#vstatus').textContent='Listening… use headphones to avoid echo.'};
$('#camBtn').onclick=async()=>{
  if(stm){stm.getTracks().forEach(t=>t.stop());stm=null;$('#cam').hidden=true;$('#camBtn').textContent='Camera';return}
  try{stm=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});$('#cam').srcObject=stm;$('#cam').hidden=false;$('#cam').play();$('#camBtn').textContent='Camera off'}
  catch(e){$('#vstatus').textContent='Camera blocked: allow camera access for this site.'}};

/* Knowledge: Wikipedia */
$('#kform').onsubmit=async e=>{
  e.preventDefault();const q=$('#kq').value.trim(),O=$('#kout');O.innerHTML='<p class="small">Searching Wikipedia…</p>';
  try{
    const u='https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=4&gsrsearch='+encodeURIComponent(q)+'&prop=extracts|info&exintro=1&explaintext=1&exlimit=4&exchars=1200&inprop=url';
    const j=await (await fetch(u)).json(),pg=Object.values((j.query||{}).pages||{}).sort((a,b)=>a.index-b.index);
    if(!pg.length){O.innerHTML='<p class="small">No Wikipedia articles found. Try different words.</p>';return}
    O.innerHTML='';pg.forEach(p=>{const c=document.createElement('div');c.className='card';
      c.innerHTML='<div class="tag">Wikipedia</div><h3><a target="_blank" rel="noopener" href="'+p.fullurl+'">'+esc(p.title)+'</a></h3><p>'+esc(p.extract||'')+'</p>';O.append(c)});
    const b=document.createElement('button');b.className='grad';b.textContent='Explain with AI';O.append(b);
    b.onclick=async()=>{
      if(!cfg.model)return openSettings('Choose a model first.');
      const c=document.createElement('div');c.className='card ai';c.innerHTML='<div class="tag">AI explanation, not Wikipedia text</div><div></div>';O.append(c);
      const ctx=pg.map(p=>p.title+': '+p.extract).join('\n\n');let out='';
      try{await stream([{role:'user',content:'Using only these Wikipedia extracts, answer "'+q+'" simply. Mention which article each point comes from.\n\n'+ctx}],x=>{out+=x;c.lastChild.innerHTML=md(out)})}
      catch(e){c.lastChild.innerHTML='<span class="err">'+esc(e instanceof TypeError?ENGINE_ERR:e.message)+'</span>'}};
  }catch(err){O.innerHTML='<p class="err">Could not reach Wikipedia. Check your connection.</p>'}
};

function warm(){if(cfg.model)fetch(base()+'/api/generate',{method:'POST',body:JSON.stringify({model:cfg.model,keep_alive:'30m'})}).catch(()=>{})}
/* settings */
function openSettings(msg){$('#url').value=cfg.url;$('#dstat').textContent=msg||'';loadModels();$('#dlg').showModal()}
async function loadModels(){
  const s=$('#model');s.innerHTML='';
  try{const j=await (await fetch($('#url').value.replace(/\/$/,'')+'/api/tags')).json();
    (j.models||[]).forEach(m=>s.add(new Option(m.name,m.name)));
    if(!s.options.length)$('#dstat').textContent='Ollama is running but has no models. Run: ollama pull llama3.2';
    else{s.value=cfg.model||s.options[0].value;$('#dstat').textContent='Connected. '+s.options.length+' model(s) found.'}}
  catch(e){$('#dstat').textContent=ENGINE_ERR}
}
$('#settingsBtn').onclick=()=>openSettings();$('#refresh').onclick=loadModels;
$('#saveCfg').onclick=()=>{cfg={url:$('#url').value||cfg.url,model:$('#model').value};LS('cfg',cfg);warm()};

/* tabs, PWA, start */
$$('#tabs button').forEach(b=>b.onclick=()=>{$$('#tabs button,.pane').forEach(x=>x.classList.remove('on'));b.classList.add('on');$('#'+b.dataset.t).classList.add('on')});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
cur=chats[0]||null;if(!cur)newChat();else show();
window.firstRun=()=>{if(!cfg.model)openSettings('Connect to your local AI engine to start chatting.');else warm()};
