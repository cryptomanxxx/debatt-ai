import * as THREE from 'three';

// A fully modelled, animated Three.js character inspired by Professor Oraklet's
// original Debatt-AI portrait: unruly white hair, round glasses, tweed coat,
// cream shirt and burgundy bow tie. No sprite or billboard is used in 3D.
export function createProfessorOraklet(scene) {
  const gold = material(0xc8a76d, .57);
  const skin = material(0xf2c3a0);
  const warmShadow = material(0xd29a76);
  const hairMat = material(0xf3f0df);
  const hairShade = material(0xdedfd7);
  const coat = tweedMaterial();
  const coatLight = material(0x9b7955);
  const pants = material(0x44434b);
  const shoes = material(0x281d1c, .24);
  const shirt = material(0xf4e8d1);
  const burgundy = material(0x74332f);
  const iris = material(0x38454d);
  const pupils = material(0x121b23);
  const mouthMat = material(0x4e1d22);

  const pedestal = new THREE.Group();
  pedestal.position.set(6.65, .64, -10.6);
  scene.add(pedestal);
  cylinder(1.45, 1.6, .22, 0, .12, 0, material(0x18303a), pedestal, 48);
  cylinder(1.48, 1.48, .035, 0, .25, 0, gold, pedestal, 48);
  const footGlow = new THREE.Mesh(new THREE.RingGeometry(1.13, 1.38, 48), new THREE.MeshBasicMaterial({color:0x91f1d4,side:THREE.DoubleSide,transparent:true,opacity:.6}));
  footGlow.rotation.x = -Math.PI/2;
  footGlow.position.y = .278;
  pedestal.add(footGlow);

  const actor = new THREE.Group();
  actor.position.y = .2;
  pedestal.add(actor);

  // Long trousers, rounded leather shoes, and the characteristic tweed suit.
  for (const side of [-1,1]) {
    const x=side*.37;
    cylinder(.29,.31,1.75,x,1.08,0,pants,actor,16);
    sphere(.33,x,.19,.21,shoes,actor).scale.set(1,.48,1.65);
    sphere(.32,x,1.95,0,coat,actor).scale.set(1.08,.76,1.05);
  }
  // A tapered coat mesh with sculpted shoulders replaces the old cylindrical
  // body and gives him the silhouette of a jacket rather than a straight box.
  const jacketOutline=[
    [.73,1.99],[.81,2.17],[.85,2.64],[.82,3.20],[.86,3.59],
    [1.02,3.81],[1.17,3.96],[1.13,4.04],[.81,4.11],[.35,4.18]
  ];
  const jacket=new THREE.Mesh(new THREE.LatheGeometry(jacketOutline.map(([r,y])=>new THREE.Vector2(r,y)),32),coat);
  actor.add(jacket);
  for(const side of [-1,1]){
    sphere(.40,side*1.00,3.93,-.015,coat,actor,24).scale.set(1.22,.74,1.36);
  }
  // The shirt, waistcoat and lapels sit in front of the coat's curved surface.
  const chest=sphere(.59,0,3.29,.80,shirt,actor,24);
  chest.scale.set(.63,1.26,.38);
  box(.71,.73,.18,0,2.89,1.00,material(0x5c3d33),actor);
  for (const side of [-1,1]) {
    const points=[[.16,4.10],[.83,4.04],[.54,3.63],[.69,3.40],[.36,3.00],[.14,3.65]];
    const outline=new THREE.Shape();points.forEach(([x,y],i)=>i?outline.lineTo(side*x,y):outline.moveTo(side*x,y));outline.closePath();
    const lapel=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.065,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1}),coatLight);
    lapel.position.z=1.04;actor.add(lapel);
    box(.22,.035,.06,side*.69,3.44,.98,shirt,actor);
  }
  for(const y of [3.06,2.86,2.65])sphere(.052,0,y,1.17,gold,actor,12);
  cylinder(.20,.19,.41,0,4.30,.02,skin,actor,16);

  // The bow tie is part of the 3D geometry, not an image pasted on the body.
  for(const side of [-1,1]) {
    const loop=sphere(.25,side*.19,4.03,1.08,burgundy,actor,16);
    loop.scale.set(1.0,.56,.41);
    loop.rotation.z=-side*.22;
  }
  sphere(.09,0,4.03,1.16,gold,actor,12);

  const leftArm=new THREE.Group(),rightArm=new THREE.Group();
  for(const [side,arm] of [[-1,leftArm],[1,rightArm]]) {
    arm.position.set(side*1.11,3.94,0);
    actor.add(arm);
    cylinder(.32,.20,1.43,0,-.7,0,coat,arm,24);
    sphere(.23,0,-1.37,0,coatLight,arm,16);
    sphere(.22,0,-1.65,.10,skin,arm,16).scale.set(.85,1.15,.76);
    for(const shift of [-.10,0,.10])sphere(.055,shift,-1.81,.18,skin,arm,10).scale.set(.7,1.2,.8);
  }
  leftArm.rotation.z=-.18;
  rightArm.rotation.z=.32;

  const head=new THREE.Group();head.position.set(0,4.89,.08);actor.add(head);
  sphere(.81,0,0,0,skin,head,32).scale.set(.97,1.06,.89);
  sphere(.24,0,-.20,.75,warmShadow,head,16).scale.set(.69,.97,1.05);
  sphere(.16,0,-.17,.83,skin,head,16).scale.set(.8,1.18,1.1);
  for(const side of [-1,1]) {
    sphere(.17,side*.78,-.10,0,skin,head,16).scale.set(.55,1.1,.75);
    sphere(.13,side*.84,-.13,.08,warmShadow,head,12).scale.set(.34,.65,.55);
  }

  // An asymmetrical halo of silver curls recalls Oraklet's unruly hair.
  const curls=[[-.71,.51,-.10,.32],[-.9,.36,-.05,.29],[-.98,.12,-.13,.30],[-.83,-.12,-.30,.25],
    [-.56,.74,-.13,.33],[-.22,.91,-.18,.32],[.16,.88,-.19,.32],[.52,.78,-.10,.34],
    [.83,.57,-.12,.32],[.93,.29,-.15,.29],[.91,-.05,-.21,.28],[.65,.52,.37,.25],
    [-.65,.55,.36,.27],[-.27,.81,.37,.26],[.25,.82,.38,.26],[.0,1.0,.02,.27]];
  curls.forEach(([x,y,z,r],i)=>sphere(r,x,y,z,i%4===0?hairShade:hairMat,head,12).scale.set(1.22,.83,1));
  for(const side of [-1,1]) {
    const brow=sphere(.24,side*.32,.32,.71,hairMat,head,16);
    brow.scale.set(1,.19,.33);brow.rotation.z=side*.10;
  }

  const eyes=[];
  for(const side of [-1,1]) {
    const eye=new THREE.Group();eye.position.set(side*.31,.11,.69);head.add(eye);
    sphere(.138,0,0,0,shirt,eye,16);
    sphere(.080,side*-.012,-.006,.113,iris,eye,16);
    sphere(.041,side*-.012,-.006,.178,pupils,eye,12);
    sphere(.017,side*-.033,.027,.207,shirt,eye,10);
    eyes.push(eye);
    const glasses=new THREE.Mesh(new THREE.TorusGeometry(.292,.037,10,32),gold);
    glasses.position.set(side*.318,.12,.756);head.add(glasses);
  }
  box(.23,.038,.09,0,.14,.77,gold,head);
  for(const side of [-1,1])box(.25,.038,.06,side*.74,.21,.47,gold,head).rotation.y=side*.3;

  // Visible depth is maintained while the mouth opens and closes.
  const mouth=sphere(.20,0,-.44,.66,mouthMat,head,24);
  mouth.scale.set(.89,.12,.24);
  const lowerLip=sphere(.18,0,-.53,.68,warmShadow,head,20);
  lowerLip.scale.set(1,.11,.29);
  for (const side of [-1,1])sphere(.045,side*.23,-.38,.69,warmShadow,head,12);

  function updateFace(eyeState,mouthIndex) {
    const blink=eyeState==='closed'?.055:eyeState==='half'?.39:1;
    for(const eye of eyes)eye.scale.y=blink;
    const amount=[.12,.37,.68,1.08][mouthIndex]??.12;
    mouth.scale.y=amount;
    lowerLip.position.y=-.51-(amount-.12)*.07;
  }
  function animate(t,speaking) {
    actor.position.y=.2+Math.sin(t*1.2)*.025;
    head.rotation.y=Math.sin(t*.59)*.085+(speaking?Math.sin(t*4.1)*.055:0);
    head.rotation.z=Math.sin(t*.81)*.025;
    leftArm.rotation.z=-.18+(speaking?-.12:0)+Math.sin(t*.9)*.025;
    rightArm.rotation.z=.31+(speaking?.25:0)+Math.sin(t*(speaking?3.8:.84))*(speaking?.23:.045);
    rightArm.rotation.x=(speaking?-.12:0)+Math.cos(t*.7)*.03;
    footGlow.material.opacity=.42+Math.sin(t*1.6)*.16;
  }
  updateFace('open',0);
  return {group:pedestal,updateFace,animate};
}

function material(color,metalness=0) {return new THREE.MeshStandardMaterial({color,metalness,roughness:.76});}
function tweedMaterial(){
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#785b43';ctx.fillRect(0,0,64,64);
  for(let i=0;i<64;i+=5){
    ctx.strokeStyle=i%2===0?'#967453':'#634735';ctx.globalAlpha=.55;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,64);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(64,i);ctx.stroke();
  }
  ctx.globalAlpha=1;
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(2,3);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({map:texture,roughness:.93,metalness:.04});
}
function box(w,h,d,x,y,z,mat,parent) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function sphere(r,x,y,z,mat,parent,segments=20) {
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,segments,12),mat);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function cylinder(r1,r2,h,x,y,z,mat,parent,sides=18) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,sides),mat);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
