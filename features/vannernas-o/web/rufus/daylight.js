// Device-local time; no location, network lookup or astronomical claim is needed.
export const LIGHT_MODES={auto:null,morning:8,day:13,evening:18.5,night:23};
const stops=[
 [0,0x243954,0x72868a,0xb2c9ef,1.5,1.05],
 [6,0x8eb7c7,0xe9c9a3,0xffc88e,1.8,1.7],
 [9,0x76b2c9,0xd9e6ca,0xffe6b5,2.1,2.2],
 [13,0x68a6bb,0xdbe5cf,0xffedda,2.2,2.3],
 [16,0x8bb5c2,0xe9dcc0,0xffddb0,2.05,2.1],
 [19,0x737eab,0xe8b594,0xffb575,1.8,1.65],
 [22,0x243954,0x72868a,0xb2c9ef,1.5,1.05],
 [24,0x243954,0x72868a,0xb2c9ef,1.5,1.05]
];
const mixColor=(a,b,t)=>[16,8,0].reduce((n,shift)=>n|(Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t)<<shift),0);
export function lightingForHour(hour){
 const h=((Number(hour)||0)%24+24)%24;let i=0;while(i<stops.length-2&&h>stops[i+1][0])i++;
 const a=stops[i],b=stops[i+1],t=(h-a[0])/(b[0]-a[0]);
 return {hour:h,label:h<6||h>=22?'Natt':h<10?'Morgon':h<17?'Dag':'Kväll',top:mixColor(a[1],b[1],t),horizon:mixColor(a[2],b[2],t),keyColor:mixColor(a[3],b[3],t),ambient:a[4]*(1-t)+b[4]*t,key:a[5]*(1-t)+b[5]*t,night:1-(a[4]*(1-t)+b[4]*t-1.5)/.7};
}
export function hourFromDate(date){return date.getHours()+date.getMinutes()/60+date.getSeconds()/3600;}
