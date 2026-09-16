import {recipes,addDays,menu,type Profile,type Recipe,type Ingredient} from './recipes';
import {balancedDay} from './balance';
import type {FrequencyRules} from './frequency';
export type KitchenState={pantry:string[];favourites:string[];locks:string[];prepDone:string[]};
export const emptyKitchen:KitchenState={pantry:[],favourites:[],locks:[],prepDone:[]};
export const namesFor=(catalog:Recipe[])=>[...new Set([...catalog.flatMap(r=>r.ingredients.map(i=>i.name)),...['Ripe papaya','Ripe banana','Ripe mango','Ripe pear','Carrot','Pumpkin','Spinach','Ash gourd','Sesame oil','Plain pasteurised curd','Egg','Moong dal']])].filter(n=>n!=='Water').sort();
export const ingredientNames=namesFor(recipes);
export type PrepTask={id:string;title:string;detail:string};
export function prepTasks(rows:ReturnType<typeof menu>):PrepTask[]{
 const tasks=new Map<string,PrepTask>();
 for(const {recipe:r} of rows){if(!r)continue;
 let task:PrepTask|undefined;
 if(['idli','dosai','uthappam'].includes(r.id))task={id:'batter-'+r.id,title:'Check your fermented batter',detail:'Have enough properly fermented, refrigerated batter ready for '+r.name+'.'};
 if(r.id==='adai')task={id:'adai-soak',title:'Soak rice and dals for adai',detail:'Allow 3–4 hours of soaking before grinding. Refrigerate if soaking overnight.'};
 if(r.id==='pasi')task={id:'gram-soak',title:'Soak green gram',detail:'Allow 6–8 hours before cooking. Refrigerate for an overnight soak; discard soaking water.'};
 if(r.id==='kondai')task={id:'chickpea-soak',title:'Soak chickpeas',detail:'Allow 8–12 hours before cooking. Refrigerate for an overnight soak; discard soaking water.'};
 if(['thinai','kuthirai'].includes(r.id))task={id:'millet-'+r.id,title:'Allow time to soak millet',detail:'Soak for 30 minutes before cooking. No overnight preparation needed.'};
 if(r.id==='ulundhu')task={id:'ulundhu-soak',title:'Allow time to soak rice and urad dal',detail:'Soak for 30 minutes before cooking.'};
 if(['chicken','fish'].includes(r.id))task={id:'thaw-'+r.id,title:'If frozen, thaw '+(r.id==='fish'?'fish':'chicken')+' in the fridge',detail:'Keep it in a covered, leakproof container. Never thaw on the kitchen counter. If already fresh, mark this done.'};
 if(r.prep)task={id:'custom-'+r.id,title:'Prepare for '+r.name,detail:r.prep};
 if(task)tasks.set(task.id,task);
 }return [...tasks.values()];
}
export function shoppingList(start:string,p:Profile,overrides:Record<string,string>,rules:FrequencyRules,catalog:Recipe[]=recipes){
 const totals=new Map<string,Ingredient>();
 for(let i=0;i<7;i++)for(const item of balancedDay(addDays(start,i),p,overrides,rules,catalog).ingredients){if(item.name==='Water')continue;const key=item.name+'|'+item.unit;totals.set(key,{...item,amount:(totals.get(key)?.amount??0)+item.amount});}
 return [...totals.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
export function stockMatch(r:Recipe,pantry:string[]){const items=r.ingredients.filter(i=>i.name!=='Water');return {have:items.filter(i=>pantry.includes(i.name)).length,total:items.length,missing:items.filter(i=>!pantry.includes(i.name)).map(i=>i.name)}}
export function suggestDay(date:string,p:Profile,overrides:Record<string,string>,rules:FrequencyRules,kitchen:KitchenState,mode:'pantry'|'busy',catalog:Recipe[]=recipes){
 const current=menu(date,p,overrides,catalog,rules);const changes:Record<string,string>={};
 const recent=new Set(Array.from({length:6},(_,i)=>menu(addDays(date,-i-1),p,overrides,catalog,rules)).flat().flatMap(m=>m.recipe?[m.recipe.id]:[]));
 for(const row of current){if(kitchen.locks.includes(date+'|'+row.slot))continue;
 // Respect specifically scheduled dishes; quick-day changes use regular recipes only.
 const currentRule=row.recipe&&rules[row.recipe.id];if(currentRule&&currentRule.startsOn<=date&&currentRule.kind!=='rotation')continue;
 const pool=catalog.filter(r=>r.slot===row.slot&&!r.allergens.some(a=>p.allergies.includes(a))&&(!rules[r.id]||rules[r.id].startsOn>date||rules[r.id].kind==='rotation'));
 const candidates=mode==='busy'?pool.filter(r=>r.time<=20&&(!['adai','pasi','kondai','thinai','kuthirai','ulundhu'].includes(r.id))):pool;
 const scored=candidates.map(r=>{const stock=stockMatch(r,kitchen.pantry);return {r,score:(mode==='pantry'?100:20)*(stock.have/(stock.total||1))-(mode==='busy'?2:0.15)*r.time-(recent.has(r.id)?8:0)}}).sort((a,b)=>b.score-a.score||a.r.id.localeCompare(b.r.id));
 const choice=scored[0]?.r;if(choice&&choice.id!==row.recipe?.id)changes[row.slot]=choice.id;
 }return changes;
}
export function familyGuide(r:Recipe){
 const isMeat=['chicken','fish'].includes(r.id);const isBatter=['idli','dosai','uthappam','adai','ragiadai'].includes(r.id);
 return [
 {title:'Start with one shared base',detail:isMeat?'Cook the mild rice, vegetables and '+(r.id==='fish'?'fish':'chicken')+' thoroughly using the recipe steps. Keep the baby portion free of chilli and whole spices.':isBatter?'Make the shared batter or dough mild. Cook the baby’s portion soft, without a hard, crisp crust.':'Cook the rice, grains, pulses or vegetables from this recipe until soft. Keep the shared base mild.'},
 {title:'Set aside the baby portion',detail:isMeat?'Check carefully for every bone and tough fibre, then set aside a small cooked portion with clean utensils.':'Set aside a small cooked portion before adding extra salt, chilli, whole tempering spices or crunchy toppings to the family dish.'},
 {title:'Finish each plate',detail:'Mash or soften the baby portion to match eating skills. Add the family’s usual seasoning to the remaining food separately. Use the recipe’s baby-batch quantities as a guide, and offer more according to appetite.'}
 ];
}
