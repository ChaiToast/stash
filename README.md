# STASH

Turn your Instagram saves into a searchable personal library.

## Quick start (full stack)

**Prerequisites:** Docker Desktop, Supabase CLI, Node 20+, Chrome

```bash
cd stash
npm install

# 1. Start Supabase
npm run db:start
npm run db:reset

# 2. Configure env
cp apps/web/.env.example apps/web/.env.local
cp supabase/.env.example supabase/.env.local
# Fill NEXT_PUBLIC_SUPABASE_ANON_KEY from `supabase status`
# Fill ANTHROPIC_API_KEY in supabase/.env.local

# 3. Run services (3 terminals)
npm run functions:serve          # Edge function on :54321
npm run dev --workspace=@stash/web   # Dashboard on :3000
npm run extension:build          # Then load apps/extension/dist in Chrome
```

**End-to-end test**

1. Open http://127.0.0.1:3000 → sign in (magic link or Google)
2. Go to **Settings** or **Sync** → **Connect STASH Extension**
3. Copy extension ID from `chrome://extensions` into `NEXT_PUBLIC_EXTENSION_ID`
4. Open Instagram Saved → extension popup → **Start Sync**
5. Return to **Your Library** — classified posts appear by category

## Monorepo

```
stash/
├── apps/
│   ├── web/          # Next.js 15 dashboard
│   └── extension/    # Chrome MV3 scraper + uploader
├── packages/
│   ├── types/        # Shared types
│   ├── database/     # Supabase helpers + generated types
│   └── prompts/      # Claude classification prompts
└── supabase/
    ├── migrations/
    └── functions/classify-posts/
```

## Build status

| Phase | Status |
|-------|--------|
| 1 — Database Foundation | ✅ |
| 2 — Chrome Extension | ✅ |
| 3 — AI Classification Engine | ✅ |
| 4 — Web Dashboard | ✅ |
| 5 — UX Psychology Layer | ✅ |
| 6 — Search | ✅ |
| 7 — Monetization | ✅ |

## Web dashboard

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Google + magic link auth |
| `/dashboard` | Your Library — 9 category cards |
| `/dashboard/category/[slug]` | Category vault with filters + search |
| `/dashboard/post/[id]` | Category-specific detail + notes |
| `/sync` | Sync instructions + extension connect |
| `/dashboard/search` | Global search |
| `/dashboard/analytics` | Streak, completion, weekly wins |
| `/dashboard/export` | CSV / JSON export (paid plans) |
| `/dashboard/collections` | Public share collections |
| `/dashboard/settings` | Plan upgrades + extension connect |
| `/u/[username]/[slug]` | Public collection page |

## UX psychology (Phase 5)

- **Zeigarnik:** unsorted saves banner on dashboard
- **Streaks:** updated when marking posts done
- **Progress:** per-category completion bars
- **Ownership language:** “Your Library”, “Your Recipe Vault”, etc.
- **Gem Save ✨:** high-confidence posts (≥92%) glow on cards

## Monetization (Phase 7)

| Plan | Limits |
|------|--------|
| Free | 300 posts, 5 categories, no exports |
| Lifetime Solo | Unlimited imports, exports, collections |
| Pro | Everything + API access (placeholder) |

Upgrade instantly in **Settings** (demo mode — wire Stripe for production).
Free post limit enforced in `classify-posts` Edge Function.

## Extension

```bash
npm run extension:build
npm run extension:dev   # watch mode
```

Load unpacked: `apps/extension/dist`

## Commands

```bash
npm run dev --workspace=@stash/web
npm run build --workspace=@stash/web
npm run extension:build
npm run functions:serve
npm run db:reset
npm run db:types
```

## Environment variables

**apps/web/.env.local**
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
NEXT_PUBLIC_EXTENSION_ID=
```

**supabase/.env.local**
```
ANTHROPIC_API_KEY=
```
