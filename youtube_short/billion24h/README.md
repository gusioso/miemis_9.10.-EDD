# "What If You Had To Spend $1 Billion In 24 Hours?" (Part 1), made with Remotion

**Video:** [`../billion_24h_story.mp4`](../billion_24h_story.mp4) is vertical 1080×1920, 30 fps, 1:57, −14 LUFS.

Channel style (plaid frame, title box, **Part 1**, cartoon characters, word-synced captions). The HUD shows the time of
day, a live **💰 balance** that drops on every purchase, and a **⏳ 24h countdown**.

| Time | What happens |
|------|--------------|
| 12:00 AM | $1,000,000,000 lands. Rules: spend it all in 24 h, leftovers disappear, no giving it away. |
| 12:05 AM | Real math: you'd have to spend $11,574 every second. |
| 8 AM | Your card gets frozen for fraud. 40 minutes on hold = $27M of wasted time. |
| 10 AM | You buy every car at the dealership: 23 cars, $41M. The salesman cries. |
| Noon | A used private jet, $62M. "Prove it's real." "...Again." |
| 2 PM | Dream mansion, but closing takes 30 days. TOO SLOW. |
| 4 PM | $85M for a painting of a blue square. |
| 6 PM | Only 18.8% spent. Friend: "solid gold gaming console!" Mom: "buy groceries." |
| 10 PM | Medical debt: charities buy it for pennies, about $1 erases ~$100. |
| 11 PM | Buying (not giving!) $800M of debt erases ~$80B for millions of strangers. |
| 11:59 PM | The last $12M buys Tony's Pizza. 10…1. Balance: $0.00. |
| Next morning | A mailbox full of thank-you letters. Mom: "So... did you buy groceries?" |

The voice is free and offline: a Kokoro 60/40 blend of am_puck and am_liam that sounds close to Mike. The music and
sound effects are synthesized in `tools/make_audio.py`.

```bash
cd youtube_short/billion24h && npm i
python3 tools/make_audio.py                      # voice + soundtrack + src/timeline.json
npx remotion render BillionShort out/billion.mp4   # then loudnorm to -14 LUFS (see the hypergamy README)
```
