package com.verve.kuttysamayal;
import android.content.*;
import android.content.pm.*;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.*;
import static org.junit.Assert.*;
@RunWith(AndroidJUnit4.class)
public class NoBackgroundVoiceTest {
 @Test public void installedPackageCannotRunBackgroundMicrophone()throws Exception {
  Context c=ApplicationProvider.getApplicationContext();PackageInfo p=c.getPackageManager().getPackageInfo(c.getPackageName(),PackageManager.GET_PERMISSIONS|PackageManager.GET_SERVICES);
  List<String> permissions=Arrays.asList(p.requestedPermissions);
  for(String name:new String[]{"RECORD_AUDIO","WAKE_LOCK","FOREGROUND_SERVICE","FOREGROUND_SERVICE_MICROPHONE"})assertFalse(permissions.contains("android.permission."+name));
  assertTrue(p.services==null||p.services.length==0);
  assertFalse(Arrays.asList(c.getAssets().list("")).contains("wake"));
 }
}
