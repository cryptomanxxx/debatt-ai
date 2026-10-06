# Oraklets forskningslabb

Labbet visas som fjärde flik i `/universitet`. Professor Oraklets befintliga läslista och uppläsningar finns kvar. Första experimentet är ett syntetiskt metodtest, inte ett påstående om ny forskning.

## Aktivering

1. Kör `supabase_oraklet_experiment.sql` i Supabase SQL Editor. Tabellen tillåter publik läsning, men endast service_role får skriva. Ingen ny Vercel-hemlighet behövs.
2. I debatt-ai-repot behöver GitHub Actions befintliga secrets `ORCHESTRATOR_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` och minst en AI-leverantörsnyckel från den dynamiska kedjan. `SUPABASE_ANON_KEY` används för kedjans sparade ordning.
3. Efter merge: Actions → Oraklets forskningslabb → Run workflow → main. Seed är 1–9 siffror. Ingen schemalagd körning och inget öppet webb-API startar experimentet.
4. Rapporten sparas i Supabase och som JSON/Markdown-artefakt. Universitetet uppdateras inom sin befintliga cachetid, 15 minuter. En misslyckad modellhypotes sparas som underkänt metodtest; nätverksfel/oväntade verktygsrapporter gör att körningen avbryts utan en färdig resultatpost.

## Experimentets avgränsning

Tre deterministiskt genererade rationella funktioner av typen `(a*x+b)/(c*x+d)`. Sex givna punkter, tre undanhållna punkter per fall. Modellprompten får bara de givna punkterna och formelklassen, inte seed, facit eller kontrollvärden. Fingeravtryck för alla fall loggas före modellförslag. Facit och data avslöjas först i den slutliga rapporten. Detta är blindning av just modellprompten, inte skydd mot en agent med tillgång till koden.

Oraklet väljer `bootloops_ratfit` och föreslår heltalskoefficienter via samma dynamiska AI-router som läslistan. Ingen godtycklig modellgenererad kod körs. Ratfit anropas sex gånger via den befintliga autentiserade Cloudflare-orchestratorn: tre riktiga fall och tre fall med exakt ett felaktigt kontrollvärde. Rapporten kräver upstream-version `66b680ce742e654cfe86da4f072a69061fe182b1`, riktiga verktygsresultat och rätt verifieringsscope. Modellen har högst tre godkända svar; fallback-kedjan kan göra ytterligare försök om en leverantör misslyckas.

En separat verifierare använder BigInt och korsmultiplikation, utan BootLoops/Thiele-kod, för att kontrollera modellens koefficienter mot både givna och undanhållna punkter. Verifieraren måste själv acceptera facit och avvisa ett planterat fel. Ratfit returnerar inte en formel: dess rapport verifierar sin egen rekonstruktion, medan den separata kontrollen verifierar Oraklets förslag. Vi påstår inte att båda verktygen har bevisat en identisk formel för alla möjliga x.

GitHub Actions status anger om experimentet gick att genomföra och spara. Rapportens `status` anger om modellförslagen klarade kontrollerna. En grön körning kan därför innehålla underkända modellförslag. AI:s metodmotivering märks som AI-genererad; rapportens resultattext skapas deterministiskt från körda kontroller. Ingen automatisk artikelpublicering görs.

Cloudflares Python-CPU varierade även för små tidigare testfall. Detta experiment ger ingen garanti om gratisplanens CPU-budget. Vid driftfel sparas inget påhittat positivt resultat.

## Lokala kontroller

`node --test tests/orakletLab.test.mjs` kör experimentet med injicerade modeller/verktyg, och verifierar blindning, negativa kontroller, exakta koefficienter, felutfall och provenance. Skarpa AI/Cloudflare/Supabase-anrop sker endast i det manuella workflowet.
