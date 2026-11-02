import {createTreasureFanfare} from './treasure-fanfare.js';
import {layoutWorldPins} from './world-navigation.js';
import {setupTreasureHunt} from './treasure.js';
import {mountIsland} from './scene.js';
import {PLACES,ISLAND_DESTINATIONS} from './world.js';
import {setupIslandExperience} from './island-experience.js';
const $=id=>document.getElementById(id),stage=$('stage');
const fanfare=createTreasureFanfare();
const titles=Object.fromEntries(PLACES.map(p=>[p.id,p.name]));
let selected='zoo:fox',busy=false,dispose=()=>{},mode='overview',experience=null,treasure=null;
const visited=new Set(),pins=new Map(),destinations=new Map();
for(const p of ISLAND_DESTINATIONS){
 const pin=document.createElement('button');pin.type='button';pin.className='world-pin';pin.setAttribute('aria-label','Besök '+p.name+' vid '+p.place);pin.innerHTML='<span>'+p.emoji+'</span>'+p.name;pin.addEventListener('click',()=>visit(p.id));$('world-pins').append(pin);pins.set(p.id,pin);
 const b=document.createElement('button');b.type='button';b.className='destination';b.innerHTML='<span class="destination-icon">'+p.emoji+'</span><span><b>'+p.name+'</b><small>'+p.place+'</small></span><span class="visited" aria-label="Besökt" hidden>✓</span>';b.addEventListener('click',()=>visit(p.id));$('world-destinations').append(b);destinations.set(p.id,b);
}
function setMode(next,id){mode=next;document.body.dataset.worldMode=next;const p=PLACES.find(p=>p.id===id);$('world-title').textContent=next==='visit'?p.place:'Vännernas ö';$('world-description').textContent=next==='visit'?p.text:'Tryck på en plats på ön eller välj en vän i listan.';$('world-back').hidden=!['visit','info','treasure'].includes(next);$('world-pins').hidden=next!=='overview';if(next==='visit')visited.add(id);$('world-visited').textContent=visited.size+' av 8 besökta';if(next==='info'){$('world-title').textContent='Debatt-AI · Välkomstplatsen';$('world-description').textContent='En plats för nyfikenhet, kunskap och samtal.';}if(next==='treasure'){$('world-title').textContent='Skattgläntan';$('world-description').textContent='Åtta ledtrådar öppnar öns hemliga skatt.';}$('world-about-panel').hidden=next!=='info';treasure?.visit(next==='visit'?id:null);experience?.visit(next==='visit'?id:null);refreshControls();}
function refreshControls(){
 const model=stage.getAttribute('data-rufus-model'),renderer=stage.getAttribute('data-rufus-renderer'),active=window.zooUI?.active?.(),disabled=busy||active||!dispose.setModel||renderer==='unavailable';
 experience?.session(Boolean(active||busy));$('world-back').disabled=busy||active;
 for(const [id,b] of destinations){b.disabled=disabled;b.setAttribute('aria-current',(mode==='info'&&id==='about'||mode==='treasure'&&id==='treasure'||mode==='visit'&&selected==='zoo:'+id)?'location':'false');b.querySelector('.visited').hidden=!visited.has(id);}for(const pin of pins.values())pin.disabled=disabled;
 $('world-map-fallback').hidden=renderer!=='unavailable';if(renderer==='unavailable')$('world-pins').hidden=true;
 const title=titles[selected.slice(4)];
 $('rufus-build-status').textContent=renderer==='unavailable'?'3D kunde inte starta':model==='loading'?'Resan förbereds · laddar figur…':model==='glb'?(mode==='overview'?'Välj en plats på ön':title):'Figuren kunde inte laddas. Välj en plats för att försöka igen.';
 if(mode==='info')$('rufus-build-status').textContent='Debatt-AI · Välkomstplatsen';if(mode==='treasure')$('rufus-build-status').textContent='Skattkistan · samla åtta ledtrådar';
 $('world-clock-status').textContent=stage.getAttribute('data-world-lighting')||'Din lokala tid';
 if(!active)for(const id of ['start-stt','start-voice','start-text'])$(id).disabled=busy||(mode!=='visit'||model!=='glb');
}
async function choose(id){
 if(busy||window.zooUI?.active?.()||!dispose.setModel)return false;
 const name='zoo:'+id,same=name===selected&&stage.getAttribute('data-rufus-model')==='glb';busy=true;refreshControls();let ok=false;
 try{ok=same||await dispose.setModel('/vannernas-o/v1/models/'+id+'.glb');if(ok){selected=name;window.zooUI?.select(id);dispose.world?.visit(id);dispose.redraw?.();setMode('visit',id);dispose.greet?.();stage.querySelector('canvas')?.setAttribute('aria-label',titles[id]+' vid '+PLACES.find(p=>p.id===id).place);}else $('world-description').textContent='Figuren kunde inte laddas. Välj en plats för att försöka igen.';}finally{busy=false;refreshControls();}return ok;
}
function revealVisit(){stage.focus?.({preventScroll:true});stage.scrollIntoView?.({block:'start',inline:'nearest',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'instant':'smooth'});}
async function visit(id){
 if(id==='about'||id==='treasure'){
  if(busy||window.zooUI?.active?.()||!dispose.world)return;
  if(id==='treasure')dispose.world.visitTreasure();else dispose.world.visitInfo();dispose.redraw?.();setMode(id==='treasure'?'treasure':'info');revealVisit();return;
 }
 if(titles[id]){const ok=await choose(id);if(ok)revealVisit();return ok;}
}
function projectPins(points,viewMode){if(viewMode!=='overview')return;const items=points.filter(p=>pins.has(p.id)).map(p=>({...p,width:pins.get(p.id).offsetWidth||110,height:pins.get(p.id).offsetHeight||44}));for(const p of layoutWorldPins(items,stage.clientWidth||1000,stage.clientHeight||600)){const pin=pins.get(p.id);pin.style.left=p.x+'%';pin.style.top=p.y+'%';pin.style.setProperty('--pin-link-length',Math.hypot(p.dx,p.dy)+'px');pin.style.setProperty('--pin-link-angle',Math.atan2(-p.dx,p.dy)+'rad');pin.hidden=!p.visible;}}
function mount(){try{window.zooUI?.select('fox');dispose=mountIsland(stage,undefined,{modelUrl:'/vannernas-o/v1/models/fox.glb',onWorldProject:projectPins,onTreasureReveal:()=>{if(!document.hidden)fanfare.play();}});}catch{stage.setAttribute('data-rufus-renderer','render-error')}dispose.world?.setLanguage?.(window.islandI18n?.language||'sv');dispose.world?.setQuestComplete(experience?.quest.stage===5);dispose.world?.setTreasureOpen(treasure?.hunt.opened);setMode('overview');}
$('world-back').addEventListener('click',()=>{if(busy||window.zooUI?.active?.())return;dispose.world?.overview();dispose.redraw?.();setMode('overview');});
stage.addEventListener('click',e=>{if(mode!=='overview'||e.target.tagName!=='CANVAS'||busy||window.zooUI?.active?.())return;const r=stage.getBoundingClientRect();const id=dispose.world?.pick((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);if(id)visit(id)});
window.addEventListener('zoo-session-state',refreshControls);
experience=setupIslandExperience({document,window,onTravel:visit,onComplete:value=>{dispose.world?.setQuestComplete(value);dispose.redraw?.();}});
treasure=setupTreasureHunt({document,window,onTravel:visit,onPrepare:()=>fanfare.prime(),onOpen:(value,options)=>{if(!value)fanfare.stop();dispose.world?.setTreasureOpen(value,options);dispose.redraw?.();}});
const observe=()=>observer.observe(stage,{attributes:true,attributeFilter:['data-rufus-model','data-rufus-renderer','data-world-lighting']});const observer=new MutationObserver(refreshControls);observe();mount();
window.addEventListener('pagehide',()=>{fanfare.stop();dispose();observer.disconnect()});window.addEventListener('pageshow',e=>{if(e.persisted){selected='zoo:fox';busy=false;observe();mount()}});

document.addEventListener('visibilitychange',()=>{if(document.hidden)fanfare.stop();});

window.addEventListener('island-language-change',()=>{dispose.world?.setLanguage?.(window.islandI18n?.language||'sv');dispose.redraw?.();});
