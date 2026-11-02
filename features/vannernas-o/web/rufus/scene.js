import * as T from 'three';
import {createDiscoveryWorld} from './world.js';
import {createZoo} from './zoo.js';
import {poseAt} from './motion.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

function disposeTree(object){
  const geometries=new Set(),materials=new Set(),textures=new Set(),skeletons=new Set();
  object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));if(o.skeleton)skeletons.add(o.skeleton)});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>{for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose()});textures.forEach(t=>{t.dispose();t.source?.data?.close?.()});skeletons.forEach(s=>s.dispose());
}

// Vännernas ö is the only scene; avatars are the eight current rigged GLBs.
export function mountIsland(stage, rendererFactory = options => new T.WebGLRenderer(options), {modelUrl='/vannernas-o/v1/models/fox.glb', onWorldProject=()=>{}, onTreasureReveal=()=>{}, loadModel=url=>new GLTFLoader().loadAsync(url)} = {}) {
  const canvas=document.createElement('canvas');canvas.className='rufus-canvas';
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Vännernas ö med åtta animerade vänner');
  let renderer;
  try{renderer=rendererFactory({canvas,alpha:false,antialias:true,powerPreference:'low-power'});}catch{stage.setAttribute('data-rufus-renderer','unavailable');return ()=>{}}
  const scene=new T.Scene();scene.background=new T.Color(0x10282b);scene.fog=new T.FogExp2(0x10282b,.085);
  const camera=new T.PerspectiveCamera(35,1,.1,35);camera.position.set(0,1.45,6.1);camera.lookAt(0,1.18,0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const hemisphere=new T.HemisphereLight(0xc8e9ff,0x79736b,2.2);scene.add(hemisphere);
  const light=(color,intensity,p)=>{const l=new T.DirectionalLight(color,intensity);l.position.set(...p);scene.add(l);return l};
  const keyLight=light(0xffedda,2.3,[-3,4,4]);light(0xffe1bf,1.2,[2,3,-2]);const fillLight=light(0xe3efff,1.25,[3,2,4]);
  let fox={root:new T.Group(),apply(){}};scene.add(fox.root);
  function applyWorldLighting(p){hemisphere.intensity=p.ambient;hemisphere.color.set(p.night>.5?0xb2c9ef:0xc8e9ff);keyLight.color.set(p.keyColor);keyLight.intensity=p.key;fillLight.intensity=1.25+p.night*.15;scene.fog.color.set(p.horizon);stage.setAttribute('data-world-lighting',p.status);}
  const discovery=createDiscoveryWorld(camera,{onProject:onWorldProject,onLighting:applyWorldLighting,onTreasureReveal});scene.add(discovery.root);scene.background.set(0xc8ddd1);scene.fog.density=.006;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,disposed=false,lost=false,visible=true,last=0,elapsed=0,gazeX=0,gazeY=0,slowFrames=0,quality=1.5;
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);discovery.resize(w/h);}
  function active(){return !disposed&&!lost&&!document.hidden&&visible&&stage.classList.contains('new-zoo')}
  function stop(){cancelAnimationFrame(frame);frame=0;last=0}
  function start(){if(active()&&!frame)frame=requestAnimationFrame(draw)}
  function draw(now){
    frame=0;if(!active())return;
    if(last&&now-last<32){frame=requestAnimationFrame(draw);return}
    const delta=last?Math.min((now-last)/1000,.1):0;last=now;elapsed+=delta;
    const speaking=stage.classList.contains('is-speaking');
    const pose=poseAt(elapsed,{mouth:stage.style.getPropertyValue('--mouth-open'),speaking,
      listening:stage.classList.contains('is-listening')||document.getElementById('recognize-speech')?.textContent.includes('Avsluta inspelning'),
      thinking:stage.classList.contains('is-thinking'),preview:stage.classList.contains('is-previewing'),reduced:reduced.matches,gazeX,gazeY});
    fox.apply(pose,{mouth:stage.style.getPropertyValue('--mouth-open'),speaking,reduced:reduced.matches,delta});
    if(discovery?.enabled)discovery.update(elapsed,delta,reduced.matches);
    const before=performance.now();
    try{renderer.render(scene,camera);}catch{lost=true;stage.setAttribute('data-rufus-renderer','render-error');stage.removeAttribute('data-rufus-ready');stop();return}
    if(performance.now()-before>24)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
    if(slowFrames>15&&quality>1){quality=1;renderer.setPixelRatio(1);resize()}
    if(!reduced.matches||(discovery?.enabled&&discovery.needsTreasureFrame))frame=requestAnimationFrame(draw);
  }
  function sync(){if(active())start();else stop()}
  function pointer(e){const r=stage.getBoundingClientRect();gazeX=(e.clientX-r.left)/r.width*2-1;gazeY=1-(e.clientY-r.top)/r.height*2;start()}
  function leave(){gazeX=0;gazeY=0;start()}
  function contextLost(e){e.preventDefault();lost=true;stage.setAttribute('data-rufus-renderer','context-lost');stage.removeAttribute('data-rufus-ready');stop()}
  function contextRestored(){lost=false;resize();stage.setAttribute('data-rufus-renderer','ready');stage.setAttribute('data-rufus-ready','');start()}
  const sizeObserver=new ResizeObserver(()=>{resize();start()});sizeObserver.observe(stage);
  const stateObserver=new MutationObserver(sync);stateObserver.observe(stage,{attributes:true,attributeFilter:['class']});
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()});intersection.observe(stage);
  document.addEventListener('visibilitychange',sync);stage.addEventListener('pointermove',pointer,{passive:true});stage.addEventListener('pointerleave',leave);
  canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);reduced.addEventListener('change',sync);
  function dispose(){
    if(disposed)return;disposed=true;stop();sizeObserver.disconnect();stateObserver.disconnect();intersection.disconnect();
    document.removeEventListener('visibilitychange',sync);stage.removeEventListener('pointermove',pointer);stage.removeEventListener('pointerleave',leave);
    canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);reduced.removeEventListener('change',sync);
    fox.dispose?.();disposeTree(scene);renderer.dispose();canvas.remove();stage.removeAttribute('data-rufus-ready');stage.removeAttribute('data-rufus-model');stage.removeAttribute('data-rufus-renderer');
  }
  function upgrade(gltf){
    if(disposed){disposeTree(gltf.scene);return}
    let next;
    try{next=createZoo(gltf,{stage})}catch{stage.setAttribute('data-rufus-model','invalid');disposeTree(gltf.scene);return}
    fox.root.removeFromParent();fox.dispose?.();disposeTree(fox.root);fox=next;discovery.attach(fox.root);
    stage.setAttribute('data-rufus-model','glb');stage.setAttribute('data-rufus-ready','');resize();start();
  }
  try { stage.append(canvas);resize();renderer.render(scene,camera);stage.setAttribute('data-rufus-renderer','ready');stage.setAttribute('data-rufus-ready','');start(); }
  catch { dispose();stage.setAttribute('data-rufus-renderer','render-error'); }
  // Serial loading: release the visible model before requesting its replacement.
  // A stale request is disposed before the next request can start.
  let pending=Promise.resolve(),selection=0;
  function setModel(url){
    const ticket=++selection;
    pending=pending.catch(()=>{}).then(async()=>{
      if(disposed||ticket!==selection)return false;
      fox.root.removeFromParent();fox.dispose?.();disposeTree(fox.root);
      fox={root:new T.Group(),apply(){}};scene.add(fox.root);
      renderer.renderLists?.dispose();
      stage.removeAttribute('data-rufus-ready');stage.setAttribute('data-rufus-model','loading');
      try {
        const gltf=await loadModel(url);
        if(disposed||ticket!==selection){disposeTree(gltf.scene);return false;}
        upgrade(gltf);return stage.getAttribute('data-rufus-model')==='glb';
      }catch(error){if(!disposed&&ticket===selection){const status=error?.response?.status;stage.setAttribute('data-rufus-model',status===401||status===403?'denied':status===404?'missing':'error')}return false;}
    });
    return pending;
  }
  // Keep the island visible while the initial avatar loads. Failed loads show a clear status.
  if(modelUrl&&!disposed){stage.setAttribute('data-rufus-model','loading');pending=Promise.resolve().then(()=>loadModel(modelUrl)).then(gltf=>{if(selection){disposeTree(gltf.scene);return;}upgrade(gltf)},error=>{if(!disposed){const status=error?.response?.status;stage.setAttribute('data-rufus-model',status===401||status===403?'denied':status===404?'missing':'error')}});}
  dispose.world=discovery;dispose.redraw=start;
  dispose.setModel=setModel;dispose.greet=()=>fox.greet?.(reduced.matches);dispose.testMouth=weights=>{fox.testMouth?.(weights);start()};
  return dispose;
}
