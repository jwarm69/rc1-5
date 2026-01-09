# RC1.5 Production Readiness - Implementation Roadmap

This document outlines the order of implementation for fixing the production gaps identified during testing. Each PRD can be turned into granular tasks using `generate-tasks.md`.

## Issue Summary

| # | Issue | PRD | Impact | Priority |
|---|-------|-----|--------|----------|
| 1 | Missing Supabase tables | `prd-supabase-data-layer.md` | **Critical** - 404 errors for authenticated users | P0 |
| 2 | LLM keys exposed client-side | `prd-llm-api-proxy.md` | **Critical** - Security vulnerability | P0 |
| 3 | Env variable mismatch | `prd-env-standardization.md` | **High** - Deployment confusion | P1 |
| 4 | UI not persisting data | `prd-ui-persistence.md` | **High** - Poor UX for logged-in users | P1 |
| 5 | No automated tests | `prd-automated-testing.md` | **Medium** - Risk during changes | P2 |

## Recommended Implementation Order

### Phase 1: Database Foundation (Do First)

**PRD**: `prd-supabase-data-layer.md`

This must be done first because all other features depend on working database tables.

Steps:
1. Create full `action_items` table (not just add columns)
2. Create `contacts` table with all expected fields
3. Create `opportunities` table for pipeline
4. Create `chat_messages` table for coach history
5. Add RLS policies to all new tables
6. Run migration in Supabase SQL Editor
7. Regenerate types: `npx supabase gen types typescript`

**Verify**: Auth → open Database page → no 404 errors in console

---

### Phase 2: Environment Variables (Quick Win)

**PRD**: `prd-env-standardization.md`

Do this alongside Phase 1 - it's a quick fix that prevents deployment issues.

Steps:
1. Update `src/integrations/supabase/client.ts` to use `VITE_SUPABASE_ANON_KEY`
2. Update `.env.example` to match
3. Add runtime validation for missing env vars
4. Verify Vercel has correct env vars set

**Verify**: Fresh clone → follow README → app works

---

### Phase 3: LLM API Proxy (Security Fix)

**PRD**: `prd-llm-api-proxy.md`

Do this before going to production with real users.

Steps:
1. Create `/api/llm/route.ts` Vercel Edge Function
2. Move API keys to server-side env vars
3. Update `src/lib/llm/client.ts` to call proxy
4. Add auth verification (Supabase JWT)
5. Add basic rate limiting
6. Test streaming still works
7. Remove `VITE_ANTHROPIC_API_KEY` and `VITE_OPENAI_API_KEY` from client

**Verify**: DevTools Network tab shows no API keys in requests

---

### Phase 4: Wire UI to Database (Core Feature)

**PRD**: `prd-ui-persistence.md`

Once database and env vars are working, wire up the UI.

Steps:
1. Update `Database.tsx` to fetch/save contacts
2. Update `Pipeline.tsx` to fetch/save opportunities
3. Update `CoachPanel.tsx` to persist chat history
4. Update `GoalsAndActions.tsx` to persist action items
5. Add loading states and error handling
6. Test full flow: create contact → add to pipeline → coach → complete action

**Verify**: Refresh page → data persists

---

### Phase 5: Automated Testing (Quality Gate)

**PRD**: `prd-automated-testing.md`

Do this after core features work to prevent regressions.

Steps:
1. Install Vitest + React Testing Library
2. Create test setup with Supabase mocks
3. Add unit tests for calibration state machine
4. Add unit tests for coaching engine
5. Add smoke tests for critical flows
6. Add pre-commit hook
7. Set up coverage reporting

**Verify**: `npm test` passes with 50%+ coverage on `src/lib/`

---

## How to Generate Tasks

For each PRD, use the ai-dev-tasks workflow:

```
Use @generate-tasks.md to create tasks from @prd-supabase-data-layer.md
```

This will produce a checklist file like `tasks-supabase-data-layer.md` with granular sub-tasks.

---

## Dependencies

```
prd-supabase-data-layer.md
         ↓
prd-env-standardization.md (parallel)
         ↓
prd-llm-api-proxy.md
         ↓
prd-ui-persistence.md
         ↓
prd-automated-testing.md
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
| `create-prd.md` | Template for creating new PRDs |
| `generate-tasks.md` | Template for generating task lists |

---

## Next Steps

1. Review each PRD and ask clarifying questions if needed
2. Start with `prd-supabase-data-layer.md` - generate tasks
3. Work through tasks one by one, checking them off
4. Move to next phase only after current phase is verified
