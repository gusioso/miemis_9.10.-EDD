#!/usr/bin/env python3
"""
10-second style test: "What if the moon followed you home?"
Voice: Kokoro "am_liam" (Creative Claw could not connect in this session). Reuses the helpers from ../pause-time/tools.
  python3 tools/make_audio.py   # -> public/assets/vo/*.wav, public/soundtrack.wav, src/timeline.json
"""
import json
import os
import subprocess
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "..", "pause-time", "tools"))
import make_audio as ma  # noqa: E402

ma.VO = os.path.join(ROOT, "public", "assets", "vo")
SR = ma.SR
LINES = [
    ("What if one night... the moon decided to follow you home?", 0.35),
    ("Every time you stop... it stops too.", 0.3),
    ("And it really doesn't want to leave.", 0.0),
]
LEAD = 0.35
TOTAL = 10.0


def main():
    os.makedirs(ma.VO, exist_ok=True)
    t = LEAD
    lines, voices = [], []
    for text, hold in LINES:
        sig, fname = ma.tts(text, "n")
        words = text.split()
        wt = ma.align(sig, words)
        caps = []
        for idxs in ma.chunk_words(words):
            caps.append(dict(start=round(t + wt[idxs[0]][0], 3), end=round(t + wt[idxs[-1]][1], 3),
                             text=" ".join(words[i] for i in idxs).upper().strip(",:;")))
        for a, b in zip(caps, caps[1:]):
            if b["start"] - a["end"] < 0.45:
                a["end"] = b["start"]
        wl = [dict(w=w, s=round(t + a, 3), e=round(t + b, 3)) for w, (a, b) in zip(words, wt)]
        lines.append(dict(text=text, start=round(t, 3), end=round(t + len(sig) / SR, 3), words=wl, caps=caps))
        voices.append((sig, t))
        t += len(sig) / SR + 0.4 + hold
    print(f"speech ends at {t - 0.4:.2f}s (video {TOTAL}s)")
    for l in lines:
        print(f"  {l['start']:5.2f}-{l['end']:5.2f} {l['text']}")

    def w(li, pat, end=False):
        import re
        hit = next(x for x in lines[li]["words"] if re.search(pat, x["w"], re.I))
        return hit["e"] if end else hit["s"]

    ev = dict(follow=w(0, r"^follow"), stop=w(1, r"^stop"), stops=w(1, r"^stops"), leave0=lines[2]["start"] - 0.3,
              leave=w(2, r"^leave"), end=lines[2]["end"])
    ev = {k: round(v, 3) for k, v in ev.items()}
    print(ev)

    # ---------------- soundtrack: dreamy night music box + pad, sparkles, footsteps, a wink "ting"
    n = int(TOTAL * SR)
    tt = lambda s: np.arange(int(s * SR)) / SR
    rng = np.random.default_rng(5)

    def add(buf, sig, at, g=1.0):
        i = int(at * SR)
        j = min(n, i + len(sig))
        if i < n:
            buf[i:j] += sig[:j - i] * g

    def bell(f, d=1.6, dec=3.0):
        x = tt(d)
        return (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 6) + 0.2 * np.sin(2 * np.pi * f * 4.07 * x) * np.exp(-x * 9)) * np.exp(-x * dec) * np.minimum(1, x / 0.003)

    def pad(fs, d):
        x = tt(d)
        y = sum(np.sin(2 * np.pi * f * x + i) + 0.3 * np.sin(2 * np.pi * f * 2.002 * x) for i, f in enumerate(fs)) / len(fs)
        return y * np.minimum(1, x / 1.0) * np.minimum(1, (d - x) / 1.2)

    def noise(d, lo, hi):
        m = int(d * SR)
        s = np.fft.rfft(rng.standard_normal(m))
        fr = np.fft.rfftfreq(m, 1 / SR)
        s[(fr < lo) | (fr > hi)] = 0
        x = np.fft.irfft(s, m)
        return x / (np.abs(x).max() + 1e-9)

    music = np.zeros(n)
    C5, D5, E5, G5, A5, C6, E6 = 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1318.5
    melody = [E5, G5, C6, G5, A5, G5, E5, D5, E5, G5, A5, C6, E6, C6, A5, G5, E5, G5, C6, G5]
    beat = 0.42
    for i, f in enumerate(melody):
        add(music, bell(f), 0.15 + i * beat, 0.06 if i % 2 else 0.08)
    add(music, pad([130.81, 164.81, 196.0], 5.2), 0.0, 0.16)
    add(music, pad([110.0, 130.81, 164.81], 5.4), 4.8, 0.16)
    add(music, pad([87.31, 130.81, 174.61], TOTAL - 9.0 + 0.6), 9.0, 0.0)
    vo = np.zeros(n)
    venv = np.zeros(n)
    for sig, t0 in voices:
        lvl = np.sqrt(np.mean(sig[np.abs(sig) > 0.1 * np.abs(sig).max()] ** 2)) + 1e-9
        add(vo, sig * (0.2 / lvl), t0)
        add(venv, np.ones(len(sig)), t0)
    k = int(0.2 * SR)
    music *= 1 - 0.4 * np.clip(np.convolve(venv, np.ones(k) / k, mode="same"), 0, 1)
    sfx = np.zeros(n)
    # soft footsteps while walking
    for j in range(16):
        at = 0.3 + j * 0.42
        if at > ev["stop"] + 0.1:
            break
        add(sfx, noise(0.06, 200, 1800) * np.exp(-tt(0.06) * 70), at, 0.05)
    # night ambience: crickets + far city hum
    add(sfx, noise(TOTAL, 60, 300) * 0.5, 0, 0.03)
    for j in range(40):
        x = tt(0.05)
        add(sfx, np.sin(2 * np.pi * 4800 * x) * np.sin(np.pi * x / 0.05) * (0.5 + 0.5 * np.sin(2 * np.pi * 60 * x)), rng.uniform(0, TOTAL - 0.1), 0.008)
    # moon swoosh when it follows, comic "stop" boop, sparkle wink
    add(sfx, noise(1.0, 400, 3000) * np.sin(np.pi * tt(1.0)) ** 2, ev["follow"] - 0.2, 0.05)
    x = tt(0.25)
    add(sfx, np.sin(2 * np.pi * np.cumsum(520 - 260 * x / 0.25) / SR) * np.exp(-x * 10), ev["stops"], 0.12)
    for j, f in enumerate((C6, E6, 1567.98, 2093.0)):
        add(sfx, bell(f, 0.8, 5), ev["leave"] + 0.1 + j * 0.07, 0.05)
    mix = vo + music + sfx
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    f = int(0.8 * SR)
    mix[-f:] *= np.linspace(1, 0, f)
    raw = os.path.join(ROOT, "public", "soundtrack_raw.wav")
    ma.write_wav(raw, mix)
    out = os.path.join(ROOT, "public", "soundtrack.wav")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", "48000", out], check=True)
    os.remove(raw)
    json.dump(dict(fps=30, total=TOTAL, durationInFrames=int(TOTAL * 30), ev=ev, lines=lines), open(os.path.join(ROOT, "src", "timeline.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
