#!/usr/bin/env python3
"""
Script, voiceover and soundtrack for "What If You Had To Spend $1 Billion In 24 Hours?".

  python tools/make_audio.py          # writes public/assets/vo/*.wav, public/soundtrack.wav, src/timeline.json

Voice: Kokoro (free, offline), a 60/40 blend of "am_puck" and "am_liam" that matches Mike's pitch, tone and pace.
Clips are cached in public/assets/vo/. Music and sound effects are synthesized with numpy.

Real numbers used: $1B / 86,400 s = $11,574 per second; medical-debt charities (e.g. Undue Medical Debt) buy debt
for pennies, on average about $1 relieves $100 of debt.
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
VOICE, SPEED = "puck60_liam40", 1.0
BLEND = {"am_puck": 0.6, "am_liam": 0.4}
M = 1_000_000

# tag = time of day, clock = seconds after midnight (for the countdown), balance = money left at the end of the scene
SCENES = [
    dict(id="deposit", tag="12:00 AM", clock=0, balance=1000 * M, lines=[
        "At midnight, your phone buzzes. One billion dollars just hit your account.",
        "There's one rule. Spend all of it in twenty four hours. Anything left at midnight disappears. And you can't "
        "just give it away."], extra=0.3),
    dict(id="math", tag="12:05 AM", clock=300, balance=1000 * M, lines=[
        "Sounds easy. It's not. You'd have to spend eleven thousand, five hundred seventy four dollars... every "
        "single second."], extra=0.4),
    dict(id="coffee", tag="8:00 AM", clock=8 * 3600, balance=1000 * M, lines=[
        "Eight a.m. You buy a coffee with your new card. The bank freezes it for fraud.",
        "Forty minutes on hold. That's twenty seven million dollars of wasted time."], extra=0.3),
    dict(id="cars", tag="10:00 AM", clock=10 * 3600, balance=959 * M, lines=[
        "Ten a.m. You walk into a car dealership and buy every single car. Twenty three cars. Forty one million "
        "dollars.",
        "The salesman starts crying."], extra=0.5),
    dict(id="jet", tag="12:00 PM", clock=12 * 3600, balance=897 * M, lines=[
        "Noon. A used private jet. Sixty two million. The seller makes you prove the money is real. Twice."], extra=0.4),
    dict(id="mansion", tag="2:00 PM", clock=14 * 3600, balance=897 * M, lines=[
        "Two p.m. You find your dream mansion... but the agent says closing takes thirty days. Way too slow."],
         extra=0.4),
    dict(id="art", tag="4:00 PM", clock=16 * 3600, balance=812 * M, lines=[
        "Four p.m. An art auction. You buy a painting of... a blue square. Eighty five million dollars.",
        "You don't get it either."], extra=0.4),
    dict(id="panic", tag="6:00 PM", clock=18 * 3600, balance=812 * M, lines=[
        "Six p.m. You've spent less than twenty percent. Spending a billion dollars is actually really hard.",
        "Your best friend says: buy a solid gold gaming console. Your mom says: buy groceries."], extra=0.4),
    dict(id="debt", tag="10:00 PM", clock=22 * 3600, balance=812 * M, lines=[
        "Ten p.m. You read something that changes everything. Millions of people are drowning in medical debt.",
        "And charities can buy that debt for pennies. About one dollar erases a hundred dollars of it."], extra=0.4),
    dict(id="buy", tag="11:00 PM", clock=23 * 3600, balance=12 * M, lines=[
        "That's not giving money away. That's buying something. So you buy it. Eight hundred million dollars of it.",
        "Around eighty billion dollars of debt... gone. For millions of strangers."], extra=0.6),
    dict(id="final", tag="11:59 PM", clock=86340, balance=0, final=True, lines=[
        "Eleven fifty nine. Twelve million left. You buy the pizza place down the street."], extra=3.6),
    dict(id="morning", tag="NEXT MORNING", clock=None, balance=None, lines=[
        "The next morning, your mailbox is full. Thank you letters, from people you'll never meet.",
        "And your mom just asks: so... did you buy groceries?",
        "Turns out, the best thing a billion dollars can buy... is someone else's fresh start."], extra=0.6),
    dict(id="cta", tag=None, clock=None, balance=None, lines=[
        "What would you spend a billion dollars on? Tell me in the comments."], extra=0.8),
]
CAPTION_TEXT = {
    SCENES[0]["lines"][0]: "At midnight, your phone buzzes. $1,000,000,000 just hit your account.",
    SCENES[0]["lines"][1]: "There's one rule. Spend all of it in 24 hours. Anything left at midnight disappears. "
                           "And you can't just give it away.",
    SCENES[1]["lines"][0]: "Sounds easy. It's not. You'd have to spend $11,574... every single second.",
    SCENES[2]["lines"][0]: "8 AM. You buy a coffee with your new card. The bank freezes it for fraud.",
    SCENES[2]["lines"][1]: "40 minutes on hold. That's $27,000,000 of wasted time.",
    SCENES[3]["lines"][0]: "10 AM. You walk into a car dealership and buy every single car. 23 cars. $41,000,000.",
    SCENES[4]["lines"][0]: "Noon. A used private jet. $62,000,000. The seller makes you prove the money is real. Twice.",
    SCENES[5]["lines"][0]: "2 PM. You find your dream mansion... but the agent says closing takes 30 days. Way too slow.",
    SCENES[6]["lines"][0]: "4 PM. An art auction. You buy a painting of... a blue square. $85,000,000.",
    SCENES[7]["lines"][0]: "6 PM. You've spent less than 20%. Spending a billion dollars is actually really hard.",
    SCENES[8]["lines"][0]: "10 PM. You read something that changes everything. Millions of people are drowning in medical debt.",
    SCENES[8]["lines"][1]: "And charities can buy that debt for pennies. About $1 erases $100 of it.",
    SCENES[9]["lines"][0]: "That's not giving money away. That's buying something. So you buy it. $800,000,000 of it.",
    SCENES[9]["lines"][1]: "Around $80,000,000,000 of debt... gone. For millions of strangers.",
    SCENES[10]["lines"][0]: "11:59. $12,000,000 left. You buy the pizza place down the street.",
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
            cs = chunks(CAPTION_TEXT.get(text, text))
            wts = [len(c) + 3 for c in cs]
            caps, ct = [], t
            for c, wgt in zip(cs, wts):
                cd = dur * wgt / sum(wts)
                caps.append(dict(start=round(ct, 3), end=round(ct + cd, 3), text=c.upper().strip(",.:")))
                ct += cd
            lines.append(dict(text=text, file=f"assets/vo/{fname}", start=round(t, 3), end=round(t + dur, 3), caps=caps))
            voices.append((sig, t))
            t += dur + 0.22
        t += sc["extra"]
        scenes.append(dict(id=sc["id"], tag=sc["tag"], clock=sc["clock"], balance=sc["balance"],
                           final=sc.get("final", False), start=round(start, 3), end=round(t, 3), lines=lines))
    return scenes, voices, t + 0.2


# --------------------------------------------------------------------------------------
def soundtrack(scenes, voices, total):
    n = int(total * SR) + SR
    rng = np.random.default_rng(9)

    def tt(sec):
        return np.arange(int(sec * SR)) / SR

    def add(buf, sig, at, g=1.0):
        i = int(at * SR)
        if i >= n or i < 0:
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

    def kick():
        x = tt(0.2)
        return np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-x * 30)) / SR) * np.exp(-x * 14)

    def kaching():
        s = noise(0.08, 3000, 9000) * np.exp(-tt(0.08) * 50)
        b = tone(2637, 0.6, (1, 0.5, 0.2), 5) + tone(3520, 0.6, (1, 0.3), 6)
        out = np.zeros(int(0.7 * SR))
        out[:len(s)] += s
        out[int(0.06 * SR):int(0.06 * SR) + len(b)] += b[:len(out) - int(0.06 * SR)] * 0.6
        return out

    S = {s["id"]: s for s in scenes}

    def at(sid, line=0, off=0.0, end=False):
        ln = S[sid]["lines"][line]
        return (ln["end"] if end else ln["start"]) + off

    # --- music: tense pulse (money run) -> emotional piano at the debt reveal -> warm ending
    music = np.zeros(n)
    beat = 60 / 112
    warm_t = S["debt"]["start"]
    ending_t = S["morning"]["start"]
    prog_ = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [261.63, 329.63, 392.0], [196.0, 246.94, 293.66]]
    warm_prog = [[261.63, 329.63, 392.0], [196.0, 246.94, 293.66], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63]]
    b, tp = 0, 0.0
    while tp < total:
        if tp < warm_t:
            ch = prog_[(b // 4) % 4]
            for e in range(2):
                add(music, tone(ch[(b * 2 + e) % 3] * 2, 0.3, (1, 0.4), 9), tp + e * beat / 2, 0.11)
            if b % 2 == 0:
                add(music, tone(ch[0] / 2, beat * 2, (1, 0.5, 0.2), 2.5), tp, 0.2)
            add(music, kick(), tp, 0.2)
            if b % 2:
                add(music, noise(0.12, 1500, 7000) * np.exp(-tt(0.12) * 30), tp, 0.05)       # clap
            add(music, noise(0.04, 6000, 10000) * np.exp(-tt(0.04) * 80), tp + beat / 2, 0.03)
        else:
            ch = warm_prog[(b // 4) % 4]
            slow = 1.6 if tp < ending_t else 1.0
            if b % 2 == 0:
                for k, f in enumerate(ch):
                    add(music, tone(f * (2 if k else 1), 2.2, (1, 0.3), 1.2), tp + k * 0.1, 0.11 * slow)
            if b % 4 == 0:
                x = tt(beat * 4 + 0.8)
                pad = sum(np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x) for f in ch) / 3
                pad *= np.minimum(1, x / 0.6) * np.minimum(1, (len(x) / SR - x) / 0.6)
                add(music, pad, tp, 0.09)
        b += 1
        tp += beat
    # music drops out for the final seconds' countdown, then lands warm
    i0, i1 = int(at("final", 0, 0, True) * SR), int(S["morning"]["start"] * SR)
    music[i0:i1] *= 0.2

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
    x = tt(0.5)
    buzz = np.sign(np.sin(2 * np.pi * 160 * x)) * 0.4 * (0.6 + 0.4 * np.sin(2 * np.pi * 26 * x))
    add(sfx, buzz, at("deposit", 0, 0.9), 0.15)
    add(sfx, buzz, at("deposit", 0, 1.5), 0.15)
    add(sfx, kaching(), at("deposit", 0, 2.8), 0.35)
    for j in range(12):                                                                       # money counter ticks
        add(sfx, tone(2200, 0.03, (1,), 60), at("math", 0, 1.5) + j * 0.25, 0.08)
    add(sfx, sweep(600, 200, 0.4) * np.exp(-tt(0.4) * 5), at("coffee", 0, 3.0), 0.2)          # declined
    for j, f in enumerate((523, 659, 784, 659, 523, 587, 698, 587)):                          # hold music
        add(sfx, tone(f, 0.3, (1, 0.2), 6), at("coffee", 1, 0.1) + j * 0.3, 0.05)
    add(sfx, kaching(), at("cars", 0, -1.0, True), 0.3)
    for j in range(3):                                                                        # sob
        add(sfx, sweep(420, 300, 0.25) * np.exp(-tt(0.25) * 6), at("cars", 1, 0.1) + j * 0.32, 0.1)
    x = tt(3.0)
    add(sfx, noise(3.0, 200, 3000) * np.minimum(1, x / 1.2) * np.exp(-np.maximum(0, x - 2.0) * 3), at("jet", 0, 0.2), 0.08)
    add(sfx, kaching(), at("jet", 0, 2.6), 0.3)
    add(sfx, sweep(330, 250, 0.5), at("mansion", 0, -0.9, True), 0.06)                       # womp
    add(sfx, sweep(250, 180, 0.6), at("mansion", 0, -0.4, True), 0.08)
    for j in range(2):                                                                        # gavel
        add(sfx, noise(0.05, 300, 3000) * np.exp(-tt(0.05) * 70), at("art", 0, -1.6, True) + j * 0.35, 0.4)
        add(sfx, tone(180, 0.15, (1,), 30), at("art", 0, -1.6, True) + j * 0.35, 0.4)
    add(sfx, kaching(), at("art", 0, -0.6, True), 0.3)
    for j in range(3):                                                                        # heartbeat in the panic
        add(sfx, kick(), at("panic", 0) + j * 0.8, 0.3)
        add(sfx, kick(), at("panic", 0) + j * 0.8 + 0.2, 0.2)
    for j in range(8):                                                                        # keyboard
        add(sfx, noise(0.03, 1500, 6000) * np.exp(-tt(0.03) * 120), at("debt", 0, 1.0) + j * 0.12, 0.08)
    for j in range(10):                                                                       # debts wiped
        add(sfx, tone(1046 * (1 + j * 0.06), 0.4, (1, 0.3), 6), at("buy", 1, 0.0) + j * 0.22, 0.05)
    c0 = at("final", 0, 0.25, True)
    for j in range(10):                                                                       # final countdown
        add(sfx, tone(3000, 0.03, (1,), 80), c0 + j * 0.3, 0.3)
        add(sfx, tone(330 + j * 25, 0.2, (1, 0.5), 9), c0 + j * 0.3, 0.12)
    add(sfx, kaching(), c0 + 3.0, 0.35)
    for j in range(6):                                                                        # mail plops
        add(sfx, noise(0.08, 200, 1500) * np.exp(-tt(0.08) * 40), at("morning", 0, 0.8) + j * 0.18, 0.1)
    add(sfx, tone(1200, 0.2, (1, 0.3), 14), S["cta"]["start"] + 0.05, 0.12)

    mix = vo + music * 0.8 + sfx
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    mix[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))
    return mix


def main():
    scenes, voices, total = build()
    raw = os.path.join(ROOT, "public", "soundtrack_raw.wav")
    write_wav(raw, soundtrack(scenes, voices, total))
    out = os.path.join(ROOT, "public", "soundtrack.wav")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", raw, "-af",
                        "loudnorm=I=-17:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    af = (f"loudnorm=I=-17:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", "48000", out], check=True)
    os.remove(raw)
    tl = dict(fps=FPS, total=round(total, 3), durationInFrames=int(np.ceil(total * FPS)), scenes=scenes)
    with open(os.path.join(ROOT, "src", "timeline.json"), "w") as f:
        json.dump(tl, f, indent=1)
    print(f"total {total:.1f}s")
    for s in scenes:
        print(f"  {s['id']:9s} {s['start']:6.2f}-{s['end']:6.2f}")


if __name__ == "__main__":
    sys.exit(main())
