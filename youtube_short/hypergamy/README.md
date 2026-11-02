# "What If Hypergamy Didn't Exist?" (Part 1), made with Remotion

**Video:** [`../hypergamy_story.mp4`](../hypergamy_story.mp4) is vertical 1080×1920, 30 fps, 59.5 s, −14 LUFS.

Same channel style as the other story Shorts (plaid frame, title box, **Part 1**, black-headed characters in hoodies,
word-synced captions, a time tag and a 💘 MATCHES counter), but built in Remotion (React + SVG).

| Time | What happens |
|------|--------------|
| Day 1, 7 AM | Hypergamy is DELETED. Nobody cares about money, height or status. |
| Day 1, 9 AM | The dating app's 6 ft filter disappears. You change "6 ft" to 5'7". "Finally." |
| Day 1, 2 PM | A $900 rented Lamborghini gets crickets. Everyone pets the golden retriever. |
| Week 1 | Luxury watch sales crash. A private-jet selfie gets 0 likes ("cool, but are you funny?"). |
| Month 1 | First date: you talk about yourself for 2 hours. NO 2ND DATE. Personality: required. |
| Month 6 | You learn to cook, actually listen, take a pottery class. Your bowl looks like a potato 🥔. |
| Year 1 | A billionaire says his hobby is "business". Left on read. |
| Year 10 | You marry the girl who laughed at your potato bowl. |
| Real life | In a 37-culture study (Buss, 1989), men and women both rated kindness near the top. |

## How it's built

1. `tools/make_audio.py` holds the script. It makes the voiceover (free Kokoro voice "am_michael", cached in `public/assets/vo/`), synthesizes the music and sound effects, mixes everything to `public/soundtrack.wav` (−14 LUFS) and writes `src/timeline.json` (scene and caption timings).
2. `src/` is the Remotion project: `Person.tsx` (the character), `ui.tsx` (bubbles, stamps, cards, chips), `scenes.tsx` (the 10 scenes with camera moves) and `Video.tsx` (frame, title, tags, captions, audio).
3. Render, then normalise the loudness (Remotion's stereo mix comes out about 3 dB hot):

```bash
cd youtube_short/hypergamy
npm i
python3 tools/make_audio.py                 # needs ../kokoro/ model files (see the main README)
npx remotion studio                         # preview
npx remotion render HypergamyShort out/hypergamy_story.mp4
```

The narration uses the free voice because the ElevenLabs credits had run out. To switch to Mike later, generate the
lines with ElevenLabs in `tools/make_audio.py` and run the steps again.
