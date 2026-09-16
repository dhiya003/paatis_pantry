package com.verve.kuttysamayal;
import android.content.Context;
import android.webkit.WebView;
import android.view.ViewGroup;
import androidx.test.core.app.ActivityScenario;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;
@RunWith(AndroidJUnit4.class)
public class AppSmokeTest {
 private String evaluate(ActivityScenario<MainActivity> activity,String script)throws Exception {CountDownLatch done=new CountDownLatch(1);AtomicReference<String> answer=new AtomicReference<>("");activity.onActivity(a->{WebView w=(WebView)((ViewGroup)a.findViewById(android.R.id.content)).getChildAt(0);w.evaluateJavascript(script,result->{answer.set(result);done.countDown();});});assertTrue(done.await(15,TimeUnit.SECONDS));return answer.get();}
 @Test public void offlineLaunchAndNativeStorage()throws Exception {
 Context c=ApplicationProvider.getApplicationContext();ReminderReceiver.prefs(c).edit().clear().commit();
 try(ActivityScenario<MainActivity> app=ActivityScenario.launch(MainActivity.class)){
 boolean ready=false;for(int i=0;i<30;i++){if(evaluate(app,"document.body.innerText.includes('Save details')").equals("true")){ready=true;break;}Thread.sleep(500);}assertTrue("Bundled offline UI should show profile setup",ready);
 assertEquals("true",evaluate(app,"typeof Android !== 'undefined'"));
 assertEquals("true",evaluate(app,"Android.writeState(JSON.stringify({test:'persisted'}))"));
 assertEquals("true",evaluate(app,"JSON.parse(Android.readState()).test === 'persisted'"));
 assertEquals("true",evaluate(app,"document.body.scrollWidth <= window.innerWidth + 1"));
 evaluate(app,"Android.writeState('')");
 }
 assertNotNull(c.getSystemService(android.app.NotificationManager.class).getNotificationChannel(ReminderReceiver.CHANNEL));
 }
}
