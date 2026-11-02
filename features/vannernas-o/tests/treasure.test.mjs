import assert from 'node:assert/strict';
import {TREASURE_CLUES} from '../web/rufus/treasure-data.js';
import {createTreasureHunt,setupTreasureHunt} from '../web/rufus/treasure.js';
const hunt=createTreasureHunt();assert.equal(hunt.submit('11111111'),false);assert.equal(hunt.submit('28942137'),true,'correct code works without starting quests');hunt.reset();hunt.tick('duck',30000);hunt.turn('duck');assert.equal(hunt.progress('duck').ms,0);hunt.start();hunt.tick('duck',30000);assert.equal(hunt.ready('duck'),false);hunt.turn('duck');hunt.turn('duck');assert.equal(hunt.ready('duck'),true);assert.equal(hunt.solve('duck','3'),false);assert.equal(hunt.solve('duck','2'),true);assert.equal(hunt.submit('28942137'),true,'correct code works with incomplete clues');hunt.reset();assert.equal(hunt.count,0);
class Element{constructor(){this.listeners={};this.children=[];this.value='';this.hidden=false;this.disabled=false}addEventListener(e,f){(this.listeners[e]??=[]).push(f)}setAttribute(){}append(...els){this.children.push(...els)}emit(e,detail){for(const f of this.listeners[e]||[])f({preventDefault(){},detail})}click(){if(!this.disabled)this.emit('click')}}
const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)},doc=new Element(),win=new Element();doc.getElementById=get;doc.createElement=()=>new Element();doc.hidden=false;
let time=0,timer=null,travel=null,opened=false,cluesSpoken=0,prepared=0;win.zooUI={requestTreasureClue:()=>{cluesSpoken++}};
const ui=setupTreasureHunt({document:doc,window:win,onTravel:id=>travel=id,onPrepare:()=>prepared++,onOpen:v=>opened=v,now:()=>time,schedule:fn=>{timer=fn;return 1},cancel:()=>{timer=null}});
const state=(animal,connected=true)=>win.emit('zoo-session-state',{animal,connected,connecting:false});
const turn=id=>win.emit('zoo-conversation-turn',{animal:id});
const advance=seconds=>{for(let i=0;i<seconds;i++){time+=1000;timer?.()}};
assert.equal(get('treasure-code').disabled,false);assert.equal(get('treasure-code-form').hidden,false,'code field is visible before starting the hunt');get('treasure-code').value='11111111';get('treasure-code-form').emit('submit');assert.equal(opened,false);get('treasure-code').value='28942137';get('treasure-code-form').emit('submit');assert.equal(opened,true,'test unlock works with zero clues');assert.equal(ui.hunt.count,0);assert.equal(prepared,1);get('treasure-reset').click();assert.equal(opened,false);assert.equal(get('treasure-code').disabled,false);prepared=0;
get('treasure-start').click();assert.equal(win.zooTreasure.active(),true);
for(const [i,c] of TREASURE_CLUES.entries()){
 ui.visit(c.id);state(c.id);assert.equal(get('treasure-start').disabled,true);turn('unknown');turn(c.id);turn(c.id);
 if(i===0){doc.hidden=true;advance(40);assert.equal(ui.hunt.progress(c.id).ms,0);doc.hidden=false;doc.emit('visibilitychange');advance(29);assert.equal(ui.hunt.ready(c.id),false);advance(1);}else advance(30);
 assert.equal(ui.hunt.ready(c.id),true);assert.equal(cluesSpoken,i+1,'one automatic clue request per friend');
 const row=get('treasure-clues').children[i],form=row.children[5],input=form.children[0];input.value='0';form.emit('submit');assert.equal(ui.hunt.count,i);input.value=c.digit;form.emit('submit');assert.equal(ui.hunt.count,i+1);assert.equal(get('treasure-slots').children[i].textContent,c.digit);
 state(c.id,false);
}
assert.equal(get('treasure-code').disabled,false);get('treasure-code').value='11111111';get('treasure-code-form').emit('submit');assert.equal(opened,false);assert.ok(get('treasure-note').textContent.includes('stämmer inte'));state('duck');get('treasure-code').value='28942137';get('treasure-code-form').emit('submit');assert.equal(opened,false,'cannot travel or unlock during a conversation');state('duck',false);get('treasure-code-form').emit('submit');assert.equal(opened,true);assert.equal(prepared,1,'sound is primed only on a valid unlock');assert.equal(travel,'treasure');assert.equal(get('treasure-reward').hidden,false);get('treasure-reset').click();assert.equal(opened,false);assert.equal(ui.hunt.count,0);assert.equal(ui.hunt.active,false);assert.equal(timer,null);
console.log('Treasure: eight real-turn/time gates, hidden-tab pause, clue delivery, wrong answers/code, position order, session locks, reward and reset passed.');
