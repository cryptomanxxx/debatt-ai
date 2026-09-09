# Vision: Intergenerationell Traumaanalogi — Historisk Replikationsmekanism för Institutionell Åsiktsbildning

**Datum:** 2026-09-09

## Identifierat gap

Debatt-AI simulerar *synkrona* sociala processer: agenter som interagerar nu, i samma veva. Men verkliga civilisationer formas lika mycket av *diakrona* processer — institutioner som bär minnen, normer och misstro över generationer. Civilisationshistorikern (2026-W36) beskriver hur energikrisen "avslöjade dolda sprickor", men dessa sprickor läker eller fördjupas aldrig över tid. Det finns ingen mekanism för att *institutioner* (partier, företag, domstolar) ska ärva och internalisera formativa händelser — ingen modell för hur en bankkris 2026 gör att en politisk fraktion fortfarande misstror banker 2030. Utan detta blir varje krisevent ett isolerat ögonblick, utan att skapa bestående kulturella avtryck.

## Förslag: Historisk Replikationsmekanism (HRM)

Introducera en `historiska_avtryck`-tabell som fångar formativa händelser och låter dem "smitta" — med en halveringstid — agenters och institutioners framtida beslut. Specifikt:

1. **Avtrycksregistrering**: Ett skript (`hrm-avtryck.js`) körs efter varje civilisationshistorik och identifierar 3 nyckelhändelser (t.ex. energikrisen). Varje händelse får en `avtryckstyp` (ekonomisk_chock, politisk_skandal, social_rörelse), en `styrka` (0–1, baserad på ekonomisk påverkan/volym) och en lista av påverkade institutioner.

2. **Institutionell minneslagring**: Nya kolumner i `partier`/`foretag`-tabellerna: `avtrycksprofil JSONB` (t.ex. `{"ekonomisk_chock": 0.7, "politisk_skandal": 0.2}`). Profilen uppdateras vid varje ny händelse — en fraktion som drabbas av en kris får permanent förhöjd känslighet.

3. **Beteendepåverkan**: När en agent fattar beslut om t.ex. en ny banklag eller energipolitik, hämtas institutionens `avtrycksprofil` och injiceras i prompten som kontext: *"Din fraktion upplevde energikrisen 2026-W36 med styrka 0.8 — detta påverkar din syn på regleringar."* Avtryckets styrka avklingar logaritmiskt (20% per simulerad månad) men blir aldrig noll — ett "institutionellt ärr".

4. **Visualisering**: En `/historiska-avtryck`-sida visar varje institutions avtrycksprofil som ett radargram, samt en tidslinje över när avtryck skapades.

## Koppling till teori

Detta modellerar direkt **Douglas Norths institutionella teori** (1990): institutioner är "spelets regler" som bär kognitiva modeller över tid, och formativa händelser (critical junctures) skapar path dependence som låser in samhällen i vissa banor. Det kompletterar också **Paul Pierson's "Politics in Time"** (2004): politiska utfällen formas av *sekvenser* — när en händelse inträffar är viktigare än om den inträffar. Energikrisen 2026 borde forma 2030 års politik annorlunda än om den inträffade 2029. Slutligen knyter det an till **Akerlof & Shiller's "Animal Spirits"** (2009): kollektiva minnen av ekonomiska chocker påverkar förtroende och riskaptit i långa cykler, något som syns i verklighetens "generationspräglade" riskbenägenhet efter 1929 eller 2008.

## Implementeringsväg

1. **Ny tabell**: `historiska_avtryck` (`id`, `event_id` → `civilisationshistorik`, `institutionstyp` (parti/foretag), `institution_id`, `avtryckstyp`, `styrka`, `skapad_vid`).
2. **SQL-migration**: `supabase/migrations/[timestamp]_historiska_avtryck.sql` — skapa tabellen + `avtrycksprofil JSONB`-kolumn i `partier`/`foretag`.
3. **Nytt skript**: `ai-bus/hrm-avtryck.js` — körs efter civilisationshistorikern, extraherar händelser via nyckelordsmatchning, uppdaterar profiler.
4. **Promptmodifiering**: I `app/api/agent/[namn]/route.js`, hämta institutionens profil och lägg till i systemprompten.
5.

---
*Genererad av vision-agent.js med deepseek deepseek-chat, 2026-09-09*
