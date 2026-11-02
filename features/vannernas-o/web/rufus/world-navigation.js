// Keep touch targets separate while retaining a short line to their actual home.
export function layoutWorldPins(points,width,height){
 const placed=[],result=[];
 for(const p of [...points].sort((a,b)=>a.y-b.y)){
  const w=p.width||110,h=p.height||44,anchorX=p.x*width/100,anchorY=p.y*height/100,candidates=[];
  for(let row=-4;row<=4;row++)for(let col=-3;col<=3;col++){
   const x=Math.max(w/2+8,Math.min(width-w/2-8,anchorX+col*(w+8))),y=Math.max(h+height*.18,Math.min(height-18,anchorY+row*(h+7)));
   const box={left:x-w/2,right:x+w/2,top:y-h,bottom:y};if(placed.some(b=>box.left<b.right+5&&box.right>b.left-5&&box.top<b.bottom+5&&box.bottom>b.top-5))continue;
   candidates.push({x,y,box,cost:(x-anchorX)**2+(y-anchorY)**2});
  }
  const best=candidates.sort((a,b)=>a.cost-b.cost)[0]||{x:anchorX,y:anchorY,box:{left:anchorX-w/2,right:anchorX+w/2,top:anchorY-h,bottom:anchorY}};placed.push(best.box);result.push({...p,x:best.x/width*100,y:best.y/height*100,dx:anchorX-best.x,dy:anchorY-best.y});
 }
 return result;
}
