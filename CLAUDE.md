# Project instructions

## Making videos (YouTube Shorts in `youtube_short/`)

When making or remaking a video, use these four tools:

1. **animation-studio** (skill) builds the video itself: a project folder under `youtube_short/`, a `score.js` timeline, the synthesized music and sound effects, and drawn scenes. `youtube_short/attractive-24h-v2/` is the reference project.
2. **TubeAlfred YouTube** (MCP) handles research before writing: hooks and titles of similar Shorts, keyword ideas, comments and competitor channels. Use what's actually there, and don't invent numbers.
3. **AI video editor & Timeline by ManyMotions** (MCP) handles editing on a timeline (cuts, trims, captions, transitions, MP4 export) and generated clips when a shot needs real footage.
4. **Abracadabrax YouTube Thumbnail maker** (MCP) makes the thumbnail or cover for each video.

Defaults for the "What If" story Shorts:
- Keep the same style: plaid frame, white title box, **Part 1** label, black-headed characters in coloured hoodies, word-synced captions, a time-of-day tag and a countdown tag.
- Shorts are vertical 1080×1920 and under 60 s. Open with a strong hook in the first 2 s, with text on screen from the first frame.
- Narration uses ElevenLabs with the Mike voice (`zfc8CJQpe8Kqyl0vvCzo`). Check the remaining credits first, and keep the generated clips in the project's `assets/vo/` so re-renders cost nothing.
- Deliver the MP4 to the user, then commit and push it to the working branch.
- Explain things to the user in simple, numbered steps. They often work from a phone.

Also available: the official **Remotion** skills in `.claude/skills/remotion-*`, from `remotion-dev/skills` at commit `30d4553`. They cover React-based video with smooth animation, captions and rendering. Consider them for new videos that need more polished motion than the Python or animation-studio pipeline gives. Start with `/remotion-best-practices`.

If one of these tools isn't available in a session (for example, if its MCP server didn't connect), say so up front, carry on with the rest, and don't fake its output.
