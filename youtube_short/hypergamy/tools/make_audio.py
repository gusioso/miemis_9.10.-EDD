#!/usr/bin/env python3
"""
Script, voiceover and soundtrack for "What If Hypergamy Didn't Exist?".

  python tools/make_audio.py          # writes public/assets/vo/*.wav, public/soundtrack.wav, src/timeline.json

Voice: Kokoro (free, offline) "am_michael", because the ElevenLabs credits ran out. The clips are cached in
public/assets/vo/, so re-runs cost nothing. To switch to ElevenLabs Mike later, set VOICE_ENGINE=elevenlabs.
Music and sound effects are synthesized with numpy (no external files).
"""
import hashlib
import json
import os
import subprocess
import sys
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "public", "assets", "vo")
KOKORO = os.path.join(ROOT, "..", "kokoro")
SR = 24000
FPS = 30
VOICE, SPEED = "am_michael", 1.16
ENGINE = os.environ.get("VOICE_ENGINE", "kokoro")

# Each scene: id, top-left tag, matches counter (top-right), lines, extra seconds at the end.
SCENES = [
    dict(id="hook", tag="DAY 1 · 7:00 AM", matches=0, lines=[
        "Overnight, hypergamy disappears.",
        "Nobody, men or women, cares about money, height, or status anymore."], extra=0.2),
    dict(id="app", tag="DAY 1 · 9:00 AM", matches=3, lines=[
        "Dating apps panic. The six foot filter? Gone.",
        "You finally delete six foot from your profile. You're five seven."], extra=0.2),
    dict(id="lambo", tag="DAY 1 · 2:00 PM", matches=7, lines=[
        "A guy rents a Lamborghini for nine hundred dollars. Nobody even looks.",
        "They're all petting the golden retriever next to it."], extra=0.3),
    dict(id="news", tag="WEEK 1", matches=12, lines=[
        "Week one. Luxury watch sales crash. Private jet selfies get zero likes."], extra=0.2),
    dict(id="date", tag="MONTH 1", matches=19, lines=[
        "Month one. You finally get a date, and talk about yourself for two hours.",
        "No second date. Without status, personality is all you've got."], extra=0.3),
    dict(id="pottery", tag="MONTH 6", matches=19, lines=[
        "So you learn to cook, you actually listen, and you take a pottery class.",
        "Your first bowl looks like a potato."], extra=0.3),
    dict(id="billionaire", tag="YEAR 1", matches=24, lines=[
        "Year one. A billionaire's date asks what he does for fun.",
        "He says: business. Left on read."], extra=0.3),
    dict(id="wedding", tag="YEAR 10", matches=1, lines=[
        "Year ten. You marry the girl who laughed at your potato bowl."], extra=0.6),
    dict(id="fact", tag="REAL LIFE", matches=None, lines=[
        "Fun fact: in real studies, men and women both rate kindness near the top."], extra=0.3),
    dict(id="cta", tag=None, matches=None, lines=[
        "Would this world be better? Comment below."], extra=0.8),
]
# What the captions show when it should differ from the spoken words (digits instead of words).
CAPTION_TEXT = {
    "Dating apps panic. The six foot filter? Gone.": "Dating apps panic. The 6 ft filter? Gone.",
    "You finally delete six foot from your profile. You're five seven.":
        "You finally delete \"6 ft\" from your profile. You're 5'7\".",
    "A guy rents a Lamborghini for nine hundred dollars. Nobody even looks.":
        "A guy rents a Lamborghini for $900. Nobody even looks.",
    "Week one. Luxury watch sales crash. Private jet selfies get zero likes.":
        "Week 1. Luxury watch sales crash. Private jet selfies get 0 likes.",
    "Month one. You finally get a date, and talk about yourself for two hours.":
        "Month 1. You finally get a date, and talk about yourself for 2 hours.",
    "Year one. A billionaire's date asks what he does for fun.": "Year 1. A billionaire's date asks what he does for fun.",
    "Year ten. You marry the girl who laughed at your potato bowl.":
        "Year 10. You marry the girl who laughed at your potato bowl.",
}


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
    key = hashlib.md5(f"{ENGINE}|{VOICE}|{SPEED}|{text}".encode()).hexdigest()[:12]
    path = os.path.join(VO, f"{key}.wav")
    if os.path.exists(path):
        return read_wav(path), os.path.basename(path)
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(KOKORO, "kokoro-v1.0.onnx"), os.path.join(KOKORO, "voices-v1.0.bin"))
    s, sr = _kokoro.create(text, voice=VOICE, speed=SPEED, lang="en-us")
    assert sr == SR
    s = trim(np.asarray(s, np.float32))
    write_wav(path, s)
    print("  tts:", text)
    return s, os.path.basename(path)


def chunks(text):
    words, out, cur = text.replace("—", " ").split(), [], []
    for w in words:
        cur.append(w)
        j = " ".join(cur)
        if len(cur) >= 3 or len(j) >= 13 or w.endswith((",", ".", "?", "!", ":")):
            out.append(j)
            cur = []
    if cur:
        out.append(" ".join(cur))
    return out


# --------------------------------------------------------------------------------------
def build():
    os.makedirs(VO, exist_ok=True)
    t = 0.3
    scenes, voices = [], []
    for sc in SCENES:
        start = t
        lines = []
        for text in sc["lines"]:
            sig, fname = tts(text)
            dur = len(sig) / SR
            cap = CAPTION_TEXT.get(text, text)
            cs = chunks(cap)
            wts = [len(c) + 3 for c in cs]
            caps, ct = [], t
            for c, wgt in zip(cs, wts):
                cd = dur * wgt / sum(wts)
                caps.append(dict(start=round(ct, 3), end=round(ct + cd, 3), text=c.upper().strip(",.:")))
                ct += cd
            lines.append(dict(text=text, file=f"assets/vo/{fname}", start=round(t, 3), end=round(t + dur, 3),
                              caps=caps))
            voices.append((sig, t))
            t += dur + 0.2
        t += sc["extra"]
        scenes.append(dict(id=sc["id"], tag=sc["tag"], matches=sc["matches"], start=round(start, 3),
                           end=round(t, 3), lines=lines))
    total = t + 0.2
    return scenes, voices, total


def soundtrack(scenes, voices, total):
    n = int(total * SR) + SR
    rng = np.random.default_rng(4)

    def tt(sec):
        return np.arange(int(sec * SR)) / SR

    def add(buf, sig, at, g=1.0):
        i = int(at * SR)
        if i >= n:
            return
        j = min(n, i + len(sig))
        buf[i:j] += sig[:j - i] * g

    def tone(f, sec, harm=(1, 0.4, 0.15), dec=3.0):
        x = tt(sec)
        return sum(a * np.sin(2 * np.pi * f * (k + 1) * x) for k, a in enumerate(harm)) * np.minimum(1, x / 0.005) * np.exp(-x * dec)

    def noise(sec, lo, hi):
        m = max(2, int(sec * SR))
        spec = np.fft.rfft(rng.standard_normal(m))
        fr = np.fft.rfftfreq(m, 1 / SR)
        spec[(fr < lo) | (fr > hi)] = 0
        s = np.fft.irfft(spec, m)
        return s / (np.abs(s).max() + 1e-9)

    def sweep(f0, f1, sec):
        x = tt(sec)
        return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * x / sec) / SR)

    S = {s["id"]: s for s in scenes}

    def at(sid, line=0, off=0.0, end=False):
        ln = S[sid]["lines"][line]
        return (ln["end"] if end else ln["start"]) + off

    # --- music: bouncy pizzicato + piano (C major, 104 bpm); warmer pad at the wedding/fact/cta
    music = np.zeros(n)
    beat = 60 / 104
    prog_ = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]]
    b, tp = 0, 0.0
    warm_t = S["wedding"]["start"]
    while tp < total:
        ch = prog_[(b // 4) % 4]
        warm = tp >= warm_t
        if not warm:
            f = ch[(b * 2) % 3] * (2 if b % 2 else 1)
            add(music, tone(f, 0.35, (1, 0.5, 0.2), 9), tp, 0.18)               # pizzicato
            add(music, tone(ch[(b + 1) % 3] * 2, 0.3, (1, 0.3), 10), tp + beat / 2, 0.12)
            if b % 4 == 0:
                add(music, tone(ch[0] / 2, beat * 3, (1, 0.4), 2.2), tp, 0.22)   # bass
            x = tt(0.18)
            add(music, np.sin(2 * np.pi * np.cumsum(55 + 80 * np.exp(-x * 30)) / SR) * np.exp(-x * 14), tp, 0.18)
            if b % 2:
                add(music, noise(0.05, 4000, 9000) * np.exp(-tt(0.05) * 60), tp, 0.04)
        else:
            for k, f in enumerate(ch):
                add(music, tone(f * (2 if k else 1), 1.6, (1, 0.3), 1.6), tp + k * 0.08, 0.12)
            if b % 4 == 0:
                x = tt(beat * 4 + 0.6)
                pad = sum(np.sin(2 * np.pi * f * x) for f in ch) / 3 * np.minimum(1, x / 0.5) * np.minimum(1, (len(x) / SR - x) / 0.5)
                add(music, pad, tp, 0.10)
        b += 1
        tp += beat

    # --- voice + ducking
    vo, env = np.zeros(n), np.zeros(n)
    for sig, t0 in voices:
        lvl = np.sqrt(np.mean(sig[np.abs(sig) > 0.1 * np.abs(sig).max()] ** 2)) + 1e-9
        add(vo, sig * (0.2 / lvl), t0)
        add(env, np.ones(len(sig)), t0)
    k = int(0.15 * SR)
    env = np.convolve(env, np.ones(k) / k, mode="same")
    music *= 1 - 0.55 * np.clip(env, 0, 1)

    # --- sound effects
    sfx = np.zeros(n)
    for s in scenes[1:]:
        add(sfx, noise(0.35, 600, 5000) * np.sin(np.pi * tt(0.35) / 0.35) ** 2, s["start"] - 0.12, 0.1)
    # hook: record scratch + 'deleted' stamp
    add(sfx, sweep(1800, 200, 0.35) * np.exp(-tt(0.35) * 4) * 0.5 + noise(0.35, 1500, 6000) * np.exp(-tt(0.35) * 6) * 0.3,
        at("hook", 0, 0.9), 0.35)
    add(sfx, np.sin(2 * np.pi * np.cumsum(60 + 60 * np.exp(-tt(0.3) * 20)) / SR) * np.exp(-tt(0.3) * 10), at("hook", 0, 1.2), 0.6)
    # app: notification pings, the filter switch, delete taps
    for j in range(3):
        add(sfx, tone(1568, 0.3, (1, 0.3), 10) + np.concatenate([np.zeros(int(0.07 * SR)), tone(2093, 0.23, (1, 0.3), 10)]),
            at("app", 0, 0.2 + j * 0.35), 0.15)
    add(sfx, tone(2400, 0.05, (1,), 60), at("app", 0, 1.8), 0.3)
    for j in range(5):
        add(sfx, noise(0.03, 1500, 6000) * np.exp(-tt(0.03) * 120), at("app", 1, 0.6 + j * 0.11), 0.12)
    # lambo: engine rev, crickets (nobody looks), happy crowd + bark
    x = tt(1.6)
    rev = np.sign(np.sin(2 * np.pi * np.cumsum(60 + 140 * np.sin(np.pi * x / 1.6) ** 2) / SR)) * np.sin(np.pi * x / 1.6)
    add(sfx, rev, at("lambo", 0, 0.1), 0.06)
    for j in range(4):
        add(sfx, tone(4400, 0.04, (1,), 40), at("lambo", 0, -1.2, True) + j * 0.18, 0.06)
    add(sfx, noise(at("lambo", 1, 0, True) - at("lambo", 1) + 0.6, 300, 2500), at("lambo", 1), 0.04)
    for j in range(2):
        bark = noise(0.12, 400, 1800) * np.exp(-tt(0.12) * 25) + sweep(600, 380, 0.12) * np.exp(-tt(0.12) * 20)
        add(sfx, bark, at("lambo", 1, 0.5 + j * 0.25), 0.25)
    # news: falling 'ka-ching' + sad trombone-ish slide
    add(sfx, sweep(900, 150, 1.2) * np.exp(-tt(1.2) * 1.5), at("news", 0, 1.2), 0.08)
    # date: fast clock ticks, then womp womp
    for j in range(16):
        add(sfx, tone(3000, 0.025, (1,), 80), at("date", 0, 1.6) + j * 0.1, 0.12)
    for j, (f0, f1) in enumerate(((330, 300), (300, 250))):
        add(sfx, sweep(f0, f1, 0.45) * np.exp(-tt(0.45) * 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * tt(0.45))),
            at("date", 1, 0.05) + j * 0.5, 0.12)
    # pottery: pan sizzle, wheel whirr, boing on the potato
    add(sfx, noise(1.0, 3000, 9000) * np.minimum(1, tt(1.0) / 0.2) * np.exp(-tt(1.0)), at("pottery", 0, 0.3), 0.05)
    add(sfx, noise(1.6, 150, 600), at("pottery", 0, 2.4), 0.05)
    x = tt(0.5)
    add(sfx, np.sin(2 * np.pi * np.cumsum(220 + 180 * np.sin(2 * np.pi * 8 * x) * np.exp(-x * 4)) / SR) * np.exp(-x * 4),
        at("pottery", 1, 0.6), 0.25)
    # billionaire: 'read' pop and a cricket
    add(sfx, tone(880, 0.15, (1, 0.3), 14), at("billionaire", 1, 1.2), 0.2)
    # wedding: bells
    for j, f in enumerate((1046.5, 1318.5, 1568.0, 2093.0)):
        add(sfx, tone(f, 2.0, (1, 0.6, 0.3, 0.15), 1.5), at("wedding", 0, 0.3) + j * 0.22, 0.06)
    # cta pop
    add(sfx, tone(1200, 0.2, (1, 0.3), 14), S["cta"]["start"] + 0.05, 0.12)

    mix = vo + music * 0.8 + sfx
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    mix[-int(0.5 * SR):] *= np.linspace(1, 0, int(0.5 * SR))
    return mix


def main():
    scenes, voices, total = build()
    raw = os.path.join(ROOT, "public", "soundtrack_raw.wav")
    write_wav(raw, soundtrack(scenes, voices, total))
    out = os.path.join(ROOT, "public", "soundtrack.wav")
    # loudness: two-pass loudnorm to YouTube's -14 LUFS
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", raw, "-af",
                        "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", "48000", out], check=True)
    os.remove(raw)
    tl = dict(fps=FPS, total=round(total, 3), durationInFrames=int(np.ceil(total * FPS)), scenes=scenes)
    with open(os.path.join(ROOT, "src", "timeline.json"), "w") as f:
        json.dump(tl, f, indent=1)
    print(f"total {total:.1f}s")
    for s in scenes:
        print(f"  {s['id']:12s} {s['start']:6.2f}-{s['end']:6.2f}")


if __name__ == "__main__":
    sys.exit(main())
