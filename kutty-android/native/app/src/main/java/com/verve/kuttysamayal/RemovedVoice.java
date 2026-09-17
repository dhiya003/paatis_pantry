package com.verve.kuttysamayal;
import android.content.*;
import android.app.NotificationManager;
import java.security.KeyStore;
/** Remove obsolete voice state when upgrading; meal and reminder data stay intact. */
final class RemovedVoice {
 static void cleanup(Context c){
  c.stopService(new Intent().setClassName(c,"com.verve.kuttysamayal.HandsFreeService"));
  NotificationManager manager=c.getSystemService(NotificationManager.class);manager.cancel(72);manager.deleteNotificationChannel("kutty_handsfree");
  for(String name:new String[]{"assistant_private","assistant_chat","handsfree_chat"})c.getSharedPreferences(name,Context.MODE_PRIVATE).edit().clear().apply();
  try{KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);if(ks.containsAlias("kutty_personal_ai"))ks.deleteEntry("kutty_personal_ai");}catch(Exception ignored){}
 }
}
