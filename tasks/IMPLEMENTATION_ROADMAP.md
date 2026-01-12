# RC1.5 Production Readiness - Implementation Roadmap

This document outlines the implementation phases for the production gaps identified during testing.

**Status**: ✅ ALL PHASES COMPLETE (as of January 11, 2026)

## Issue Summary

| # | Issue | PRD | Impact | Status |
|---|-------|-----|--------|--------|
| 1 | Missing Supabase tables | `prd-supabase-data-layer.md` | **Critical** - 404 errors for authenticated users | ✅ Complete |
| 2 | LLM keys exposed client-side | `prd-llm-api-proxy.md` | **Critical** - Security vulnerability | ✅ Complete |
| 3 | Env variable mismatch | `prd-env-standardization.md` | **High** - Deployment confusion | ✅ Complete |
| 4 | UI not persisting data | `prd-ui-persistence.md` | **High** - Poor UX for logged-in users | ✅ Complete |
| 5 | No automated tests | `prd-automated-testing.md` | **Medium** - Risk during changes | ✅ Complete |

---

## Completed Implementation Phases

### ✅ Phase 1: Database Foundation (Completed Jan 9, 2026)

**PRD**: `prd-supabase-data-layer.md`

Completed steps:
- [x] Created full `action_items` table (not just add columns)
- [x] Created `contacts` table with all expected fields
- [x] Created `opportunities` table for pipeline
- [x] Created `chat_messages` table for coach history
- [x] Added RLS policies to all new tables
- [x] Ran migration in Supabase SQL Editor
- [x] Regenerated types: All 10 tables in TypeScript types

**Verified**: Auth → open Database page → no 404 errors in console ✅

---

### ✅ Phase 2: Environment Variables (Completed Jan 11, 2026)

**PRD**: `prd-env-standardization.md`

Completed steps:
- [x] Updated `src/integrations/supabase/client.ts` to use `VITE_SUPABASE_ANON_KEY`
- [x] Updated `.env.example` to match
- [x] Added runtime validation for missing env vars in `src/lib/env.ts`
- [x] Cleaned up client-side LLM key references

**Verified**: Fresh clone → follow README → app works ✅

---

### ✅ Phase 3: LLM API Proxy (Completed Jan 11, 2026)

**PRD**: `prd-llm-api-proxy.md`

Completed steps:
- [x] Created `/api/llm/route.ts` Vercel Edge Function
- [x] Moved API keys to server-side env vars
- [x] Updated `src/lib/llm/client.ts` to call proxy
- [x] Added auth verification (Supabase JWT)
- [x] Added rate limiting (20 req/min per user)
- [x] Tested streaming still works
- [x] Removed `VITE_ANTHROPIC_API_KEY` and `VITE_OPENAI_API_KEY` from client

**Verified**: DevTools Network tab shows no API keys in requests ✅

---

### ✅ Phase 4: Wire UI to Database (Completed Jan 11, 2026)

**PRD**: `prd-ui-persistence.md`

Completed steps:
- [x] Updated `Database.tsx` to fetch/save contacts
- [x] Updated `Pipeline.tsx` to fetch/save opportunities
- [x] Updated `CoachPanel.tsx` to persist chat history with `coaching_mode`
- [x] Updated `GoalsAndActions.tsx` to persist action items
- [x] Added loading states and error handling
- [x] Added empty states for authenticated users (no demo data)
- [x] Added contact notes persistence (JSONB)

**Verified**: Refresh page → data persists ✅

---

### ✅ Phase 5: Automated Testing (Completed Jan 11, 2026)

**PRD**: `prd-automated-testing.md`

Completed steps:
- [x] Installed Vitest + React Testing Library
- [x] Created test setup with Supabase mocks (`src/test/setup.ts`)
- [x] Added unit tests for calibration state machine (24 tests)
- [x] Added unit tests for coaching engine (36 tests)
- [x] Added tests for LLM client (47 tests)
- [x] Added tests for daily-action-engine (38 tests)
- [x] Added tests for prompts (33 tests)

**Verified**: `npm test` passes with 178 tests ✅

**Test Coverage**:
- `prompts.ts`: 97%
- `daily-action-engine.ts`: 95%
- `client.ts`: 44%

---

## Dependencies (All Satisfied)

```
prd-supabase-data-layer.md  ✅
         ↓
prd-env-standardization.md (parallel)  ✅
         ↓
prd-llm-api-proxy.md  ✅
         ↓
prd-ui-persistence.md  ✅
         ↓
prd-automated-testing.md  ✅
```

---

## Files in this Directory

| File | Purpose |
|------|---------|
| `IMPLEMENTATION_ROADMAP.md` | This file - implementation order |
| `prd-supabase-data-layer.md` | PRD for missing database tables |
| `prd-llm-api-proxy.md` | PRD for securing LLM API keys |
| `prd-env-standardization.md` | PRD for fixing env var mismatch |
| `prd-ui-persistence.md` | PRD for wiring UI to Supabase |
| `prd-automated-testing.md` | PRD for test infrastructure |
| `tasks-supabase-data-layer.md` | Granular task list (all checked off) |
| `create-prd.md` | Template for creating new PRDs |
| `generate-tasks.md` | Template for generating task lists |

---

## Next Steps (Post-MVP)

All 5 production readiness phases are complete. Suggested next work:

1. **Google OAuth Configuration** - Enable Google sign-in via Supabase dashboard
2. **Screenshots Interpretation v1** - New product capability (see `docs/behavior/06_Screenshots_Interpretation.md`)
3. **Mailchimp Sync v1** - External integration (see `docs/behavior/07_Mailchimp_Sync.md`)
4. **E2E Testing** - Playwright or Cypress for full flow tests
5. **Error Monitoring** - Set up Sentry or similar
6. **Performance Optimization** - Code splitting for bundle size

---

*Last updated: January 12, 2026*
*All phases complete*
