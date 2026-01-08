# RC1.5 Development Guide

Internal development documentation for the RealCoach.ai team.

## Current Implementation Status (January 2026)

### Completed

| Component | File(s) | Status |
|-----------|---------|--------|
| Coaching Types | `src/types/coaching.ts` | Complete (534 lines) |
| Calibration State Machine | `src/lib/calibration.ts` | Complete |
| CalibrationContext | `src/contexts/CalibrationContext.tsx` | Complete |
| CoachingEngineContext | `src/contexts/CoachingEngineContext.tsx` | Complete |
| Coaching Engine | `src/lib/coaching-engine.ts` | Complete |
| Daily Action Engine | `src/lib/daily-action-engine.ts` | Complete |
| LLM Integration | `src/lib/llm/` | Complete (6 files) |
| Database Schema | `supabase/schema.sql` | Complete |
| GoalsAndActions Gating | `src/pages/GoalsAndActions.tsx` | Complete |
| CoachPanel Calibration UI | `src/components/layout/CoachPanel.tsx` | Partial |

### In Progress / Next Steps

1. **Wire LLM to CoachPanel** - Replace mock "Noted." response with real LLM calls
2. **Supabase Integration** - Migrate from localStorage to Supabase tables
3. **Full Coaching Flow** - Complete mode transitions in UI
4. **Testing** - Manual and automated test coverage

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

### Provider Architecture

```
src/lib/llm/
├── types.ts           # Request/response types
├── prompts.ts         # System prompts from behavior docs
├── claude-adapter.ts  # Anthropic API
├── openai-adapter.ts  # OpenAI API
├── client.ts          # Provider-agnostic client
└── index.ts           # Exports
```

### Usage

```typescript
import { getLLMClient } from '@/lib/llm';

const client = getLLMClient();

const response = await client.generateCoachingResponse({
  userMessage: "I feel overwhelmed with all my leads",
  conversationHistory: [...],
  coachingContext: {
    currentMode: 'CLARIFY',
    currentMove: 'FOCUS',
    userTone: 'COACH_CONCISE',
    goalsAndActions: { ... },
    missedDayDetected: false,
  }
});

// Response includes validation
if (response.policyViolations.length > 0) {
  console.warn('Policy violations:', response.policyViolations);
}
```

### Mock Mode

Without API keys, the client returns mock responses for development:

```typescript
// In development without VITE_ANTHROPIC_API_KEY or VITE_OPENAI_API_KEY
const client = getLLMClient(); // Returns MockLLMClient
```

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

### Replacing Mock LLM Response

In `CoachPanel.tsx` around line 770, the hardcoded "Noted." response needs replacement:

```typescript
// Current (mock)
const coachResponse = "Noted.";

// Target implementation
import { getLLMClient } from '@/lib/llm';

const client = getLLMClient();
const response = await client.generateCoachingResponse({
  userMessage,
  conversationHistory,
  coachingContext: {
    currentMode: engine.getCurrentMode(),
    currentMove: engine.getCurrentMove(),
    userTone: calibration.state.tone,
    goalsAndActions: calibration.state.goalsAndActions,
    missedDayDetected: engine.hasMissedDay,
  }
});
const coachResponse = response.message;
```

### Migrating to Supabase

Replace localStorage calls with Supabase queries:

```typescript
// Current (localStorage)
localStorage.setItem('calibration', JSON.stringify(state));

// Target (Supabase)
import { supabase } from '@/integrations/supabase/client';

await supabase
  .from('user_calibration')
  .upsert({ user_id: userId, ...state });
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

### Required for Production

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_LLM_PROVIDER=claude
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### Optional (for OpenAI instead of Claude)

```env
VITE_LLM_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-...
```

### Development (no API keys needed)

The app works without API keys using mock responses.

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

## Next Priority Tasks

1. **Wire LLM to CoachPanel** - Connect real LLM responses
2. **Supabase Migration** - Move from localStorage to database
3. **Complete Calibration UI** - All 7 questions in CoachPanel
4. **Action Display** - Show daily actions from engine
5. **Testing Suite** - Unit tests for engines

---

## Contact

- **Project Lead**: Jack Warman
- **Development**: Erik (internal)
