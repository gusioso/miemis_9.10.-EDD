#!/usr/bin/env python3
"""
"What if every atom in the universe disappeared for five seconds?" - narration, word timings, music and sound.
Voice: Kokoro "am_liam" (Creative Claw could not connect in this session). Reuses the helpers in ../pause-time/tools.

  python3 tools/make_audio.py      # -> public/assets/vo/*.wav, public/soundtrack.wav, src/timeline.json

The physics the story keeps to: atoms (and so people, air, Earth, Sun, stars) vanish for 5 s and return exactly as
they were, so nobody feels anything. Light is not made of atoms: what was already travelling keeps going, but
nothing new is emitted for 5 s. So the Sun "goes dark" for 5 s at Earth 8 min 20 s later, every clock on Earth
ends up 5 s behind the rest of the universe, and every star's 5-second gap reaches us when its light would:
the closest star after about four years, the rest over millions of years.
"""
import json
import os
import re
import subprocess
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "..", "pause-time", "tools"))
import make_audio as ma  # noqa: E402

ma.VO = os.path.join(ROOT, "public", "assets", "vo")
SR = ma.SR
FPS = 24
GAP = 0.55

# (shot, text, hold after). Shots are the Blender scenes in tools/render.py.
LINES = [
    ("street", "What if every atom in the universe disappeared... for five seconds?", 0.6),
    ("street", "Tuesday. 9:41 in the morning. Nora is running late for work.", 0.5),
    ("vanish", "Then, in one instant... everything is gone.", 0.9),
    ("void", "The street. The air. Nora. The Earth. The Sun. Every star.", 0.8),
    ("light", "Only one thing is left. Light.", 0.5),
    ("light", "Light isn't made of atoms. So it just keeps going.", 0.8),
    ("back", "Five seconds later, every atom comes back. Exactly where it was.", 0.5),
    ("back", "Nobody felt a thing. Nora takes another sip of her coffee.", 0.4),
    ("back", "For eight minutes, the world is perfectly normal.", 0.9),
    ("space", "But while the Sun was gone, it made no light.", 0.4),
    ("space", "So a five-second hole in the sunlight is racing toward Earth.", 0.8),
    ("dark", "At 9:49 and twenty seconds, it arrives.", 0.5),
    ("dark", "The Sun goes dark.", 1.0),
    ("dark", "Five seconds of night, in the middle of the morning.", 0.6),
    ("dark", "Then it's back. As if nothing happened.", 0.8),
    ("phones", "Half the planet saw it. Nobody can explain it.", 0.6),
    ("lab", "Except Nora. She's an astronomer.", 0.5),
    ("lab", "And she finds something else. Every clock on Earth is now five seconds behind the stars.", 0.9),
    ("dome", "Then she realizes what's still coming.", 0.5),
    ("dome", "Every star vanished too. And each one sent out its own hole in the light.", 0.5),
    ("dome", "The closest one is four years away.", 1.0),
    ("roof", "Four years later, thousands of people look up.", 0.5),
    ("roof", "And right on time... a star blinks.", 1.2),
    ("sky", "For the next million years, the night sky will keep blinking. One star at a time.", 0.7),
    ("sky", "And somewhere out there, someone might be watching our Sun blink too.", 0.0),
]
CAP_SWAP = {1: {"9:41": "9:41"}, 11: {"twenty": "20"}}
LEAD = 0.6
TAIL = 3.0


def main():
    os.makedirs(ma.VO, exist_ok=True)
    t = LEAD
    lines, voices = [], []
    for li, (shot, text, hold) in enumerate(LINES):
        sig, fname = ma.tts(text, "n")
        words = text.split()
        wt = ma.align(sig, words)
        swap = CAP_SWAP.get(li, {})
        wl = [dict(w=w, s=round(t + a, 3), e=round(t + b, 3)) for w, (a, b) in zip(words, wt)]
        # captions: short phrases, split at punctuation (the reference style shows 1-2 short lines at a time)
        phrases, cur = [], []
        for k, w in enumerate(words):
            cur.append(k)
            if re.search(r"[,.?!…]$", w) or len(cur) >= 7:
                phrases.append(cur)
                cur = []
        if cur:
            phrases.append(cur)
        caps = [dict(start=round(t + wt[p[0]][0], 3), end=round(t + wt[p[-1]][1], 3), text=" ".join(swap.get(words[i], words[i]) for i in p)) for p in phrases]
        for a, b in zip(caps, caps[1:]):
            a["end"] = b["start"]
        caps[-1]["end"] = round(t + len(sig) / SR + min(0.6, hold + 0.3), 3)
        lines.append(dict(shot=shot, text=text, start=round(t, 3), end=round(t + len(sig) / SR, 3), words=wl, caps=caps))
        voices.append((sig, t))
        t += len(sig) / SR + GAP + hold
    total = t - GAP + TAIL
    # shots: from the first line of a shot to the first line of the next
    shots = []
    for i, l in enumerate(lines):
        if not shots or shots[-1]["id"] != l["shot"]:
            shots.append(dict(id=l["shot"], start=0.0 if not shots else round(l["start"] - 0.25, 3)))
    for a, b in zip(shots, shots[1:]):
        a["end"] = b["start"]
    shots[-1]["end"] = round(total, 3)

    def w(li, pat, end=False):
        hit = next(x for x in lines[li]["words"] if re.search(pat, x["w"], re.I))
        return hit["e"] if end else hit["s"]

    ev = dict(
        nora=lines[1]["start"], instant=w(2, r"^instant"), gone=w(2, r"^gone"),
        v_street=w(3, r"^street"), v_air=w(3, r"^air"), v_nora=w(3, r"^Nora"), v_earth=w(3, r"^Earth"), v_sun=w(3, r"^Sun"), v_star=w(3, r"^star"),
        light=w(4, r"^Light"), keeps=w(5, r"^keeps"), back=w(6, r"^comes"), sip=w(7, r"^sip"), normal=lines[8]["start"],
        hole=w(10, r"^hole"), arrives=w(11, r"^arrives"), dark=w(12, r"^dark"), relight=lines[14]["start"] + 0.2,
        half=lines[15]["start"], astro=w(16, r"^astronomer"), clock=w(17, r"^clock"), behind=w(17, r"^behind"),
        realize=lines[18]["start"], each=w(19, r"^each"), closest=lines[20]["start"], year4=lines[21]["start"], blink=w(22, r"^blinks"),
        million=lines[23]["start"], somewhere=lines[24]["start"], end=lines[24]["end"],
    )
    ev["darkEnd"] = ev["dark"] + 5.0           # five real seconds of darkness
    ev = {k: round(v, 3) for k, v in ev.items()}
    nwords = sum(len(l["text"].split()) for l in lines)
    print(f"total {total:.1f}s  words {nwords}  {nwords / total * 60:.0f} wpm overall")
    for s in shots:
        print(f"  {s['id']:7s} {s['start']:6.2f}-{s['end']:6.2f} ({s['end'] - s['start']:.1f}s)")
    if ev["darkEnd"] > ev["relight"] + 0.3:
        print("  ! darkness runs past 'Then it's back'", ev["darkEnd"], ev["relight"])

    # ---------------- soundtrack
    n = int(total * SR) + SR
    rng = np.random.default_rng(11)
    tt = lambda s: np.arange(int(s * SR)) / SR

    def add(buf, sig, at, g=1.0):
        i = int(at * SR)
        if i < 0:
            sig, i = sig[-i:], 0
        j = min(n, i + len(sig))
        if i < n:
            buf[i:j] += sig[:j - i] * g

    def noise(d, lo, hi):
        m = max(2, int(d * SR))
        s = np.fft.rfft(rng.standard_normal(m))
        fr = np.fft.rfftfreq(m, 1 / SR)
        s[(fr < lo) | (fr > hi)] = 0
        x = np.fft.irfft(s, m)
        return x / (np.abs(x).max() + 1e-9)

    def env(d, a, r):
        x = tt(d)
        return np.minimum(1, x / max(a, 1e-3)) * np.minimum(1, np.maximum(0, d - x) / max(r, 1e-3))

    def pad(fs, d, bright=0.25):
        x = tt(d)
        y = sum(np.sin(2 * np.pi * f * x + i) + bright * np.sin(2 * np.pi * f * 2.003 * x) + 0.3 * np.sin(2 * np.pi * f * 0.998 * x) for i, f in enumerate(fs))
        return y / len(fs) * env(d, 1.5, 2.0)

    def piano(f, d=3.0, dec=1.4):
        x = tt(d)
        return (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(4 * np.pi * f * x) * np.exp(-x * 3) + 0.15 * np.sin(6 * np.pi * f * x) * np.exp(-x * 5)) * np.exp(-x * dec) * np.minimum(1, x / 0.004)

    music = np.zeros(n)
    A2, C3, D3, E3, F3, G3 = 110.0, 130.81, 146.83, 164.81, 174.61, 196.0
    # calm piano motif (A minor -> F -> C -> G), slow; drops out in the void, returns softer; swells at the end
    chords = [[A2 * 2, C3 * 2, E3 * 2], [F3, A2 * 2, C3 * 2], [C3 * 2, E3 * 2, G3 * 2], [G3, 246.94, D3 * 2]]
    beat = 0.75
    tp, b = 0.0, 0
    quiet = [(ev["gone"] - 0.2, ev["back"] - 0.3), (ev["dark"] - 0.1, ev["darkEnd"])]
    while tp < total - 1.0:
        if not any(a <= tp < z for a, z in quiet):
            ch = chords[(b // 4) % 4]
            if b % 4 == 0:
                add(music, pad([c / 2 for c in ch], beat * 4 + 2.0, 0.2), tp, 0.085)
            note = ch[[0, 2, 1, 2][b % 4]] * 2
            add(music, piano(note, 3.0), tp, 0.05 if b % 2 else 0.065)
            if b % 8 == 7:
                add(music, piano(note * 1.5, 3.0), tp + beat / 2, 0.035)
        b += 1
        tp += beat
    # void: high, airy shimmer instead of music
    d = ev["back"] - ev["gone"]
    add(music, pad([880, 1318.5, 1760], d, 0.05) * 0.4, ev["gone"], 0.05)
    # ending swell
    d = total - ev["million"]
    add(music, pad([A2, E3, A2 * 2, C3 * 2, E3 * 2], d + 0.5, 0.35), ev["million"] - 0.3, 0.12)

    vo = np.zeros(n)
    venv = np.zeros(n)
    for sig, t0 in voices:
        lvl = np.sqrt(np.mean(sig[np.abs(sig) > 0.1 * np.abs(sig).max()] ** 2)) + 1e-9
        add(vo, sig * (0.2 / lvl), t0)
        add(venv, np.ones(len(sig)), t0)
    k = int(0.25 * SR)
    music *= 1 - 0.45 * np.clip(np.convolve(venv, np.ones(k) / k, mode="same"), 0, 1)

    amb = np.zeros(n)
    # city morning ambience on street shots, silenced exactly while atoms are gone (there is no air to carry sound)
    for a_, z_ in ((0, ev["gone"]), (ev["back"] - 0.1, lines[9]["start"] - 0.2), (ev["arrives"] - 1.2, ev["half"] + 4.0)):
        dd = z_ - a_
        if dd <= 0:
            continue
        city = noise(dd, 150, 1800) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * tt(dd)))
        add(amb, city * env(dd, 0.05 if a_ > 0 else 0.6, 0.05), a_, 0.035)
        for j in range(int(dd / 1.7)):                         # birds
            x = tt(0.09)
            f0 = rng.uniform(2800, 4200)
            add(amb, np.sin(2 * np.pi * np.cumsum(f0 + 900 * np.sin(x * 60)) / SR) * np.sin(np.pi * x / 0.09), a_ + 0.3 + j * 1.7 + rng.uniform(0, 0.6), 0.025)
    # birds and the city go quiet in the darkness
    i0, i1 = int(ev["dark"] * SR), int(ev["darkEnd"] * SR)
    amb[i0:i1] *= np.linspace(0.6, 0.15, i1 - i0)
    # night crickets for dome/roof/sky
    for j in range(140):
        x = tt(0.05)
        add(amb, np.sin(2 * np.pi * 4700 * x) * np.sin(np.pi * x / 0.05) * (0.5 + 0.5 * np.sin(2 * np.pi * 55 * x)), rng.uniform(ev["realize"], total - 1), 0.009)

    sfx = np.zeros(n)
    # vanish: a soft rising shimmer, then the cut to absolute silence
    d = ev["gone"] - ev["instant"] + 0.3
    add(sfx, noise(d, 2000, 9000) * np.linspace(0, 1, int(d * SR)) ** 2, ev["instant"], 0.05)
    x = tt(0.6)
    add(sfx, np.sin(2 * np.pi * np.cumsum(220 + 1800 * x) / SR) * np.exp(-x * 4), ev["gone"] - 0.1, 0.05)
    # the slow five-second timer: one soft, deep tick per (slowed) second while the atoms are gone
    slow = (ev["back"] - ev["gone"]) / 5
    for j in range(6):
        x = tt(1.2)
        add(sfx, np.sin(2 * np.pi * np.cumsum(70 + 50 * np.exp(-x * 25)) / SR) * np.exp(-x * 5), ev["gone"] + j * slow, 0.12)
        add(sfx, np.sin(2 * np.pi * 1320 * x) * np.exp(-x * 30), ev["gone"] + j * slow, 0.02)
    # return: reverse swoosh + everything snaps back
    d = 0.8
    add(sfx, noise(d, 300, 6000) * (tt(d) / d) ** 3, ev["back"] - d + 0.05, 0.08)
    x = tt(2.0)
    add(sfx, np.sin(2 * np.pi * np.cumsum(40 + 30 * np.exp(-x * 4)) / SR) * np.exp(-x * 1.5), ev["back"] + 0.05, 0.16)
    # darkness: a low cinematic hit and a held tone
    x = tt(3.5)
    add(sfx, np.sin(2 * np.pi * np.cumsum(36 + 30 * np.exp(-x * 3)) / SR) * np.exp(-x * 0.9), ev["dark"], 0.22)
    add(sfx, pad([55, 82.4], 5.2, 0.1), ev["dark"], 0.08)
    # streetlights clicking on / off
    for j in range(5):
        add(sfx, noise(0.03, 1500, 6000) * np.exp(-tt(0.03) * 120), ev["dark"] + 0.6 + j * 0.23, 0.05)
    # phones buzzing / camera shutters
    for j in range(8):
        add(sfx, np.sign(np.sin(2 * np.pi * 170 * tt(0.25))) * 0.3 * np.exp(-tt(0.25) * 6), ev["half"] + 0.3 + j * 0.45, 0.03)
    # computer beeps in the lab, the clock tick
    for j in range(3):
        add(sfx, np.sin(2 * np.pi * 1760 * tt(0.08)) * np.exp(-tt(0.08) * 30), ev["clock"] + j * 0.25, 0.04)
    # the star blink: a tiny high bell
    for j, f in enumerate((1568.0, 2093.0)):
        add(sfx, piano(f, 2.0, 2.5), ev["blink"] + 0.1 + j * 0.12, 0.05)

    mix = vo + music + amb + sfx
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    f = int(2.0 * SR)
    mix[-f:] *= np.linspace(1, 0, f)
    if os.environ.get("DRY"):
        return
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
    tl = dict(fps=FPS, total=round(total, 3), durationInFrames=int(np.ceil(total * FPS)), shots=shots, ev=ev, lines=lines)
    json.dump(tl, open(os.path.join(ROOT, "src", "timeline.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
