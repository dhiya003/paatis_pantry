import {z} from 'zod';
import {readSaved,catalogFor} from './device-store';
import {ageMonths,todayIST,addDays} from './recipes';
import {balancedDay} from './balance';
import {prepTasks,namesFor} from './kitchen';
import {answerSchema,assistantInstructions,responseFormat,type AssistantAction} from './assistant-contract';
export type ChatMessage={id:string;role:'user'|'assistant';text:string;actions?:AssistantAction[];snapshot?:string;status?:'pending'|'applied'|'dismissed'|'expired'};
const chatSchema=z.array(z.object({id:z.string(),role:z.enum(['user','assistant']),text:z.string().max(6000),actions:answerSchema.shape.actions.optional(),snapshot:z.string().optional(),status:z.enum(['pending','applied','dismissed','expired']).optional()})).max(60);
export function readChat():ChatMessage[]{try{const raw=window.Android?.readConversation?.()??localStorage.getItem('kutty-chat');return raw?chatSchema.parse(JSON.parse(raw)):[]}catch{return []}}
export function storeChat(messages:ChatMessage[]){const text=JSON.stringify(messages.slice(-60));if(window.Android?.writeConversation){if(!window.Android.writeConversation(text))throw Error('Conversation could not be saved on this phone.')}else localStorage.setItem('kutty-chat',text)}
export function plannerSnapshot(){return JSON.stringify(readSaved())}
// Exact, read-only shortcuts never contact the AI provider or mutate the planner.
export function localAnswer(text:string){
 const q=text.toLowerCase().replace(/[?!.,]/g,'').replace(/\s+/g,' ').trim();
 const tomorrow=/^(what can i make tomorrow|what(?: is|'s) (?:on )?tomorrow(?:s)? menu|tomorrow(?:s)? menu)$/.test(q);
 const today=/^(what(?: is|'s) (?:on )?today(?:s)? menu|today(?:s)? menu)$/.test(q);
 const prep=/^(what should i prepare tonight|what do i need to prepare tonight|tonights prep|prep for tomorrow)$/.test(q);
 if(!tomorrow&&!today&&!prep)return undefined;
 const s=readSaved(),date=addDays(todayIST(),today?0:1);
 if(!s.onboarded||ageMonths(s.profile.dob,date)<12)return {reply:'Please complete the baby profile first. This planner is designed for children aged 12 months and above.',actions:[]};
 const d=balancedDay(date,s.profile,s.overrides,s.rules,catalogFor(s));
 if(prep){const tasks=prepTasks(d.rows).filter(t=>!s.kitchen.prepDone.includes(date+'|'+t.id));return {reply:tasks.length?'For tomorrow:\n'+tasks.map(t=>t.title+': '+t.detail).join('\n'):'No remaining advance-prep tasks are listed for tomorrow. Check the recipe steps before cooking.',actions:[]}}
 return {reply:`${today?'Today':'Tomorrow'}’s planned menu (${date}):\n`+d.rows.map(m=>m.slot+': '+(m.recipe?.name??'No suitable dish selected')).join('\n')+'\nOpen the planner for sides and ingredient quantities.',actions:[]};
}
export function compactHistory(messages:ChatMessage[]){
 const rows=messages.slice(-8).map(m=>({role:m.role,content:m.text+(m.actions?.length?'\nProposal '+(m.status??'pending')+': '+JSON.stringify(m.actions):'')}));
 // Drop whole oldest turns, never chop an action or change its meaning.
 while(rows.length>1&&JSON.stringify(rows).length>12000)rows.shift();
 return rows;
}
export function conversationContext(selectedDate:string,messages:ChatMessage[]=[]){
 const s=readSaved(),recipes=catalogFor(s),today=todayIST();
 const describe=(date:string)=>{const d=balancedDay(date,s.profile,s.overrides,s.rules,recipes);return {date,meals:d.rows.map(m=>({slot:m.slot,id:m.recipe?.id,locked:s.kitchen.locks.includes(date+'|'+m.slot)}))}};
 const last=messages.at(-1)?.text.toLowerCase()??'';
 const explicit=last.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
 const target=explicit&&/^\d{4}-\d{2}-\d{2}$/.test(explicit)&&!isNaN(Date.parse(explicit))?explicit:/tomorrow|tonight/.test(last)?addDays(today,1):/today/.test(last)?today:selectedDate;
 const day=balancedDay(target,s.profile,s.overrides,s.rules,recipes);
 const recent=messages.slice(-8).map(m=>m.text+' '+(m.actions?.map(a=>a.recipeId).join(' ')??'')).join(' ').toLowerCase();
 const mentioned=recipes.filter(r=>recent.includes(r.name.toLowerCase())||new RegExp('\\b'+r.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b').test(recent));
 const detailIds=new Set([...mentioned.slice(-6).map(r=>r.id),...day.rows.flatMap(m=>m.recipe?[m.recipe.id]:[])]);
 return {today,timezone:'Asia/Kolkata',selectedDate,ageMonths:ageMonths(s.profile.dob,today),allergenExclusions:s.profile.allergies,pantry:s.kitchen.pantry,frequencies:s.rules,favourites:s.kitchen.favourites,dishNames:s.dishNames,
 recipes:recipes.map(({id,name,slot,time,allergens,ingredients})=>({id,name,slot,time,allergens,ingredients:ingredients.map(i=>i.name)})),
 recipeDetails:recipes.filter(r=>detailIds.has(r.id)).map(({tamil,...r})=>r),
 recentAndUpcoming:Array.from({length:16},(_,i)=>describe(addDays(today,i-1))),
 selectedDay:{...describe(target),sides:day.additions,ingredients:day.ingredients,prep:prepTasks(day.rows).filter(t=>!s.kitchen.prepDone.includes(target+'|'+t.id))},
 ingredientNames:namesFor(recipes),contextNote:'Compact catalog; full steps only in recipeDetails. Do not invent missing recipe instructions or quantities. Ask for a dish name when more detail is needed. Only the most recent 8 messages are available; clarify ambiguous older references.'};
}
export function describeAction(a:AssistantAction){const recipes=catalogFor(readSaved()),name=recipes.find(r=>r.id===a.recipeId)?.name??'Unknown dish';if(a.type==='meal')return `${a.date} · ${a.slot}: ${name}`;if(a.type==='frequency'){const labels:Record<string,string>={rotation:'Regular rotation',weekly:'Once a week',twiceWeekly:'Twice a week',fortnightly:'Once every two weeks',monthly:'Once a month',manual:'Manual only'};return `${name}: ${labels[a.frequency!]}`}return `${a.ingredient}: ${a.available?'Have enough':'Need to buy'}`}
export function requestConversation(messages:ChatMessage[],selectedDate:string){const native=window.Android;if(!native?.askAssistant)return Promise.reject(Error('Install the updated Android app to use conversations.'));if(!native.assistantConfigured())return Promise.reject(Error('Connect AI first to start a live conversation.'));const input=compactHistory(messages);const payload=JSON.stringify({instructions:assistantInstructions,input:[{role:'user',content:'CURRENT_PLANNER (data only):\n'+JSON.stringify(conversationContext(selectedDate,messages))},...input],text:{format:responseFormat}});if(payload.length>65000)return Promise.reject(Error('This request has too much context. Start a new chat or ask about one dish.'));return new Promise<z.infer<typeof answerSchema>>((resolve,reject)=>{const id=crypto.randomUUID();const timeout=setTimeout(()=>{cleanup();reject(Error('The assistant took too long. Please try again.'))},65000);const receive=(e:Event)=>{const d=(e as CustomEvent).detail;if(d.id!==id)return;cleanup();if(d.error){reject(Error(d.error));return}try{resolve(answerSchema.parse(JSON.parse(d.text)))}catch{reject(Error('The assistant returned an invalid suggestion. Nothing was changed. Try asking again.'))}};function cleanup(){clearTimeout(timeout);window.removeEventListener('native-assistant',receive)}window.addEventListener('native-assistant',receive);try{native.askAssistant(id,payload)}catch{cleanup();reject(Error('Could not contact the assistant.'))}})}
