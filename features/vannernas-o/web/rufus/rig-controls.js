/** Set authored controls on every primitive, including eyelids and panda mouth.
 * This contains no audio analysis or phoneme inference.
 */
export function createRigControls(root) {
  const meshes=[];root.traverse(o=>{if(o.isMesh&&o.morphTargetDictionary)meshes.push(o)});
  if(!meshes.length)throw new Error('No morph targets found');
  const mouth=['jawOpen','mouthClose','mouthFunnel','mouthPucker','mouthWide','mouthSmile'];
  const clamp=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
  return {
    get values(){const mesh=meshes[0];return Object.fromEntries(mouth.map(name=>[name,mesh.morphTargetInfluences[mesh.morphTargetDictionary[name]]||0]))},
    set(values={}) {
      const normalized=Object.fromEntries(mouth.map(n=>[n,clamp(values[n])]));
      const total=Object.values(normalized).reduce((a,b)=>a+b,0);
      if(total>1)for(const n of mouth)normalized[n]/=total;
      normalized.eyeBlinkLeft=clamp(values.eyeBlinkLeft);normalized.eyeBlinkRight=clamp(values.eyeBlinkRight);
      normalized.eyeLidCurveLeft=4*normalized.eyeBlinkLeft*(1-normalized.eyeBlinkLeft);normalized.eyeLidCurveRight=4*normalized.eyeBlinkRight*(1-normalized.eyeBlinkRight);
      for(const mesh of meshes)for(const [name,value] of Object.entries(normalized)) {
        const index=mesh.morphTargetDictionary[name];if(index!==undefined)mesh.morphTargetInfluences[index]=value;
      }
    },
    reset(){this.set({})}
  };
}
