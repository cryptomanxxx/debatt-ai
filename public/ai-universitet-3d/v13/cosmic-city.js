import * as THREE from 'three';

// Experimental v8: a true open-sky skyline, luminous nebulae, twinkling stars
// and two slow-turning 3D spiral galaxies. No accounts or paid image services.
export function createCosmicCity(scene) {
  scene.background = new THREE.Color(0x030515);
  scene.fog = new THREE.FogExp2(0x12142d, 0.00065);
  const sky = makeCosmicSky();
  scene.add(sky);
  const twinkles=createTwinklingStars();
  scene.add(twinkles);
  const nebulae=[
    makeNebula(40811,[130,65,240],[-145,100,-210],[190,115]),
    makeNebula(51972,[40,145,255],[145,95,-245],[155,105]),
    makeNebula(84991,[238,65,174],[-6,157,-270],[155,102])
  ];
  for(const cloud of nebulae)scene.add(cloud);
  const galaxies=[
    makeSpiralGalaxy(63491,66,3100,[89,89,-218],1),
    makeSpiralGalaxy(77320,28,1300,[-127,103,-263],-1)
  ];
  for(const galaxy of galaxies)scene.add(galaxy);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(820, 820),
    new THREE.MeshBasicMaterial({color:0x0c142b, fog:false, side:THREE.DoubleSide})
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -84;
  scene.add(ground);
  const grid = new THREE.GridHelper(800, 64, 0x426cc1, 0x24365e);
  for(const material of Array.isArray(grid.material) ? grid.material : [grid.material]) {
    material.transparent = true;
    material.opacity = .17;
    material.depthWrite = false;
  }
  grid.position.y = -83.96;
  scene.add(grid);

  const random = seededRandom(96832);
  const buildings = new THREE.Group();
  const unitBox = new THREE.BoxGeometry(1,1,1);
  const windowMaterials = [0,1,2,3].map(i => new THREE.MeshBasicMaterial({map:makeWindows(i),fog:true}));
  const caps = [
    new THREE.MeshBasicMaterial({color:0x28dff2,toneMapped:false}),
    new THREE.MeshBasicMaterial({color:0xe958f3,toneMapped:false}),
    new THREE.MeshBasicMaterial({color:0x5c86ff,toneMapped:false})
  ];
  const capGeometry = new THREE.BoxGeometry(1,.13,1);

  function tower(x,z,h,w,d,i) {
    const body = new THREE.Mesh(unitBox,windowMaterials[i%windowMaterials.length]);
    body.position.set(x,-84+h/2,z);
    body.scale.set(w,h,d);
    buildings.add(body);
    const cap = new THREE.Mesh(capGeometry,caps[i%caps.length]);
    cap.scale.set(w+.16,1,d+.16);
    cap.position.set(x,-84+h,z);
    buildings.add(cap);
    if (i%7===0) {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(.26,10,8),caps[(i+1)%caps.length]);
      beacon.position.set(x,-84+h+1.2,z);
      buildings.add(beacon);
    }
  }

  // The visitor stands 84 world units ABOVE street level. The nearest towers
  // start beyond the curved glass and never form a canyon around the room.
  for(const side of [-1,1]) {
    for(let i=0;i<39;i++){
      const depthRow=Math.floor(i/13);
      const x=side*(78+depthRow*26+random()*17);
      const z=-147+(i%13)*23+(random()-.5)*9;
      const h=19+random()*51+(depthRow===2?5:0);
      tower(x,z,h,8+random()*8,8+random()*10,i+(side+1)*17);
    }
  }
  // A separate horizon of towers behind the curved glass remains lower and
  // farther away; the star field has room to dominate the upper half.
  for(let i=0;i<18;i++){
    const x=-168+i*19+(random()-.5)*7;
    const z=-115-random()*85;
    tower(x,z,25+random()*53,7+random()*9,8+random()*11,i+19);
  }
  scene.add(buildings);

  // A distant luminous orbital planet gives the sky a legible cosmic scale.
  const planetMat = new THREE.MeshBasicMaterial({color:0x8ea9ff,transparent:true,opacity:.88,fog:false});
  const planet = new THREE.Mesh(new THREE.SphereGeometry(13,40,24),planetMat);
  planet.position.set(-70,78,-210);
  scene.add(planet);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(21,.18,8,110),new THREE.MeshBasicMaterial({color:0xc6aaff,transparent:true,opacity:.74,fog:false}));
  halo.position.copy(planet.position);
  halo.rotation.set(.55,.2,.27);
  scene.add(halo);

  return {animate(t) {
    // GPU-driven twinkle: no geometry, texture or buffer changes per frame.
    twinkles.material.uniforms.uTime.value=t;
    sky.rotation.y = Math.sin(t*.012)*.004;
    galaxies[0].rotation.z=.28+t*.023;
    galaxies[1].rotation.z=-.25-t*.038;
    nebulae[0].material.rotation=Math.sin(t*.018)*.012;
    nebulae[1].material.rotation=Math.cos(t*.012)*.009;
    halo.rotation.z=.27+t*.003;
  }};
}

function createTwinklingStars(){
  const random=seededRandom(110292),count=850;
  const positions=new Float32Array(count*3);
  const phases=new Float32Array(count),speeds=new Float32Array(count),tints=new Float32Array(count);
  for(let i=0;i<count;i++){
    const y=260*(.035+random()*.94);
    const angle=random()*Math.PI*2,r=Math.sqrt(260*260-y*y);
    positions[i*3]=Math.cos(angle)*r;
    positions[i*3+1]=y;
    positions[i*3+2]=Math.sin(angle)*r;
    phases[i]=random()*Math.PI*2;
    speeds[i]=.7+random()*2.6;
    tints[i]=random();
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('phase',new THREE.BufferAttribute(phases,1));
  geometry.setAttribute('speed',new THREE.BufferAttribute(speeds,1));
  geometry.setAttribute('tint',new THREE.BufferAttribute(tints,1));
  const material=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}},transparent:true,depthWrite:false,
    blending:THREE.AdditiveBlending,fog:false,
    vertexShader:`
      uniform float uTime;
      attribute float phase;
      attribute float speed;
      attribute float tint;
      varying float vBrightness;
      varying float vTint;
      void main(){
        float pulse=0.5+0.5*sin(uTime*speed+phase);
        vBrightness=0.28+0.72*pow(pulse,2.0);
        vTint=tint;
        gl_PointSize=1.7+4.4*pow(pulse,4.0);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,
    fragmentShader:`
      varying float vBrightness;
      varying float vTint;
      void main(){
        vec2 v=gl_PointCoord-vec2(0.5);
        float d=length(v);
        if(d>0.5)discard;
        float halo=exp(-16.0*d*d);
        vec3 color=mix(vec3(0.64,0.83,1.0),vec3(1.0,0.76,0.94),vTint);
        gl_FragColor=vec4(color,halo*vBrightness);
      }`
  });
  return new THREE.Points(geometry,material);
}

function makeNebula(seed,[r,g,b],position,[width,height]){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const context=canvas.getContext('2d');const random=seededRandom(seed);
  // Hundreds of wispy layers create a mottled cloud rather than a flat halo.
  for(let i=0;i<340;i++){
    const x=256+(random()+random()+random()-1.5)*240;
    const y=128+(random()+random()+random()-1.5)*114;
    const rad=12+random()*65;
    const gradient=context.createRadialGradient(x,y,0,x,y,rad);
    const a=.018+random()*.041;
    gradient.addColorStop(0,`rgba(${r},${g},${b},${a})`);
    gradient.addColorStop(.32,`rgba(${r},${g},${b},${a*.5})`);
    gradient.addColorStop(1,`rgba(${r},${g},${b},0)`);
    context.fillStyle=gradient;context.fillRect(x-rad,y-rad,rad*2,rad*2);
  }
  for(let i=0;i<170;i++){
    context.globalAlpha=.15+random()*.78;
    context.fillStyle=i%3===0?'#ffe6f9':'#cadfff';
    const x=46+random()*425,y=30+random()*198;
    context.fillRect(x,y,.55+random()*1.6,.55+random()*1.6);
  }
  context.globalAlpha=1;
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const cloud=new THREE.Sprite(new THREE.SpriteMaterial({
    map:texture,transparent:true,opacity:.84,blending:THREE.AdditiveBlending,
    depthWrite:false,depthTest:true,fog:false,toneMapped:false
  }));
  cloud.position.set(...position);cloud.scale.set(width,height,1);
  return cloud;
}

function makeSpiralGalaxy(seed,radius,count,position,handedness){
  const random=seededRandom(seed),arms=4;
  const positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  const white=new THREE.Color(0xfff0d7),cyan=new THREE.Color(0x7bddff),violet=new THREE.Color(0xdb95ff);
  for(let i=0;i<count;i++){
    const arm=i%arms;
    const r=radius*Math.pow(random(),.72);
    const angle=arm*Math.PI*2/arms+handedness*(r/radius)*8+(random()-.5)*(.20+r/radius*.53);
    positions[i*3]=Math.cos(angle)*r;
    positions[i*3+1]=Math.sin(angle)*r*.58;
    positions[i*3+2]=(random()-.5)*4;
    const color=cyan.clone().lerp(violet,arm/arms*.7+random()*.29);
    if(r<radius*.22)color.lerp(white,1-r/(radius*.22));
    const brightness=.66+random()*.38;
    colors[i*3]=color.r*brightness;
    colors[i*3+1]=color.g*brightness;
    colors[i*3+2]=color.b*brightness;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const group=new THREE.Group();group.position.set(...position);
  const stars=new THREE.Points(geometry,new THREE.PointsMaterial({
    size:2.5,sizeAttenuation:false,vertexColors:true,transparent:true,
    opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,
    toneMapped:false
  }));
  group.add(stars);
  // A diffused luminous nucleus is the visual anchor for the spiral arms.
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const c=canvas.getContext('2d');
  const glow=c.createRadialGradient(128,128,3,128,128,124);
  glow.addColorStop(0,'rgba(255,255,244,.98)');
  glow.addColorStop(.075,'rgba(255,231,184,.84)');
  glow.addColorStop(.26,'rgba(143,180,255,.32)');
  glow.addColorStop(1,'rgba(92,98,233,0)');
  c.fillStyle=glow;c.fillRect(0,0,256,256);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const core=new THREE.Sprite(new THREE.SpriteMaterial({
    map:texture,transparent:true,opacity:.88,blending:THREE.AdditiveBlending,
    depthWrite:false,fog:false,toneMapped:false
  }));
  core.scale.set(radius*.87,radius*.65,1);group.add(core);
  return group;
}

function makeCosmicSky() {
  const canvas=document.createElement('canvas');
  canvas.width=2048;canvas.height=1024;
  const ctx=canvas.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,0,1024);
  gradient.addColorStop(0,'#020417');
  gradient.addColorStop(.38,'#090a2e');
  gradient.addColorStop(.67,'#25133d');
  gradient.addColorStop(.81,'#1b315e');
  gradient.addColorStop(1,'#070f2e');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,2048,1024);
  // Broad painted nebulae behind the city silhouette.
  for(const [x,y,r,color] of [
    [480,360,440,'rgba(122,58,210,.30)'],
    [920,520,520,'rgba(55,125,225,.25)'],
    [1430,280,480,'rgba(192,72,181,.24)'],
    [1820,560,320,'rgba(25,179,219,.20)'],
    [1120,750,540,'rgba(107,65,156,.13)']]) {
      const g=ctx.createRadialGradient(x,y,2,x,y,r);
      g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  const random=seededRandom(304781);
  // A star field, including a soft diagonal galactic band.
  for(let i=0;i<2300;i++){
    const x=random()*2048,y=random()*1024;
    const radius=random()>.93?1.8:.35+random()*.75;
    ctx.globalAlpha=.23+random()*.72;
    ctx.fillStyle=i%9===0?'#ffc7f8':i%5===0?'#a3c7ff':'#f2f6ff';
    ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
  }
  ctx.save();ctx.translate(1370,260);ctx.rotate(-.32);
  for(let i=0;i<2100;i++){
    const angle=random()*Math.PI*2;
    const radius=Math.sqrt(random())*400;
    const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius*.21+(random()-.5)*30;
    ctx.globalAlpha=.10+random()*.62;
    ctx.fillStyle=i%3?'#b5d8ff':'#ffc8f4';
    ctx.fillRect(x,y,.7+random()*2,.7+random()*2);
  }
  ctx.restore();ctx.globalAlpha=1;
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const shell=new THREE.Mesh(new THREE.SphereGeometry(380,48,28),new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,fog:false}));
  return shell;
}

function makeWindows(seed) {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=512;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=['#080f27','#11152d','#0d1630','#0d1129'][seed%4];ctx.fillRect(0,0,128,512);
  const random=seededRandom(80723+seed*911);
  for(let y=8;y<512;y+=20)for(let x=6;x<128;x+=16){
    const lit=random()>.35;
    if(lit){
      ctx.fillStyle=random()>.78?'#f26bde':random()>.25?'#4babe9':'#bba6ff';
      ctx.globalAlpha=.3+random()*.53;
      ctx.fillRect(x,y,8,10);
    } else {
      ctx.fillStyle='#182646';ctx.globalAlpha=.4;ctx.fillRect(x,y,8,10);
    }
  }
  ctx.globalAlpha=1;
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

function seededRandom(seed) {
  let state=seed>>>0;
  return ()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
}
