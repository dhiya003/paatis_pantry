package com.verve.kuttysamayal;
import android.app.*;
import android.content.*;
import android.os.*;
import android.security.keystore.*;
import android.text.InputType;
import android.util.Base64;
import android.view.WindowManager;
import android.widget.*;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import javax.net.ssl.HttpsURLConnection;
import java.security.KeyStore;
import java.net.URL;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.*;

/** Personal bring-your-own-key connection. No shared provider secret is shipped in the APK. */
final class AssistantClient {
 interface Callback {void result(String id,String text,String error);void configured();}
 private final Activity activity;private final Callback callback;
 private final ExecutorService worker=Executors.newSingleThreadExecutor();private final AtomicBoolean busy=new AtomicBoolean();
 private volatile HttpsURLConnection current;private volatile boolean destroyed=false;
 private static final String KEY_ALIAS="kutty_personal_ai",MODEL="gpt-4.1-mini";
 AssistantClient(Activity a,Callback c){activity=a;callback=c;}
 private android.content.SharedPreferences prefs(){return activity.getSharedPreferences("assistant_private",Context.MODE_PRIVATE);}
 boolean configured(){return prefs().contains("credential");}
 private javax.crypto.SecretKey key()throws Exception {KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);if(!ks.containsAlias(KEY_ALIAS)){KeyGenerator g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");g.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());g.generateKey();}return (javax.crypto.SecretKey)ks.getKey(KEY_ALIAS,null);}
 private void saveKey(String value)throws Exception {Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,key());String encrypted=Base64.encodeToString(c.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(c.doFinal(value.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP);if(!prefs().edit().putString("credential",encrypted).commit())throw new IOException();}
 private String readKey()throws Exception {String[] parts=prefs().getString("credential","").split(":");if(parts.length!=2)throw new IOException();Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));return new String(c.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),StandardCharsets.UTF_8);}
 void configure(){activity.runOnUiThread(()->{LinearLayout box=new LinearLayout(activity);box.setOrientation(LinearLayout.VERTICAL);int pad=(int)(20*activity.getResources().getDisplayMetrics().density);box.setPadding(pad,pad,pad,pad);TextView help=new TextView(activity);help.setText("Connect your own OpenAI API account for this personal app. API usage has separate charges. Your key is encrypted on this phone and excluded from backups.\n\nWhen you send a message, OpenAI receives the conversation, age in months, allergen exclusions, recipes, pantry and menu. Your baby's name and birth date are not automatically sent. Audio recognition uses your phone's speech service.\n\nUse a dedicated project key with a spending limit. This is a personal-device setup, not a shared public service.");box.addView(help);EditText input=new EditText(activity);input.setSingleLine(true);input.setHint("OpenAI API key");input.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);box.addView(input);
 AlertDialog dialog=new AlertDialog.Builder(activity).setTitle(configured()?"AI connection":"Connect AI").setView(box).setPositiveButton("Save connection",null).setNegativeButton("Cancel",null).setNeutralButton(configured()?"Disconnect":"",(d,w)->{prefs().edit().remove("credential").apply();callback.configured();}).create();dialog.setOnShowListener(d->{dialog.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);if(!configured())dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setVisibility(android.view.View.GONE);dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{String value=input.getText().toString().trim();if(!value.startsWith("sk-")||value.length()<20||value.length()>500){input.setError("Enter your OpenAI API key");return;}try{saveKey(value);input.setText("");dialog.dismiss();callback.configured();}catch(Exception e){input.setError("Could not securely save the connection on this phone.");}});});dialog.show();});}
 void ask(String id,String payload){if(id==null||!id.matches("[a-zA-Z0-9-]{1,80}"))return;if(payload==null||payload.length()>220000){callback.result(id,"","The conversation is too large. Start a new conversation.");return;}if(!configured()){callback.result(id,"","Connect AI first.");return;}if(!busy.compareAndSet(false,true)){callback.result(id,"","The assistant is still answering. Please wait.");return;}
 worker.execute(()->{HttpsURLConnection con=null;try{JSONObject incoming=new JSONObject(payload);JSONArray input=incoming.getJSONArray("input");if(input.length()>22)throw new IOException();JSONObject request=new JSONObject().put("model",MODEL).put("store",false).put("max_output_tokens",3000).put("instructions",incoming.getString("instructions")).put("input",input).put("text",incoming.getJSONObject("text"));
 con=(HttpsURLConnection)new URL("https://api.openai.com/v1/responses").openConnection();current=con;con.setInstanceFollowRedirects(false);con.setConnectTimeout(15000);con.setReadTimeout(55000);con.setRequestMethod("POST");con.setRequestProperty("Content-Type","application/json");con.setRequestProperty("Authorization","Bearer "+readKey());con.setDoOutput(true);byte[] bytes=request.toString().getBytes(StandardCharsets.UTF_8);con.setFixedLengthStreamingMode(bytes.length);try(OutputStream out=con.getOutputStream()){out.write(bytes);}int status=con.getResponseCode();if(status!=200){String error=status==401?"The API key was rejected. Check your AI connection.":status==429?"Your AI account reached a usage or rate limit. Check its billing and limits, then retry.":status==403?"Your AI account cannot use this model.":"AI service could not answer (HTTP "+status+"). Please retry.";callback.result(id,"",error);return;}
 String raw;try(InputStream in=con.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[8192];int n,total=0;while((n=in.read(buffer))!=-1){total+=n;if(total>1000000)throw new IOException();out.write(buffer,0,n);}raw=out.toString("UTF-8");}
 JSONObject response=new JSONObject(raw);if(!"completed".equals(response.optString("status"))){callback.result(id,"","The answer was incomplete. Nothing changed; please try a shorter request.");return;}StringBuilder answer=new StringBuilder();JSONArray output=response.optJSONArray("output");if(output!=null)for(int i=0;i<output.length();i++){JSONArray parts=output.getJSONObject(i).optJSONArray("content");if(parts==null)continue;for(int j=0;j<parts.length();j++){JSONObject part=parts.getJSONObject(j);if("output_text".equals(part.optString("type")))answer.append(part.optString("text"));}}
 if(answer.length()==0){callback.result(id,"","The assistant could not provide a response to that request. Try asking about the meal plan.");return;}if(!destroyed)callback.result(id,answer.toString(),"");
 }catch(Exception e){if(!destroyed)callback.result(id,"","Could not reach AI. Check your internet connection and saved API key, then retry.");}finally{if(con!=null)con.disconnect();current=null;busy.set(false);}});
 }
 void destroy(){destroyed=true;HttpsURLConnection con=current;if(con!=null)con.disconnect();worker.shutdownNow();}
}
