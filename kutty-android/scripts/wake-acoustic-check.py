"""Decode real PCM through the bundled model; emit the same fixtures for Android.
Synthetic voices are a regression check, not a claim of accuracy for human users.
No recordings from the user are stored or uploaded.
"""
from pathlib import Path
import argparse, json, urllib.request, wave
import numpy as np
import sherpa_onnx

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--fixtures',type=Path)
parser.add_argument('--models',type=Path,default=root/'native/app/src/main/assets/wake')
args=parser.parse_args()
fixtures=args.fixtures or root/'wake-fixtures'
fixtures.mkdir(exist_ok=True)
phrases=['hey kutty','hey cutty','stop','hello there','what can I cook tomorrow','the kettle is ready','please cut the carrot','hey can you help me','put the cup here','the baby is hungry']
if not args.fixtures:
 from piper import PiperVoice, SynthesisConfig
 cache=root/'wake-test-voices';cache.mkdir(exist_ok=True)
 for voice_name,location in [('lessac','en/en_US/lessac/medium/en_US-lessac-medium'),('alba','en/en_GB/alba/medium/en_GB-alba-medium')]:
  for extension in ['.onnx','.onnx.json']:
   target=cache/(voice_name+extension)
   if not target.exists():urllib.request.urlretrieve('https://huggingface.co/rhasspy/piper-voices/resolve/main/'+location+extension,target)
  voice=PiperVoice.load(str(cache/(voice_name+'.onnx')))
  for phrase in phrases:
   with wave.open(str(fixtures/(voice_name+'-'+phrase.replace(' ','_')+'.wav')),'wb') as w:voice.synthesize_wav(phrase.capitalize()+'.',w,syn_config=SynthesisConfig(noise_scale=0,noise_w_scale=0))

p=args.models
kws=sherpa_onnx.KeywordSpotter(tokens=str(p/'tokens.txt'),encoder=str(p/'encoder.onnx'),decoder=str(p/'decoder.onnx'),joiner=str(p/'joiner.onnx'),keywords_file=str(root/'native/wake-keywords.txt'),num_threads=1,max_active_paths=8,num_trailing_blanks=2,keywords_score=1.5,keywords_threshold=.2)
test_assets=root/'native/app/src/androidTest/assets/wake-tests'
test_assets.mkdir(parents=True,exist_ok=True)
reports=[];manifest=[]
for wav in sorted(fixtures.glob('*.wav')):
 expected='hey_kutty' if 'hey_' in wav.stem and any(x in wav.stem for x in ['kutty','cutty','cootie']) else 'stop' if wav.stem.endswith('stop') else ''
 with wave.open(str(wav)) as w:
  assert w.getnchannels()==1 and w.getsampwidth()==2
  rate=w.getframerate();audio=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float32)/32768
 samples=np.interp(np.arange(int(len(audio)*16000/rate))*rate/16000,np.arange(len(audio)),audio).astype(np.float32)
 samples=np.concatenate([np.zeros(8000,dtype=np.float32),samples,np.zeros(16000,dtype=np.float32)])
 # Quantize once so the Python and Android tests receive identical PCM.
 pcm=(samples*32767).astype('<i2');samples=pcm.astype(np.float32)/32768
 filename=wav.stem+'.pcm';(test_assets/filename).write_bytes(pcm.tobytes());manifest.append(filename+'\t'+expected)
 stream=kws.create_stream();hits=[]
 for i in range(0,len(samples),1600):
  stream.accept_waveform(16000,samples[i:i+1600])
  while kws.is_ready(stream):
   kws.decode_stream(stream);word=kws.get_result(stream)
   if word:hits.append(word);kws.reset_stream(stream)
 passed=(expected in hits and all(h==expected for h in hits)) if expected else not hits
 reports.append(dict(sample=wav.name,expected=expected,hits=hits,passed=passed))
(test_assets/'manifest.tsv').write_text('\n'.join(manifest)+'\n')
(root/'wake-acoustic-results.json').write_text(json.dumps(reports,indent=2))
print(json.dumps(reports,indent=2))
assert reports and all(row['passed'] for row in reports), 'Acoustic detection regression: inspect wake-acoustic-results.json'
