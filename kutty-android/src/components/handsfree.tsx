import {useEffect,useState} from 'react';
import {Button} from './ui/button';
type Status={active:boolean;remainingSeconds:number;phase:string;lastReply?:string};
export function HandsFree(){
 const [status,setStatus]=useState<Status>({active:false,remainingSeconds:0,phase:'Off'});
 useEffect(()=>{const refresh=()=>{try{setStatus(JSON.parse(window.Android?.handsfreeStatus?.()??'{"active":false,"remainingSeconds":0,"phase":"Off"}'))}catch{}};refresh();const timer=setInterval(refresh,1000);return()=>clearInterval(timer)},[]);
 return <section className="panel"><h2>Hands-free cooking</h2><p>Start a 60-minute session, then say “Hey Kutty”, wait for the beep and ask your question. Works with the screen locked. Say “stop” to end the session.</p><p className="small-note">Wake words stay on this phone. After the beep, your phone’s speech service may process audio online. AI uses the same small conversation context. Review and apply proposed changes in the app.</p>{!status.active&&status.phase!=='Off'&&<p role="status">{status.phase}</p>}{status.active?<>{status.lastReply&&<p>{status.lastReply}</p>}<p role="status">{status.phase} · {Math.ceil(status.remainingSeconds/60)} minutes left</p><Button onClick={()=>window.Android?.stopHandsfree?.()}>Stop hands-free</Button></>:<Button disabled={!window.Android?.startHandsfree} onClick={()=>window.Android?.startHandsfree?.()}>Start 60-minute session</Button>}</section>;
}
