declare global {
 interface Window {Android?:{handsfreeStatus?():string;handsfreeSpeakNow?():void;startHandsfree?():void;stopHandsfree?():void;handsfreeReady?():void;handsfreeReply?(id:string,text:string):void;queueHandsfreeProposal?(value:string):void;assistantConfigured():boolean;configureAssistant():void;askAssistant(id:string,payload:string):void;readConversation():string;writeConversation(value:string):boolean;readState():string;writeState(data:string):boolean;setReminders(data:string):boolean;notificationStatus():string;enableNotifications():void;openAlarmSettings():void;openNotificationSettings():void;testNotification():void;voiceAvailable():boolean;startListening():void;stopListening():void;finishListening():void;speak(text:string):void;stopSpeaking():void;isSpeaking():boolean;keepAwake(value:boolean):void;exportBackup(data:string):void;importBackup():void};SpeechRecognition?:new()=>any;webkitSpeechRecognition?:new()=>any;}
}
if(window.Android){
 const native=window.Android;
 let utterance:SpeechSynthesisUtterance|null=null;
 window.addEventListener('native-tts',(e:Event)=>{const d=(e as CustomEvent).detail;const u=utterance;utterance=null;if(d.kind==='error')u?.onerror?.call(u,{} as SpeechSynthesisErrorEvent);else u?.onend?.call(u,{} as SpeechSynthesisEvent)});
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{get speaking(){return native.isSpeaking()},getVoices:()=>[],cancel:()=>{utterance=null;native.stopSpeaking()},speak:(u:SpeechSynthesisUtterance)=>{utterance=u;native.speak(u.text)}}});
 if(!window.SpeechSynthesisUtterance)Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {text:string;lang='en-IN';rate=1;onend=null;onerror=null;constructor(text:string){this.text=text}}});
}
export {};
