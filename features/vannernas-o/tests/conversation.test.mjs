
import {TREASURE_CLUES} from '../web/rufus/treasure-data.js';
import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
class Element{constructor(){this.listeners={};this.children=[];this.value='';this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};}addEventListener(e,f){this.listeners[e]=f}append(...els){this.children.push(...els)}setAttribute(){}toggleAttribute(){}replaceChildren(){this.children=[]}focus(){} }
const els=new Map(),get=id=>{if(!els.has(id))els.set(id,new Element());return els.get(id)},events=[],intervals=[];let socket;
class Socket{static OPEN=1;constructor(){socket=this;this.readyState=1;this.sent=[]}send(s){this.sent.push(JSON.parse(s))}close(){}async message(value){await this.onmessage({data:JSON.stringify(value)})}}
const played=[];
const audio={createBuffer:(_,length,rate)=>({duration:length/rate,getChannelData:()=>new Float32Array(length)}),createBufferSource:()=>{const source={connect(){},start(){},stop(){}};played.push(source);return source},currentTime:10,destination:{},resume:async()=>{},close:async()=>{},createAnalyser:()=>({connect(){},fftSize:256})};
const win={WebSocket:Socket,AudioContext:class{constructor(){return audio}},matchMedia:()=>({matches:false}),addEventListener(){},dispatchEvent:e=>events.push(e),zooTreasure:{active:()=>true},zooAdventure:{stage:()=>0}};
const doc={getElementById:get,querySelectorAll:()=>[],createElement:()=>new Element(),createTextNode:text=>({text}),addEventListener(){},hidden:false};
let sessionInput;const context={window:win,document:doc,WebSocket:Socket,navigator:{},console,Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail}},setTimeout:()=>1,clearTimeout(){},setInterval:fn=>{intervals.push(fn);return intervals.length},clearInterval(){},Uint8Array,Date,DataView,atob:value=>Buffer.from(value,'base64').toString('binary'),fetch:async(url,init)=>{return {ok:true,json:async()=>{if(url==='/api/vannernas-o/status')return {ready:true,turnstileSiteKey:'test-site'};sessionInput=JSON.parse(init.body);return{token:'mock-token',model:'mock-model',voice:'Puck',prompt:'mock',expiresAt:new Date(Date.now()+1800000).toISOString()}}}}};
doc.head={append:script=>{win.turnstile={render:(_selector,options)=>{win.verifyAgain=()=>options.callback('test-verification');win.verifyAgain();return 1},reset:()=>{win.verifyAgain()}};script.onload()}};
vm.createContext(context);const source=fs.readFileSync('web/index.html','utf8').match(/<script>\s*(\(function\(\)\{[\s\S]*?\}\)\(\);)\s*<\/script>/)[1];vm.runInContext(source,context);await Promise.resolve();await Promise.resolve();await Promise.resolve();
await new Promise(setImmediate);await get('start-text').listeners.click();assert.ok(socket,'text conversation creates a socket: '+get('message').textContent);assert.equal(sessionInput.treasureActive,true);socket.onopen();await socket.message({setupComplete:true});
const send=text=>{get('chat-input').value=text;get('chat-form').listeners.submit({preventDefault(){}})};
const complete=()=>socket.message({serverContent:{outputTranscription:{text:'Hej, så roligt att prata!'},turnComplete:true}});
await complete();assert.equal(events.filter(e=>e.type==='zoo-conversation-turn').length,0,'unsolicited greetings do not count');send('Hej Rufus');await complete();assert.equal(events.filter(e=>e.type==='zoo-conversation-turn').length,1);
win.zooUI.requestTreasureClue();for(const tick of intervals)tick();assert.ok(socket.sent.some(s=>s.realtimeInput?.text?.includes('räknegåta')));await socket.message({serverContent:{inputTranscription:{text:'Nu vill jag höra din ledtråd'},outputTranscription:{text:'Vad är fyra par tassavtryck?'},turnComplete:true}});assert.equal(events.filter(e=>e.type==='zoo-conversation-turn').length,1,'automatic clue requests and echoed text do not count');
send('Vad gör du i skogen?');await complete();assert.equal(events.filter(e=>e.type==='zoo-conversation-turn').length,2);send('Avbruten fråga');await socket.message({serverContent:{outputTranscription:{text:'Jo'},interrupted:true,turnComplete:true}});assert.equal(events.filter(e=>e.type==='zoo-conversation-turn').length,2,'interrupted responses do not count');get('end').listeners.click();assert.equal(events.at(-1).detail.connected,false);
// One tap starts recognition before any network await. Speech finished during setup is queued once.
let recognizer,recognitionStarts=0;
win.SpeechRecognition=class{constructor(){recognizer=this}start(){recognitionStarts++}abort(){}stop(){this.onend?.()}};
const beforeSpeechSocket=socket,beforeSends=socket.sent.length;
const opening=get('start-stt').listeners.click();assert.equal(recognitionStarts,1,'microphone activation stays within the original user tap');
const final=[{transcript:'Hej Rufus, jag vill prata om skogen'}];final.isFinal=true;recognizer.onresult({results:[final]});recognizer.onend();assert.equal(beforeSpeechSocket.sent.length,beforeSends,'speech waits for the new session');
await opening;assert.notEqual(socket,beforeSpeechSocket);socket.onopen();await socket.message({setupComplete:true});
assert.equal(recognitionStarts,1,'setup does not ask for another tap or start a duplicate recording');assert.equal(socket.sent.filter(m=>m.realtimeInput?.text==='Hej Rufus, jag vill prata om skogen').length,1);assert.equal(get('speech-transcript').textContent,'Hej Rufus, jag vill prata om skogen');
get('end').listeners.click();
// Speech that finishes after connection is also sent immediately without a second click.
await get('start-stt').listeners.click();socket.onopen();await socket.message({setupComplete:true});assert.equal(get('status-text').textContent,'Jag lyssnar – prata nu!');
const later=[{transcript:'Vad tycker du om ön?'}];later.isFinal=true;recognizer.onresult({results:[later]});assert.equal(socket.sent.filter(m=>m.realtimeInput?.text==='Vad tycker du om ön?').length,1);get('end').listeners.click();
console.log('One-tap speech: immediate microphone start, buffered early utterance, exactly-once delivery, listening status and later speech passed.');
console.log('Actual conversation controller: user/AI turn events, quest request, queued clue speech, no automatic/unsolicited/interrupted credit and end state passed.');

// Real WebSocket envelope: tool calls are acknowledged; the quest waits for playback.
win.islandI18n={language:'en'};win.zooAdventure.stage=()=>2;win.zooUI.select('duck');
await get('start-text').listeners.click();assert.equal(sessionInput.language,'en');assert.equal(sessionInput.questStage,2);socket.onopen();
assert.equal(socket.sent[0].setup.tools[0].functionDeclarations[0].name,'complete_waterwheel_step');
await socket.message({setupComplete:true});
const tool=(id,stage)=>socket.message({toolCall:{functionCalls:[{id,name:'complete_waterwheel_step',args:{stage}}]}});
const advances=()=>events.filter(e=>e.type==='zoo-quest-spoken');
await tool('wrong',3);assert.equal(socket.sent.at(-1).toolResponse.functionResponses[0].response.result,'ignored_wrong_or_inactive_step');
await tool('duck-2',2);assert.equal(advances().length,0);
await socket.message({serverContent:{outputTranscription:{text:'Calm water and room for water lilies. Visit Owl next.'},modelTurn:{parts:[{inlineData:{data:Buffer.alloc(4800).toString('base64')}}]},turnComplete:true}});
assert.equal(advances().length,0,'server turn completion is earlier than audible playback completion');
played.at(-1).onended();assert.equal(advances().length,1);assert.equal(advances()[0].detail.animal,'duck');assert.equal(advances()[0].detail.stage,2);
for(const tick of intervals)tick();assert.equal(advances().length,1,'playback/timers cannot repeat a queued completion');
await tool('cancel-me',2);await socket.message({toolCallCancellation:{ids:['cancel-me']}});await complete();assert.equal(advances().length,1,'cancelled tool call does not advance');
await tool('interrupt-me',2);await socket.message({serverContent:{interrupted:true,turnComplete:true}});assert.equal(advances().length,1);
await tool('silent',2);await socket.message({serverContent:{turnComplete:true}});assert.equal(advances().length,1,'a tool without spoken response cannot advance');await complete();assert.equal(advances().length,1,'later unrelated replies do not revive a silent tool');
get('end').listeners.click();await complete();assert.equal(advances().length,1,'ending cancels pending advancement');
// The selected English language configures the actual mobile recognizer.
await get('start-stt').listeners.click();assert.equal(recognizer.lang,'en-GB');get('end').listeners.click();
console.log('English session/recognizer and Live tool envelopes: correct stage, audio drain, cancellation, interruption, silent tool and end cancellation passed.');

// Cancel while token creation is pending: the late response must return its place.
const normalBrowserFetch=context.fetch;let unblockMint,markMintStarted;
const mintStarted=new Promise(resolve=>markMintStarted=resolve),mintWait=new Promise(resolve=>unblockMint=resolve);
context.fetch=async(url,init)=>{if(url==='/api/vannernas-o/session'){markMintStarted();await mintWait}return normalBrowserFetch(url,init)};
const oldSocket=socket,waitingStart=get('start-text').listeners.click();
await mintStarted;get('end').listeners.click();unblockMint();await waitingStart;
assert.equal(socket,oldSocket,'a cancelled pending start never creates a late socket');
context.fetch=normalBrowserFetch;
console.log('Cancelling a pending session prevents a late connection without using any shared conversation reservation.');
// Exercise the actual idle controller with a controllable clock (no real waits).
let simulatedTime=Date.now();context.Date=class extends Date{static now(){return simulatedTime}};
await get('start-text').listeners.click();socket.onopen();await socket.message({setupComplete:true});
assert.deepEqual(socket.sent[0].setup.contextWindowCompression,{slidingWindow:{}});
const idleTick=intervals.findLast(fn=>fn.name==='syncClock');assert.ok(idleTick);
get('chat-input').value='Let us talk';get('chat-form').listeners.submit({preventDefault(){}});await complete();const priorTurns=get('turns').textContent;
await socket.message({sessionResumptionUpdate:{resumable:true,newHandle:'resume-test-handle'}});const firstConnection=socket;firstConnection.onclose();assert.notEqual(socket,firstConnection);socket.onopen();assert.equal(socket.sent[0].setup.sessionResumption.handle,'resume-test-handle');await socket.message({setupComplete:true});assert.equal(get('turns').textContent,priorTurns,'technical reconnection preserves conversation/quest counters');
for(let i=0;i<5;i++){simulatedTime+=60000;get('chat-input').listeners.input();idleTick()}
assert.equal(get('end').hidden,false,'active typing keeps a conversation going past three minutes');assert.equal(get('timer').textContent,'05:00');
simulatedTime+=90000;idleTick();assert.equal(get('idle-warning').hidden,false,'warn after 90 seconds');get('keep-conversation').listeners.click();assert.equal(get('idle-warning').hidden,true);
simulatedTime+=90000;idleTick();assert.equal(get('idle-warning').hidden,false);await socket.message({serverContent:{inputTranscription:{text:'I am still here'}}});assert.equal(get('idle-warning').hidden,true,'recognised speech resets inactivity');
await socket.message({serverContent:{modelTurn:{parts:[{inlineData:{data:Buffer.alloc(4800).toString('base64')}}]},turnComplete:true}});
simulatedTime+=130000;idleTick();assert.equal(get('end').hidden,false,'never stop in the middle of played reply audio');played.at(-1).onended();
simulatedTime+=90000;idleTick();assert.equal(get('idle-warning').hidden,false);simulatedTime+=30000;idleTick();assert.equal(get('end').hidden,true);assert.ok(get('message').textContent.includes('två minuters inaktivitet'));
console.log('Actual idle controller: active chat past 3 minutes, elapsed timer, warning/keep button, recognised speech, reply playback, 2-minute silence stop and resumable connection without progress reset passed.');
