import * as T from 'three';
import {GROUND_Y} from './constants.js';
import {createRigControls} from './rig-controls.js';
import {createAudioLipSync} from './audio-lipsync.js';
export function createZoo(gltf,{audioSource=()=>window.zooUI?.audio?.(),stage=null,lipSyncFactory=createAudioLipSync}={}) {
 const model=gltf.scene,root=new T.Group();root.add(model);model.updateMatrixWorld(true);
 model.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.metalness=0;}});
 const box=new T.Box3().setFromObject(model),height=box.max.y-box.min.y;if(!Number.isFinite(height)||height<=0)throw Error('Invalid zoo bounds');model.scale.multiplyScalar(2.55/height);model.updateMatrixWorld(true);box.setFromObject(model);const center=box.getCenter(new T.Vector3());model.position.add(new T.Vector3(-center.x,GROUND_Y-box.min.y,-center.z));model.updateMatrixWorld(true);
 const mixer=new T.AnimationMixer(model),controls=createRigControls(model);const head=model.getObjectByName('Head'),rest=head?.quaternion.clone();let disposed=false,lip=null,ctx=null,attempt=null,greeting=false,action=null;
 const blinkMeshes=[];model.traverse(o=>{if(o.isMesh&&o.morphTargetDictionary)blinkMeshes.push(o)});
 const clip=gltf.animations.find(c=>c.name==='Greet');
 let testWeights=null,traceClock=0;
 function testMouth(weights){testWeights=weights;if(weights){action?.stop();greeting=false;}else controls.reset();}
 function greet(reduced=false){if(disposed||reduced||!clip)return;action?.stop();action=mixer.clipAction(clip);action.reset().setLoop(T.LoopOnce,1);action.clampWhenFinished=false;action.fadeIn(.15).play();greeting=true;}
 mixer.addEventListener('finished',()=>{greeting=false});
 function clearLip(){lip?.dispose();lip=null;ctx=null;attempt=null;}
 function attachAudio(){const source=audioSource();if(!source?.context||source.context.state==='closed'){if(ctx)clearLip();return;}if(ctx===source.context)return;clearLip();ctx=source.context;const token={};attempt=token;stage?.setAttribute('data-zoo-lipsync','loading');lipSyncFactory(ctx,model,source.node,{controls}).then(adapter=>{if(disposed||attempt!==token||ctx?.state==='closed'){adapter.dispose();return;}lip=adapter;stage?.setAttribute('data-zoo-lipsync','analyzing')}).catch(()=>{if(!disposed&&attempt===token)stage?.setAttribute('data-zoo-lipsync','amplitude')});}
 greet();
 return {root,view:{bounds:new T.Box3().setFromObject(root)},greet,testMouth,dispose(){disposed=true;testWeights=null;clearLip();mixer.stopAllAction();mixer.uncacheRoot(model)},apply(p,a={}){
  if(disposed)return;
  if(a.reduced){if(greeting){action?.stop();greeting=false;}mixer.update(0);}else mixer.update(a.delta||0);
  let left=a.reduced?0:p.blink||0,right=left;
  if(greeting)for(const mesh of blinkMeshes){left=Math.max(left,mesh.morphTargetInfluences[mesh.morphTargetDictionary.eyeBlinkLeft]||0);right=Math.max(right,mesh.morphTargetInfluences[mesh.morphTargetDictionary.eyeBlinkRight]||0);}
  if(!greeting&&head&&rest){head.quaternion.copy(rest);if(!a.reduced)head.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler((p.pitch||0)*.12,(p.gazeX||0)*.2,(p.tilt||0)*.15)));}
  attachAudio();const playing=Boolean(a.speaking)&&!a.reduced;
  if(lip){lip.update(a.delta||0,{playing,amplitude:Math.max(0,Math.min(1,(Number(a.mouth)-.16)/1.19)),eyeBlinkLeft:left,eyeBlinkRight:right});if(stage?.getAttribute('data-zoo-lipsync')!==lip.state)stage?.setAttribute('data-zoo-lipsync',lip.state);}
  else controls.set({jawOpen:playing?Math.max(0,Math.min(1,(Number(a.mouth)-.16)/1.19)):0,eyeBlinkLeft:left,eyeBlinkRight:right});
  if(testWeights)controls.set({...testWeights,eyeBlinkLeft:left,eyeBlinkRight:right});
  traceClock+=a.delta||0;
  if(stage&&traceClock>=.2){traceClock=0;
   const diagnostic=lip?.diagnostics,weights=controls.values;
   const labels={jawOpen:'A',mouthClose:'M/B/P',mouthWide:'E/I',mouthFunnel:'O',mouthPucker:'U',mouthSmile:'leende'};
   const strongest=Object.keys(labels).sort((x,y)=>(weights[y]||0)-(weights[x]||0))[0],amount=weights[strongest]||0;
   const signal=Math.max(0,Math.min(1,(Number(a.mouth)-.16)/1.19));
   const playback=audioSource();
   const text=`Ljudpaket: ${playback?.chunks||0} · Ljudmotor: ${playback?.context?.state||'saknas'} · Tal: ${playing?'spelas':'tyst'} · Ljud: ${Math.round(signal*100)}% · Mun: ${amount>.01?labels[strongest]+' '+Math.round(amount*100)+'%':'viloläge'} · Talformer: ${diagnostic?.events||0}${diagnostic?.failed?' · analysfel':''}`;
   stage.setAttribute('data-zoo-speech-trace',text);
  }
 }};
}
