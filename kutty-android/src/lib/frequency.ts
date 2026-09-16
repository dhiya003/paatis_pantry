import type {Profile,Recipe} from './recipes';
export const frequencyOptions=[['rotation','Regular rotation'],['weekly','Once a week'],['twiceWeekly','Twice a week'],['fortnightly','Every two weeks'],['monthly','Once a month'],['manual','Only when I choose']] as const;
export type Frequency=typeof frequencyOptions[number][0];
export type FrequencyRule={kind:Frequency;startsOn:string};
export type FrequencyRules=Record<string,FrequencyRule>;
const dayMs=86400000;
const stamp=(date:string)=>Date.parse(date+'T00:00:00Z');
const iso=(time:number)=>new Date(time).toISOString().slice(0,10);
export function frequencyLabel(kind:Frequency='rotation'){return frequencyOptions.find(x=>x[0]===kind)?.[1]??'Regular rotation'}
export function periodFor(date:string,rule:FrequencyRule){
 const time=stamp(date),d=new Date(time);let start=time,end=time,limit=1;
 if(rule.kind==='weekly'||rule.kind==='twiceWeekly'){start=time-((d.getUTCDay()+6)%7)*dayMs;end=start+6*dayMs;limit=rule.kind==='twiceWeekly'?2:1;}
 else if(rule.kind==='fortnightly'){start=stamp(rule.startsOn)+Math.floor((time-stamp(rule.startsOn))/(14*dayMs))*14*dayMs;end=start+13*dayMs;}
 else if(rule.kind==='monthly'){start=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1);end=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0);}
 return {start:iso(start),end:iso(end),limit};
}
export type PlannedMeal={slot:string;recipe:Recipe|undefined;overridden:boolean;frequency:Frequency};
// Shared by the UI and the reminder. Fixed-frequency recipes leave the regular pool
// after their quota is reached. Date-specific overrides remain explicit exceptions.
export function scheduleThrough(end:string,p:Profile,overrides:Record<string,string>,catalog:Recipe[],rules:FrequencyRules){
 const result:Record<string,PlannedMeal[]>={};const last=new Map<string,number>();const counts=new Map<string,number>();
 const allSlots=['Breakfast','Lunch','Snack','Dinner'];
 const start=[p.anchor,...Object.values(rules).map(r=>r.startsOn)].sort()[0];
 for(let time=stamp(start);time<=stamp(end);time+=dayMs){const date=iso(time);result[date]=[];
 for(const slot of allSlots){
 const pool=catalog.filter(r=>r.slot===slot&&!r.allergens.some(a=>p.allergies.includes(a)));
 const options=pool.map((recipe,position)=>{
 const saved=rules[recipe.id];const rule=saved&&saved.startsOn<=date?saved:undefined;const kind=rule?.kind??'rotation';
 const period=rule&&kind!=='rotation'&&kind!=='manual'?periodFor(date,rule):undefined;
 const key=period?recipe.id+'|'+period.start:'';
 return {recipe,position,kind,period,key,remaining:period?Math.max(0,period.limit-(counts.get(key)??0)):0,last:last.get(recipe.id)??-Infinity};});
 const chosen=overrides[date+'|'+slot];const manual=chosen?options.find(o=>o.recipe.id===chosen):undefined;
 const eligible=options.filter(o=>o.kind!=='manual'&&(!o.period||o.remaining>0));
 const required=eligible.filter(o=>!!o.period);const deadlines=[...new Set(required.map(o=>o.period!.end))].sort();
 let urgent=required.filter(()=>false);
 for(const deadline of deadlines){const due=required.filter(o=>o.period!.end<=deadline);const left=due.reduce((n,o)=>n+o.remaining,0);if(left>=Math.floor((stamp(deadline)-time)/dayMs)+1){urgent=due;break;}}
 const priority=(urgent.length?urgent:eligible).slice().sort((a,b)=>urgent.length?(a.period!.end.localeCompare(b.period!.end)||a.last-b.last||a.position-b.position):(a.last-b.last||a.position-b.position));
 const selected=manual??priority[0];if(selected){last.set(selected.recipe.id,time);if(selected.period)counts.set(selected.key,(counts.get(selected.key)??0)+1);}
 result[date].push({slot,recipe:selected?.recipe,overridden:!!manual,frequency:selected?.kind??'rotation'});
 }}return result;
}
export function validateFrequencies(from:string,p:Profile,catalog:Recipe[],rules:FrequencyRules){
 // Validate automatic scheduling separately from the user's intentional one-day overrides.
 const end=iso(stamp(from)+399*dayMs);const schedule=scheduleThrough(end,p,{},catalog,rules);
 for(let time=stamp(from);time<=stamp(end);time+=dayMs){const date=iso(time);for(const meal of schedule[date]){if(!meal.recipe)return `These limits leave ${meal.slot.toLowerCase()} empty on ${date}. Keep at least one suitable dish in regular rotation.`;}
 for(const [id,rule] of Object.entries(rules)){if(rule.kind==='rotation'||rule.kind==='manual'||rule.startsOn>date)continue;const recipe=catalog.find(r=>r.id===id);if(!recipe||recipe.allergens.some(a=>p.allergies.includes(a)))continue;const period=periodFor(date,rule);if(period.end!==date||period.start<from||period.start<rule.startsOn)continue;
 let count=0;for(let t=stamp(period.start);t<=time;t+=dayMs)if(schedule[iso(t)]?.some(m=>m.recipe?.id===id))count++;
 if(count<period.limit)return `There are too many scheduled dishes for ${recipe.slot.toLowerCase()} in the period ending ${date}. Reduce a frequency or keep this dish in regular rotation.`;
 }}return null;
}
