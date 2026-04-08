# Language Journal MVP — plan.md

## Product

A journaling web app for language learners where users can write freely in their native language, then use commands like `/translate` to generate translated follow-up text inline without breaking writing flow.

## Product goal

Build the cheapest realistic MVP that feels like a real product, not just a translator wrapper.

## MVP promise

A user can:

* sign in
* create journal entries
* write normal text blocks
* use `/translate <text>` to translate a line into a chosen target language
* see original and translated blocks in one timeline
* save entries and come back later

## Cheapest realistic stack

### Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* shadcn/ui for input, cards, dialogs, buttons
* React Hook Form only where needed

### Backend

* Next.js route handlers
* Server actions optional, but route handlers are cleaner for command execution
* Zod for request validation

### Database

* PostgreSQL via Supabase free tier
* Prisma ORM

### Auth

* Supabase Auth
* Google sign-in later if needed; email magic link is enough for MVP

### Translation

* Google Cloud Translation API
* Start with Basic text translation only
* Avoid glossary, document translation, and LLM translation in MVP

### Hosting

* Vercel for web app
* Google Cloud only for Translation API
* Supabase for database + auth

### Analytics / logging

* Basic app logs only
* Optional PostHog later, not needed for MVP

## Why this stack

* Vercel + Supabase is the cheapest realistic full-stack combo for shipping fast
* Google Cloud Translation gives a reliable production-grade translation API
* Official Google Cloud docs say the first 500,000 characters processed per month are free for Basic and Advanced combined, though billing must still be enabled
* The quota docs recommend keeping requests around 5K characters for lower latency, which fits line- or block-based journaling well

## Architecture

### Client

* Journal editor page
* Entry timeline page
* Settings page for source language and target language

### Server

* `POST /api/commands/translate`
* `POST /api/entries`
* `PATCH /api/blocks/:id`
* `GET /api/entries/:id`

### Data flow

1. User types a line or block
2. User submits
3. App parses whether it is plain text or a command
4. If plain text, save as a normal block
5. If `/translate ...`, send only the text after the command to server
6. Server validates input and calls Google Cloud Translation
7. Server stores translated result as a translated block linked to the original entry
8. UI appends translated block below the original context

## Core UX decisions

### Command syntax for MVP

Support only:

* `/translate <text>`

Do not support these in v1:

* multiline command mode
* slash command picker
* natural-language commands
* inline mixed command parsing within one paragraph

### Why

This keeps parsing simple and avoids ambiguous editor behavior.

### Example

Input:
`/translate I still felt nervous, but I spoke anyway.`

Stored output:

* block 1 type: user_text
* block 2 type: translation_result

### Important UX rule

Do not replace the user’s original writing.
Always append translated output as a separate block.

## Data model

### User

* id
* email
* createdAt

### LanguageProfile

* id
* userId
* nativeLanguage
* targetLanguage
* uiLocale

### JournalEntry

* id
* userId
* title nullable
* entryDate
* createdAt
* updatedAt

### EntryBlock

* id
* entryId
* parentBlockId nullable
* type (`text`, `translation`)
* sourceText
* translatedText nullable
* sourceLanguage
* targetLanguage nullable
* command nullable
* position
* createdAt

## Folder structure

```txt
app/
  (marketing)/
  app/
    journal/page.tsx
    entry/[id]/page.tsx
    settings/page.tsx
  api/
    commands/translate/route.ts
    entries/route.ts
    entries/[id]/route.ts
components/
  journal/
    editor.tsx
    block-list.tsx
    block-card.tsx
    command-hint.tsx
lib/
  auth/
  db/
  translate/
  commands/
  validations/
prisma/
  schema.prisma
```

## Env vars

```env
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=
```

## Translation implementation notes

### Best version for MVP

Use a server-side helper in `lib/translate/google.ts`.

### Responsibilities

* receive plain text
* validate source and target language codes
* trim input
* reject empty text
* enforce max char length per request
* call Google Cloud Translation
* return translated text only

### Guardrails

* hard cap request size at 2000 to 3000 chars per translate command for MVP
* rate limit command endpoint per user
* debounce duplicate submissions client-side
* store command failures in logs

## Cost control

* use Basic text translation only
* do not expose raw API calls from browser
* call translation server-side only
* set Google Cloud budget alerts
* set project quotas
* reject giant inputs before API call
* show user a soft character counter

## Security

* never expose credentials in client
* authenticate command routes
* authorize entry ownership on every read/write
* validate all payloads with Zod
* sanitize command parsing and trim inputs

## User stories in build order

### Story 0 — Project bootstrap

As a developer, I want a running full-stack app skeleton so I can build safely on a stable base.

**Acceptance criteria**

* Next.js app runs locally
* Tailwind and shadcn installed
* Supabase project created
* Prisma connected to Postgres
* basic app layout exists

### Story 1 — Authentication

As a user, I want to sign in so my journal entries are private.

**Acceptance criteria**

* user can sign up / sign in
* unauthenticated users cannot access journal pages
* authenticated users are redirected to journal page

### Story 2 — Create a journal entry

As a user, I want to start a fresh journal entry so I can write for a specific day.

**Acceptance criteria**

* user can create an empty entry
* entry is tied to current user
* entry appears in entry list

### Story 3 — Save plain text blocks

As a user, I want to write normal text without commands so the app works like a real journal first.

**Acceptance criteria**

* user can submit plain text
* text is stored as a `text` block
* block appears in timeline immediately

### Story 4 — Parse `/translate <text>`

As a user, I want to type a translate command so I can turn a thought into the target language inline.

**Acceptance criteria**

* app detects `/translate ` prefix
* only text after the command is sent for translation
* malformed command shows inline error
* empty translate command is rejected

### Story 5 — Translate server-side with Google Cloud

As a user, I want translated text returned quickly so the command feels native to journaling.

**Acceptance criteria**

* server route validates request
* translation succeeds for supported languages
* response returns translated text
* failures return safe user-facing errors

### Story 6 — Append translated block below original

As a user, I want translated output shown as a separate block so I can compare both versions.

**Acceptance criteria**

* translated result is saved as `translation` block
* block is visually distinct
* original text remains unchanged
* translated block is linked to context or parent block if applicable

### Story 7 — Language settings

As a user, I want to choose my native and target languages so translation uses the right defaults.

**Acceptance criteria**

* user can set source and target language
* defaults are used in translate command automatically
* settings persist across sessions

### Story 8 — Entry history

As a user, I want to revisit older entries so the app feels like an actual journal.

**Acceptance criteria**

* entries list page exists
* user can open prior entries
* blocks render in chronological order

### Story 9 — Character counter and command validation

As a user, I want feedback before submitting so I do not hit hidden limits.

**Acceptance criteria**

* editor shows char count
* oversized translate requests are blocked client-side
* server also enforces max size

### Story 10 — Loading, retry, and error states

As a user, I want the app to handle failures gracefully so translation does not feel brittle.

**Acceptance criteria**

* submitting shows pending state
* transient failure shows retry option
* duplicate submit is prevented

### Story 11 — Nice journal UI

As a user, I want the journal to look clean so it feels worth using repeatedly.

**Acceptance criteria**

* text and translation blocks have clear visual hierarchy
* current day entry is easy to continue
* mobile layout is usable

## Post-MVP stories

### Story 12 — `/translate` on selected previous block

Translate a previously written block instead of only command-line input.

### Story 13 — “More natural” rewrite mode

Support `/natural <text>` for less literal phrasing.

### Story 14 — Vocabulary extraction

Extract 3 to 5 useful words from translated blocks.

### Story 15 — Streaks and prompts

Daily prompts and consistency tracking.

### Story 16 — Side-by-side compare view

Show native and translated versions in paired layout.

## Engineering order

1. bootstrap app
2. auth
3. DB schema
4. create entry flow
5. plain text block persistence
6. command parser
7. Google translation route
8. translated block rendering
9. settings
10. entry history
11. validation and rate limiting
12. polish

## Implementation notes by file

### `lib/commands/parse-command.ts`

Returns either:

* `{ type: 'plain_text', text }`
* `{ type: 'translate', text }`
* `{ type: 'invalid_command', reason }`

Keep parsing deterministic and strict.

### `app/api/commands/translate/route.ts`

* require auth
* validate payload
* call translation helper
* return translated text

### `lib/translate/google.ts`

* wraps Google SDK or REST call
* centralizes API errors
* no UI logic

### `components/journal/editor.tsx`

* textarea
* submit on Enter optionally, or button first for safety
* command hint appears when line starts with `/`

## Recommendation on Enter behavior

For MVP, do not auto-submit on plain Enter inside a multiline textarea.
Use:

* `Cmd/Ctrl + Enter` to submit
* Enter for newline

Why:

* journaling often needs multiline text
* accidental submission will feel bad
* command parsing is easier with explicit submit

## Most realistic MVP scope

Ship only these:

* auth
* entry creation
* plain text blocks
* `/translate <text>`
* saved translated blocks
* language settings
* history page

Anything beyond that is version 2.

## Definition of done

The MVP is done when a signed-in user can open today’s journal, write normal text, run `/translate <text>`, see the translated result appended below, and revisit the entry later.

## Suggested first 8 commits

1. `init next app, tailwind, shadcn, and base layout`
2. `set up supabase auth and protected app routes`
3. `add prisma schema for users entries and blocks`
4. `build create-entry flow and entry list page`
5. `add plain text block composer and persistence`
6. `implement slash command parser for translate`
7. `add google cloud translate server route`
8. `render translation blocks and loading/error states`
