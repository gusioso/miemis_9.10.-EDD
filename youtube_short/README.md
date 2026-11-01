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

---

# Story version (Part 1)

**Video:** [`attractive_24h_story.mp4`](attractive_24h_story.mp4) is 1:35 long, vertical 1080×1920, and narrated by the ElevenLabs voice "Mike - 2D & 3D POV/Storytime".

[`story_short.py`](story_short.py) makes the video in the popular "What If…" story style:
- a plaid frame with a white title box at the top and a **Part 1** label
- a 16:9 animated panel in the middle
- black-headed cartoon characters with expressive eyes and coloured hoodies
- speech bubbles and short captions synced to the narrator
- a time-of-day tag and a live **24h countdown** tag

The story tries to show what would realistically happen:

| Time | What happens |
|------|--------------|
| 7:00 AM | He wakes up and freezes at the mirror, because he is now the most attractive man in the world. The 24-hour timer starts. |
| 8:15 AM | People on the bus stare, and someone secretly takes a photo. It has 2 million views by 9 AM. |
| 9:30 AM | His boss laughs at every joke and coworkers bring coffee, but nobody listens to his ideas. |
| 12:00 PM | 50k new followers, a modeling agency, fake accounts, and then his home address gets posted online. |
| 2:00 PM | The **halo effect**: people see him as smarter, kinder and more trustworthy, so he gets free coffee, skips lines and gets off with a warning. |
| 4:00 PM | A jealous boyfriend confronts him at a café, a crowd presses against the window, and he sneaks out through the kitchen. |
| 7:00 PM | His best friend acts weird, his ex texts, and he realizes people only see his face. |
| 11:00 PM | He has 400 unread messages, and not one asks how he is doing. |
| 6:59 AM | The final 10-second countdown. |
| Next morning | His old face is back, the internet forgets him, and his best friend asks: "pizza later? like normal?" |
| Ending | "Being liked for who you are is the real flex." Then a split-screen question: would you take the 24 hours? |

### Rendering with the voice

```bash
pip install pillow numpy kokoro-onnx soundfile
mkdir -p youtube_short/kokoro && cd youtube_short/kokoro
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
cd ../.. && python youtube_short/story_short.py
```

- If Kokoro is not installed, the script still renders the video, but with captions only and no voice.
- To change the story, edit the `SCENES` list. The narration lines control the timing, so a new line automatically gets its own voice clip, captions and timing.
- To change the voice, edit `VOICE` and `SPEED`. The default voice is `am_michael`.

### Using an ElevenLabs voice instead

Set `ELEVENLABS_API_KEY`, and optionally `ELEVENLABS_VOICE_ID` (default: Adam), then run:

```bash
python youtube_short/story_short.py --tts elevenlabs
```

With `--tts auto` (the default), the script uses ElevenLabs when the key is set and Kokoro otherwise.

---

# Story Short: "What if you could hear everyone's thoughts for 24 hours?" (Part 1)

**Video:** [`thoughts_24h_story.mp4`](thoughts_24h_story.mp4) is vertical 1080×1920, 30 fps, 57 s, with H.264 video and AAC audio. You can upload it to YouTube Shorts as it is.

[`thoughts_short.py`](thoughts_short.py) reuses the `story_short.py` engine (same layout, characters, captions and tags) and adds:
- thought clouds next to the normal speech bubbles, and a purple "mind-reading" aura around the hero
- a separate ElevenLabs voice for each character. Thoughts get an echo so they sound like a voice in your head, and crowds whisper over each other
- captions for every line: white for the narrator, yellow for what people say, purple for what they think
- audio loudness normalised to YouTube's playback level (about −14 LUFS)

| Time | What happens |
|------|--------------|
| 7:00 AM | You wake up and can hear thoughts. Mom says "Morning, sweetie!" but thinks "Please don't ask for money again." |
| 8:00 AM | Everyone on the bus looks calm, but their heads are screaming. |
| 9:30 AM | Your crush looks at you and thinks… "Why is his hoodie inside out?" |
| 12:30 PM | Your best friend laughs the loudest, but thinks "I'm not okay. Please don't notice." |
| 6:00 PM | There's no off switch: judging, worrying and fake smiles everywhere. |
| 6:59 AM | A 5-second countdown. The voices fade one by one, and the last one is "I'm not okay." |
| Next day | You ask "Are you actually okay?" He says "No. Not really." For the first time, he talks. |
| Ending | "Sometimes the loudest laugh hides the most pain." Then a split-screen question: YES 🧠 or NO 🙉? |

### Voices

| Role | ElevenLabs voice |
|------|------------------|
| Narrator | Mike - 2D & 3D POV/Storytime (Voice Library, needs a paid plan for API use) |
| Mom | Matilda |
| Crush | Jessica |
| Best friend | Will |
| Crowd | Roger, Laura, Chris, Sarah, Bill, Charlie |

Everyone except Mike is a premade voice that works on every plan. Mike was picked after reading the same line with Mike, Liam, Tyler and Marcus and comparing pace and expressiveness.

### Rendering

You need `pip install pillow numpy`, `ffmpeg`, and `ELEVENLABS_API_KEY` set.

```bash
python youtube_short/thoughts_short.py                     # renders the MP4 (~2 min on 4 cores)
python youtube_short/thoughts_short.py --preview 3,20,40   # saves PNG stills for quick checks
```

- The whole script is about 1,000 characters of ElevenLabs credits. Clips are cached in `youtube_short/.tts_cache/`, so re-renders only pay for lines you change.
- Change the narrator with `--narrator <voice id>` or `ELEVENLABS_VOICE_ID`, and the other voices in `CAST`.
- Edit the story in `SCENES`: `N(...)` is a narrator line, and `SAY(who, ...)` and `THINK(who, ...)` are character lines.

---

# Story Short: "What if you lived for 100 million years?" (Part 1)

**Video:** [`100m_years_story.mp4`](100m_years_story.mp4) is vertical 1080×1920, 30 fps, about 2:42 long (under the 3-minute Shorts limit), narrated by Mike.

[`million_years_short.py`](million_years_short.py) uses the same engine and layout. The top-left tag names the chapter, and the top-right tag is a live year counter that runs from **YEAR 0** to **YEAR 100,000,000**.

The story sticks to real science (round numbers from current estimates):

| Year | What happens |
|------|--------------|
| 0 | You can't die. Even if you only stopped aging, accidents would get you within a few thousand years. |
| 80–100 | Everyone you love grows old and dies. You still look 25. |
| 1,000 | Nobody speaks your language. English from 1,000 years ago ("Fæder ūre, þū þe eart on heofonum") is unreadable today. |
| 10,000 | 125 lifetimes. Memories of your first life fade. |
| 13,000 | Earth's 26,000-year wobble makes Vega the North Star instead of Polaris. |
| 50,000 | Niagara Falls erodes back to Lake Erie and disappears. Ice sheets start growing again. |
| 100,000 | Ice age. Sea level drops enough to walk from Asia to Alaska. The constellations are unrecognizable. |
| 1,000,000 | You've lived 3× longer than Homo sapiens has existed, and seen 10+ supervolcano eruptions. |
| 10,000,000 | East Africa splits off along the rift and a new ocean forms. LA slides toward San Francisco. Most species are replaced. |
| 50,000,000 | Africa hits Europe: the Mediterranean closes into new mountains. Australia hits Asia. |
| 66,000,000 | As long as the time since the dinosaurs died. A dinosaur-killer-size asteroid hits about once per 100 million years. |
| 100,000,000 | Days are ~30 min longer, the Moon is ~3,800 km farther away, the Sun is ~1% brighter, and the continents are converging into a new supercontinent. All of human history is a thin layer in the rock. |

### Rendering

```bash
python youtube_short/million_years_short.py                     # renders the MP4 (~5 min on 4 cores)
python youtube_short/million_years_short.py --preview 3,60,140  # saves PNG stills for quick checks
```

- The narration is about 2,600 characters of ElevenLabs credits, cached in `youtube_short/.tts_cache/`.
- Each narration line can have a separate caption text, so captions show digits ("YEAR 100,000,000") while the voice reads the words.

---

## Shorts safe zone (story videos)

On phones, YouTube zooms 9:16 Shorts to fill the screen, which crops about 50–100 px off each side. It also draws its own buttons over the top (Subscriptions / Live / Lens) and the bottom-right (like, comment, share). The story engine keeps everything important out of those areas:

- `PANEL_Y = 560`: the title box sits just above the panel, below YouTube's top buttons, and is at most 860 px wide.
- `TAG_INSET = 100`: the time/countdown tags are 100 px in from the panel edges, so the numbers aren't cut off.
- Captions wrap at 820 px. In the scenes, clouds, cards and labels stay roughly between x = 100 and 980 of the frame.

If a video was already uploaded with the old layout, upload the re-rendered file as a new Short. YouTube doesn't let you replace the video file of an existing upload.

---

# POV Short: "What if GTA 6 was delayed for another year?"

**Video:** [`gta6_delay_story.mp4`](gta6_delay_story.mp4) is vertical 1080×1920, 30 fps, about 1:25 long, narrated by Mike.

This one uses a different, cinematic POV style: full-screen blocky low-poly 3D scenes seen through your own eyes, with minimal serif typography. A small letter-spaced kicker ("DELAYED") sits above a big serif chapter label ("MINUTE 3", "DAY 1", "MONTH 6"), with one italic caption per narration line.

- [`pov3d.py`](pov3d.py) is a tiny box-based 3D renderer written with numpy and Pillow. It handles cameras with look-at targets, near-plane clipping, flat shading with point lights and fog, a layered painter's sort, perspective-correct textured screens, glow sprites, bloom, a vignette and the text overlays.
- [`gta6_delay_short.py`](gta6_delay_short.py) contains the story: the sets (bedroom, game store, studio meeting room, birthday party), the screen contents (earnings-call stream, stock chart, phone notifications, countdown TV, whiteboard, leak files, platform list, trailer, loading screen), the camera moves, Mike's narration, and ambient music with sound design.
- Fonts: EB Garamond (SIL Open Font License, see [`fonts/OFL.txt`](fonts/OFL.txt)) and Inter.

The story starts from real facts as of November 1, 2026: GTA 6 is set for November 19, 2026, it was delayed twice before and Take-Two's stock fell both times, there's no PC version at launch, GTA 5 came out September 17, 2013, about 90 clips leaked in 2022, and trailer 1 got 90M+ views in 24 hours. It then imagines the extra year: the stock drop, the phone blowing up, stores, other studios moving their games, leaks, the PC problem, a kid turning 14, a new trailer, and a launch-night twist.

```bash
python youtube_short/gta6_delay_short.py                    # renders the MP4 (~12-15 min on 4 cores)
python youtube_short/gta6_delay_short.py --preview 2,20,60  # saves PNG stills for quick checks
```

---

# Story Short: "What if you switched bodies with your crush?" (Part 1)

**Video:** [`crush_swap_story.mp4`](crush_swap_story.mp4) is vertical 1080×1920, 30 fps, 2:09 long (under the 3-minute Shorts limit), narrated by Mike.

[`crush_swap_short.py`](crush_swap_short.py) uses the same engine and layout as the first story video: plaid frame, title box, cartoon panel, **Part 1** label, synced captions, a time-of-day tag and a live countdown to midnight. New in this one:
- **Soul badges:** a small bubble over each head shows whose mind is inside that body (blue **ME**, pink **MIA**). At midnight the two badges fly back to their own bodies.
- **The voice follows the body.** Mia talking from my body uses my voice (Mike), and I talk from her body with her voice (Jessica). Caption colours follow the mind: white for the narrator, pink for Mia, blue for me.
- **A real sung line** for the talent show ("You sit in the back row… and you never say hi"), plus a piano score, both made with the ElevenLabs Music API. Applause, crowd, hallway, birds and the "swap" whoosh come from the ElevenLabs sound-effects API. Everything is saved in [`audio/crush_swap/`](audio/crush_swap/), so re-renders sound the same.
- Camera push-ins and punch-ins on the big moments (the mirror reveal, the notebook, the confession).

| Time | What happens |
|------|--------------|
| 7:00 AM | I wake up in a room that isn't mine, walk to the mirror, and see Mia, my crush. I'm in her body. |
| 7:01 AM | A text from my own number: "why am i in your body??" Then a notification with no app and no sender: to switch back, each of us must do the thing the other is most afraid of, by midnight, or we stay like this forever. |
| 8:00 AM | We meet behind the school. My body walks up wearing my hoodie backwards. Her fear: singing her own song at tonight's talent show. Mine: "public speaking" (a lie). |
| 11:00 AM | She gives a speech in my class and nails it. Nothing happens. "what are you ACTUALLY scared of??" I type a reply, then delete it. |
| 5:00 PM | Her notebook has a song about a boy in the back row who never says hi, with a doodle of a boy with my hair in the margin. "Lucky guy." |
| 9:30 PM | Backstage, her hands won't stop shaking, and I finally get how she feels every day. |
| 9:31 PM | I sing her song in her voice, and the whole gym stands up. "1 of 2 complete." |
| 11:59 PM | She found my notes app: 214 unsent messages that all start with "Mia". She says my confession out loud in my voice. 3, 2, 1, and our minds switch back. |
| Next morning | I'm back in my own body. At my locker she tells me the song was about me ("it was always you"), so this time I say hi. |
| Ending | "Would you switch bodies with your crush?" with a YES 💘 / NO WAY 😳 split screen. |

### Voices

| Role | ElevenLabs voice |
|------|------------------|
| Narrator, and my body | Mike - 2D & 3D POV/Storytime |
| Mia's body | Jessica |
| Talent-show host | Roger |
| Sung line | Eleven Music (`music_v1`) |

### Rendering

```bash
python youtube_short/crush_swap_short.py                     # renders the MP4 (~4-5 min on 4 cores)
python youtube_short/crush_swap_short.py --preview 6,40,99   # saves PNG stills for quick checks
```

- The narration is about 2,100 characters of ElevenLabs credits, cached in `youtube_short/.tts_cache/`.
- Missing music or sound effects are generated automatically from the prompts in `music_plan()` and `SFX`. To regenerate one, delete its file in `audio/crush_swap/`. Use `--no-gen` to skip generating, or `--assets-only` to generate without rendering.
- Every voice clip is matched to the same speech level, the score is capped so it never covers a voice, and the final mix is normalised to −14 LUFS with two-pass loudnorm.
