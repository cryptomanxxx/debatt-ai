import translations from './translations-en.js';
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const alternatives=Object.keys(translations).sort((a,b)=>b.length-a.length).map(escape).join('|');
// Match complete words/phrases, never replace Swedish fragments inside an English word.
const pattern=new RegExp('(?<![\\p{L}])(?:'+alternatives+')(?![\\p{L}])','gu');
export function translateEnglish(text){return String(text).replace(pattern,match=>translations[match]);}
export function setupLanguage({document:doc,window:win}){
 let language='sv';try{if(win.localStorage.getItem('friends-island-language')==='en')language='en'}catch{}
 const originals=new WeakMap(),attributes=new WeakMap(),button=doc.getElementById('language-toggle');
 const attrs=['aria-label','placeholder','title','content'];
 const excluded=node=>node.parentElement?.closest('script,style,canvas,[data-no-translate="true"]');
 function text(node){if(excluded(node))return;const prior=originals.get(node),source=prior&&node.data===prior.rendered?prior.source:node.data;const rendered=language==='en'?translateEnglish(source):source;originals.set(node,{source,rendered});if(node.data!==rendered)node.data=rendered;}
 function element(node){if(node.closest?.('script,style,canvas,[data-no-translate="true"]'))return;let records=attributes.get(node);if(!records){records={};attributes.set(node,records)}for(const attr of attrs){const value=node.getAttribute(attr);if(value===null)continue;const prior=records[attr],source=prior&&value===prior.rendered?prior.source:value,rendered=language==='en'?translateEnglish(source):source;records[attr]={source,rendered};if(value!==rendered)node.setAttribute(attr,rendered)}}
 function scan(node){if(node.nodeType===3){text(node);return}if(node.nodeType!==1&&node.nodeType!==9)return;element(node);for(const child of node.childNodes)scan(child);}
 function render(){doc.documentElement.lang=language;scan(doc.documentElement);button.textContent=language==='en'?'🌐 På svenska':'🌐 In English';button.lang=language==='en'?'sv':'en';button.title=button.disabled?(language==='en'?'End your conversation to change language.':'Avsluta samtalet för att byta språk.'):'';}
 button.setAttribute('data-no-translate','true');
 win.islandI18n={get language(){return language},translate:value=>language==='en'?translateEnglish(value):value};
 button.addEventListener('click',()=>{if(button.disabled||win.zooUI?.active?.())return;language=language==='en'?'sv':'en';try{win.localStorage.setItem('friends-island-language',language)}catch{}win.speechSynthesis?.cancel();render();win.dispatchEvent(new win.CustomEvent('island-language-change',{detail:{language}}));});
 win.addEventListener('zoo-session-state',event=>{button.disabled=Boolean(event.detail?.connected||event.detail?.connecting);button.title=button.disabled?(language==='en'?'End your conversation to change language.':'Avsluta samtalet för att byta språk.'):'';});
 const observer=new win.MutationObserver(records=>{for(const record of records){if(record.type==='characterData')text(record.target);else if(record.type==='attributes')element(record.target);else for(const node of record.addedNodes)scan(node)}});
 render();observer.observe(doc.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});
 return {get language(){return language},dispose:()=>observer.disconnect()};
}
