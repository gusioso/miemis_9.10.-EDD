#!/usr/bin/env python3
"""
Script, voices, word timings and sound for "The Last Customer" (2D horror short).

  python3 tools/make_audio.py      # -> public/assets/vo/*.wav, public/soundtrack.wav, src/timeline.json

Voices (Kokoro, free/offline; Creative Claw could not connect): narrator am_liam, Kai am_michael, the stranger bm_george
(slow, quiet). The countdown to midnight is pinned to real time: the word "Twenty" = 11:59:40, so "Ten seconds" lands at
11:59:50, "Five" at :55, "Three" at :57 and "midnight" at 12:00:00.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "public", "assets", "vo")
KOKORO = os.path.join(ROOT, "..", "kokoro")
SR = 24000
FPS = 30
VOICES = {"n": ("am_liam", float(os.environ.get("VO_SPEED", "0.93"))), "kai": ("am_michael", 0.92), "kw": ("am_michael", 0.82),
          "x": ("bm_george", 0.8), "xw": ("bm_george", 0.74)}
GAIN = {"n": 1.0, "kai": 0.95, "kw": 0.55, "x": 0.8, "xw": 0.5}
ANCHOR = [0.0]   # set by press=...; at=... is measured from it (works across scenes)
GAP = 0.45           # pause between lines inside a scene
PAUSE = 10.0         # seconds the world stays frozen


def K(text, **k):
    """Kai speaks."""
    return dict(text=text, voice=k.pop("voice", "kai"), **k)


def X(text, **k):
    """The stranger speaks (quiet, controlled)."""
    return dict(text=text, voice=k.pop("voice", "x"), **k)


def N(text, **k):
    return dict(text=text, voice="n", **k)


# lead = silence before the first line. press = regex of the word where time freezes (pk = "start"/"end" of that word,
# owner = whose button). at = start this line no earlier than press + at seconds. dur = pad the scene to this length.
SCENES = [
    dict(id="hook", tag="11:59 PM", lead=1.2, lines=[
        N("At exactly eleven fifty-nine PM, a stranger walked into a gas station, and asked one question.", hold=0.5),
        X("What time is it?", hold=0.9),
        N("The cashier answered. One second later, the entire night started over.")]),
    dict(id="shift", tag="11:57 PM", lead=1.0, extra=0.8, lines=[
        N("Kai had been working alone for six hours.", hold=0.4),
        N("The gas station was almost empty, and the nearest town was twenty miles away.", hold=0.4),
        N("All he wanted was to finish his shift, and go home.")]),
    dict(id="stranger", tag="11:59 PM", lead=0.5, lines=[
        N("A man in a dark raincoat stepped inside. He didn't look at the shelves. He didn't buy anything.", hold=0.3),
        N("He just stood near the door, completely motionless, before asking Kai for the time.", hold=0.7),
        X("What time is it?", hold=0.8),
        K("Eleven fifty-nine.")]),
    dict(id="wrong", tag="11:57 PM", lead=0.5, lines=[
        N("The lights blinked. The radio crackled.", hold=0.3),
        N("And suddenly, Kai was cleaning the counter again. The clock read eleven fifty-seven.", hold=0.4),
        N("At first, he thought he'd imagined it. Until the doorbell rang.")]),
    dict(id="second", tag="11:59 PM", lead=0.6, extra=1.1, lines=[
        N("The stranger stopped in exactly the same spot. His clothes were just as wet. His voice sounded identical.", hold=0.6),
        X("What time is it?", hold=0.6),
        N("Kai hesitated, then answered again.", hold=0.3),
        K("Eleven fifty-nine.", hold=0.4),
        N("And the clock jumped backward.")]),
    dict(id="testing", tag="11:57 PM", lead=0.4, lines=[
        N("Kai tried everything. He unplugged the radio. He moved a display stand. He even locked the front door.", hold=0.4),
        N("But every time he answered the stranger's question, everything returned to exactly how it was.", hold=0.4),
        X("What time is it?")]),
    dict(id="camera", tag="11:58 PM", lead=0.5, lines=[
        N("Then Kai noticed something even stranger.", hold=0.3),
        N("The security monitor was showing the last few minutes. But every time the loop restarted, a new recording appeared.", hold=0.5),
        N("And in every recording, Kai was talking to someone the camera couldn't see.")]),
    dict(id="realize", tag="11:58 PM", lead=0.6, extra=1.1, lines=[
        N("Kai finally understood one thing. The loop only happened when he answered.", hold=0.4),
        N("Every time he gave the stranger the time, the night repeated.", hold=0.5),
        N("So this time, he decided to stay silent.")]),
    dict(id="dont", tag="11:59 PM", lead=0.6, lines=[
        X("What time is it?", hold=0.2),
        N("the stranger asked. Kai said nothing. The man took one step closer.", hold=0.8),
        X("You heard me.", hold=0.9),
        N("Kai kept staring at the clock. Twenty seconds remained until midnight.", press=r"^Twenty", pk="start", owner="clock")]),
    dict(id="midnight", tag="11:59 PM", lead=0.3, lines=[
        N("The stranger leaned forward, and whispered.", at=3.4, hold=0.1),
        X("Please. Just tell me.", voice="xw"),
        N("Ten seconds.", at=10.0),
        N("Five.", at=15.0),
        N("Three.", at=17.0),
        N("Then the clock struck midnight.", at=18.85, hold=1.4),
        N("Every light went out. And when they came back on... he was gone.")]),
    dict(id="reveal", tag="12:00 AM", lead=0.5, extra=0.2, lines=[
        N("Kai ran outside, and never returned to that gas station.", hold=0.5),
        N("The next morning, his manager reviewed the security footage. Thirty-seven recordings of the same minute.", hold=0.4),
        N("In every single one, Kai was speaking to an empty doorway.", hold=0.3),
        N("Except the last.", hold=0.6),
        N("In that one... Kai was staring directly at the camera.", hold=0.8),
        K("What time is it?", voice="kw")]),
]
# Caption words differ from spoken words where digits read better. "~x" merges into the previous caption word.
CAP_SWAP = {("midnight", 2): {"Ten": "10"}, ("hook", 0): {"eleven": "11:59", "fifty-nine": "~", "PM,": "PM,"}, ("shift", 1): {"twenty": "20"},
            ("stranger", 3): {"Eleven": "11:59.", "fifty-nine.": "~"}, ("wrong", 1): {"eleven": "11:57.", "fifty-seven.": "~"},
            ("second", 3): {"Eleven": "11:59.", "fifty-nine.": "~"}, ("dont", 3): {"Twenty": "20"},
            ("midnight", 3): {"Five.": "5."}, ("midnight", 4): {"Three.": "3."},
            ("reveal", 1): {"Thirty-seven": "37"}}

# --------------------------------------------------------------------------------------
def trim(sig, thr=0.012):
    idx = np.where(np.abs(sig) > thr)[0]
    if len(idx) == 0:
        return sig
    return sig[max(0, idx[0] - int(0.03 * SR)):min(len(sig), idx[-1] + int(0.06 * SR))]


def write_wav(path, sig, sr=SR):
    pcm = (np.clip(sig, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def read_wav(path):
    with wave.open(path) as w:
        return np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float32) / 32768


_kokoro = None


def tts(text, voice="n"):
    name, speed = VOICES[voice]
    key = hashlib.md5(f"kokoro|{name}|{speed}|{text}".encode()).hexdigest()[:12]
    path = os.path.join(VO, f"{key}.wav")
    if os.path.exists(path):
        return read_wav(path), os.path.basename(path)
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(KOKORO, "kokoro-v1.0.onnx"), os.path.join(KOKORO, "voices-v1.0.bin"))
    s, sr = _kokoro.create(text, voice=name, speed=speed, lang="en-us")
    assert sr == SR
    s = trim(np.asarray(s, np.float32))
    write_wav(path, s)
    print("  tts:", voice, text)
    return s, os.path.basename(path)


# --------------------------------------------------------------------------------------
# Word alignment
def syllables(w):
    w = re.sub(r"[^a-z]", "", w.lower())
    if not w:
        return 1
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and not w.endswith(("le", "ee")) and n > 1:
        n -= 1
    return max(1, n)


def align(sig, words):
    """Return (start, end) seconds per word inside the clip.

    1. Predict every word boundary from syllable weights across the spoken span.
    2. Snap boundaries after punctuation to the nearest real pause (>= 40 ms), keeping time order.
    3. Snap the remaining boundaries to a nearby energy dip (within 120 ms), then re-spread words in between.
    """
    hop = int(0.01 * SR)
    env = np.sqrt(np.convolve(sig ** 2, np.ones(hop * 3) / (hop * 3), mode="same"))[::hop]
    ref = np.percentile(env, 95)

    def runs(th, min_len):
        q = env < th * ref
        out, i = [], 0
        while i < len(q):
            if q[i]:
                j = i
                while j < len(q) and q[j]:
                    j += 1
                if i > 2 and j < len(q) - 2 and j - i >= min_len:
                    out.append((i * 0.01, j * 0.01))
                i = j
            else:
                i += 1
        return out

    voiced = np.where(env >= 0.06 * ref)[0]
    s0, s1 = voiced[0] * 0.01, (voiced[-1] + 1) * 0.01
    wts = np.array([syllables(w) + 0.35 + (0.6 if re.search(r"[,.?!:;…]$", w) else 0) for w in words])
    pred = s0 + (s1 - s0) * np.concatenate([[0], np.cumsum(wts)]) / wts.sum()   # len(words)+1 boundaries
    starts, ends = pred[:-1].copy(), pred[1:].copy()
    pauses = runs(0.15, 4)
    dips = runs(0.22, 2)
    fixed = {0: (s0, s0), len(words): (s1, s1)}                # boundary index -> (end of prev word, start of next)
    last = s0
    for k, w in enumerate(words[:-1]):
        if not re.search(r"[,.?!:;…\"]$", w):
            continue
        b = pred[k + 1]
        cands = [p for p in pauses if p[0] > last + 0.05 and abs((p[0] + p[1]) / 2 - b) < 0.7]
        if cands:
            p = min(cands, key=lambda p: abs((p[0] + p[1]) / 2 - b))
            fixed[k + 1] = p
            last = p[1]
    # re-spread words between fixed boundaries, then snap inner boundaries to dips
    keys = sorted(fixed)
    for a, z in zip(keys, keys[1:]):
        t_a, t_z = fixed[a][1], fixed[z][0]
        seg = wts[a:z]
        cs = t_a + (t_z - t_a) * np.concatenate([[0], np.cumsum(seg)]) / seg.sum()
        for j in range(1, len(cs) - 1):
            near = [d for d in dips if abs((d[0] + d[1]) / 2 - cs[j]) < 0.12 and cs[j - 1] + 0.08 < (d[0] + d[1]) / 2 < cs[j + 1] - 0.08]
            if near:
                d = min(near, key=lambda d: abs((d[0] + d[1]) / 2 - cs[j]))
                cs[j] = (d[0] + d[1]) / 2
        for j in range(z - a):
            starts[a + j] = cs[j]
            ends[a + j] = cs[j + 1]
        starts[a] = t_a
        ends[z - 1] = t_z
    return list(zip(starts.tolist(), ends.tolist()))


def chunk_words(words):
    """Group word indices into 1-3 word caption chunks, breaking after punctuation."""
    out, cur = [], []
    for k, w in enumerate(words):
        cur.append(k)
        txt = " ".join(words[i] for i in cur)
        if len(cur) >= 3 or len(txt) >= 14 or re.search(r"[,.?!:;…]$", w):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def build():
    os.makedirs(VO, exist_ok=True)
    t = 0.0
    scenes, voices = [], []
    for sc in SCENES:
        start = t
        t += sc.get("lead", 0.0)
        lines, pauses = [], []
        for spec in sc["lines"]:
            text, voice = spec["text"], spec.get("voice", "n")
            if "at" in spec:
                want = ANCHOR[0] + spec["at"]
                if t > want + 0.05:
                    print(f"  ! {sc['id']}: '{text}' wanted at press+{spec['at']} but narration runs {t - want:.2f}s late")
                t = max(t, want)
            sig, fname = tts(text, voice)
            dur = len(sig) / SR
            words = text.split()
            wt = align(sig, words)
            swap = CAP_SWAP.get((sc["id"], len(lines)), {})
            toks = []                                   # (caption text, first word idx, last word idx)
            for k, w in enumerate(words):
                c = swap.get(w, w)
                if c.startswith("~") and toks:
                    toks[-1] = (toks[-1][0] + c[1:], toks[-1][1], k)
                else:
                    toks.append((c, k, k))
            caps = []
            for idxs in chunk_words([tk[0] for tk in toks]):
                c0 = t + wt[toks[idxs[0]][1]][0]
                c1 = t + wt[toks[idxs[-1]][2]][1]
                caps.append(dict(start=round(c0, 3), end=round(c1, 3), voice=voice,
                                 text=" ".join(toks[i][0] for i in idxs).upper().strip(",:;").replace('"', "")))
            merged = []
            for c in caps:
                if merged and (c["end"] - c["start"] < 0.38 or len(c["text"]) <= 4) and len(merged[-1]["text"]) + len(c["text"]) <= 20:
                    merged[-1]["text"] += " " + c["text"]
                    merged[-1]["end"] = c["end"]
                else:
                    merged.append(c)
            caps = merged
            for a_, b_ in zip(caps, caps[1:]):
                if b_["start"] - a_["end"] < 0.45:
                    a_["end"] = b_["start"]
            wl = [dict(w=w, s=round(t + a, 3), e=round(t + b, 3)) for w, (a, b) in zip(words, wt)]
            if "press" in spec:
                hit = next(w for w in wl if re.search(spec["press"], w["w"], re.I))
                pauses.append(dict(start=hit["e"] if spec.get("pk") == "end" else hit["s"], owner=spec.get("owner", "alex")))
                ANCHOR[0] = pauses[-1]["start"]
            lines.append(dict(text=text, voice=voice, file=f"assets/vo/{fname}", start=round(t, 3), end=round(t + dur, 3), words=wl, caps=caps))
            voices.append((sig, t, voice))
            t += dur + GAP + spec.get("hold", 0.0)
        t += sc.get("extra", 0.0) - GAP
        if "dur" in sc:
            if t - start > sc["dur"] + 0.01:
                print(f"  ! {sc['id']} is {t - start:.2f}s, longer than the {sc['dur']}s asked for")
            t = max(t, start + sc["dur"])
        for p in pauses:
            p["end"] = p["start"] + PAUSE
        scenes.append(dict(id=sc["id"], tag=sc["tag"], right=sc.get("right", "pauses"), start=round(start, 3), end=round(t, 3), lines=lines,
                           pauses=[dict(start=round(p["start"], 3), end=round(p["end"], 3), owner=p["owner"]) for p in pauses]))
    return scenes, voices, t


def word_time(scene, li, pat, end=False, nth=0):
    """Absolute time of the nth word in line li matching regex pat."""
    hits = [w for w in scene["lines"][li]["words"] if re.search(pat, w["w"], re.I)]
    w = hits[nth]
    return w["e"] if end else w["s"]


def events(scenes):
    """Scene-relative event times shared by the animation (timeline.json) and the sound effects."""
    S = {s["id"]: s for s in scenes}
    ev = {}

    def put(sid, name, at):
        ev.setdefault(sid, {})[name] = round(at - S[sid]["start"], 3)

    def L(sid, i, end=False):
        return S[sid]["lines"][i]["end" if end else "start"]

    def w(sid, li, pat, end=False):
        return word_time(S[sid], li, pat, end)

    put("hook", "walked", w("hook", 0, r"^walked"))
    put("hook", "asked", w("hook", 0, r"^asked"))
    put("hook", "q", L("hook", 1))
    put("hook", "answered", w("hook", 2, r"^answered"))
    put("hook", "flicker", w("hook", 2, r"^later"))
    put("hook", "black", w("hook", 2, r"^over", True) + 0.15)
    put("shift", "road", w("shift", 1, r"^nearest"))
    put("shift", "clock", L("shift", 2))
    put("shift", "radio", w("shift", 2, r"^home"))
    put("shift", "bell", S["shift"]["end"] - 0.45)
    put("stranger", "shelves", w("stranger", 0, r"^shelves"))
    put("stranger", "stood", w("stranger", 1, r"^stood"))
    put("stranger", "turn", w("stranger", 1, r"^asking"))
    put("stranger", "q", L("stranger", 2))
    put("stranger", "glance", L("stranger", 2, True))
    put("stranger", "answer", L("stranger", 3))
    put("wrong", "blink", w("wrong", 0, r"^blinked"))
    put("wrong", "crackle", w("wrong", 0, r"^crackled"))
    put("wrong", "reset", w("wrong", 1, r"^suddenly"))
    put("wrong", "clock", w("wrong", 1, r"^eleven"))
    put("wrong", "imagined", w("wrong", 2, r"^imagined"))
    put("wrong", "bell", w("wrong", 2, r"^doorbell"))
    put("second", "wet", w("second", 0, r"^wet"))
    put("second", "q", L("second", 1))
    put("second", "hes", L("second", 2))
    put("second", "answer", L("second", 3))
    put("second", "jump", w("second", 4, r"^jumped"))
    put("second", "drop", S["second"]["end"] - 0.7)
    put("testing", "unplug", w("testing", 0, r"^unplugged"))
    put("testing", "moved", w("testing", 0, r"^moved"))
    put("testing", "locked", w("testing", 0, r"^locked"))
    put("testing", "every", L("testing", 1))
    put("testing", "returned", w("testing", 1, r"^returned"))
    put("testing", "q", L("testing", 2))
    put("camera", "monitor", w("camera", 1, r"^monitor"))
    put("camera", "new", w("camera", 1, r"^new"))
    put("camera", "every", L("camera", 2))
    put("camera", "talk", w("camera", 2, r"^talking"))
    put("realize", "loop", w("realize", 0, r"^loop"))
    put("realize", "repeated", w("realize", 1, r"^repeated"))
    put("realize", "silent", w("realize", 2, r"^silent"))
    put("realize", "bell", S["realize"]["end"] - 0.55)
    put("dont", "q", L("dont", 0))
    put("dont", "nothing", w("dont", 1, r"^nothing"))
    put("dont", "step", w("dont", 1, r"^step"))
    put("dont", "heard", L("dont", 2))
    put("dont", "staring", L("dont", 3))
    put("dont", "twenty", ANCHOR[0])
    put("midnight", "twenty", ANCHOR[0])
    put("midnight", "lean", L("midnight", 0))
    put("midnight", "whisper", L("midnight", 1))
    put("midnight", "ten", L("midnight", 2))
    put("midnight", "five", L("midnight", 3))
    put("midnight", "three", L("midnight", 4))
    put("midnight", "midnight", ANCHOR[0] + 20.0)
    put("midnight", "on", w("midnight", 6, r"^back"))
    put("midnight", "gone", w("midnight", 6, r"^gone"))
    put("reveal", "twenty", ANCHOR[0])
    put("reveal", "morning", L("reveal", 1))
    put("reveal", "footage", w("reveal", 1, r"^footage"))
    put("reveal", "clips", L("reveal", 2))
    put("reveal", "last", L("reveal", 3))
    put("reveal", "stare", L("reveal", 4))
    put("reveal", "turn", w("reveal", 4, r"^staring"))
    put("reveal", "whisper", L("reveal", 5))
    put("reveal", "end", L("reveal", 5, True) + 0.05)
    return ev


# --------------------------------------------------------------------------------------
def soundtrack(scenes, voices, total, ev):
    n = int(total * SR) + SR
    rng = np.random.default_rng(13)
    S = {s["id"]: s for s in scenes}

    def E(sid, name):
        return S[sid]["start"] + ev[sid][name]

    def tt(sec):
        return np.arange(int(max(0.0, sec) * SR)) / SR

    def add(buf, sig, at, g=1.0):
        i = int(at * SR)
        if i < 0:
            sig, i = sig[-i:], 0
        if i >= n:
            return
        j = min(n, i + len(sig))
        buf[i:j] += sig[:j - i] * g

    def tone(f, sec, harm=(1, 0.4, 0.15), dec=3.0, att=0.006):
        x = tt(sec)
        return sum(a * np.sin(2 * np.pi * f * (k + 1) * x) for k, a in enumerate(harm)) * np.minimum(1, x / att) * np.exp(-x * dec)

    def noise(sec, lo, hi):
        m = max(2, int(sec * SR))
        spec = np.fft.rfft(rng.standard_normal(m))
        fr = np.fft.rfftfreq(m, 1 / SR)
        spec[(fr < lo) | (fr > hi)] = 0
        x = np.fft.irfft(spec, m)
        return x / (np.abs(x).max() + 1e-9)

    def env_ad(sec, a=0.5, r=0.8):
        x = tt(sec)
        return np.minimum(1, x / max(a, 1e-3)) * np.minimum(1, np.maximum(0, sec - x) / max(r, 1e-3))

    def pad(freqs, sec, bright=0.15):
        x = tt(sec)
        y = sum(np.sin(2 * np.pi * f * x + i) + bright * np.sin(2 * np.pi * f * 2.003 * x) for i, f in enumerate(freqs))
        return y / len(freqs) * env_ad(sec, 2.0, 2.0)

    def boom(at, g=0.3, f0=34):
        x = tt(2.5)
        add(sfx, np.sin(2 * np.pi * np.cumsum(f0 + 40 * np.exp(-x * 5)) / SR) * np.exp(-x * 1.3), at, g)

    # "world" volume: everything goes quiet in the blackouts and the final countdown
    world = np.ones(n)

    def duck(t0, t1, lvl, f=0.08):
        i0, i1 = int(t0 * SR), int(t1 * SR)
        k = int(f * SR)
        world[i0:i1] = np.minimum(world[i0:i1], lvl)
        if i0 - k > 0:
            world[i0 - k:i0] = np.minimum(world[i0 - k:i0], np.linspace(1, lvl, k))
        if i1 + k < n:
            world[i1:i1 + k] = np.minimum(world[i1:i1 + k], np.linspace(lvl, 1, k))

    duck(E("hook", "black"), S["hook"]["end"] + 0.2, 0.0, 0.03)
    t_tw = E("dont", "twenty")
    for i in range(int(20 * 10)):           # the last 20 seconds: the world slowly drains away
        a = t_tw + i * 0.1
        duck(a, a + 0.1, 1 - 0.75 * (i / 200), 0.0)
    duck(E("midnight", "midnight"), E("midnight", "on"), 0.0, 0.02)
    duck(E("reveal", "end"), total, 0.0, 0.02)

    # ---------------- ambience: rain, fluorescent hum, fridge hum, distant traffic
    amb = np.zeros(n)
    rain = noise(total, 900, 8000) * 0.6 + noise(total, 150, 900) * 0.4
    add(amb, rain, 0, 0.05)
    x = np.arange(n) / SR
    hum = (np.sin(2 * np.pi * 120 * x) + 0.4 * np.sin(2 * np.pi * 240 * x) + 0.15 * np.sign(np.sin(2 * np.pi * 120 * x))) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.13 * x))
    amb += hum * 0.008
    amb += np.sin(2 * np.pi * 58 * x) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * x)) * 0.012   # fridge
    for at in (E("shift", "road") - 0.5, 60.0, 98.0, 140.0):                                  # distant cars
        d = 3.0
        add(amb, noise(d, 200, 1500) * np.sin(np.pi * tt(d) / d) ** 2, at, 0.04)
    # thunder, twice, far away
    for at in (5.0, 104.0):
        d = 3.5
        add(amb, noise(d, 40, 300) * np.exp(-tt(d) * 1.2) * np.minimum(1, tt(d) / 0.3), at, 0.08)

    # ---------------- store radio: quiet lo-fi when it's on (with the loop resets it keeps coming back on)
    radio = np.zeros(n)

    def radio_on(t0, t1, g=0.035):
        if t1 <= t0:
            return
        d = t1 - t0
        y = np.zeros(int(d * SR) + 10)
        notes = [261.63, 329.63, 392.0, 349.23, 293.66, 392.0, 329.63, 261.63]
        bt = 0.5
        for k_ in range(int(d / bt)):
            f = notes[k_ % len(notes)]
            seg = tone(f, 0.6, (1, 0.3), 4)
            i = int(k_ * bt * SR)
            y[i:i + len(seg)] += seg[:len(y) - i]
            if k_ % 2 == 0:
                kk = tone(60, 0.2, (1,), 18)
                y[i:i + len(kk)] += kk[:len(y) - i] * 0.8
        y = y[:int(d * SR)] + noise(d, 3000, 7000) * 0.06     # small-speaker hiss
        add(radio, y * env_ad(d, 0.05, 0.05), t0, g)

    radio_on(0, E("shift", "radio"))
    radio_on(E("wrong", "reset"), E("testing", "unplug"))
    radio_on(E("testing", "moved") - 0.4, E("camera", "every") + 2.0, 0.03)
    radio_on(E("realize", "loop"), E("dont", "twenty") + 6.0, 0.025)

    # ---------------- music: low drones, a heartbeat in the countdown
    music = np.zeros(n)
    add(music, pad([55, 82.4, 110], total, 0.1), 0, 0.10)
    add(music, pad([58.27, 87.3, 116.5], S["camera"]["end"] - S["second"]["start"], 0.2), S["second"]["start"], 0.07)
    add(music, pad([138.6, 146.8], S["dont"]["end"] - S["realize"]["start"], 0.05), S["realize"]["start"], 0.03)
    for j in range(20):                                              # heartbeat, one per countdown second
        at = t_tw + j
        for d_, g_ in ((0.0, 0.16), (0.24, 0.1)):
            xx = tt(0.4)
            add(music, np.sin(2 * np.pi * np.cumsum(48 + 20 * np.exp(-xx * 25)) / SR) * np.exp(-xx * 9), at + d_, g_ * (0.6 + 0.4 * j / 20))

    # ---------------- voices
    vo, venv = np.zeros(n), np.zeros(n)
    for sig, t0, voice in voices:
        lvl = np.sqrt(np.mean(sig[np.abs(sig) > 0.1 * np.abs(sig).max()] ** 2)) + 1e-9
        y = sig * (0.2 / lvl) * GAIN.get(voice, 1.0)
        if voice in ("xw", "kw"):                                    # whisper: thin it out and add breath
            y = np.convolve(y, np.ones(6) / 6, mode="same") * 0.8 + noise(len(y) / SR, 2500, 7000) * 0.015 * (np.abs(y) > 0.01)
        add(vo, y, t0)
        add(venv, np.ones(len(sig)), t0)
    k = int(0.2 * SR)
    venv = np.convolve(venv, np.ones(k) / k, mode="same")

    # ---------------- sound effects
    sfx = np.zeros(n)

    def chime(at, g=0.12):
        add(sfx, tone(1318.5, 1.2, (1, 0.3), 3), at, g)
        add(sfx, tone(1046.5, 1.4, (1, 0.3), 2.6), at + 0.32, g)

    def flicker(at, g=0.1, k_=6):
        for j in range(k_):
            add(sfx, noise(0.03, 2000, 9000) * np.exp(-tt(0.03) * 120), at + j * rng.uniform(0.05, 0.12), g)
        add(sfx, noise(0.25, 60, 300) * np.exp(-tt(0.25) * 10), at, g * 0.8)

    def reset_fx(at):
        flicker(at - 0.35, 0.09)
        add(sfx, noise(0.5, 500, 6000)[::-1] * np.linspace(0, 1, int(0.5 * SR)) ** 3, at - 0.5, 0.06)  # reverse suck
        boom(at, 0.22)

    def step(at, g=0.05):
        add(sfx, noise(0.08, 200, 2500) * np.exp(-tt(0.08) * 40), at, g)
        add(sfx, noise(0.05, 3000, 8000) * np.exp(-tt(0.05) * 70), at + 0.02, g * 0.5)      # wet squelch

    def crackle(at, d=0.8, g=0.06):
        add(sfx, noise(d, 800, 6000) * (rng.random(int(d * SR)) > 0.7) * env_ad(d, 0.05, 0.2), at, g)

    def click(at, g=0.1):
        add(sfx, tone(2600, 0.04, (1, 0.3), 80), at, g)

    # hook
    chime(E("hook", "walked") - 0.6)
    for j in range(4):
        step(E("hook", "walked") + j * 0.6)
    boom(E("hook", "q") - 0.2, 0.12, 40)
    flicker(E("hook", "flicker"), 0.11)
    boom(E("hook", "black") - 0.05, 0.25)
    # shift: radio switched off, bell at the end
    click(E("shift", "radio"), 0.15)
    chime(E("shift", "bell"))
    # stranger: wet footsteps, then silence
    for j in range(5):
        step(S["stranger"]["start"] + 0.6 + j * 0.62)
    # wrong: blink, crackle, reset, bell
    flicker(E("wrong", "blink"), 0.12)
    crackle(E("wrong", "crackle"))
    reset_fx(E("wrong", "reset") - 0.2)
    chime(E("wrong", "bell") + 0.1)
    for j in range(4):
        step(E("wrong", "bell") + 0.9 + j * 0.62)
    # second
    reset_fx(E("second", "jump"))
    add(sfx, noise(0.12, 300, 2000) * np.exp(-tt(0.12) * 30), E("second", "drop") + 0.35, 0.05)   # cloth drops
    # testing: three resets, a plug pulled, a stand dragged, a lock clicks
    click(E("testing", "unplug"), 0.15)
    reset_fx(E("testing", "moved") - 0.4)
    add(sfx, noise(0.5, 150, 1200) * env_ad(0.5, 0.05, 0.2), E("testing", "moved") + 0.1, 0.06)
    reset_fx(E("testing", "locked") - 0.4)
    click(E("testing", "locked") + 0.3, 0.2)
    click(E("testing", "locked") + 0.38, 0.15)
    boom(E("testing", "returned"), 0.14, 45)
    reset_fx(S["testing"]["end"] - 0.1)
    # camera: tape beeps and a new recording ping, a distorted radio
    for j in range(5):
        add(sfx, tone(1760, 0.07, (1,), 40), E("camera", "new") + j * 0.32, 0.04)
    crackle(E("camera", "talk"), 2.5, 0.05)
    # realize: a breath, ticking seconds, the bell
    add(sfx, noise(1.4, 300, 3000) * env_ad(1.4, 0.6, 0.6), S["realize"]["start"] + 0.2, 0.03)
    for j in range(int(S["realize"]["end"] - E("realize", "repeated"))):
        click(E("realize", "repeated") + j, 0.05)
    chime(E("realize", "bell"))
    # dont: two slow wet steps, radio cuts off at 11:59:40
    step(E("dont", "step"), 0.07)
    step(E("dont", "step") + 1.4, 0.07)
    click(E("dont", "twenty") + 6.0, 0.12)
    # midnight: total blackout, lights hum back
    boom(E("midnight", "midnight"), 0.3, 30)
    add(sfx, noise(0.6, 60, 400) * env_ad(0.6, 0.02, 0.3), E("midnight", "on") - 0.1, 0.05)
    flicker(E("midnight", "on") - 0.1, 0.1)
    # reveal: door, running steps, a VHS hiss under the footage, the cut to black
    chime(S["reveal"]["start"] + 0.6, 0.08)
    for j in range(6):
        step(S["reveal"]["start"] + 0.9 + j * 0.3, 0.06)
    d = E("reveal", "end") - E("reveal", "footage")
    add(sfx, noise(d, 2000, 9000) * 0.5 * env_ad(d, 0.3, 0.05), E("reveal", "footage"), 0.02)
    boom(E("reveal", "stare"), 0.12, 42)

    mix = (amb * world + radio * world + sfx + music * (1 - 0.4 * np.clip(venv, 0, 1))) + vo
    mix[int(E("reveal", "end") * SR):] = 0
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    return mix


def main():
    scenes, voices, total = build()
    ev = events(scenes)
    for s in scenes:
        s["ev"] = ev.get(s["id"], {})
    nwords = sum(len(l["text"].split()) for s in scenes for l in s["lines"])
    speech = sum(len(v[0]) for v in voices) / SR
    print(f"total {total:.1f}s  words {nwords}  overall {nwords / total * 60:.0f} wpm  speech-only {nwords / speech * 60:.0f} wpm")
    for s in scenes:
        print(f"  {s['id']:9s} {s['start']:6.2f}-{s['end']:6.2f}  ({s['end'] - s['start']:.1f}s)  pauses {[(p['start'], p['end']) for p in s['pauses']]}")
        for l in s["lines"]:
            print(f"      {l['start']:6.2f}-{l['end']:6.2f} [{l['voice']}] {l['text']}")
    if os.environ.get("DRY"):
        return
    raw = os.path.join(ROOT, "public", "soundtrack_raw.wav")
    write_wav(raw, soundtrack(scenes, voices, total, ev))
    out = os.path.join(ROOT, "public", "soundtrack.wav")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", raw, "-af",
                        "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", "48000", out], check=True)
    os.remove(raw)
    tl = dict(fps=FPS, total=round(total, 3), durationInFrames=int(np.ceil(total * FPS)), scenes=scenes)
    with open(os.path.join(ROOT, "src", "timeline.json"), "w") as f:
        json.dump(tl, f, indent=1)


if __name__ == "__main__":
    sys.exit(main())
