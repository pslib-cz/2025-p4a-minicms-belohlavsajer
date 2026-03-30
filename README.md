# Minecraft Portal

Minecraft Portal je Next.js appka pro publikované Minecraft guidey a interní dashboard pro jejich správu.

## Stack

- Next.js 16 App Router
- React 19
- NextAuth
- Prisma ORM
- SQLite pro local dev
- PostgreSQL pro deployment

## Local Development

1. Zkopíruj `.env.example` do `.env`.
2. Doplň hodnoty podle prostředí.
3. Spusť:

```bash
npm install
npm run db:reset
npm run dev
```

Demo účet po seedu:

- username: `test`
- password: `password123`

## Environment Variables

- `DATABASE_TARGET`
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_CLARITY_PROJECT_ID`

Uploads obrázků do guide editoru a hero coveru na Vercelu vyžadují `BLOB_READ_WRITE_TOKEN` pro Vercel Blob. Bez něj bude `/api/uploads/guides` vracet chybu konfigurace.

## CookieConsent v3

Volitelná analytika na public pages je nově řízená přes CookieConsent v3.

### Co to znamená

- Pokud je nastavené `NEXT_PUBLIC_GTM_ID` nebo `NEXT_PUBLIC_CLARITY_PROJECT_ID`, na public routes se zobrazí consent banner.
- Když návštěvník povolí jen nezbytné cookies, web zůstane plně funkční a GTM ani Clarity se nenačtou.
- Na public pages je k dispozici tlačítko `Nastavení cookies`, přes které lze volbu kdykoli změnit.

## Google Analytics 4 via GTM

Projekt podporuje Google Analytics 4 přes Google Tag Manager jen pro public routes a pouze po výslovném consentu k analytice.

### Co se trackuje

- public stránky jako `/`, `/guides` a detail guideů
- automatické a enhanced measurement eventy jako `page_view`, `session_start`, `first_visit`, `user_engagement`, `scroll` a outbound kliky
- `view_search_results` pro katalog na `/guides?q=...`, pokud má GA4 web stream zapnuté enhanced measurement a používá query parametr `q` pro site search
- ruční `select_content` eventy pro guide card kliky, content-type tiles a hlavní homepage CTA

### Co se netrackuje

- `/login`
- `/dashboard`
- `/dashboard/*`
- API routy

### Zapnutí

1. V Google Tag Manager vytvoř web container a zkopíruj jeho `GTM-...` ID.
2. V GTM přidej Google tag nebo GA4 konfiguraci pro správný GA4 web stream.
3. V GA4 web streamu zapni Enhanced Measurement a u page views nech aktivní page loads i page changes based on browser history events.
4. Ověř, že site search používá query parametr `q`, pokud ho GA4 nedetekuje automaticky.
5. Nastav `NEXT_PUBLIC_GTM_ID` v `.env` nebo ve Vercelu.
6. Restartuj aplikaci, povol analytiku přes CookieConsent banner a ověř měření přes Tag Assistant a GA4 DebugView.

Pokud `NEXT_PUBLIC_GTM_ID` není nastavené, GTM se nenačte.

## Microsoft Clarity

Projekt podporuje Microsoft Clarity pro public routes a pouze po výslovném consentu k analytice.

### Co se trackuje

- public stránky jako `/`, `/guides` a detail guideů

### Co se netrackuje

- `/login`
- `/dashboard`
- `/dashboard/*`
- API routy

### Zapnutí

1. V Microsoft Clarity vytvoř projekt a zkopíruj jeho `project ID`.
2. Nastav `NEXT_PUBLIC_CLARITY_PROJECT_ID` v `.env` nebo ve Vercelu.
3. Restartuj aplikaci a povol analytiku přes CookieConsent banner.

Pokud `NEXT_PUBLIC_CLARITY_PROJECT_ID` není nastavené, Clarity se nenačte.

## Consent poznámka

Microsoft Learn uvádí, že od 31. října 2025 Clarity vyžaduje platný consent signal pro plnou funkčnost u návštěv z EEA, UK a CH. Pokud bude web cílit na tyto regiony, je vhodné doplnit CMP nebo Clarity consent flow jako další krok.

Google pro EEA traffic vyžaduje správně nasazený Consent Mode v2. Tato aplikace teď používá CookieConsent v3 a posílá denied defaults, dokud návštěvník explicitně nepovolí analytiku.
