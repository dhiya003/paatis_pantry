package com.verve.kuttysamayal;

import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.media.*;
import android.os.*;
import android.speech.*;
import android.speech.tts.*;
import android.webkit.*;
import androidx.webkit.WebViewAssetLoader;
import org.json.*;
import java.io.*;
import java.util.*;

/** User-started, non-restarting microphone session with a strict elapsed-time deadline. */
public class HandsFreeService extends Service {
 static final String STOP="com.verve.kuttysamayal.STOP_HANDSFREE",CHANNEL="kutty_handsfree";
 static final long DURATION=60*60*1000L;
 static volatile HandsFreeService instance;
 private final Handler main=new Handler(Looper.getMainLooper());
 private WakeListener wake;private SpeechRecognizer speech;private TextToSpeech tts;private WebView web;private AssistantClient assistant;private PowerManager.WakeLock cpu;
 private boolean ended=false,ready=false,ttsReady=false;private String phase="Starting",requestId="";private long deadline;private int turn=0;
 private final Runnable expire=()->finishSession("60-minute session finished");
 private final Runnable commandTimeout=()->{if(!ended&&phase.equals("Listening")){cancelSpeech();idle();}};
 private final Runnable answerTimeout=()->{if(!ended&&phase.equals("Thinking")){requestId="";say("That took too long. Please ask again.");}};
 static boolean running(){return instance!=null&&!instance.ended;}
 static String status(){HandsFreeService s=instance;JSONObject o=new JSONObject();try{o.put("active",s!=null&&!s.ended);o.put("remainingSeconds",s==null?0:Math.max(0,(s.deadline-SystemClock.elapsedRealtime())/1000));o.put("phase",s==null?"Off":s.phase);}catch(Exception ignored){}return o.toString();}
 @Override public IBinder onBind(Intent i){return null;}
 @Override public int onStartCommand(Intent intent,int flags,int id){
  if(intent==null||STOP.equals(intent.getAction())){finishSession("Hands-free stopped");return START_NOT_STICKY;}
  if(instance==this)return START_NOT_STICKY;
  instance=this;deadline=SystemClock.elapsedRealtime()+DURATION;
  try{channel();if(Build.VERSION.SDK_INT>=29)startForeground(72,notification("Starting hands-free"),ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);else startForeground(72,notification("Starting hands-free"));
   cpu=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"Kutty:HandsFree");cpu.acquire(DURATION);main.postDelayed(expire,DURATION);
   wake=new WakeListener(this,new WakeListener.Callback(){public void keyword(String word){onKeyword(word);}public void error(){finishSession("Microphone unavailable — open Kutty to try again");}});
   tts=new TextToSpeech(this,status->{if(ended)return;ttsReady=status==TextToSpeech.SUCCESS;if(ttsReady){if(tts.setLanguage(Locale.forLanguageTag("en-IN"))<0)tts.setLanguage(Locale.ENGLISH);tts.setSpeechRate(.95f);}else finishSession("Speech output unavailable — check phone speech settings");});
   tts.setOnUtteranceProgressListener(new UtteranceProgressListener(){public void onStart(String id){}public void onDone(String id){main.post(()->{if(!ended&&id.equals(requestId)){requestId="";beginCommand();}});}public void onError(String id){main.post(()->{if(!ended)idle();});}});
   assistant=new AssistantClient(this,new AssistantClient.Callback(){public void configured(){}public void result(String id,String text,String error){event("native-assistant",json("id",id,"text",text,"error",error));}});
   startPlanner();
  }catch(Exception|LinkageError e){finishSession("Could not start hands-free — check microphone permissions");}
  return START_NOT_STICKY;
 }
 private void channel(){NotificationChannel c=new NotificationChannel(CHANNEL,"Hands-free cooking",NotificationManager.IMPORTANCE_LOW);c.setSound(null,null);getSystemService(NotificationManager.class).createNotificationChannel(c);}
 private Notification notification(String text){
  PendingIntent open=PendingIntent.getActivity(this,72,new Intent(this,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  PendingIntent stop=PendingIntent.getService(this,73,new Intent(this,HandsFreeService.class).setAction(STOP),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  return new Notification.Builder(this,CHANNEL).setSmallIcon(com.verve.kuttysamayal.R.drawable.ic_launcher).setContentTitle("Kutty hands-free · 60-minute session").setContentText(text+" · say stop to end").setContentIntent(open).setOngoing(true).setOnlyAlertOnce(true).setVisibility(Notification.VISIBILITY_PUBLIC).addAction(new Notification.Action.Builder(null,"Stop",stop).build()).build();
 }
 private void phase(String value){phase=value;if(!ended)getSystemService(NotificationManager.class).notify(72,notification(value));}
 private boolean live(){if(ended)return false;if(SystemClock.elapsedRealtime()>=deadline){finishSession("60-minute session finished");return false;}return true;}
 void onKeyword(String word){if(!live())return;String normalized=word.toLowerCase(Locale.ROOT).replace('_',' ').trim();if(normalized.equals("stop")){finishSession("Hands-free stopped");return;}if(phase.equals("Say Hey Kutty")&&ready&&normalized.equals("hey kutty"))beginCommand();}
 private void beginCommand(){if(!live()||!ready)return;phase("Listening");wake.pause(()->{if(!live()||!phase.equals("Listening"))return;
  if(!SpeechRecognizer.isRecognitionAvailable(this)){finishSession("Speech recognition unavailable");return;}
  cancelSpeech();speech=SpeechRecognizer.createSpeechRecognizer(this);speech.setRecognitionListener(new RecognitionListener(){
   public void onReadyForSpeech(Bundle b){ToneGenerator tone=new ToneGenerator(AudioManager.STREAM_MUSIC,35);tone.startTone(ToneGenerator.TONE_PROP_BEEP,100);main.postDelayed(tone::release,250);}
   public void onBeginningOfSpeech(){}public void onRmsChanged(float r){}public void onBufferReceived(byte[] b){}public void onEndOfSpeech(){}public void onEvent(int e,Bundle b){}
   public void onPartialResults(Bundle b){ArrayList<String> rows=b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);if(rows!=null&&!rows.isEmpty()&&stopCommand(rows.get(0)))finishSession("Hands-free stopped");}
   public void onError(int e){if(!ended&&phase.equals("Listening")){cancelSpeech();idle();}}
   public void onResults(Bundle b){if(!live()||!phase.equals("Listening"))return;ArrayList<String> rows=b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);cancelSpeech();if(rows==null||rows.isEmpty()){idle();return;}onCommand(rows.get(0));}
  });
  Intent i=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM).putExtra(RecognizerIntent.EXTRA_LANGUAGE,"en-IN").putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS,true).putExtra(RecognizerIntent.EXTRA_MAX_RESULTS,1);
  try{speech.startListening(i);main.postDelayed(commandTimeout,15000);}catch(Exception e){finishSession("Speech recognition could not start");}
 });}
 static boolean stopCommand(String text){return text.toLowerCase(Locale.ROOT).replaceAll("[^a-z ]","").trim().matches("(?:hey kutty )?stop(?: listening| please)?");}
 void onCommand(String text){if(!live())return;if(stopCommand(text)){finishSession("Hands-free stopped");return;}if(text.trim().isEmpty()){idle();return;}phase("Thinking");wake.start();turn++;String id=String.valueOf(turn);requestId=id;event("handsfree-command",json("text",text.substring(0,Math.min(text.length(),3000)),"id",id));main.postDelayed(answerTimeout,65000);}
 private void cancelSpeech(){main.removeCallbacks(commandTimeout);if(speech!=null){speech.cancel();speech.destroy();speech=null;}}
 private void idle(){if(!live())return;main.removeCallbacks(answerTimeout);requestId="";phase("Say Hey Kutty");wake.start();}
 private void say(String text){if(!live())return;main.removeCallbacks(answerTimeout);if(!ttsReady){idle();return;}phase("Speaking");wake.start();requestId="speech-"+(++turn);if(tts.speak(text,TextToSpeech.QUEUE_FLUSH,null,requestId)==TextToSpeech.ERROR)idle();}
 private JSONObject json(String...pairs){JSONObject o=new JSONObject();try{for(int i=0;i<pairs.length;i+=2)o.put(pairs[i],pairs[i+1]);}catch(Exception ignored){}return o;}
 private void event(String name,JSONObject body){main.post(()->{if(live()&&web!=null)web.evaluateJavascript("window.dispatchEvent(new CustomEvent("+JSONObject.quote(name)+",{detail:"+body+"}))",null);});}
 private void startPlanner(){web=new WebView(this);web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);
  WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){@Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){WebResourceResponse local=loader.shouldInterceptRequest(r.getUrl());return local!=null?local:new WebResourceResponse("text/plain","UTF-8",403,"Blocked",new HashMap<>(),new ByteArrayInputStream(new byte[0]));}@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return true;}});
  web.addJavascriptInterface(new PlannerBridge(),"Android");web.loadUrl("https://appassets.androidplatform.net/assets/handsfree.html");main.postDelayed(()->{if(!ended&&!ready)finishSession("Hands-free planner could not load");},20000);
 }
 class PlannerBridge {
  @JavascriptInterface public void queueHandsfreeProposal(String value){if(ended||value.length()>40000)return;try{JSONObject row=new JSONObject(value);android.content.SharedPreferences prefs=getSharedPreferences("assistant_chat",MODE_PRIVATE);JSONArray old=new JSONArray(prefs.getString("messages","[]"));JSONArray result=new JSONArray();for(int i=Math.max(0,old.length()-58);i<old.length();i++){JSONObject m=old.getJSONObject(i);if("pending".equals(m.optString("status")))m.put("status","expired");result.put(m);}result.put(row);prefs.edit().putString("messages",result.toString()).commit();}catch(Exception ignored){}}

  @JavascriptInterface public void handsfreeReady(){main.post(()->{if(live()){ready=true;idle();}});}
  @JavascriptInterface public void handsfreeReply(String id,String text){main.post(()->{if(live()&&phase.equals("Thinking")&&id.equals(requestId))say(text.substring(0,Math.min(text.length(),3500)));});}
  @JavascriptInterface public boolean assistantConfigured(){return assistant.configured();}
  @JavascriptInterface public void askAssistant(String id,String payload){if(!ended)assistant.ask(id,payload);}
  @JavascriptInterface public String readState(){return ReminderReceiver.prefs(HandsFreeService.this).getString("state","");}
  @JavascriptInterface public String readConversation(){return getSharedPreferences("handsfree_chat",MODE_PRIVATE).getString("messages","");}
  @JavascriptInterface public boolean writeConversation(String value){if(ended||value.length()>2000000)return false;try{new JSONArray(value);}catch(Exception e){return false;}return getSharedPreferences("handsfree_chat",MODE_PRIVATE).edit().putString("messages",value).commit();}
 }
 private void finishSession(String reason){if(ended)return;ended=true;phase="Off";main.removeCallbacksAndMessages(null);cancelSpeech();if(assistant!=null)assistant.destroy();if(wake!=null)wake.close();if(tts!=null){tts.stop();tts.shutdown();}if(cpu!=null&&cpu.isHeld())cpu.release();if(web!=null){web.removeJavascriptInterface("Android");web.destroy();web=null;}getSharedPreferences("handsfree_chat",MODE_PRIVATE).edit().clear().apply();if(instance==this)instance=null;stopForeground(STOP_FOREGROUND_REMOVE);stopSelf();}
 @Override public void onDestroy(){finishSession("Hands-free stopped");super.onDestroy();}
}
