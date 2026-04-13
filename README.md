# Langjournal

A small web app for keeping a daily journal in a language you’re learning. You write mostly in the target language; when you get stuck on a word or phrase, you drop in `//` plus the word in your native language, hit Enter, and it swaps in a translation.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** + shared UI bits in `components/ui`
- **Supabase** for auth (and Postgres hosting)
- **Prisma** for talking to Postgres (`prisma/schema.prisma`)
- **Google Cloud Translation** for the actual translate calls (see env vars below)

## Languages

Native and learning languages are per user (`LanguageProfile` in Prisma). Change them from **Settings** (`/app/settings`) or from the **language bar** on the journal list and entry pages: click the codes, pick native + learning, Save. The gear still opens Settings for the full form.

`GET /api/languages` returns everything Cloud Translation exposes for your credentials (same API key or service account as translate). If that call cannot run, the UI falls back to a long static list in `lib/languages/fallback-languages.ts` so the app still works offline or before Google is wired up.

## Local setup

1. **Node** — use a current LTS (e.g. 20+). Install deps:

   ```bash
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env` in the repo root and fill in values. Next and Prisma both read `.env`. Don’t commit `.env`.

   You need at least:

   - Supabase URL + anon key (`NEXT_PUBLIC_SUPABASE_*`)
   - `DATABASE_URL` and `DIRECT_URL` for Prisma (Supabase’s pooler URLs are documented in `.env.example`)
   - Something for Google Translate: either `GOOGLE_TRANSLATE_API_KEY` (simplest if your org blocks service account keys) or project/credentials as described in `.env.example`

3. **Database** — after `DATABASE_URL` / `DIRECT_URL` work, push the schema (good enough for local dev):

   ```bash
   npm run db:push
   ```

   If `prisma generate` complains about a locked query engine on Windows, stop anything using the app (e.g. `npm run dev`), run `npm run db:generate`, then start dev again.

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You’ll need a Supabase user / login flow configured for your project.

## Useful scripts

| Command | What it does |
|--------|----------------|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` then production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Apply schema to DB (no migration files) |
| `npm run db:migrate` | Prisma migrate (when you use migrations) |
| `npm run db:studio` | Prisma Studio |

## Where things live (rough map)

- `app/` — routes, layouts, API route handlers under `app/api/`
- `components/journal/` — entry editor, title field, language bar
- `lib/entries/` — entry CRUD-ish helpers, `translate.ts` for translation records
- `lib/translate/google.ts` — translate text + list supported languages
- `lib/languages/fallback-languages.ts` — dropdown fallback when Google’s list API is unavailable
- `lib/auth/` — session + API user helpers
- `lib/db/` — Prisma client, language pair lookup

## Inline translation (behavior)

- `//` can appear in the middle of a line. **Only the last** `//` on that line counts: text after it (to the end of the line) is what gets sent to Google.
- **Enter** — if that line has a valid `//`, translate and replace that segment; no newline.
- **Ctrl+Enter** (Cmd+Enter on Mac) — insert a newline.
- Click outside the textarea to leave edit mode: body autosaves, translated spans show with a muted highlight; hover shows the source phrase. Click back in to edit plain text again.

API: `POST /api/entries/[id]/translate` with `{ "text": "..." }` adds or reuses a translation record; `DELETE` with `{ "translationId": "..." }` drops the highlight metadata (the word stays in the body). `PATCH /api/settings/language-profile` with `{ "nativeLanguage": "en", "targetLanguage": "ja" }` updates the pair used for those calls.

## Deploying

Same env vars as local, plus a production `DATABASE_URL` / `DIRECT_URL`. Run migrations or `db push` against prod once. Keep the Translate API key server-only (never `NEXT_PUBLIC_`).

---

This repo started from `create-next-app`; the README above replaces the stock template text.
