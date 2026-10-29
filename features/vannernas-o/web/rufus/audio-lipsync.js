import {createRigControls} from './rig-controls.js';
export const VISEME_MAP={
 viseme_aa:{jawOpen:1},viseme_E:{mouthWide:.72,jawOpen:.28},viseme_I:{mouthWide:.85,jawOpen:.15},viseme_O:{mouthFunnel:1},viseme_U:{mouthPucker:1},
 viseme_PP:{mouthClose:1},viseme_SS:{mouthWide:.65,mouthClose:.35},viseme_TH:{jawOpen:.25,mouthWide:.35,mouthClose:.4},viseme_DD:{jawOpen:.4,mouthWide:.2,mouthClose:.4},viseme_FF:{mouthClose:.65,mouthWide:.35},viseme_kk:{jawOpen:.7,mouthWide:.3},viseme_nn:{mouthClose:.7,jawOpen:.3},viseme_RR:{mouthPucker:.6,jawOpen:.4},viseme_CH:{mouthFunnel:.45,mouthClose:.55}
};
export function weightsFromVisemes(values={}) {
 const result={jawOpen:0,mouthClose:0,mouthFunnel:0,mouthPucker:0,mouthWide:0,mouthSmile:0};
 let total=0;
 for(const [viseme,map] of Object.entries(VISEME_MAP)) {
  const value=Number(values[viseme]);if(!Number.isFinite(value)||value<.0001)continue;
  const amount=Math.min(1,value*1.4);total+=amount;for(const [key,factor] of Object.entries(map))result[key]+=amount*factor;
 }
 if(total>1)for(const k in result)result[k]/=total;
 return result;
}
// Keep one authored speech pose at a time. Opposing open/closed poses otherwise
// cancel while the detector's independent 100ms alpha ramps overlap.
export function createSpeechPose(){
 const keys=['jawOpen','mouthClose','mouthFunnel','mouthPucker','mouthWide','mouthSmile'];
 let current=null,held=1,weights=Object.fromEntries(keys.map(k=>[k,0]));
 return {
  reset(){current=null;held=1;weights=Object.fromEntries(keys.map(k=>[k,0]));},
  update(dt,{playing,live,viseme,amplitude=0}){
   if(!playing){current=null;held=1;weights=Object.fromEntries(keys.map(k=>[k,k==='mouthClose'?1:0]));return {...weights};}
   held+=dt;
   if(!live||!VISEME_MAP[viseme])current=null;
   else if(current===null||held>=.065&&current!==viseme){current=viseme;held=0;}
   const target=live?(current?VISEME_MAP[current]:{mouthClose:1}):{jawOpen:Math.max(0,Math.min(1,amplitude)),mouthClose:amplitude>.01?0:1};
   const blend=1-Math.exp(-dt/.035);
   for(const key of keys)weights[key]+=(Number(target[key]||0)-weights[key])*blend;
   return {...weights};
  }
 };
}
/** Attach only to the application's outgoing speech node, never its microphone.
 * update accepts seconds. Call after AnimationMixer, passing the desired blink values.
 * The analysis branch is silent; it does not replace or duplicate audio playback.
 */
export async function createAudioLipSync(audioCtx, root, speechNode, options={}) {
 if(!audioCtx.audioWorklet)throw new Error('AudioWorklet is unavailable');
 const vendor=options.baseURL||(location.origin+'/vannernas-o/v1/audio/');
 const HeadAudio=options.headAudioClass||(await import(new URL('headaudio.mjs',vendor))).HeadAudio;
 await audioCtx.audioWorklet.addModule(new URL('headworklet.mjs',vendor));
 const node=new HeadAudio(audioCtx,options.nodeOptions||{});const values={};let disposed=false;
 const controls=options.controls||createRigControls(root),pose=createSpeechPose();
 let clock=0,lastViseme=-Infinity,failed=false,state='analyzing',events=0,activeViseme=null;
 const receive=node.port.onmessage;
 node.port.onmessage=event=>{if(event.data?.event==='viseme'){lastViseme=clock;events++;activeViseme=event.data.viseme;}receive?.call(node.port,event)};
 node.onprocessorerror=()=>{failed=true};
 node.onvalue=(key,value)=>{values[key]=value};
 try{await node.loadModel(new URL('model-en-mixed.bin',vendor));speechNode.connect(node)}catch(error){node.disconnect();node.port.close();throw error}
 return {
  get state(){return state},
  get diagnostics(){return {events,activeViseme,failed,weights:controls.values}},
  update(seconds,{playing=true,amplitude=0,eyeBlinkLeft=0,eyeBlinkRight=0}={}) {
   if(disposed)return;
   const dt=Math.max(0,Math.min(.1,Number.isFinite(seconds)?seconds:0));clock+=dt;
   if(playing){
    node.update(dt*1000);
    const live=!failed&&clock-lastViseme<.3;
    state=live?'visemes':failed||amplitude>0?'amplitude':'analyzing';
    controls.set({...pose.update(dt,{playing,live,viseme:node.visemeNames[node.visemeActive],amplitude}),eyeBlinkLeft,eyeBlinkRight});
   }
   else {node.visemeActive=-1;node.visemeAlphas.fill(0);for(const key in values)values[key]=0;controls.set({...pose.update(dt,{playing:false}),eyeBlinkLeft,eyeBlinkRight})}
  },
  dispose(){if(disposed)return;disposed=true;try{speechNode.disconnect(node)}catch{}node.disconnect();node.port.close();controls.reset()}
 };
}
