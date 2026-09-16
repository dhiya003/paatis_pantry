import type {Recipe} from './recipes';
const normalize=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases:Record<string,string>={idly:'idli',dosa:'dosai',dosai:'dosai',pongal:'pongal',venpongal:'pongal',keeraisadam:'keerai',curdrice:'curd',thayirsadam:'curd',sambarsadam:'sambar',sambarrice:'sambar',idiyappam:'idiyappam',adai:'adai',ragidosa:'ragidosai',ragiidli:'ragiidli',ulundhusadam:'ulundhusadam',arisiparuppusadam:'arisi'};
export function parseDishNames(text:string){return text.split(/[\n,;]+/).map(n=>n.trim().replace(/^[-•]\s*/,'')).filter((n,i,all)=>n&&all.findIndex(x=>normalize(x)===normalize(n))===i)}
export function matchDish(name:string,recipes:Recipe[]){const n=normalize(name);return recipes.find(r=>normalize(r.name)===n)??recipes.find(r=>r.id===aliases[n]||normalize(r.id)===n)}
