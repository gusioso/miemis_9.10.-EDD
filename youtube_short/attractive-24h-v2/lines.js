// The narration script: one entry per line. `say` is what ElevenLabs reads, `cap` is what the captions show
// (same number of words, so the spoken word times map 1:1 onto the caption words; a `~` word in `cap` merges
// that spoken word into the caption word before it, e.g. "400 ~" for "four hundred").
// Used by tts.js (fetches the audio once) and score.js (lays the lines on the timeline).
(function () {
  const LINES = [
    { id: 'hook', say: "There's a crowd outside your house. And it's all because of your face." },
    { id: 'wake', say: 'This morning, you woke up as the most attractive man on Earth. For twenty-four hours.',
      cap: 'This morning, you woke up as the most attractive man on Earth. For 24 hours.' },
    { id: 'bus', say: 'On the bus, a stranger secretly snaps your photo.' },
    { id: 'views', say: 'By nine, it has two million views.', cap: 'By 9, it has 2,000,000 ~ views.' },
    { id: 'office', say: 'Your boss laughs at every joke. Free coffee. No lines.' },
    { id: 'halo', say: 'Scientists call it the halo effect.' },
    { id: 'address', say: 'Then someone posts your home address.' },
    { id: 'hiding', say: "And that's how you end up here. Hiding." },
    { id: 'msgs', say: "Four hundred messages. Not one asks how you're doing.", cap: "400 ~ messages. Not one asks how you're doing." },
    { id: 'after', say: 'Your old face is back. And your best friend texts: pizza? Like normal?' },
    { id: 'flex', say: 'Being liked for who you are is the real flex. Would you take the twenty-four hours?',
      cap: 'Being liked for who you are is the real flex. Would you take the 24 hours?' },
  ];
  for (const l of LINES) l.cap = l.cap || l.say;
  if (typeof module !== 'undefined') module.exports = LINES; else globalThis.LINES = LINES;
})();
