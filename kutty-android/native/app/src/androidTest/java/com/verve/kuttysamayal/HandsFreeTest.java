package com.verve.kuttysamayal;
import android.Manifest;
import android.content.*;
import android.os.*;
import androidx.test.core.app.*;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import com.k2fsa.sherpa.onnx.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;
@RunWith(AndroidJUnit4.class)
public class HandsFreeTest {
 @Test public void bundledWakeModelLoadsAndSilenceDoesNotTrigger(){
  Context c=ApplicationProvider.getApplicationContext();KeywordSpotter model=WakeListener.create(c);OnlineStream stream=model.createStream("");
  try{for(int n=0;n<30;n++){stream.acceptWaveform(new float[1600],16000);while(model.isReady(stream)){model.decode(stream);assertEquals("",model.getResult(stream).getKeyword());}}}finally{stream.release();model.release();}
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
   assertTrue("Service planner must load",HandsFreeService.status().contains("Say Hey Kutty"));
   app.moveToState(androidx.lifecycle.Lifecycle.State.CREATED);Thread.sleep(1000);assertTrue("Service survives activity backgrounding",HandsFreeService.running());
   inst.runOnMainSync(()->HandsFreeService.instance.onKeyword("stop"));
   for(int i=0;i<30&&HandsFreeService.running();i++)Thread.sleep(100);assertFalse(HandsFreeService.running());
  }finally{c.stopService(new Intent(c,HandsFreeService.class));}
 }
}
