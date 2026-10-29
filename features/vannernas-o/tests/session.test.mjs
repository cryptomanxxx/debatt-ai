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
   assert.equal(init.headers['x-goog-api-key'],env.GEMINI_API_KEY);assert.equal(body.uses,1);assert.equal(Date.parse(body.expireTime)-now,1800000);assert.equal(Date.parse(body.newSessionExpireTime)-now,45000);assert.equal(body.liveConnectConstraints.model,'models/'+MODEL);return response({name:'auth_tokens/test'})
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
