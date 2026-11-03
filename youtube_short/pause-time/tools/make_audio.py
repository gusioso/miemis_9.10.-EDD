#!/usr/bin/env python3
"""
Script, voiceover, word timings and soundtrack for "What If You Could PAUSE TIME for 10 Seconds Every Day?".
The user sends the story one scene at a time; each scene is added to SCENES (and to events()/sfx below).

  python3 tools/make_audio.py      # -> public/assets/vo/*.wav, public/soundtrack.wav, src/timeline.json

Narrator: Kokoro (free, offline) "am_liam", the closest free voice to ElevenLabs "Mike" (0.82 speaker similarity).
Mia: Kokoro "af_heart". Clips are cached in public/assets/vo/.
Every pause lasts exactly 10.0 s from the press. Lines can be pinned to the countdown with at= (seconds after press).
The animation and the sound read the same timeline.json.
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
VOICES = {"n": ("am_liam", float(os.environ.get("VO_SPEED", "0.88"))), "mia": ("af_heart", 0.92)}
GAP = 0.45           # pause between lines inside a scene
PAUSE = 10.0         # seconds the world stays frozen


def M(text, **k):
    """A line spoken by Mia."""
    return dict(text=text, voice="mia", **k)


def N(text, **k):
    return dict(text=text, voice="n", **k)


# lead = silence before the first line. press = regex of the word where time freezes (pk = "start"/"end" of that word,
# owner = whose button). at = start this line no earlier than press + at seconds. dur = pad the scene to this length.
SCENES = [
    dict(id="hook", tag=None, lead=0.75, dur=13.0, lines=[
        N("What if you could freeze the entire world for ten seconds every day?", press=r"^freeze", pk="end", owner="alex", hold=0.45),
        N("Rain stops falling. Cars stop moving.", hold=0.4),
        N("And you're the only one who can move...", hold=0.15),
        N("or so you think.")]),
    # Scenes 2 and 3 as the user sent them (same story beats as the Millionaire Short), timed to 16 s each.
    dict(id="morning", tag="DAY 1 · 8:00 AM", right="bank", lead=0.4, dur=16.0, lines=[
        N("At first, nobody believes it.", hold=0.3),
        N("Alex refreshes his banking app five times. The money is still there.", hold=1.3),
        N("Then the news confirms it.", hold=0.3),
        N("Overnight, billions of people have become millionaires.")]),
    dict(id="spend", tag="DAY 1 · 9:00 AM", right="bank", lead=0.4, dur=16.0, lines=[
        N("By nine o'clock, everybody has the same idea.", hold=0.3),
        N("Buy the things they could never afford. New cars, expensive clothes, dream houses.", hold=0.4),
        N("Alex immediately opens a website to buy his first sports car.")]),
    dict(id="problem", tag="DAY 1 · 2:00 PM", right="bank", lead=0.4, dur=16.0, lines=[
        N("But there's one tiny problem.", hold=0.4),
        N("Everyone wants the same things.", hold=0.4),
        N("The car dealership sells out. Houses disappear from listings.", hold=0.4),
        N("And suddenly, having a million dollars doesn't guarantee you can actually buy anything.")]),
    dict(id="week1", tag="WEEK 1", right="bank", lead=0.4, dur=16.0, lines=[
        N("A week later, things start getting weird.", hold=0.4),
        N("Supermarkets are packed. Deliveries are delayed. Popular products vanish from shelves.", hold=0.3),
        N("Not because the world has run out of money, but because it can't produce everything fast enough.")]),
]
# Caption words differ from spoken words where digits read better. "~x" merges into the previous caption word.
CAP_SWAP = {("hook", 0): {"ten": "10"}, ("morning", 1): {"five": "5"}, ("spend", 0): {"nine": "9"}}

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
                want = pauses[-1]["start"] + spec["at"]
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

    s = S["hook"]
    p0 = s["pauses"][0]["start"]
    put("hook", "freeze", p0)
    put("hook", "resume", p0 + PAUSE)
    put("hook", "rain", word_time(s, 1, r"^Rain"))
    put("hook", "cars", word_time(s, 1, r"^Cars"))
    put("hook", "alex", L("hook", 2) - 0.9)
    put("hook", "only", word_time(s, 2, r"^only"))
    put("hook", "touch", word_time(s, 2, r"^move"))
    put("hook", "think", L("hook", 3))
    s = S["morning"]
    put("morning", "refresh", word_time(s, 1, r"^refreshes"))
    put("morning", "still", word_time(s, 1, r"^still"))
    put("morning", "news", L("morning", 2) - 0.6)
    put("morning", "tvon", word_time(s, 2, r"^news"))
    put("morning", "confirm", word_time(s, 2, r"^confirms"))
    put("morning", "party", L("morning", 3) - 0.25)
    put("morning", "calls", word_time(s, 3, r"^millionaires") - 0.2)
    s = S["spend"]
    put("spend", "cars", word_time(s, 1, r"^cars"))
    put("spend", "clothes", word_time(s, 1, r"^clothes"))
    put("spend", "houses", word_time(s, 1, r"^houses"))
    put("spend", "alex", L("spend", 2) - 0.25)
    put("spend", "buy", word_time(s, 2, r"^sports"))
    put("spend", "queue", L("spend", 2, True) + 0.25)
    s = S["problem"]
    put("problem", "customer", L("problem", 1) - 0.2)
    put("problem", "sells", word_time(s, 2, r"^sells"))
    put("problem", "phone", word_time(s, 2, r"^Houses") - 0.25)
    put("problem", "houses", word_time(s, 2, r"^disappear"))
    put("problem", "alex", L("problem", 3) - 0.25)
    s = S["week1"]
    put("week1", "store", L("week1", 1) - 0.25)
    put("week1", "delayed", word_time(s, 1, r"^Deliveries") - 0.25)
    put("week1", "vanish", word_time(s, 1, r"^Popular") - 0.2)
    put("week1", "graph", L("week1", 2) - 0.25)
    put("week1", "fast", word_time(s, 2, r"^fast"))
    return ev


# --------------------------------------------------------------------------------------
def soundtrack(scenes, voices, total, ev):
    n = int(total * SR) + SR
    rng = np.random.default_rng(29)
    S = {s["id"]: s for s in scenes}
    pauses = [p for s in scenes for p in s["pauses"]]

    def E(sid, name):
        return S[sid]["start"] + ev[sid][name]

    def tt(sec):
        return np.arange(int(sec * SR)) / SR

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
        return np.minimum(1, x / a) * np.minimum(1, np.maximum(0, sec - x) / r)

    def pad(freqs, sec, bright=0.25):
        x = tt(sec)
        y = sum(np.sin(2 * np.pi * f * x + i) + bright * np.sin(2 * np.pi * f * 2.003 * x) for i, f in enumerate(freqs))
        return y / len(freqs) * env_ad(sec, 1.2, 1.4)

    def piano(f, sec=2.0, dec=2.0):
        return tone(f, sec, (1, 0.45, 0.2, 0.08), dec, 0.004)

    def kick():
        x = tt(0.25)
        return np.sin(2 * np.pi * np.cumsum(48 + 80 * np.exp(-x * 28)) / SR) * np.exp(-x * 12)

    # "world" gate: 1 while time runs, ~0 inside a pause (music and ambience drop out with the world).
    gate = np.ones(n)
    for p in pauses:
        i0, i1 = int(p["start"] * SR), int(p["end"] * SR)
        f0, f1 = int(0.08 * SR), int(0.12 * SR)
        gate[i0:i1] = 0.04
        gate[max(0, i0 - f0):i0] = np.linspace(1, 0.04, f0)[-(i0 - max(0, i0 - f0)):]
        k = min(n, i1 + f1) - i1
        gate[i1:i1 + k] = np.linspace(0.04, 1, f1)[:k]

    # ---------------- music: mood per section
    A, C, D, E_, F, G, B_ = 220.0, 261.63, 293.66, 329.63, 349.23, 392.0, 246.94
    marks = [(0, "tense"), (S["morning"]["start"] - 0.1, "curious"), (E("morning", "confirm"), "happy"),
             (S["problem"]["start"], "mystery"), (S["week1"]["start"], "tense")]

    def mood(tp):
        m = marks[0][1]
        for t0, mm in marks:
            if tp >= t0:
                m = mm
        return m

    music = np.zeros(n)
    beat = 60 / 92
    b, tp = 0, 0.0
    minor_prog = [[A, C, E_], [F, A, C], [D, F, A], [E_, G, B_]]
    happy_prog = [[C, E_, G], [G, B_, D * 2], [A, C * 2, E_ * 2], [F, A, C * 2]]
    while tp < total:
        bar = (b // 4) % 4
        m = mood(tp)
        if m == "tense":
            ch = minor_prog[bar]
            if b % 4 == 0:
                add(music, pad([ch[0] / 2, ch[1] / 2, ch[2] / 2], beat * 4 + 1.2, 0.12), tp, 0.12)
            add(music, tone(A / 4 if bar % 2 == 0 else F / 4, 0.4, (1, 0.5), 7), tp, 0.2)
            add(music, noise(0.02, 5000, 10000) * np.exp(-tt(0.02) * 150), tp + beat / 2, 0.025)
            add(music, piano([E_, A, C * 2, B_][b % 4] * 2, 1.0, 3.5), tp + beat / 2, 0.05)
        elif m == "mystery":
            if b % 4 == 0:
                add(music, pad([A / 2, C, E_, F], beat * 4 + 1.2, 0.15), tp, 0.10)
            if b % 2 == 0:
                add(music, piano([E_, F, E_, D][bar] * 2, 2.0, 2.0), tp, 0.05)
        elif m == "curious":
            if b % 4 == 0:
                add(music, pad([A / 2, C, E_], beat * 4 + 1.2, 0.2), tp, 0.09)
            add(music, piano([E_ * 2, C * 2, A, B_][b % 4], 1.4, 3.0), tp, 0.05)
        elif m == "happy":
            ch = happy_prog[bar]
            add(music, kick(), tp, 0.22)
            if b % 2:
                add(music, noise(0.1, 1500, 7000) * np.exp(-tt(0.1) * 32), tp, 0.05)
            add(music, noise(0.03, 6000, 10000) * np.exp(-tt(0.03) * 90), tp + beat / 2, 0.03)
            for e in range(2):
                add(music, piano(ch[(b * 2 + e) % 3] * 2, 0.9, 4.0), tp + e * beat / 2, 0.07)
            if b % 4 == 0:
                add(music, tone(ch[0] / 2, beat * 4, (1, 0.4, 0.2), 0.8), tp, 0.16)
        b += 1
        tp += beat
    music *= gate

    # ---------------- voice + ducking
    vo, venv = np.zeros(n), np.zeros(n)
    for sig, t0, voice in voices:
        lvl = np.sqrt(np.mean(sig[np.abs(sig) > 0.1 * np.abs(sig).max()] ** 2)) + 1e-9
        add(vo, sig * (0.2 / lvl), t0)
        add(venv, np.ones(len(sig)), t0)
    k = int(0.2 * SR)
    venv = np.convolve(venv, np.ones(k) / k, mode="same")
    music *= 1 - 0.45 * np.clip(venv, 0, 1)

    # ---------------- ambience (stops with the world)
    amb = np.zeros(n)

    def bed(t0, t1, lo, hi, g):
        add(amb, noise(t1 - t0, lo, hi) * env_ad(t1 - t0, 0.3, 0.3), t0, g)

    def rain(t0, t1, g):
        d = t1 - t0
        bed(t0, t1, 1200, 9000, g)
        bed(t0, t1, 200, 900, g * 0.5)
        tp_ = t0
        while tp_ < t1:                                  # individual drops on cars / puddles
            add(amb, noise(0.03, 2000, 8000) * np.exp(-tt(0.03) * 120), tp_, g * rng.uniform(0.2, 0.6))
            tp_ += rng.uniform(0.02, 0.09)
        return d

    rain(0, S["hook"]["end"] + 0.3, 0.075)

    def murmur(t0, t1, g):
        m = noise(t1 - t0, 250, 1400)
        x = tt(t1 - t0)
        add(amb, m * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * x) * np.sin(2 * np.pi * 0.7 * x)) * env_ad(t1 - t0, 0.4, 0.4), t0, g)

    murmur(E("morning", "party"), S["morning"]["end"], 0.05)
    murmur(S["spend"]["start"], S["spend"]["end"], 0.025)
    murmur(S["problem"]["start"], S["problem"]["end"], 0.03)
    murmur(S["week1"]["start"], S["week1"]["end"], 0.05)
    add(amb, noise(1.6, 300, 2500) * np.sin(np.pi * tt(1.6) / 1.6) ** 2, 0.1, 0.05)      # car swish
    for j in range(3):                                   # bird before the freeze
        x = tt(0.09)
        add(amb, np.sin(2 * np.pi * np.cumsum(3400 + 900 * np.sin(x * 60)) / SR) * np.sin(np.pi * x / 0.09), 0.25 + j * 0.13, 0.03)
    amb *= gate

    # ---------------- sound effects
    sfx = np.zeros(n)

    def whoosh(at, g=0.07, d=0.45):
        add(sfx, noise(d, 500, 5000) * np.sin(np.pi * tt(d) / d) ** 2, at, g)

    def freeze_fx(at, g=0.3):
        """Time stops: a downward 'suck' sweep into a low boom, then silence."""
        d = 0.5
        x = tt(d)
        sweep = np.sin(2 * np.pi * np.cumsum(1800 * np.exp(-x * 7) + 60) / SR) * np.exp(-x * 3)
        add(sfx, sweep * np.minimum(1, x / 0.02), at - 0.05, g * 0.35)
        add(sfx, noise(0.35, 300, 4000)[::-1] * np.linspace(0, 1, int(0.35 * SR)) ** 2, at - 0.35, g * 0.4)
        x = tt(2.2)
        add(sfx, np.sin(2 * np.pi * np.cumsum(38 + 30 * np.exp(-x * 4)) / SR) * np.exp(-x * 1.6), at, g)

    def resume_fx(at, g=0.25):
        """Time snaps back: a rising sweep and a soft crack."""
        d = 0.45
        x = tt(d)
        add(sfx, noise(d, 600, 6000) * (x / d) ** 2, at - d, g * 0.5)
        add(sfx, np.sin(2 * np.pi * np.cumsum(200 + 1400 * (x / d) ** 2) / SR) * (x / d) ** 2, at - d, g * 0.25)
        add(sfx, noise(0.08, 1000, 9000) * np.exp(-tt(0.08) * 40), at, g * 0.6)

    def pulse(at, g=0.2):
        """Deep cinematic heartbeat pulse: one per countdown second."""
        x = tt(0.6)
        thump = np.sin(2 * np.pi * np.cumsum(46 + 24 * np.exp(-x * 20)) / SR) * np.exp(-x * 7)
        add(sfx, thump, at, g)
        add(sfx, thump * 0.5, at + 0.22, g)

    def drone(t0, t1, g=0.05):
        x = tt(t1 - t0)
        y = (np.sin(2 * np.pi * 55 * x) + 0.5 * np.sin(2 * np.pi * 82.4 * x + 1) + 0.25 * np.sin(2 * np.pi * 110.3 * x)) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.25 * x))
        add(sfx, y * env_ad(t1 - t0, 0.6, 0.4), t0, g)

    for p in pauses:
        freeze_fx(p["start"])
        drone(p["start"] + 0.2, p["end"], 0.05)
        for j in range(10):
            pulse(p["start"] + j, 0.16 if j < 7 else 0.2)
        resume_fx(p["end"])
    for s in scenes[1:]:
        whoosh(s["start"] - 0.2)
    # hook: raindrop touch (tiny glassy plink), yellow silhouette sting
    add(sfx, tone(2637, 0.6, (1, 0.4), 6), E("hook", "touch") + 0.15, 0.05)
    add(sfx, tone(3951, 0.5, (1,), 8), E("hook", "touch") + 0.2, 0.03)
    x = tt(1.2)
    add(sfx, (np.sin(2 * np.pi * 466 * x) + np.sin(2 * np.pi * 494 * x)) * np.exp(-x * 2.5) * np.minimum(1, x / 0.03), E("hook", "think"), 0.035)

    def ping(at, g=0.16):
        add(sfx, tone(1568, 0.25, (1, 0.3), 14), at, g)
        add(sfx, tone(2093, 0.22, (1, 0.3), 16), at + 0.1, g * 0.8)

    def click(at, g=0.12):
        add(sfx, tone(2400, 0.05, (1, 0.3), 70), at, g)

    def kaching(at, g=0.3):
        add(sfx, noise(0.08, 3000, 9000) * np.exp(-tt(0.08) * 50), at, g)
        add(sfx, tone(2637, 0.6, (1, 0.5, 0.2), 5) + tone(3520, 0.6, (1, 0.3), 6), at + 0.06, g * 0.6)

    # morning: refresh x5, TV click + news sting, cheers, phone notifications
    for j in range(5):
        click(E("morning", "refresh") + j * 0.34, 0.14)
    click(E("morning", "tvon"), 0.2)
    add(sfx, tone(880, 0.5, (1, 0.5), 5), E("morning", "tvon") + 0.3, 0.1)
    add(sfx, tone(1320, 0.5, (1, 0.5), 5), E("morning", "tvon") + 0.45, 0.08)
    d = S["morning"]["end"] - E("morning", "party")
    add(sfx, noise(d, 300, 3500) * env_ad(d, 0.5, 1.0), E("morning", "party"), 0.1)
    for j in range(7):
        ping(E("morning", "party") + 0.4 + j * 0.55 + (j % 2) * 0.17, 0.07)
    # spend: carts and clicks, purchase ka-ching, dealership queue footsteps
    for nm in ("cars", "clothes", "houses"):
        ping(E("spend", nm), 0.1)
    click(E("spend", "buy"), 0.2)
    kaching(E("spend", "buy") + 0.15, 0.3)
    for j in range(10):
        add(sfx, noise(0.05, 400, 2500) * np.exp(-tt(0.05) * 60), E("spend", "queue") + 0.3 + j * 0.22, 0.05)

    def stamp(at, g=0.3):
        add(sfx, kick(), at, g)
        add(sfx, noise(0.06, 300, 3000) * np.exp(-tt(0.06) * 60), at, g * 0.8)

    # problem: SOLD stamps, sad phone blip
    stamp(E("problem", "sells"), 0.3)
    for j in range(4):
        stamp(E("problem", "houses") + 0.2 + j * 0.3, 0.18)
    add(sfx, tone(330, 0.5, (1, 0.5), 5), E("problem", "phone") + 0.4, 0.06)
    # week 1: calendar flip, scanner beeps, truck horn
    add(sfx, noise(0.25, 1000, 6000) * np.sin(np.pi * tt(0.25) / 0.25), S["week1"]["start"] + 0.6, 0.1)
    for j in range(6):
        add(sfx, tone(2800, 0.08, (1,), 40), E("week1", "store") + 0.5 + j * 0.45, 0.06)
    for f in (370, 466):
        add(sfx, tone(f, 0.5, (1, 0.6, 0.4), 1.5), E("week1", "delayed") + 0.5, 0.06)

    mix = vo + music * 0.85 + amb + sfx
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
