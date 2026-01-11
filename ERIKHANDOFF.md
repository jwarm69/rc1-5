# RC1.5 (RealCoach.ai) - Erik Handoff Document

## Project Overview
RealCoach.ai is an AI-powered coaching platform for solo real estate agents. It provides calm, clear, friction-free daily guidance to help agents grow their business.

**Tech Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase + Claude/OpenAI

---

## Completed Features (This Session)

### 1. Environment Standardization
- [x] Cleaned up `src/lib/env.ts` - removed client-side LLM key references
- [x] Verified Supabase client uses correct `VITE_SUPABASE_ANON_KEY`
- [x] Runtime validation exists in `validateEnv()` function

### 2. LLM API Proxy Security Verification
- [x] Verified `client.ts` uses proxy endpoint exclusively (`/api/llm`)
- [x] Confirmed no `VITE_ANTHROPIC_API_KEY` or `VITE_OPENAI_API_KEY` in src/
- [x] API proxy at `/api/llm/route.ts` has JWT auth + rate limiting (20 req/min)
- [x] Smart routing: Claude for coaching, GPT-4o-mini for acknowledgments

### 3. CoachPanel Chat Persistence
- [x] Chat messages already persist to `chat_messages` Supabase table
- [x] Added `coaching_mode` field to `saveMessage()` function for tracking context
- [x] Contacts/opportunities persist via realtime subscriptions
- [x] Actions persist to `action_items` table

### 4. LLM Integration with Coaching Context
- [x] `prompts.ts` builds system prompts with mode/move context
- [x] Streaming responses work through proxy
- [x] Different coaching modes (CLARIFY, REFLECT, REFRAME, COMMIT, DIRECT) produce appropriate response styles
- [x] Coaching moves (FOCUS, AGENCY, IDENTITY, EASE) integrated into prompts

### 5. Automated Testing Infrastructure
- [x] Vitest + React Testing Library + jsdom configured
- [x] Test setup with Supabase mocks (`src/test/setup.ts`)
- [x] **178 tests passing** (was 0 at start of session)

---

## Test Coverage Summary

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `calibration.test.ts` | 24 | State machine transitions |
| `coaching-engine.test.ts` | 36 | Mode/move detection |
| `client.test.ts` | 47 | Response validation, signal detection |
| `daily-action-engine.test.ts` | 38 | Readiness gate, action selection |
| `prompts.test.ts` | 33 | System prompt building |

**File Coverage:**
- `prompts.ts`: 97%
- `daily-action-engine.ts`: 95%
- `client.ts`: 44%

---

## Key Files Modified

| File | Changes |
|------|---------|
| `src/lib/env.ts` | Removed client-side LLM key references |
| `src/components/layout/CoachPanel.tsx` | Added `coaching_mode` to saveMessage |
| `vitest.config.ts` | New - test configuration |
| `src/test/setup.ts` | New - Supabase mocks |
| `src/lib/calibration.test.ts` | New - 24 tests |
| `src/lib/coaching-engine.test.ts` | New - 36 tests |
| `src/lib/llm/client.test.ts` | New - 47 tests |
| `src/lib/daily-action-engine.test.ts` | New - 38 tests |
| `src/lib/llm/prompts.test.ts` | New - 33 tests |
| `package.json` | Added test scripts and dev dependencies |

---

## Commands

```bash
# Development
npm run dev           # Start dev server (localhost:8080)
npm run build         # Production build

# Testing
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## Architecture Notes

### Coaching State Machine
```
UNINITIALIZED → CALIBRATING → G&A_DRAFTED → G&A_CONFIRMED → ACTIONS_ACTIVE
```

### Coaching Modes
```
CLARIFY → REFLECT → REFRAME → COMMIT → DIRECT
```

### Coaching Moves
- **FOCUS**: For overwhelm signals
- **AGENCY**: For externalized control signals
- **IDENTITY**: For self-story signals
- **EASE**: For resistance signals

### Non-Negotiable Rules (Enforced in prompts)
1. One question at a time
2. No urgency language
3. Banned words: crush, hustle, grind, empower, synergy, game-changer
4. Reflect → Confirm → Proceed flow
5. No daily actions before G&A confirmation

---

## Git History (Recent)

```
20948b9 Add comprehensive test coverage for LLM client, daily action engine, and prompts
79164b3 Add testing infrastructure and production readiness improvements
6ca48f0 Update pricing to $99/month
bd123c2 Add UX polish: demo data handling and realtime subscriptions
```

---

## Next Steps (Suggested)

1. **Manual Verification** - Walk through calibration → G&A → daily actions flow
2. **Production Deployment** - Verify Vercel env vars, test production build
3. **Remaining Test Coverage** - Add tests for `calibration.ts` and `coaching-engine.ts` to reach 80%+
4. **Error Monitoring** - Set up Sentry or similar

---

## Resources

- PRDs: `/RC1.5/tasks/prd-*.md`
- Implementation Roadmap: `/RC1.5/tasks/IMPLEMENTATION_ROADMAP.md`
- Behavior Docs: `/RC1.5/docs/behavior/`

---

*Last updated: January 11, 2026*
