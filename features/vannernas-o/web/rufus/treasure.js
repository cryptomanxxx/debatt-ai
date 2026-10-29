import {TREASURE_CLUES,TREASURE_MIN_MS,TREASURE_MIN_TURNS} from './treasure-data.js';
export function createTreasureHunt(){
 let active=false,opened=false;const progress=new Map(TREASURE_CLUES.map(c=>[c.id,{ms:0,turns:0,solved:false}]));
 const ready=id=>{const p=progress.get(id);return active&&Boolean(p&&p.ms>=TREASURE_MIN_MS&&p.turns>=TREASURE_MIN_TURNS)};
 return {get active(){return active},get opened(){return opened},get count(){return [...progress.values()].filter(p=>p.solved).length},progress:id=>progress.get(id),ready,
  start(){active=true},tick(id,ms){const p=progress.get(id);if(active&&p)p.ms=Math.min(TREASURE_MIN_MS,p.ms+Math.max(0,ms))},turn(id){const p=progress.get(id);if(active&&p)p.turns=Math.min(TREASURE_MIN_TURNS,p.turns+1)},
  solve(id,value){const p=progress.get(id),clue=TREASURE_CLUES.find(c=>c.id===id);if(!ready(id)||!clue||String(value).trim()!==clue.digit)return false;p.solved=true;return true},
  submit(value){if(opened)return false;if(String(value).trim()!==TREASURE_CLUES.map(c=>c.digit).join(''))return false;active=true;opened=true;return true},
  reset(){active=false;opened=false;for(const p of progress.values())Object.assign(p,{ms:0,turns:0,solved:false})}
 };
}
export function setupTreasureHunt({document:doc,window:win,onTravel,onOpen,onPrepare=()=>{},now=()=>Date.now(),schedule=setInterval,cancel=clearInterval}){
 const $=id=>doc.getElementById(id),hunt=createTreasureHunt(),rows=new Map(),announced=new Set();let current=null,sessionAnimal=null,connected=false,locked=false,timer=null,lastTick=now();
 function render(){
  $('treasure-start').hidden=hunt.active;$('treasure-start').disabled=locked;$('treasure-reset').hidden=!hunt.active;$('treasure-reset').disabled=locked;$('treasure-book').hidden=!hunt.active;
  $('treasure-progress').textContent=hunt.opened?'Skatten är öppnad!':'Ledtrådar: '+hunt.count+' av 8';$('treasure-chest-travel').disabled=locked;
  $('treasure-code').disabled=hunt.opened||locked;$('treasure-unlock').disabled=$('treasure-code').disabled;
  $('treasure-code-form').hidden=hunt.opened;$('treasure-reward').hidden=!hunt.opened;
  for(const c of TREASURE_CLUES){const p=hunt.progress(c.id),row=rows.get(c.id),ready=hunt.ready(c.id);row.travel.disabled=locked;row.status.textContent=p.solved?'✓ Siffra '+c.digit:ready?'Ledtråden är redo':Math.floor(p.ms/1000)+' / 30 sek · '+p.turns+' / 2 samtalsturer';row.riddle.hidden=!ready||p.solved;row.form.hidden=!ready||p.solved;row.read.hidden=!ready||p.solved||current!==c.id;row.read.disabled=!connected||sessionAnimal!==c.id;row.slot.textContent=p.solved?c.digit:'?';
   if(ready&&!announced.has(c.id)){announced.add(c.id);$('treasure-note').textContent=c.name+' har en ledtråd åt dig!';if(connected&&sessionAnimal===c.id)win.zooUI?.requestTreasureClue?.();}
  }
 }
 for(const [index,c] of TREASURE_CLUES.entries()){
  const row=doc.createElement('li'),heading=doc.createElement('strong'),status=doc.createElement('small'),travel=doc.createElement('button'),riddle=doc.createElement('p'),form=doc.createElement('form'),input=doc.createElement('input'),submit=doc.createElement('button'),feedback=doc.createElement('span'),read=doc.createElement('button'),slot=doc.createElement('span');
  row.className='treasure-row';heading.textContent=(index+1)+'. '+c.emoji+' '+c.name;travel.type='button';travel.className='secondary';travel.textContent='Besök';travel.addEventListener('click',()=>{if(!locked)onTravel(c.id)});riddle.textContent=c.riddle;input.type='text';input.inputMode='numeric';input.pattern='[0-9]';input.maxLength=1;input.setAttribute('aria-label','Svar på '+c.name+'s ledtråd');submit.type='submit';submit.className='secondary';submit.textContent='Spara siffran';feedback.setAttribute('role','status');form.append(input,submit,feedback);form.addEventListener('submit',e=>{e.preventDefault();if(hunt.solve(c.id,input.value)){feedback.textContent='';input.value='';$('treasure-note').textContent='Rätt! '+c.explanation+'. Siffran sparas på plats '+(index+1)+'.';render();}else feedback.textContent='Prova att räkna en gång till.';});read.type='button';read.className='secondary';read.textContent='Säg ledtråden igen';read.addEventListener('click',()=>win.zooUI?.requestTreasureClue?.());row.append(heading,status,travel,riddle,read,form);$('treasure-clues').append(row);slot.className='treasure-slot';slot.setAttribute('aria-label','Siffra '+(index+1));$('treasure-slots').append(slot);rows.set(c.id,{status,travel,riddle,form,read,slot});
 }
 function stopClock(){if(timer!==null)cancel(timer);timer=null}
 function tick(){const time=now(),ms=Math.max(0,Math.min(1500,time-lastTick));lastTick=time;if(!doc.hidden&&connected&&sessionAnimal&&hunt.active){hunt.tick(sessionAnimal,ms);render();}}
 function syncClock(){stopClock();lastTick=now();if(hunt.active&&connected)timer=schedule(tick,1000);}
 $('treasure-start').addEventListener('click',()=>{if(locked)return;hunt.start();$('treasure-note').textContent='Besök vännerna i valfri ordning. Prata eller skriv minst två samtalsturer under 30 sekunder med var och en.';render();syncClock()});
 $('treasure-reset').addEventListener('click',()=>{if(locked)return;hunt.reset();announced.clear();$('treasure-code').value='';$('treasure-note').textContent='Skattjakten börjar om.';onOpen(false);stopClock();render()});
 $('treasure-chest-travel').addEventListener('click',()=>{if(!locked)onTravel('treasure')});
 $('treasure-code-form').addEventListener('submit',e=>{e.preventDefault();if(locked||hunt.opened)return;if(hunt.submit($('treasure-code').value)){onPrepare();onTravel('treasure');onOpen(true,{celebrate:true});$('treasure-note').textContent=hunt.count===8?'Rätt kod! Kistan öppnas – ni löste skattjakten tillsammans.':'Rätt kod! Kistan öppnas.';render();}else $('treasure-note').textContent='Koden stämmer inte ännu. Prova igen.';});
 win.addEventListener('zoo-session-state',e=>{if(!e.detail)return;tick();sessionAnimal=e.detail.animal;connected=Boolean(e.detail.connected);locked=Boolean(e.detail.connected||e.detail.connecting);render();syncClock()});
 win.addEventListener('zoo-conversation-turn',e=>{if(connected&&sessionAnimal===e.detail?.animal&&hunt.active){tick();hunt.turn(sessionAnimal);render();}});
 doc.addEventListener('visibilitychange',()=>{lastTick=now()});win.addEventListener('pagehide',stopClock);win.addEventListener('pageshow',syncClock);
 win.zooTreasure={active:()=>hunt.active};render();
 return {visit(id){current=id;render()},get hunt(){return hunt},dispose:stopClock};
}
