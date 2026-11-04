#!/usr/bin/env python3
"""Narration for "60 Seconds of History: Napoleon".

  python3 tools/make_vo.py     -> assets/vo/L01..L11.wav (+ assets/vo/plan.json)
  node tools/vo_build.js       -> out/vo.wav, assets/vo/timing.js, out/voice.json

Voice: Kokoro (free, offline) `am_liam`. Creative Claw / ElevenLabs could not be reached in this session, so this is
the fallback from CLAUDE.md. `show` is the exact script text shown in the captions; `parts` is what the TTS reads
(numbers spelled out, pauses between parts).
"""
import json, os, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "vo")
MODEL = os.environ.get("KOKORO_DIR", "/tmp/claude-0/-home-user-miemis-9-10--EDD/2ee5f724-dc59-5edf-96e1-0e0cbd701394/scratchpad/kokoro")
VOICE = "am_liam"
SR = 24000

# at = when the line starts (seconds); gaps = silence between parts
LINES = [
    dict(id="L01", at=0.30, speed=0.90, parts=[("Sixty seconds of history.", "Sixty seconds of history.")]),
    dict(id="L02", at=4.30, speed=1.08, gaps=[0.25], parts=[("Today: Napoleon.", "Today: Napoleon."),
         ("The outsider who conquered Europe, and lost it all.", "The outsider who conquered Europe, and lost it all.")]),
    dict(id="L03", at=8.35, speed=1.15, gaps=[0.2], parts=[("Seventeen sixty-nine, Corsica.", "Seventeen sixty-nine, Corsica."),
         ("At military school, the other boys mock his accent.", "At military school, the other boys mock his accent.")]),
    dict(id="L04", at=13.40, speed=1.05, gaps=[0.3], parts=[("At twenty-four, his cannons win the Siege of Toulon.", "At twenty-four, his cannons win the Siege of Toulon."),
         ("He's made a general.", "He's made a general.")]),
    dict(id="L05", at=19.40, speed=1.05, gaps=[0.35], parts=[("Seventeen ninety-nine: he seizes power.", "Seventeen ninety-nine: he seizes power."),
         ("Eighteen oh four: he crowns himself emperor.", "Eighteen-oh-four: he crowns himself emperor.")]),
    dict(id="L06", at=25.35, speed=1.08, gaps=[0.3], parts=[("His legal code still shapes laws around the world.", "His legal code still shapes laws around the world."),
         ("At Austerlitz, he crushes two empires in a single day.", "At Austerlitz, he crushes two empires in a single day.")]),
    dict(id="L07", at=32.50, speed=1.08, gaps=[0.25, 0.35], parts=[("Then, eighteen twelve.", "Then, eighteen-twelve."),
         ("He invades Russia with half a million men.", "He invades Russia with half a million men."),
         ("Winter and hunger destroy them.", "Winter and hunger destroy them.")]),
    dict(id="L08", at=39.25, speed=0.90, parts=[("Exiled to Elba.", "Exiled to Elba...")]),
    dict(id="L09", at=41.10, speed=1.22, gaps=[0.2, 0.2, 0.35, 0.3], slow={3: 1.02 / 1.22}, parts=[("He escapes.", "...he escapes."),
         ("Troops are sent to stop him.", "Troops are sent to stop him."), ("He walks up and says:", "He walks up and says:"),
         ("If you want to kill your emperor, here I am.", "'If you want to kill your emperor, here I am.'"), ("They join him instead.", "They join him instead.")]),
    dict(id="L10", at=49.05, speed=1.2, gaps=[0.2, 0.2], parts=[("Waterloo, eighteen fifteen.", "Waterloo, eighteen-fifteen."),
         ("Final defeat.", "Final defeat."), ("He dies in exile on Saint Helena.", "He dies in exile on Saint Helena.")]),
    dict(id="L11", at=54.30, speed=1.22, gaps=[0.12, 0.12, 0.12], parts=[("And short?", "And 'short'?"),
         ("He was about five foot seven.", "He was about five-foot-seven."), ("Average for his time.", "Average for his time."),
         ("The myth came from British cartoons.", "The myth came from British cartoons.")]),
]


def trim(a, pad=0.03):
    e = np.abs(a)
    idx = np.where(e > 0.012)[0]
    if len(idx) == 0:
        return a
    i0 = max(0, idx[0] - int(pad * SR))
    i1 = min(len(a), idx[-1] + int(pad * SR))
    return a[i0:i1]


def main():
    k = Kokoro(os.path.join(MODEL, "kokoro-v1.0.onnx"), os.path.join(MODEL, "voices-v1.0.bin"))
    os.makedirs(OUT, exist_ok=True)
    plan = []
    for L in LINES:
        chunks, marks, pos = [], [], 0
        for i, (tts, show) in enumerate(L["parts"]):
            a, sr = k.create(tts, voice=VOICE, speed=L["speed"] * (L.get("slow") or {}).get(i, 1.0), lang="en-us")
            assert sr == SR
            seg = trim(np.asarray(a, dtype=np.float32))
            marks.append(dict(t0=round(pos / SR, 3), t1=round((pos + len(seg)) / SR, 3), show=show))
            chunks.append(seg)
            pos += len(seg)
            if i < len(L["parts"]) - 1:
                gap = (L.get("gaps") or [0.2] * 9)[i]
                chunks.append(np.zeros(int(gap * SR), dtype=np.float32))
                pos += int(gap * SR)
        a = np.concatenate(chunks)
        sf.write(os.path.join(OUT, L["id"] + ".wav"), a, SR)
        d = len(a) / SR
        plan.append(dict(id=L["id"], at=L["at"], dur=round(d, 3), end=round(L["at"] + d, 3), parts=marks))
        print(f'{L["id"]} {L["at"]:6.2f} -> {L["at"] + d:6.2f}  ({d:4.2f}s)')
    json.dump(plan, open(os.path.join(OUT, "plan.json"), "w"), indent=1)


main()
