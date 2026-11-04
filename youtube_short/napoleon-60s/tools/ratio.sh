#!/bin/bash
# voice-to-background ratio per section (needs a full mix and a NOVOICE mix at the same drive)
cd "$(dirname "$0")/.."
D=$(node song.js | sed -n 's/.*drive \([0-9.]*\).*/\1/p'); cp out/music.wav out/final_mix.wav
NOVOICE=1 DRIVE=$D node song.js >/dev/null; cp out/music.wav out/music_nov.wav; cp out/final_mix.wav out/music.wav
python3 - <<'PY'
import numpy as np, soundfile as sf
a,sr=sf.read('out/music_nov.wav'); f,_=sf.read('out/final_mix.wav'); a=a.mean(1); f=f.mean(1); n=min(len(a),len(f)); a=a[:n]; f=f[:n]
for t0,t1 in [(5,8),(14,17),(20,24),(26,31),(33,38),(42,48),(50,53),(55,59)]:
    s=slice(int(t0*sr),int(t1*sr)); r=lambda x:20*np.log10(np.sqrt((x[s]**2).mean())+1e-9)
    d=r(f)-r(a); vo=10*np.log10(max(1e-6,10**(d/10)-1))
    print(f'{t0:>3}-{t1:<3} background {r(a):6.1f} dB   voice is {vo:+5.1f} dB above it')
PY
