# Debatt-AI's AI University in 3D

This directory contains **versioned, static Three.js experiments** for Professor Oraklet's virtual lecture hall. Each version is self-contained: do not replace or delete an older version when iterating.

## Version 13 — Presentation mode

- Full-height, semicircular observation-deck auditorium above a neon-lit futuristic city and cosmic night sky.
- Animated 3D Professor Oraklet and seated audience.
- Prerecorded lectures in **Swedish and English**, with independent narration and translated educational videos on the lecture screen. Use **“Listen to Professor Oraklet in English”** to change language and begin listening; use the Swedish switch to return.
- Click/tap the auditorium screen or select **“Se presentationen i närbild”** to fly to a readable close-up. **“Tillbaka till salen”** restores the exact previous camera position.
- Desktop mouse and mobile touch controls.

Entry point: `v13/index.html`

When deployed by the Next.js site with the standard `public/` directory, the public URL will be **`/ai-universitet-3d/v13/index.html`**. Test the route and assets in the production deployment before linking from the homepage or `/universitet`.

### Implementation notes

- All local assets and JavaScript modules use paths relative to `v13/index.html`.
- Three.js and OrbitControls load from the pinned jsDelivr Three.js **0.180.0** CDN. A network connection is required.
- MP3 voice clips and MP4 lecture videos in both languages are **prerecorded demonstrations**; no live AI API request is made. The English voice is an offline-generated synthetic demonstration voice, not a clone of Professor Oraklet's voice. See `v13/assets/audio/CREDITS.md`.
- The 2D avatar images provide a fallback for devices without WebGL; the normal experience uses the procedural 3D character in `oraklet-3d.js`.
- This is an independent static presentation, not a replacement for the existing interactive AI University page.
- CI validates JavaScript syntax, translated audio/video pairs, transcripts, avatar assets and the reversible language switch with `node scripts/check-ai-universitet-3d.mjs`; Next.js build CI also runs when these 3D assets change.

### Release process

1. Create a fresh version directory (for example, `v14/`), leaving `v13/` intact.
2. Test the new scene on desktop and Android touch screens, including both languages' audio/video playback and navigation.
3. Create a PR for code review and CI, then merge when ready.
4. Add links or an announcement to Debatt-AI's homepage and `/universitet` in a **separate, deliberate release**.

Source is also previewed privately during development in the Professor Oraklet VR Lab Site.
