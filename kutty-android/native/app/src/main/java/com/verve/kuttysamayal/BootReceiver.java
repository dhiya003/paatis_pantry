package com.verve.kuttysamayal;
import android.content.*;
public class BootReceiver extends BroadcastReceiver {@Override public void onReceive(Context c,Intent i){if(Intent.ACTION_MY_PACKAGE_REPLACED.equals(i.getAction()))RemovedVoice.cleanup(c);ReminderReceiver.scheduleNext(c);}}
