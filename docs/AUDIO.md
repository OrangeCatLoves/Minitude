# Sound

All sound is made live with WebAudio in `packages/web/src/audio.ts`. There are no audio files. The recipes are ports of `tools/art-source/engine-prototype/audio21.py`.

## Parts

- **Primitives:** `tone` (sine, square, triangle, saw, with a frequency sweep), `bell` (three partials), `noiseBand` (band-limited noise), `swish`, `click`, `riser`, `pad` (chord with vibrato), `sparkles` (random bells), `glide` (the slow rising tone of the finale).
- **Stings:** the six rarity stings (`sting()`) are rendered once into buffers with an `OfflineAudioContext` after the first click, so a Mythic sting is one buffer source at play time. Until they are ready, or if rendering fails, they are built live.
- **Scheduling:** when the judge answers, everything that follows for that question (check ticks, valid bell, rarity roll ticks, risers and heartbeats, the sting, count-up, charge, stamp, whoosh, world gates, landing, title card) is put on a queue by game time. Each frame releases what is due in the next 0.25 s at the matching audio time, so sound stays locked to the picture. Late events (more than 0.12 s) are dropped.
- **The player's own actions** (typing ticks, Enter click, rejection buzz) play immediately.
- **Finale:** `finaleA` (launch, the dark, heartbeats, the rising light, the held breath, the burst) is built when the dive starts; `finaleB` (impact, bells, sparkles, the D-major bell line) when it ends. They use their own bus, which is not ducked or compressed. The normal mix is ducked to 3% from 0.5 s into the dive until 0.5 s after the landing, then returns for the title card sounds.
- **Drone:** four sines that sink in pitch as the explorer shrinks (82 Hz at the start, never below 30 Hz) plus a little air that opens with speed.
- **Mix:** main bus -> duck -> compressor -> + finale bus -> tanh soft limiter -> master. A short reverb is sent from both buses at the original's very low level.

## Levels

The video's audio was normalised after mixing. The browser mix was matched to it numerically (`tools/browser-test/audio-levels.cjs`): per-second RMS and peak of an all-Mythic run are within 2-3 dB of the video's track, and the finale impact peaks within 1 dB. This only proves the loudness structure. **Nobody has listened to it.** If anything sounds harsh, thin or too loud, the first suspects are:

- `noiseBand()` - the original used brick-wall FFT noise; this uses two second-order filters, so noise bands are softer at the edges.
- `post.gain`, `makeup.gain`, `this.fin.gain` in `build()` - overall levels.
- The compressor settings in `build()` (the original used a custom slow gain curve).

## The report

- `Sfx.report`: two swishes, a fast run of ticks, then a tick and a bell for each of the seven rows. The closing chord that followed them (four rising bells over a low note, 3.4 s after the report opened) was **removed at the owner's request on 25 Nov 2026**; a perfect run still gets its sparkle at that moment.

## Not done

- No music. The video had none.
- No stereo sound for wide screens, no volume slider (mute only).
- Sounds are not adjusted for `prefers-reduced-motion`.

## The gem (tier 6)

- A seventh sting (`sting(..., 6)`, rendered with the others): the birth, ported from the owner-approved draft: a deep boom, a crash of light with three glass bells, a rising seven-note glass arpeggio over a pad, thirty-four sine glints, then a warm chord.
- `Sfx.scheduleGemPull`: before the birth, a rising drone with air drawn inward and a falling whistle, a heartbeat that speeds up, then the ordinary mix is ducked (`duck`, as under the finale) for the vacuum and released at the exact moment of the birth.
- `chg + 0.1`: a swish and five glints for the gem flying into the counter.
- Levels (offline render, `node audio-levels.cjs 6`): peak -6 dB against -5 dB for a Mythic, no clipping. **Not yet heard by a person.**
- Gotcha: `bell()` adds partials at 2.76x and 4.1x its pitch, so a bell above about 5 kHz goes past 22 kHz and the browser warns; high glints are plain sine tones.
