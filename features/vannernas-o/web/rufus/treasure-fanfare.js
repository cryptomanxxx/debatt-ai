// Prime on the unlock tap; play only when the camera has reached the chest.
export function createTreasureFanfare({contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)()}={}){
 let context=null,ready=null,generation=0,played=false;const voices=new Set();
 function stop(){generation++;played=false;for(const voice of voices){try{voice.stop()}catch{}voice.disconnect()}voices.clear();const old=context;context=null;ready=null;if(old)old.close().catch(()=>{});}
 function prime(){stop();try{context=contextFactory();ready=context.resume().catch(()=>false);}catch{context=null;ready=null;}}
 async function play(){const ctx=context,request=generation;if(!ctx||!ready)return;await ready;if(ctx!==context||request!==generation||ctx.state==='suspended'||ctx.state==='closed'||played)return;played=true;const start=ctx.currentTime+.03;
  // A short, gentle major-key fanfare, synthesized locally without downloads.
  for(const [index,frequency] of [523.25,659.25,783.99,1046.5,783.99,1046.5].entries()){
   const at=start+index*.16,oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='triangle';oscillator.frequency.setValueAtTime(frequency,at);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.065,at+.02);gain.gain.exponentialRampToValueAtTime(.001,at+(index===5?.7:.3));oscillator.connect(gain);gain.connect(ctx.destination);voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();if(!voices.size&&ctx===context){context=null;ready=null;ctx.close().catch(()=>{})}};oscillator.start(at);oscillator.stop(at+(index===5?.75:.35));
  }
 }
 return {prime,play,stop};
}
