import {ANIMAL_IDS,sessionPrompt} from './prompts.mjs';
import {providerError} from './provider-error.mjs';
export const MODEL='gemini-3.8-live';
const TOKEN_MS=30*60*1000;
export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}})}
const reject=(error,status)=>json({error},status);
export function getStatus(env){return json({ready:Boolean(env.DEBATT_AI_ANIMAL_ZOO_GEMINI_API_KEY&&env.TURNSTILE_SECRET_KEY&&env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),turnstileSiteKey:env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||null,model:MODEL,idleTimeoutSeconds:120})}
async function readInput(request){
 const reader=request.body?.getReader();if(!reader)throw Error('body');let length=0;const chunks=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>4096){await reader.cancel();throw Error('size')}chunks.push(value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
// Turnstile tokens are single-use and verified by Cloudflare, including across
// server instances. No global visitor cap, shared in-memory quota or user API keys.
export async function createSession(request,env,{fetch:fetcher=globalThis.fetch,now=Date.now()}={}){
 const url=new URL(request.url);
 if(request.method!=='POST')return reject('Fel metod.',405);
 if(request.headers.get('origin')!==url.origin)return reject('Ogiltigt ursprung.',403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return reject('Fel format.',415);
 if(Number(request.headers.get('content-length')||0)>4096)return reject('För stor begäran.',413);
 let input;try{input=await readInput(request)}catch(e){return reject(e.message==='size'?'För stor begäran.':'Ogiltig begäran.',e.message==='size'?413:400)}
 if(!input||Array.isArray(input)||typeof input!=='object'||!ANIMAL_IDS.includes(input.animal))return reject('Okänt djur.',400);
 if(input.apiKey!==undefined)return reject('API-nycklar kan inte skickas från webbläsaren.',400);
 if(input.language!==undefined&&!['sv','en'].includes(input.language))return reject('Ogiltigt språk.',400);
 if(input.questStage!==undefined&&(!Number.isInteger(input.questStage)||input.questStage<0||input.questStage>5))return reject('Ogiltigt uppdragssteg.',400);
 if(input.treasureActive!==undefined&&typeof input.treasureActive!=='boolean')return reject('Ogiltig begäran.',400);
 if(!env.DEBATT_AI_ANIMAL_ZOO_GEMINI_API_KEY||!env.TURNSTILE_SECRET_KEY||!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)return reject('Samtalen är inte tillgängliga just nu.',503);
 if(typeof input.turnstileToken!=='string'||!input.turnstileToken||input.turnstileToken.length>2048)return reject('Verifiera att du är en människa innan du startar ett samtal.',403);
 try{
  const verification=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:input.turnstileToken}),signal:AbortSignal.timeout(10000)});
  const verdict=await verification.json();
  if(!verification.ok||verdict.success!==true||verdict.action!=='friends_island_voice'||verdict.hostname!==url.hostname)return reject('Verifieringen misslyckades. Försök igen.',403);
 }catch{return reject('Verifieringen är tillfälligt otillgänglig. Försök igen.',503)}
 const expiresAt=new Date(now+TOKEN_MS).toISOString();
 const session=sessionPrompt(input);
 // liveConnectConstraints/config are SDK names, not REST fields. Match the
 // official SDK's serialized request; keep the generation config authoritative
 // while leaving tools, system instructions and resumption configurable.
 const payload={uses:1,expireTime:expiresAt,newSessionExpireTime:new Date(now+45000).toISOString(),
  bidiGenerateContentSetup:{model:`models/${MODEL}`,generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:session.voice}}}}},
  fieldMask:'model,generationConfig'};
 try{
  const upstream=await fetcher('https://generativelanguage.googleapis.com/v1beta/auth_tokens',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':env.DEBATT_AI_ANIMAL_ZOO_GEMINI_API_KEY},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
  // Never relay provider messages, headers or keys. Fail closed rather than
  // retrying with weaker token constraints on a public site.
  if(!upstream.ok){
   const failure=await providerError(upstream,input.language);
   console.warn('island_gemini_token_rejected',JSON.stringify(failure.diagnostic));
   return json(failure,upstream.status===429?429:502);
  }
  const result=await upstream.json();if(typeof result?.name!=='string'||!result.name)return reject('Gemini skickade ett ofullständigt svar.',502);
  return json({token:result.name,model:MODEL,...session,animal:input.animal,expiresAt,idleTimeoutSeconds:120});
 }catch{return reject('Det gick inte att kontakta Gemini. Försök igen.',502)}
}
