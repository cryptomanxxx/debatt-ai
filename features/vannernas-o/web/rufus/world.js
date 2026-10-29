import * as T from 'three';
import {LIGHT_MODES,lightingForHour,hourFromDate} from './daylight.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export const PLACES=[
{id:'fox',name:'Rufus',emoji:'🦊',place:'Skogsstugan',text:'En varm glänta, en liten stuga och stora idéer.',x:-7,z:5,color:0xe3b483},
{id:'duck',name:'Doris',emoji:'🦆',place:'Näckrosdammen',text:'Sitt en stund vid bryggan och prata med Doris.',x:0,z:8,color:0x8dc7c5},
{id:'turtle',name:'Sköldpaddan',emoji:'🐢',place:'Lugna stranden',text:'Mjuka vågor och samtal i din egen takt.',x:8,z:5,color:0xe5d3a0},
{id:'robot',name:'Roboten',emoji:'🤖',place:'Uppfinnarverkstaden',text:'Här finns alltid något nytt att fundera på.',x:9,z:-4,color:0x9bbdbd},
{id:'owl',name:'Ugglan',emoji:'🦉',place:'Trädbiblioteket',text:'Böcker, berättelser och nyfikna frågor.',x:3,z:-10,color:0xb9a2c4},
{id:'panda',name:'Pandan',emoji:'🐼',place:'Bambulunden',text:'En stilla grön vrå bland susande bambu.',x:-5,z:-9,color:0xa1bd89},
{id:'rabbit',name:'Kaninen',emoji:'🐰',place:'Blomsterängen',text:'Blommor, morötter och små upptäckter.',x:-11,z:-3,color:0xe0b0bd},
{id:'hedgehog',name:'Igelkotten',emoji:'🦔',place:'Svampgläntan',text:'Följ stigen bland svampar och höstlöv.',x:-2,z:-1,color:0xc4a183}
].map(p=>({...p,x:p.x*1.3,z:p.z*1.3}));
export const INFO_PLACE={id:'about',name:'Debatt-AI',emoji:'✦',place:'Välkomstplatsen',text:'Om Debatt-AI och Vännernas ö.',x:-13,z:11.7};
export const TREASURE_PLACE={id:'treasure',name:'Skattkistan',emoji:'🗝',place:'Skattgläntan',text:'Samla vännernas åtta ledtrådar och öppna kistan.',x:12,z:12};
export const ISLAND_DESTINATIONS=[...PLACES,INFO_PLACE,TREASURE_PLACE];
export function createDiscoveryWorld(camera,{onProject=()=>{},onLighting=()=>{},onTreasureReveal=()=>{},now=()=>new Date()}={}){
 const root=new T.Group();root.name='AnimalZooDiscoveryWorld';const avatarAnchor=new T.Group();root.add(avatarAnchor);
 const materials=new Map(),geometries=new Map(),animated=new Set(),water=[],lights=[];
 const foliageMaterial=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.95});
 const material=(c,emission=false)=>{const key=c+':'+emission;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:c,roughness:emission?.4:.85,emissive:emission?c:0,emissiveIntensity:emission?.35:0}));return materials.get(key)};
 const geometry=(key,make)=>{if(!geometries.has(key))geometries.set(key,make());return geometries.get(key)};
 const box=geometry('box',()=>new T.BoxGeometry(1,1,1)),ball=geometry('ball',()=>new T.IcosahedronGeometry(1,1)),cylinder=geometry('cyl',()=>new T.CylinderGeometry(1,1,1,12)),cone=geometry('cone',()=>new T.ConeGeometry(1,1,8)),disc=geometry('disc',()=>new T.CircleGeometry(1,48));
 function mesh(g,geo,c,p,s=[1,1,1],glow=false){const o=new T.Mesh(geo,material(c,glow));o.position.set(...p);o.scale.set(...s);g.add(o);return o;}
 function circle(g,c,x,y,z,sx,sz){const o=mesh(g,disc,c,[x,y,z],[sx,sz,1]);o.rotation.x=-Math.PI/2;return o;}
 // A shared radial contact shadow gives the grass and characters a soft footing.
 const shadowPixels=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5),i=(y*64+x)*4;shadowPixels[i]=shadowPixels[i+1]=shadowPixels[i+2]=255;shadowPixels[i+3]=Math.round(Math.max(0,1-r)**2*145);}
 const shadowTexture=new T.DataTexture(shadowPixels,64,64,T.RGBAFormat);shadowTexture.needsUpdate=true;
 const shadowMaterial=new T.MeshBasicMaterial({color:0x203e28,map:shadowTexture,transparent:true,opacity:.65,depthWrite:false});
 function shadow(parent,x,y,z,sx,sz){const o=circle(parent,0x203e28,x,y,z,sx,sz);o.material=shadowMaterial;return o;}
 function leafyGeometry(){
  const g=new T.SphereGeometry(1,12,9),p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const d=1+.08*Math.sin(x*7+z*4)*Math.cos(y*6);p.setXYZ(i,x*d,y*(1+.05*Math.sin(z*8)),z*d);const light=.74+.2*(y+1)/2+.06*Math.sin(x*5+z*3);const color=new T.Color(0x4f884c).multiplyScalar(light);colors.push(color.r,color.g,color.b);}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
 }
 const leafGeo=geometry('organic-leaves',leafyGeometry);
 function branch(g,from,to,r1,r2,c=0x76543c){const a=new T.Vector3(...from),b=new T.Vector3(...to),o=mesh(g,geometry('branch-'+r1+'-'+r2,()=>new T.CylinderGeometry(r2,r1,1,7)),c,a.clone().add(b).multiplyScalar(.5).toArray(),[1,a.distanceTo(b),1]);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());}
 function tree(parent,x,z,size=1,c=0x729e73){
  const g=new T.Group();g.name='OrganicTree';g.position.set(x,0,z);g.userData.batchOwner=true;parent.add(g);shadow(root,x+parent.position.x,parent===root?-.53:-.435,z+parent.position.z,1.5*size,1.2*size);
  const lean=Math.sin(x*2.7+z)*.16;
  branch(g,[0,-.54,0],[lean,.8*size,0],.22*size,.14*size);branch(g,[lean,.8*size,0],[lean+.1,1.9*size,.08],.14*size,.05*size);
  for(let j=0;j<5;j++){const a=j*2.399;branch(g,[lean,.6*size+j*.17*size,0],[Math.cos(a)*.7*size,1.6*size+j*.12*size,Math.sin(a)*.55*size],.075*size,.025*size);}
  for(let j=0;j<9;j++){const a=j*2.399,r=j===8?0:.6*size;const o=new T.Mesh(leafGeo,foliageMaterial);o.position.set(lean+Math.cos(a)*r,1.7*size+(j%3)*.32*size,Math.sin(a)*r*.85);o.scale.set((.68+j%2*.12)*size,(.65+j%3*.1)*size,.66*size);o.rotation.set(j*.23,a,.1*Math.sin(j));g.add(o);}
  // Roots tie each trunk into the ground instead of a straight cylinder.
  for(let j=0;j<4;j++){const a=j*Math.PI/2;branch(g,[0,-.3,0],[Math.cos(a)*.5*size,-.52,Math.sin(a)*.5*size],.14*size,.035*size);}
 }

 function flower(g,x,z,c){mesh(g,cylinder,0x6e8d59,[x,-.34,z],[.025,.4,.025]);mesh(g,ball,c,[x,-.1,z],[.14,.085,.14]);mesh(g,ball,0xffdb7d,[x,-.04,z],[.05,.04,.05]);}
 mesh(root,cylinder,0xa28b70,[0,-1.6,0],[22.5,2.1,20]);mesh(root,cylinder,0xd2bd90,[0,-.7,0],[22.4,.28,19.9]);circle(root,0x638f50,0,-.555,0,22.1,19.6);
 for(let i=0;i<19;i++){const a=i*2.399,r=3+i%5*2.2;const o=circle(root,[0x739b58,0x6b9453,0x7da05d][i%3],Math.cos(a)*r,-.548,Math.sin(a)*r,2.3+i%3*.4,1.5);o.rotation.z=a;}
 // Continuous curved paths sit below the stepping stones.
 for(const [k,p] of ISLAND_DESTINATIONS.entries()){
  const path=new T.CatmullRomCurve3([new T.Vector3(0,-.51,0),new T.Vector3(p.x*.5+Math.sin(k)*.8,-.51,p.z*.5),new T.Vector3(p.x,-.51,p.z)]),positions=[],uv=[],indices=[];
  for(let i=0;i<=32;i++){const t=i/32,center=path.getPoint(t),tangent=path.getTangent(t),side=new T.Vector3(-tangent.z,0,tangent.x).normalize().multiplyScalar(.3);for(const sign of [-1,1]){const v=center.clone().addScaledVector(side,sign);positions.push(v.x,v.y,v.z);uv.push(sign>0?1:0,t);}if(i<32){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();mesh(root,g,0xbba779,[0,0,0]);
 }
 for(const [k,p] of ISLAND_DESTINATIONS.entries())for(let i=1;i<17;i++){const t=i/17;const o=mesh(root,cylinder,0xd9c8a2,[p.x*t+Math.sin(t*Math.PI)*Math.sin(k)*.8,-.48,p.z*t],[.22,.07,.17]);o.rotation.y=k+t;}
 circle(root,0xd7c39c,0,-.46,0,1.2,1.2);
 const contact=shadow(avatarAnchor,0,-.565,0,.75,.43);animated.add(contact);
 const homes=new Map();
 for(const p of PLACES){const g=new T.Group();g.position.set(p.x,0,p.z);g.name=p.id+'Home';g.userData.batchOwner=true;root.add(g);homes.set(p.id,g);circle(g,p.id==='turtle'?0xd1bb86:0x99a66b,0,-.45,0,2.5,2.1);circle(g,0x7e9c59,0,-.44,.15,2.15,1.8);
  if(p.id==='fox'){
   mesh(g,box,0xd9ad7c,[0,.4,-1.7],[2.5,1.8,1.5]);const roof=mesh(g,cone,0xad7156,[0,1.8,-1.7],[2.1,1.1,1.7]);roof.rotation.y=Math.PI/4;mesh(g,box,0x765846,[0,.06,-.91],[.6,1.1,.07]);for(const x of [-.8,.8])mesh(g,box,0xffd98a,[x,.65,-.91],[.45,.5,.07],true);mesh(g,box,0x987656,[.8,2,-1.8],[.3,.9,.3]);tree(g,-2,-1,1.1);flower(g,1.8,.8,0xf2c582);
  }else if(p.id==='duck'){
   circle(g,0xe1d1a1,.2,-.425,-1.5,3.1,2.1);water.push(circle(g,0x70bfc7,.2,-.41,-1.5,2.85,1.9));for(let i=0;i<7;i++)mesh(g,box,0xae8b61,[.2,-.24,-.5-i*.29],[1.05,.13,.24]);for(const [x,z] of [[-1.5,-1.5],[1.6,-2.2],[-.8,-2.8]]){circle(g,0x719e66,x,-.39,z,.3,.25);flower(g,x,z,0xf1b6c3);}for(let i=0;i<5;i++){mesh(g,cylinder,0x71945b,[-2.4+i*.15,.03,-.5-i*.2],[.025,.95,.025]);mesh(g,cylinder,0x94704c,[-2.4+i*.15,.55,-.5-i*.2],[.06,.25,.06]);}
  }else if(p.id==='turtle'){
   circle(g,0xebd7a5,0,-.42,-.5,2.7,2.1);water.push(circle(g,0x7fc4c5,1,-.4,-2.1,3.5,1.3));for(let i=0;i<5;i++)mesh(g,ball,0xa0ada0,[-1.8+i*.6,-.18,-1.3-Math.sin(i)*.35],[.5,.25,.4]);mesh(g,cone,0xe7ba80,[-1.7,1.5,.2],[1,.4,1]);mesh(g,cylinder,0xa28359,[-1.7,.4,.2],[.04,2.1,.04]);
  }else if(p.id==='robot'){
   mesh(g,box,0xbdcbbd,[0,.45,-1.9],[2.5,1.85,1.4]);mesh(g,box,0x708f93,[0,1.45,-1.9],[2.9,.22,1.7]);for(const x of [-.8,.8])mesh(g,box,0x8be5df,[x,.65,-1.16],[.55,.6,.06],true);mesh(g,box,0x66858a,[0,.12,-1.15],[.6,1.1,.08]);mesh(g,box,0xa98a66,[1.7,.05,-.3],[.85,.8,.6]);const ring=mesh(g,geometry('ring',()=>new T.TorusGeometry(.48,.08,8,20)),0x80e6d2,[1.7,.9,-.3]);ring.rotation.x=Math.PI/2;lights.push(ring);mesh(g,cylinder,0x6c8586,[-1,2,-1.7],[.035,1,.035]);lights.push(mesh(g,ball,0xa4efe0,[-1,2.55,-1.7],[.15,.15,.15],true));
  }else if(p.id==='owl'){
   tree(g,0,-2,2);mesh(g,box,0xbc956b,[.25,1.25,-1.25],[1.9,1.5,.7]);mesh(g,box,0x6a5849,[.25,1.3,-.86],[1.5,1.1,.06]);for(let i=0;i<9;i++)mesh(g,box,[0xbb8b78,0x85b6ad,0xe1c787][i%3],[-.35+i*.15,1.25,-.8],[.1,.55+i%3*.09,.15]);for(let i=0;i<4;i++)mesh(g,box,0xb69c72,[1.25,-.28+i*.33,-1.1],[.7,.14,.5]);
  }else if(p.id==='panda'){
   for(let i=0;i<11;i++){const x=-2+i%6*.75,z=-1.3-Math.floor(i/6)*.9,h=2.3+i%3*.6;mesh(g,cylinder,0x81a55e,[x,h/2-.57,z],[.07,h,.07]);for(let j=0;j<3;j++){mesh(g,cylinder,0xb1c781,[x,j*.75-.05,z],[.09,.07,.09]);const leaf=mesh(g,ball,0x799f69,[x+.3*(j%2?1:-1),j*.75+.5,z],[.5,.12,.2]);leaf.rotation.z=.4;}}for(const x of [-1.5,1.5])mesh(g,ball,0xa0ad96,[x,-.18,.25],[.65,.35,.55]);
  }else if(p.id==='rabbit'){
   for(let i=0;i<25;i++)flower(g,Math.sin(i*2.4)*(1.4+i%3*.4),-1.8+Math.cos(i*2.4),[0xf3c3cc,0xffdc8a,0xc4b1df][i%3]);for(let i=0;i<3;i++){mesh(g,box,0x997357,[-1.2+i*.85,-.38,-2.1],[.68,.2,1.1]);for(let j=0;j<3;j++)mesh(g,cone,0x709d62,[-1.2+i*.85,-.1,-2.4+j*.3],[.14,.4,.14]);}for(let i=0;i<6;i++)mesh(g,box,0xeee0bc,[-2.2+i*.85,-.03,-3],[.15,.95,.12]);mesh(g,box,0xeee0bc,[0,.1,-3],[4.7,.12,.1]);
  }else{
   for(let i=0;i<9;i++){const x=Math.sin(i*2.4)*1.8,z=-1.3+Math.cos(i*2.4)*1.1;mesh(g,cylinder,0xe7d6b4,[x,-.25,z],[.07,.5,.07]);mesh(g,geometry('mushroom',()=>new T.SphereGeometry(1,12,6,0,Math.PI*2,0,Math.PI/2)),i%2?0xb87657:0xd19968,[x,.03,z],[.33,.22,.33]);}const log=mesh(g,cylinder,0x9a7958,[-1.7,-.2,.5],[.3,1.5,.3]);log.rotation.z=Math.PI/2;
  }
 }
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2;tree(root,Math.cos(a)*20.2,Math.sin(a)*17.8,.7+i%4*.18,[0x719a72,0x80a77a,0x62916e][i%3]);}for(let i=0;i<30;i++)flower(root,Math.cos(i*2.399)*(4+i%9*1.1),Math.sin(i*2.399)*(4+i%9*1.1),[0xf2d58d,0xe7b9c6,0xe6e2b2][i%3]);
 const clouds=new T.Group();clouds.name='SkyClouds';root.add(clouds);for(let i=0;i<3;i++){const cloud=new T.Group();clouds.add(cloud);for(let j=0;j<3;j++){const o=mesh(cloud,ball,0xf6e8ce,[(j-1)*.32,j===1?.07:0,0],[.48,j===1?.22:.15,.1]);o.material=new T.MeshBasicMaterial({color:0xf6e8ce,depthTest:false,depthWrite:false,fog:false,toneMapped:false});o.renderOrder=11;animated.add(o);}}const seeds=new T.Group();root.add(seeds);seeds.visible=false;for(const o of [...water,...lights])animated.add(o);
 // Blue-green sky, warm horizon and soft shoreline rings replace the flat beige backdrop.
 const skyPixels=new Uint8Array(2*128*4);for(let y=0;y<128;y++){const t=Math.max(0,(y/127-.48)/.52);for(let x=0;x<2;x++){const i=(y*2+x)*4;for(let k=0;k<3;k++)skyPixels[i+k]=Math.round([219,229,207][k]*(1-t)+[104,166,187][k]*t);skyPixels[i+3]=255;}}
 const skyTexture=new T.DataTexture(skyPixels,2,128,T.RGBAFormat);skyTexture.colorSpace=T.SRGBColorSpace;skyTexture.magFilter=T.LinearFilter;skyTexture.minFilter=T.LinearFilter;skyTexture.needsUpdate=true;
 const sky=new T.Mesh(new T.SphereGeometry(250,24,12),new T.MeshBasicMaterial({side:T.BackSide,depthWrite:false,fog:false,toneMapped:false,map:skyTexture}));root.add(sky);animated.add(sky);

 for(const pond of water){pond.material.color.set(0x2584c5);pond.material.metalness=.12;for(let j=0;j<4;j++){const ring=mesh(pond.parent,geometry('ripple',()=>new T.RingGeometry(.6,.615,40)),0xc6ece1,[pond.position.x+Math.sin(j*2)*.8,pond.position.y+.012,pond.position.z+Math.cos(j*2)*.6],[1+j*.17,1,1]);ring.rotation.x=-Math.PI/2;}}
 // Small grass fans and irregular path borders add scale around the homes.
 const grassGeo=geometry('grass',()=>new T.ConeGeometry(.045,.38,3));
 for(let i=0;i<100;i++){const a=i*2.399,r=3+i%11*1.07,x=Math.cos(a)*r,z=Math.sin(a)*r;for(let j=0;j<3;j++){const o=mesh(root,grassGeo,[0x628349,0x79994f][i%2],[x+j*.07,-.36,z],[1,.6+i%3*.2,1]);o.rotation.z=(j-1)*.25;}}
 // In-world identity, backed by a local canvas texture rather than a remote asset.
 const sign=new T.Group();sign.position.set(INFO_PLACE.x,0,INFO_PLACE.z);sign.name='DebattAISign';sign.userData.batchOwner=true;root.add(sign);
 for(const x of [-1.1,1.1])mesh(sign,cylinder,0x785a40,[x,.1,0],[.065,1.25,.065]);
 const signBoard=mesh(sign,box,0x21473c,[0,.8,0],[2.8,1.2,.13]);
 let signLanguage='sv',signCanvas=null,signContext=null;
 if(typeof document!=='undefined'){
  signCanvas=document.createElement('canvas');signCanvas.width=768;signCanvas.height=320;signContext=signCanvas.getContext('2d');
  if(signContext){const map=new T.CanvasTexture(signCanvas);map.colorSpace=T.SRGBColorSpace;signBoard.material=new T.MeshStandardMaterial({map,roughness:.9});}
 }
 function setLanguage(value){signLanguage=value==='en'?'en':'sv';const ctx=signContext;if(!ctx)return;
  ctx.fillStyle='#21473c';ctx.fillRect(0,0,768,320);ctx.strokeStyle='#d4dfb3';ctx.lineWidth=9;ctx.strokeRect(16,16,736,288);ctx.textAlign='center';ctx.fillStyle='#f5efdb';ctx.font='bold 84px sans-serif';ctx.fillText('DEBATT-AI',384,145);ctx.fillStyle='#d2e6ae';ctx.font='40px sans-serif';ctx.fillText(signLanguage==='en'?'FRIENDS’ ISLAND':'VÄNNERNAS Ö',384,225);signBoard.material.map.needsUpdate=true;
 }
 setLanguage('sv');
 // Surrounding sea stays outside the island camera-fit bounds.
 const ocean=mesh(root,disc,0x196bc0,[0,-.88,0],[190,190,1]);ocean.name='SurroundingSea';ocean.rotation.x=-Math.PI/2;ocean.material=ocean.material.clone();ocean.material.metalness=.15;ocean.material.roughness=.43;animated.add(ocean);
 const foam=[];for(let i=0;i<3;i++){const o=mesh(root,geometry('coast-foam',()=>new T.RingGeometry(1,1.006,96)),0xc9e8d8,[0,-.865+i*.001,0],[22.6+i*.45,20.1+i*.4,1]);o.rotation.x=-Math.PI/2;o.material=new T.MeshBasicMaterial({color:0xc9e8d8,transparent:true,opacity:.25-i*.05,depthWrite:false});animated.add(o);foam.push(o);}
 // Visible sun/moon in overview links the selected clock time to the sky.
 const sun=new T.Mesh(new T.SphereGeometry(1,20,12),new T.MeshBasicMaterial({color:0xffdf87,toneMapped:false,fog:false}));sun.name='ClockSun';sun.material.depthTest=false;sun.material.depthWrite=false;sun.renderOrder=13;root.add(sun);animated.add(sun);
 const moon=new T.Mesh(new T.SphereGeometry(1,16,10),new T.MeshBasicMaterial({color:0xe5edff,toneMapped:false,fog:false}));moon.name='ClockMoon';moon.material.depthTest=false;moon.material.depthWrite=false;moon.renderOrder=13;root.add(moon);animated.add(moon);
 const halo=new T.Mesh(new T.CircleGeometry(1,40),new T.MeshBasicMaterial({color:0xffdf87,transparent:true,opacity:.12,depthWrite:false,toneMapped:false,fog:false}));halo.material.depthTest=false;halo.renderOrder=12;root.add(halo);animated.add(halo);
 const waterWheel=new T.Group();waterWheel.name='QuestWaterWheel';waterWheel.position.set(PLACES[1].x+1.8,.28,PLACES[1].z-1.4);waterWheel.visible=false;root.add(waterWheel);const rotor=new T.Group();waterWheel.add(rotor);
 for(const x of [-.4,.4])mesh(waterWheel,box,0x94704e,[x,-.25,0],[.1,1.15,.16]);
 const rim=mesh(rotor,geometry('wheel-rim',()=>new T.TorusGeometry(.55,.045,6,24)),0xb68d59,[0,0,0]);rim.rotation.y=Math.PI/2;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const paddle=mesh(rotor,box,0xbc9766,[0,Math.cos(a)*.54,Math.sin(a)*.54],[.52,.12,.22]);paddle.rotation.x=a;const spoke=mesh(rotor,box,0x9b744d,[0,0,0],[.07,1.05,.07]);spoke.rotation.x=a;}
 waterWheel.traverse(o=>{if(o.isMesh)animated.add(o)});
 // A hinged wooden chest with gold straps and a local celebratory glow.
 const chest=new T.Group();chest.name='TreasureChest';chest.position.set(TREASURE_PLACE.x,-.42,TREASURE_PLACE.z);root.add(chest);
 mesh(chest,box,0x744526,[0,.43,0],[2,.86,1.2]);for(const x of [-.72,.72])mesh(chest,box,0xd8a94c,[x,.44,.62],[.13,.88,.05]);mesh(chest,box,0xe9bd58,[0,.64,.65],[.3,.3,.1]);
 const lid=new T.Group();lid.name='TreasureLid';lid.position.set(0,.9,-.6);chest.add(lid);mesh(lid,box,0x986235,[0,.13,.6],[2.06,.28,1.25]);for(const x of [-.72,.72])mesh(lid,box,0xe7bd62,[x,.28,.6],[.15,.04,1.26]);
 const treasureGlow=new T.Group();chest.add(treasureGlow);treasureGlow.visible=false;
 const gold=new T.MeshBasicMaterial({color:0xffd56b,toneMapped:false});
 for(let i=0;i<10;i++){const coin=mesh(treasureGlow,cylinder,0xffcb56,[Math.sin(i*2.4)*.7,.92,Math.cos(i*2.4)*.35],[.17,.06,.17]);coin.material=gold;}
 const sparks=[];for(let i=0;i<8;i++){const o=mesh(treasureGlow,geometry('treasure-spark',()=>new T.OctahedronGeometry(.065)),0xffe5a1,[0,1,0]);o.material=gold;sparks.push(o);}
 const beam=mesh(treasureGlow,cylinder,0xffd56b,[0,1.8,0],[.45,1.8,.45]);beam.material=new T.MeshBasicMaterial({color:0xffcf63,transparent:true,opacity:.12,depthWrite:false,toneMapped:false});
 chest.traverse(o=>{if(o.isMesh)animated.add(o)});
 const fireworkPositions=new Float32Array(72*3),fireworkColors=new Float32Array(72*3),fireworkGeometry=new T.BufferGeometry();fireworkGeometry.setAttribute('position',new T.BufferAttribute(fireworkPositions,3));
 for(let i=0;i<72;i++){const color=new T.Color([0xffd36c,0x84e8e0,0xffaacb][Math.floor(i/24)]);fireworkColors.set([color.r,color.g,color.b],i*3);}fireworkGeometry.setAttribute('color',new T.BufferAttribute(fireworkColors,3));
 const fireworks=new T.Points(fireworkGeometry,new T.PointsMaterial({size:.12,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending}));fireworks.name='TreasureFireworks';fireworks.position.copy(chest.position);fireworks.frustumCulled=false;fireworks.visible=false;root.add(fireworks);
 let treasureOpen=false,treasurePending=false,treasureWait=0,fireworkTime=-1;

 // Bake static transforms and batch the scenery by material for tablet performance.
 root.updateMatrixWorld(true);const batches=new Map(),original=[];
 root.traverse(o=>{if(!o.isMesh||animated.has(o))return;let owner=o.parent;while(owner!==root&&!owner.userData.batchOwner)owner=owner.parent;
  if(!batches.has(owner))batches.set(owner,new Map());const byMaterial=batches.get(owner);let g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(g.index){const flat=g.toNonIndexed();g.dispose();g=flat;}
  // Vertex colors are shared by all batches so leaves can merge with compatible attributes.
  if(!g.attributes.color)g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));
  if(!byMaterial.has(o.material))byMaterial.set(o.material,[]);byMaterial.get(o.material).push(g);original.push(o);
 });
 for(const o of original){o.removeFromParent();if(![...geometries.values()].includes(o.geometry))o.geometry.dispose();}const blockers=[];
 for(const [owner,byMaterial] of batches)for(const [m,parts] of byMaterial){const g=mergeGeometries(parts);if(!g)throw Error('Could not batch island');g.computeBoundingBox();const o=new T.Mesh(g,m);o.name=owner.name+' scenery';root.add(o);o.userData.infoSign=owner===sign;if(g.boundingBox.max.y>.05)blockers.push(o);parts.forEach(p=>p.dispose());}
 const retained=new Set();root.traverse(o=>{if(o.isMesh)retained.add(o.geometry)});for(const g of geometries.values())if(!retained.has(g))g.dispose();
 const overviewBounds=new T.Box3();root.updateMatrixWorld(true);root.traverse(o=>{if(o.isMesh&&!animated.has(o))overviewBounds.union(o.geometry.boundingBox||new T.Box3().setFromObject(o));});
 const overviewVertices=[];root.traverse(o=>{if(o.isMesh&&!animated.has(o)){const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++)overviewVertices.push(a.getX(i),a.getY(i),a.getZ(i));}});
 const lastOcclusionCamera=new T.Vector3(Infinity,Infinity,Infinity);let occlusionDirty=true;
 function clearSight(){
  for(const o of blockers)o.visible=true;if(mode==='overview')return;
  root.updateMatrixWorld(true);const p=mode==='info'?INFO_PLACE:mode==='treasure'?TREASURE_PLACE:PLACES.find(p=>p.id===selected),raycaster=new T.Raycaster();
  const targets=[[0,1.9],[0,.9],[-.55,.9],[.55,.9],[0,0]];
  for(const [x,y] of targets){const target=new T.Vector3(p.x+x,y,p.z),direction=target.clone().sub(camera.position),distance=direction.length();raycaster.set(camera.position,direction.normalize());raycaster.near=.01;raycaster.far=distance-.15;
   for(const o of blockers){if(!o.visible)continue;if(o.userData.infoSign&&mode!=='info'){o.visible=false;continue;}const bounds=o.geometry.boundingBox;if(bounds.containsPoint(camera.position)||(raycaster.ray.intersectsBox(bounds)&&raycaster.intersectObject(o,false).length))o.visible=false;}
  }
 }

 let mode='overview',selected='fox',aspect=1,enabled=true;const aim=new T.Vector3(),goalAim=new T.Vector3(),goalPosition=new T.Vector3();
 function framing(){
  if(mode==='overview'){
   const center=overviewBounds.getCenter(new T.Vector3()),back=new T.Vector3(.18,.65,1.05).normalize(),right=new T.Vector3(0,1,0).cross(back).normalize(),up=back.clone().cross(right).normalize(),tan=Math.tan(T.MathUtils.degToRad(camera.fov/2));let distance=0;
   const q=new T.Vector3();
   for(let i=0;i<overviewVertices.length;i+=3){q.fromArray(overviewVertices,i).sub(center);const h=q.dot(up);distance=Math.max(distance,q.dot(back)+Math.abs(q.dot(right))/(tan*aspect*.91),q.dot(back)+(h>=0?h/.68:-h/.9)/tan);}
   // Reserve a narrow sky band while using the actual island outline to avoid excessive zoom-out.
   goalAim.copy(center);goalPosition.copy(center).addScaledVector(back,distance+.5);

  }else if(mode==='info'||mode==='treasure'){const p=mode==='info'?INFO_PLACE:TREASURE_PLACE;goalAim.set(p.x,mode==='treasure'?1:.6,p.z);goalPosition.set(p.x,mode==='treasure'?2:1.4,p.z+Math.max(mode==='treasure'?7.7:5.5,(mode==='treasure'?7.2:4)/aspect));}else{const p=PLACES.find(p=>p.id===selected);goalAim.set(p.x,.8,p.z);goalPosition.set(p.x,.95,p.z+Math.max(6.8,4.1/aspect));}
 }
 let lightMode='auto',lastLightMinute='',palette;
 function updateLighting(){const date=now(),stamp=lightMode+':'+date.getHours()+':'+date.getMinutes();if(stamp===lastLightMinute)return;lastLightMinute=stamp;palette=lightingForHour(LIGHT_MODES[lightMode]??hourFromDate(date));
  for(let y=0;y<128;y++){const t=Math.max(0,(y/127-.48)/.52);for(let x=0;x<2;x++){const i=(y*2+x)*4;for(let k=0;k<3;k++){const shift=16-k*8;skyPixels[i+k]=Math.round(((palette.horizon>>shift)&255)*(1-t)+((palette.top>>shift)&255)*t);}}}skyTexture.needsUpdate=true;
  ocean.material.color.set(palette.night>.5?0x183e77:0x196bc0);for(const pond of water)pond.material.color.set(palette.night>.5?0x254d83:0x2584c5);for(const m of materials.values())if(m.emissiveIntensity>0)m.emissiveIntensity=.35+palette.night*.7;
  palette.status=palette.label+(lightMode==='auto'?' · '+String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0'):' · förhandsval');onLighting(palette);
 }
 updateLighting();

 framing();camera.position.copy(goalPosition);aim.copy(goalAim);camera.lookAt(aim);
 return {setLanguage,root,avatarAnchor,homes,blockers,overviewBounds,overviewVertices,ocean,seeds,sun,moon,clouds,waterWheel,chest,lid,treasureGlow,fireworks,get needsTreasureFrame(){return treasurePending&&mode==='treasure'},setTreasureOpen(value,{celebrate=false}={}){
  if(!value){treasureOpen=false;treasurePending=false;fireworkTime=-1;fireworks.visible=false;lid.rotation.x=0;treasureGlow.visible=false;return;}
  if(treasureOpen||treasurePending)return;
  if(celebrate){treasurePending=true;treasureWait=0;}else treasureOpen=true;
 },visitTreasure(){mode='treasure';avatarAnchor.visible=false;occlusionDirty=true;framing();},setQuestComplete(value){waterWheel.visible=Boolean(value)},visitInfo(){mode='info';avatarAnchor.visible=false;occlusionDirty=true;for(const o of blockers)o.visible=true;framing();},get lighting(){return palette},setLighting(value){if(!Object.hasOwn(LIGHT_MODES,value))return false;lightMode=value;lastLightMinute="";updateLighting();return true;},get mode(){return mode},get selected(){return selected},get enabled(){return enabled},set enabled(v){enabled=v;root.visible=v},
 attach(avatar){avatarAnchor.add(avatar);const p=PLACES.find(p=>p.id===selected);avatarAnchor.position.set(p.x,.14,p.z);},
 visit(id){const p=PLACES.find(p=>p.id===id);if(!p)return false;selected=id;mode='visit';avatarAnchor.visible=true;seeds.visible=false;occlusionDirty=true;avatarAnchor.position.set(p.x,.14,p.z);framing();return true;},overview(){mode='overview';avatarAnchor.visible=true;seeds.visible=false;occlusionDirty=true;for(const o of blockers)o.visible=true;framing();},
 resize(a){aspect=a;camera.aspect=a;camera.far=500;camera.updateProjectionMatrix();framing();},
 pick(x,y){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x,y),camera);const hit=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),.44),new T.Vector3());if(!hit)return null;for(const p of [INFO_PLACE,TREASURE_PLACE])if((hit.x-p.x)**2+(hit.z-p.z)**2<5)return p.id;const p=[...PLACES].sort((a,b)=>(a.x-hit.x)**2+(a.z-hit.z)**2-((b.x-hit.x)**2+(b.z-hit.z)**2))[0];return (p.x-hit.x)**2+(p.z-hit.z)**2<16?p.id:null;},
 update(time,delta,reduced=false){if(!enabled)return;updateLighting();const blend=reduced?1:1-Math.exp(-delta*4.2);camera.position.lerp(goalPosition,blend);aim.lerp(goalAim,blend);camera.lookAt(aim);camera.updateMatrixWorld();
 // Wait for both the camera arrival and the page's smooth scroll before revealing the reward.
 if(treasurePending&&mode==='treasure'){treasureWait+=delta;if(treasureWait>=1.25&&camera.position.distanceTo(goalPosition)<.08&&aim.distanceTo(goalAim)<.05){treasurePending=false;treasureOpen=true;fireworkTime=reduced?-1:0;onTreasureReveal();}}
 if(fireworkTime>=0)fireworkTime+=delta;fireworks.visible=!reduced&&mode==='treasure'&&fireworkTime>=0&&fireworkTime<4.8;
 if(fireworks.visible){for(let i=0;i<72;i++){const burst=Math.floor(i/24),age=fireworkTime-burst*.55,phase=Math.max(0,Math.min(1,age/2.4)),angle=(i%24)/24*Math.PI*2,spread=Math.sin(phase*Math.PI/2)*1.05;
  fireworkPositions[i*3]=(burst-1)*.95+Math.cos(angle)*spread;fireworkPositions[i*3+1]=2.1+burst*.32+Math.sin(angle)*spread-phase*phase*.65;fireworkPositions[i*3+2]=-.4+Math.sin(i*2.399)*spread*.4;}
  fireworkGeometry.attributes.position.needsUpdate=true;fireworks.material.opacity=Math.max(0,.9*(1-fireworkTime/4.8));}
 lid.rotation.x=T.MathUtils.lerp(lid.rotation.x,treasureOpen?-1.8:0,reduced?1:1-Math.exp(-delta*2.2));treasureGlow.visible=treasureOpen&&lid.rotation.x<-.5;for(const [i,o] of sparks.entries()){const t=reduced?.5:((time*.24+i/8)%1);o.position.set(Math.cos(i*2.399)*(.3+t*.45),1+t*1.7,Math.sin(i*2.399)*(.3+t*.45));o.rotation.y=reduced?0:time+i;}
 const daytime=palette.hour>=6&&palette.hour<20;sun.visible=mode==='overview'&&daytime;moon.visible=mode==='overview'&&!daytime;halo.visible=sun.visible;
 const phase=daytime?(palette.hour-6)/14:((palette.hour+4)%24)/10,celestial=daytime?sun:moon;
 const point=new T.Vector3(-.66+Math.min(1,Math.max(0,phase))*1.32,.73+Math.sin(Math.min(1,Math.max(0,phase))*Math.PI)*.1,.5).unproject(camera),direction=point.sub(camera.position).normalize();
 // Sky objects render in a camera-facing sky layer. A downward overview ray cannot put them below the ocean.
 const skyDistance=12,unit=skyDistance*Math.tan(T.MathUtils.degToRad(camera.fov/2));celestial.position.copy(camera.position).addScaledVector(direction,skyDistance);celestial.scale.setScalar(unit*.085);halo.position.copy(celestial.position);halo.quaternion.copy(camera.quaternion);halo.scale.setScalar(unit*.17);
 clouds.visible=mode==='overview';for(const [i,c] of clouds.children.entries()){const p=new T.Vector3(-.66+i*.6+(reduced?0:Math.sin(time*.025+i)*.025),.6+i%2*.05,.5).unproject(camera);c.position.copy(camera.position).add(p.sub(camera.position).normalize().multiplyScalar(skyDistance));c.quaternion.copy(camera.quaternion);c.scale.setScalar(unit*.24);}

 if(occlusionDirty||camera.position.distanceToSquared(lastOcclusionCamera)>.08||reduced){clearSight();lastOcclusionCamera.copy(camera.position);occlusionDirty=false;}if(!reduced){if(waterWheel.visible)rotor.rotation.x=time*.22;seeds.position.y=Math.sin(time*.5)*.14;for(const [i,o] of lights.entries())o.rotation.y=time*.4+i;for(const [i,o] of water.entries())o.material.roughness=.3+Math.sin(time*.7+i)*.06;for(const [i,o] of foam.entries())o.material.opacity=.18+Math.sin(time*.65+i)*.055;}onProject(ISLAND_DESTINATIONS.map(p=>{const v=new T.Vector3(p.x,1.7,p.z).project(camera);return {id:p.id,x:(v.x+1)*50,y:(1-v.y)*50,visible:v.z>-1&&v.z<1}}),mode);}
 };
}
