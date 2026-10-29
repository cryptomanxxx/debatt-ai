import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSession,getStatus,MODEL} from '../server/session.mjs';
import {TREASURE_CLUES} from '../web/rufus/treasure-data.js';
const env={GEMINI_API_KEY:'server-key-never-return',TURNSTILE_SECRET_KEY:'captcha-secret',NEXT_PUBLIC_TURNSTILE_SITE_KEY:'public-site'};
const request=(input={},headers={})=>new Request('https://debatt-ai.se/api/vannernas-o/session',{method:'POST',headers:{origin:'https://debatt-ai.se','content-type':'application/json',...headers},body:JSON.stringify({animal:'duck',turnstileToken:'single-use-proof',...input})});
const response=data=>new Response(JSON.stringify(data));
const valid={success:true,action:'friends_island_voice',hostname:'debatt-ai.se'};
test('API refuses bad origin, oversized streamed body, invalid animal/language/stage and BYOK before calling providers',async()=>{
 let calls=0;const deps={fetch:async()=>{calls++;throw Error('should not call')}};
 for(const [req,status] of [[request({}, {origin:'https://evil.test'}),403],[request({animal:'unknown'}),400],[request({language:'xx'}),400],[request({questStage:9}),400],[request({apiKey:'injected'}),400],[request({}, {'content-type':'text/plain'}),415],[request({turnstileToken:'x'.repeat(5000)}),413]])assert.equal((await createSession(req,env,deps)).status,status);
 const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(4097));c.close()}});
 assert.equal((await createSession(new Request('https://debatt-ai.se/api/vannernas-o/session',{method:'POST',headers:{origin:'https://debatt-ai.se','content-type':'application/json'},body:stream,duplex:'half'}),env,deps)).status,413);assert.equal(calls,0);
});
test('missing configuration or verification fails closed; wrong hostname/action cannot mint a token',async()=>{
 assert.equal((await createSession(request(),{})).status,503);
 assert.equal((await createSession(request({turnstileToken:''}),env)).status,403);
 for(const verdict of [{...valid,success:false},{...valid,hostname:'evil.test'},{...valid,action:'contact'}]){let calls=0;const result=await createSession(request(),env,{fetch:async()=>{calls++;return response(verdict)}});assert.equal(result.status,403);assert.equal(calls,1)}
 assert.equal((await createSession(request(),env,{fetch:async()=>{throw Error('secret')}})).status,503);
 const status=await getStatus(env).json();assert.equal(status.ready,true);assert.equal(status.turnstileSiteKey,'public-site');assert.ok(!JSON.stringify(status).includes(env.GEMINI_API_KEY));
});
test('all eight mint one-use constrained 30-minute tokens; each gets only its own clue and correct English quest prompt',async()=>{
 for(const [i,clue] of TREASURE_CLUES.entries()){
  let calls=0;const now=Date.now();const result=await createSession(request({animal:clue.id,treasureActive:true,language:'en',questStage:clue.id==='duck'?2:0}),env,{now,fetch:async(url,init)=>{
   calls++;const body=JSON.parse(init.body);
   if(url.includes('siteverify')){assert.equal(body.secret,env.TURNSTILE_SECRET_KEY);return response(valid)}
   assert.equal(init.headers['x-goog-api-key'],env.GEMINI_API_KEY);assert.equal(body.uses,1);assert.equal(Date.parse(body.expireTime)-now,1800000);assert.equal(Date.parse(body.newSessionExpireTime)-now,45000);assert.equal(body.bidiGenerateContentSetup.model,'models/'+MODEL);assert.deepEqual(body.bidiGenerateContentSetup.generationConfig.responseModalities,['AUDIO']);assert.equal(body.bidiGenerateContentSetup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,clue.id==='duck'||clue.id==='rabbit'||clue.id==='owl'?'Leda':'Puck');assert.equal(body.fieldMask,'model,generationConfig');assert.equal(body.liveConnectConstraints,undefined);return response({name:'auth_tokens/test'})
  }});
  assert.equal(result.status,200);assert.equal(calls,2);const body=await result.json();assert.equal(body.idleTimeoutSeconds,120);assert.equal(body.maxConcurrentSessions,undefined);assert.ok(body.prompt.includes(clue.riddle));assert.ok(body.prompt.includes('siffra '+(i+1)));assert.ok(body.prompt.includes('ONLY natural English'));for(const other of TREASURE_CLUES.filter(c=>c!==clue))assert.ok(!body.prompt.includes(other.riddle));assert.ok(!JSON.stringify(body).includes(env.GEMINI_API_KEY));if(clue.id==='duck')assert.ok(body.prompt.includes('complete_waterwheel_step med stage=2'));
 }
});
test('provider quota/network/invalid response are sanitized and never retried with weaker constraints',async()=>{
 for(const code of [400,403,429,500]){let calls=0;const r=await createSession(request(),env,{fetch:async(url)=>{calls++;return url.includes('siteverify')?response(valid):new Response('sensitive provider error with server-key-never-return',{status:code})}});assert.equal(r.status,code===429?429:502);assert.equal(calls,2);assert.ok(!(await r.text()).includes('server-key-never-return'))}
});
test('twenty independent starts have no application-wide five-person cap',async()=>{
 const results=await Promise.all(Array.from({length:20},()=>createSession(request(),env,{fetch:async url=>response(url.includes('siteverify')?valid:{name:'auth_tokens/test'})})));
 assert.ok(results.every(r=>r.status===200));
});

test('REST body matches the official SDK wire fixture and locks only model/generation settings',async()=>{
 const fixture=JSON.parse((await import('node:fs')).readFileSync(new URL('./fixtures/gemini-token-sdk-2.31.0.json',import.meta.url),'utf8'));
 let payload;
 await createSession(request(),env,{now:Date.parse('2026-10-29T16:00:00.000Z'),fetch:async(url,init)=>{if(url.includes('siteverify'))return response(valid);payload=JSON.parse(init.body);return response({name:'auth_tokens/test'})}});
 const {fieldMask,...wire}=payload;assert.deepEqual(wire,fixture);assert.equal(fieldMask,'model,generationConfig');
 // No blanket lock: client-supplied system instruction, quest tools,
 // transcription and sessionResumption.handle must still be accepted.
 assert.deepEqual(Object.keys(payload.bidiGenerateContentSetup).sort(),['generationConfig','model']);
});
test('safe diagnostics distinguish key/access/parameters/quota and omit arbitrary provider text from response and logs',async()=>{
 const original=console.warn,logs=[];console.warn=(...args)=>logs.push(args.join(' '));
 try{
 for(const [httpStatus,code,reason,match] of [[400,'INVALID_ARGUMENT','API_KEY_INVALID','servernyckel'],[403,'PERMISSION_DENIED','API_KEY_HTTP_REFERRER_BLOCKED','nekade åtkomst'],[400,'INVALID_ARGUMENT',null,'samtalsinställningarna'],[429,'RESOURCE_EXHAUSTED',null,'anropsgräns'],[400,'FAILED_PRECONDITION',null,'projektvillkor']]){
  let calls=0;const r=await createSession(request(),env,{fetch:async(url)=>{calls++;return url.includes('siteverify')?response(valid):new Response(JSON.stringify({error:{status:code,message:env.GEMINI_API_KEY,details:[{reason,metadata:{apiKey:env.GEMINI_API_KEY}}]}}),{status:httpStatus})}});
  const data=await r.json();assert.equal(calls,2);assert.deepEqual(data.diagnostic,{httpStatus,code,reason});assert.ok(data.error.includes(match));assert.ok(!JSON.stringify(data).includes(env.GEMINI_API_KEY));
 }
 const hostile=await createSession(request({language:'en'}),env,{fetch:async(url)=>url.includes('siteverify')?response(valid):new Response(JSON.stringify({error:{status:env.GEMINI_API_KEY,message:env.GEMINI_API_KEY,details:[{reason:env.GEMINI_API_KEY}]}}),{status:400})});
 const data=await hostile.json();assert.deepEqual(data.diagnostic,{httpStatus:400,code:null,reason:null});assert.ok(data.error.includes('Google rejected'));assert.ok(!JSON.stringify(data).includes(env.GEMINI_API_KEY));assert.ok(!logs.join('').includes(env.GEMINI_API_KEY));assert.equal(logs.length,6);
 }finally{console.warn=original}
});
