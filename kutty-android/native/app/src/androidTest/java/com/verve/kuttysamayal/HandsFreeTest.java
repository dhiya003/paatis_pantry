package com.verve.kuttysamayal;
import android.Manifest;
import android.content.*;
import android.os.*;
import androidx.test.core.app.*;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import com.k2fsa.sherpa.onnx.*;
import org.junit.Test;
import java.io.*;
import java.util.*;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;
@RunWith(AndroidJUnit4.class)
public class HandsFreeTest {
 @Test public void bundledWakeModelLoadsAndSilenceDoesNotTrigger(){
  Context c=ApplicationProvider.getApplicationContext();KeywordSpotter model=WakeListener.create(c);OnlineStream stream=model.createStream("");
  try{for(int n=0;n<30;n++){stream.acceptWaveform(new float[1600],16000);while(model.isReady(stream)){model.decode(stream);assertEquals("",model.getResult(stream).getKeyword());}}}finally{stream.release();model.release();}
 }
 @Test public void bundledModelRecognizesWakeAndStopFromAudio()throws Exception {
  Context c=ApplicationProvider.getApplicationContext();android.content.res.AssetManager fixtures=InstrumentationRegistry.getInstrumentation().getContext().getAssets();
  KeywordSpotter model=WakeListener.create(c);int checked=0;
  try(BufferedReader manifest=new BufferedReader(new InputStreamReader(fixtures.open("wake-tests/manifest.tsv")))){
   String row;while((row=manifest.readLine())!=null){String[] entry=row.split("\\t",-1);OnlineStream stream=model.createStream("");Set<String> hits=new HashSet<>();
    try(InputStream input=fixtures.open("wake-tests/"+entry[0])){
     byte[] bytes=input.readAllBytes();
     for(int offset=0;offset<bytes.length;offset+=3200){int count=Math.min(3200,bytes.length-offset)/2;float[] samples=new float[count];for(int i=0;i<count;i++){int low=bytes[offset+i*2]&255,high=bytes[offset+i*2+1];samples[i]=(short)((high<<8)|low)/32768f;}stream.acceptWaveform(samples,16000);
      while(model.isReady(stream)){model.decode(stream);String word=model.getResult(stream).getKeyword();if(!word.isEmpty()){hits.add(word);model.reset(stream);}}
     }
     Set<String> expected=new HashSet<>();if(!entry[1].isEmpty())expected.add(entry[1]);assertEquals(entry[0],expected,hits);checked++;
    }finally{stream.release();}
   }
   assertTrue("Positive and negative acoustic fixtures must be bundled in test APK",checked>=20);
  }finally{model.release();}
 }
 @Test public void backgroundSessionAndStopReleaseService()throws Exception {
  Context c=ApplicationProvider.getApplicationContext();android.app.Instrumentation inst=InstrumentationRegistry.getInstrumentation();
  inst.getUiAutomation().grantRuntimePermission(c.getPackageName(),Manifest.permission.RECORD_AUDIO);
  if(Build.VERSION.SDK_INT>=33)inst.getUiAutomation().grantRuntimePermission(c.getPackageName(),Manifest.permission.POST_NOTIFICATIONS);
  try(ActivityScenario<MainActivity> app=ActivityScenario.launch(MainActivity.class)){
   app.onActivity(a->a.startForegroundService(new Intent(a,HandsFreeService.class)));
   for(int i=0;i<60&&!HandsFreeService.running();i++)Thread.sleep(100);
   assertTrue(HandsFreeService.running());
   for(int i=0;i<80&&!HandsFreeService.status().contains("Say Hey Kutty");i++)Thread.sleep(250);
   assertTrue("Service planner must load: "+HandsFreeService.status(),HandsFreeService.status().contains("Say Hey Kutty"));
   app.moveToState(androidx.lifecycle.Lifecycle.State.CREATED);Thread.sleep(1000);assertTrue("Service survives activity backgrounding",HandsFreeService.running());
   inst.getUiAutomation().executeShellCommand("input keyevent 223").close();Thread.sleep(1000);
   assertFalse(((PowerManager)c.getSystemService(Context.POWER_SERVICE)).isInteractive());
   inst.runOnMainSync(()->HandsFreeService.instance.onCommand("What can I make tomorrow?"));
   boolean answered=false;for(int i=0;i<60;i++){org.json.JSONObject status=new org.json.JSONObject(HandsFreeService.status());if(!status.optString("lastReply").isEmpty()){answered=true;break;}Thread.sleep(250);}
   assertTrue("Screen-off worker must answer local menu question: "+HandsFreeService.status(),answered);
   inst.runOnMainSync(()->HandsFreeService.instance.onKeyword("stop"));
   for(int i=0;i<30&&HandsFreeService.running();i++)Thread.sleep(100);assertFalse(HandsFreeService.running());
  }finally{inst.getUiAutomation().executeShellCommand("input keyevent 224").close();c.stopService(new Intent(c,HandsFreeService.class));}
 }
}
