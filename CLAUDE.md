# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EBRC (Chongshin University Bible Reading Club) is a full-stack PWA for managing Bible reading plans, devotion check-ins, and member management. UI is entirely in Korean.

**[Language Policy]**
- **All communication, explanations, and answers to queries must be provided in Korean (한국어).**
- Documentation within the code (comments) may remain in English where appropriate for technical clarity, but the primary interaction language is Korean.

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Database**: Supabase (PostgreSQL) with generated types (`types/database.types.ts`)
- **Styling**: Tailwind CSS 3.4 with CSS variable-based theming (HSL), Radix UI primitives, CVA for variant styling
- **Validation**: Zod v3
- **Dates**: date-fns with Korean locale; all date logic uses KST (Asia/Seoul) via helpers in `lib/utils/date.ts`

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

No test framework is configured.

## Environment Variables

Required in `.env.local` (see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

## Architecture

### Route Structure (App Router)

- `app/(auth)/` — Login, password change (public)
- `app/(dashboard)/` — Protected routes: reading tracker, devotion check-in, profile, admin panel
- `app/api/` — API routes organized by domain: `/admin`, `/reading`, `/devotion`, `/auth`, `/user`

### Supabase Clients (`lib/supabase/`)

Three client variants — use the correct one per context:
- `server.ts` — SSR client for server components/route handlers
- `client.ts` — Browser client for client components
- `admin.ts` — Service-role client for privileged operations (user provisioning, password resets)

### Key Modules

- `lib/constants/bible.ts` — Bible book/chapter reference data (66 books, 1189 chapters)
- `lib/utils/date.ts` — KST-aware date utilities; always use `getTodayKST()` instead of `new Date()` for consistent server/client dates
- `lib/utils/streak.ts` — Streak calculation logic for devotion check-ins
- `lib/utils/validation.ts` — Zod schemas for request validation
- `components/ui/` — Shared UI primitives (button, card, input, dialog, etc.)

### Authorization

Role-based access control with three roles: `user`, `leader`, `admin`. Checked via Supabase RLS policies and database functions (`is_admin()`, `is_leader_or_admin()`). API routes enforce role checks server-side.

### Deployment

Vercel with cron jobs defined in `vercel.json`:
- `/api/cron/keep-alive` — daily at midnight
- `/api/cron/refresh-stats` — daily at 3 AM

`next.config.mjs` sets a 2MB body size limit.
