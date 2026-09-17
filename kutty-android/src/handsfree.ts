import {localAnswer,requestConversation,readChat,storeChat,plannerSnapshot,type ChatMessage} from './lib/assistant';
import {todayIST} from './lib/recipes';
// Private service WebView. It has read-only planner access and cannot save meal changes.
let busy=false;
window.addEventListener('handsfree-command',async(e:Event)=>{
 const {text,id}=(e as CustomEvent).detail;if(busy)return;busy=true;
 try{
  const messages:ChatMessage[]=[...readChat(),{id:crypto.randomUUID(),role:'user',text}];
  const simple=text.toLowerCase().replace(/[.!?]/g,'').trim();
  if(/^(yes|yes please|confirm|apply changes|go ahead|do it)$/.test(simple)&&messages.slice(0,-1).at(-1)?.actions?.length){window.Android?.handsfreeReply?.(id,'Please open Talk to Kutty to review and apply the suggested changes.');return;}
  const snapshot=plannerSnapshot();
  const answer=localAnswer(text)??await requestConversation(messages,todayIST());
  const response:ChatMessage={id:crypto.randomUUID(),role:'assistant',text:answer.reply,actions:answer.actions,status:answer.actions.length?'pending':undefined,snapshot:answer.actions.length?snapshot:undefined};
  storeChat([...messages,response]);
  if(answer.actions.length)window.Android?.queueHandsfreeProposal?.(JSON.stringify(response));
  window.Android?.handsfreeReply?.(id,answer.reply+(answer.actions.length?' Open Talk to Kutty to review and apply these changes.':''));
 }catch(e){window.Android?.handsfreeReply?.(id,(e as Error).message)}finally{busy=false}
});
window.Android?.handsfreeReady?.();
