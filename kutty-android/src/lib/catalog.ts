import {z} from 'zod';
import {recipes,type Recipe} from './recipes';
export const allergens=['Milk','Wheat','Sesame','Egg','Fish','Peanut','Tree nuts','Soy','Shellfish'] as const;
export const recipeSchema=z.object({id:z.string().regex(/^[a-z0-9-]{1,70}$/),name:z.string().trim().min(2).max(100),tamil:z.string().max(100).default(''),slot:z.enum(['Breakfast','Lunch','Snack','Dinner']),time:z.number().int().min(1).max(600),ingredients:z.array(z.object({name:z.string().trim().min(1).max(90),amount:z.number().positive().max(10000),unit:z.string().trim().min(1).max(25)})).min(1).max(40),steps:z.array(z.string().trim().min(1).max(1600)).min(1).max(30),allergens:z.array(z.enum(allergens)),note:z.string().max(1600),source:z.string().max(1000).refine(s=>!s||/^https:\/\//i.test(s)&&URL.canParse(s),'Use a valid HTTPS link'),prep:z.string().max(1600).optional(),custom:z.boolean().optional()});
export function resolveCatalog(rows:{id:string,value:string}[]){
 const saved=new Map<string,Recipe>();const removed=new Set(rows.filter(r=>r.id.startsWith('removed:')&&r.value==='true').map(r=>r.id.slice(8)));
 for(const row of rows.filter(r=>r.id.startsWith('recipe:'))){const parsed=recipeSchema.safeParse(JSON.parse(row.value));if(parsed.success)saved.set(parsed.data.id,parsed.data);}
 const all=recipes.map(r=>saved.get(r.id)??r);for(const [id,r] of saved)if(!recipes.some(x=>x.id===id))all.push(r);
 return {catalog:all.filter(r=>!removed.has(r.id)),removed:all.filter(r=>removed.has(r.id))};
}
