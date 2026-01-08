# RealCoach.ai Documentation Index

**Source:** RealCoach_ai_Behavior_Logic___UX.pdf (260 pages)

This documentation has been split into 9 logical sections for easier consumption by Claude or any LLM.

---

## Quick Reference: What Each Module Does

| Module | Core Job | Key Constraint |
|--------|----------|----------------|
| AI Behavior Engine | How the AI coaches | One question at a time, never prescribe without understanding |
| User Calibration | Create G&A and Business Plan before actions | No daily actions until G&A confirmed |
| Daily Action Engine | Select today's actions | Max 1 primary + 2 supporting, no backlogs |
| Database/Pipeline | Store truth about contacts and deals | Never creates pressure or obligation |
| UX State & Rendering | Display state calmly | No urgency indicators, ever |
| Screenshots | Interpret images → signals | Never auto-write to database |
| Mailchimp Sync | Mirror contacts externally | One-way push only, RealCoach is truth |
| UI/UX Design | Visual philosophy | Action-first, analytics never interrupt |
| Brand/Voice | Tone and messaging | Calm, restrained, never motivational |

---

## Section Files

### 1. AI Behavior Engine (49 pages)
**File:** `01_AI_Behavior_Engine.md`

**Contains:**
- Coaching Modes state machine (CLARIFY → REFLECT → REFRAME → COMMIT → DIRECT)
- Coaching Moves (Focus, Agency, Identity, Ease)
- Non-negotiables: one question per turn, reflect → confirm → proceed
- Missed-Day Protocol
- Engineering spec with TypeScript types

**Key Rule:** If the bot asks more than one question per turn, it is broken.

---

### 2. User Calibration Module (52 pages)
**File:** `02_User_Calibration.md`

**Contains:**
- User states: UNINITIALIZED → CALIBRATING → G&A_DRAFTED → G&A_CONFIRMED → ACTIONS_ACTIVE
- 7 Core G&A Questions
- 8 Core Business Plan Questions
- Fast Lane Protocol (2 questions for impatient users)
- Calibration behavior rules (what AI can/cannot do)
- Error handling and edge cases

**Key Rule:** No daily actions before G&A confirmation.

---

### 3. Daily Action Engine (22 pages)
**File:** `03_Daily_Action_Engine.md`

**Contains:**
- Daily check-in flow ("What did you get done yesterday?")
- Readiness gate (when to coach vs. prescribe)
- Strategy integrity check
- Primary action selection logic
- Supporting actions (max 2)
- Minimum viable vs stretch completion
- DIRECT mode delivery

**Key Rule:** Select actions the user will actually do that advance the plan.

---

### 4. Database, Pipeline & Production (31 pages)
**File:** `04_Database_Pipeline_Production.md`

**Contains:**
- Contacts Database (memory, not management)
- What qualifies as a Lead (confirmed two-way conversation + stated intent)
- Pipeline stages: Lead → Nurture → Appointment Set → Appointment Held → Signed → Under Contract → Closed
- Production Dashboard KPIs (cumulative, not exclusive)
- CSV import rules
- Tagging rules (descriptive only, never prescriptive)

**Key Rule:** Pipeline data never creates tasks, reminders, or pressure.

---

### 5. UX State & Rendering Logic (19 pages)
**File:** `05_UX_State_Rendering.md`

**Contains:**
- Global UX invariants (no urgency ever rendered)
- State-by-state rendering rules
- DIRECT mode has no visual indicator
- Manual input rules
- Missed-day rendering (never shown)
- Absolute no-fly zone (no streaks, no overdue labels)

**Key Rule:** If the user feels more watched than supported, the change must not ship.

---

### 6. Screenshots → AI Interpretation (18 pages)
**File:** `06_Screenshots_Interpretation.md`

**Contains:**
- Upload lifecycle states
- Interpretation pipeline (intake → OCR → classification → summary → confirmation)
- "Here's what I see" card (mandatory transparency)
- Intent resolution priority order
- Signal generation (drafts only, never actions)
- Downstream handoff to Daily Action Engine

**Key Rule:** Interpretation without confirmation does nothing. Silent writes are forbidden.

---

### 7. Mailchimp Sync Logic (19 pages)
**File:** `07_Mailchimp_Sync.md`

**Contains:**
- One-way sync: RealCoach → Mailchimp only
- Data that syncs (name, email, phone, tags)
- Data that never syncs (notes, pipeline, production)
- Failure handling (silent retries, no user alerts)
- Deletion logic (coaching confirms intent first)

**Key Rule:** Mailchimp never influences coaching, prioritization, or daily actions.

---

### 8. UI/UX Design Philosophy (19 pages)
**File:** `08_UI_UX_Design.md`

**Contains:**
- Core philosophy (reduce cognitive load, action before analysis)
- Global layout (fixed right-side chatbot panel)
- Page-by-page experience:
  - Goals & Actions (default landing)
  - Business Plan (only place thinking is allowed)
  - Pipeline (reality without judgment)
  - Production Dashboard (calm reflection)
  - Database (system of record, boring by design)

**Key Rule:** If the user must decide "what should I look at?" — the interface has failed.

---

### 9. Brand, Voice & Messaging (31 pages)
**File:** `09_Brand_Voice_Messaging.md`

**Contains:**
- Brand posture vs anti-posture
- Tone rules (calm, direct, unemotional, minimal)
- Vocabulary bans (no: crush, hustle, grind, empower, optimize)
- Mission and positioning
- Landing page copy direction
- Logo constraints
- Diligence package questions

**Key Rule:** If someone says "this looks exciting" — it failed.

---

## System Non-Negotiables (Cross-Cutting)

These rules apply everywhere and override feature logic:

1. **One question at a time** — Multi-question prompts are always out of spec
2. **Reflect → Confirm → Proceed** — Never skip understanding
3. **No daily actions before G&A confirmation** — Hard gate
4. **No urgency ever rendered** — No timers, streaks, overdue labels
5. **Silence is valid** — Empty space > premature structure
6. **Restraint wins** — When in doubt, do less
7. **Pipeline ≠ tasks** — Pipeline is truth, not obligation
8. **RealCoach is source of truth** — External systems mirror, never influence
9. **Data entry is action-driven** — Never prerequisite setup

---

## Usage Notes

Each file is self-contained and can be fed to Claude independently. For full system understanding, read in order. For specific implementation work, reference the relevant section.

**Recommended reading order for developers:**
1. 01_AI_Behavior_Engine (understand coaching philosophy)
2. 02_User_Calibration (understand onboarding gates)
3. 03_Daily_Action_Engine (understand action generation)
4. 04_Database_Pipeline_Production (understand data model)
5. 05_UX_State_Rendering (understand UI constraints)

**For designers:** 08_UI_UX_Design + 09_Brand_Voice_Messaging

**For product:** All sections, starting with 00_INDEX
