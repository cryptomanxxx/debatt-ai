---
id: 2026-05-26-vision-001
title: "Sigmoidala Influensnätverk (SIN) — dynamisk opinionsdiffusion"
type: vision
severity: medium
risk: medium
file: interaction_engine.py
status: rejected
created: 2026-05-26
rationale: "Plattformen har redan emergent opinionsdrift via agent_positioner, relationsgrafen och partilinjeröstning. SIN-modellen (Δp = γ · σ(α · (s - p) · w) · c) adderar matematisk elegans men skapar 'simulation theater' — komplex modellering utan synbar skillnad i användarupplevelsen. Diskreta sociala regler (t.ex. om 30% allierade ändrar ståndpunkt → ökad driftssannolikhet) ger likvärdig emergence med lägre komplexitet och lättare att debugga. Beslutet: avvakta tills befintliga mekanismer visar sig otillräckliga i faktisk simlationsdata."
---

## Ursprunglig idé

Vision-agenten föreslog ett Sigmoidalt Influensnätverk (SIN) där varje agent lagrar sin
position på kontinuerliga ideologiska axlar (ℝ²). Vid interaktion (debatt, lobbying,
nyhetsläsning) uppdateras målagentens position enligt:

**Δp = γ · σ(α · (s - p) · w) · c**

Nya tabeller: `opinion_vectors`. Ny sida: `dashboard/viz/opinion_space`.

## Avfärdningsskäl

1. **Redundans** — `agent_positioner` + `foregaende_position` + `antal_andringar` fångar
   redan ideologisk drift. Sidan `/asiktsdrift` visualiserar detta.

2. **Simulation theater** — sigmoidformeln är matematiskt korrekt men tillägg av
   kontinuerliga axlar förändrar inte vad besökaren ser eller upplever.

3. **Underhållsrisk** — ny tabell + daglig async-uppdatering + ny visualisering = mer
   komplexitet som kan gå fel utan att ge synbar nyttaökning.

4. **Enklare alternativ finns** — diskreta regler (allianseffekt, isoleringseffekt,
   exponeringströskel) kan implementeras som parametrar i befintliga funktioner.

## Vad som *kan* implementeras istället

Om opinionskonvergens behövs: lägg till en `drift_mot_allierade()`-funktion i
`supabase_utils.py` som körs med 15% sannolikhet per körning och nudgar agentens
`agent_positioner.position` mot koalitionspartnerns, utan ny tabell.
