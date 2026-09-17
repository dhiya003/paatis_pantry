package com.verve.kuttysamayal;

import android.content.Context;
import android.media.*;
import android.os.*;
import com.k2fsa.sherpa.onnx.*;
import java.util.concurrent.*;

/** Audio stays in RAM and is used only for local keyword spotting. */
final class WakeListener {
 interface Callback { void keyword(String word); void error(); void ready(); }
 private final Context context; private final Callback callback;
 private final Handler main=new Handler(Looper.getMainLooper());
 private final ExecutorService worker=Executors.newSingleThreadExecutor();
 volatile boolean capturing=false,silenced=false;volatile float level=0;volatile long lastAudio=0;
 private volatile boolean listening=false,closed=false; private KeywordSpotter spotter;
 WakeListener(Context c,Callback cb){context=c;callback=cb;}
 static KeywordSpotter create(Context c){
  OnlineTransducerModelConfig transducer=new OnlineTransducerModelConfig();
  transducer.setEncoder("wake/encoder.onnx");transducer.setDecoder("wake/decoder.onnx");transducer.setJoiner("wake/joiner.onnx");
  OnlineModelConfig model=new OnlineModelConfig();model.setTransducer(transducer);model.setTokens("wake/tokens.txt");model.setModelType("zipformer2");model.setNumThreads(1);
  KeywordSpotterConfig config=new KeywordSpotterConfig();config.setModelConfig(model);config.setKeywordsFile("wake/keywords.txt");config.setKeywordsThreshold(.2f);config.setMaxActivePaths(8);config.setNumTrailingBlanks(2);
  return new KeywordSpotter(c.getAssets(),config);
 }
 void start(){if(closed||listening)return;listening=true;worker.execute(()->{
  AudioRecord recorder=null;OnlineStream stream=null;
  try{if(spotter==null)spotter=create(context);if(!listening||closed)return;
   stream=spotter.createStream("");int size=AudioRecord.getMinBufferSize(16000,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT);
   if(size<=0)throw new IllegalStateException();
   recorder=new AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION,16000,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT,Math.max(size*2,6400));
   if(recorder.getState()!=AudioRecord.STATE_INITIALIZED)throw new IllegalStateException();recorder.startRecording();if(recorder.getRecordingState()!=AudioRecord.RECORDSTATE_RECORDING)throw new IllegalStateException();boolean announced=false;short[] pcm=new short[1600];
   while(listening&&!closed){int count=recorder.read(pcm,0,pcm.length);if(count<=0)throw new IllegalStateException();float[] samples=new float[count];double energy=0;for(int i=0;i<count;i++){samples[i]=pcm[i]/32768f;energy+=samples[i]*samples[i];}level=(float)Math.sqrt(energy/count);lastAudio=SystemClock.elapsedRealtime();capturing=true;if(Build.VERSION.SDK_INT>=29){AudioRecordingConfiguration config=recorder.getActiveRecordingConfiguration();silenced=config!=null&&config.isClientSilenced();}if(!announced){announced=true;main.post(()->{if(listening&&!closed)callback.ready();});}stream.acceptWaveform(samples,16000);
    while(listening&&!closed&&spotter.isReady(stream)){spotter.decode(stream);String word=spotter.getResult(stream).getKeyword();if(!word.isEmpty()){spotter.reset(stream);main.post(()->{if(listening&&!closed)callback.keyword(word);});}}
   }
  }catch(Exception|LinkageError e){if(listening&&!closed)main.post(()->{if(!closed)callback.error();});}
  finally{capturing=false;level=0;if(recorder!=null){try{recorder.stop();}catch(Exception ignored){}recorder.release();}if(stream!=null)stream.release();}
 });}
 // Queue the handoff after the capture loop has released the microphone.
 void pause(Runnable next){listening=false;if(!closed)worker.execute(()->main.post(()->{if(!closed)next.run();}));}
 void close(){closed=true;listening=false;worker.execute(()->{if(spotter!=null){spotter.release();spotter=null;}});worker.shutdown();}
}
