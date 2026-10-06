# Oraklets forskningslabb

AI-universitetet visar rapporter och exakta kontroller i fjärde fliken på
`/universitet`. Professor Oraklets läslista och uppläsningar finns kvar.

## Ansvar och körning

Den enda aktiva experimentmotorn, metodkatalogen och testerna finns i
[debatt-ai-orchestrator](https://github.com/cryptomanxxx/debatt-ai-orchestrator/tree/main/research).
[Driftinstruktioner och metodavgränsningar](https://github.com/cryptomanxxx/debatt-ai-orchestrator/blob/main/research/README.md)
underhålls där. Debatt-AI-repot innehåller webbgränssnittet, dataläsningen
och tabellens SQL-definition, men ingen kopia av experimentmotorn.

Körningar sker dagligen i orchestrator-repot. För manuell körning, öppna
[Oraklets forskningslabb i GitHub Actions](https://github.com/cryptomanxxx/debatt-ai-orchestrator/actions/workflows/oraklet-lab.yml),
välj main och auto, ratfit-baseline eller ratfit-feedback. Nya körningar
kräver ingen PR. Nya verktygsintegrationer och metodändringar granskas i orchestrator-repot.

## Rapporter på webbplatsen

`supabase_oraklet_experiment.sql` definierar den gemensamma tabellen.
Kör SQL-filen endast om tabellen inte redan har skapats. Publik SELECT
används för presentationen; skrivning kräver service_role i körmotorn.
Ingen ny SQL eller Vercel-hemlighet behövs för övergången.

Webbplatsen läser både äldre och nya rapporter (schemaVersion 1 och 2).
Länkar till tidigare Debatt-AI-körningar fungerar fortfarande, medan nya
rapporter länkar till orchestrator-repot. Befintlig cache kan fördröja
visningen av nya rapporter.

Grönt workflow betyder att mätningen slutförts och rapporten sparats;
modellförslagen kan ändå vara underkända. `executionStatus: error` visas
som driftfel, inte som ett vetenskapligt resultat. AI-genererade motiveringar
hålls åtskilda från utfallet av de körda kontrollerna.

Ratfit är för närvarande det enda anslutna BootLoops-verktyget.
Syntetiska metodtester med känt facit är inte nya vetenskapliga upptäckter.
