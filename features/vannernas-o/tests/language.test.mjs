import assert from 'node:assert/strict';
import fs from 'node:fs';
import {setupLanguage,translateEnglish} from '../web/rufus/i18n.js';
import {TREASURE_CLUES} from '../web/rufus/treasure-data.js';
import {QUEST_STEPS} from '../web/rufus/island-experience.js';
for(const step of Object.values(QUEST_STEPS))assert.ok(!/[åäöÅÄÖ]/.test(translateEnglish(step.text)));
for(const clue of TREASURE_CLUES)assert.notEqual(translateEnglish(clue.riddle),clue.riddle);
assert.equal(translateEnglish('1. Besök Ugglan · Steg 3 av 4'),'1. Visit Owl · Step 3 of 4');
assert.equal(translateEnglish('Available David Studio'), 'Available David Studio','whole-word translation cannot corrupt English');
const nodes=[];
class Text{constructor(data,parent){this.nodeType=3;this.data=data;this.parentElement=parent;}}
class Element{
 constructor(text='',parent=null){this.nodeType=1;this.parentElement=parent;this.childNodes=[];this.attrs={};this.listeners={};nodes.push(this);if(text)this.childNodes.push(new Text(text,this));}
 closest(){return this.attrs['data-no-translate']==='true'?this:this.parentElement?.closest()||null;}
 getAttribute(k){return this.attrs[k]??null}setAttribute(k,v){this.attrs[k]=v}
 get textContent(){return this.childNodes.map(n=>n.data||n.textContent).join('')}set textContent(value){this.childNodes=[new Text(value,this)]}
 addEventListener(e,fn){this.listeners[e]=fn}
}
const root=new Element(),header=new Element('Vännernas ö',root),button=new Element('🌐 In English',root),quest=new Element('Steg 2 av 4',root),riddle=new Element(TREASURE_CLUES[0].riddle,root),input=new Element('',root),log=new Element('Kaninen sa hej på svenska',root);log.setAttribute('data-no-translate','true');input.setAttribute('placeholder','Åtta siffror');input.value='2894';root.childNodes=[header,button,quest,riddle,input,log];
const events={},stored={},doc={documentElement:root,getElementById:()=>button};let observe;
const win={localStorage:{getItem:k=>stored[k],setItem:(k,v)=>stored[k]=v},MutationObserver:class{constructor(fn){observe=fn}observe(){}disconnect(){}},addEventListener:(e,f)=>events[e]=f,dispatchEvent(){},CustomEvent:class{constructor(type,options){Object.assign(this,{type,...options})}}};
const language=setupLanguage({document:doc,window:win});button.listeners.click();assert.equal(language.language,'en');assert.equal(root.lang,'en');assert.equal(header.textContent,'Friends’ Island');assert.equal(button.textContent,'🌐 På svenska');assert.equal(quest.textContent,'Step 2 of 4');assert.equal(riddle.textContent,'What is five minus three?');assert.equal(log.textContent,'Kaninen sa hej på svenska','actual conversations are never rewritten');assert.equal(input.value,'2894');assert.equal(input.getAttribute('placeholder'),'Eight digits');assert.equal(stored['friends-island-language'],'en');
quest.textContent='Steg 3 av 4';observe([{type:'childList',addedNodes:quest.childNodes}]);assert.equal(quest.textContent,'Step 3 of 4');
events['zoo-session-state']({detail:{connected:true}});button.listeners.click();assert.equal(language.language,'en','language cannot change mid-session');events['zoo-session-state']({detail:{connected:false}});button.listeners.click();assert.equal(root.lang,'sv');assert.equal(header.textContent,'Vännernas ö');assert.equal(quest.textContent,'Steg 3 av 4');assert.equal(input.getAttribute('placeholder'),'Åtta siffror');assert.equal(input.value,'2894','switching languages preserves entered digits');
language.dispose();stored['friends-island-language']='en';setupLanguage({document:doc,window:win});assert.equal(header.textContent,'Friends’ Island','saved language is restored');
const html=fs.readFileSync('web/index.html','utf8');assert.ok(html.includes('1. Ett vattenhjul åt Doris'));assert.ok(html.includes('2. Öns hemliga skatt'));
console.log('Language: English/Swedish round-trip, live progress, all quest text/eight riddles, placeholders, untouched conversations/inputs, active-session guard and persisted preference passed.');
