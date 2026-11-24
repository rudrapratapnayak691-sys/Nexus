/* 1) Paste your Supabase Project URL and anon (public) key below. */
const SUPABASE_URL='https://jdgojghxrvarhwwqhpoy.supabase.co/rest/v1/',SUPABASE_KEY='sb_publishable_n5AXaDvoHA5W40M7KUGJRg_Sdg8ct5t';
const sb=SUPABASE_URL.startsWith('https://')&&window.supabase?supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
let user=null,mode='login',tm=null;
const A=id=>document.getElementById(id);
const say=(t,bad)=>{A('am').textContent=t;A('am').className=bad?'err':'small'};
function setMode(m){mode=m;const L=m=='login',S=m=='signup',F=m=='forgot',R=m=='reset';
  A('at').textContent={login:'Log in',signup:'Create your account',forgot:'Reset your password',reset:'Choose a new password'}[m];
  A('au').hidden=!S;A('ae').hidden=R;A('ae').required=!R;A('ap').hidden=F;A('ap').required=!F;
  A('ap').autocomplete=L?'current-password':'new-password';
  A('ab').textContent={login:'Log in',signup:'Create account',forgot:'Send reset link',reset:'Save password'}[m];
  A('alt1').hidden=R;A('alt2').hidden=!L;
  A('alt1').textContent=L?'Create account':'Back to log in';A('alt1').onclick=()=>setMode(L?'signup':'login');
  A('alt2').textContent='Forgot password';A('alt2').onclick=()=>setMode('forgot');say('')}
const clean=c=>({id:c.id,user_id:user.id,title:c.title,msgs:c.msgs.map(({images,...m})=>m),updated_at:new Date().toISOString()});
async function enter(u){
  user=u;A('auth').hidden=true;A('logout').hidden=false;
  const name=(u.user_metadata&&u.user_metadata.username)||u.email;A('me').textContent=name;
  const {data,error}=await sb.from('nexus_chats').select('id,title,msgs').order('updated_at',{ascending:false});
  if(error)A('me').textContent=name+' (sync error: '+error.message+')';
  else if(data.length)chats=data.map(d=>({id:d.id,title:d.title,msgs:d.msgs||[]}));
  else{const l=chats.filter(c=>c.msgs.length);if(l.length)await sb.from('nexus_chats').upsert(l.map(clean))}
  cur=chats[0]||null;if(!cur)newChat();else show();
  firstRun();
}
window.onSave=()=>{if(!user||!cur||!cur.msgs.length)return;clearTimeout(tm);
  tm=setTimeout(()=>sb.from('nexus_chats').upsert(clean(cur)).then(r=>{if(r.error)A('me').textContent='Sync error: '+r.error.message}),800)};
window.onDel=id=>{if(user)sb.from('nexus_chats').delete().eq('id',id).then(()=>{})};
A('af').onsubmit=async e=>{
  e.preventDefault();if(!sb)return;
  const em=A('ae').value.trim(),pw=A('ap').value,back=location.origin+location.pathname;A('ab').disabled=true;
  try{let r;
    if(mode=='login'){r=await sb.auth.signInWithPassword({email:em,password:pw});if(r.error)throw r.error}
    else if(mode=='signup'){r=await sb.auth.signUp({email:em,password:pw,options:{emailRedirectTo:back,data:{username:A('au').value.trim()}}});if(r.error)throw r.error;if(!r.data.session){setMode('login');say('Check your email to confirm your account, then log in.')}}
    else if(mode=='forgot'){r=await sb.auth.resetPasswordForEmail(em,{redirectTo:back});if(r.error)throw r.error;setMode('login');say('If that email has an account, a reset link is on its way.')}
    else{r=await sb.auth.updateUser({password:pw});if(r.error)throw r.error;setMode('login');enter(r.data.user)}
  }catch(x){say(x.message,1)}
  A('ab').disabled=false};
A('logout').onclick=async()=>{await sb.auth.signOut();localStorage.removeItem('chats');location.reload()};
setMode('login');
if(sb){
  sb.auth.onAuthStateChange((ev,s)=>{
    if(ev=='PASSWORD_RECOVERY'){setMode('reset');A('auth').hidden=false;return}
    if(s&&s.user&&mode!='reset'&&(!user||user.id!=s.user.id))setTimeout(()=>enter(s.user),0)});
}else{
  say('Login is not set up yet. Add your Supabase URL and key in auth.js.',1);
  A('off').hidden=false;A('off').onclick=()=>{A('auth').hidden=true;firstRun()};
}
