'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {NativeSelect,NativeSelectOption} from '@/components/ui/native-select';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {allergens,recipeSchema} from '@/lib/catalog';
import {slots,type Recipe} from '@/lib/recipes';
export function RecipeEditor({recipe,onClose,onSave,busy,initialName='' }:{recipe:Recipe|null;onClose:()=>void;onSave:(r:Recipe)=>Promise<boolean>;busy:boolean;initialName?:string}){
 const [r,setR]=useState<Recipe>(()=>recipe?structuredClone(recipe):{id:'dish-'+crypto.randomUUID(),name:initialName,tamil:'',slot:'Breakfast',time:20,ingredients:[{name:'',amount:1,unit:'tbsp'}],steps:[''],allergens:[],note:'',source:'',prep:''});
 const [error,setError]=useState('');const [checked,setChecked]=useState(false);
 const set=<K extends keyof Recipe>(k:K,v:Recipe[K])=>setR(old=>({...old,[k]:v}));
 return <Dialog open onOpenChange={o=>!o&&!busy&&onClose()}><DialogContent className="recipe-dialog"><Button type="button" variant="ghost" disabled={busy} onClick={onClose}>← Back</Button><DialogTitle>{recipe?'Tweak this dish':'Add a family dish'}</DialogTitle><DialogDescription>Your saved version is used in meal plans and shopping lists. Family additions are not independently reviewed.</DialogDescription><form className="recipe-editor" onSubmit={async e=>{e.preventDefault();const parsed=recipeSchema.safeParse(r);if(!parsed.success){setError(parsed.error.issues[0].message);return}if(!checked){setError('Please review ingredients, allergens and texture before saving.');return}setError('');if(await onSave(parsed.data))onClose();else setError("Could not save this dish. Close this editor to see the planner’s error, or retry.")}}>
 <label>Dish name<Input required maxLength={100} value={r.name} onChange={e=>set('name',e.target.value)}/></label>
 <div className="editor-two"><label>Meal<NativeSelect disabled={!!recipe} value={r.slot} onChange={e=>set('slot',e.target.value)}>{slots.map(s=><NativeSelectOption key={s}>{s}</NativeSelectOption>)}</NativeSelect></label><label>Cooking minutes<Input type="number" min={1} max={600} value={r.time} onChange={e=>set('time',Number(e.target.value))}/></label></div>
 <h3>Ingredients · baby batch</h3>{r.ingredients.map((item,i)=><div className="ingredient-edit" key={i}><Input aria-label={'Ingredient '+(i+1)} placeholder="Ingredient" required value={item.name} onChange={e=>set('ingredients',r.ingredients.map((v,j)=>i===j?{...v,name:e.target.value}:v))}/><Input aria-label={'Amount '+(i+1)} type="number" min="0.001" step="any" required value={item.amount} onChange={e=>set('ingredients',r.ingredients.map((v,j)=>i===j?{...v,amount:Number(e.target.value)}:v))}/><Input aria-label={'Unit '+(i+1)} placeholder="g / tbsp" required value={item.unit} onChange={e=>set('ingredients',r.ingredients.map((v,j)=>i===j?{...v,unit:e.target.value}:v))}/><Button type="button" variant="ghost" disabled={r.ingredients.length===1} aria-label={'Remove ingredient '+(i+1)} onClick={()=>set('ingredients',r.ingredients.filter((_,j)=>i!==j))}>×</Button></div>)}<Button type="button" variant="outline" onClick={()=>set('ingredients',[...r.ingredients,{name:'',amount:1,unit:'tbsp'}])}>Add ingredient</Button>
 <label>Cooking steps · one per line<Textarea required rows={6} value={r.steps.join('\n')} onChange={e=>set('steps',e.target.value.split('\n'))}/></label>
 <label>Preparation ahead · optional<Textarea value={r.prep??''} placeholder="Soaking, batter preparation…" onChange={e=>set('prep',e.target.value)}/></label>
 <fieldset><legend>Allergens · check ingredients and packaging</legend><div className="editor-allergens">{allergens.map(a=><label key={a}><Checkbox checked={r.allergens.includes(a)} onCheckedChange={v=>set('allergens',v?[...r.allergens,a]:r.allergens.filter(x=>x!==a))}/>{a}</label>)}</div></fieldset>
 <label>Family notes and baby adaptations<Textarea value={r.note} onChange={e=>set('note',e.target.value)}/></label>
 <label>Recipe source · optional HTTPS link<Input type="url" value={r.source} onChange={e=>set('source',e.target.value)}/></label>
 <p className="small-note">Use soft, moist textures suited to eating skills. Avoid whole nuts, whole beans, bones and hard pieces. Ingredient changes can introduce allergens; automatic nutrition completeness is not verified.</p>
 <label className="review-check"><Checkbox checked={checked} onCheckedChange={v=>setChecked(!!v)}/>I reviewed the ingredients, allergen labels and preparation for my child.</label>
 {error&&<p role="alert" className="message error">{error}</p>}<Button type="submit" disabled={busy}>{busy?'Saving…':'Save dish'}</Button></form></DialogContent></Dialog>
}
