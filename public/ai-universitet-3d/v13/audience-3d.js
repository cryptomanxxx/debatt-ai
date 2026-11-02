import * as THREE from 'three';

// Small seated students make the room feel inhabited while remaining light
// enough for the mobile GPU used by the original Three.js prototype.
export function createAudience(scene) {
  const seats=[
    [-2.45,0,0],[-5.03,0,1],[2.45,0,2],[7.61,0,3],
    [-2.45,1,4],[-7.61,1,5],[5.03,1,6],[2.45,2,7],[-5.03,2,8]
  ];
  const skins=[0xe9b998,0xc98f6b,0xf0cda7,0xa97755,0xdbad90];
  const jackets=[0x576f75,0x87604e,0x557078,0x847458,0x6c7e86,0x725c70,0x538077,0x6c6770,0x9a7055];
  const hairs=[0x2a2626,0x5c4737,0x372a23,0xc5ac8b,0x242324,0x69452e];
  const students=[];
  const matte=color=>new THREE.MeshStandardMaterial({color,roughness:.93});

  for(const [x,row,i] of seats) {
    const group=new THREE.Group();
    group.position.set(x,row*.24+.68,-2.9+row*4.5+.16);
    scene.add(group);
    const skin=matte(skins[i%skins.length]);
    const cloth=matte(jackets[i]);
    const pants=matte(i%2?0x353e45:0x44434a);
    const hair=matte(hairs[(i*3+i%2)%hairs.length]);
    const body=new THREE.Group();group.add(body);

    oval(.56,0,.73,.1,cloth,body,1.0,1.21,.63);
    // A real shoulder silhouette instead of just a rectangular torso.
    oval(.52,0,1.23,.08,cloth,body,1.16,.43,.69);
    for(const side of [-1,1]) {
      oval(.19,side*.59,.80,-.07,cloth,body,.93,1.86,1.0).rotation.z=side*.22;
      oval(.27,side*.32,-.10,-.40,pants,group,.93,.72,1.55).rotation.x=Math.PI*.34;
      oval(.19,side*.33,-.25,-.80,matte(0x2d302f),group,1.2,.61,1.8);
      oval(.075,side*.60,.52,-.30,skin,body,.85,1,.9);
    }

    const head=new THREE.Group();head.position.set(0,1.65,-.02);body.add(head);
    oval(.35,0,0,0,skin,head,1,1.06,.95);
    oval(.30,0,.19,.03,hair,head,1.08,.62,1.05);
    for(const side of [-1,1]) {
      oval(.11,side*.29,.04,.04,hair,head,.95,1.5,1);
      oval(.040,side*.13,.01,-.332,matte(0x2f363c),head,1,1,1);
    }
    // A scarf, necklace or tie adds personality without expensive textures.
    if(i%3===0)oval(.12,0,1.11,-.47,matte(0xe2caa0),body,.83,1.25,.30);
    if(i%3===1)oval(.12,0,1.17,-.49,matte(0x8dbdba),body,1.16,.53,.32);

    students.push({body,head,phase:i*1.16});
  }

  return {
    count:students.length,
    animate(t){
      for(const s of students){
        s.head.rotation.y=Math.sin(t*.38+s.phase)*.09;
        s.body.rotation.z=Math.sin(t*.71+s.phase)*.006;
      }
    }
  };
}

function oval(radius,x,y,z,material,parent,sx=1,sy=1,sz=1){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,16,12),material);
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
}
