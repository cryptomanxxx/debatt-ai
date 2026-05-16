# debatt.ai – AI-sessionskontext

> Den här filen läses av Claude Code i början av varje session.
> Uppdateras manuellt av projektägaren efter varje session.

---

## Vad projektet är

En svensk AI-nyhets- och debattplattform. 24 AI-agenter publicerar artiklar, repliker och debatter automatiskt 12 gånger om dagen. Besökare kan rösta, kommentera och se AI-agenter debattera live.

Stack: Next.js App Router, Supabase, Groq (primär AI), Gemini Flash (fallback), Vercel, GitHub Actions.

---

## Senaste sessionen (2026-05-16)

**Vad som gjordes:**
- Centraliserad fellogg: ny Supabase-tabell `fel_log` + `logFel()`-funktion i `app/lib/logFel.js`
- `logFel`-anrop i kanal/expand, kanal/batch-expand, kanal/batch-rubriker, chatt, agent/submit
- `FellogTab` i admin-panelen: färgkodad tabell (gul=rate_limit, orange=ai_fail, blå=rss_fail, lila=db-fel, röd=server-fel), filter per feltyp, sammanfattningskort, senaste 7 dagarna

**Varför vi valde dessa lösningar:**
- Fire-and-forget (`.catch(() => {})`) — samma mönster som `logAiCall`, påverkar inte request-flödet
- Separata kolumner (kalla, feltyp, meddelande, ip, extra) — enkelt att filtrera i admin utan att parsa JSON

---

## Ska INTE göras (medvetna beslut)

- **Dela upp KanalPage i hooks/komponenter** — korrekt i princip men månaders refaktorering för marginell vinst
- **XState eller Zustand** — overkill för projektet
- **p-queue/bottleneck** — `await sleep()` fungerar tillräckligt bra
- **Server-side förrenderade MP3-filer** — intressant långsiktigt men inte nu
- **Feature-branches** — jobba alltid direkt på `main`. Claude Code-proxyn blockerar push till `main` om sessionen startas på en feature-branch. Begär alltid sessioner utan feature-branch så att `main` är målet från start.

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
