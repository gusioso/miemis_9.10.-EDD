# YouTube Short: "What if you were the most attractive man in the world for 24 hours?"

**Video:** [`attractive_24h_short.mp4`](attractive_24h_short.mp4) is vertical 1080×1920, 30 fps, 59.5 s, with H.264 video and AAC audio. You can upload it to YouTube Shorts as it is.

The whole video is generated in code by [`make_short.py`](make_short.py). That includes every graphic, the animation, the countdown and the music.

## Storyboard

| Time | Section | What happens |
|------|---------|--------------|
| 0.0–3.6 s | **Hook** | "WHAT IF YOU WERE THE MOST ATTRACTIVE MAN IN THE WORLD… FOR 24 HOURS? ⏳" over spinning golden rays |
| 3.6–7.2 s | **3‑2‑1‑GO!** | Big countdown numbers with a draining ring and beeps |
| 7.2 s → | **24h countdown HUD** | A live `TIME LEFT 23:59:59` clock, the time of day (☀/🌙) and a progress bar. Between scenes the clock *fast‑forwards* |
| 7:00 AM | Mirror | "YOU WAKE UP GORGEOUS": a golden mirror with a glass shine and sparkles |
| 8:00 AM | Phone | "9,999+ NOTIFICATIONS": a shaking phone, sliding DM cards and a rolling badge counter |
| 10:00 AM | Crowd | "STRANGERS FOLLOW YOU": a crowd of silhouettes with 😍 above their heads |
| 12:00 PM | Restaurant | "EVERYTHING IS FREE": a $0.00 receipt, a red **FREE** stamp slam and orbiting food |
| 3:00 PM | Paparazzi | Cameras with flash bursts and white screen flashes |
| 6:00 PM | Money | A "$10,000,000 IN DEALS" counter rolls up while cash rains down, ending in KA-CHING! |
| 9:00 PM | City | A night skyline, stopped cars and HONK! bubbles |
| 2:00 AM | Twist | "BUT THEN YOU NOTICE… nobody asks who you *really* are": rain and a spotlight |
| 6:59 AM | Clock | "THE CLOCK IS RUNNING OUT": a spinning, shaking alarm clock on a red pulse background |
| 43.8–50.3 s | **Final countdown** | Giant 10 → 1 numbers with a ring, screen shake and a riser |
| 50.3 s | **TIME'S UP!** | A flash and a puff of smoke, then he's back to normal (hoodie and messy hair) 🐶 |
| 53.3 s | Lesson | "THE REAL GLOW-UP? CONFIDENCE + KINDNESS" |
| 56.3 s | Call to action | "WOULD YOU TAKE THE 24 HOURS? comment 👇 YES or NO", a SUBSCRIBE button and a WHAT IF follow prompt |

The soundtrack is made with numpy and needs no external files. It has a kick, snare, hi-hat, bass, chord pads, clock ticks, whooshes, phone pings, camera shutters, ka-ching, car horns, a riser, a boom and a happy outro.

## Re-render / edit

You need Python 3.9 or newer, `pip install pillow numpy`, and `ffmpeg` on your PATH.

```bash
python youtube_short/make_short.py                    # renders the MP4 (~2–3 min on 4 cores)
python youtube_short/make_short.py --preview 2,13,46  # saves PNG stills for quick checks
```

* **Change the texts:** edit the `SCENES` list. In the markup, `*word*` becomes gold highlighted text and `{😍}` becomes an emoji.
* **Change the timing:** edit the `T_*` constants at the top of the file.
* **Fonts:** the script uses Inter, Arial or DejaVu, whichever it finds first. Emoji come from Noto Color Emoji or Segoe UI Emoji.
