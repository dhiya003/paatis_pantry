import {z} from 'zod';
import {defaultProfile,recipes as defaults,slots,todayIST,addDays,ageMonths,type Recipe} from './recipes';
import {allergens,recipeSchema} from './catalog';
import {validateFrequencies} from './frequency';
import {emptyKitchen,namesFor,suggestDay,prepTasks} from './kitchen';
import {balancedDay} from './balance';
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>Number.isFinite(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s);
const schema=z.object({version:z.literal(1),onboarded:z.boolean(),profile:z.object({name:z.string().trim().min(1).max(60),dob:date,anchor:date,allergies:z.array(z.enum(allergens))}),rules:z.record(z.object({kind:z.enum(['rotation','weekly','twiceWeekly','fortnightly','monthly','manual']),startsOn:date})),overrides:z.record(z.string()),kitchen:z.object({pantry:z.array(z.string()),favourites:z.array(z.string()),locks:z.array(z.string()),prepDone:z.array(z.string())}),changes:z.record(recipeSchema),removedIds:z.array(z.string()),dishNames:z.array(z.string().trim().min(2).max(100)).max(200).default([])});
export type Saved=z.infer<typeof schema>;
const blank=():Saved=>({version:1,onboarded:false,profile:{...defaultProfile,allergies:[],anchor:todayIST()},rules:{},overrides:{},kitchen:structuredClone(emptyKitchen),changes:{},removedIds:[],dishNames:[]});
const key='kutty-samayal-v1';
export function readSaved():Saved{const raw=window.Android?.readState()??localStorage.getItem(key);if(!raw)return blank();const result=schema.safeParse(JSON.parse(raw));if(!result.success)throw Error('Your saved data could not be read. Import a valid backup from My phone.');return result.data}
export function catalogFor(s:Saved){const catalog=defaults.map(r=>s.changes[r.id]??r);for(const r of Object.values(s.changes))if(!defaults.some(x=>x.id===r.id))catalog.push(r);return catalog.filter(r=>!s.removedIds.includes(r.id))}
function expose(s:Saved){const all={...s,removedIds:[]};return {profile:s.profile,rules:s.rules,overrides:s.overrides,kitchen:s.kitchen,recipes:catalogFor(s),removed:catalogFor(all).filter(r=>s.removedIds.includes(r.id)),onboarded:s.onboarded,dishNames:s.dishNames}}
export function persist(s:Saved){const checked=schema.parse(s);const text=JSON.stringify(checked);if(text.length>2000000)throw Error('The recipe collection is too large to save.');if(window.Android){if(!window.Android.writeState(text))throw Error('Your phone could not save these changes. Please check free space.')}else localStorage.setItem(key,text);refreshReminders(checked);return checked}
export function refreshReminders(s=readSaved()){
 if(!window.Android)return;if(!s.onboarded){window.Android.setReminders('[]');return}
 const catalog=catalogFor(s);const today=todayIST();const notices=[];
 for(let n=0;n<370;n++){
 const evening=addDays(today,n),tomorrow=addDays(evening,1);const when=Date.parse(evening+'T18:00:00+05:30');if(when<=Date.now())continue;
 const day=balancedDay(tomorrow,s.profile,s.overrides,s.rules,catalog);if(!day.rows.length)continue;
 const meals=day.rows.map(m=>m.slot+': '+(m.recipe?.name??'Choose a suitable dish')).join('\n');
 const items=day.ingredients.filter(i=>i.name!=='Water');const format=(i:typeof items[number])=>`${Number(i.amount.toFixed(3))} ${i.unit} ${i.name}`;
 const missing=items.filter(i=>!s.kitchen.pantry.includes(i.name)).map(format).join('\n');const have=items.filter(i=>s.kitchen.pantry.includes(i.name)).map(format).join('\n');
 const prep=prepTasks(day.rows).filter(t=>!s.kitchen.prepDone.includes(tomorrow+'|'+t.id)).map(t=>t.title+': '+t.detail).join('\n');
 notices.push({at:when,date:tomorrow,title:'Tomorrow’s menu · '+tomorrow,body:meals+'\n\nSides: '+day.additions.map(a=>a.name).join(', ')+'\n\nIngredients to check:\n'+(missing||'All marked available')+(have?'\n\nMarked available (verify amounts):\n'+have:'')+'\n\nPrepare tonight:\n'+(prep||'No advance preparation left.')+'\n\nOpen the app for portions, texture and full steps.'});
 }
 if(!window.Android.setReminders(JSON.stringify(notices)))throw Error('Meals are saved, but phone reminders could not be refreshed. Open My phone and retry.');
}
export function exportBackup(){return JSON.stringify(readSaved(),null,2)}
export function importBackup(text:string){if(text.length>2000000)throw Error('Backup is too large.');const parsed=schema.parse(JSON.parse(text));for(const [id,r] of Object.entries(parsed.changes))if(id!==r.id)throw Error('Invalid recipe ID in backup.');if(parsed.profile.dob>todayIST())throw Error('Birth date cannot be in the future.');persist(parsed)}
export async function localRequest(method:'GET'|'POST',body?:Record<string,any>){try{let s=readSaved();let message='Saved on this phone';if(method==='POST'){
 if(!body)throw Error('Missing change');const catalog=catalogFor(s);
 switch(body.type){
 case 'dishNames':{const names=schema.shape.dishNames.parse(body.names);s.dishNames=names.filter((n,i)=>names.findIndex(x=>x.toLowerCase()===n.toLowerCase())===i);message='Your dish list is saved';break;}
 case 'profile':s.profile={...s.profile,...schema.shape.profile.omit({anchor:true}).parse(body.profile)};if(s.profile.dob>todayIST())throw Error('Birth date cannot be in the future.');s.onboarded=true;break;
 case 'override':{date.parse(body.date);if(!slots.includes(body.slot))throw Error('Invalid meal');const key=body.date+'|'+body.slot;if(s.kitchen.locks.includes(key))throw Error('Unlock this meal first.');if(body.recipeId){const r=catalog.find(r=>r.id===body.recipeId&&r.slot===body.slot);if(!r||r.allergens.some(a=>s.profile.allergies.includes(a as any)))throw Error('Choose a suitable dish.');s.overrides[key]=r.id}else delete s.overrides[key];break;}
 case 'frequency':{if(!catalog.some(r=>r.id===body.recipeId))throw Error('Dish not found');const kind=schema.shape.rules.valueSchema.shape.kind.parse(body.kind);if(kind==='rotation')delete s.rules[body.recipeId];else s.rules[body.recipeId]={kind,startsOn:todayIST()};const issue=validateFrequencies(todayIST(),s.profile,catalog,s.rules);if(issue)throw Error(issue);break;}
 case 'flag':{const names={pantry:'pantry',favourite:'favourites',prep:'prepDone'} as const;const kind=body.kind as keyof typeof names;const prop=names[kind];if(!prop)throw Error('Invalid change');const valid=kind==='pantry'?namesFor(catalog).includes(body.key):kind==='favourite'?catalog.some(r=>r.id===body.key):/^\d{4}-\d{2}-\d{2}\|[a-z0-9-]+$/.test(body.key);if(!valid)throw Error('Item not found');s.kitchen[prop]=s.kitchen[prop].filter(k=>k!==body.key);if(body.checked)s.kitchen[prop].push(body.key);break;}
 case 'lock':{date.parse(body.date);const key=body.date+'|'+body.slot;const r=catalog.find(r=>r.id===body.recipeId&&r.slot===body.slot);if(!r||body.locked&&r.allergens.some(a=>s.profile.allergies.includes(a as any)))throw Error('Choose a suitable dish');if(body.locked){if(s.kitchen.locks.includes(key)&&s.overrides[key]!==r.id)throw Error('Unlock the meal first.');s.overrides[key]=r.id;if(!s.kitchen.locks.includes(key))s.kitchen.locks.push(key)}else s.kitchen.locks=s.kitchen.locks.filter(k=>k!==key);break;}
 case 'plan':{date.parse(body.date);if(!['busy','pantry'].includes(body.mode))throw Error('Invalid plan');if(body.mode==='pantry'&&!s.kitchen.pantry.length)throw Error('Check ingredients in My pantry first.');const changes=suggestDay(body.date,s.profile,s.overrides,s.rules,s.kitchen,body.mode,catalog);for(const [slot,id] of Object.entries(changes))s.overrides[body.date+'|'+slot]=id;message=Object.keys(changes).length?'Meals updated. Locks and scheduled dishes were kept.':'Your current menu already fits, or remaining meals are locked or scheduled.';break;}
 case 'recipeSave':case 'recipeRemove':{const id=body.type==='recipeSave'?body.recipe.id:body.recipeId;const existing=catalogFor({...s,removedIds:[]}).find(r=>r.id===id);if(body.type==='recipeSave'){const r=recipeSchema.parse(body.recipe);if(existing&&existing.slot!==r.slot)throw Error('Add a separate dish to use another meal category.');s.changes[id]={...r,custom:true};s.removedIds=s.removedIds.filter(x=>x!==id)}else{if(!existing)throw Error('Dish not found');if(body.removed){s.removedIds=[...new Set([...s.removedIds,id])];delete s.rules[id];s.kitchen.favourites=s.kitchen.favourites.filter(x=>x!==id);for(const [k,v] of Object.entries(s.overrides))if(v===id){delete s.overrides[k];s.kitchen.locks=s.kitchen.locks.filter(x=>x!==k)}}else s.removedIds=s.removedIds.filter(x=>x!==id)}const issue=validateFrequencies(todayIST(),s.profile,catalogFor(s),s.rules);if(issue)throw Error(issue);break;}
 default:throw Error('Unsupported change');
 }s=persist(s);return Response.json({ok:true,message});}
 return Response.json(expose(s));
 }catch(e){return Response.json({error:e instanceof z.ZodError?'Please check the entered details.':(e as Error).message},{status:400})}}
