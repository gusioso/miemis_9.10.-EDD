#!/usr/bin/env python3
"""
Script, voice, word timings and sound for "The Man Who Stole the Mona Lisa" (2D stick-figure history Short).

  python3 tools/make_audio.py      # -> public/assets/vo/*.wav, public/soundtrack.wav, src/timeline.json   (DRY=1: timing only)

Narration: one male narrator, Kokoro (free, offline): an even blend of bm_george and am_liam, smoothed with EQ, de-essing and
gentle compression (the voice the user picked, "version 5"). Creative Claw / ElevenLabs could not be reached.
Spoken at natural speed (1.0). American English phonemes; names fixed at the phoneme level (Peruggia, Béroud, Uffizi, Louvre, Vincenzo, da Vinci).
The narration is the user's script, word for word; years are spoken as words and captioned as digits.
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
KOKORO = os.environ.get("KOKORO_DIR", "/tmp/claude-0/-home-user-miemis-9-10--EDD/2ee5f724-dc59-5edf-96e1-0e0cbd701394/scratchpad/kokoro")
SR = 24000
FPS = 30
SPEED = float(os.environ.get("VO_SPEED", "1.0"))
GAP = 0.6          # pause between sentences inside a scene
SMOOTH = ("highpass=f=70,equalizer=f=140:t=q:w=1:g=2.5,equalizer=f=3200:t=q:w=1.2:g=-1.5,deesser=i=0.35:f=0.5,"
          "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=140:makeup=2")
# phoneme fixes applied to the espeak phonemes of every line
PHON_FIX = [("pəɹˈʌɡiəz", "pɛɹˈuːdʒəz"), ("pəɹˈʌɡiə", "pɛɹˈuːdʒə"), ("bˈeɪɹaʊd", "beɪɹˈuː"), ("ˈʌfɪzi", "uːfˈiːtsi"), ("lˈuːv", "lˈuːvɹə"),
            ("vɪnsˈɛnzoʊ", "vɪntʃˈɛnzoʊ"), ("vˈɪnsaɪz", "vˈɪntʃiz")]


def N(text, **k):
    return dict(text=text, **k)


# lead = silence before the first line; hold = extra pause after a line; extra = padding at the end of the scene
SCENES = [
    dict(id="hook", tag="PARIS · 1911", lead=0.5, extra=1.6, lines=[
        N("In nineteen eleven, a man stole the Mona Lisa from the Louvre.", hold=0.3),
        N("The police searched for over two years.", hold=0.3),
        N("But here's the unbelievable part: they actually questioned the thief... while the painting was hidden inside his apartment.")]),
    dict(id="paris", tag="PARIS — 1911", lead=0.4, extra=0.6, lines=[
        N("Paris, August nineteen eleven.", hold=0.3),
        N("The Louvre was one of Europe's great museums.", hold=0.2),
        N("Inside hung Leonardo da Vinci's Mona Lisa.", hold=0.3),
        N("It was already admired by art lovers, but almost nobody expected what was about to happen.")]),
    dict(id="worker", tag="PARIS — 1911", lead=0.4, extra=0.8, lines=[
        N("His name was Vincenzo Peruggia, an Italian worker who had previously worked at the museum.", hold=0.3),
        N("He knew its galleries and was familiar with the building.", hold=0.4),
        N("And on August twenty-first, the painting vanished.")]),
    dict(id="beroud", tag="AUGUST 22, 1911", lead=0.4, extra=0.6, lines=[
        N("The next day, painter Louis Béroud arrived at the Louvre.", hold=0.2),
        N("He expected to see the Mona Lisa hanging in its usual place.", hold=0.4),
        N("Instead, he found an empty space.", hold=0.5),
        N("At first, people thought it had simply been moved.")]),
    dict(id="shock", tag="PARIS — 1911", lead=0.3, extra=0.6, lines=[
        N("But when museum officials realized it was truly missing, Paris erupted in disbelief.", hold=0.3),
        N("Newspapers spread the story across the world.", hold=0.3),
        N("People even visited the Louvre just to stare at the empty wall.")]),
    dict(id="police", tag="PARIS — 1911", lead=0.4, extra=0.6, lines=[
        N("Investigators followed leads and questioned people connected to the art world.", hold=0.3),
        N("Even Pablo Picasso was questioned.", hold=0.4),
        N("Yet the painting remained missing.", hold=0.3),
        N("One of the biggest mysteries in art history had begun.")]),
    dict(id="missed", tag="PARIS", lead=0.5, extra=1.2, lines=[
        N("Meanwhile, Peruggia was living in Paris.", hold=0.3),
        N("Investigators had even interviewed him, but accepted his explanation.", hold=0.6),
        N("They didn't realize the stolen masterpiece was still hidden inside his apartment.")]),
    dict(id="years", tag="1911 → 1913", lead=0.4, extra=0.6, lines=[
        N("Months became years.", hold=0.4),
        N("The Mona Lisa stayed hidden while the mystery grew.", hold=0.4),
        N("Then, in late nineteen thirteen, Peruggia contacted an art dealer in Florence.", hold=0.2),
        N("He claimed he wanted to return the painting to Italy.")]),
    dict(id="meeting", tag="FLORENCE — 1913", lead=0.4, extra=0.6, lines=[
        N("The dealer, Alfredo Geri, contacted the director of the Uffizi Gallery.", hold=0.3),
        N("They examined the painting and recognized it as the missing masterpiece.", hold=0.4),
        N("The authorities were alerted.", hold=0.3),
        N("Peruggia's secret was finally exposed.")]),
    dict(id="returns", tag="1913 → 1914", lead=0.4, extra=0.6, lines=[
        N("After more than two years, the Mona Lisa was finally recovered.", hold=0.3),
        N("In January nineteen fourteen, it returned to the Louvre.", hold=0.3),
        N("The theft had transformed an admired Renaissance painting into a worldwide celebrity.")]),
    dict(id="final", tag="PARIS · TODAY", lead=0.4, extra=3.0, lines=[
        N("Today, the Mona Lisa is one of the world's most recognizable paintings.", hold=0.3),
        N("And its greatest publicity came from the man who stole it.", hold=0.4),
        N("So here's the question: did the thief accidentally make it famous?")]),
]
CAP_SWAP = {("hook", 0): {"nineteen": "1911,", "eleven,": "~"}, ("paris", 0): {"nineteen": "1911.", "eleven.": "~"},
            ("worker", 2): {"twenty-first,": "21,"}, ("years", 2): {"nineteen": "1913,", "thirteen,": "~"},
            ("returns", 1): {"nineteen": "1914,", "fourteen,": "~"}}

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


_kokoro = None
_voice = None


def tts(text):
    key = hashlib.md5(f"kokoro-onnx|blend-george-liam|{SPEED}|{PHON_FIX}|smooth1|us|{text}".encode()).hexdigest()[:12]
    path = os.path.join(VO, f"{key}.wav")
    if os.path.exists(path):
        return read_wav(path), os.path.basename(path)
    global _kokoro, _voice
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(KOKORO, "kokoro-v1.0.onnx"), os.path.join(KOKORO, "voices-v1.0.bin"))
        _voice = 0.5 * _kokoro.get_voice_style("bm_george") + 0.5 * _kokoro.get_voice_style("am_liam")
    ph = _kokoro.tokenizer.phonemize(text, "en-us")
    for a, b in PHON_FIX:
        ph = ph.replace(a, b)
    s, sr = _kokoro.create(ph, voice=_voice, speed=SPEED, lang="en-us", is_phonemes=True)
    assert sr == SR
    s = trim(np.asarray(s, np.float32))
    n = int(0.012 * SR)
    r = np.linspace(0, 1, n, dtype=np.float32)
    s[:n] *= r
    s[-n:] *= r[::-1]
    raw = path + ".raw.wav"
    write_wav(raw, s)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", SMOOTH, "-ar", str(SR), path], check=True)
    os.remove(raw)
    print("  tts:", text, "|", ph)
    return read_wav(path), os.path.basename(path)


def build():
    os.makedirs(VO, exist_ok=True)
    t = 0.0
    scenes, voices = [], []
    for sc in SCENES:
        start = t
        t += sc.get("lead", 0.0)
        lines = []
        for spec in sc["lines"]:
            text = spec["text"]
            sig, fname = tts(text)
            dur = len(sig) / SR
            words = text.split()
            wt = align(sig, words)
            swap = CAP_SWAP.get((sc["id"], len(lines)), {})
            toks = []
            for k, w in enumerate(words):
                c = swap.get(w, w)
                if toks and re.match(r"^(Mona|Pablo|Louis|Alfredo|Vincenzo)$", toks[-1][0]) and re.match(r"^[A-Z]", w):
                    toks[-1] = (toks[-1][0] + " " + c, toks[-1][1], k)
                elif c.startswith("~") and toks:
                    toks[-1] = (toks[-1][0] + c[1:], toks[-1][1], k)
                else:
                    toks.append((c, k, k))
            caps = []
            for idxs in chunk_words([tk[0] for tk in toks]):
                c0 = t + wt[toks[idxs[0]][1]][0]
                c1 = t + wt[toks[idxs[-1]][2]][1]
                caps.append(dict(start=round(c0, 3), end=round(c1, 3), text=" ".join(toks[i][0] for i in idxs).upper().strip(",:;").replace('"', "")))
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
            wl = [dict(w=(swap.get(w, w) if not swap.get(w, "").startswith("~") else w), s=round(t + a, 3), e=round(t + b, 3)) for w, (a, b) in zip(words, wt)]
            lines.append(dict(text=text, file=f"assets/vo/{fname}", start=round(t, 3), end=round(t + dur, 3), words=wl, caps=caps))
            voices.append((sig, t))
            t += dur + GAP + spec.get("hold", 0.0)
        t += sc.get("extra", 0.0) - GAP
        scenes.append(dict(id=sc["id"], tag=sc["tag"], start=round(start, 3), end=round(t, 3), lines=lines))
    return scenes, voices, t


def W(scene, li, pat, end=False, nth=0):
    hits = [w for w in scene["lines"][li]["words"] if re.search(pat, w["w"], re.I)]
    w = hits[nth]
    return w["e"] if end else w["s"]


# --------------------------------------------------------------------------------------
def soundtrack(scenes, voices, total):
    n = int(total * SR) + SR
    rng = np.random.default_rng(7)
    S = {s["id"]: s for s in scenes}

    def L(sid, i, end=False):
        return S[sid]["lines"][i]["end" if end else "start"]

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

    def pad(freqs, sec, bright=0.15, a=1.5, r=1.5):
        x = tt(sec)
        y = sum(np.sin(2 * np.pi * f * x + i) + bright * np.sin(2 * np.pi * f * 2.003 * x) for i, f in enumerate(freqs))
        return y / len(freqs) * env_ad(sec, a, r)

    def accordion(f, sec):
        x = tt(sec)
        y = np.zeros_like(x)
        for det in (0.997, 1.003):
            for h, amp in ((1, 1), (2, 0.55), (3, 0.38), (4, 0.22), (5, 0.14), (6, 0.08)):
                y += amp * np.sin(2 * np.pi * f * det * h * x)
        return y * env_ad(sec, 0.03, 0.08) * (0.85 + 0.15 * np.sin(2 * np.pi * 5.5 * x)) / 4

    def pluck(f, sec=0.6):
        return tone(f, sec, (1, 0.5, 0.2, 0.1), 6.5, 0.003)

    def hz(m):
        return 440.0 * 2 ** ((m - 69) / 12)

    music = np.zeros(n)
    # ---- a little Paris waltz (A minor, 3/4), used under the Paris scenes
    BEAT = 0.46
    bars = [(57, [64, 69, 72], [76, 72, 69]), (50, [62, 65, 69], [74, 72, 71]), (52, [64, 68, 71], [72, 71, 69]), (57, [64, 69, 72], [68, 69, 64]),
            (53, [65, 69, 72], [72, 74, 77]), (50, [62, 65, 69], [76, 74, 72]), (52, [64, 68, 71], [71, 72, 74]), (57, [64, 69, 72], [69, 64, 69])]

    def waltz(t0, t1, g=1.0, melody=True):
        b = 0
        at = t0
        while at < t1 - BEAT * 3:
            root, chord, mel = bars[b % len(bars)]
            add(music, pluck(hz(root - 12), 0.9), at, 0.30 * g)
            for k in (1, 2):
                for m in chord:
                    add(music, pluck(hz(m - 12), 0.35), at + k * BEAT, 0.07 * g)
            if melody:
                for k, m in enumerate(mel):
                    add(music, accordion(hz(m), BEAT * (1.6 if k == 2 else 0.95)), at + k * BEAT, 0.13 * g)
            b += 1
            at += BEAT * 3

    def suspense(t0, t1, g=1.0, root=45):
        d = t1 - t0
        add(music, pad([hz(root - 12), hz(root - 5), hz(root)], d, 0.08, 1.2, 1.2), t0, 0.12 * g)
        k = 0
        at = t0 + 0.2
        while at < t1 - 0.5:
            m = [root + 12, root + 15, root + 12, root + 19][k % 4]
            add(music, pluck(hz(m), 0.5), at, 0.08 * g)
            k += 1
            at += 0.92

    H = {s["id"]: (s["start"], s["end"]) for s in scenes}

    def triumph(t0, t1, g=1.0):        # warm major chords + a rising horn-like line (accordion timbre, low)
        chords = [[57, 61, 64], [62, 66, 69], [64, 68, 71], [57, 61, 64]]
        at, k = t0, 0
        while at < t1 - 1.0:
            for m in chords[k % 4]:
                add(music, pad([hz(m - 12)], 2.4, 0.2, 0.3, 0.8), at, 0.09 * g)
            add(music, pluck(hz(chords[k % 4][0] - 24), 1.2), at, 0.25 * g)
            for j, m in enumerate([69, 73, 76, 74][k % 4: k % 4 + 1] + [76]):
                add(music, accordion(hz(m), 0.9), at + j * 1.1, 0.08 * g)
            k += 1
            at += 2.2

    # hook: a deep note, then a low mysterious pulse
    add(music, tone(41.2, 3.5, (1, 0.5, 0.25), 1.0, 0.004), 0.05, 0.42)
    add(music, pad([82.4, 123.5, 164.8], H["hook"][1] - 0.4, 0.15, 0.3, 1.0), 0.05, 0.10)
    suspense(1.5, H["hook"][1] - 1.4, 0.85, 40)
    waltz(H["paris"][0], H["paris"][1], 0.85)                         # Paris, 1911
    suspense(H["worker"][0], H["worker"][1], 0.9, 45)
    suspense(H["beroud"][0], H["beroud"][0] + (H["beroud"][1] - H["beroud"][0]) * 0.55, 0.6, 45)
    add(music, pad([hz(46), hz(53)], (H["beroud"][1] - H["beroud"][0]) * 0.45, 0.05, 1.0, 1.0), H["beroud"][0] + (H["beroud"][1] - H["beroud"][0]) * 0.55, 0.08)
    suspense(H["shock"][0], H["shock"][1], 1.1, 46)
    suspense(H["police"][0], H["police"][1], 0.9, 44)
    for j in range(int(H["police"][1] - H["police"][0])):
        add(music, tone(1000, 0.05, (1,), 60), H["police"][0] + 0.5 + j, 0.02)       # a ticking clock
    add(music, pad([hz(40), hz(47)], H["missed"][1] - H["missed"][0], 0.03, 1.5, 1.5), H["missed"][0], 0.06)  # almost silent
    add(music, tone(hz(64), 3.0, (1, 0.4, 0.2), 1.2, 0.004), H["missed"][1] - 2.4, 0.12)                       # one quiet note
    waltz(H["years"][0], H["years"][1], 0.55)                          # time passing
    suspense(H["meeting"][0], H["meeting"][0] + 8.0, 1.0, 45)
    triumph(H["meeting"][0] + 8.0, H["meeting"][1], 0.8)                # resolves
    triumph(H["returns"][0], H["returns"][1], 1.1)
    waltz(H["final"][0], H["final"][1] - 3.2, 0.6)
    add(music, tone(hz(57), 4.0, (1, 0.5, 0.3, 0.15), 0.9, 0.004), H["final"][1] - 3.2, 0.22)                 # closing note
    add(music, tone(hz(45), 4.0, (1, 0.5), 0.8, 0.004), H["final"][1] - 3.2, 0.25)

    # ---- voice
    vo, venv = np.zeros(n), np.zeros(n)
    for sig, t0 in voices:
        lvl = np.sqrt(np.mean(sig[np.abs(sig) > 0.1 * np.abs(sig).max()] ** 2)) + 1e-9
        add(vo, sig * (0.2 / lvl), t0)
        add(venv, np.ones(len(sig)), t0)
    k = int(0.25 * SR)
    venv = np.convolve(venv, np.ones(k) / k, mode="same")

    # ---- ambience + effects
    amb, sfx = np.zeros(n), np.zeros(n)

    def steps(at, k_, gap=0.5, g=0.05):
        for j in range(k_):
            add(sfx, noise(0.07, 300, 3000) * np.exp(-tt(0.07) * 45), at + j * gap, g)

    def paper(at, g=0.06):
        add(sfx, noise(0.35, 1500, 8000) * env_ad(0.35, 0.03, 0.2) * (0.6 + 0.4 * (rng.random(int(0.35 * SR)) > 0.5)), at, g)

    def register(at, g=0.12):            # a soft cash register: drawer rattle + bell
        add(sfx, noise(0.18, 400, 3000) * env_ad(0.18, 0.01, 0.12), at, g * 0.6)
        add(sfx, tone(2093, 1.2, (1, 0.25, 0.1), 3.5), at + 0.16, g)
        add(sfx, tone(2637, 1.0, (1, 0.2), 4.0), at + 0.16, g * 0.5)

    def stamp(at, g=0.18):
        add(sfx, noise(0.12, 80, 1200) * np.exp(-tt(0.12) * 30), at, g)
        add(sfx, tone(70, 0.3, (1, 0.3), 14, 0.002), at, g)

    def klaxon(at, g=0.05):              # 1920s car horn
        for j, f in enumerate((330, 262)):
            x = tt(0.22)
            add(sfx, np.sign(np.sin(2 * np.pi * f * x)) * env_ad(0.22, 0.01, 0.05) * (0.8 + 0.2 * np.sin(2 * np.pi * 30 * x)), at + j * 0.24, g)

    def car(at, d=3.0, g=0.04):
        add(amb, noise(d, 80, 900) * np.sin(np.pi * tt(d) / d) ** 2, at, g)

    def whoosh(at, d=0.5, g=0.05):
        add(sfx, noise(d, 400, 5000) * np.sin(np.pi * tt(d) / d) ** 2, at, g)

    def press(at, d=3.0, g=0.05):       # printing press: rhythmic clacks
        for j in range(int(d / 0.25)):
            add(sfx, noise(0.05, 300, 4000) * np.exp(-tt(0.05) * 60), at + j * 0.25, g)

    def train(at, d=3.0, g=0.04):
        for j in range(int(d / 0.4)):
            add(sfx, noise(0.16, 200, 3000) * np.exp(-tt(0.16) * 14), at + j * 0.4, g)

    def knock(at, g=0.12):
        for j in range(3):
            add(sfx, noise(0.06, 150, 1500) * np.exp(-tt(0.06) * 50), at + j * 0.22, g)
            add(sfx, tone(110, 0.12, (1, 0.5), 25), at + j * 0.22, g)

    def door(at, g=0.1):
        add(sfx, tone(90, 0.5, (1, 0.6, 0.3), 9, 0.002), at, g)
        add(sfx, noise(0.3, 200, 2000) * np.exp(-tt(0.3) * 14), at, g * 0.5)

    def phone(at, g=0.04):
        for j in range(2):
            x = tt(0.6)
            add(sfx, np.sin(2 * np.pi * 900 * x) * np.sign(np.sin(2 * np.pi * 20 * x)) * env_ad(0.6, 0.01, 0.05), at + j * 0.9, g)

    # hook: the painting vanishes, a paper rustle, a knock at the apartment door
    whoosh(W(S["hook"], 0, r"^stole"), 0.7, 0.06)
    paper(L("hook", 1) - 0.2, 0.07)
    knock(L("hook", 2) + 0.4)
    add(sfx, tone(55, 2.5, (1, 0.4), 1.5, 0.004), H["hook"][1] - 1.5, 0.15)      # the title hit
    # paris: street, cars, then the gallery hush
    p0, p1 = H["paris"]
    add(amb, noise(p1 - p0, 300, 3000) * env_ad(p1 - p0, 0.8, 0.8), p0, 0.012)
    for at in (p0 + 1.0, p0 + 4.5):
        car(at)
    klaxon(p0 + 2.6)
    steps(L("paris", 3) - 0.5, 6, 0.6, 0.03)
    # worker: footsteps, a rewind, the vanishing
    steps(H["worker"][0] + 0.6, 7, 0.5)
    whoosh(L("worker", 1) - 0.4, 0.6, 0.06)
    add(sfx, noise(0.8, 500, 6000)[::-1] * np.linspace(0, 1, int(0.8 * SR)) ** 2, L("worker", 1) - 0.8, 0.05)  # rewind
    whoosh(W(S["worker"], 2, r"^vanished"), 0.8, 0.07)
    # beroud: footsteps in the gallery, then quiet
    steps(H["beroud"][0] + 0.5, 6, 0.55, 0.045)
    add(amb, noise(H["beroud"][1] - H["beroud"][0], 150, 1200) * env_ad(H["beroud"][1] - H["beroud"][0], 1.0, 1.0), H["beroud"][0], 0.007)
    # shock: printing press, paper, crowd murmur
    press(L("shock", 1) - 0.3, 3.2)
    paper(L("shock", 1) + 1.0, 0.06)
    add(amb, noise(4.0, 200, 1500) * env_ad(4.0, 0.8, 1.0), L("shock", 2), 0.03)
    # police: paper, a stamp-like thump on "NOT THE THIEF"
    paper(H["police"][0] + 0.8, 0.06)
    stamp(W(S["police"], 1, r"^questioned") + 0.4, 0.1)
    # missed: a knock, the door closes
    knock(L("missed", 1) - 0.5, 0.1)
    door(W(S["missed"], 1, r"^accepted") + 0.6)
    # years: wind, pen scratching, the train
    for j in range(10):
        add(sfx, noise(0.12, 2000, 8000) * env_ad(0.12, 0.01, 0.08), L("years", 3) - 1.6 + j * 0.16, 0.02)
    train(L("years", 3) + 0.8, 3.0)
    # meeting: paper, the cloth, a telephone, footsteps
    paper(H["meeting"][0] + 0.6, 0.06)
    whoosh(L("meeting", 1) + 0.6, 0.9, 0.05)
    phone(L("meeting", 2))
    steps(L("meeting", 3), 4, 0.5, 0.05)
    # returns: crowd murmur, the train home
    train(H["returns"][0] + 2.0, 2.5)
    add(amb, noise(6.0, 200, 1500) * env_ad(6.0, 1.0, 1.0), L("returns", 2), 0.03)
    # final: soft room tone
    e0, e1 = H["final"]
    add(amb, noise(e1 - e0, 200, 1500) * env_ad(e1 - e0, 1.0, 2.0), e0, 0.008)

    mix = amb + sfx + music * (1 - 0.55 * np.clip(venv, 0, 1)) + vo
    fade = int(1.2 * SR)
    mix = mix[:int(total * SR)]
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix = np.tanh(mix * 1.05)
    return mix / (np.abs(mix).max() + 1e-9) * 0.9


def main():
    scenes, voices, total = build()
    nwords = sum(len(l["text"].split()) for s in scenes for l in s["lines"])
    speech = sum(len(v[0]) for v in voices) / SR
    print(f"total {total:.1f}s  words {nwords}  overall {nwords / total * 60:.0f} wpm  speech-only {nwords / speech * 60:.0f} wpm")
    for s in scenes:
        print(f"  {s['id']:9s} {s['start']:6.2f}-{s['end']:6.2f}  ({s['end'] - s['start']:.1f}s)")
    if os.environ.get("DRY"):
        return
    raw = os.path.join(ROOT, "public", "soundtrack_raw.wav")
    write_wav(raw, soundtrack(scenes, voices, total))
    out = os.path.join(ROOT, "public", "soundtrack.wav")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
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
