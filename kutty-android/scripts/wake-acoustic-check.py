"""Acoustic regression samples: actual PCM decoding, not injected keyword callbacks."""
from pathlib import Path
import json, subprocess, tempfile, tarfile, urllib.request, wave
import numpy as np
import sentencepiece as spm
import sherpa_onnx
work=Path(tempfile.mkdtemp(prefix='kutty-acoustic-'))
model='sherpa-onnx-kws-zipformer-gigaspeech-3.3M-2024-01-01'
archive=work/'model.tar.bz2'
urllib.request.urlretrieve(f'https://github.com/k2-fsa/sherpa-onnx/releases/download/kws-models/{model}.tar.bz2',archive)
with tarfile.open(archive) as t:t.extractall(work,filter='data')
p=work/model
sp=spm.SentencePieceProcessor(model_file=str(p/'bpe.model'))
variants={
 'original':[('HEY KUTTY','hey_kutty',1.5,.35),('STOP','stop',1.5,.35)],
 'phonetic':[('HEY KUTTY','hey_kutty',2,.25),('HEY CUTTY','hey_kutty',2,.25),('HEY CUTIE','hey_kutty',2,.25),('HEY KITTY','hey_kutty',2,.25),('STOP','stop',1.5,.35)]
}
reports=[]
for variant,words in variants.items():
 keywords=work/f'{variant}.txt'
 keywords.write_text('\n'.join(' '.join(sp.encode(text,out_type=str))+f' :{score} #{threshold} @{label}' for text,label,score,threshold in words)+'\n')
 kws=sherpa_onnx.KeywordSpotter(tokens=str(p/'tokens.txt'),encoder=str(p/'encoder-epoch-12-avg-2-chunk-16-left-64.onnx'),decoder=str(p/'decoder-epoch-12-avg-2-chunk-16-left-64.onnx'),joiner=str(p/'joiner-epoch-12-avg-2-chunk-16-left-64.onnx'),num_threads=1,keywords_file=str(keywords))
 for voice in ['en-us','en-gb','en-sc']:
  for phrase in ['hey kutty','hey cutty','stop','hello there','what can I cook tomorrow','the kettle is ready','please cut the carrot']:
   wav=work/'speech.wav';subprocess.run(['espeak-ng','-v',voice,'-s','155','-w',str(wav),phrase],check=True)
   with wave.open(str(wav)) as w:
    assert w.getnchannels()==1 and w.getsampwidth()==2
    rate=w.getframerate();audio=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float32)/32768
   samples=np.interp(np.arange(int(len(audio)*16000/rate))*rate/16000,np.arange(len(audio)),audio).astype(np.float32)
   samples=np.concatenate([np.zeros(8000,dtype=np.float32),samples,np.zeros(16000,dtype=np.float32)])
   stream=kws.create_stream();hits=[]
   for i in range(0,len(samples),1600):
    stream.accept_waveform(16000,samples[i:i+1600])
    while kws.is_ready(stream):
     kws.decode_stream(stream)
     word=kws.get_result(stream)
     if word:hits.append(word);kws.reset_stream(stream)
   reports.append(dict(variant=variant,voice=voice,phrase=phrase,hits=hits))
print(json.dumps(reports,indent=2))
Path('wake-acoustic-results.json').write_text(json.dumps(reports,indent=2))
