# RC1.5 Development Guide

Internal development documentation for the RealCoach.ai team.

## Current Implementation Status (January 2026)

### Completed

| Component | File(s) | Status |
|-----------|---------|--------|
| Coaching Types | `src/types/coaching.ts` | ✅ Complete (534 lines) |
| Calibration State Machine | `src/lib/calibration.ts` | ✅ Complete |
| CalibrationContext | `src/contexts/CalibrationContext.tsx` | ✅ Complete |
| CoachingEngineContext | `src/contexts/CoachingEngineContext.tsx` | ✅ Complete |
| Coaching Engine | `src/lib/coaching-engine.ts` | ✅ Complete |
| Daily Action Engine | `src/lib/daily-action-engine.ts` | ✅ Complete |
| LLM Integration | `src/lib/llm/` | ✅ Complete (6 files) |
| LLM Proxy (Security) | `api/llm/route.ts` | ✅ Complete (JWT auth, rate limiting) |
| Database Schema | `supabase/schema.sql` | ✅ Complete (10 tables) |
| GoalsAndActions Gating | `src/pages/GoalsAndActions.tsx` | ✅ Complete |
| CoachPanel + Chat Persistence | `src/components/layout/CoachPanel.tsx` | ✅ Complete |
| Automated Testing | `src/lib/*.test.ts` | ✅ Complete (178 tests) |

### Recently Completed (Session: Jan 11, 2026)

1. ✅ **Environment Standardization** - Cleaned up env vars, removed client-side LLM keys
2. ✅ **LLM API Proxy Security** - Verified server-side only keys, JWT auth, rate limiting (20/min)
3. ✅ **CoachPanel Chat Persistence** - Messages persist to `chat_messages` table with `coaching_mode`
4. ✅ **Real LLM Hookup** - Mode/move context passed to prompts, streaming works
5. ✅ **Automated Testing** - 178 tests passing (calibration, coaching-engine, client, daily-action-engine, prompts)

---

## Architecture Deep Dive

### State Management

The app uses React Context for global state:

```
App.tsx
├── ThemeProvider          # Dark/light mode
├── AuthProvider           # Supabase auth
├── CalibrationProvider    # User calibration state
└── CoachingEngineProvider # Coaching behavior state
```

### CalibrationContext

Manages user progression through onboarding:

```typescript
// States
type UserState =
  | 'UNINITIALIZED'        // New user, no data
  | 'CALIBRATING'          // Answering G&A questions
  | 'G&A_DRAFTED'          // Draft ready for review
  | 'G&A_CONFIRMED'        // User confirmed, actions unlocked
  | 'ACTIONS_ACTIVE'       // Full app access
  | 'RECALIBRATION_REQUIRED'; // Needs re-calibration

// Key functions
calibration.transitionState(state, 'CALIBRATING');
calibration.saveAnswer(questionId, answer);
calibration.getProgress(); // Returns { current, total }
```

### CoachingEngineContext

Manages coaching behavior during conversations:

```typescript
// Modes (conversation phases)
type CoachMode = 'CLARIFY' | 'REFLECT' | 'REFRAME' | 'COMMIT' | 'DIRECT';

// Moves (intervention lenses)
type CoachingMove = 'FOCUS' | 'AGENCY' | 'IDENTITY' | 'EASE' | 'NONE';

// Key functions
engine.processMessage(userMessage);    // Updates state based on user input
engine.transitionTo('REFLECT');        // Change coaching mode
engine.detectAndSetMove(userMessage);  // Detect move signals
engine.getResponseGuidance();          // Get mode/move instructions for LLM
```

### Mode State Machine

```
CLARIFY (ambiguity detected)
    ↓ (user provides answer)
REFLECT (mirror understanding)
    ↓ (user confirms)
REFRAME (if limiting belief) or COMMIT (if ready)
    ↓ (user agrees)
DIRECT (action delivery)
    ↓ (new input)
Back to CLARIFY or REFLECT
```

### Move Signal Detection

The coaching engine detects emotional signals in user messages:

| Signal Pattern | Move | Response Focus |
|---------------|------|----------------|
| "ten things", "overwhelmed" | FOCUS | Narrow attention to one thing |
| "can't control", "nothing I can do" | AGENCY | Find controllable actions |
| "I'm not disciplined", "always fail" | IDENTITY | Separate behavior from self |
| "know what to do but can't start" | EASE | Reduce friction, smaller steps |

---

## LLM Integration

### Architecture

The LLM integration uses a **server-side proxy** for security:

```
Client (browser)                    Server (Vercel)
     │                                    │
     ├── POST /api/llm ─────────────────►│
     │   (JWT auth, streaming)           │
     │                                   ├──► Claude (coaching)
     │◄────────────────────── SSE ───────┤
     │                                   ├──► GPT-4o-mini (acks)
                                         │
```

**Key files:**
- `api/llm/route.ts` - Server-side proxy (JWT auth, rate limiting 20/min)
- `src/lib/llm/client.ts` - Client calls proxy endpoint
- `src/lib/llm/prompts.ts` - System prompt construction

### Usage

```typescript
import { getLLMClient } from '@/lib/llm';

const client = getLLMClient();

// Streaming response (preferred)
const stream = await client.generateCoachingResponseStream({
  userMessage: "I feel overwhelmed with all my leads",
  context: {
    currentMode: 'CLARIFY',
    currentMove: 'FOCUS',
    tone: 'COACH_CONCISE',
    goalsAndActions: { ... },
  }
});

for await (const chunk of stream) {
  // Handle streaming chunks
}
```

### Smart Routing

The proxy intelligently routes requests:
- **Claude** - Coaching conversations (high quality)
- **GPT-4o-mini** - Simple acknowledgments (cost efficient)

### System Prompt Construction

The `buildSystemPrompt()` function creates mode-aware prompts:

```typescript
const prompt = buildSystemPrompt({
  mode: 'CLARIFY',
  move: 'FOCUS',
  tone: 'COACH_CONCISE',
  goalsAndActions: userGA,
  missedDayDetected: false,
});
```

---

## Daily Action Engine

### Action Selection Logic

```typescript
import { generateDailyPlan } from '@/lib/daily-action-engine';

const plan = generateDailyPlan(
  goalsAndActions,   // User's G&A
  businessPlan,      // Optional business plan
  pipeline,          // Array of opportunities
  priorityContext,   // Any blockers or priorities
  reducedLoad        // true if missed-day or low capacity
);

// Returns:
{
  date: '2026-01-08',
  primary: { ... },      // Max 1 revenue-progressing action
  supporting: [...],     // Max 2 friction-reducing actions
  reducedLoad: false
}
```

### Readiness Gate

Before delivering actions, check if user needs coaching:

```typescript
import { checkReadinessGate } from '@/lib/daily-action-engine';

const { needsCoaching, reason } = checkReadinessGate(checkIn, missedDayDetected);

if (needsCoaching) {
  // Route to coaching flow instead of actions
}
```

### DIRECT Mode Formatting

Actions are delivered without coaching language:

```typescript
import { formatForDirectMode } from '@/lib/daily-action-engine';

const message = formatForDirectMode(plan);
// Returns: "Today: Follow up with Jane Smith\n..."
```

---

## Database Schema

### Tables Overview


| Table | Purpose |
|-------|---------|
| `user_calibration` | User state, tone preference, progress |
| `user_goals_actions` | G&A data (goals, milestones, boundaries) |
| `user_business_plan` | Optional business plan data |
| `calibration_answers` | Individual answers (audit trail) |
| `coaching_sessions` | Session analytics (modes, moves, violations) |
| `daily_checkins` | Daily check-in responses |

### Setup Instructions

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in dashboard
3. Paste entire contents of `/supabase/schema.sql`
4. Click "Run" to execute
5. Verify tables: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`

### Row Level Security

All tables have RLS enabled - users can only access their own data:

```sql
CREATE POLICY "Users can view own calibration" ON user_calibration
  FOR ALL USING (auth.uid() = user_id);
```

---

## Key Integration Points

### LLM Integration (✅ Complete)

CoachPanel uses real LLM responses via the server-side proxy:

```typescript
// src/components/layout/CoachPanel.tsx
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

### Supabase Persistence (✅ Complete)

All data now persists to Supabase:

```typescript
// Chat messages with coaching mode
await supabase.from('chat_messages').insert({
  user_id: userId,
  role: 'user',
  content: message,
  coaching_mode: currentMode,
});
```

### Realtime Subscriptions (✅ Complete)

Contacts and opportunities use Supabase realtime:

```typescript
const channel = supabase
  .channel('contacts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' },
    (payload) => { /* handle change */ })
  .subscribe();
```

---

## Testing the Coaching Flow

### Manual Test Steps

1. **Fresh Start**
   - Clear localStorage: `localStorage.clear()`
   - Refresh page
   - Verify user sees calibration, not actions

2. **Calibration Flow**
   - Open coach panel
   - Answer 7 G&A questions one at a time
   - Verify G&A draft is presented
   - Confirm the draft

3. **Post-Confirmation**
   - Verify daily actions appear
   - Verify max 1 primary + 2 supporting
   - Check no urgency indicators

4. **Coaching Behavior**
   - Send message to coach
   - Verify only 1 question per response
   - Test mode transitions

5. **Missed Day Protocol**
   - Report "nothing got done yesterday"
   - Verify UNPACK/SKIP choice offered

### Debug Shortcuts

```typescript
// In browser console:

// Check calibration state
JSON.parse(localStorage.getItem('realcoach-calibration'))

// Check coaching state
// (Access via React DevTools -> CoachingEngineContext)

// Force state transition
// (Use React DevTools to call context methods)
```

---

## Environment Setup

### Client-Side (`.env`)

```env
# Supabase connection (required)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Server-Side (Vercel Environment Variables)

LLM API keys are **server-side only** (not exposed to client):

```env
# Set in Vercel dashboard, NOT in .env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### Development

In development, the LLM client uses the proxy which requires server-side keys.
Run with `npm run dev` to start the Vite dev server.

---

## Coding Conventions

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Types: `camelCase.ts` or inline

### Component Structure
```typescript
// 1. Imports
import { ... } from '...';

// 2. Types (if not in separate file)
interface Props { ... }

// 3. Component
export function ComponentName({ prop1, prop2 }: Props) {
  // Hooks first
  const [state, setState] = useState();

  // Effects
  useEffect(() => { ... }, []);

  // Handlers
  const handleClick = () => { ... };

  // Render
  return ( ... );
}
```

### State Transitions
Always use the provided transition functions:

```typescript
// Good
transitionState(state, 'CALIBRATING');
transitionMode(state, 'REFLECT');

// Bad
state.currentState = 'CALIBRATING'; // Direct mutation
```

---

## Common Issues

### "Cannot find module" errors
```bash
npm install
```

### TypeScript errors after changes
```bash
npx tsc --noEmit
```

### Port already in use
The dev server will automatically find next available port (8080, 8081, etc.)

### Supabase connection issues
1. Check `.env` file exists and has correct values
2. Verify Supabase project is active
3. Check RLS policies allow access

---

## Testing

### Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test Coverage (178 tests)

| File | Tests | Coverage |
|------|-------|----------|
| `calibration.test.ts` | 24 | State machine transitions |
| `coaching-engine.test.ts` | 36 | Mode/move detection |
| `client.test.ts` | 47 | Response validation, signal detection |
| `daily-action-engine.test.ts` | 38 | Readiness gate, action selection |
| `prompts.test.ts` | 33 | System prompt building |

### Key Test Areas

- **Response Validation**: One question max, banned words, mode-specific rules
- **Signal Detection**: Overwhelm, externalized control, self-story, resistance
- **Mode Transitions**: CLARIFY → REFLECT → REFRAME → COMMIT → DIRECT
- **Action Selection**: Strategy integrity, friction boundaries

---

## Next Priority Tasks

1. **Production Deployment** - Verify Vercel env vars, test production build
2. **Error Monitoring** - Set up Sentry or similar
3. **E2E Testing** - Playwright or Cypress for full flow tests
4. **Performance Optimization** - Code splitting for bundle size

---

## Contact

- **Project Lead**: Jack Warman
- **Development**: Erik (internal)

---

*Last updated: January 11, 2026*

