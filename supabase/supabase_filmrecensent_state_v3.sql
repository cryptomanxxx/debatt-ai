-- Migrering: lägger till pending_run_id på filmrecensent_state.
--
-- Sedan ✅128/✅129 (CLAUDE.md) körs Filmrecensentens 4 dagliga pass i EN
-- GitHub Actions-körning med bara 60s mellanrum, istället för 4 separata
-- körningar utspridda över ~12 timmar (08/12/16/20 svensk tid). Utan detta
-- fält räknade hamta_video_kandidat() upp pending_forsok EN GÅNG PER
-- INTERNT PASS — en kort transient leverantörsstörning (t.ex. Groq/
-- DeepSeek nere några minuter) kunde då räkna upp forsok på alla 4 pass
-- och nå MAX_PENDING_FORSOK (3) inom loppet av ~3 minuter, vilket permanent
-- hoppade över en helt giltig, ännu ej recenserad video (Codex-fynd,
-- PR #1501-granskning).
--
-- Fix: pending_run_id sparar vilken GITHUB_RUN_ID som senast räknade upp
-- pending_forsok. hamta_video_kandidat() räknar bara upp forsok EN GÅNG
-- per körning (dag) — ett senare pass i SAMMA körning som ser
-- pending_run_id == dagens run-id väntar tills nästa körning istället för
-- att räkna upp igen. Se filmrecensent.py → AKTUELL_KORNING_ID.
alter table filmrecensent_state
  add column if not exists pending_run_id text;
