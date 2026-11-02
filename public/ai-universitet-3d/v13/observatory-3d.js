import * as THREE from 'three';

// Version 11: preserve the frameless cosmic panorama and add a continuous,
// low curved window plinth so the interior floor has a legible boundary.
export function createObservatory(scene,materials) {
  const R=45,centerZ=25,height=22,segments=48;
  const cyan=materials.neonCyan,pink=materials.neonPink,blue=materials.neonBlue;
  const stone=materials.stone,dark=materials.dark;
  const trim=new THREE.MeshBasicMaterial({color:0x91afd9,transparent:true,opacity:.34,depthWrite:false,toneMapped:false});
  const crownGlow=new THREE.MeshBasicMaterial({color:0x6b9ecc,transparent:true,opacity:.30,depthWrite:false,toneMapped:false});
  const workstationTrim=new THREE.MeshBasicMaterial({color:0x9fb6ed,toneMapped:false});

  const floorOutline=new THREE.Shape();
  const curve=(r,t)=>new THREE.Vector3(r*Math.cos(t),0,centerZ-r*Math.sin(t));
  for(let i=0;i<=segments;i++){
    const theta=Math.PI-i*Math.PI/segments;
    const p=curve(R,theta);
    if(i===0)floorOutline.moveTo(p.x,-p.z);
    else floorOutline.lineTo(p.x,-p.z);
  }
  floorOutline.closePath();
  const floorGeometry=new THREE.ExtrudeGeometry(floorOutline,{depth:.6,bevelEnabled:false,curveSegments:6});
  floorGeometry.rotateX(-Math.PI/2);
  const floor=new THREE.Mesh(floorGeometry,materials.floor);
  floor.position.y=-.61;
  scene.add(floor);

  // A real low sill follows the exact same semicircle as the floor. Unlike a
  // glowing line, its solid vertical face distinguishes inside from outside.
  // Trace the outer curve left-to-right and the inner curve right-to-left to
  // form one uninterrupted band (no rectangular segments or visible joins).
  const sillOuter=R-.24,sillInner=R-1.02,sillHeight=.78;
  const sillOutline=new THREE.Shape();
  for(let i=0;i<=segments;i++){
    const p=curve(sillOuter,Math.PI-i*Math.PI/segments);
    if(i===0)sillOutline.moveTo(p.x,-p.z);else sillOutline.lineTo(p.x,-p.z);
  }
  for(let i=0;i<=segments;i++){
    const p=curve(sillInner,i*Math.PI/segments);
    sillOutline.lineTo(p.x,-p.z);
  }
  sillOutline.closePath();
  const sillGeometry=new THREE.ExtrudeGeometry(sillOutline,{depth:sillHeight,bevelEnabled:false,curveSegments:6});
  sillGeometry.rotateX(-Math.PI/2);
  const sillFace=new THREE.MeshStandardMaterial({color:0x253148,metalness:.68,roughness:.34,side:THREE.DoubleSide});
  const windowSill=new THREE.Mesh(sillGeometry,sillFace);
  windowSill.position.y=-.015;
  scene.add(windowSill);

  // Dark structural tower under the viewing deck, visible from outside but
  // completely below the visitor's eye level.
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(22,19,78,48),dark);
  tower.position.set(0,-39.5,3);
  scene.add(tower);
  const crown=new THREE.Mesh(new THREE.CylinderGeometry(23,23,1.0,48),stone);
  crown.position.set(0,-1.0,3);
  scene.add(crown);
  for(let i=0;i<16;i++){
    const angle=2*Math.PI*i/16;
    const light=new THREE.Mesh(new THREE.BoxGeometry(.20,65,.20),i%2?cyan:blue);
    light.position.set(Math.cos(angle)*20,-42,3+Math.sin(angle)*20);
    scene.add(light);
  }

  function rail(from,to,radius,material){
    const direction=new THREE.Vector3().subVectors(to,from);
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,direction.length(),8),material);
    rod.position.copy(from).add(to).multiplyScalar(.5);
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
    scene.add(rod);
  }
  // A satin-metal lip and faint inward light strip evoke the reference's
  // floor molding, retaining the city and nebulae above the low sill.
  const sillCap=new THREE.MeshStandardMaterial({color:0xb4bdd5,metalness:.82,roughness:.24,emissive:0x20364e,emissiveIntensity:.38});
  const sillLight=new THREE.MeshBasicMaterial({color:0x62c2e3,transparent:true,opacity:.56,depthWrite:false,toneMapped:false});
  for(let i=1;i<=segments;i++){
    const a=(i-1)*Math.PI/segments,b=i*Math.PI/segments;
    const capStart=curve(sillOuter,a),capEnd=curve(sillOuter,b);
    rail(new THREE.Vector3(capStart.x,sillHeight+.012,capStart.z),new THREE.Vector3(capEnd.x,sillHeight+.012,capEnd.z),.055,sillCap);
    const lightStart=curve(sillInner,a),lightEnd=curve(sillInner,b);
    rail(new THREE.Vector3(lightStart.x,sillHeight+.025,lightStart.z),new THREE.Vector3(lightEnd.x,sillHeight+.025,lightEnd.z),.025,sillLight);
  }
  // The window panes remain fully invisible. Only the curved floor and roof
  // contours remain, with support columns restricted to the far endpoints.
  const pBottom=[],pTop=[];
  for(let i=0;i<=segments;i++){
    const p=curve(R,i*Math.PI/segments);
    pBottom.push(new THREE.Vector3(p.x,.35,p.z));
    pTop.push(new THREE.Vector3(p.x,height,p.z));
    if(i===0||i===segments)rail(pBottom[i],pTop[i],.085,trim);
    if(i>0){
      rail(pBottom[i-1],pBottom[i],.052,cyan);
      rail(pTop[i-1],pTop[i],.105,crownGlow);
    }
  }
  // No radial skylight ribs and no rear-window mullions. A faint perimeter
  // curve frames the transparent observatory like the reference architecture.
  rail(new THREE.Vector3(-R,1.03,centerZ),new THREE.Vector3(R,1.03,centerZ),.065,trim);
  rail(new THREE.Vector3(-R,height,centerZ),new THREE.Vector3(R,height,centerZ),.085,crownGlow);

  // Self-illuminated terminal displays around the semicircle. The data is
  // deliberately illustrative; no simulated metrics are claimed as real.
  const desks=[[-29,-6],[-35,4],[-38,14],[29,-6],[35,4],[38,14]];
  const screens=Array.from({length:3},(_,i)=>new THREE.MeshBasicMaterial({map:makeDisplay(i),toneMapped:false,side:THREE.DoubleSide}));
  const deskSurface=new THREE.MeshStandardMaterial({color:0x273654,metalness:.42,roughness:.45});
  const chairMat=new THREE.MeshStandardMaterial({color:0x243153,metalness:.22,roughness:.72});
  for(let i=0;i<desks.length;i++){
    const [x,z]=desks[i],side=Math.sign(x),group=new THREE.Group();
    group.position.set(x,0,z);group.rotation.y=-side*Math.PI/4;
    scene.add(group);
    const addBox=(w,h,d,x,y,z,mat)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
      mesh.position.set(x,y,z);group.add(mesh);return mesh;
    };
    addBox(3.0,.15,1.5,0,1.04,0,deskSurface);
    for(const dx of [-1.26,1.26])addBox(.11,.98,.11,dx,.52,0,stone);
    addBox(2.6,.10,.11,0,1.66,-.42,workstationTrim);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.35),screens[i%3]);
    screen.position.set(0,2.30,-.43);group.add(screen);
    addBox(2.64,1.48,.07,0,2.30,-.52,materials.dark);
    // Screen must render in front of its dark casing.
    screen.position.z=-.43;
    addBox(1.30,.045,.38,0,1.15,.39,materials.neonBlue);
    addBox(1.0,.24,.95,0,.53,2.05,chairMat);
    addBox(1.03,.98,.17,0,1.12,2.48,chairMat);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.095,12,8),i%2?pink:cyan);
    lamp.position.set(1.16,1.28,-.48);group.add(lamp);
  }

  return {radius:R,centerZ,height,workstations:desks.length};
}

function makeDisplay(index){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=288;
  const c=canvas.getContext('2d');
  c.fillStyle='#071329';c.fillRect(0,0,512,288);
  c.strokeStyle='rgba(67,204,255,.17)';c.lineWidth=1;
  for(let x=0;x<512;x+=27){c.beginPath();c.moveTo(x,0);c.lineTo(x,288);c.stroke();}
  for(let y=0;y<288;y+=27){c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}
  c.fillStyle='#8fefff';c.font='bold 21px system-ui';
  c.fillText(['NEURAL RESEARCH','COSMOS LAB','SCIENCE DATA'][index],24,41);
  c.strokeStyle=index===1?'#ff79df':'#65e9ff';c.lineWidth=3;
  c.beginPath();
  for(let x=0;x<=450;x+=6){
    const y=160+Math.sin(x/30+index*1.9)*30+Math.sin(x/12-index)*12;
    if(x===0)c.moveTo(26+x,y);else c.lineTo(26+x,y);
  }
  c.stroke();
  c.fillStyle='#b2bfef';c.font='14px monospace';
  c.fillText('DEBATT-AI  /  PROFESSOR ORAKLET',24,252);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}
