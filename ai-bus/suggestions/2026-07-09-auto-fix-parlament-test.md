---
title: "AI-Parlamentet test misslyckades — tom fellogg, ingen diagnosbar kodorsak"
type: bug
severity: low
risk: low
file: parlament_test.py
status: suggestion
---

## Sammanfattning

Workflowen **AI-Parlamentet test** (`.github/workflows/parlament-test.yml` → `python -u parlament_test.py`) rapporterades som misslyckad, men den bifogade felloggen var **tom**. Ingen deterministisk kodorsak kunde därför fastställas.

## Verifiering som gjordes

Följande kontroller uteslöt de vanligaste enkla kodfelen:

- **Syntax:** `python -m py_compile parlament_test.py` → OK.
- **Importer från `supabase_utils`:** Alla sju importerade symboler finns definierade:
  `rösta_på_lagforslag_block`, `skapa_lagforslag_ai`, `hamta_lagforslag`,
  `hamta_alla_roster_lag`, `analysera_alla_forslag_pis`, `kör_pis_monte_carlo_batch`,
  `hamta_agent_parti`.
- **`from agent import AGENTER, ANALYTIKER`:** Namnen assignas inte direkt i `agent.py`,
  men re-exporteras via `agent.py:24` (import från `agenter.py`) — importen resolverar korrekt.
- **`agent.py` parsar** utan fel.

Slutsats: koden är strukturellt intakt. Ett kod-fix vore gissning.

## Sannolika (infrastruktur-)orsaker

Eftersom skriptet är beroende av externa tjänster är felet troligen infrastrukturellt:

1. **AI-provider nere / rate limit (429/TPD):** Alla Groq-nycklar kan ha nått dagsgräns; fallback-kedjan (Gemini, Cerebras, Mistral m.fl.) kan också ha varit otillgänglig under körningen.
2. **Supabase-otillgänglighet:** Skriptet avbryter (`sys.exit(1)`) om `SUPABASE_ANON_KEY` saknas, och DB-anrop kan ha timeat ut.
3. **Vercel-proxy för riksdag-utfall:** `POST {BASE_URL}/api/admin/riksdag-utfall` — redan omslutet av try/except, så bör inte fälla körningen.
4. **Timeout på hela jobbet:** PIS + Monte Carlo-batchen kan ha dragit över tiden.

## Rekommenderad åtgärd

- **Först:** Kör om workflowen manuellt (`workflow_dispatch`) och fånga en **fullständig** fellogg. Auto-fix-pipelinen fick en tom logg och kunde därför inte agera.
- Om felet återkommer med en riktig logg: analysera det exakta undantaget. Om det är provider-uttömning bekräftar det värdet av den dynamiska fallback-kedjan i `ai_klient.py`.
- Ingen kodändring rekommenderas i nuläget — risk för att introducera brus i en fungerande fil.
