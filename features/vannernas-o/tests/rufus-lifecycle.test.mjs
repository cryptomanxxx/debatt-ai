import fs from 'node:fs';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import assert from 'node:assert/strict';
import {mountIsland} from '../web/rufus/scene.js';
class Element extends EventTarget {
  constructor(){super();this.attrs=new Map();this.children=[];this.style={getPropertyValue:()=>'.16'};this.classes=new Set(['stage','new-zoo']);this.classList={contains:c=>this.classes.has(c)};this.clientWidth=390;this.clientHeight=390;}
  getContext(){return null}
  getAttribute(k){return this.attrs.get(k)??null}
  setAttribute(k,v){this.attrs.set(k,v)} removeAttribute(k){this.attrs.delete(k)}
  append(c){this.children.push(c);c.parent=this} remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this)}
  getBoundingClientRect(){return {left:0,top:0,width:390,height:390}}
}
let frames=new Map(),next=0,observers=[];
class Observer{constructor(cb){this.cb=cb;this.disconnected=false;observers.push(this)}observe(){}disconnect(){this.disconnected=true}}
const doc=new EventTarget();doc.hidden=false;doc.createElement=()=>new Element();doc.getElementById=()=>null;
const reduced=new EventTarget();reduced.matches=false;
globalThis.document=doc;globalThis.window={devicePixelRatio:3,matchMedia:()=>reduced};
globalThis.ResizeObserver=globalThis.MutationObserver=globalThis.IntersectionObserver=Observer;
globalThis.requestAnimationFrame=cb=>{frames.set(++next,cb);return next};globalThis.cancelAnimationFrame=id=>frames.delete(id);
function tick(t){const pending=[...frames.values()];frames.clear();pending.forEach(cb=>cb(t))}
let rendered=0,disposed=0,ratio=0,geometries=0,textures=0,expectedTextures=0;
const renderer={setPixelRatio:r=>ratio=r,setSize(){},render(scene){rendered++;if(rendered===1){const gs=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)for(const value of Object.values(o.material))if(value?.isTexture)ts.add(value)});expectedTextures=ts.size;gs.forEach(g=>g.addEventListener('dispose',()=>geometries++));ts.forEach(t=>t.addEventListener('dispose',()=>textures++));}},dispose(){disposed++}};
const stage=new Element(),dispose=mountIsland(stage,()=>renderer,{modelUrl:null});
assert.ok(stage.attrs.has('data-rufus-ready'));assert.equal(ratio,1.5);assert.equal(frames.size,1);
tick(100);assert.equal(frames.size,1);
// Reduced motion stops the continuous loop after rendering a static pose.
reduced.matches=true;reduced.dispatchEvent(new Event('change'));tick(140);assert.equal(frames.size,0);
reduced.matches=false;reduced.dispatchEvent(new Event('change'));assert.equal(frames.size,1);
// Switching to Doris and backgrounding release the scheduled frame.
stage.classes.delete('new-zoo');observers[1].cb();assert.equal(frames.size,0);
stage.classes.add('new-zoo');observers[1].cb();assert.equal(frames.size,1);
doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(frames.size,0);
doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(frames.size,1);
observers[2].cb([{isIntersecting:false}]);assert.equal(frames.size,0);
observers[2].cb([{isIntersecting:true}]);assert.equal(frames.size,1);
const canvas=stage.children[0];canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));assert.equal(frames.size,0);assert.ok(!stage.attrs.has('data-rufus-ready'));assert.equal(stage.attrs.get('data-rufus-renderer'),'context-lost');
canvas.dispatchEvent(new Event('webglcontextrestored'));assert.equal(frames.size,1);assert.equal(stage.attrs.get('data-rufus-renderer'),'ready');
dispose();dispose();assert.equal(frames.size,0);assert.equal(disposed,1);assert.equal(stage.children.length,0);assert.ok(observers.every(o=>o.disconnected));assert.ok(geometries>0);assert.equal(textures,expectedTextures,'Each shared island texture is disposed once');
// Both constructor and first-render failures show an explicit renderer failure.
const fallback=new Element();mountIsland(fallback,()=>{throw Error('WebGL unavailable')});assert.equal(fallback.children.length,0);assert.ok(!fallback.attrs.has('data-rufus-ready'));assert.equal(fallback.attrs.get('data-rufus-renderer'),'unavailable');
const failed=new Element();mountIsland(failed,()=>({...renderer,render(){throw Error('GPU failure')}}));assert.equal(failed.children.length,0);assert.ok(!failed.attrs.has('data-rufus-ready'));assert.equal(failed.attrs.get('data-rufus-renderer'),'render-error');assert.equal(frames.size,0);
assert.ok(observers.every(o=>o.disconnected));
doc.dispatchEvent(new Event('visibilitychange'));reduced.dispatchEvent(new Event('change'));assert.equal(frames.size,0,'Failed mounts cannot restart detached rendering');
const resizeFailed=new Element();mountIsland(resizeFailed,()=>({...renderer,setSize(){throw Error('Resize failure')}}));assert.equal(resizeFailed.children.length,0);assert.ok(observers.every(o=>o.disconnected));assert.equal(frames.size,0);
console.log('Island lifecycle: hidden/offscreen/Doris, reduced motion, context loss/restore, failed init and idempotent GPU disposal passed.');

// A reduced-motion world still needs a brief frame loop for the delayed static reward.
Element.prototype.getContext=()=>null;reduced.matches=true;let rewardReveals=0;
const rewardStage=new Element(),rewardDispose=mountIsland(rewardStage,()=>renderer,{modelUrl:null,onTreasureReveal:()=>rewardReveals++});
rewardDispose.world.visitTreasure();rewardDispose.world.setTreasureOpen(true,{celebrate:true});rewardDispose.redraw();tick(1000);assert.equal(rewardReveals,0);assert.equal(frames.size,1,'pending reveal keeps a short reduced-motion loop alive');
for(let i=1;i<45;i++)tick(1000+i*40);assert.equal(rewardReveals,1);assert.equal(rewardDispose.world.lid.rotation.x,-1.8);assert.equal(rewardDispose.world.fireworks.visible,false);assert.equal(frames.size,0,'reduced-motion rendering stops after the static reveal');rewardDispose();
console.log('Scene lifecycle: delayed reduced-motion reward renders once and releases its frame loop.');

// Exercise the current real avatar through scene swaps, including stale and late loads.
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});reduced.matches=false;
const fixture=fs.readFileSync('../../public/vannernas-o/v1/models/fox.glb'),loader=new GLTFLoader(),requests=[],graphs=[];let loading=0,maxLoading=0;
const loadModel=()=>new Promise(resolve=>{loading++;maxLoading=Math.max(maxLoading,loading);requests.push(async()=>{const gltf=await loader.parseAsync(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),'');const record={disposed:0};graphs.push(record);gltf.scene.traverse(o=>{o.geometry?.addEventListener('dispose',()=>record.disposed++)});loading--;resolve(gltf);})});
const swapStage=new Element(),swap=mountIsland(swapStage,()=>renderer,{modelUrl:null,loadModel});
const first=swap.setModel('/zoo/fox.glb');await new Promise(setImmediate);const second=swap.setModel('/zoo/panda.glb');await requests.shift()();assert.equal(await first,false);await new Promise(setImmediate);await requests.shift()();assert.equal(await second,true);assert.equal(maxLoading,1);assert.ok(graphs[0].disposed>0,'stale GLB released');assert.equal(graphs[1].disposed,0);assert.equal(swapStage.getAttribute('data-rufus-model'),'glb');assert.equal(swap.world.avatarAnchor.children.filter(o=>o.type==='Group').length,1);
const late=swap.setModel('/zoo/duck.glb');await new Promise(setImmediate);assert.ok(graphs[1].disposed>0,'visible GLB released before replacement');swap();await requests.shift()();assert.equal(await late,false);assert.ok(graphs[2].disposed>0,'load resolved after leaving is released');assert.equal(frames.size,0);
console.log('Current island model swaps: real rig, serial loading, stale selection cleanup, prior model release and disposal during load passed.');
