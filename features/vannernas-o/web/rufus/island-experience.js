export const QUEST_STEPS={
 1:{id:'robot',text:'Roboten vill bygga ett vattenhjul åt Doris. Börja i Uppfinnarverkstaden.'},
 2:{id:'duck',text:'Fråga Doris vad som är viktigt vid dammen. Vad ska bygget ta hänsyn till?'},
 3:{id:'owl',text:'Ugglan hjälper er tänka efter. Hur bör hjulet röra sig vid en lugn damm?'},
 4:{id:'robot',text:'Ta med råden tillbaka till Roboten. Nu kan ni bygga vattenhjulet.'},
 5:{id:'duck',text:'Klart! Ni har byggt ett långsamt vattenhjul. Besök Doris och se det vid dammen.'}
};
export function createIslandQuest(){let stage=0;return {get stage(){return stage},start(){stage=1},reset(){stage=0},answer(value){const correct={1:'help',2:'calm',3:'slow',4:'build'};if(correct[stage]!==value)return false;stage++;return true;}}}

export function setupIslandExperience({document:doc,window:win,onTravel,onComplete}){
 const $=id=>doc.getElementById(id),shell=$('world-shell'),quest=createIslandQuest();let current=null,locked=false,expanded=false;
 function syncFullscreen(value){expanded=value;doc.body.dataset.worldFullscreen=value?'true':'false';doc.body.style.overflow=value?'hidden':'';$('world-fullscreen').textContent=value?'⤢ Avsluta helskärm':'⛶ Helskärm';$('world-fullscreen').setAttribute('aria-pressed',String(value));}
 $('world-fullscreen').addEventListener('click',async()=>{if(expanded){if(doc.fullscreenElement)await doc.exitFullscreen().catch(()=>{});syncFullscreen(false);}else{if(shell.requestFullscreen)try{await shell.requestFullscreen()}catch{}syncFullscreen(true);}});
 doc.addEventListener('fullscreenchange',()=>syncFullscreen(Boolean(doc.fullscreenElement)));
 doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded&&!doc.fullscreenElement)syncFullscreen(false)});
 function renderQuest(){
  const step=QUEST_STEPS[quest.stage];$('quest-body').hidden=!step;$('quest-start').hidden=Boolean(step);$('quest-reset').hidden=!step;$('quest-start').disabled=locked;$('quest-reset').disabled=locked;$('quest-choices').replaceChildren();if(!step)return;
  $('quest-progress').textContent=quest.stage===5?'Äventyret är klart':'Steg '+quest.stage+' av 4';$('quest-text').textContent=step.text;$('quest-travel').textContent='Besök '+({robot:'Roboten',duck:'Doris',owl:'Ugglan'}[step.id]);$('quest-travel').disabled=locked;
  if(current!==step.id||quest.stage===5)return;
  const choices={1:[['help','Jag hjälper gärna till']],2:[['calm','Lugnt vatten och plats för näckrosorna'],['waves','Så stora vågor som möjligt']],3:[['slow','Långsamt och stilla'],['fast','Så snabbt som möjligt']],4:[['build','Bygg vattenhjulet']]};
  for(const [value,label] of choices[quest.stage]){const button=doc.createElement('button');button.type='button';button.className='secondary';button.textContent=label;button.disabled=locked;button.addEventListener('click',()=>{if(locked)return;if(quest.answer(value)){$('quest-feedback').textContent='';if(quest.stage===5)onComplete(true);renderQuest();}else $('quest-feedback').textContent='Tänk på att Doris vill ha en lugn damm där näckrosorna trivs. Prova igen.';});$('quest-choices').append(button);}
 }
 $('quest-start').addEventListener('click',()=>{if(locked)return;quest.start();onComplete(false);renderQuest();onTravel('robot')});
 $('quest-travel').addEventListener('click',()=>{if(!locked&&QUEST_STEPS[quest.stage])onTravel(QUEST_STEPS[quest.stage].id)});
 $('quest-reset').addEventListener('click',()=>{if(locked)return;quest.reset();onComplete(false);$('quest-feedback').textContent='';renderQuest()});
 win.addEventListener('zoo-quest-spoken',e=>{
  const detail=e.detail,step=QUEST_STEPS[quest.stage];
  // Model tools cannot skip stages, affect another friend, or replay a stale completion.
  if(!detail||detail.stage!==quest.stage||detail.animal!==step?.id||current!==step.id||quest.stage>4||doc.hidden)return;
  if(quest.answer({1:'help',2:'calm',3:'slow',4:'build'}[quest.stage])){
   if(quest.stage===5)onComplete(true);renderQuest();
   $('quest-feedback').textContent=quest.stage===5?'Vattenhjulet är klart! Besök Doris när samtalet är avslutat.':'Nästa steg är redo. Avsluta samtalet och tryck på besöksknappen för att gå vidare.';
  }
 });
 win.zooAdventure={stage:()=>quest.stage};renderQuest();
 return {visit(id){current=id;renderQuest()},session(active){if(locked===Boolean(active))return;locked=Boolean(active);renderQuest()},get quest(){return quest}};
}
