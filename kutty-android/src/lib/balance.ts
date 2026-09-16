import type {FrequencyRules} from './frequency';
import {recipes,type Recipe,type Profile,type Ingredient,menu,ingredientsFor,ageMonths,texture} from './recipes';
export function balancedDay(date:string,p:Profile,overrides:Record<string,string>,rules:FrequencyRules={},catalog:Recipe[]=recipes){
 const rows=menu(date,p,overrides,catalog,rules);const idx=((Math.floor((Date.parse(date)-Date.parse(p.anchor))/86400000)%7)+7)%7;
 const fruits=['Ripe papaya','Ripe banana','Ripe mango','Ripe pear','Ripe papaya','Ripe banana','Ripe mango'];
 const vegetables=['Carrot','Pumpkin','Spinach','Ash gourd','Carrot','Pumpkin','Spinach'];
 const additions:{meal:string,name:string,ingredients:Ingredient[],prep:string}[]=[];
 if(rows.length){
 additions.push({meal:'Morning snack',name:fruits[idx],ingredients:[{name:fruits[idx],amount:40,unit:'g'}],prep:'Wash, peel, remove seeds and mash or cut into soft manageable pieces. Steam pear if firm.'});
 additions.push({meal:'Lunch / dinner',name:vegetables[idx]+' mash',ingredients:[{name:vegetables[idx],amount:2,unit:'tbsp'},{name:'Sesame oil',amount:0.5,unit:'tsp'}].filter(i=>!(p.allergies.includes('Sesame')&&i.name==='Sesame oil')),prep:'Cook vegetables until easily mashed. Mix the oil into the cooked vegetables if tolerated.'});
 if(!p.allergies.includes('Milk')) additions.push({meal:'Afternoon snack',name:'Plain curd',ingredients:[{name:'Plain pasteurised curd',amount:3,unit:'tbsp'}],prep:'Use fresh, plain, full-fat pasteurised curd; serve without sugar.'});
 const eggDays=[0,2,5];if(eggDays.includes(idx)&&!p.allergies.includes('Egg'))additions.push({meal:'Breakfast',name:'Soft, fully cooked egg',ingredients:[{name:'Egg',amount:1,unit:'small'}],prep:'Cook until white and yolk are firm, then mash with water or dal to keep moist. Offer according to appetite.'});
 else additions.push({meal:'Breakfast',name:'Moong dal mash',ingredients:[{name:'Moong dal',amount:1,unit:'tbsp'}],prep:'Wash, cook in water until completely soft and mash; serve alongside breakfast.'});
 }
 const combined=new Map<string,Ingredient>();[...ingredientsFor(rows),...additions.flatMap(s=>s.ingredients)].forEach(i=>{const key=i.name+'|'+i.unit;combined.set(key,{...i,amount:(combined.get(key)?.amount??0)+i.amount})});
 return {date,age:ageMonths(p.dob,date),texture:texture(ageMonths(p.dob,date)),rows,additions,ingredients:[...combined.values()]};
}
export function reviewWeek(start:string,p:Profile,overrides:Record<string,string>,rules:FrequencyRules={},catalog:Recipe[]=recipes){
 const days=Array.from({length:7},(_,i)=>balancedDay(new Date(Date.parse(start+'T00:00:00Z')+i*86400000).toISOString().slice(0,10),p,overrides,rules,catalog));
 const count=(test:(name:string)=>boolean)=>days.filter(d=>d.ingredients.some(i=>test(i.name.toLowerCase()))).length;
 return [{label:'Pulse / dal days',days:count(n=>/dal|gram|chickpea/.test(n))},{label:'Fruit days',days:count(n=>/papaya|banana|mango|pear/.test(n))},{label:'Vegetable days',days:count(n=>/carrot|pumpkin|spinach|gourd/.test(n))},{label:'Curd days',days:count(n=>/curd/.test(n))},{label:'Egg days',days:count(n=>n==='egg')},{label:'Chicken / fish days',days:count(n=>/chicken|salmon/.test(n))}];
}
