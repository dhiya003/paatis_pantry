import assert from 'node:assert/strict';
import {answerSchema} from '../lib/assistant-contract';
// Separate process state from the existing integration test.
const meal={type:'meal',date:'2026-09-17',slot:'Breakfast',recipeId:'pongal',frequency:null,ingredient:null,available:null};
assert(answerSchema.safeParse({reply:'Would pongal work?',actions:[meal]}).success);
assert(!answerSchema.safeParse({reply:'Saved',actions:[{...meal,recipeId:null}]}).success);
assert(!answerSchema.safeParse({reply:'Unlock',actions:[{...meal,type:'unlock'}]}).success);
assert(!answerSchema.safeParse({reply:'Hello',actions:[],unexpected:'data'}).success);
console.log('PASS assistant response contract rejects malformed and unsupported changes');
