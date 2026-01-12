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
1879197 Wire UI to Supabase persistence (Phase 4)
20948b9 Add comprehensive test coverage for LLM client, daily action engine, and prompts
79164b3 Add testing infrastructure and production readiness improvements
6ca48f0 Update pricing to $99/month
bd123c2 Add UX polish: demo data handling and realtime subscriptions
```

---

## Sprint 2: Phase 4 - UI Persistence (January 11, 2026)

### Overview
Wired Database, Pipeline, and related UI components to Supabase for full data persistence. Phase 1 (database foundation) was already complete with all 10 tables and RLS policies in place.

### Completed Tasks

#### Task 1: Fix AddToPipelineModal Column Names (CRITICAL)
- [x] Fixed broken column names: `status` → `stage`, `deal_amount` → `deal_value`
- [x] Added `contact_id` prop for proper contact-opportunity linking
- [x] Stage now stored as index (0-5) matching database schema

#### Task 2: Fix Pipeline Data Transformation
- [x] Read `deal_type` from DB instead of hardcoding `"Buy"`
- [x] Read `source` from DB instead of hardcoding `"Database"`

#### Task 3: Add Loading State to Database Page
- [x] Added `isLoading` state with Loader2 spinner
- [x] Shows centered loading indicator while fetching contacts

#### Task 4: Implement Contact Notes Persistence
- [x] Added note editor UI in ContactModal (Textarea + Add Note button)
- [x] Notes stored as JSONB array: `[{date: string, content: string}]`
- [x] Notes persist on contact update

#### Task 5: Standardize Auth Checks
- [x] Replaced `supabase.auth.getUser()` with `useAuth()` context in all modals
- [x] Consistent auth pattern across CreateContactModal and AddToPipelineModal

#### Task 6 & 7: Calibration & Goals/Actions Persistence
- [x] Already implemented via `useSupabaseCalibration` hook
- [x] Saves to `user_calibration` and `user_goals_actions` tables

#### Task 8: Add Demo Data Tagging + Empty States
- [x] Empty state UI for authenticated users with no contacts/opportunities
- [x] No demo data blending for authenticated users

#### Task 9: Add Error Handling & Toast Notifications
- [x] Toast notifications for all CRUD operations
- [x] Error catching with user-friendly messages

### Files Modified

| File | Changes |
|------|---------|
| `src/components/database/AddToPipelineModal.tsx` | Fix column names, add contactId, standardize auth |
| `src/components/database/ContactModal.tsx` | Add note editing capability |
| `src/components/database/CreateContactModal.tsx` | Standardize auth to useAuth() |
| `src/pages/Database.tsx` | Add loading/empty states, notes persistence, error handling |
| `src/pages/Pipeline.tsx` | Fix data transformation, empty states, toast notifications |

### Verification Checklist

- [x] TypeScript check passes (`npx tsc --noEmit`)
- [x] Build succeeds (`npm run build`)
- [ ] Create contact → persists after refresh *(pending manual verification)*
- [ ] Update contact with notes → persists after refresh *(pending manual verification)*
- [ ] Delete contact → removed after refresh *(pending manual verification)*
- [ ] Add to pipeline → creates opportunity with correct stage *(pending manual verification)*
- [ ] Pipeline stage changes persist *(pending manual verification)*

**Note**: Manual persistence tests pending as of January 12, 2026. Test at localhost:8080 with authenticated user.

---

## Next Steps (Suggested)

1. **Manual Verification** - Test the persistence verification checklist above
2. **Google OAuth Configuration** - Enable Google sign-in:
   - Configure Google Cloud OAuth credentials
   - Enable Google provider in Supabase Dashboard (Authentication → Providers)
   - Code already implemented in `src/pages/Auth.tsx:handleGoogleSignIn()`
3. **Production Deployment** - Push changes and verify on Vercel
4. **Remaining Test Coverage** - Add tests for new persistence logic
5. **Error Monitoring** - Set up Sentry or similar

---

## Doc Alignment (January 12, 2026)

The following docs were updated to reflect completed work:
- `docs/PROGRESS_REPORT.md` - Updated to show all phases complete
- `tasks/IMPLEMENTATION_ROADMAP.md` - Marked all 5 phases as ✅ Complete
- `CLAUDE.md` - Fixed stale instructions (localStorage → Supabase, added testing info)

---

## Resources

- PRDs: `/RC1.5/tasks/prd-*.md`
- Implementation Roadmap: `/RC1.5/tasks/IMPLEMENTATION_ROADMAP.md`
- Behavior Docs: `/RC1.5/docs/behavior/`

---

---

## Sprint 3: Screenshots Interpretation v1 (January 12, 2026)

### Overview
Implemented screenshot upload + Claude Vision AI interpretation in CoachPanel with mandatory confirmation flow before signal generation. Users can upload screenshots of conversations, calendars, or any content, and the AI interprets them to suggest follow-up actions.

### Key Features

1. **Screenshot Upload Flow**
   - Drag-and-drop or click-to-upload (up to 10 images)
   - Thumbnail grid preview with removal capability
   - Processing state indicators

2. **Vision AI Interpretation**
   - Claude Vision API analyzes uploaded images
   - Content classification (text conversations, social DMs, calendars, emails, etc.)
   - People/contact detection with fuzzy matching
   - Date extraction and normalization
   - Pattern detection (response gaps, urgency signals, calendar overload)

3. **"Here's What I See" Card**
   - Displays AI interpretation summary (max 5 bullet points)
   - Shows detected people, dates, and patterns
   - Inferred intent with confidence indicator
   - Three-button confirmation: Yes / Adjust / No

4. **Signal Generation**
   - Only generates signals AFTER user confirms
   - Signals inform Daily Action Engine (NO direct DB writes)
   - Signal types: follow_up, contact_note, scheduling, pipeline, coaching

### Files Created

| File | Purpose |
|------|---------|
| `src/types/screenshot.ts` | Upload states, content types, signal types |
| `src/contexts/UploadContext.tsx` | State machine with useReducer pattern |
| `src/lib/screenshot-interpreter.ts` | Classification, extraction, signal generation |
| `src/lib/signal-handler.ts` | Signal processing for Daily Action Engine |
| `src/components/chat/InterpretationCard.tsx` | "Here's What I See" card |
| `src/components/chat/UploadPreview.tsx` | Thumbnail grid with remove buttons |
| `src/components/chat/ClarificationPrompt.tsx` | Intent clarification when needed |
| `src/components/chat/index.ts` | Barrel export file |

### Files Modified

| File | Changes |
|------|---------|
| `api/llm/route.ts` | Added multimodal content handling for Vision API |
| `src/lib/llm/types.ts` | Added ContentBlock type for image+text arrays |
| `src/lib/llm/client.ts` | Added `interpretScreenshot()` method |
| `src/lib/llm/prompts.ts` | Added `buildScreenshotInterpretationPrompt()` |
| `src/components/layout/CoachPanel.tsx` | Wired interpretation flow (+350 lines) |
| `src/App.tsx` | Added UploadProvider to provider tree |

### Non-Negotiables Verified

- [x] Confirmation MANDATORY before signal generation
- [x] Signals inform Daily Action Engine only (NO direct DB writes)
- [x] 10 images max per upload enforced
- [x] Screenshots processed but not persisted to storage

### Upload State Machine

```
UPLOAD_IDLE
    ↓ (add images)
UPLOAD_RECEIVED
    ↓ (start interpretation)
UPLOAD_INTERPRETING
    ↓ (needs more context?)
UPLOAD_NEEDS_CLARIFICATION ←→ (user provides intent)
    ↓ (interpretation ready)
UPLOAD_AWAITING_CONFIRMATION
    ↓ (user confirms)
UPLOAD_CONFIRMED → signals generated
    ↓ (user rejects)
UPLOAD_IDLE (reset, no signals)
```

### Signal Types

| Signal Type | Description |
|-------------|-------------|
| `follow_up` | Detected conversation needing response |
| `contact_note` | Information to add to a contact |
| `scheduling` | Calendar/meeting related |
| `pipeline` | Sales pipeline opportunity |
| `coaching` | Coaching insight for behavior engine |

### Git Branch & PR

- Branch: `feature/screenshots-interpretation`
- PR: https://github.com/jwarm69/rc1-5/pull/5
- Commit: `2aba274` - Add Screenshots Interpretation v1

### Verification

- [x] TypeScript check passes (`npx tsc --noEmit`)
- [x] All 178 tests pass (`npm test`)
- [x] Build succeeds (`npm run build`)
- [ ] Manual test: Upload → Interpret → Confirm → Signals logged
- [ ] Manual test: Upload → Interpret → Reject → No signals

---

## Sprint 4: Mailchimp Sync v1 (January 12, 2026)

### Overview
Implemented one-way contact sync from RealCoach to Mailchimp. RealCoach is always the source of truth - no data flows from Mailchimp back to RealCoach. Includes OAuth connection flow, audience selection, automatic sync on contact CRUD, and silent failure handling.

### Key Features

1. **OAuth Connection Flow**
   - Connect Mailchimp via OAuth 2.0 from Settings page
   - CSRF protection via state parameter
   - Secure token storage in Supabase

2. **Audience Selection**
   - Fetch user's Mailchimp audiences after connection
   - Auto-select if only one audience exists
   - Queue initial sync of all contacts on selection

3. **Automatic Sync Triggers**
   - Contact create → queues sync
   - Contact update → queues sync
   - Contact delete → queues sync (with email preserved in payload)

4. **Sync Queue with Retry Logic**
   - Exponential backoff: 1s, 2s, 4s, 8s, 16s
   - Max 5 attempts before marking failed
   - Deduplication of pending operations

5. **Silent Failure Handling**
   - Subtle notification in CoachPanel (amber indicator)
   - Links to Settings to fix issues
   - No interrupting user workflow

### Files Created

| File | Purpose |
|------|---------|
| `api/mailchimp/auth.ts` | OAuth initiation endpoint |
| `api/mailchimp/callback.ts` | OAuth callback handler |
| `api/mailchimp/disconnect.ts` | Disconnect endpoint |
| `src/lib/mailchimp-sync.ts` | Core sync library (~650 lines) |
| `src/components/settings/MailchimpConnection.tsx` | Settings UI component |
| `src/pages/Settings.tsx` | Settings page |

### Files Modified

| File | Changes |
|------|---------|
| `supabase/schema.sql` | Added `mailchimp_connections` + `mailchimp_sync_queue` tables |
| `src/integrations/supabase/types.ts` | Added TypeScript types for new tables |
| `src/components/database/CreateContactModal.tsx` | Queue sync on contact create |
| `src/pages/Database.tsx` | Queue sync on contact update/delete |
| `src/components/layout/CoachPanel.tsx` | Added sync error notification |
| `src/components/layout/Navigation.tsx` | Added Settings nav link |
| `src/App.tsx` | Added Settings route |

### Database Tables Added

| Table | Purpose |
|-------|---------|
| `mailchimp_connections` | OAuth tokens, audience selection, sync status |
| `mailchimp_sync_queue` | Pending sync operations with retry tracking |

### Design Decisions

- **One-way sync only**: Data flows RealCoach → Mailchimp, never reverse
- **RealCoach is source of truth**: Mailchimp is a subscriber, not a source
- **Silent failures**: Errors don't interrupt user workflow
- **Queue-based**: All syncs go through queue for reliability
- **Exponential backoff**: Handles rate limits and transient failures

### Sync Library Functions

```typescript
// Connection management
getConnection(userId): Promise<MailchimpConnection | null>
hasActiveConnection(userId): Promise<boolean>
updateConnectionStatus(userId, status, error?): Promise<void>

// Queue operations
enqueueSync(userId, contactId, operation, payload?): Promise<void>
processUserQueue(userId): Promise<{processed, succeeded, failed}>
queueAllContacts(userId): Promise<number>

// Mailchimp API
syncContact(connection, contact): Promise<SyncResult>
syncTags(connection, email, tags): Promise<SyncResult>
deleteContact(connection, email): Promise<SyncResult>
```

### Git Branch & PR

- Branch: `feature/mailchimp-sync`
- PR: https://github.com/jwarm69/rc1-5/pull/6
- Commit: `190097b` - Add Mailchimp Sync v1

### Verification

- [x] TypeScript check passes (`npx tsc --noEmit`)
- [x] All 178 tests pass (`npm test`)
- [x] Build succeeds (`npm run build`)
- [ ] Manual: OAuth flow connects successfully
- [ ] Manual: Audience selection triggers initial sync
- [ ] Manual: Contact create/update/delete queues sync
- [ ] Manual: Sync errors show notification in CoachPanel

---

*Last updated: January 12, 2026 (Sprint 4 added)*
