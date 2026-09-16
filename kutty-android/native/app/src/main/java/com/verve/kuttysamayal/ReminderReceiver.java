package com.verve.kuttysamayal;
import android.app.*;
import android.content.*;
import android.os.Build;
import org.json.*;
import java.time.*;

public class ReminderReceiver extends BroadcastReceiver {
 static final String CHANNEL="next_day_menu";
 static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("kitchen",Context.MODE_PRIVATE);}
 static void channel(Context c){NotificationManager m=c.getSystemService(NotificationManager.class);m.createNotificationChannel(new NotificationChannel(CHANNEL,"Tomorrow’s menu at 6 PM IST",NotificationManager.IMPORTANCE_DEFAULT));}
 static PendingIntent alarmIntent(Context c,String date){return PendingIntent.getBroadcast(c,42,new Intent(c,ReminderReceiver.class).putExtra("date",date),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 static boolean exact(Context c){return Build.VERSION.SDK_INT<31||c.getSystemService(AlarmManager.class).canScheduleExactAlarms();}
 static boolean enabled(Context c){NotificationManager m=c.getSystemService(NotificationManager.class);NotificationChannel ch=m.getNotificationChannel(CHANNEL);return prefs(c).getBoolean("enabled",false)&&m.areNotificationsEnabled()&&(ch==null||ch.getImportance()!=NotificationManager.IMPORTANCE_NONE);}
 static void scheduleNext(Context c){
  AlarmManager alarm=c.getSystemService(AlarmManager.class);alarm.cancel(alarmIntent(c,""));prefs(c).edit().remove("next").apply();
  if(!prefs(c).getBoolean("enabled",false))return;
  long now=System.currentTimeMillis(),next=Long.MAX_VALUE;String date="";
  try{JSONArray entries=new JSONArray(prefs(c).getString("reminders","[]"));for(int i=0;i<entries.length();i++){JSONObject row=entries.getJSONObject(i);long at=row.getLong("at");if(at>now&&at<next){next=at;date=row.getString("date");}}}catch(JSONException ignored){}
  if(next==Long.MAX_VALUE){ZonedDateTime time=ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).withHour(18).withMinute(0).withSecond(0).withNano(0);if(time.toInstant().toEpochMilli()<=now)time=time.plusDays(1);next=time.toInstant().toEpochMilli();date=time.toLocalDate().plusDays(1).toString();}
  PendingIntent pending=alarmIntent(c,date);
  try{if(exact(c))alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,next,pending);else alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,next,pending);}catch(SecurityException e){alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,next,pending);}
  prefs(c).edit().putLong("next",next).apply();
 }
 static void show(Context c,String date,boolean test){
  channel(c);String title=test?"Test reminder · Kutty Samayal":"Open your kitchen to refresh the menu";String body=test?"Phone notifications are working. Your saved menu will arrive at 6 PM IST.":"Open Kutty Samayal to refresh upcoming menus and ingredients.";
  try{JSONArray entries=new JSONArray(prefs(c).getString("reminders","[]"));for(int i=0;i<entries.length();i++){JSONObject row=entries.getJSONObject(i);if(row.getString("date").equals(date)){title=(test?"Test · ":"")+row.getString("title");body=row.getString("body");break;}}}catch(JSONException ignored){}
  Intent open=new Intent(c,MainActivity.class).putExtra("menuDate",date).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
  PendingIntent content=PendingIntent.getActivity(c,1,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Notification notification=new Notification.Builder(c,CHANNEL).setSmallIcon(R.drawable.ic_notification).setContentTitle(title).setContentText(body.split("\n")[0]).setStyle(new Notification.BigTextStyle().bigText(body)).setContentIntent(content).setAutoCancel(true).setVisibility(Notification.VISIBILITY_PRIVATE).build();
  try{c.getSystemService(NotificationManager.class).notify(test?101:100,notification);}catch(SecurityException ignored){}
 }
 @Override public void onReceive(Context context,Intent intent){String date=intent.getStringExtra("date");if(prefs(context).getBoolean("enabled",false))show(context,date==null?"":date,false);scheduleNext(context);}
}
