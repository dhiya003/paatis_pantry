import { useEffect, useMemo, useState } from "react";
import { days, dishes, pantry, tips } from "./data";

type Tab = "today" | "shop" | "plan" | "pantry";
const dish = (id:string) => dishes.find(x=>x.id===id)!;

function Recipe({id,onBack}:{id:string;onBack:()=>void}) {
  const item=dish(id);
  return <div className="focusPage">
    <button className="back" onClick={onBack}>← Back</button>
    <p className="kicker">Focused recipe</p>
    <h1>{item.name}</h1><p className="tamil">{item.tamil}</p>
    <div className="chips">{item.nutrition.map(n=><span key={n}>{n}</span>)}</div>
    <section><h2>What you need</h2>{item.ingredients.map(x=><label className="check" key={x}><input type="checkbox"/><span>{x}</span></label>)}</section>
    <section><h2>Prepare</h2><ol>{item.steps.map((x,i)=><li key={x}><b>{i+1}</b><span>{x}</span></li>)}</ol></section>
    <aside className="safety"><b>Baby safety</b><span>{item.safety}</span></aside>
  </div>;
}

export default function App(){
  const [tab,setTab]=useState<Tab>("today");
  const [day,setDay]=useState(1);
  const [recipe,setRecipe]=useState<string|null>(null);
  const [pantryOpen,setPantryOpen]=useState<number|null>(null);
  const [done,setDone]=useState<number[]>(()=>JSON.parse(localStorage.getItem("pp-done")||"[]"));
  const [shopWeek,setShopWeek]=useState(1);
  const current=days[day-1];
  useEffect(()=>localStorage.setItem("pp-done",JSON.stringify(done)),[done]);
  const shopping=useMemo(()=>{
    const keys=days.filter(d=>d.week===shopWeek).flatMap(d=>d.meals.map(m=>m[1]));
    const names=Array.from(new Set(keys.flatMap(k=>dish(k).ingredients.map(x=>x.replace(/^[\d½¼¾⅛–\s]+/,"")))));
    return names.sort();
  },[shopWeek]);

  if(recipe) return <main className="app"><Recipe id={recipe} onBack={()=>setRecipe(null)}/></main>;
  if(pantryOpen!==null){
    const p=pantry[pantryOpen];
    return <main className="app"><div className="focusPage">
      <button className="back" onClick={()=>setPantryOpen(null)}>← All pantry preparations</button>
      <p className="kicker">{p.life}</p><h1>{p.name}</h1>
      <section><h2>Ingredients</h2>{p.ingredients.map(x=><label className="check" key={x}><input type="checkbox"/><span>{x}</span></label>)}</section>
      <section><h2>Preparation</h2><ol>{p.steps.map((x,i)=><li key={x}><b>{i+1}</b><span>{x}</span></li>)}</ol></section>
      <aside className="safety"><b>Storage safety</b><span>{p.safety}</span></aside>
    </div></main>;
  }

  return <main className="app">
    <header className="top"><div><span>Paati✣s Pantry</span><small>10-month baby meal companion</small></div><button aria-label="Safety guidance">!</button></header>
    <div className="tip"><b>TIP · DAY {day}</b><span>{tips[(day-1)%tips.length]}</span></div>

    {tab==="today"&&<div className="screen">
      <div className="dayHero"><p>DAY {String(day).padStart(2,"0")} · WEEK {current.week}</p><h1>Today’s meals</h1><div className="dayNav"><button disabled={day===1} onClick={()=>setDay(day-1)}>←</button><span>{done.includes(day)?"Completed ✓":"Ready to cook"}</span><button disabled={day===90} onClick={()=>setDay(day+1)}>→</button></div></div>
      <div className="mealList">{current.meals.map(([label,id])=><button key={label} onClick={()=>setRecipe(id)}><span>{label}</span><b>{dish(id).name}</b><small>{dish(id).nutrition.join(" · ")}</small><i>›</i></button>)}</div>
      <aside className="prep"><b>Prepare tonight</b><span>Measure and soak only tomorrow’s dry grain or dal. Prepare perishables close to serving.</span></aside>
      <button className={`complete ${done.includes(day)?"done":""}`} onClick={()=>setDone(done.includes(day)?done.filter(x=>x!==day):[...done,day])}>{done.includes(day)?"✓ Day completed":"Mark day complete"}</button>
    </div>}

    {tab==="shop"&&<div className="screen"><div className="titleRow"><div><p className="kicker">Open Sunday morning</p><h1>Weekly shopping</h1></div><select value={shopWeek} onChange={e=>setShopWeek(Number(e.target.value))}>{Array.from({length:13},(_,i)=><option key={i} value={i+1}>Week {i+1}</option>)}</select></div>
      <p className="intro">Buy the smallest dry packs available. Coconut, greens, curd and egg should be bought close to the day used because there is no refrigerator.</p>
      <div className="shopping">{shopping.map(x=><label className="check" key={x}><input type="checkbox"/><span>{x}</span></label>)}</div>
    </div>}

    {tab==="plan"&&<div className="screen"><p className="kicker">{done.length} of 90 completed</p><h1>90-day plan</h1><div className="weekGrid">{Array.from({length:13},(_,w)=><button key={w} onClick={()=>{setDay(w*7+1>90?90:w*7+1);setTab("today")}}><b>Week {w+1}</b><span>{days.filter(d=>d.week===w+1&&done.includes(d.day)).length}/{days.filter(d=>d.week===w+1).length} days</span></button>)}</div></div>}

    {tab==="pantry"&&<div className="screen"><p className="kicker">No-refrigerator preparation</p><h1>Pantry recipes</h1><p className="intro">Open one preparation at a time for distraction-free cooking.</p><div className="pantryList">{pantry.map((p,i)=><button key={p.name} onClick={()=>setPantryOpen(i)}><span>0{i+1}</span><div><b>{p.name}</b><small>{p.life}</small></div><i>›</i></button>)}</div></div>}

    <nav className="bottom">{([["today","Today"],["shop","Shop"],["plan","Plan"],["pantry","Pantry"]] as [Tab,string][]).map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><span>{id==="today"?"⌂":id==="shop"?"✓":id==="plan"?"▦":"◫"}</span><b>{label}</b></button>)}</nav>
  </main>;
}
