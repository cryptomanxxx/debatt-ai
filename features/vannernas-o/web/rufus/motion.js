// Renderer-independent pose calculation. Time is seconds; audio is played PCM RMS.
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function poseAt(time, {mouth = .16, speaking = false, listening = false, thinking = false, preview = false, reduced = false, gazeX = 0, gazeY = 0} = {}) {
  if (reduced) return {jaw:0,blink:0,tilt:0,yaw:0,pitch:0,breath:0,ear:0,paw:0,gazeX:0,gazeY:0,brow:0,tail:0,earLeft:0,earRight:0,tailPhase:0,tailMotion:0};
  const t = Math.max(0, Number(time) || 0);
  // Deterministic irregular blink intervals, with an occasional double blink.
  const block = Math.floor(t / 11.7), cycle = t % 11.7;
  // Shift each group independently over time; occasional double blinks.
  const shift = block === 0 ? 0 : .8 * Math.sin(block * 2.399);
  const secondShift = block === 0 ? 0 : .6 * Math.sin(block * 1.731);
  const pulse = center => { const x = Math.abs(cycle - center) / .105; return x < 1 ? (1 + Math.cos(Math.PI*x))/2 : 0; };
  const blink = Math.max(pulse(2.9 + shift), pulse(7.8 + secondShift), block % 3 === 0 ? pulse(8.12 + secondShift) : 0);
  const energy = speaking ? clamp(((Number(mouth) || .16) - .16) / 1.19, 0, 1) : 0;
  const jaw = preview ? .12 + .43 * Math.pow(Math.sin(t * 10), 2) : Math.pow(energy, .82);
  return {jaw, blink, tilt: thinking ? -.13 : .035*Math.sin(t*.71)+(listening?.055:0),
    yaw: clamp(gazeX,-1,1)*.13 + .045*Math.sin(t*.43), pitch: .018*Math.sin(t*.8)+(speaking?.025*Math.sin(t*4):0),
    breath: .009*Math.sin(t*1.8), ear: .026*Math.sin(t*1.5)+(listening?.055:0),
    earLeft: .012*Math.sin(t*1.23), earRight: .012*Math.sin(t*1.03+1.2),
    paw: (speaking||preview) ? .10+.09*Math.sin(t*2.6) : .025*Math.sin(t*.9),
    gazeX:clamp(gazeX,-1,1)*.045, gazeY:clamp(gazeY,-1,1)*.035,
    brow:thinking?.075:listening?.04:.012*Math.sin(t*.7), tailPhase:t, tailMotion:1,
    tail:.11*Math.sin(t*1.3)+(speaking?.05*Math.sin(t*3.1):0)};
}
