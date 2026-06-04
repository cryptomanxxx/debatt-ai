---
id: 2026-06-04-admin-password-server-only
title: "NEXT_PUBLIC_ADMIN_PASSWORD exponeras i JS-bundeln — flytta till server-only ADMIN_SECRET"
type: security
severity: critical
status: rejected
risk: high
file: app/admin/client.js
created: 2026-06-04
rationale: "Sårbarheten är reell och bör åtgärdas — men inte autonomt. Fixen kräver (1) att ADMIN_SECRET sätts manuellt i Vercel env (kan inte göras från denna pipeline), (2) en helt ny /api/admin/session-endpoint med httpOnly-cookie/token-infrastruktur, och (3) samtidig omskrivning av 9 filer (8 admin-routes + admin-klienten + podd-test). Förslaget noterar själv att 'befintliga admin-sessioner fallerar vid deploy' och rekommenderar deploy under lågtrafik med backup-åtkomst via Vercel Dashboard. En partiell auto-implementering riskerar att låsa ute admin eller skapa falsk säkerhet om env-variabeln saknas vid deploy. Detta är inte en minimal, fokuserad ändring utan en infra-koordinerad uppgift som projektägaren måste planera med ett deploy-fönster. Rekommendation: implementera manuellt — sätt ADMIN_SECRET i Vercel först, deploya session-endpoint + cookie-skydd, migrera klient och routes, ta sedan bort NEXT_PUBLIC_ADMIN_PASSWORD."
---

## Problem

`NEXT_PUBLIC_ADMIN_PASSWORD` är inbakat i frontend-bundeln och kan läsas av vem som helst via
`window.__NEXT_DATA__` eller nätverkstrafik. Lösenordet används dessutom som URL-query-parameter
(`?pw=...`) i flera admin-API-anrop, vilket loggas i browser history, serverloggar och
CDN/proxyloggar.

Påverkade filer (8 st): `app/admin/client.js`, `app/admin/podd-test/page.js`,
`app/api/admin/vbnb-fetch/route.js`, `app/api/admin/beslut/route.js`,
`app/api/admin/ai-bus/route.js`, `app/api/admin/api-oversikt/route.js`,
`app/api/admin/prenumeranter/route.js`, `app/api/digest/route.js`.

## Föreslagen lösning

1. Sätt `ADMIN_SECRET` (utan `NEXT_PUBLIC_`-prefix) i Vercel environment variables.
2. Skapa `/api/admin/session` — en POST-endpoint som tar `{ password }`, jämför mot
   `process.env.ADMIN_SECRET` (server-only), och sätter en `httpOnly; Secure; SameSite=Strict`
   session-cookie med ett slumpmässigt token.
3. Skydda alla `/api/admin/*`-routes genom att verifiera cookie-token mot ett in-memory-set
   (eller kort-lived JWT) — aldrig mot lösenordet direkt.
4. Klientkoden läser aldrig lösenordet; den skickar bara session-cookien.
5. Ta bort alla `?pw=`-query-parametrar och `x-admin-password`-headers med råa lösenord.
6. Ta bort `NEXT_PUBLIC_ADMIN_PASSWORD` från Vercel efter migrering.

**Risk:** Hög — kräver uppdatering av admin-klienten och alla admin-API:er.
Befintliga admin-sessioner fallerar vid deploy tills cookien finns.
Rekommendation: deploy under lågtrafik, ha backup-åtkomst via Vercel Dashboard.
