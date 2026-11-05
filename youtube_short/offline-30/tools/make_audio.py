#!/usr/bin/env python3
"""
Script, voiceover, word timings and soundtrack for "What If the Internet Went Down for 30 Days?".

  python3 tools/make_audio.py      # -> public/assets/vo/*.wav, public/soundtrack.wav, src/timeline.json

Narrator: Kokoro "am_liam" (closest free voice to ElevenLabs "Mike"; Creative Claw could not connect).
The barista: Kokoro "af_heart". Clips are cached in public/assets/vo/.
The animation and the sound read the same timeline.json (scene times + named events).
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
    dict(id="hook", tag="DAY 1 · 7:00 AM", lead=0.5, extra=0.6, lines=[
        N("What if tomorrow morning, the entire internet went down... for thirty days?", hold=0.5),
        N("Alex wakes up, reaches for his phone, and sees two words.", hold=0.2),
        N("No connection.", hold=0.6),
        N("He restarts it twice. Nothing. Then he looks out the window... and it isn't just him.")]),
    dict(id="cafe", tag="DAY 1 · 8:15 AM", lead=0.4, extra=0.6, lines=[
        N("At the coffee shop, the card machine just keeps spinning.", hold=0.3),
        M("Sorry. Cash only today.", hold=0.4),
        N("Alex has eleven dollars in his wallet. Most people have nothing.")]),
    dict(id="bank", tag="DAY 1 · 12:00 PM", lead=0.4, extra=0.7, lines=[
        N("Because most money isn't paper. It's numbers on a computer somewhere.", hold=0.4),
        N("The ATMs stop working, and by noon, the lines at every bank stretch around the block.")]),
    dict(id="store", tag="DAY 3", lead=0.4, extra=0.7, lines=[
        N("By day three, supermarkets have a new problem.", hold=0.3),
        N("Their orders, their trucks, their stock... all of it ran on the internet.", hold=0.3),
        N("Managers start writing everything on paper. And the shelves get thinner.")]),
    dict(id="street", tag="DAY 5", lead=0.4, extra=0.8, lines=[
        N("Then something strange happens. With no screens, people go outside.", hold=0.3),
        N("Neighbors who never said hello start sharing news... from the one thing that still works.", hold=0.2),
        N("The radio.")]),
    dict(id="board", tag="DAY 12", lead=0.4, extra=0.8, lines=[
        N("By day twelve, the town has rebuilt the internet... out of paper.", hold=0.4),
        N("A notice board for jobs, lost pets and messages. Paper maps. A queue outside the library.")]),
    dict(id="hard", tag="DAY 20", lead=0.4, extra=0.8, lines=[
        N("But it isn't all cozy.", hold=0.4),
        N("Hospitals go back to paper charts. Flights are grounded. Some companies can't pay their workers.", hold=0.3),
        N("Every single day offline costs the world billions.")]),
    dict(id="online", tag="DAY 30 · 11:59 PM", lead=0.4, extra=0.8, lines=[
        N("Then, on day thirty, at midnight... it comes back.", hold=0.5),
        N("Alex's phone explodes. Four thousand notifications.", hold=0.4),
        N("Within an hour, almost everyone is staring at a screen again.")]),
    dict(id="final", tag="DAY 31 · 8:00 AM", lead=0.4, extra=3.6, lines=[
        N("But the next morning, Alex leaves his phone at home... and knocks on his neighbor's door.", hold=0.7),
        N("So if the internet disappeared for a month... would you survive it?")]),
]
# Caption words differ from spoken words where digits read better. "~x" merges into the previous caption word.
CAP_SWAP = {("hook", 0): {"thirty": "30", "days?": "DAYS?"}, ("cafe", 2): {"eleven": "$11", "dollars": "~"}, ("store", 0): {"three,": "3,"},
            ("board", 0): {"twelve,": "12,"}, ("online", 0): {"thirty,": "30,"}, ("online", 1): {"Four": "4,000", "thousand": "~"}}

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

    def w(sid, li, pat, end=False):
        return word_time(S[sid], li, pat, end)

    put("hook", "reach", w("hook", 1, r"^reaches"))
    put("hook", "phone", w("hook", 1, r"^two"))
    put("hook", "noconn", L("hook", 2))
    put("hook", "restart", w("hook", 3, r"^restarts"))
    put("hook", "window", w("hook", 3, r"^window"))
    put("hook", "notjust", w("hook", 3, r"^isn"))
    put("cafe", "spin", w("cafe", 0, r"^spinning"))
    put("cafe", "cash", L("cafe", 1))
    put("cafe", "wallet", w("cafe", 2, r"^eleven"))
    put("cafe", "nothing", w("cafe", 2, r"^nothing"))
    put("bank", "numbers", w("bank", 0, r"^numbers"))
    put("bank", "atm", L("bank", 1))
    put("bank", "lines", w("bank", 1, r"^lines"))
    put("store", "trucks", w("store", 1, r"^trucks"))
    put("store", "paper", L("store", 2))
    put("store", "thinner", w("store", 2, r"^thinner"))
    put("street", "outside", w("street", 0, r"^outside"))
    put("street", "share", w("street", 1, r"^sharing"))
    put("street", "radio", L("street", 2))
    put("board", "rebuilt", w("board", 0, r"^rebuilt"))
    put("board", "notice", w("board", 1, r"^notice"))
    put("board", "maps", w("board", 1, r"^maps"))
    put("board", "library", w("board", 1, r"^library"))
    put("hard", "hospital", L("hard", 1))
    put("hard", "flights", w("hard", 1, r"^Flights"))
    put("hard", "pay", w("hard", 1, r"^Some"))
    put("hard", "graph", L("hard", 2))
    put("online", "midnight", w("online", 0, r"^midnight"))
    put("online", "back", w("online", 0, r"^back"))
    put("online", "explode", w("online", 1, r"^explodes"))
    put("online", "hour", L("online", 2))
    put("final", "leaves", w("final", 0, r"^leaves"))
    put("final", "knock", w("final", 0, r"^knocks"))
    put("final", "q", L("final", 1))
    put("final", "final", L("final", 1, True) + 0.25)
    return ev


# --------------------------------------------------------------------------------------
def soundtrack(scenes, voices, total, ev):
    n = int(total * SR) + SR
    rng = np.random.default_rng(31)
    S = {s["id"]: s for s in scenes}

    def E(sid, name):
        return S[sid]["start"] + ev[sid][name]

    def st(sid):
        return S[sid]["start"], S[sid]["end"]

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
    marks = [(0, "mystery"), (S["cafe"]["start"], "tense"), (S["street"]["start"], "warm"), (S["board"]["start"], "hopeful"),
             (S["hard"]["start"], "serious"), (S["online"]["start"], "mystery"), (E("online", "back"), "tense"), (S["final"]["start"], "calm")]

    def mood(tp):
        m = marks[0][1]
        for t0, mm in marks:
            if tp >= t0:
                m = mm
        return m

    music = np.zeros(n)
    beat = 60 / 88
    b, tp = 0, 0.0
    minor_prog = [[A, C, E_], [F, A, C], [D, F, A], [E_, G, B_]]
    warm_prog = [[F, A, C * 2], [C, E_, G], [A, C * 2, E_ * 2], [G, B_, D * 2]]
    while tp < total:
        bar = (b // 4) % 4
        m = mood(tp)
        if m == "mystery":
            if b % 4 == 0:
                add(music, pad([A / 2, C, E_, F], beat * 4 + 1.2, 0.15), tp, 0.10)
            if b % 2 == 0:
                add(music, piano([E_, F, E_, D][bar] * 2, 2.0, 2.0), tp, 0.05)
        elif m in ("tense", "serious"):
            g = 0.7 if m == "serious" else 1.0
            ch = minor_prog[bar]
            if b % 4 == 0:
                add(music, pad([ch[0] / 2, ch[1] / 2, Bb / 2], beat * 4 + 1.2, 0.1), tp, 0.11 * g)
            add(music, tone(A / 4 if bar % 2 == 0 else F / 4, 0.4, (1, 0.5), 7), tp, 0.17 * g)
            add(music, noise(0.02, 5000, 10000) * np.exp(-tt(0.02) * 150), tp + beat / 2, 0.02 * g)
            if b % 2 == 1:
                add(music, piano(ch[2] * 2, 1.2, 3.0), tp, 0.04 * g)
        else:
            ch = warm_prog[bar]
            k = {"warm": 0.85, "hopeful": 1.1, "calm": 0.8}[m]
            if b % 4 == 0:
                add(music, pad([c / 2 for c in ch], beat * 4 + 1.2, 0.3), tp, 0.11 * k)
                add(music, tone(ch[0] / 4, beat * 4, (1, 0.3), 0.6), tp, 0.14 * k)
            for e, f in enumerate(ch if b % 2 == 0 else ch[::-1]):
                add(music, piano(f * 2, 2.0, 2.0), tp + e * beat / 3, 0.045 * k)
            if m == "hopeful" and b % 2 == 0:
                add(music, kick(), tp, 0.1)
        b += 1
        tp += beat
    fq = E("final", "final")
    j0 = int((fq - 0.3) * SR)
    music[j0:] *= np.linspace(1, 0.3, n - j0)
    add(music, pad([F / 2, A / 2, C, E_], total - fq + 0.5, 0.2), fq - 0.2, 0.12)

    # ---------------- voice + ducking
    vo, venv = np.zeros(n), np.zeros(n)
    for sig, t0, voice in voices:
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

    birds(*st("hook"), 0.025)
    murmur(*st("cafe"), 0.035)
    murmur(*st("bank"), 0.05)
    murmur(*st("store"), 0.04)
    birds(*st("street"), 0.03)
    murmur(*st("street"), 0.025)
    murmur(*st("board"), 0.03)
    bed(*st("hard"), 80, 900, 0.025)
    bed(*st("online"), 60, 400, 0.02)
    birds(*st("final"), 0.025)

    # ---------------- sound effects
    sfx = np.zeros(n)

    def whoosh(at, g=0.06, d=0.45):
        add(sfx, noise(d, 500, 5000) * np.sin(np.pi * tt(d) / d) ** 2, at, g)

    def click(at, g=0.12):
        add(sfx, tone(2400, 0.05, (1, 0.3), 70), at, g)

    def ping(at, g=0.12):
        add(sfx, tone(1568, 0.25, (1, 0.3), 14), at, g)
        add(sfx, tone(2093, 0.22, (1, 0.3), 16), at + 0.1, g * 0.8)

    def error(at, g=0.12):
        add(sfx, tone(311, 0.25, (1, 0.5, 0.3), 6), at, g)
        add(sfx, tone(233, 0.35, (1, 0.5, 0.3), 5), at + 0.22, g)

    def knock(at, g=0.25):
        add(sfx, noise(0.06, 150, 1200) * np.exp(-tt(0.06) * 50), at, g)
        add(sfx, kick() * 0.5, at, g * 0.6)

    for s in scenes[1:]:
        whoosh(s["start"] - 0.2)
    # hook: phone unlock, error, two restarts
    click(E("hook", "reach") + 0.4, 0.15)
    error(E("hook", "noconn"), 0.12)
    for j in range(2):
        add(sfx, tone(880, 0.3, (1, 0.4), 6), E("hook", "restart") + 0.3 + j * 0.9, 0.06)
    # cafe: card reader beeps, then the decline buzz
    for j in range(4):
        add(sfx, tone(2000, 0.07, (1,), 40), E("cafe", "spin") - 0.6 + j * 0.45, 0.05)
    error(E("cafe", "spin") + 1.2, 0.1)
    add(sfx, noise(0.25, 1500, 6000) * np.exp(-tt(0.25) * 12), E("cafe", "wallet") + 0.1, 0.06)  # wallet rustle
    # bank: ATM error, crowd
    error(E("bank", "atm") + 0.4, 0.12)
    # store: pen scribbles, truck horn
    for f in (370, 466):
        add(sfx, tone(f, 0.5, (1, 0.6, 0.4), 1.5), E("store", "trucks") + 0.2, 0.05)
    for j in range(6):
        add(sfx, noise(0.12, 2000, 7000) * np.exp(-tt(0.12) * 25), E("store", "paper") + 0.2 + j * 0.3, 0.035)
    # street: radio static, then a news jingle
    d = 1.2
    add(sfx, noise(d, 800, 6000) * env_ad(d, 0.1, 0.4), E("street", "radio") - 0.3, 0.05)
    for j, f in enumerate((784, 988, 1175)):
        add(sfx, tone(f, 0.4, (1, 0.4), 5), E("street", "radio") + 0.9 + j * 0.15, 0.05)
    # board: pins and paper
    for j in range(4):
        click(E("board", "notice") + j * 0.4, 0.09)
    # hard: heart monitor beeps, the airport chime
    for j in range(5):
        add(sfx, tone(1046, 0.1, (1,), 25), E("hard", "hospital") + j * 0.8, 0.04)
    for j, f in enumerate((660, 523)):
        add(sfx, tone(f, 0.8, (1, 0.3), 2.5), E("hard", "flights") + j * 0.35, 0.05)
    # online: a deep "power on", then a flood of notifications
    x = tt(1.5)
    add(sfx, np.sin(2 * np.pi * np.cumsum(50 + 120 * (1 - np.exp(-x * 3))) / SR) * np.exp(-x * 1.2), E("online", "back"), 0.18)
    for j in range(36):
        ping(E("online", "explode") - 0.2 + j * 0.06 + rng.uniform(0, 0.05), 0.04 + 0.03 * rng.random())
    # final: knock knock, door, last soft hit under the question
    for j in range(3):
        knock(E("final", "knock") + 0.3 + j * 0.28)
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
