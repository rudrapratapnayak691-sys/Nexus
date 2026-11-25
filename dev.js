(()=>{
const HASH='72b83178bd046b0d39eb92bb48c8337734452aea72464f811c0e6ecb1617ca7a',G=id=>document.getElementById(id),Q=s=>document.querySelector(s),dv=G('dv');
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
let ok=sessionStorage.getItem('dv')=='1',built=false,busy=false;const log=[],hist=[];
const INT=[['slack','Slack','#4a154b','#'],['whatsapp','WhatsApp','#25d366','☎'],['gmail','Gmail','#d93025','M'],['notion','Notion','#333','N'],['x','Twitter','#1d9bf0','X'],['instagram','Instagram','#e1306c','◎'],['linkedin','LinkedIn','#0a66c2','in']];
const ROBOT='<svg viewBox="0 0 200 200" class="robot"><circle cx="100" cy="100" r="92" fill="none" stroke="#2f6bff" stroke-opacity=".5" stroke-width="2"/><rect x="45" y="60" width="110" height="80" rx="34" fill="#dfe7f5"/><rect x="55" y="72" width="90" height="52" rx="24" fill="#0b1224"/><circle cx="82" cy="98" r="10" fill="#38a3ff"/><circle cx="118" cy="98" r="10" fill="#38a3ff"/><path d="M90 112q10 8 20 0" stroke="#38a3ff" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="36" y="86" width="10" height="26" rx="5" fill="#9db4e6"/><rect x="154" y="86" width="10" height="26" rx="5" fill="#9db4e6"/><path d="M60 146q40-14 80 0v34H60z" fill="#c9d6ee"/><circle cx="100" cy="162" r="11" fill="#1c4fd6"/></svg>';
const BUB=[['Create a content plan for this month','b1'],["What's the weather like tomorrow?",'b2'],['Summarize this PDF document','b3'],['Help me write an email to my team','b4']].map(([t,c])=>'<button class="bub '+c+'" data-q="'+t+'">'+t+'</button>').join('');
const nm=()=>window.uname||'there';
function build(){
  dv.innerHTML='<aside class="dn"><div class="dbrand"><img src="icon.svg" alt="">Nexus AI <i></i></div><nav>'+[['Chat','home'],['Dashboard','home'],['Tasks','tasks'],['Calendar','cal'],['Notes','notes'],['Integrations','ints'],['Settings','set']].map(([n,v])=>'<button data-v="'+v+'">'+n+'</button>').join('')+'</nav><label class="dmode">Dark Mode <input type="checkbox" id="dm" checked></label><div class="duser"><b id="dav"></b><span id="dun"></span><small>Developer access</small></div></aside>'+
  '<section class="dc"><button id="dx" class="dclose">Close</button><div id="dview"></div><form id="dform"><button type="button" id="dmic" aria-label="Speak">🎤</button><input id="din" placeholder="Type your message here..."><button class="dsend" aria-label="Send">➤</button></form><div class="dchips"><button data-c="s">Smart Search</button><button data-c="i">Generate Image</button><button data-c="b">Brainstorm</button><button data-c="m">More</button></div></section>'+
  '<aside class="dr"><div class="dcard" id="cint"><h3>Integrations</h3><div class="dint" id="dint"></div></div><div class="dcard" id="ctask"><h3>Today\'s Tasks</h3><div id="dtl"></div><form id="dtf"><input id="dti" placeholder="Add a task" required><button>Add</button></form></div><div class="dcard"><h3>Productivity</h3><div id="dprod"></div></div></aside>';
  G('dint').innerHTML=INT.map(a=>'<button data-a="'+a[0]+'"><i style="background:'+a[2]+'">'+a[3]+'</i>'+a[1]+'</button>').join('')+'<button data-a="new"><i style="background:#14294f">+</i>Add New</button>';
  G('dint').onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.a;
    if(k!='new')return app(k);const u=prompt('Website to open (for example youtube.com)');if(u&&confirm('Open '+u+'?'))location.href='https://'+u.replace(/^https?:\/\//,'')};
  dv.querySelectorAll('.dn nav button').forEach(b=>b.onclick=()=>{dv.querySelectorAll('.dn nav button').forEach(x=>x.classList.remove('on'));b.classList.add('on');view(b.dataset.v,b.textContent)});
  G('dm').onchange=e=>dv.classList.toggle('light',!e.target.checked);
  G('dx').onclick=()=>{dv.hidden=true};
  G('dform').onsubmit=e=>{e.preventDefault();const t=G('din').value;G('din').value='';sendQ(t)};
  G('dmic').onclick=()=>{const r=listen(t=>{G('din').value=t},false);if(r){r.onend=()=>{const t=G('din').value;if(t){G('din').value='';sendQ(t)}};r.start()}};
  dv.querySelector('.dchips').onclick=e=>{const c=e.target.dataset.c,q=G('din').value.trim();if(!c)return;
    if(c=='s')return search(q);
    if(c=='i')return say('Image generation needs ComfyUI, which is not connected. Nothing was generated.');
    if(c=='b'){G('din').value='';return sendQ('Brainstorm ideas about: '+(q||'my next project'))}
    dv.hidden=true;Q('[data-t=admin]').click()};
  dv.onclick=e=>{if(e.target.dataset.q)sendQ(e.target.dataset.q)};
  G('dtf').onsubmit=e=>{e.preventDefault();const a=T();a.push({t:G('dti').value.trim(),d:false});G('dti').value='';localStorage.setItem('tasks',JSON.stringify(a));tasks()};
}
const T=()=>JSON.parse(localStorage.getItem('tasks')||'[]');
function tasks(){const a=T(),L=G('dtl');L.innerHTML='';
  a.forEach(k=>{const l=document.createElement('label');l.className='dt';l.innerHTML='<input type="checkbox"'+(k.d?' checked':'')+'><span>'+esc(k.t)+'</span>';l.firstChild.onchange=e=>{k.d=e.target.checked;localStorage.setItem('tasks',JSON.stringify(a));tasks()};L.append(l)});
  const n=a.filter(k=>k.d).length,p=a.length?Math.round(n/a.length*100):0;
  G('dprod').innerHTML='<div class="dring" style="--p:'+p+'"><b>'+p+'%</b></div><div class="dstat"><small>Tasks completed</small><b>'+n+'</b><small>Open tasks</small><b>'+(a.length-n)+'</b><small>Chats saved</small><b>'+chats.length+'</b></div>'}
function addMsg(r,t,keep){if(!keep)log.push({r,t});const el=document.createElement('div');el.className='dm '+r;el.innerHTML=md(t);const m=G('dmsgs');if(m){m.append(el);el.scrollIntoView({block:'end'})}return el}
const say=t=>{view('home');addMsg('a',t)};
function home(){G('dview').innerHTML='<h1 class="dhi">Hello, <span>'+esc(nm())+'</span>! 👋<br>How can I help you today?</h1>'+(log.length?'':'<div class="dhero">'+ROBOT+BUB+'</div>')+'<div id="dmsgs"></div>';log.forEach(m=>addMsg(m.r,m.t,1))}
function view(v){
  if(v=='home'){if(!G('dmsgs'))home();return}
  if(v=='tasks'||v=='ints'){home();G(v=='tasks'?'ctask':'cint').scrollIntoView({behavior:'smooth'});return}
  if(v=='set')return openSettings();
  if(v=='notes'){G('dview').innerHTML='<h2>Notes</h2><textarea id="dnote" placeholder="Write notes here..."></textarea>';const t=G('dnote');t.value=localStorage.getItem('dnotes')||'';t.oninput=()=>localStorage.setItem('dnotes',t.value);return}
  const d=new Date(),f=new Date(d.getFullYear(),d.getMonth(),1).getDay(),n=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  let h='<h2>'+d.toLocaleString('default',{month:'long'})+' '+d.getFullYear()+'</h2><div class="dcal">'+'SMTWTFS'.split('').map(x=>'<b>'+x+'</b>').join('');
  for(let i=0;i<f;i++)h+='<i></i>';for(let i=1;i<=n;i++)h+='<span'+(i==d.getDate()?' class="today"':'')+'>'+i+'</span>';
  G('dview').innerHTML=h+'</div>'}
async function search(q){
  if(!q)return say('Type what to search first, then tap Smart Search.');
  view('home');addMsg('u','Search Wikipedia: '+q);
  try{const j=await(await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=1&gsrsearch='+encodeURIComponent(q)+'&prop=extracts|info&exintro=1&explaintext=1&exchars=700&inprop=url')).json();
    const p=Object.values((j.query||{}).pages||{})[0];addMsg('a',p?'From Wikipedia: '+p.title+'\n'+p.extract+'\n'+p.fullurl:'No Wikipedia article found.')}
  catch(e){addMsg('a','Could not reach Wikipedia.')}}
async function sendQ(t){
  t=t.trim();if(!t||busy)return;view('home');addMsg('u',t);
  if(/weather/i.test(t))return addMsg('a','Live weather needs internet data that Nexus does not have yet, so I will not guess.');
  if(/\bpdf\b/i.test(t))return addMsg('a','PDF reading is not built yet.');
  if(!cfg.model)return addMsg('a','Choose a model in Settings first.');
  hist.push({role:'user',content:t});const el=addMsg('a','Thinking…');let o='';busy=true;
  try{await stream(hist.slice(-8),x=>{o+=x;el.innerHTML=md(o);el.scrollIntoView({block:'end'})});hist.push({role:'assistant',content:o});log[log.length-1].t=o}
  catch(e){const m=e instanceof TypeError?ENGINE_ERR:e.message;el.textContent=m;log[log.length-1].t=m}
  busy=false}
function open_(){if(!built){build();built=true}dv.hidden=false;G('dun').textContent=nm();G('dav').textContent=nm()[0].toUpperCase();home();tasks()}
G('devBtn').onclick=()=>{G('side').classList.remove('open');if(ok)return open_();G('dpwm').textContent='';G('dpwi').value='';G('dpw').showModal()};
G('dpwx').onclick=()=>G('dpw').close();
G('dpwf').onsubmit=async e=>{e.preventDefault();
  if(await sha(G('dpwi').value)==HASH){ok=true;sessionStorage.setItem('dv','1');G('dpw').close();open_()}
  else{G('dpwm').textContent='Wrong password.';await new Promise(r=>setTimeout(r,1000))}};
})();
