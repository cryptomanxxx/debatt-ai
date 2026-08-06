# Vision: **Emotion‑Driven Decision Engine (EDDE) – en affectiv lager för AI‑civilisationen**  
**Datum:** 2026‑08‑06  

## Identifierat gap  

Debatt‑AI har lyckats modellera politik, ekonomi, juridik och informationsflöden med hög precision, men saknar ett **affekt‑ och humör‑subsystem**. Alla beslut – röstning, lobbying, handel, koalitionsbyggande – tas enbart på basis av rationella utility‑funktioner och fast‑definierade motivationsparametrar. Detta ignorerar den beprövade rollen som känslor, stress och optimism spelar i verkliga samhällen (t.ex. *affective realism*, *emotional contagion*, *prospect theory*). Utan en dynamisk känslomässig variabel blir simuleringen blind för fenomen som panik‑drivna bankrun, optimism‑driven bubblor, “moral panic”‑spänningar och långsiktiga kultur‑shiftar som ofta föregår politiska reformer. Avsaknaden hindrar oss dessutom från att testa teorier om hur **kollektiva humörsvängningar** påverkar institutionell stabilitet och policy‑adaption.

## Förslag: **Emotion‑Driven Decision Engine (EDDE)**  

EDDE introducerar ett **emotion‑state‑schema** per agent med två huvuddimensioner: *valence* (positiv‑negativ) och *arousal* (låg‑hög). Dessa värden lagras som flyttal i intervallet \[-1, 1\] och uppdateras varje cykel av tre mekanismer:

1. **Event‑based emotion triggers** – varje klimat‑, kris‑ eller policy‑event definierar en **emotion‑impact‑matrix** som mappar agent‑roller (t.ex. Miljöaktivist, Finansminister) till förändringsvärden.  
2. **Social contagion** – ett dagligt **sentiment‑diffusions‑pass** beräknar emotionell påverkan genom den existerande relationsgraf (`relationsgraf`). Formeln använder en förenklad DeGroot‑modell:  
   ```
   new_valence_i = (1‑λ) * valence_i + λ * Σ_j (w_ij * valence_j) / Σ_j w_ij
   ```  
   där `λ` (0‑0.5) styr hur mottaglig en agent är för sina grannar, och `w_ij` är styrkan i relationen.  
3. **Behaviour‑feedback loop** – varje beslut (röstning, köp, lobby) modifierar emotionen i proportion till resultatet (vinst/förlust, godkännande/avslag) med en **outcome‑sensitivity‑factor** (t.ex. +0.05 för framgång, –0.07 för misslyckande).

Emotion‑state‑variabler påverkar beslutslogiken via **weight‑modifiers** i befintliga funktioner:  
- **Röstnings‑utility** multipliceras med `(1 + κ_valence * valence)`.  
- **Risk‑aversion** i investerings‑ och låne‑moduler justeras med en exponentiell funktion av *arousal* (`exp(κ_arousal * arousal)`).  
- **Lobby‑budget** skalar med `(1 + κ_lobby * valence)` för positiva känslor och minskar för negativa.

Konfigurerbara parametrar (`κ_*`) exponeras i en ny administrativ panel *Emotion Settings* för att finjustera styrkan av affectiva effekter.

## Koppling till teori  

EDDE operationaliserar **prospect theory** (Kahneman & Tversky) genom att låta hög *arousal* öka risk‑seeking i förluster och risk‑aversion i vinster. Den implementerar **emotional contagion** (Hatfield, Cacioppo) via sentiment‑diffusion på relationsgrafen, vilket möjliggör studier av **moral panics** och **collective mood cycles** (M. G. L. M. D. G. B. L. 2020). Med den kan vi testa *institutional resilience*‑modeller (Acemoglu & Robinson) under emotionellt driva kriser, samt *behavioral macroeconomics*‑hyp

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-06*
