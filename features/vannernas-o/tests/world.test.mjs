import {createTreasureFanfare} from '../web/rufus/treasure-fanfare.js';
import {layoutWorldPins} from '../web/rufus/world-navigation.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import * as T from 'three';
import {setupIslandExperience} from '../web/rufus/island-experience.js';
import {lightingForHour} from '../web/rufus/daylight.js';
import {PLACES,INFO_PLACE,TREASURE_PLACE,ISLAND_DESTINATIONS,createDiscoveryWorld} from '../web/rufus/world.js';
assert.equal(new Set(PLACES.map(p=>p.id)).size,8);
const camera=new T.PerspectiveCamera(35,1,.1,150);let points;
const world=createDiscoveryWorld(camera,{onProject:p=>points=p});
let meshes=0;world.root.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite))}});assert.ok(meshes<230);
for(const aspect of [.45,.7,1,1.4,2,2.4]){
 world.overview();world.resize(aspect);world.update(0,.1,true);
 assert.equal(points.length,10);
 let minX=1,maxX=-1,minY=1,maxY=-1;for(let i=0;i<world.overviewVertices.length;i+=3){const v=new T.Vector3().fromArray(world.overviewVertices,i).project(camera);assert.ok(Math.abs(v.x)<.93&&Math.abs(v.y)<.93,'actual island outline fits at '+aspect);minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}assert.ok(Math.max(maxX-minX,maxY-minY)>1.3,'island uses the viewport instead of excessive zoom-out');
 assert.equal(world.seeds.visible,false);
for(const p of points){assert.ok(p.visible);assert.ok(p.x>0&&p.x<100&&p.y>0&&p.y<100)}
 for(const p of PLACES){const projected=new T.Vector3(p.x,-.44,p.z).project(camera);assert.equal(world.pick(projected.x,projected.y),p.id);}
 for(const p of PLACES){assert.equal(world.visit(p.id),true);assert.equal(world.seeds.visible,false,'no floating dots in close-up');world.update(1,.1,true);const head=new T.Vector3(p.x,2,p.z).project(camera),feet=new T.Vector3(p.x,-.43,p.z).project(camera);assert.ok(Math.abs(head.x)<.9&&Math.abs(head.y)<.95&&Math.abs(feet.y)<.95);assert.equal(world.avatarAnchor.position.x,p.x);assert.equal(world.avatarAnchor.position.z,p.z);
  for(const [x,y] of [[0,1.9],[0,.9],[-.55,.9],[.55,.9],[0,0]]){const target=new T.Vector3(p.x+x,y,p.z),direction=target.clone().sub(camera.position),ray=new T.Raycaster(camera.position,direction.clone().normalize(),.01,direction.length()-.15);assert.equal(ray.intersectObjects(world.blockers.filter(o=>o.visible),false).length,0,'clear sight to '+p.id+' at aspect '+aspect);}
}
}
world.overview();world.update(0,.1,true);assert.ok(world.blockers.every(o=>o.visible),'all scenery returns in overview');
assert.equal(world.visit('invalid'),false);world.overview();world.update(0,.1,true);const before=camera.position.clone();world.visit('robot');world.update(.1,1/30);assert.ok(camera.position.distanceTo(before)>0);world.update(.2,.1,true);const settled=camera.position.clone();world.update(.3,.1,true);assert.ok(camera.position.distanceTo(settled)<1e-6);
assert.ok(world.ocean.position.y<-.55);assert.ok(world.ocean.scale.x>world.overviewBounds.max.x*5);
for(const hour of [0,6,9,13,19,23]){const light=lightingForHour(hour);assert.ok(light.ambient>=1.5&&light.key>=1);assert.ok(Number.isInteger(light.top));}
assert.equal(lightingForHour(0).label,'Natt');assert.equal(lightingForHour(8).label,'Morgon');assert.equal(lightingForHour(13).label,'Dag');assert.equal(lightingForHour(19).label,'Kväll');assert.equal(lightingForHour(24).top,lightingForHour(0).top);
assert.equal(world.setLighting('night'),true);assert.equal(world.lighting.label,'Natt');assert.equal(world.setLighting('day'),true);assert.equal(world.lighting.label,'Dag');assert.equal(world.setLighting('invalid'),false);
console.log('Full island bounds at 6 ratios, surrounding sea, no close-up particles, readable clock lighting and manual presets passed.');
console.log('World: eight homes, finite batched scenery ('+meshes+' draws), 6 aspect ratios, 8 ground hit targets, full-body framing, smooth/reduced camera passed.');
// Exercise the actual UI controller against a lightweight DOM and renderer boundary.
class Element{constructor(id=''){this.id=id;this.children=[];this.attrs={};this.listeners={};this.hidden=false;this.disabled=false;this.style={};this.value='';this.checked=false;this.textContent='';}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null}addEventListener(k,fn){this.listeners[k]=fn}append(e){this.children.push(e)}replaceChildren(){this.children=[]}querySelector(q){if(!this.queries)this.queries={};return this.queries[q]??=new Element(q)}click(){if(!this.disabled)return this.listeners.click?.({target:this})}}
const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id)};get('stage').attrs={'data-rufus-model':'glb','data-rufus-renderer':'ready'};
let active=false,modelCalls=0,location='fox',notebookTravel;const scrolls=[];get('stage').scrollIntoView=options=>scrolls.push({location,options});get('stage').focus=options=>assert.equal(options.preventScroll,true);const events={};const win={zooUI:{active:()=>active,select:id=>{location=id}},addEventListener:(k,fn)=>events[k]=fn};
const doc={getElementById:get,createElement:()=>new Element(),addEventListener(){},body:{dataset:{},style:{}}};
let release;const stop=()=>{};stop.world={setTreasureOpen(){},visitTreasure:()=>{location='treasure'},visitInfo:()=>{location='about'},setQuestComplete(){},setLighting:value=>{location=value},visit:id=>{location=id},overview(){}};stop.redraw=()=>{};stop.greet=()=>{};stop.testMouth=()=>{};stop.setModel=async()=>{modelCalls++;if(release)await new Promise(r=>release=r);return true};
const context={createTreasureFanfare,PLACES,INFO_PLACE,TREASURE_PLACE,ISLAND_DESTINATIONS,layoutWorldPins,setupIslandExperience,setupTreasureHunt:options=>{notebookTravel=options.onTravel;return {visit(){},hunt:{opened:false}}},mountIsland:()=>stop,window:win,document:doc,MutationObserver:class{observe(){}disconnect(){}},setTimeout,clearTimeout};vm.createContext(context);
vm.runInContext(fs.readFileSync('web/rufus/entry.js','utf8').replace(/^import .*;\n/gm,''),context);
assert.equal(doc.body.dataset.worldMode,'overview');assert.equal(get('world-destinations').children.length,10);assert.equal(get('world-pins').children.length,10);
for(const [i,p] of PLACES.entries()){
 await get('world-destinations').children[i].click();assert.equal(doc.body.dataset.worldMode,'visit');assert.equal(location,p.id);assert.equal(get('world-title').textContent,p.place);assert.equal(get('start-stt').disabled,false);
 active=true;events['zoo-session-state']();assert.equal(get('world-back').disabled,true);assert.ok(get('world-destinations').children.every(b=>b.disabled));get('world-back').click();assert.equal(doc.body.dataset.worldMode,'visit');
 active=false;events['zoo-session-state']();get('world-back').click();assert.equal(doc.body.dataset.worldMode,'overview');assert.equal(get('start-stt').disabled,true);
}
assert.equal(get('world-visited').textContent,'8 av 8 besökta');assert.equal(modelCalls,7);
console.log('World UI: all 8 visits, correct speaker/place, existing model reused, session locks, overview/visit controls and visited counter passed. Browser WebGL unverified.');

await get('world-destinations').children[8].click();assert.equal(doc.body.dataset.worldMode,'info');assert.equal(location,'about');assert.equal(modelCalls,7);assert.equal(get('world-visited').textContent,'8 av 8 besökta');get('world-back').click();assert.equal(doc.body.dataset.worldMode,'overview');
world.setLighting('day');world.overview();world.update(2,.1,true);assert.ok(world.sun.visible&&!world.moon.visible);const sunProjected=world.sun.position.clone().project(camera);assert.ok(Math.abs(sunProjected.x)<.9&&Math.abs(sunProjected.y)<.9);world.setLighting('night');world.update(2,.1,true);assert.ok(world.moon.visible&&!world.sun.visible);world.visitInfo();world.update(2,.1,true);assert.equal(world.avatarAnchor.visible,false);assert.equal(world.sun.visible,false);world.setQuestComplete(true);assert.equal(world.waterWheel.visible,true);world.setQuestComplete(false);assert.equal(world.waterWheel.visible,false);

await get('world-destinations').children[9].click();assert.equal(doc.body.dataset.worldMode,'treasure');assert.equal(location,'treasure');assert.equal(modelCalls,7);get('world-back').click();assert.equal(doc.body.dataset.worldMode,'overview');
world.resize(1.85);world.overview();world.setLighting('day');world.update(0,.1,true);assert.equal(world.sun.material.depthTest,false,'sun cannot be hidden below the ocean');assert.ok(world.sun.renderOrder>world.ocean.renderOrder);for(const cloud of world.clouds.children){const p=cloud.position.clone().project(camera);assert.ok(p.y>.55&&p.y<.8,'clouds stay in the sky band');}world.visit('duck');world.update(0,.1,true);assert.equal(world.clouds.visible,false,'clouds do not intrude during visits');world.visitTreasure();world.setTreasureOpen(true);world.update(3,.1,true);assert.equal(world.avatarAnchor.visible,false);assert.equal(world.lid.rotation.x,-1.8);assert.equal(world.treasureGlow.visible,true);world.setTreasureOpen(false);assert.equal(world.treasureGlow.visible,false);assert.equal(world.lid.rotation.x,0);
console.log('Sky layer above sea, sky-only clouds, larger silhouette fit, chest navigation, lid/reward animation and reset passed.');

for(const [width,height] of [[340,500],[700,650],[1100,590]]){world.resize(width/height);world.overview();world.update(0,.1,true);const pins=layoutWorldPins(points,width,height);for(const [i,p] of pins.entries()){assert.ok(p.x>0&&p.x<100&&p.y>0&&p.y<100);for(const q of pins.slice(i+1)){const dx=Math.abs((p.x-q.x)*width/100),dy=Math.abs((p.y-q.y)*height/100);assert.ok(dx>=114||dy>=48,'map touch targets stay separate');}}}
console.log('Ten map destinations remain separate at phone, portrait tablet and landscape tablet sizes.');

await notebookTravel('panda');assert.equal(scrolls.at(-1).location,'panda');assert.equal(scrolls.at(-1).options.block,'start');assert.equal(scrolls.at(-1).options.behavior,'smooth');const priorScrolls=scrolls.length;
active=true;await notebookTravel('robot');assert.equal(scrolls.length,priorScrolls,'blocked travel must not jump the page');active=false;
win.matchMedia=()=>({matches:true});doc.body.dataset.worldFullscreen='true';await notebookTravel('panda');assert.equal(scrolls.at(-1).options.behavior,'instant','reduced motion uses an immediate scroll, including fullscreen');
const afterSuccess=scrolls.length;stop.setModel=async()=>false;await notebookTravel('rabbit');assert.equal(scrolls.length,afterSuccess,'failed model loading does not scroll away from the notebook');
console.log('Notebook travel reveals the loaded character, preserves locked/failed visits and respects reduced motion/fullscreen.');

// The lid must remain closed while travelling, then reveal once after camera arrival.
for(const aspect of [.45,.7,1.85]){
 let reveals=0;const cam=new T.PerspectiveCamera(35,aspect,.1,500),w=createDiscoveryWorld(cam,{onTreasureReveal:()=>reveals++});w.resize(aspect);w.overview();w.update(0,.1,true);w.visitTreasure();w.setTreasureOpen(true,{celebrate:true});
 for(let frame=0;frame<10;frame++)w.update(frame*.1,.1,false);assert.equal(w.lid.rotation.x,0,'lid stays closed during the first second');assert.equal(reveals,0);
 for(let frame=10;frame<50;frame++)w.update(frame*.1,.1,false);assert.equal(reveals,1);assert.ok(w.lid.rotation.x<-1.5);assert.equal(w.fireworks.visible,true);assert.ok(w.fireworks.geometry.attributes.position.array.every(Number.isFinite));
 const vertices=w.fireworks.geometry.attributes.position;for(let i=0;i<vertices.count;i++){const p=new T.Vector3().fromBufferAttribute(vertices,i).add(w.fireworks.position).project(cam);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,'celebration stays framed at '+aspect);}
 w.setTreasureOpen(true,{celebrate:true});w.update(5,.1,false);assert.equal(reveals,1,'no duplicate fanfare');for(let i=0;i<60;i++)w.update(6+i*.1,.1,false);assert.equal(w.fireworks.visible,false,'fireworks stop after the short celebration');
 w.setTreasureOpen(false);assert.equal(w.lid.rotation.x,0);w.setTreasureOpen(true,{celebrate:true});w.update(12,.5,true);w.setTreasureOpen(false);for(let i=0;i<30;i++)w.update(13+i*.1,.1,false);assert.equal(reveals,1,'reset cancels a waiting reveal');
 w.setTreasureOpen(true,{celebrate:true});for(let i=0;i<15;i++)w.update(17+i*.1,.1,true);assert.equal(reveals,2);assert.equal(w.fireworks.visible,false,'reduced motion suppresses moving fireworks');assert.equal(w.lid.rotation.x,-1.8);
}
console.log('Chest arrival gate, minimum delay, one reveal, fireworks framing/expiry, reset cancellation and reduced motion passed.');
