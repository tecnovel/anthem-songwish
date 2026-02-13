# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
npx prisma migrate dev   # Run database migrations
npx prisma generate      # Regenerate Prisma client after schema changes
```

There are no automated tests configured in this project.

## Environment

Copy `.env` and populate these required variables:
- `DATABASE_URL` — PostgreSQL connection string (Prisma format)
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — Spotify API credentials (Client Credentials flow)
- `ADMIN_PASSWORD` — Password for DJ queue view at `/dj`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics (optional)
- `NEXT_PUBLIC_INSTAGRAM_HANDLE` — Instagram handle shown on guest form (optional)

## Architecture

**Next.js 16 Pages Router** app (not App Router). TypeScript strict mode. Path alias `@/*` → `src/*`.

### Pages & API Routes

| Route | Purpose |
|---|---|
| `/` | Guest song request form (name + 1 song) |
| `/dj` | DJ queue view — password-gated, auto-refreshes every 4s |
| `GET /api/search?q=` | Proxies Spotify track search (min 3 chars, returns 10 results) |
| `POST /api/request` | Submits a song request (name + track) |
| `GET /api/dj/requests` | Returns all unplayed `SongRequest` rows, newest first |
| `PATCH /api/dj/[id]` | Marks a `SongRequest` as played (`{ played: true }`) |

### Data Flow

Guest form → `POST /api/request` → Prisma → PostgreSQL (`SongRequest` table)

DJ page polls `GET /api/dj/requests` every 4 seconds and dismisses via `PATCH /api/dj/[id]`.

Spotify search is proxied: `SongSearch` component → `GET /api/search` → Spotify Client Credentials API.

### Key Files

- `src/lib/prisma.ts` — Singleton Prisma client (prevents multiple instances in dev hot-reload)
- `src/components/SongSearch.tsx` — Search UI with 450ms debounce
- `src/components/SongSearchModal.tsx` — Modal wrapper for SongSearch
- `prisma/schema.prisma` — Single `SongRequest` model

### Business Rules

- Guests submit their name + 1 song; no email or duplicate checking
- DJ page password is `ADMIN_PASSWORD` env var, injected via `getServerSideProps`
- UI is fully in German
