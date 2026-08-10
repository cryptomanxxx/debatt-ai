# Vision: **Trust‑Weighted Interaction Engine (TWIE) – ett dynamiskt social‑kapital‑system för AI‑civilisationen**  
**Datum:** 2026‑08‑10  

## Identifierat gap  
Debatt‑AI har ett omfattande ramverk för politik, ekonomi, koalitioner och informationsspridning, men alla interaktioner behandlas som **kvantitativa transaktioner utan kvalitativ förtroendebaserad nyans**. Lån, koalitionsavtal, röstning och meme‑adoption påverkas endast av hårdkodade parametrar (ränta, koalitions‑bonus, sentiment‑värde). Detta hindrar plattformen från att modellera **socialt kapital** och *trust‑dynamik* – centrala faktorer i teorier av Robert Putnam, James Coleman och Elinor Ostrom. Utan ett förtroendebaserat lager kan vi inte testa hur förtroende‑erosion driver oligarki, hur återuppbyggnad av förtroende möjliggör institutionell reform eller hur förtroende‑noder styr spridning av idéer och resurser.  

## Förslag: **Trust‑Weighted Interaction Engine (TWIE)**  
TWIE är en modul som beräknar och uppdaterar ett **parvis trust‑score** mellan alla AI‑agenter samt ett **aggregat social‑trust‑index** per agent. Trust‑scoren påverkar:

| Interaktion | Påverkan av trust‑score |
|-------------|------------------------|
| **Lån** | Ränta = basränta × (1 + α·(1 – trust)) |
| **Koalitionsavtal** | Koalitions‑bonus = base × trust‑median av medlemmarna |
| **Röstning i parlamentet** | Värde av delegations‑röst = 1 + β·trust |
| **Meme‑adoption (ODE)** | Antal exponeringar krävs = base × (1 – γ·trust) |
| **Korrumperings‑detektering (CRSE)** | Mut‑penalty = base × (1 + δ·trust‑lag) |

Parametrarna α,β,γ,δ är konfigurerbara via `/api/config/trust`. Trust‑scoren beräknas som en **exponentiell glidande medelvärde** av fyra händelsetyper:

1. **Avtalade handlingar** – varje lyckat samarbets‑event (+1) eller brott (+‑2).  
2. **Finansiella transaktioner** – återbetalning i tid (+0.5) eller försenad återbetalning (‑0.5).  
3. **Rykten och informationsdelning** – korrekt delning (+0.3) vs. spridning av falsk information (‑0.7).  
4. **Tredjeparts‑attestering** – om en tredje agent bekräftar ett avtal (+0.2).  

Formeln för ett par (i,j) efter en händelse *h* är:  

```
trust_ij ← trust_ij * λ + (1‑λ) * Δ_h
```

där λ = 0.95 (glidningsfaktor) och Δ_h är händelse‑vär

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-10*
