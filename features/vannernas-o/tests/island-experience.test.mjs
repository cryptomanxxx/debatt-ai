import assert from 'node:assert/strict';
import {createIslandQuest,setupIslandExperience} from '../web/rufus/island-experience.js';
const q=createIslandQuest();assert.equal(q.stage,0);q.start();assert.equal(q.answer('build'),false);for(const answer of ['help','calm','slow','build'])assert.equal(q.answer(answer),true);assert.equal(q.stage,5);assert.equal(q.answer('build'),false);q.reset();assert.equal(q.stage,0);
class Element{constructor(){this.listeners={};this.children=[];this.style={};this.dataset={}}addEventListener(e,f){this.listeners[e]=f}setAttribute(k,v){this[k]=v}replaceChildren(){this.children=[]}append(e){this.children.push(e)}click(){if(!this.disabled)return this.listeners.click?.()} }
const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)},doc={getElementById:get,createElement:()=>new Element(),body:new Element(),listeners:{},addEventListener(e,f){this.listeners[e]=f}},win={listeners:{},addEventListener(e,f){this.listeners[e]=f}};
let travel,complete=false;const exp=setupIslandExperience({document:doc,window:win,onTravel:id=>travel=id,onComplete:v=>complete=v});
await get('world-fullscreen').click();assert.equal(doc.body.dataset.worldFullscreen,'true');doc.listeners.keydown({key:'Escape'});assert.equal(doc.body.dataset.worldFullscreen,'false');
get('world-shell').requestFullscreen=async()=>{doc.fullscreenElement=get('world-shell')};doc.exitFullscreen=async()=>{doc.fullscreenElement=null};await get('world-fullscreen').click();assert.equal(doc.fullscreenElement,get('world-shell'));await get('world-fullscreen').click();assert.equal(doc.fullscreenElement,null);
get('quest-start').click();assert.equal(travel,'robot');exp.visit('robot');exp.session(true);get('quest-choices').children[0].click();assert.equal(exp.quest.stage,1);exp.session(false);get('quest-choices').children[0].click();assert.equal(exp.quest.stage,2);exp.visit('duck');get('quest-choices').children[1].click();assert.equal(exp.quest.stage,2);assert.ok(get('quest-feedback').textContent);get('quest-choices').children[0].click();exp.visit('owl');get('quest-choices').children[0].click();exp.visit('robot');get('quest-choices').children[0].click();assert.equal(complete,true);assert.equal(win.zooAdventure.stage(),5);get('quest-reset').click();assert.equal(complete,false);assert.equal(exp.quest.stage,0);
console.log('Island experience: native/fallback fullscreen, quest progression, wrong answers, session locks and reset passed.');

// Spoken completion advances while the conversation is locked, without travelling or skipping.
doc.hidden=false;get('quest-start').click();exp.visit('robot');exp.session(true);
const spoken=(animal,stage)=>win.listeners['zoo-quest-spoken']({detail:{animal,stage}});
spoken('duck',1);assert.equal(exp.quest.stage,1);spoken('robot',3);assert.equal(exp.quest.stage,1);
spoken('robot',1);assert.equal(exp.quest.stage,2);assert.equal(travel,'robot','the user stays with the speaking friend');
assert.equal(get('quest-travel').textContent,'Besök Doris');assert.equal(get('quest-travel').disabled,true);
spoken('robot',1);assert.equal(exp.quest.stage,2,'duplicates cannot skip steps');
exp.session(false);get('quest-travel').click();assert.equal(travel,'duck');exp.visit('duck');exp.session(true);
spoken('duck',2);assert.equal(exp.quest.stage,3);assert.equal(get('quest-travel').textContent,'Besök Ugglan');
exp.visit('owl');spoken('owl',3);assert.equal(exp.quest.stage,4);exp.visit('robot');spoken('robot',4);assert.equal(exp.quest.stage,5);assert.equal(complete,true);
exp.session(false);get('quest-reset').click();spoken('robot',4);assert.equal(exp.quest.stage,0,'late speech after reset cannot revive a quest');
console.log('Spoken quest completion: all four steps, correct next visit, duplicate/stale/wrong-animal protection, no camera jump and completed wheel passed.');
