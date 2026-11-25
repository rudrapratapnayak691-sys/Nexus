const ADMIN_HASH='3f23d867c41c81aa52915b73ddfd41c8b661964845ed43d573fca8217f1f0bee';
const D=id=>document.getElementById(id);
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
let unlocked=sessionStorage.getItem('adm')=='1',torch=null,wl=null,timer=null;
const out=t=>{D('co').textContent=t},ok=m=>confirm(m);
const intent=(a,x)=>{location.href='intent:#Intent;action='+a+';'+(x||'')+'end'};
const APPS={youtube:['YouTube','com.google.android.youtube','https://youtube.com'],gmail:['Gmail','com.google.android.gm','https://mail.google.com'],maps:['Maps','com.google.android.apps.maps','https://maps.google.com'],whatsapp:['WhatsApp','com.whatsapp','https://web.whatsapp.com'],slack:['Slack','com.Slack','https://slack.com'],notion:['Notion','notion.id','https://notion.so'],linkedin:['LinkedIn','com.linkedin.android','https://linkedin.com'],instagram:['Instagram','com.instagram.android','https://instagram.com'],x:['X','com.twitter.android','https://x.com']};
const app=k=>{const[n,p,u]=APPS[k];if(ok('Open '+n+'?'))location.href='intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package='+p+';S.browser_fallback_url='+encodeURIComponent(u)+';end'};
const setg=a=>{if(ok('Open this Android settings screen?'))intent(a)};
async function snap(){
  const u=navigator.userAgentData,h=u?await u.getHighEntropyValues(['model','platformVersion','platform']).catch(()=>({})):{};
  let b='Not supported',bt='Not supported',st='Not available';
  try{const x=await navigator.getBattery();b=Math.round(x.level*100)+'% '+(x.charging?'(charging)':'(not charging)')}catch(e){}
  try{if(navigator.bluetooth)bt=(await navigator.bluetooth.getAvailability())?'Available':'Unavailable'}catch(e){}
  try{const e=await navigator.storage.estimate();st=(e.usage/1e6|0)+' MB used of '+(e.quota/1e9).toFixed(1)+' GB browser quota'}catch(e){}
  const c=navigator.connection||{};
  return[['Model',h.model||'Hidden by browser'],['Android',h.platform=='Android'?h.platformVersion:(h.platform||navigator.platform)],['Browser',u&&u.brands?u.brands.filter(x=>!/Not/i.test(x.brand)).map(x=>x.brand+' '+x.version).join(', '):'Unknown'],['Screen',Math.round(screen.width*devicePixelRatio)+' × '+Math.round(screen.height*devicePixelRatio)],['RAM (approx.)',navigator.deviceMemory?navigator.deviceMemory+' GB (rounded)':'Hidden'],['CPU cores',navigator.hardwareConcurrency||'?'],['Browser storage',st],['Battery',b],['Network',navigator.onLine?'Online '+(c.effectiveType||'')+(c.downlink?', '+c.downlink+' Mbps':'')+(c.rtt?', '+c.rtt+' ms':''):'Offline'],['Bluetooth',bt],['Page open for',Math.round(performance.now()/60000)+' min']]}
async function paint(){const r=await snap();D('dev').innerHTML=r.map(x=>'<tr><td>'+x[0]+'</td><td>'+esc(String(x[1]))+'</td></tr>').join('');return r}
function stopTorch(){torch.getTracks().forEach(t=>t.stop());torch=null}
async function flash(on){
  try{if(!on){if(torch){stopTorch();out('Flashlight off.')}else out('Flashlight is already off.');return}
    if(torch)return;if(!ok('Allow Nexus to use the camera LED as a flashlight?'))return;
    torch=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    await torch.getVideoTracks()[0].applyConstraints({advanced:[{torch:true}]});out('Flashlight on.')
  }catch(e){if(torch)stopTorch();out('Flashlight is not supported by this phone or browser, or permission was denied.')}}
async function wake(){try{if(wl){await wl.release();wl=null;out('Screen may sleep again.');return}wl=await navigator.wakeLock.request('screen');out('Screen stays on while this page is open.')}catch(e){out('Wake lock is not supported here.')}}
const CTL=[['Flashlight',()=>flash(!torch)],['Keep screen on',wake],['Notifications',()=>window.Notification?Notification.requestPermission().then(p=>out('Notifications: '+p)):out('Not supported.')],['Share Nexus',()=>navigator.share?navigator.share({title:'Nexus AI',url:location.href}):out('Sharing is not supported here.')],['Wi-Fi settings',()=>setg('android.settings.WIFI_SETTINGS')],['Bluetooth settings',()=>setg('android.settings.BLUETOOTH_SETTINGS')],['Display settings',()=>setg('android.settings.DISPLAY_SETTINGS')],['Battery settings',()=>setg('android.intent.action.POWER_USAGE_SUMMARY')],['Phone settings',()=>setg('android.settings.SETTINGS')]];
async function cmd(t){
  t=t.toLowerCase().replace(/^nexus[,:]?\s*/,'');let m;
  if(/flashlight|torch/.test(t))return flash(!/off/.test(t));
  if(/settings/.test(t))return setg(/wi-?fi/.test(t)?'android.settings.WIFI_SETTINGS':/bluetooth/.test(t)?'android.settings.BLUETOOTH_SETTINGS':/display|screen/.test(t)?'android.settings.DISPLAY_SETTINGS':/battery/.test(t)?'android.intent.action.POWER_USAGE_SUMMARY':'android.settings.SETTINGS');
  if(m=t.match(/alarm.*?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)){let h=+m[1]%24;if(m[3]=='pm'&&h<12)h+=12;if(m[3]=='am'&&h==12)h=0;
    if(ok('Set an alarm for '+h+':'+(m[2]||'00')+'?'))intent('android.intent.action.SET_ALARM','i.android.intent.extra.alarm.HOUR='+h+';i.android.intent.extra.alarm.MINUTES='+(+m[2]||0)+';S.android.intent.extra.alarm.MESSAGE=Nexus;');return}
  if(/storage/.test(t)){const r=await paint();return out(r.find(x=>x[0]=='Browser storage')[1]+'. Total phone storage needs the native app.')}
  if(/battery/.test(t)){const r=await paint();return out('Battery: '+r.find(x=>x[0]=='Battery')[1]+'. Battery health needs the native app.')}
  if(/status|phone info|device/.test(t)){await paint();return out('Device status updated above.')}
  if(/installed|apps/.test(t))return out('Browsers cannot list installed apps. Use the Integrations buttons to open apps.');
  if(/brightness|volume|temperature/.test(t))return out('Android does not let a web page change or read that. It needs the native app.');
  if(m=t.match(/open\s+([\w.-]+)/)){const k=Object.keys(APPS).find(x=>x==m[1]||APPS[x][0].toLowerCase()==m[1]);if(k)return app(k);
    if(/\./.test(m[1])){if(ok('Open '+m[1]+'?'))location.href='https://'+m[1];return}
    return out('I know these apps: '+Object.values(APPS).map(a=>a[0]).join(', ')+'.')}
  out('Try: show my phone status, how much storage is left, open YouTube, turn on the flashlight, open Bluetooth settings, set an alarm for 6 am.')}
let tasks=JSON.parse(localStorage.getItem('tasks')||'[]');
function drawTasks(){D('tl').innerHTML='';
  tasks.forEach(k=>{const l=document.createElement('label');l.className='tk';l.innerHTML='<input type="checkbox"'+(k.d?' checked':'')+'><span>'+esc(k.t)+'</span>';l.firstChild.onchange=e=>{k.d=e.target.checked;sv()};D('tl').append(l)});
  const n=tasks.filter(k=>k.d).length,p=tasks.length?Math.round(n/tasks.length*100):0;
  D('ring').innerHTML='<div class="ring" style="--p:'+p+'"><b>'+p+'%</b></div><span class="small">Productivity: '+n+' of '+tasks.length+' tasks done</span>'}
const sv=()=>{localStorage.setItem('tasks',JSON.stringify(tasks));drawTasks()};
D('tf').onsubmit=e=>{e.preventDefault();tasks.push({t:D('ti').value.trim(),d:false});D('ti').value='';sv()};
const mk=(n,f)=>{const b=document.createElement('button');b.className='ib';b.textContent=n;b.onclick=f;return b};
D('ctl').append(...CTL.map(([n,f])=>mk(n,f)));
D('apps').append(...Object.keys(APPS).map(k=>mk(APPS[k][0],()=>app(k))));
function reveal(){D('lockmsg').hidden=true;D('abody').hidden=false;paint();drawTasks();clearInterval(timer);timer=setInterval(()=>D('admin').classList.contains('on')&&paint(),5000)}
const askPw=()=>{if(!unlocked){D('pwm').textContent='';D('pwi').value='';D('pw').showModal()}};
D('unlock').onclick=askPw;document.querySelector('[data-t=admin]').addEventListener('click',askPw);
D('pwf').onsubmit=async e=>{e.preventDefault();
  if(await sha(D('pwi').value)==ADMIN_HASH){unlocked=true;sessionStorage.setItem('adm','1');D('pw').close();reveal()}
  else{D('pwm').textContent='Wrong password.';await new Promise(r=>setTimeout(r,1000))}};
if(unlocked)reveal();
D('cf').onsubmit=e=>{e.preventDefault();cmd(D('ci').value);D('ci').value=''};
D('cmic').onclick=()=>{const r=listen(t=>{D('ci').value=t},false);if(r){r.onend=()=>D('ci').value&&cmd(D('ci').value);r.start()}};
