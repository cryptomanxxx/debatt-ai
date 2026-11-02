// Only fixed, documented metadata may leave the server. Never echo Google's
// message, details, headers, identifiers, request payload or API key.
const CODES=new Set(['INVALID_ARGUMENT','FAILED_PRECONDITION','PERMISSION_DENIED','UNAUTHENTICATED','RESOURCE_EXHAUSTED','NOT_FOUND','UNAVAILABLE','INTERNAL']);
const REASONS=new Set(['API_KEY_INVALID','API_KEY_EXPIRED','API_KEY_BLOCKED','API_KEY_SERVICE_BLOCKED','API_KEY_HTTP_REFERRER_BLOCKED','API_KEY_IP_ADDRESS_BLOCKED','API_KEY_ANDROID_APP_BLOCKED','API_KEY_IOS_APP_BLOCKED']);
export async function providerError(response,language='sv'){
 let body;try{body=await response.json()}catch{}
 const code=CODES.has(body?.error?.status)?body.error.status:null;
 const details=Array.isArray(body?.error?.details)?body.error.details:[];
 const reason=details.map(item=>item?.reason).find(value=>REASONS.has(value))||null;
 const diagnostic={httpStatus:response.status,code,reason};
 const en=language==='en';let message;
 if(reason==='API_KEY_INVALID'||reason==='API_KEY_EXPIRED'||response.status===401)message=en?'The AI service’s server key is invalid or expired. The site administrator needs to update it.':'AI-tjänstens servernyckel är ogiltig eller har gått ut. Webbplatsens administratör behöver uppdatera den.';
 else if(reason?.startsWith('API_KEY_')||response.status===403)message=en?'Google denied access. The site administrator needs to check the server key’s restrictions and project access.':'Google nekade åtkomst. Webbplatsens administratör behöver kontrollera servernyckelns begränsningar och projektets åtkomst.';
 else if(response.status===429)message=en?'Google’s request limit has been reached. Please try later.':'Googles anropsgräns är nådd. Prova senare.';
 else if(code==='FAILED_PRECONDITION')message=en?'Google’s project requirements are not met. The site administrator needs to check the project configuration.':'Googles projektvillkor är inte uppfyllda. Webbplatsens administratör behöver kontrollera projektets inställningar.';
 else if(response.status===400)message=en?'Google rejected the conversation settings. The site administrator needs to check the token request.':'Google avvisade samtalsinställningarna. Webbplatsens administratör behöver kontrollera tokenanropet.';
 else message=en?'Gemini could not start the conversation. Please try again later.':'Gemini kunde inte starta samtalet. Försök igen senare.';
 return {error:message+' (Google HTTP '+response.status+(code?' · '+code:'')+(reason?' · '+reason:'')+').',diagnostic};
}
