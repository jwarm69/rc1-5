# CLAUDE.md - RC1.5 Project Instructions

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**RC1.5** is RealCoach.ai - an AI-powered coaching platform for solo real estate agents. It provides calm, clear, friction-free daily guidance to help agents grow their business.

## Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn-ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **LLM**: Claude/OpenAI (configurable)

## Project Structure

```
/src
├── components/          # React components
│   ├── layout/          # MainLayout, Sidebar, CoachPanel
│   ├── ui/              # shadcn-ui components
│   ├── goals/           # GoalCard components
│   └── actions/         # ActionCard components
├── contexts/            # React contexts
│   ├── CalibrationContext.tsx    # User calibration state
│   ├── CoachingEngineContext.tsx # Coaching behavior state
│   ├── AuthContext.tsx           # Supabase auth
│   └── ThemeContext.tsx          # Dark/light mode
├── lib/                 # Core business logic
│   ├── calibration.ts            # Calibration state machine
│   ├── coaching-engine.ts        # Coaching mode/move logic
│   ├── daily-action-engine.ts    # Action selection
│   └── llm/                      # LLM integration
│       ├── client.ts             # Provider-agnostic client
│       ├── claude-adapter.ts     # Anthropic API
│       ├── openai-adapter.ts     # OpenAI API
│       ├── prompts.ts            # System prompts
│       └── types.ts              # LLM types
├── hooks/               # Custom React hooks
├── pages/               # Route pages
├── types/               # TypeScript types
│   └── coaching.ts      # Core coaching types
└── integrations/        # External service integrations
    └── supabase/        # Supabase client + types

/docs
└── behavior/            # AI behavior documentation (9 modules)

/supabase
└── schema.sql           # Database schema
```

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (usually localhost:8080)
npm run build     # Production build
npm run lint      # Run ESLint
npx tsc --noEmit  # Type check
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

2. **Coaching Engine** (`CoachingEngineContext`)
   - Modes: CLARIFY → REFLECT → REFRAME → COMMIT → DIRECT
   - Moves: FOCUS, AGENCY, IDENTITY, EASE
   - Missed-day protocol

3. **Daily Action Engine** (`daily-action-engine.ts`)
   - Max 1 primary + 2 supporting actions
   - Readiness gate before actions
   - DIRECT mode delivery

4. **LLM Integration** (`src/lib/llm/`)
   - Provider-agnostic (Claude/OpenAI)
   - Enforces coaching rules in prompts

## Critical Files

| File | Purpose |
|------|---------|
| `src/components/layout/CoachPanel.tsx` | Main chat interface (1400+ lines) |
| `src/pages/GoalsAndActions.tsx` | Daily actions page with calibration gating |
| `src/contexts/CalibrationContext.tsx` | User state management |
| `src/types/coaching.ts` | Core type definitions (534 lines) |
| `src/lib/calibration.ts` | Calibration state machine |
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

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# LLM (choose one provider)
VITE_LLM_PROVIDER=claude|openai
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...
```

## Key Integration Points

### Adding LLM Responses
The main integration point for real LLM responses is:
- `CoachPanel.tsx` line ~770: Replace hardcoded "Noted." response
- Use `getLLMClient()` from `src/lib/llm/client.ts`

### Database Persistence
- Currently uses localStorage for calibration state
- Migrate to Supabase tables defined in `/supabase/schema.sql`

## Testing the Coaching Flow

1. Clear localStorage to reset state
2. Navigate to `/demo/goals`
3. Open coach panel (sidebar icon)
4. Answer calibration questions one by one
5. Confirm G&A draft when presented
6. Verify daily actions appear

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

## What NOT to Do

- Don't add urgency indicators anywhere
- Don't ask multiple questions in one response
- Don't give advice in CLARIFY mode
- Don't ask questions in DIRECT or REFRAME modes
- Don't show actions before G&A is confirmed
- Don't use motivational or cheerleading language
