#!/usr/bin/env python3
"""
Script, voiceover, word timings and soundtrack for "What If Everyone Became a Millionaire Overnight?".

  python3 tools/make_audio.py      # -> public/assets/vo/*.wav, public/soundtrack.wav, src/timeline.json

Voice: Kokoro (free, offline) "am_liam", the closest free voice to ElevenLabs "Mike" (0.82 speaker similarity,
measured against the real Mike clips in ../attractive-24h-v2/assets/vo). Clips are cached in public/assets/vo/.
Word timings come from a pause-anchored, syllable-weighted alignment of each line's audio.
Music, ambience and sound effects are synthesized with numpy.
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
BLEND = {"am_liam": 1.0}   # closest free voice to ElevenLabs "Mike" (speaker similarity 0.82, measured on real Mike clips)
SPEED = float(os.environ.get("VO_SPEED", "0.85"))
VOICE = "am_liam"
GAP = 0.5            # pause between lines inside a scene

# tag: top-left label (some scenes change it over time in Video.tsx).
SCENES = [
    dict(id="notify", tag="DAY 1 · 6:59 AM", world=None, hold={0: 0.6, 2: 0.3}, extra=1.0, lines=[
        "What if tomorrow morning, every single person on Earth woke up with one million dollars?",
        "Not just you.",
        "Your friends, your neighbors, even the person who delivers your pizza.",
        "Everyone."]),
    dict(id="morning", tag="DAY 1 · 7:05 AM", world=None, hold={1: 0.4}, extra=0.8, lines=[
        "At first, nobody believes it.",
        "Alex refreshes his banking app five times. The money is still there.",
        "Then the news confirms it.",
        "Overnight, billions of people have become millionaires."]),
    dict(id="spend", tag="DAY 1 · 9:00 AM", world=None, hold={1: 0.3}, extra=1.3, lines=[
        "By nine o'clock, everybody has the same idea.",
        "Buy the things they could never afford. New cars, expensive clothes, dream houses.",
        "Alex immediately opens a website to buy his first sports car."]),
    dict(id="problem", tag="DAY 1 · 2:00 PM", world=None, hold={0: 0.4, 2: 0.3}, extra=0.9, lines=[
        "But there's one tiny problem.",
        "Everyone wants the same things.",
        "The car dealership sells out. Houses disappear from listings.",
        "And suddenly, having a million dollars doesn't guarantee you can actually buy anything."]),
    dict(id="week1", tag="WEEK 1", world=None, hold={0: 0.4, 1: 0.3}, extra=0.9, lines=[
        "A week later, things start getting weird.",
        "Supermarkets are packed. Deliveries are delayed. Popular products vanish from shelves.",
        "Not because the world has run out of money... but because it can't produce everything fast enough."]),
    dict(id="work", tag="WEEK 2", world=None, hold={1: 0.4}, extra=0.9, lines=[
        "And there's another problem. Some people decide they don't need their jobs anymore.",
        "Alex quits the grocery store.",
        "But so do several delivery drivers, warehouse workers, and store employees.",
        "Suddenly, getting basic supplies becomes much harder."]),
    dict(id="prices", tag="WEEK 3", world=None, hold={2: 0.3}, extra=1.0, lines=[
        "Then prices begin climbing.",
        "Businesses have more customers than products, and many struggle to hire workers.",
        "Some raise prices. Others simply close.",
        "Alex still has almost a million dollars. But each week, that money buys less."]),
    dict(id="month1", tag="MONTH 1", world=None, hold={0: 0.3}, extra=0.9, lines=[
        "One month later, the world looks completely different.",
        "Some businesses offer huge wages to attract workers. Others can't afford to stay open.",
        "New factories and delivery services are needed... but building them takes time."]),
    dict(id="bakery", tag="MONTH 3", world=None, hold={0: 0.4, 1: 0.4}, extra=1.0, lines=[
        "One afternoon, Alex passes a bakery where he used to buy breakfast.",
        "The owner is still working. But the shelves are almost empty.",
        "She explains that her ingredients are expensive, and deliveries have become unreliable."]),
    dict(id="discover", tag="MONTH 3", world=None, hold={0: 0.5, 1: 0.4}, extra=1.3, lines=[
        "Alex realizes something important.",
        "Everyone received more money, but nobody received more food, houses, or time.",
        "So he starts helping at the bakery.",
        "And for the first time in weeks, something actually improves."]),
    dict(id="final", tag="MONTH 3", world=None, hold={0: 0.4, 1: 0.5}, extra=3.6, lines=[
        "Alex finally understands.",
        "Money can help you buy what exists. It can't magically create what everyone needs.",
        "So if you became a millionaire tomorrow... would you still go to work?"]),
]
# Caption words differ from spoken words where digits read better. "~x" merges into the previous caption word.
CAP_SWAP = {("notify", 0): {"one": "$1,000,000", "million": "~", "dollars?": "~?"},
            ("spend", 0): {"nine": "9"}, ("morning", 1): {"five": "5"}}


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


def tts(text):
    key = hashlib.md5(f"kokoro|{VOICE}|{SPEED}|{text}".encode()).hexdigest()[:12]
    path = os.path.join(VO, f"{key}.wav")
    if os.path.exists(path):
        return read_wav(path), os.path.basename(path)
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(KOKORO, "kokoro-v1.0.onnx"), os.path.join(KOKORO, "voices-v1.0.bin"))
    style = sum(w * _kokoro.get_voice_style(n) for n, w in BLEND.items())
    s, sr = _kokoro.create(text, voice=style, speed=SPEED, lang="en-us")
    assert sr == SR
    s = trim(np.asarray(s, np.float32))
    write_wav(path, s)
    print("  tts:", text)
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
    t = 0.35
    scenes, voices = [], []
    for sc in SCENES:
        start = t
        lines = []
        for text in sc["lines"]:
            sig, fname = tts(text)
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
                caps.append(dict(start=round(c0, 3), end=round(c1, 3),
                                 text=" ".join(toks[i][0] for i in idxs).upper().strip(",:;").replace('"', "")))
            # merge very short leftover chunks into the previous one
            merged = []
            for c in caps:
                if merged and (c["end"] - c["start"] < 0.38 or len(c["text"]) <= 4) and len(merged[-1]["text"]) + len(c["text"]) <= 20:
                    merged[-1]["text"] += " " + c["text"]
                    merged[-1]["end"] = c["end"]
                else:
                    merged.append(c)
            caps = merged
            # captions stay up until the next one starts (no flicker in short gaps)
            for a_, b_ in zip(caps, caps[1:]):
                if b_["start"] - a_["end"] < 0.45:
                    a_["end"] = b_["start"]
            lines.append(dict(text=text, file=f"assets/vo/{fname}", start=round(t, 3), end=round(t + dur, 3),
                              words=[dict(w=w, s=round(t + a, 3), e=round(t + b, 3)) for w, (a, b) in zip(words, wt)],
                              caps=caps))
            voices.append((sig, t))
            t += dur + GAP + sc.get("hold", {}).get(len(lines) - 1, 0.0)
        t += sc["extra"] - GAP
        scenes.append(dict(id=sc["id"], tag=sc["tag"], world=sc["world"], start=round(start, 3), end=round(t, 3),
                           lines=lines))
    return scenes, voices, t + 0.3


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

    s = S["notify"]
    put("notify", "vib", s["start"] + 0.9)
    put("notify", "clock", word_time(s, 0, r"^morning", end=True))
    put("notify", "reach", word_time(s, 0, r"^person"))
    put("notify", "million", word_time(s, 0, r"^million"))
    put("notify", "world", L("notify", 1) - 0.25)
    put("notify", "friends", word_time(s, 2, r"^friends"))
    put("notify", "neighbors", word_time(s, 2, r"^neighbors"))
    put("notify", "pizza", word_time(s, 2, r"^pizza"))
    put("notify", "everyone", L("notify", 3) - 0.25)
    s = S["morning"]
    put("morning", "refresh", word_time(s, 1, r"^refreshes"))
    put("morning", "still", word_time(s, 1, r"^still"))
    put("morning", "news", L("morning", 2) - 0.25)
    put("morning", "confirm", word_time(s, 2, r"^confirms"))
    put("morning", "party", L("morning", 3) - 0.25)
    s = S["spend"]
    put("spend", "cars", word_time(s, 1, r"^cars"))
    put("spend", "clothes", word_time(s, 1, r"^clothes"))
    put("spend", "houses", word_time(s, 1, r"^houses"))
    put("spend", "alex", L("spend", 2) - 0.25)
    put("spend", "buy", word_time(s, 2, r"^sports"))
    put("spend", "queue", L("spend", 2, True) + 0.1)
    s = S["problem"]
    put("problem", "sells", word_time(s, 2, r"^sells"))
    put("problem", "phone", word_time(s, 2, r"^houses") - 0.25)
    put("problem", "houses", word_time(s, 2, r"^disappear"))
    put("problem", "alex", L("problem", 3) - 0.25)
    s = S["week1"]
    put("week1", "store", L("week1", 1) - 0.25)
    put("week1", "delayed", word_time(s, 1, r"^delayed"))
    put("week1", "vanish", word_time(s, 1, r"^vanish"))
    put("week1", "graph", L("week1", 2) - 0.25)
    put("week1", "fast", word_time(s, 2, r"^fast"))
    s = S["work"]
    put("work", "quits", word_time(s, 1, r"^quits"))
    put("work", "drivers", L("work", 2) - 0.25)
    put("work", "manager", L("work", 3) - 0.25)
    s = S["prices"]
    put("prices", "climb", word_time(s, 0, r"^climbing"))
    put("prices", "cafe", L("prices", 1) - 0.25)
    put("prices", "raise", word_time(s, 2, r"^raise"))
    put("prices", "close", word_time(s, 2, r"^close"))
    put("prices", "alex", L("prices", 3) - 0.25)
    put("prices", "less", word_time(s, 3, r"^less"))
    s = S["month1"]
    put("month1", "hiring", L("month1", 1) - 0.25)
    put("month1", "closed", word_time(s, 1, r"^Others"))
    put("month1", "factory", L("month1", 2) - 0.25)
    put("month1", "trucks", word_time(s, 2, r"^building"))
    s = S["bakery"]
    put("bakery", "memory", word_time(s, 0, r"^used"))
    put("bakery", "inside", L("bakery", 1) - 0.25)
    put("bakery", "empty", word_time(s, 1, r"^empty"))
    put("bakery", "explain", L("bakery", 2))
    put("bakery", "flour", word_time(s, 2, r"^ingredients"))
    s = S["discover"]
    put("discover", "compare", L("discover", 1) - 0.25)
    put("discover", "help", L("discover", 2) - 0.25)
    put("discover", "improves", L("discover", 3) - 0.25)
    s = S["final"]
    put("final", "split", L("final", 1) - 0.3)
    put("final", "question", L("final", 2))
    put("final", "final", L("final", 2, True) + 0.25)
    return ev


# --------------------------------------------------------------------------------------
def soundtrack(scenes, voices, total, ev):
    n = int(total * SR) + SR
    rng = np.random.default_rng(23)
    S = {s["id"]: s for s in scenes}

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

    # ---------------- music: mood per section
    A, Bb, C, D, E_, F, G, B_ = 220.0, 233.08, 261.63, 293.66, 329.63, 349.23, 392.0, 246.94
    marks = [(0, "curious"), (E("notify", "million"), "happy"), (S["problem"]["start"], "mystery"),
             (S["week1"]["start"], "tense"), (S["prices"]["start"], "serious"), (S["month1"]["start"], "tense"),
             (S["bakery"]["start"], "warm"), (E("discover", "help"), "hopeful"), (S["final"]["start"], "calm")]

    def mood(tp):
        m = marks[0][1]
        for t0, mm in marks:
            if tp >= t0:
                m = mm
        return m

    music = np.zeros(n)
    beat = 60 / 84
    b, tp = 0, 0.0
    happy_prog = [[C, E_, G], [G / 2 * 2, B_, D * 2], [A, C * 2, E_ * 2], [F, A, C * 2]]
    minor_prog = [[A, C, E_], [F, A, C], [D, F, A], [E_, G, B_]]
    warm_prog = [[F, A, C * 2], [C, E_, G], [A, C * 2, E_ * 2], [G, B_, D * 2]]
    while tp < total:
        bar = (b // 4) % 4
        m = mood(tp)
        if m == "curious":
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
        elif m == "mystery":
            if b % 4 == 0:
                add(music, pad([A / 2, C, E_, F], beat * 4 + 1.2, 0.15), tp, 0.10)
            if b % 2 == 0:
                add(music, piano([E_, F, E_, D][bar] * 2, 2.0, 2.0), tp, 0.05)
        elif m in ("tense", "serious"):
            g = 0.75 if m == "serious" else 1.0
            ch = minor_prog[bar]
            if b % 4 == 0:
                add(music, pad([ch[0] / 2, ch[1] / 2, Bb / 2], beat * 4 + 1.2, 0.1), tp, 0.11 * g)
            add(music, tone(A / 4 if bar % 2 == 0 else F / 4, 0.4, (1, 0.5), 7), tp, 0.18 * g)
            add(music, noise(0.02, 5000, 10000) * np.exp(-tt(0.02) * 150), tp + beat / 2, 0.02 * g)
            if b % 2 == 1:
                add(music, piano(ch[2] * 2, 1.2, 3.0), tp, 0.04 * g)
        else:                                            # warm / hopeful / calm
            ch = warm_prog[bar]
            k = {"warm": 0.85, "hopeful": 1.15, "calm": 0.8}[m]
            if b % 4 == 0:
                add(music, pad([c / 2 for c in ch], beat * 4 + 1.2, 0.3), tp, 0.11 * k)
                add(music, tone(ch[0] / 4, beat * 4, (1, 0.3), 0.6), tp, 0.14 * k)
            for e, f in enumerate(ch if b % 2 == 0 else ch[::-1]):
                add(music, piano(f * 2, 2.0, 2.0), tp + e * beat / 3, 0.045 * k)
            if m == "hopeful" and b % 2 == 0:
                add(music, kick(), tp, 0.12)
        b += 1
        tp += beat
    # short swell at the million reveal
    sw = tt(1.6)
    add(music, pad([C, E_, G, C * 2], 1.8, 0.4) * np.minimum(1, sw.size and np.ones(int(1.8 * SR))), E("notify", "million") - 0.2, 0.16)
    # final question: soft held chord, everything else fades
    fq = E("final", "final")
    j0 = int((fq - 0.3) * SR)
    music[j0:] *= np.linspace(1, 0.3, n - j0)
    add(music, pad([F / 2, A / 2, C, E_], total - fq + 0.5, 0.2), fq - 0.2, 0.12)

    # ---------------- voice + ducking
    vo, venv = np.zeros(n), np.zeros(n)
    for sig, t0 in voices:
        lvl = np.sqrt(np.mean(sig[np.abs(sig) > 0.1 * np.abs(sig).max()] ** 2)) + 1e-9
        add(vo, sig * (0.2 / lvl), t0)
        add(venv, np.ones(len(sig)), t0)
    k = int(0.2 * SR)
    venv = np.convolve(venv, np.ones(k) / k, mode="same")
    music *= 1 - 0.5 * np.clip(venv, 0, 1)

    # ---------------- ambience
    amb = np.zeros(n)

    def bed(t0, t1, lo, hi, g):
        add(amb, noise(t1 - t0, lo, hi) * env_ad(t1 - t0, 0.4, 0.4), t0, g)

    def murmur(t0, t1, g):
        m = noise(t1 - t0, 250, 1400)
        x = tt(t1 - t0)
        add(amb, m * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * x) * np.sin(2 * np.pi * 0.7 * x)) * env_ad(t1 - t0, 0.4, 0.4), t0, g)

    def birds(t0, t1, g):
        tp_ = t0 + 0.3
        while tp_ < t1:
            f0 = rng.uniform(2600, 4200)
            for c in range(rng.integers(2, 5)):
                x = tt(0.09)
                add(amb, np.sin(2 * np.pi * np.cumsum(f0 + 900 * np.sin(x * 60)) / SR) * np.sin(np.pi * x / 0.09), tp_ + c * 0.12, g)
            tp_ += rng.uniform(0.9, 2.0)

    def st(sid):
        return S[sid]["start"], S[sid]["end"]

    birds(*st("notify"), 0.03)
    murmur(E("notify", "everyone"), S["notify"]["end"], 0.04)
    murmur(E("morning", "party"), S["morning"]["end"], 0.05)
    murmur(*st("spend"), 0.025)
    murmur(*st("problem"), 0.03)
    murmur(*st("week1"), 0.05)
    bed(*st("work"), 60, 600, 0.03)
    murmur(*st("prices"), 0.03)
    bed(*st("month1"), 80, 900, 0.03)
    bed(*st("bakery"), 80, 900, 0.02)
    murmur(*st("discover"), 0.02)
    bed(*st("final"), 60, 400, 0.015)

    # ---------------- sound effects
    sfx = np.zeros(n)

    def whoosh(at, g=0.07, d=0.45):
        add(sfx, noise(d, 500, 5000) * np.sin(np.pi * tt(d) / d) ** 2, at, g)

    def ping(at, g=0.16):
        add(sfx, tone(1568, 0.25, (1, 0.3), 14), at, g)
        add(sfx, tone(2093, 0.22, (1, 0.3), 16), at + 0.1, g * 0.8)

    def kaching(at, g=0.3):
        nz = noise(0.08, 3000, 9000) * np.exp(-tt(0.08) * 50)
        bell = tone(2637, 0.6, (1, 0.5, 0.2), 5) + tone(3520, 0.6, (1, 0.3), 6)
        add(sfx, nz, at, g)
        add(sfx, bell, at + 0.06, g * 0.6)

    def stamp(at, g=0.3):
        add(sfx, kick(), at, g)
        add(sfx, noise(0.06, 300, 3000) * np.exp(-tt(0.06) * 60), at, g * 0.8)

    def click(at, g=0.12):
        add(sfx, tone(2400, 0.05, (1, 0.3), 70), at, g)

    for s in scenes[1:]:
        whoosh(s["start"] - 0.2)
    # notify: phone buzz, clock flip, bank notification
    x = tt(0.6)
    buzz = np.sign(np.sin(2 * np.pi * 160 * x)) * 0.4 * (0.6 + 0.4 * np.sin(2 * np.pi * 26 * x))
    for j in range(3):
        add(sfx, buzz, E("notify", "vib") + j * 0.75, 0.12)
    click(E("notify", "clock"), 0.2)
    ping(E("notify", "million") - 0.1, 0.2)
    kaching(E("notify", "million") + 0.6, 0.25)
    for j, nm in enumerate(("friends", "neighbors", "pizza")):
        ping(E("notify", nm), 0.12)
    for j in range(8):
        ping(E("notify", "everyone") + j * 0.16, 0.06)
    # morning: refresh x5, TV news sting, cheering
    for j in range(5):
        click(E("morning", "refresh") + j * 0.34, 0.14)
    add(sfx, tone(880, 0.5, (1, 0.5), 5), E("morning", "news") + 0.3, 0.1)
    add(sfx, tone(1320, 0.5, (1, 0.5), 5), E("morning", "news") + 0.45, 0.08)
    d = 3.0
    add(sfx, noise(d, 300, 3500) * env_ad(d, 0.5, 1.4), E("morning", "party"), 0.12)
    # spend: carts and clicks, purchase ka-ching
    for nm in ("cars", "clothes", "houses"):
        ping(E("spend", nm), 0.1)
    click(E("spend", "buy"), 0.2)
    kaching(E("spend", "buy") + 0.15, 0.3)
    # problem: SOLD stamps
    stamp(E("problem", "sells"), 0.3)
    for j in range(4):
        stamp(E("problem", "houses") + 0.2 + j * 0.3, 0.18)
    add(sfx, tone(330, 0.5, (1, 0.5), 5), E("problem", "phone") + 0.4, 0.06)
    # week 1: page flip, scanner beeps, truck horn
    add(sfx, noise(0.25, 1000, 6000) * np.sin(np.pi * tt(0.25) / 0.25), S["week1"]["start"] + 0.2, 0.1)
    for j in range(6):
        add(sfx, tone(2800, 0.08, (1,), 40), E("week1", "store") + 0.5 + j * 0.45, 0.06)
    for f in (370, 466):
        add(sfx, tone(f, 0.5, (1, 0.6, 0.4), 1.5), E("week1", "delayed") + 0.2, 0.06)
    # work: badge down, papers piling
    add(sfx, noise(0.05, 800, 4000) * np.exp(-tt(0.05) * 60), E("work", "quits") + 0.5, 0.25)
    add(sfx, noise(0.05, 800, 4000) * np.exp(-tt(0.05) * 60), E("work", "quits") + 1.3, 0.2)
    for j in range(6):
        add(sfx, noise(0.12, 1500, 7000) * np.exp(-tt(0.12) * 25), E("work", "manager") + 0.3 + j * 0.35, 0.05)
    # prices: tag flips + register, closed sign knock
    for j in range(5):
        click(E("prices", "climb") + j * 0.4, 0.12)
    kaching(E("prices", "raise"), 0.18)
    stamp(E("prices", "close") + 0.2, 0.15)
    # month 1: construction time-lapse
    for j in range(10):
        add(sfx, noise(0.04, 800, 5000) * np.exp(-tt(0.04) * 90), E("month1", "factory") + 0.3 + j * 0.28, 0.08)
    # bakery: door bell
    add(sfx, tone(1318.5, 0.6, (1, 0.3), 5), E("bakery", "inside") + 0.3, 0.06)
    add(sfx, tone(1760, 0.6, (1, 0.3), 5), E("bakery", "inside") + 0.42, 0.05)
    # discover: flour thuds, register for the first customers
    for j in range(3):
        stamp(E("discover", "help") + 0.6 + j * 0.6, 0.08)
    kaching(E("discover", "improves") + 1.2, 0.15)
    # final
    x = tt(1.6)
    add(sfx, np.sin(2 * np.pi * np.cumsum(55 + 25 * np.exp(-x * 3)) / SR) * np.exp(-x * 2), E("final", "final"), 0.2)

    mix = vo + music * 0.85 + amb + sfx
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    f = int(1.2 * SR)
    mix[-f:] *= np.linspace(1, 0, f)
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
        print(f"  {s['id']:9s} {s['start']:6.2f}-{s['end']:6.2f}  ({s['end'] - s['start']:.1f}s)")
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
