declare global {
 interface Window {Android?:{readState():string;writeState(data:string):boolean;setReminders(data:string):boolean;notificationStatus():string;enableNotifications():void;openAlarmSettings():void;openNotificationSettings():void;testNotification():void;voiceAvailable():boolean;startListening():void;stopListening():void;speak(text:string):void;stopSpeaking():void;isSpeaking():boolean;keepAwake(value:boolean):void;exportBackup(data:string):void;importBackup():void};SpeechRecognition?:new()=>any;webkitSpeechRecognition?:new()=>any;}
}
if(window.Android){
 const native=window.Android;
 class NativeRecognition {lang='en-IN';continuous=true;interimResults=false;onresult:((e:any)=>void)|null=null;onend:(()=>void)|null=null;onerror:((e:any)=>void)|null=null;private subscribed=false;
 private listener=(event:Event)=>{const d=(event as CustomEvent).detail;if(d.kind==='result')this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:d.text}}]});if(d.kind==='end')this.onend?.();if(d.kind==='error')this.onerror?.({error:d.error});};
 start(){if(!this.subscribed){window.addEventListener('native-voice',this.listener);this.subscribed=true}native.startListening()}
 abort(){native.stopListening();if(this.subscribed){window.removeEventListener('native-voice',this.listener);this.subscribed=false}}
 }
 if(native.voiceAvailable())window.SpeechRecognition=NativeRecognition;
 let utterance:SpeechSynthesisUtterance|null=null;
 window.addEventListener('native-tts',(e:Event)=>{const d=(e as CustomEvent).detail;const u=utterance;utterance=null;if(d.kind==='error')u?.onerror?.call(u,{} as SpeechSynthesisErrorEvent);else u?.onend?.call(u,{} as SpeechSynthesisEvent)});
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{get speaking(){return native.isSpeaking()},getVoices:()=>[],cancel:()=>{utterance=null;native.stopSpeaking()},speak:(u:SpeechSynthesisUtterance)=>{utterance=u;native.speak(u.text)}}});
 if(!window.SpeechSynthesisUtterance)Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {text:string;lang='en-IN';rate=1;onend=null;onerror=null;constructor(text:string){this.text=text}}});
}
export {};
