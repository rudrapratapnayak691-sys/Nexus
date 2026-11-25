(()=>{
const say=t=>{logV('a',t);speak(t)};
const addNote=(title,text)=>localStorage.setItem('dnotes',(localStorage.getItem('dnotes')||'')+'\n\n## '+title+' ('+new Date().toLocaleString()+')\n'+text);
const NUM={five:5,ten:10,fifteen:15,twenty:20,thirty:30};
async function llm(p){let o='';await stream([{role:'user',content:p}],x=>{o+=x});return o}
window.nexusRoute=async t=>{
  const s=t.toLowerCase().replace(/^(hey |ok )?(nexus|ultron)[,.:]?\s*/,'').trim();let m;
  if(/(?:write|save|put|add)\s+(?:this|that|it)\s+(?:in|to|into|on)\s+(?:my\s+|a\s+|the\s+)?notes?/.test(s)){
    const last=[...vHist].reverse().find(x=>x.role=='assistant');
    if(!last){say('There is nothing to save yet.');return true}
    addNote('From Nexus',last.content);say('Done. Saved to your notes.');return true}
  if(m=s.match(/(?:write|save|add)\s+(.+?)\s+(?:in|to|on|into)\s+(?:my\s+|a\s+|the\s+)?notes?\b/)||s.match(/(?:note down|make a note|take a note)(?: that)?\s+(.+)/)){
    addNote('Voice note',m[1]);say('Done. Saved to your notes.');return true}
  if(m=s.match(/top\s+(\d+|[a-z]+)\s+(.+)/)){const n=NUM[m[1]]||+m[1];
    if(n>0&&n<=50&&cfg.model){const topic=m[2].replace(/\s+(and|then)\s+(write|save|put|add).*$/,'').replace(/\s+(in|to)\s+(my\s+)?notes?$/,'');
      logV('u',t);$('#vstatus').textContent='Thinking…';
      try{const r=await llm('List exactly '+n+' '+topic+'. Numbered list, one short line each, no extra text.');logV('a',r);
        if(/notes?/.test(s)){addNote('Top '+n+' '+topic,r);speak('Done. Top '+n+' '+topic+'. Saved to your notes. '+r)}else speak(r)}
      catch(e){logV('a',e instanceof TypeError?ENGINE_ERR:e.message)}
      $('#vstatus').textContent='Listening…';return true}}
  if(m=s.match(/call\s+([\d\s+()-]{5,})/)){const n=m[1].replace(/[^\d+]/g,'');
    if(confirm('Open the dialer for '+n+'?'))location.href='tel:'+n;return true}
  if(m=s.match(/(?:play|watch)\s+(.+?)(?:\s+on youtube)?$/)){
    say('Searching YouTube for '+m[1]+'.');if(confirm('Open YouTube search for "'+m[1]+'"?'))location.href='https://www.youtube.com/results?search_query='+encodeURIComponent(m[1]);return true}
  if(/^(open|set|turn|show)\b|alarm|flashlight|torch|settings|battery|storage|phone status/.test(s)){
    document.getElementById('co').textContent='';await cmd(s);const r=document.getElementById('co').textContent;if(r)say(r);return true}
  return false};
if(/[?&]talk=1/.test(location.search)){let n=0;const iv=setInterval(()=>{
  if(++n>40)return clearInterval(iv);
  if(document.getElementById('auth').hidden){clearInterval(iv);document.querySelector('[data-t=vision]').click();
    setTimeout(()=>{if(!vOn)document.getElementById('talk').click()},500)}},500)}
})();
