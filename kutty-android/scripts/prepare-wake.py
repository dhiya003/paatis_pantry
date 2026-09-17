"""Build-time only downloads. Runtime wake-word detection needs no account/network."""
from pathlib import Path
import hashlib, json, shutil, tarfile, tempfile, urllib.request, zipfile
root=Path(__file__).resolve().parents[1]
cache=Path(tempfile.mkdtemp(prefix='kutty-wake-'))
version='1.13.8'
def download(url,path):
    urllib.request.urlretrieve(url,path)
    print(path.name,hashlib.sha256(path.read_bytes()).hexdigest())
aar=cache/'sherpa.aar'
download(f'https://github.com/k2-fsa/sherpa-onnx/releases/download/v{version}/sherpa-onnx-{version}.aar',aar)
libs=root/'native/app/libs';libs.mkdir(parents=True,exist_ok=True)
# Keep real-device ARM64 and the emulator ABI; omit unrelated native architectures.
with zipfile.ZipFile(aar) as source,zipfile.ZipFile(libs/'sherpa-onnx.aar','w',zipfile.ZIP_DEFLATED) as out:
    for name in source.namelist():
        if name.startswith('jni/') and not name.startswith(('jni/arm64-v8a/','jni/x86_64/')):continue
        out.writestr(name,source.read(name))
archive=cache/'wake.tar.bz2'
model='sherpa-onnx-kws-zipformer-zh-en-3M-2025-12-20'
download(f'https://github.com/k2-fsa/sherpa-onnx/releases/download/kws-models/{model}.tar.bz2',archive)
with tarfile.open(archive) as t:t.extractall(cache,filter='data')
folder=cache/model
assets=root/'native/app/src/main/assets/wake';assets.mkdir(parents=True,exist_ok=True)
for part in ['encoder','decoder','joiner']:
    source=folder/f'{part}-epoch-13-avg-2-chunk-16-left-64.onnx'
    shutil.copyfile(source,assets/f'{part}.onnx')
shutil.copyfile(folder/'tokens.txt',assets/'tokens.txt')
shutil.copyfile(root/'native/wake-keywords.txt',assets/'keywords.txt')
# Include engine licence and model attribution with the bundled assets.
download(f'https://raw.githubusercontent.com/k2-fsa/sherpa-onnx/v{version}/LICENSE',assets/'SHERPA-LICENSE')
(assets/'NOTICE.txt').write_text('Wake detection: sherpa-onnx '+version+' by k2-fsa contributors.\nModel: '+model+' by the sherpa-onnx/icefall contributors.\nhttps://k2-fsa.github.io/sherpa/onnx/kws/index.html\n')
