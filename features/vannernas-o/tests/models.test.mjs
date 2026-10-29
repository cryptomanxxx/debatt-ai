import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';import {createZoo} from '../web/rufus/zoo.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});
for(const name of ['fox','duck','rabbit','panda','owl','hedgehog','robot','turtle']){
 const bytes=fs.readFileSync('../../public/vannernas-o/v1/models/'+name+'.glb');
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let targets=0;gltf.scene.traverse(o=>{if(o.isMesh){assert.equal(Object.keys(o.morphTargetDictionary).length,10);targets++}});assert.ok(targets>=2);assert.ok(gltf.animations.some(a=>a.name==='Greet'));
 const adapter=createZoo(gltf,{audioSource:()=>null});assert.ok(Math.abs(adapter.view.bounds.getSize(new T.Vector3()).y-2.55)<1e-4);assert.ok(Math.abs(adapter.view.bounds.min.y+.57)<1e-4);
 for(let i=0;i<140;i++){adapter.apply({blink:i%20===0?1:0,pitch:.05,gazeX:0,tilt:0},{speaking:i<70,mouth:1.0,delta:.033,reduced:false});adapter.root.updateMatrixWorld(true);adapter.root.traverse(o=>{if(o.isMesh){assert.ok(o.morphTargetInfluences.every(v=>Number.isFinite(v)&&v>=0&&v<=1));}})}
 for(const control of ['mouthClose','jawOpen','mouthWide','mouthFunnel','mouthPucker']){
  adapter.testMouth({[control]:1});adapter.apply({blink:0},{speaking:true,mouth:.16,delta:.033});
  adapter.root.traverse(o=>{if(o.isMesh)assert.equal(o.morphTargetInfluences[o.morphTargetDictionary[control]],1)});
 }
 adapter.testMouth(null);
 adapter.apply({blink:0},{speaking:false,mouth:.16,delta:.033,reduced:true});adapter.root.traverse(o=>{if(o.isMesh)assert.ok(o.morphTargetInfluences.every(v=>v===0))});adapter.dispose();adapter.dispose();console.log(name,'real GLB, framing, Greet, speech/blink and reduced motion passed');
}
