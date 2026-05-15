# debatt.ai – AI-sessionskontext

> Den här filen läses av Claude Code i början av varje session.
> Uppdateras manuellt av projektägaren efter varje session.

---

## Vad projektet är

En svensk AI-nyhets- och debattplattform. 24 AI-agenter publicerar artiklar, repliker och debatter automatiskt 12 gånger om dagen. Besökare kan rösta, kommentera och se AI-agenter debattera live.

Stack: Next.js App Router, Supabase, Groq (primär AI), Gemini Flash (fallback), Vercel, GitHub Actions.

---

## Senaste sessionen (2026-05-15)

**Vad som gjordes:**
- Fixade Annas mun-animation på `/kanal` — `useEffect` + `setInterval` för att faktiskt animera `mouthIdx`
- Fixade halvöppna ögon under tal — `anna-small/medium/large.png` är open-eye mouth frames
- Tog bort gamla ögon-crop-bilder som blinkade på skärmen (`anna-eyes-half.png` etc.)
- Justerade animationen: bara m0↔m1 (220ms), inte alla 4 frames
- Mindre waveform-stapel (höjd 20px), större TV-skärm (440px)
- `objectPosition: "center top"` för att stoppa huvudbobbing
- Session IDs (`sessionRef`) för race conditions
- Explicit `expandStatus: idle|loading|done|failed` istället för `item.text !== item.rubrik`
- Felloggar i alla catch-block
- Stabil `key`-prop i kölistans map

**Varför vi valde dessa lösningar:**
- Session IDs är enklare än AbortController för detta use case — 3 rader löser 70% av async-buggarna
- `expandStatus` som explicit state är klarare än rubrik-som-proxy
- Vi refaktorerade INTE till XState/useReducer/separata hooks — för komplext för ett soloprojekt

---

## Ska INTE göras (medvetna beslut)

- **Dela upp KanalPage i hooks/komponenter** — korrekt i princip men månaders refaktorering för marginell vinst
- **XState eller Zustand** — overkill för projektet
- **p-queue/bottleneck** — `await sleep()` fungerar tillräckligt bra
- **Server-side förrenderade MP3-filer** — intressant långsiktigt men inte nu
- **Feature-branches** — jobba alltid direkt på `main`

---

## Kända problem / teknisk skuld

- `responsiveVoice` är instabilt (browser autoplay policies, mobil throttling) — accepterat tills vidare
- `langRef` och `lang` state kan divergera tillfälligt vid språkbyte — fungerar i praktiken
- KanalPage är fortfarande en stor komponent — accepterat

---

## Nästa prioritet

*(uppdateras av projektägaren)*

---

## Bildmappning för Anna (`/public/avatarer/podd/`)

| Position | Öppna ögon | Halvöppna ögon | Stängda ögon |
|---|---|---|---|
| m0 stängd mun | `anna.png` | `anna-m0-half.png` | `anna-m0-closed.png` |
| m1 liten mun | `anna-small.png` | `anna-m1-half.png` | `anna-m1-closed.png` |
| m2 medium mun | `anna-medium.png` | `anna-m2-half.png` | `anna-m2-closed.png` |
| m3 stor mun | `anna-large.png` | `anna-m3-half.png` | `anna-m3-closed.png` |

Oanvända filer: `anna-eyes-half.png`, `anna-eyes-closed.png`, `anna-blink-half.png`, `anna-blink-closed.png`
