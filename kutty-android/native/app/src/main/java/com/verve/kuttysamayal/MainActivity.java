package com.verve.kuttysamayal;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.speech.*;
import android.speech.tts.*;
import android.view.*;
import android.webkit.*;
import androidx.webkit.WebViewAssetLoader;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

public class MainActivity extends Activity {
 private AssistantClient assistant;
 private WebView web;private TextToSpeech tts;private boolean ttsReady=false,active=false,wantListening=false,cooking=false,speaking=false,micPermissionPending=false;
 private SpeechRecognizer recognizer;private String exportData="",menuDate="";private final Handler handler=new Handler(Looper.getMainLooper());
 private final String APP_URL="https://appassets.androidplatform.net/assets/index.html";
 private void event(String name,JSONObject detail){runOnUiThread(()->{if(web!=null)web.evaluateJavascript("window.dispatchEvent(new CustomEvent("+JSONObject.quote(name)+",{detail:"+detail.toString()+"}))",null);});}
 private JSONObject json(String key,Object value){JSONObject obj=new JSONObject();try{obj.put(key,value);}catch(JSONException ignored){}return obj;}
 private void message(String text){event("native-message",json("message",text));}
 private JSONObject voiceDetail(String error){JSONObject o=json("kind","error");try{o.put("error",error);}catch(JSONException ignored){}return o;}
 private void voiceError(String error){wantListening=false;event("native-voice",voiceDetail(error));}
 @Override public void onCreate(Bundle state){super.onCreate(state);if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::handleBack);ReminderReceiver.channel(this);web=new WebView(this);web.setBackgroundColor(Color.rgb(248,246,255));setContentView(web);
  web.setOnApplyWindowInsetsListener((v,insets)->{if(Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);}else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setMediaPlaybackRequiresUserGesture(false);settings.setSupportMultipleWindows(false);
  final WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){WebResourceResponse local=loader.shouldInterceptRequest(request.getUrl());if(local!=null)return local;return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",new HashMap<>(),new ByteArrayInputStream(new byte[0]));}
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if("https".equals(uri.getScheme())&&"appassets.androidplatform.net".equals(uri.getHost()))return false;if("https".equals(uri.getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(ActivityNotFoundException ignored){}return true;}
   @Override public void onPageFinished(WebView view,String url){if(!menuDate.isEmpty())event("native-menu",json("date",menuDate));}
  });
  web.setWebChromeClient(new WebChromeClient(){@Override public void onPermissionRequest(PermissionRequest request){request.deny();}});
  assistant=new AssistantClient(this,new AssistantClient.Callback(){public void result(String id,String text,String error){JSONObject d=json("id",id);try{d.put("text",text);d.put("error",error);}catch(JSONException ignored){}event("native-assistant",d);}public void configured(){event("native-ai-config",json("configured",assistant.configured()));}});
  web.addJavascriptInterface(new Bridge(),"Android");
  tts=new TextToSpeech(this,status->{ttsReady=status==TextToSpeech.SUCCESS;if(ttsReady){int available=tts.setLanguage(Locale.forLanguageTag("en-IN"));if(available<0)tts.setLanguage(Locale.ENGLISH);tts.setSpeechRate(.9f);}});
  tts.setOnUtteranceProgressListener(new UtteranceProgressListener(){public void onStart(String id){speaking=true;}public void onDone(String id){finishSpeech(false);}public void onError(String id){finishSpeech(true);}});
  menuDate=getIntent().getStringExtra("menuDate");if(menuDate==null)menuDate="";web.loadUrl(APP_URL);ReminderReceiver.scheduleNext(this);
 }
 private void finishSpeech(boolean error){runOnUiThread(()->{speaking=false;event("native-tts",json("kind",error?"error":"end"));});}
 private void screen(){if(cooking||wantListening)getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);}
 private void stopListening(){wantListening=false;if(recognizer!=null)recognizer.cancel();screen();}
 private void listen(){
  if(!active||!wantListening||speaking)return;
  if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED){micPermissionPending=true;requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},9);return;}
  if(!SpeechRecognizer.isRecognitionAvailable(this)){voiceError("speech-service-unavailable");return;}
  if(recognizer==null){recognizer=SpeechRecognizer.createSpeechRecognizer(this);recognizer.setRecognitionListener(new RecognitionListener(){
   public void onReadyForSpeech(Bundle b){}public void onBeginningOfSpeech(){}public void onRmsChanged(float rms){}public void onBufferReceived(byte[] b){}public void onEndOfSpeech(){}public void onPartialResults(Bundle b){}public void onEvent(int type,Bundle b){}
   public void onError(int error){if(!wantListening||speaking)return;voiceError(error==SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS?"not-allowed":error==SpeechRecognizer.ERROR_NO_MATCH||error==SpeechRecognizer.ERROR_SPEECH_TIMEOUT?"no-speech":"speech-service-"+error);screen();}
   public void onResults(Bundle b){if(!wantListening||speaking)return;ArrayList<String> words=b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);if(words!=null&&!words.isEmpty()){JSONObject obj=json("kind","result");try{obj.put("text",words.get(0));}catch(JSONException ignored){}event("native-voice",obj);}wantListening=false;screen();event("native-voice",json("kind","end"));}
  });}
  Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM).putExtra(RecognizerIntent.EXTRA_LANGUAGE,"en-IN").putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS,false).putExtra(RecognizerIntent.EXTRA_MAX_RESULTS,1);
  try{recognizer.startListening(intent);screen();}catch(RuntimeException e){voiceError("could-not-start");}
 }
 class Bridge {
  @JavascriptInterface public boolean assistantConfigured(){return assistant.configured();}
  @JavascriptInterface public void configureAssistant(){assistant.configure();}
  @JavascriptInterface public void askAssistant(String id,String payload){assistant.ask(id,payload);}
  @JavascriptInterface public String readConversation(){return getSharedPreferences("assistant_chat",MODE_PRIVATE).getString("messages","");}
  @JavascriptInterface public boolean writeConversation(String value){if(value.length()>2000000)return false;try{new JSONArray(value);}catch(JSONException e){return false;}return getSharedPreferences("assistant_chat",MODE_PRIVATE).edit().putString("messages",value).commit();}
  @JavascriptInterface public String readState(){return ReminderReceiver.prefs(MainActivity.this).getString("state","");}
  @JavascriptInterface public boolean writeState(String value){if(value.length()>2000000)return false;try{new JSONObject(value);}catch(JSONException e){return false;}return ReminderReceiver.prefs(MainActivity.this).edit().putString("state",value).commit();}
  @JavascriptInterface public boolean setReminders(String value){if(value.length()>4000000)return false;try{JSONArray rows=new JSONArray(value);if(rows.length()>400)return false;for(int i=0;i<rows.length();i++){JSONObject r=rows.getJSONObject(i);r.getLong("at");r.getString("date");r.getString("body");}}catch(JSONException e){return false;}boolean saved=ReminderReceiver.prefs(MainActivity.this).edit().putString("reminders",value).commit();if(saved)runOnUiThread(()->ReminderReceiver.scheduleNext(MainActivity.this));return saved;}
  @JavascriptInterface public String notificationStatus(){JSONObject result=json("enabled",ReminderReceiver.enabled(MainActivity.this));try{result.put("exact",ReminderReceiver.exact(MainActivity.this));result.put("next",ReminderReceiver.prefs(MainActivity.this).getLong("next",0));}catch(JSONException ignored){}return result.toString();}
  @JavascriptInterface public void enableNotifications(){runOnUiThread(()->{ReminderReceiver.prefs(MainActivity.this).edit().putBoolean("enabled",true).apply();if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},10);else if(!getSystemService(NotificationManager.class).areNotificationsEnabled())openNotificationSettings();ReminderReceiver.scheduleNext(MainActivity.this);});}
  @JavascriptInterface public void openAlarmSettings(){runOnUiThread(()->{try{if(Build.VERSION.SDK_INT>=31&&!ReminderReceiver.exact(MainActivity.this))startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:"+getPackageName())));else message("Precise reminders are already allowed.");}catch(ActivityNotFoundException e){message("Open Android Settings → Apps → Special access → Alarms and reminders.");}});}
  @JavascriptInterface public void openNotificationSettings(){runOnUiThread(()->startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName())));}
  @JavascriptInterface public void testNotification(){runOnUiThread(()->{if(!getSystemService(NotificationManager.class).areNotificationsEnabled()){message("Enable notifications first.");return;}ReminderReceiver.show(MainActivity.this,LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(1).toString(),true);message("Test notification sent. Pull down your notification shade.");});}
  @JavascriptInterface public boolean voiceAvailable(){return SpeechRecognizer.isRecognitionAvailable(MainActivity.this);}
  @JavascriptInterface public void startListening(){runOnUiThread(()->{wantListening=true;listen();});}
  @JavascriptInterface public void finishListening(){runOnUiThread(()->{if(micPermissionPending){wantListening=false;return;}if(recognizer!=null&&wantListening)recognizer.stopListening();});}
  @JavascriptInterface public void stopListening(){runOnUiThread(MainActivity.this::stopListening);}
  @JavascriptInterface public boolean isSpeaking(){return speaking;}
  @JavascriptInterface public void speak(String text){runOnUiThread(()->{if(!active)return;if(!ttsReady){event("native-tts",json("kind","error"));return;}if(recognizer!=null)recognizer.cancel();speaking=true;int result=tts.speak(text,TextToSpeech.QUEUE_FLUSH,null,"recipe");if(result==TextToSpeech.ERROR)finishSpeech(true);});}
  @JavascriptInterface public void stopSpeaking(){runOnUiThread(()->{speaking=false;if(tts!=null)tts.stop();});}
  @JavascriptInterface public void keepAwake(boolean value){runOnUiThread(()->{cooking=value;screen();});}
  @JavascriptInterface public void exportBackup(String data){runOnUiThread(()->{if(data.length()>2000000){message("Backup too large.");return;}exportData=data;Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE,"kutty-samayal-backup.json");startActivityForResult(save,20);});}
  @JavascriptInterface public void importBackup(){runOnUiThread(()->startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE),21));}
 }
 
 @Override protected void onResume(){super.onResume();active=true;if(web!=null)event("native-resume",new JSONObject());ReminderReceiver.scheduleNext(this);}
 @Override protected void onPause(){active=false;if(!micPermissionPending)stopListening();if(tts!=null)tts.stop();speaking=false;if(!micPermissionPending)event("native-voice",voiceDetail("app-in-background"));super.onPause();}
 @Override protected void onNewIntent(Intent i){super.onNewIntent(i);setIntent(i);menuDate=i.getStringExtra("menuDate");if(menuDate!=null)event("native-menu",json("date",menuDate));}
 @Override public void onRequestPermissionsResult(int request,String[] names,int[] grants){super.onRequestPermissionsResult(request,names,grants);if(request==9){micPermissionPending=false;if(grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED){wantListening=false;event("native-voice",voiceDetail("permission-granted"));}else voiceError("not-allowed");}if(request==10){ReminderReceiver.scheduleNext(this);event("native-resume",new JSONObject());}}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(result!=RESULT_OK||data==null||data.getData()==null)return;try{if(request==20){try(OutputStream out=getContentResolver().openOutputStream(data.getData())){if(out==null)throw new IOException();out.write(exportData.getBytes(StandardCharsets.UTF_8));}exportData="";message("Backup saved.");}if(request==21){try(InputStream in=getContentResolver().openInputStream(data.getData());ByteArrayOutputStream out=new ByteArrayOutputStream()){if(in==null)throw new IOException();byte[] buffer=new byte[8192];int n,total=0;while((n=in.read(buffer))!=-1){total+=n;if(total>2000000)throw new IOException("Backup too large");out.write(buffer,0,n);}event("native-import",json("text",out.toString("UTF-8")));}}}catch(Exception e){event("native-import",json("error","Could not read or save the backup file."));}}
 private void handleBack(){web.evaluateJavascript("(()=>{const e=new Event('native-back',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented})()",v->{if(!"true".equals(v))finish();});}
 @Override public void onBackPressed(){handleBack();}
 @Override protected void onDestroy(){if(assistant!=null)assistant.destroy();if(recognizer!=null)recognizer.destroy();if(tts!=null)tts.shutdown();if(web!=null){web.removeJavascriptInterface("Android");web.destroy();web=null;}super.onDestroy();}
}
