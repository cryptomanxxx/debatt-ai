---
title: "Transient GitHub Actions-avbrott i AI-Koalitioner test — ingen kodfix"
type: infrastructure
severity: low
risk: low
file: .github/workflows/koalition-test.yml
status: suggestion
---

## Sammanfattning

Workflowen **AI-Koalitioner test** (`koalition-test.yml`) misslyckades under GitHub Actions
uppstartsfas — inte i vår kod. Felet är transient och beror på ett GitHub-sidigt driftavbrott.

## Fellogg (relevant del)

```
koalitioner  Set up job  Getting action download info
koalitioner  Set up job  Failed to resolve action download info. Error: Service Unavailable
koalitioner  Set up job  Retrying in 16.738 seconds
koalitioner  Set up job  Failed to resolve action download info. Error: Service Unavailable
koalitioner  Set up job  Retrying in 16.882 seconds
koalitioner  Set up job  ##[error]Bad Gateway
koalitioner  Set up job  ##[error]Failed to resolve action download info.
```

## Rotorsak

Felet uppstod i steget **"Prepare all required actions" → "Getting action download info"**,
alltså *innan* något steg i jobbet kördes (checkout, setup-python, pip install eller
`python -u koalition_test.py`). GitHub kunde inte slå upp nedladdningsinformationen för de
`uses:`-actions workflowen refererar (`actions/checkout@v7`, `actions/setup-python@v6`).

`Service Unavailable` (503) och `Bad Gateway` (502) är HTTP-svar från GitHubs egen
action-resolution-tjänst. Detta är ett tillfälligt driftavbrott hos GitHub, bekräftat av att:

- Felet inträffade före all vår kod och alla våra secrets rördes.
- GitHub gjorde två automatiska retries som båda fick 502/503.
- Ingen rad i loggen pekar på `koalition_test.py`, `ai_klient.py`, `supabase_utils.py`
  eller någon Python-import.

## Åtgärd

**Ingen kodändring krävs.** `koalition-test.yml` är korrekt uppbyggd och
`koalition_test.py` var aldrig inblandad i felet.

Rekommenderad hantering:

1. **Kör om workflowen** (`workflow_dispatch` eller invänta nästa schemalagda körning
   kl 11:00 svensk tid) — felet försvinner när GitHubs tjänst är återställd.
2. Kontrollera vid behov [GitHub Status](https://www.githubstatus.com/) för att bekräfta
   ett Actions-incident kring `2026-07-13T13:27–13:30Z`.

## Valfri härdning (framtida robusthet)

Transienta action-resolution-avbrott kan inte förhindras från vår sida (de sker före våra
steg), men om samma workflow ofta drabbas kan man överväga:

- Ett schemalagt retry-fönster — t.ex. en andra cron-post några timmar senare — så att en
  enstaka GitHub-glitch inte betyder att dagens koalitionsbildning uteblir helt.

Detta är enbart en robusthetsförbättring, inte en fix för det aktuella felet.
