"use client";
import { useMemo } from "react";

// Standalone module so pages that only need this decorative background
// (e.g. /agenter) do not have to pull in the entire homepage client
// bundle (DebattClient, AnimatedBrainHero, article submission/analysis
// logic, etc.) just to render a circuit-board SVG. Re-exported from
// client.js for the homepage's own usage.
export function StarField() {
  const stars = useMemo(() => {
    const s = [];
    for (let i = 0; i < 100; i++) {
      s.push({
        cx: ((Math.sin(i * 127.1) * 0.5 + 0.5) * 800).toFixed(1),
        cy: ((Math.cos(i * 311.7) * 0.5 + 0.5) * 600).toFixed(1),
        r: i % 17 === 0 ? 1.4 : i % 7 === 0 ? 0.9 : 0.45,
        dur: (2.5 + (i % 7) * 0.8).toFixed(1),
        delay: ((i * 0.23) % 5).toFixed(1),
        op: i % 17 === 0 ? "0.3;0.9;0.3" : i % 7 === 0 ? "0.1;0.6;0.1" : "0.05;0.35;0.05",
      });
    }
    return s;
  }, []);

  return (
    <svg aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow2" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Stars */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white">
          <animate attributeName="opacity" values={s.op} dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* ── Circuit traces – PCB-style paths with rounded corners ── */}

      {/* Upper-left arm */}
      <path d="M 400 300 H 300 Q 278 300 278 278 V 180 Q 278 158 256 158 H 80" fill="none" stroke="#e879f9" strokeWidth="0.7" filter="url(#glow)">
        <animate attributeName="opacity" values="0.05;0.3;0.05" dur="6s" begin="0s" repeatCount="indefinite" />
      </path>
      <path d="M 278 280 H 178 Q 156 280 156 258 V 140 Q 156 118 134 118 H 0" fill="none" stroke="#e879f9" strokeWidth="0.5" filter="url(#glow)">
        <animate attributeName="opacity" values="0.03;0.2;0.03" dur="8s" begin="1s" repeatCount="indefinite" />
      </path>

      {/* Upper-right arm */}
      <path d="M 400 300 H 500 Q 522 300 522 278 V 160 Q 522 138 544 138 H 730" fill="none" stroke="#e879f9" strokeWidth="0.7" filter="url(#glow)">
        <animate attributeName="opacity" values="0.05;0.3;0.05" dur="5.5s" begin="0.8s" repeatCount="indefinite" />
      </path>
      <path d="M 522 278 H 632 Q 654 278 654 256 V 80 Q 654 58 676 58 H 800" fill="none" stroke="#c026d3" strokeWidth="0.5" filter="url(#glow)">
        <animate attributeName="opacity" values="0.03;0.18;0.03" dur="7.5s" begin="2s" repeatCount="indefinite" />
      </path>

      {/* Lower-left arm */}
      <path d="M 400 300 V 400 Q 400 422 378 422 H 240 Q 218 422 218 444 V 580" fill="none" stroke="#e879f9" strokeWidth="0.7" filter="url(#glow)">
        <animate attributeName="opacity" values="0.05;0.28;0.05" dur="6.5s" begin="1.2s" repeatCount="indefinite" />
      </path>
      <path d="M 218 444 H 118 Q 96 444 96 466 V 600" fill="none" stroke="#c026d3" strokeWidth="0.5" filter="url(#glow)">
        <animate attributeName="opacity" values="0.03;0.2;0.03" dur="8.5s" begin="0.5s" repeatCount="indefinite" />
      </path>

      {/* Lower-right arm */}
      <path d="M 400 300 V 400 Q 400 422 422 422 H 582 Q 604 422 604 444 V 580" fill="none" stroke="#e879f9" strokeWidth="0.7" filter="url(#glow)">
        <animate attributeName="opacity" values="0.05;0.28;0.05" dur="5.8s" begin="0.4s" repeatCount="indefinite" />
      </path>
      <path d="M 604 444 H 702 Q 724 444 724 466 V 600" fill="none" stroke="#c026d3" strokeWidth="0.5" filter="url(#glow)">
        <animate attributeName="opacity" values="0.03;0.18;0.03" dur="7s" begin="1.5s" repeatCount="indefinite" />
      </path>

      {/* Far-left sweep */}
      <path d="M 400 300 H 130 Q 108 300 108 322 V 440 Q 108 462 86 462 H 0" fill="none" stroke="#e879f9" strokeWidth="0.6" filter="url(#glow)">
        <animate attributeName="opacity" values="0.03;0.22;0.03" dur="9s" begin="1.8s" repeatCount="indefinite" />
      </path>

      {/* Far-right sweep */}
      <path d="M 400 300 H 672 Q 694 300 694 322 V 460 Q 694 482 716 482 H 800" fill="none" stroke="#e879f9" strokeWidth="0.6" filter="url(#glow)">
        <animate attributeName="opacity" values="0.03;0.22;0.03" dur="8s" begin="0.3s" repeatCount="indefinite" />
      </path>

      {/* Upward central */}
      <path d="M 400 300 V 118 Q 400 96 422 96 H 642 Q 664 96 664 74 V 0" fill="none" stroke="#e879f9" strokeWidth="0.7" filter="url(#glow)">
        <animate attributeName="opacity" values="0.05;0.3;0.05" dur="7s" begin="2.2s" repeatCount="indefinite" />
      </path>

      {/* Downward central */}
      <path d="M 400 300 V 502 Q 400 524 378 524 H 198 Q 176 524 176 546 V 600" fill="none" stroke="#e879f9" strokeWidth="0.6" filter="url(#glow)">
        <animate attributeName="opacity" values="0.03;0.2;0.03" dur="7.5s" begin="3s" repeatCount="indefinite" />
      </path>

      {/* ── Nodes ── */}
      <circle cx="400" cy="300" r="3.5" fill="#e879f9" filter="url(#glow2)">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
      {[
        [278,278],[522,278],[400,422],[256,158],[544,138],
        [218,444],[604,444],[400,118],[422,96],[86,462],
      ].map(([cx,cy],i)=>(
        <circle key={`h${i}`} cx={cx} cy={cy} r={2} fill="#e879f9" filter="url(#glow)">
          <animate attributeName="opacity" values="0.15;0.75;0.15" dur={`${3+(i%3)}s`} begin={`${(i*0.4)%3}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {[
        [300,300],[500,300],[400,400],[378,422],[422,422],
        [240,422],[582,422],[108,322],[694,322],[642,96],
      ].map(([cx,cy],i)=>(
        <circle key={`m${i}`} cx={cx} cy={cy} r={1.2} fill="#c026d3" filter="url(#glow)">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur={`${4+(i%4)}s`} begin={`${(i*0.6)%4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}
