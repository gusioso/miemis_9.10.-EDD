#!/usr/bin/env python3
"""
10-second 3D style test: "What if gravity switched off for ten seconds?"
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
    ("What if, every morning, gravity just... switched off?", 0.3),
    ("Your cereal floats away. Your cat floats away.", 0.3),
    ("And so do you.", 0.0),
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

    ev = dict(off=w(0, r"^switched"), cereal=w(1, r"^cereal"), cat=w(1, r"^cat"), you0=lines[2]["start"] - 0.35,
              you=w(2, r"^you"), end=lines[2]["end"])
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
    beat = 0.36
    for i, f in enumerate(melody):
        add(music, bell(f), 0.15 + i * beat, 0.06 if i % 2 else 0.08)
    add(music, pad([130.81, 164.81, 196.0], 5.2), 0.0, 0.14)
    add(music, pad([174.61, 220.0, 261.63], 5.4), 4.8, 0.14)
    vo = np.zeros(n)
    venv = np.zeros(n)
    for sig, t0 in voices:
        lvl = np.sqrt(np.mean(sig[np.abs(sig) > 0.1 * np.abs(sig).max()] ** 2)) + 1e-9
        add(vo, sig * (0.2 / lvl), t0)
        add(venv, np.ones(len(sig)), t0)
    k = int(0.2 * SR)
    music *= 1 - 0.4 * np.clip(np.convolve(venv, np.ones(k) / k, mode="same"), 0, 1)
    sfx = np.zeros(n)
    # room tone, a clock tick, then the gravity "power-down" whoosh, floaty shimmer, cat meow-ish chirp
    add(sfx, noise(TOTAL, 60, 400) * 0.5, 0, 0.02)
    for j in range(int(ev["off"] / 0.5)):
        add(sfx, noise(0.02, 2000, 6000) * np.exp(-tt(0.02) * 200), 0.2 + j * 0.5, 0.05)
    x = tt(1.0)
    add(sfx, np.sin(2 * np.pi * np.cumsum(900 * np.exp(-x * 3) + 80) / SR) * np.exp(-x * 2), ev["off"] + 0.1, 0.07)
    add(sfx, noise(1.4, 300, 4000) * np.sin(np.pi * tt(1.4) / 1.4) ** 2, ev["off"] - 0.1, 0.06)
    for j in range(24):
        add(sfx, bell(rng.uniform(1800, 3200), 0.6, 6), ev["off"] + 0.4 + j * 0.27, 0.012)
    x = tt(0.35)
    add(sfx, np.sin(2 * np.pi * np.cumsum(700 + 500 * np.sin(np.pi * x / 0.35)) / SR) * np.sin(np.pi * x / 0.35) * 0.6, ev["cat"] + 0.45, 0.06)
    for j, f in enumerate((C6, E6, 1567.98)):
        add(sfx, bell(f, 0.8, 5), ev["you"] + 0.1 + j * 0.08, 0.04)
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
