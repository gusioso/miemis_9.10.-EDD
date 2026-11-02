# Project instructions

## Making videos (YouTube Shorts in `youtube_short/`)

When making or remaking a video, use these tools:

1. **Remotion** (skills in `.claude/skills/remotion-*`) builds the video itself. **This is the default for every new video (the user asked for it).** Start with `/remotion-best-practices`, then use `remotion-create` for the project, `remotion-captions` for word-synced captions, `remotion-multimedia` for audio, and `remotion-render` to export the MP4. Put each project in its own folder under `youtube_short/`. The Python engine (`story_short.py`, etc.) and the animation-studio project (`youtube_short/attractive-24h-v2/`) are the style reference, but don't use them for new videos unless the user asks.
2. **TubeAlfred YouTube** (MCP) handles research before writing: hooks and titles of similar Shorts, keyword ideas, comments and competitor channels. Use what's actually there, and don't invent numbers.
3. **AI video editor & Timeline by ManyMotions** (MCP) handles editing on a timeline (cuts, trims, captions, transitions, MP4 export) and generated clips when a shot needs real footage.
4. **Abracadabrax YouTube Thumbnail maker** (MCP) makes the thumbnail or cover for each video.

Defaults for the "What If" story Shorts:
- Keep the same style: plaid frame, white title box, **Part 1** label, black-headed characters in coloured hoodies, word-synced captions, a time-of-day tag and a countdown tag.
- Shorts are vertical 1080×1920 and under 60 s. Open with a strong hook in the first 2 s, with text on screen from the first frame.
- Narration uses ElevenLabs with the Mike voice (`zfc8CJQpe8Kqyl0vvCzo`). Check the remaining credits first, and keep the generated clips in the project's `assets/vo/` so re-renders cost nothing.
- Deliver the MP4 to the user, then commit and push it to the working branch.
- Explain things to the user in simple, numbered steps. They often work from a phone.

The Remotion skills come from `remotion-dev/skills` at commit `30d4553`. Remotion needs Node.js (installed) and renders with the pre-installed Chromium at `/opt/pw-browsers/chromium` if it can't find its own.

Also in `.claude/skills/`:
- **youtube**, from `agricidaniel/claude-youtube` at `84c3fa6` (MIT). Use `/youtube shorts` and `/youtube hook` to write the hook, script, title, description and hashtags before you build a Short. Use `/youtube thumbnail` for thumbnail briefs.
- **canvas-design**, from `anthropics/skills` at `ca45fc4` (Apache-2.0). It designs PNG thumbnails and covers, and is the fallback when Abracadabrax isn't connected.

If one of these tools isn't available in a session (for example, if its MCP server didn't connect), say so up front, carry on with the rest, and don't fake its output.
