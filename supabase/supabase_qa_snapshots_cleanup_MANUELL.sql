-- ⚠ MANUELL ENGÅNGSRENSNING — körs INTE automatiskt. Granska först.
--
-- Bakgrund: fram till okt 2026 sparade agents/qa-observer.js varje sidas
-- skärmdump som base64 i qa_snapshots.screenshot_b64 (~330 kB per rad,
-- ~228 MB totalt). Bara de 6 sidorna på /qa-tidslinje
-- (app/qa-tidslinje/sidor.json) läser någonsin bilderna. Övriga sidors
-- bilder används inte av någon kod.
--
-- Rensningen nollar bara screenshot_b64 för sidor som INTE finns på
-- /qa-tidslinje. All metadata (vecka, status, orsak, detalj, konsolfel)
-- behålls, liksom tidslinjesidornas bilder (~37 MB), så att tidslinjen
-- och GIF-exporten fortsätter visa historiken.
--
-- Kör stegen ett i taget.

-- ── Steg 1: förhandsgranska vad som rensas ───────────────────────────────
select
  count(*)                                            as rader_som_rensas,
  pg_size_pretty(sum(pg_column_size(screenshot_b64))) as frigors_ungefar
from qa_snapshots
where screenshot_b64 is not null
  and sida_path not in ('/dynamik', '/oligarki', '/kompass', '/partier', '/trust', '/bors');

-- ── Steg 2: rensa (nollar bara bilddata, raderar inga rader) ─────────────
update qa_snapshots
set screenshot_b64 = null
where screenshot_b64 is not null
  and sida_path not in ('/dynamik', '/oligarki', '/kompass', '/partier', '/trust', '/bors');

-- ── Steg 3: ge tillbaka diskutrymmet ─────────────────────────────────────
-- Ett UPDATE frigör inte disk direkt. Kör den här raden ENSAM (den får
-- inte ligga i samma körning som andra satser). Den låser tabellen några
-- sekunder, vilket är ofarligt här (skrivs bara på måndagar).
--
-- vacuum full qa_snapshots;

-- ── Valfritt: rensa även tidslinjesidornas gamla base64-bilder ───────────
-- Gör det bara om du kan avvara bilder äldre än nya Storage-bilderna på
-- /qa-tidslinje och i GIF-exporten. Byt datumet efter behov.
--
-- update qa_snapshots set screenshot_b64 = null
-- where screenshot_b64 is not null and vecka < '2026-W40';
