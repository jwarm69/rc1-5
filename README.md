# RealCoach.ai (RC1.5)

AI-powered coaching platform for solo real estate agents. Provides calm, clear, friction-free daily guidance to help agents grow their business.

## Features

- **AI Coaching Engine** - Intelligent coaching with mode-based conversations (Clarify, Reflect, Reframe, Commit, Direct)
- **User Calibration** - 7-question onboarding to understand goals, constraints, and preferences
- **Daily Actions** - Max 1 primary + 2 supporting actions per day (no overwhelm)
- **Goals & Actions (G&A)** - Annual goals, monthly milestones, friction boundaries
- **Business Plan** - Optional detailed business planning module
- **Pipeline Management** - Contact and opportunity tracking
- **No Urgency Design** - No streaks, timers, or guilt-inducing UI elements

## Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn-ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **LLM**: Claude/OpenAI (configurable)

## Getting Started

### Prerequisites

- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm or yarn
- Supabase project (for production)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd RC1.5

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080` (or next available port).

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase (required for production)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# LLM Provider (choose one)
VITE_LLM_PROVIDER=claude|openai
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...
```

**Note**: The app works in development mode without API keys using mock responses.

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
├── hooks/               # Custom React hooks
├── pages/               # Route pages
├── types/               # TypeScript types
└── integrations/        # External service integrations

/docs
└── behavior/            # AI behavior documentation (9 modules)

/supabase
└── schema.sql           # Database schema
```

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
npx tsc --noEmit  # Type check
```

## Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Paste contents of `/supabase/schema.sql`
4. Run the SQL to create tables and policies
5. Copy your project URL and anon key to `.env`

## Architecture Overview

### User Flow
```
UNINITIALIZED → CALIBRATING → G&A_DRAFTED → G&A_CONFIRMED → ACTIONS_ACTIVE
```

### Coaching Modes
```
CLARIFY → REFLECT → REFRAME → COMMIT → DIRECT
```

### Core Systems

1. **Calibration System** - 7 G&A questions, Fast Lane protocol for impatient users
2. **Coaching Engine** - Mode transitions, coaching moves (Focus, Agency, Identity, Ease)
3. **Daily Action Engine** - Max 1 primary + 2 supporting, no backlogs
4. **LLM Integration** - Provider-agnostic, enforces coaching rules

## Non-Negotiable Behavior Rules

These rules are enforced at the coaching engine level:

1. **One question at a time** - Never ask >1 question per response
2. **Reflect → Confirm → Proceed** - Always verify understanding first
3. **No daily actions before G&A confirmation** - Hard gate
4. **No urgency ever rendered** - No timers, streaks, overdue labels
5. **Banned words**: crush, hustle, grind, empower, synergy, game-changer

## Contributing

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for internal development guidelines.

## License

Proprietary - All rights reserved.
