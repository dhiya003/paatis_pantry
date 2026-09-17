package com.verve.kuttysamayal;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
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
 private WebView web;private TextToSpeech tts;private boolean ttsReady=false,active=false,cooking=false,speaking=false;
 private String exportData="",menuDate="";private final Handler handler=new Handler(Looper.getMainLooper());
 private final String APP_URL="https://appassets.androidplatform.net/assets/index.html";
 private void event(String name,JSONObject detail){runOnUiThread(()->{if(web!=null)web.evaluateJavascript("window.dispatchEvent(new CustomEvent("+JSONObject.quote(name)+",{detail:"+detail.toString()+"}))",null);});}
 private JSONObject json(String key,Object value){JSONObject obj=new JSONObject();try{obj.put(key,value);}catch(JSONException ignored){}return obj;}
 private void message(String text){event("native-message",json("message",text));}
 @Override public void onCreate(Bundle state){super.onCreate(state);RemovedVoice.cleanup(this);if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::handleBack);ReminderReceiver.channel(this);web=new WebView(this);web.setBackgroundColor(Color.rgb(248,246,255));setContentView(web);
  web.setOnApplyWindowInsetsListener((v,insets)->{if(Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);}else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setMediaPlaybackRequiresUserGesture(false);settings.setSupportMultipleWindows(false);
  final WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){WebResourceResponse local=loader.shouldInterceptRequest(request.getUrl());if(local!=null)return local;return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",new HashMap<>(),new ByteArrayInputStream(new byte[0]));}
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if("https".equals(uri.getScheme())&&"appassets.androidplatform.net".equals(uri.getHost()))return false;if("https".equals(uri.getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(ActivityNotFoundException ignored){}return true;}
   @Override public void onPageFinished(WebView view,String url){if(!menuDate.isEmpty())event("native-menu",json("date",menuDate));}
  });
  web.setWebChromeClient(new WebChromeClient(){@Override public void onPermissionRequest(PermissionRequest request){request.deny();}});
  web.addJavascriptInterface(new Bridge(),"Android");
  tts=new TextToSpeech(this,status->{ttsReady=status==TextToSpeech.SUCCESS;if(ttsReady){int available=tts.setLanguage(Locale.forLanguageTag("en-IN"));if(available<0)available=tts.setLanguage(Locale.ENGLISH);ttsReady=available>=0;tts.setSpeechRate(.9f);}});
  tts.setOnUtteranceProgressListener(new UtteranceProgressListener(){public void onStart(String id){speaking=true;}public void onDone(String id){finishSpeech(false);}public void onError(String id){finishSpeech(true);}});
  menuDate=getIntent().getStringExtra("menuDate");if(menuDate==null)menuDate="";web.loadUrl(APP_URL);ReminderReceiver.scheduleNext(this);
 }
 private void finishSpeech(boolean error){runOnUiThread(()->{speaking=false;event("native-tts",json("kind",error?"error":"end"));});}
 private void screen(){if(active&&cooking)getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);}
 class Bridge {
  @JavascriptInterface public String readState(){return ReminderReceiver.prefs(MainActivity.this).getString("state","");}
  @JavascriptInterface public boolean writeState(String value){if(value.length()>2000000)return false;try{new JSONObject(value);}catch(JSONException e){return false;}return ReminderReceiver.prefs(MainActivity.this).edit().putString("state",value).commit();}
  @JavascriptInterface public boolean setReminders(String value){if(value.length()>4000000)return false;try{JSONArray rows=new JSONArray(value);if(rows.length()>400)return false;for(int i=0;i<rows.length();i++){JSONObject r=rows.getJSONObject(i);r.getLong("at");r.getString("date");r.getString("body");}}catch(JSONException e){return false;}boolean saved=ReminderReceiver.prefs(MainActivity.this).edit().putString("reminders",value).commit();if(saved)runOnUiThread(()->ReminderReceiver.scheduleNext(MainActivity.this));return saved;}
  @JavascriptInterface public String notificationStatus(){JSONObject result=json("enabled",ReminderReceiver.enabled(MainActivity.this));try{result.put("exact",ReminderReceiver.exact(MainActivity.this));result.put("next",ReminderReceiver.prefs(MainActivity.this).getLong("next",0));}catch(JSONException ignored){}return result.toString();}
  @JavascriptInterface public void enableNotifications(){runOnUiThread(()->{ReminderReceiver.prefs(MainActivity.this).edit().putBoolean("enabled",true).apply();if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},10);else if(!getSystemService(NotificationManager.class).areNotificationsEnabled())openNotificationSettings();ReminderReceiver.scheduleNext(MainActivity.this);});}
  @JavascriptInterface public void openAlarmSettings(){runOnUiThread(()->{try{if(Build.VERSION.SDK_INT>=31&&!ReminderReceiver.exact(MainActivity.this))startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:"+getPackageName())));else message("Precise reminders are already allowed.");}catch(ActivityNotFoundException e){message("Open Android Settings → Apps → Special access → Alarms and reminders.");}});}
  @JavascriptInterface public void openNotificationSettings(){runOnUiThread(()->startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName())));}
  @JavascriptInterface public void testNotification(){runOnUiThread(()->{if(!getSystemService(NotificationManager.class).areNotificationsEnabled()){message("Enable notifications first.");return;}ReminderReceiver.show(MainActivity.this,LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(1).toString(),true);message("Test notification sent. Pull down your notification shade.");});}
  @JavascriptInterface public boolean isSpeaking(){return speaking;}
  @JavascriptInterface public void speak(String text){runOnUiThread(()->{if(!active)return;if(!ttsReady){event("native-tts",json("kind","error"));return;}speaking=true;int result=tts.speak(text,TextToSpeech.QUEUE_FLUSH,null,"recipe");if(result==TextToSpeech.ERROR)finishSpeech(true);});}
  @JavascriptInterface public void stopSpeaking(){runOnUiThread(()->{speaking=false;if(tts!=null)tts.stop();});}
  @JavascriptInterface public void keepAwake(boolean value){runOnUiThread(()->{cooking=value;screen();});}
  @JavascriptInterface public void exportBackup(String data){runOnUiThread(()->{if(data.length()>2000000){message("Backup too large.");return;}exportData=data;Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE,"kutty-samayal-backup.json");startActivityForResult(save,20);});}
  @JavascriptInterface public void importBackup(){runOnUiThread(()->startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE),21));}
 }
 
 @Override protected void onResume(){super.onResume();active=true;if(web!=null)event("native-resume",new JSONObject());ReminderReceiver.scheduleNext(this);}
 @Override protected void onPause(){active=false;if(tts!=null)tts.stop();speaking=false;screen();super.onPause();}
 @Override protected void onNewIntent(Intent i){super.onNewIntent(i);setIntent(i);menuDate=i.getStringExtra("menuDate");if(menuDate!=null)event("native-menu",json("date",menuDate));}
 @Override public void onRequestPermissionsResult(int request,String[] names,int[] grants){super.onRequestPermissionsResult(request,names,grants);if(request==10){ReminderReceiver.scheduleNext(this);event("native-resume",new JSONObject());}}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(result!=RESULT_OK||data==null||data.getData()==null)return;try{if(request==20){try(OutputStream out=getContentResolver().openOutputStream(data.getData())){if(out==null)throw new IOException();out.write(exportData.getBytes(StandardCharsets.UTF_8));}exportData="";message("Backup saved.");}if(request==21){try(InputStream in=getContentResolver().openInputStream(data.getData());ByteArrayOutputStream out=new ByteArrayOutputStream()){if(in==null)throw new IOException();byte[] buffer=new byte[8192];int n,total=0;while((n=in.read(buffer))!=-1){total+=n;if(total>2000000)throw new IOException("Backup too large");out.write(buffer,0,n);}event("native-import",json("text",out.toString("UTF-8")));}}}catch(Exception e){event("native-import",json("error","Could not read or save the backup file."));}}
 private void handleBack(){web.evaluateJavascript("(()=>{const e=new Event('native-back',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented})()",v->{if(!"true".equals(v))finish();});}
 @Override public void onBackPressed(){handleBack();}
 @Override protected void onDestroy(){if(tts!=null)tts.shutdown();if(web!=null){web.removeJavascriptInterface("Android");web.destroy();web=null;}super.onDestroy();}
}
