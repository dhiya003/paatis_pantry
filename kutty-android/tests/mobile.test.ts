import assert from 'node:assert/strict';
import {localRequest,readSaved,catalogFor,exportBackup,importBackup} from '../lib/device-store';
import {parseDishNames,matchDish} from '../lib/dish-names';
import {recipeSchema} from '../lib/catalog';
import {balancedDay} from '../lib/balance';
let storage='',reminders:any[]=[];
(globalThis as any).window={Android:{readState:()=>storage,writeState:(s:string)=>{storage=s;return true},setReminders:(s:string)=>{reminders=JSON.parse(s);return true}}};
async function change(body:any){const response=await localRequest('POST',body);const json=await response.json();assert.equal(response.status,200,json.error);return json;}
async function main(){
 await change({type:'profile',profile:{name:'Test baby',dob:'2024-01-01',allergies:[]}});
 assert(readSaved().onboarded);assert(reminders.length>=369);const n=reminders[0];assert.equal(new Date(n.at).toISOString().slice(11,16),'12:30');assert.equal(n.date,new Date(n.at+86400000).toISOString().slice(0,10));assert(n.body.includes('Ingredients to check:'));
 const date=n.date;await change({type:'lock',date,slot:'Breakfast',recipeId:'idli',locked:true});await change({type:'plan',date,mode:'busy'});assert.equal(readSaved().overrides[date+'|Breakfast'],'idli');
 const r={...catalogFor(readSaved()).find(r=>r.id==='idli')!,name:'Test idli',ingredients:[{name:'Test ingredient',amount:3,unit:'tbsp'}]};await change({type:'recipeSave',recipe:r});assert(reminders.find(r=>r.date===date).body.includes('3 tbsp Test ingredient'));
 await change({type:'recipeRemove',recipeId:'idli',removed:true});assert(!catalogFor(readSaved()).some(r=>r.id==='idli'));assert(!readSaved().kitchen.locks.includes(date+'|Breakfast'));
 await change({type:'recipeRemove',recipeId:'idli',removed:false});assert.equal(catalogFor(readSaved()).find(r=>r.id==='idli')?.name,'Test idli');
 const backup=exportBackup();await change({type:'flag',kind:'pantry',key:'Rice',checked:true});importBackup(backup);assert(!readSaved().kitchen.pantry.includes('Rice'));
 const before=storage;const bad=await localRequest('POST',{type:'recipeSave',recipe:{...r,source:'javascript:bad'}});assert.equal(bad.status,400);assert.equal(storage,before);
 const old=JSON.parse(backup);delete old.dishNames;importBackup(JSON.stringify(old));assert.deepEqual(readSaved().dishNames,[]);
 const names=parseDishNames('Idli, Idli\nKeerai sadam; Family special');assert.deepEqual(names,['Idli','Keerai sadam','Family special']);
 await change({type:'dishNames',names});assert.deepEqual(readSaved().dishNames,names);assert.equal(matchDish('Keerai sadam',catalogFor(readSaved()))?.id,'keerai');assert.equal(matchDish('Family special',catalogFor(readSaved())),undefined);
 importBackup(exportBackup());assert.deepEqual(readSaved().dishNames,names);
 assert.equal(catalogFor(readSaved()).length,40);for(const r of catalogFor(readSaved()))assert(recipeSchema.safeParse(r).success,r.name);
 const empty={date:null,slot:null,recipeId:null,frequency:null,ingredient:null,available:null};
 const proposed=[{...empty,type:'meal',date,slot:'Breakfast',recipeId:'pongal'}];
 const initialSnapshot=JSON.stringify(readSaved());
 await change({type:'assistantApply',snapshot:initialSnapshot,actions:proposed});assert.equal(readSaved().overrides[date+'|Breakfast'],'pongal');
 const afterApplied=storage;assert.equal((await localRequest('POST',{type:'assistantApply',snapshot:initialSnapshot,actions:proposed})).status,400);assert.equal(storage,afterApplied);
 await change({type:'lock',date,slot:'Breakfast',recipeId:'pongal',locked:true});const locked=storage;
 assert.equal((await localRequest('POST',{type:'assistantApply',snapshot:JSON.stringify(readSaved()),actions:[{...empty,type:'pantry',ingredient:'Rice',available:true},...proposed]})).status,400);assert.equal(storage,locked,'Batch must be atomic when a later change is blocked');
 await change({type:'lock',date,slot:'Breakfast',recipeId:'pongal',locked:false});
 await change({type:'profile',profile:{name:'Test baby',dob:'2024-01-01',allergies:['Milk']}});const allergic=storage;
 assert.equal((await localRequest('POST',{type:'assistantApply',snapshot:JSON.stringify(readSaved()),actions:proposed})).status,400);assert.equal(storage,allergic);
 const state=readSaved();assert(balancedDay(date,state.profile,state.overrides,state.rules,catalogFor(state)).rows.length===4);
 console.log('PASS offline persistence, IST reminder dates, ingredients, locks, custom recipes, remove/restore and backup import');
}
main().catch(e=>{console.error(e);process.exitCode=1});
