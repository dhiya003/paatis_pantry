import {useEffect,useRef,useState} from 'react';
import {Mic} from 'lucide-react';
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:any)=>void)|null;onend:(()=>void)|null;onerror:((e:{error:string})=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
export function useVoiceControl({onCommand}:{onCommand:(command:string)=>string}){
 const [supported,setSupported]=useState(false),[active,setActive]=useState(false),[processing,setProcessing]=useState(false),[status,setStatus]=useState('');
 const recognition=useRef<Recognition|null>(null),held=useRef(false),pending=useRef(''),accepting=useRef(false),handler=useRef(onCommand);handler.current=onCommand;
 const finish=(text:string)=>{accepting.current=false;setProcessing(false);setStatus(handler.current(text))};
 useEffect(()=>{const C=window.SpeechRecognition??window.webkitSpeechRecognition;if(!C)return;setSupported(true);const rec:Recognition=new C();recognition.current=rec;rec.lang='en-IN';rec.continuous=false;rec.interimResults=false;
 rec.onresult=e=>{if(!accepting.current)return;const text=e.results[0][0].transcript.trim();if(held.current)pending.current=text;else finish(text)};
 rec.onerror=e=>{accepting.current=false;held.current=false;setActive(false);setProcessing(false);setStatus(e.error==='not-allowed'?'Allow microphone access in Android settings.':e.error==='permission-granted'?'Microphone ready. Hold the button again to speak.':e.error==='no-speech'?'No speech heard. Hold the microphone and try again.':'Voice unavailable. Try again; your speech service may need internet.')};
 rec.onend=()=>{if(!held.current)setActive(false)};
 const cancel=()=>{held.current=false;accepting.current=false;pending.current='';rec.abort();setActive(false);setProcessing(false)};
 const hide=()=>{if(document.visibilityState!=='visible')cancel()};document.addEventListener('visibilitychange',hide);window.addEventListener('blur',cancel);
 return()=>{cancel();document.removeEventListener('visibilitychange',hide);window.removeEventListener('blur',cancel)};
 },[]);
 useEffect(()=>{if(!status)return;const timer=setTimeout(()=>setStatus(''),6500);return()=>clearTimeout(timer)},[status]);
 useEffect(()=>{if(!processing)return;const timer=setTimeout(()=>{accepting.current=false;recognition.current?.abort();setProcessing(false);setStatus('No command received. Hold the microphone to try again.')},10000);return()=>clearTimeout(timer)},[processing]);
 function start(){if(!supported){setStatus('Enable an Android speech service in phone settings.');return}if(held.current||processing)return;window.speechSynthesis?.cancel();pending.current='';held.current=true;accepting.current=true;setActive(true);setStatus('Listening… release to finish');try{recognition.current?.start()}catch{held.current=false;accepting.current=false;setActive(false);setStatus('Could not start the microphone. Try again.')}}
 function release(cancel=false){if(!held.current)return;held.current=false;setActive(false);if(cancel){accepting.current=false;pending.current='';recognition.current?.abort();setStatus('Cancelled');return}if(pending.current){finish(pending.current);pending.current='';return}setProcessing(true);setStatus('Processing…');recognition.current?.stop()}
 return <div className="voice-float">{status&&<div className="voice-toast" role="status">{status}</div>}<button className={'voice-mic '+(active?'recording':'')} type="button" aria-label="Hold to speak, release to finish" aria-pressed={active} title="Hold to speak, release to finish" onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);start()}} onPointerUp={()=>release()} onPointerCancel={()=>release(true)} onLostPointerCapture={()=>release(true)} onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();start()}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();release()}}}><Mic size={25}/></button></div>
}
