---
id: 2026-06-04-admin-password-server-only
title: "NEXT_PUBLIC_ADMIN_PASSWORD exponeras i JS-bundeln — flytta till server-only ADMIN_SECRET"
type: security
severity: critical
status: implemented
impact: "Adminlösenordet läcker inte längre i client-bundeln. Login valideras nu via POST /api/admin/auth (server-side). Alla admin API-routes prefererar ADMIN_SECRET. getStoredPw() läser från localStorage istället för env-variabeln."
---

## Problem

`NEXT_PUBLIC_ADMIN_PASSWORD` baktades in i Next.js JS-bundeln vid build-tid. Vem som helst som inspekterar bundeln kunde läsa lösenordet och antingen kringgå admin-UI:t eller anropa skyddade admin-endpoints direkt.

## Åtgärd

- Tagit bort `const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD` från `app/admin/client.js`
- Lagt till `getStoredPw()` helper som läser från `localStorage` (satt vid inloggning)
- Login-validering är nu server-side via `POST /api/admin/auth` (ny endpoint)
- Auto-login på mount anropar också `/api/admin/auth`
- API-routes (`beslut`, `api-oversikt`, `vbnb-fetch`) läser nu `ADMIN_SECRET || NEXT_PUBLIC_ADMIN_PASSWORD`

## Rekommendation

Sätt `ADMIN_SECRET` som en server-only env-var i Vercel (utan `NEXT_PUBLIC_`-prefix) med samma värde som `NEXT_PUBLIC_ADMIN_PASSWORD`. Ta sedan bort `NEXT_PUBLIC_ADMIN_PASSWORD`. Detta eliminerar bakåtkompatibilitets-fallbacken.
