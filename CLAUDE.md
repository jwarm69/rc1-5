# CLAUDE.md - RC1.5 Project Instructions

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**RC1.5** is RealCoach.ai - an AI-powered coaching platform for solo real estate agents. It provides calm, clear, friction-free daily guidance to help agents grow their business.

**Status**: ✅ MVP Complete - Production Ready (Jan 11, 2026)

## Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn-ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **LLM**: Claude/OpenAI via server-side proxy
- **Testing**: Vitest + React Testing Library (178 tests)
- **Deployment**: Vercel

## Project Structure

```
/src
├── components/          # React components
│   ├── layout/          # MainLayout, Sidebar, CoachPanel
│   ├── ui/              # shadcn-ui components (40+)
│   ├── database/        # Contact/opportunity modals
│   ├── goals/           # GoalCard components
│   └── actions/         # ActionCard components
├── contexts/            # React contexts
│   ├── CalibrationContext.tsx    # User calibration state
│   ├── CoachingEngineContext.tsx # Coaching behavior state
│   ├── DatabaseContext.tsx       # Supabase realtime subscriptions
│   ├── AuthContext.tsx           # Supabase auth
│   └── ThemeContext.tsx          # Dark/light mode
├── lib/                 # Core business logic
│   ├── calibration.ts            # Calibration state machine
│   ├── coaching-engine.ts        # Coaching mode/move logic
│   ├── daily-action-engine.ts    # Action selection
│   ├── env.ts                    # Environment validation
│   └── llm/                      # LLM integration
│       ├── client.ts             # Calls server proxy
│       ├── claude-adapter.ts     # Anthropic API
│       ├── openai-adapter.ts     # OpenAI API
│       ├── prompts.ts            # System prompts
│       └── types.ts              # LLM types
├── hooks/               # Custom React hooks
│   └── useSupabaseCalibration.ts # Calibration persistence
├── pages/               # Route pages (10 total)
├── types/               # TypeScript types
│   └── coaching.ts      # Core coaching types (534 lines)
├── test/                # Test setup
│   └── setup.ts         # Supabase mocks
└── integrations/        # External service integrations
    └── supabase/        # Supabase client + types

/api
└── llm/route.ts         # Vercel Edge Function (JWT auth, rate limiting)

/docs
└── behavior/            # AI behavior documentation (9 modules)

/supabase
└── schema.sql           # Database schema (10 tables)
```

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (usually localhost:8080)
npm run build      # Production build
npm run lint       # Run ESLint
npx tsc --noEmit   # Type check

# Testing
npm test           # Run all tests (178 tests)
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
```

## Architecture Overview

### User Flow
```
UNINITIALIZED → CALIBRATING → G&A_DRAFTED → G&A_CONFIRMED → ACTIONS_ACTIVE
```

### Core Systems

1. **Calibration System** (`CalibrationContext`)
   - 7 G&A questions asked one at a time
   - Fast Lane protocol (2 questions for impatient users)
   - Gates daily actions behind G&A confirmation
   - Persists to `user_calibration` and `calibration_answers` tables

2. **Coaching Engine** (`CoachingEngineContext`)
   - Modes: CLARIFY → REFLECT → REFRAME → COMMIT → DIRECT
   - Moves: FOCUS, AGENCY, IDENTITY, EASE
   - Missed-day protocol

3. **Daily Action Engine** (`daily-action-engine.ts`)
   - Max 1 primary + 2 supporting actions
   - Readiness gate before actions
   - DIRECT mode delivery
   - Persists to `action_items` table

4. **LLM Integration** (`src/lib/llm/`)
   - Provider-agnostic (Claude/OpenAI)
   - **Server-side proxy** at `/api/llm/route.ts`
   - JWT authentication + rate limiting (20 req/min)
   - No API keys in client code

5. **Data Persistence** (Supabase)
   - 10 tables with Row Level Security
   - Realtime subscriptions for contacts/opportunities
   - Chat messages persist with `coaching_mode`

## Critical Files

| File | Purpose |
|------|---------|
| `src/components/layout/CoachPanel.tsx` | Main chat interface (1400+ lines) |
| `src/pages/GoalsAndActions.tsx` | Daily actions page with calibration gating |
| `src/contexts/CalibrationContext.tsx` | User state management |
| `src/types/coaching.ts` | Core type definitions (534 lines) |
| `src/lib/calibration.ts` | Calibration state machine |
| `api/llm/route.ts` | Server-side LLM proxy (security) |
| `docs/behavior/*.md` | AI behavior specifications |

## Non-Negotiable Behavior Rules

**CRITICAL**: These rules must be enforced at all times:

1. **One question at a time** - Never ask >1 question per coach response
2. **Reflect → Confirm → Proceed** - Always verify understanding first
3. **No daily actions before G&A confirmation** - Hard gate
4. **No urgency ever rendered** - No timers, streaks, overdue labels
5. **Banned words**: crush, hustle, grind, empower, synergy, game-changer

### Coaching Mode Rules
- **CLARIFY**: One question only, no advice
- **REFLECT**: Mirror facts + one confirmation question
- **REFRAME**: NO questions, reframe behavior not identity
- **COMMIT**: One commitment, require explicit agreement
- **DIRECT**: NO questions, NO coaching language, clear actions only

## Environment Variables

### Client-Side (`.env`)
```env
# Supabase connection (required)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Server-Side (Vercel Dashboard Only)
```env
# LLM API keys - NEVER in client code
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Database Schema (10 Tables)

| Table | Purpose |
|-------|---------|
| `user_calibration` | User state, tone, progress |
| `user_goals_actions` | G&A data (goals, milestones, boundaries) |
| `user_business_plan` | Revenue targets, lead sources |
| `calibration_answers` | Audit trail of answers |
| `coaching_sessions` | Session analytics |
| `daily_checkins` | Daily check-in responses |
| `contacts` | CRM with tags, notes (JSONB), stages |
| `opportunities` | Sales pipeline deals |
| `chat_messages` | Conversation history with `coaching_mode` |
| `action_items` | Daily actions with full structure |

All tables have:
- Row Level Security (`auth.uid() = user_id`)
- Indexes on `user_id`
- `updated_at` triggers

## Testing the Coaching Flow

1. Start dev server: `npm run dev`
2. Navigate to `/auth` and sign in (Google OAuth or email)
3. Navigate to `/demo/goals`
4. Open coach panel (sidebar icon)
5. Answer calibration questions one by one
6. Confirm G&A draft when presented
7. Verify daily actions appear

### Debug Shortcuts
```typescript
// In browser console:
localStorage.clear(); // Reset calibration state
JSON.parse(localStorage.getItem('realcoach-calibration')); // Check state
```

## Common Patterns

### State Transitions
```typescript
// Calibration transitions
transitionState(state, 'CALIBRATING');
transitionState(state, 'G&A_DRAFTED');

// Coaching mode transitions
transitionMode(state, 'REFLECT');
transitionMode(state, 'COMMIT');
```

### Signal Detection
```typescript
const signals = detectMoveSignals(userMessage);
const move = chooseCoachingMove(signals);
// Returns: 'FOCUS' | 'AGENCY' | 'IDENTITY' | 'EASE' | 'NONE'
```

### LLM Client Usage
```typescript
import { getLLMClient } from '@/lib/llm';

const client = getLLMClient();
const stream = await client.generateCoachingResponseStream({
  userMessage,
  context: {
    currentMode,
    currentMove,
    tone,
    goalsAndActions,
  }
});
```

## What NOT to Do

- Don't add urgency indicators anywhere
- Don't ask multiple questions in one response
- Don't give advice in CLARIFY mode
- Don't ask questions in DIRECT or REFRAME modes
- Don't show actions before G&A is confirmed
- Don't use motivational or cheerleading language
- Don't put LLM API keys in client-side code

## Test Coverage

| Test File | Tests | Focus |
|-----------|-------|-------|
| `calibration.test.ts` | 24 | State machine transitions |
| `coaching-engine.test.ts` | 36 | Mode/move detection |
| `client.test.ts` | 47 | Response validation, signals |
| `daily-action-engine.test.ts` | 38 | Readiness gate, actions |
| `prompts.test.ts` | 33 | System prompt building |

**Total: 178 tests passing**

---

*Last updated: January 12, 2026*
