#!/usr/bin/env python3
"""
Script, voiceover, word timings and soundtrack for "What If Everyone Had a Lie Counter?".

  python3 tools/make_audio.py      # -> public/assets/vo/*.wav, public/soundtrack.wav, src/timeline.json

Voice: Kokoro (free, offline) "am_liam". It scored closest to the ElevenLabs "Mike" voice (0.82 speaker similarity on the
real Mike clips in ../attractive-24h-v2/assets/vo; blends and pitch-shifted variants scored lower).
Clips are cached in public/assets/vo/. Word timings come from a pause-anchored, syllable-weighted alignment
of each line's audio, so captions follow the voice. Music, ambience and sound effects are synthesized with numpy.

World lie totals in the HUD are illustrative estimates built from Serota et al. (2010): people tell about
1.65 lies a day on average, i.e. ~13 billion a day for 8.1 billion people. The story assumes that rate falls
once everyone can see the counters.
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
B = 1_000_000_000

# tag: top-left label. world: (from, to) world lie total shown top-right during the scene (None = hidden).
SCENES = [
    dict(id="hook", hold={0: 0.4}, tag=None, world=None, extra=1.6, lines=[
        "Imagine waking up tomorrow and seeing a number floating above every person's head.",
        "It's not their age, money, or popularity.",
        "It's the number of lies they've told."]),
    dict(id="day1", hold={0: 0.4}, tag="DAY 1", world=(0, 2.79 * B), extra=1.3, lines=[
        "At seven in the morning, the counters appear, and every single one starts at zero.",
        "By lunchtime, your neighbor has three.",
        "Your teacher has eight.",
        "And your best friend? Twelve."]),
    dict(id="alex", hold={1: 0.4}, tag="DAY 1 · 7:42 AM", world=None, extra=1.3, lines=[
        "Meet Alex. He's twenty-two, works at a tiny coffee shop, and starts the day with a clean zero.",
        "Then his boss asks, \"Are you on your way?\"",
        "Alex says, \"Almost.\""]),
    dict(id="public", hold={0: 1.3}, tag="DAY 1 · 8:05 AM", world=(4.10 * B, 6.20 * B), extra=1.5, lines=[
        "His counter jumps to one.",
        "When he walks into work, his boss sees it.",
        "Within hours, people across the world are filming each other's numbers, and arguing over what they mean."]),
    dict(id="week1", hold={0: 0.5}, tag="WEEK 1", world=(52 * B, 61 * B), extra=1.3, lines=[
        "By the end of week one, zero becomes the most valuable number on Earth.",
        "Employers want zeroes.",
        "Dating apps filter by zeroes.",
        "Strangers trust people they've never actually met."]),
    dict(id="perfect", hold={1: 0.6}, tag="MONTH 1", world=(150 * B, 176 * B), extra=1.4, lines=[
        "Alex promises himself he'll never lie again.",
        "And for a while, it works. His number stays at one.",
        "People begin to treat him like someone who can never do wrong."]),
    dict(id="tv", hold={1: 0.7}, tag="MONTH 1", world=(176.4 * B, 176.9 * B), extra=1.7, lines=[
        "But one afternoon, Alex watches a famous businessman make a promise on television.",
        "His counter doesn't move. The crowd cheers.",
        "Alex notices what nobody else does."]),
    dict(id="loophole", hold={0: 0.5, 1: 0.3}, tag="MONTH 1", world=(177.0 * B, 177.6 * B), extra=1.6, lines=[
        "The man never actually promised to help anyone. He just said he cared.",
        "The counter only detects statements someone knows are false.",
        "It can't detect what they choose not to say."]),
    dict(id="month3", hold={2: 0.3}, tag="MONTH 3", world=(239 * B, 241 * B), extra=1.5, lines=[
        "Soon, people become experts at telling half the truth.",
        "Companies hide behind careful wording.",
        "Friends avoid difficult questions.",
        "Everyone is technically honest... but nobody knows who to trust."]),
    dict(id="baker", hold={1: 0.4}, tag="MONTH 3", world=(241.2 * B, 241.6 * B), extra=1.4, lines=[
        "Then Alex meets an elderly baker whose counter says forty-seven.",
        "People avoid her shop.",
        "He almost does too... until he sees her give a free birthday cake to a little girl."]),
    dict(id="twist", hold={1: 0.5, 2: 0.8}, tag="MONTH 3", world=(241.6 * B, 241.8 * B), extra=2.2, lines=[
        "The girl asks if her mother paid for it.",
        "The baker gently says yes, even though she didn't.",
        "The number changes to forty-eight.",
        "The girl's face lights up."]),
    dict(id="ending", hold={1: 0.5, 2: 0.6}, tag="MONTH 3", world=(241.8 * B, 241.9 * B), extra=3.6, lines=[
        "And Alex finally understands.",
        "A number can tell you whether someone lied. It can't tell you why.",
        "So here's the real question.",
        "Would you trust the person with zero lies... or the one with forty-eight?"]),
]
# Caption words differ from spoken words only where a number is easier to read as digits (same word count).
CAP_SWAP = {"seven": "7", "twenty-two,": "22,", "forty-seven.": "47.", "forty-eight.": "48.", "forty-eight?": "48?",
            "three.": "3.", "eight.": "8.", "Twelve.": "12."}


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
            cap_words = [CAP_SWAP.get(w, w) for w in words]
            caps = []
            for idxs in chunk_words(cap_words):
                c0 = t + wt[idxs[0]][0]
                c1 = t + wt[idxs[-1]][1]
                caps.append(dict(start=round(c0, 3), end=round(c1, 3),
                                 text=" ".join(cap_words[i] for i in idxs).upper().strip(",:;").replace('"', "")))
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

    s = S["hook"]
    put("hook", "number", word_time(s, 0, r"^number"))
    put("hook", "street", s["lines"][1]["start"] - 0.25)
    put("hook", "lies", word_time(s, 2, r"^lies"))
    s = S["day1"]
    put("day1", "clock", word_time(s, 0, r"^morning", end=True))
    put("day1", "zeros", word_time(s, 0, r"^appear"))
    put("day1", "zero", word_time(s, 0, r"^zero"))
    put("day1", "neighbor", s["lines"][1]["start"] - 0.2)
    put("day1", "n3", word_time(s, 1, r"^three"))
    put("day1", "teacher", s["lines"][2]["start"] - 0.25)
    put("day1", "t8", word_time(s, 2, r"^eight"))
    put("day1", "friend", s["lines"][3]["start"] - 0.25)
    put("day1", "f12", word_time(s, 3, r"^twelve"))
    s = S["alex"]
    put("alex", "zero", word_time(s, 0, r"^zero"))
    put("alex", "msg", word_time(s, 1, r"^boss"))
    put("alex", "reply", word_time(s, 2, r"almost"))
    s = S["public"]
    put("public", "ding", word_time(s, 0, r"^one"))
    put("public", "work", s["lines"][1]["start"])
    put("public", "sees", word_time(s, 1, r"^sees"))
    put("public", "world", s["lines"][2]["start"] - 0.2)
    put("public", "argue", word_time(s, 2, r"^arguing"))
    s = S["week1"]
    put("week1", "valuable", word_time(s, 0, r"^valuable"))
    put("week1", "jobs", s["lines"][1]["start"] - 0.2)
    put("week1", "dating", s["lines"][2]["start"] - 0.2)
    put("week1", "shop", s["lines"][3]["start"] - 0.2)
    s = S["perfect"]
    put("perfect", "works", s["lines"][1]["start"])
    put("perfect", "stays", word_time(s, 1, r"^stays"))
    put("perfect", "praise", s["lines"][2]["start"])
    s = S["tv"]
    put("tv", "promise", word_time(s, 0, r"^promise"))
    put("tv", "nomove", s["lines"][1]["start"])
    put("tv", "cheer", word_time(s, 1, r"cheers"))
    put("tv", "notice", s["lines"][2]["start"])
    s = S["loophole"]
    put("loophole", "cared", word_time(s, 0, r"cared"))
    put("loophole", "split", s["lines"][1]["start"] - 0.2)
    put("loophole", "doc", s["lines"][2]["start"] - 0.2)
    s = S["month3"]
    put("month3", "ad", s["lines"][1]["start"] - 0.3)
    put("month3", "friends", s["lines"][2]["start"] - 0.3)
    put("month3", "alex", s["lines"][3]["start"] - 0.2)
    s = S["baker"]
    put("baker", "c47", word_time(s, 0, r"forty-seven"))
    put("baker", "avoid", s["lines"][1]["start"] - 0.2)
    put("baker", "almost", s["lines"][2]["start"])
    put("baker", "cake", word_time(s, 2, r"^birthday"))
    s = S["twist"]
    put("twist", "ask", s["lines"][0]["start"])
    put("twist", "yes", word_time(s, 1, r"^yes"))
    put("twist", "d48", word_time(s, 2, r"forty-eight"))
    put("twist", "light", s["lines"][3]["start"])
    s = S["ending"]
    put("ending", "split", s["lines"][1]["start"] - 0.4)
    put("ending", "question", s["lines"][3]["start"])
    put("ending", "zero", word_time(s, 3, r"^zero"))
    put("ending", "f48", word_time(s, 3, r"forty-eight"))
    put("ending", "final", s["lines"][3]["end"] + 0.25)
    return ev


# --------------------------------------------------------------------------------------
def soundtrack(scenes, voices, total, ev):
    n = int(total * SR) + SR
    rng = np.random.default_rng(11)
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
        s = np.fft.irfft(spec, m)
        return s / (np.abs(s).max() + 1e-9)

    def env_ad(sec, a=0.5, r=0.8):
        x = tt(sec)
        return np.minimum(1, x / a) * np.minimum(1, np.maximum(0, sec - x) / r)

    def pad(freqs, sec, bright=0.25):
        x = tt(sec)
        s = sum(np.sin(2 * np.pi * f * x + i) + bright * np.sin(2 * np.pi * f * 2.003 * x) for i, f in enumerate(freqs))
        return s / len(freqs) * env_ad(sec, 1.2, 1.4)

    def piano(f, sec=2.4, dec=1.6):
        return tone(f, sec, (1, 0.45, 0.2, 0.08), dec, 0.004)

    # ---------------- music
    music = np.zeros(n)
    A, Bb, C, D, E_, F, G = 220.0, 233.08, 261.63, 293.66, 329.63, 349.23, 392.0
    sus_prog = [[A / 2, C, E_], [F / 2, A, C], [D / 2, F, A], [E_ / 2, G * 0.5 * 2, B_ := 246.94]]
    beat = 60 / 76
    warm0, end0 = S["baker"]["start"], S["ending"]["start"]
    tense0, tense1 = S["tv"]["start"], S["month3"]["end"]
    motif = [E_ * 2, C * 2, A, B_, C * 2, E_ * 2, D * 2, B_]
    b, tp = 0, 0.0
    while tp < total:
        bar = (b // 4) % 4
        if tp < tense0:                                   # curious suspense: piano ostinato + soft pad + tick
            ch = sus_prog[bar]
            if b % 4 == 0:
                add(music, pad([ch[0], ch[1], ch[2]], beat * 4 + 1.2), tp, 0.10)
                add(music, tone(ch[0] / 2, beat * 4, (1, 0.3), 0.7), tp, 0.16)
            add(music, piano(motif[b % len(motif)] * (1 if b % 2 else 0.5) * 1.0, 1.4, 3.2), tp, 0.07)
            add(music, noise(0.02, 5000, 10000) * np.exp(-tt(0.02) * 150), tp + beat / 2, 0.025)
        elif tp < warm0:                                  # tension: drone, dissonant half-steps, heartbeat
            if b % 4 == 0:
                add(music, pad([A / 2, Bb / 2, E_ / 2], beat * 4 + 1.2, 0.1), tp, 0.13)
            if b % 2 == 0:
                x = tt(0.3)
                hb = np.sin(2 * np.pi * np.cumsum(45 + 30 * np.exp(-x * 25)) / SR) * np.exp(-x * 12)
                add(music, hb, tp, 0.22)
                add(music, hb, tp + 0.24, 0.15)
            if b % 4 == 2:
                add(music, piano([Bb, A, F, E_][bar] * 2, 2.2, 1.8), tp, 0.05)
        else:                                             # warm: major piano + pad, fuller at the ending
            warm_prog = [[F, A, C * 2], [C, E_, G], [A, C * 2, E_ * 2], [G, B_, D * 2]]
            ch = warm_prog[bar]
            k = 1.25 if tp >= end0 else 1.0
            if b % 4 == 0:
                add(music, pad([c / 2 for c in ch], beat * 4 + 1.2, 0.3), tp, 0.11 * k)
                add(music, tone(ch[0] / 4, beat * 4, (1, 0.3), 0.6), tp, 0.15 * k)
            for e, f in enumerate(ch if b % 2 == 0 else ch[::-1]):
                add(music, piano(f * 2, 2.0, 2.0), tp + e * beat / 3, 0.045 * k)
        b += 1
        tp += beat
    # hook: dramatic silence at the end of the hook
    i0, i1 = int((S["hook"]["end"] - 1.0) * SR), int(S["hook"]["end"] * SR)
    music[i0:i1] *= np.linspace(1, 0.05, i1 - i0)
    # the TV reveal / loophole: quieter and more unsettling
    a, z = int(tense0 * SR), int(tense1 * SR)
    music[a:z] *= 0.8
    # final question: everything but a soft held chord drops away
    fq = E("ending", "final")
    j0 = int((fq - 0.3) * SR)
    music[j0:] *= np.linspace(1, 0.35, n - j0)
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

    def bed(sid, lo, hi, g, t0=None, t1=None):
        a_ = S[sid]["start"] if t0 is None else t0
        z_ = S[sid]["end"] if t1 is None else t1
        add(amb, noise(z_ - a_, lo, hi) * env_ad(z_ - a_, 0.4, 0.4), a_, g)

    def birds(t0, t1, g):
        tp_ = t0 + 0.3
        while tp_ < t1:
            f0 = rng.uniform(2600, 4200)
            for c in range(rng.integers(2, 5)):
                x = tt(0.09)
                ch = np.sin(2 * np.pi * np.cumsum(f0 + 900 * np.sin(x * 60)) / SR) * np.sin(np.pi * x / 0.09)
                add(amb, ch, tp_ + c * 0.12, g)
            tp_ += rng.uniform(0.9, 2.0)

    def murmur(sid, g, t0=None, t1=None):
        a_ = S[sid]["start"] if t0 is None else t0
        z_ = S[sid]["end"] if t1 is None else t1
        m = noise(z_ - a_, 250, 1400)
        mod = 0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * tt(z_ - a_)) * np.sin(2 * np.pi * 0.7 * tt(z_ - a_))
        add(amb, m * mod * env_ad(z_ - a_, 0.4, 0.4), a_, g)

    def cars(t0, t1, g):
        tp_ = t0 + 0.6
        while tp_ < t1 - 1:
            d = rng.uniform(1.6, 2.4)
            x = tt(d)
            add(amb, noise(d, 120, 1500) * np.sin(np.pi * x / d) ** 2, tp_, g)
            tp_ += rng.uniform(2.0, 3.5)

    h = S["hook"]
    birds(h["start"], h["start"] + ev["hook"]["street"], 0.05)
    bed("hook", 80, 900, 0.03, h["start"] + ev["hook"]["street"], h["end"] - 1.0)
    cars(h["start"] + ev["hook"]["street"], h["end"] - 1.2, 0.05)
    d1 = S["day1"]
    bed("day1", 80, 900, 0.025)
    birds(d1["start"] + ev["day1"]["neighbor"], d1["start"] + ev["day1"]["teacher"], 0.04)
    murmur("day1", 0.035, d1["start"] + ev["day1"]["teacher"], d1["start"] + ev["day1"]["friend"])
    birds(S["alex"]["start"], S["alex"]["end"], 0.03)
    murmur("public", 0.04)
    bed("public", 80, 900, 0.02)
    murmur("week1", 0.03)
    murmur("perfect", 0.03)
    bed("tv", 60, 500, 0.02)
    bed("loophole", 60, 500, 0.02)
    bed("month3", 80, 900, 0.025)
    murmur("baker", 0.02)
    bed("baker", 80, 900, 0.02)
    murmur("twist", 0.015)
    bed("ending", 60, 400, 0.015)

    # ---------------- sound effects
    sfx = np.zeros(n)

    def click(at, g=0.18):                                   # gentle counter tick
        s = tone(2400, 0.05, (1, 0.3), 70)
        nz = noise(0.012, 3000, 9000) * np.exp(-tt(0.012) * 300) * 0.4
        s[:len(nz)] += nz
        add(sfx, s, at, g)

    def ding(at, g=0.35):                                    # loud digital ding (Alex's first lie)
        add(sfx, tone(1318.5, 0.9, (1, 0.35, 0.1), 4.5), at, g)
        add(sfx, tone(1760, 0.8, (1, 0.3), 5), at + 0.09, g * 0.8)

    def soft_ding(at, g=0.2):
        add(sfx, tone(1046.5, 1.4, (1, 0.3, 0.1), 2.6), at, g)
        add(sfx, tone(1568, 1.2, (1, 0.2), 3.0), at + 0.12, g * 0.6)

    def whoosh(at, g=0.07, d=0.45):
        add(sfx, noise(d, 500, 5000) * np.sin(np.pi * tt(d) / d) ** 2, at, g)

    def counting(at, to, n_, g=0.12):                        # n_ ticks leading up to `to`
        step = min(0.18, (to - at) / max(1, n_))
        for j in range(n_):
            click(to - (n_ - 1 - j) * step, g)

    for s in scenes[1:]:
        whoosh(s["start"] - 0.2)
    # hook
    add(sfx, tone(880, 1.2, (1, 0.5, 0.25), 2.2), E("hook", "number"), 0.12)        # shimmer as the number appears
    add(sfx, tone(1320, 1.0, (1, 0.3), 2.6), E("hook", "number") + 0.06, 0.06)
    for j in range(6):
        click(E("hook", "street") + 0.5 + j * 0.37, 0.06)
    x = tt(1.0)
    add(sfx, np.sin(2 * np.pi * np.cumsum(60 + 40 * np.exp(-x * 4)) / SR) * np.exp(-x * 3), E("hook", "lies"), 0.35)  # boom
    # day 1
    add(sfx, noise(0.03, 800, 4000) * np.exp(-tt(0.03) * 120), E("day1", "clock"), 0.25)  # clock flip
    for j in range(7):
        click(E("day1", "zeros") + j * 0.08, 0.1)
    counting(E("day1", "neighbor") + 0.4, E("day1", "n3"), 3)
    counting(E("day1", "teacher") + 0.3, E("day1", "t8"), 8, 0.1)
    counting(E("day1", "friend") + 0.4, E("day1", "f12"), 12, 0.09)
    # alex
    add(sfx, tone(1568, 0.25, (1, 0.3), 14), E("alex", "msg"), 0.16)                  # message pop
    add(sfx, tone(2093, 0.2, (1, 0.3), 16), E("alex", "msg") + 0.12, 0.12)
    for j in range(6):                                                                 # typing
        add(sfx, noise(0.02, 1500, 6000) * np.exp(-tt(0.02) * 150), E("alex", "reply") - 0.6 + j * 0.09, 0.07)
    add(sfx, tone(1175, 0.2, (1, 0.3), 16), E("alex", "reply") + 0.05, 0.12)          # sent
    # public
    ding(E("public", "ding"))
    add(sfx, tone(1318.5, 0.3, (1, 0.3), 10), E("public", "work"), 0.08)              # door bell
    add(sfx, tone(1760, 0.3, (1, 0.3), 10), E("public", "work") + 0.12, 0.06)
    for j in range(5):                                                                 # phone camera shutters
        add(sfx, noise(0.05, 1500, 8000) * np.exp(-tt(0.05) * 70), E("public", "world") + 0.5 + j * 0.55, 0.12)
    # week 1
    add(sfx, noise(0.25, 1000, 6000) * np.sin(np.pi * tt(0.25) / 0.25), S["week1"]["start"] + 0.2, 0.1)  # page flip
    for nm in ("jobs", "dating", "shop"):
        add(sfx, tone(1046.5, 0.25, (1, 0.3), 12), E("week1", nm) + 0.25, 0.08)
    add(sfx, sweep_down := tone(300, 0.4, (1, 0.5), 6), E("week1", "shop") + 2.0, 0.08)   # turned away "womp"
    # perfect
    for j in range(3):
        add(sfx, tone(1568, 0.3, (1, 0.3), 9), E("perfect", "praise") + 0.6 + j * 0.7, 0.06)
    # tv: crowd cheer
    d = 3.0
    add(sfx, noise(d, 300, 3500) * env_ad(d, 0.6, 1.6), E("tv", "cheer") - 0.2, 0.12)
    for j in range(10):
        add(sfx, noise(0.03, 1200, 5000) * np.exp(-tt(0.03) * 120), E("tv", "cheer") + rng.uniform(0, 2.2), 0.06)  # claps
    # loophole: paper and highlighter
    add(sfx, noise(0.35, 1000, 7000) * np.sin(np.pi * tt(0.35) / 0.35), E("loophole", "split") + 0.3, 0.08)
    add(sfx, noise(0.5, 2000, 6000) * np.exp(-tt(0.5) * 3), E("loophole", "doc") + 0.9, 0.05)
    # baker
    add(sfx, tone(1318.5, 0.6, (1, 0.3), 5), E("baker", "almost") - 0.2, 0.05)       # shop door bell
    add(sfx, tone(1760, 0.6, (1, 0.3), 5), E("baker", "almost") - 0.08, 0.04)
    # twist
    soft_ding(E("twist", "d48"), 0.22)
    add(sfx, tone(1568, 1.2, (1, 0.3), 2.5), E("twist", "light"), 0.05)
    add(sfx, tone(2093, 1.2, (1, 0.3), 2.5), E("twist", "light") + 0.15, 0.04)
    # ending
    add(sfx, tone(880, 1.6, (1, 0.4), 1.6), E("ending", "zero"), 0.05)
    add(sfx, tone(659.25, 1.6, (1, 0.4), 1.6), E("ending", "f48"), 0.05)
    x = tt(1.6)
    add(sfx, np.sin(2 * np.pi * np.cumsum(55 + 25 * np.exp(-x * 3)) / SR) * np.exp(-x * 2), E("ending", "final"), 0.22)

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
