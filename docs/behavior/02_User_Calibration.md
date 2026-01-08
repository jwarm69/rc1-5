# User Calibration Module

**Description:** Calibration system, G&A creation, Business Plan creation, fast lane protocol, and system states

**Pages:** 50-101

---

## Page 50

User Calibration Module

---

## Page 51

Ready for review by Dev Team
READ FIRST — RealCoach.ai Calibration System
RealCoach.ai is not a CRM and not a productivity app.
Its core job is simple and strict:
Tell the user what to do today — responsibly.
Everything in this system exists to protect that promise.
The non-negotiable idea
The system does not earn the right to prescribe actions until it understands:
● what the user is trying to build
● how they actually operate
● what actions they will realistically execute
That understanding is created once, up front, through Calibration — and then refined through
behavior over time.
Calibration is not onboarding
Calibration is:
● Context creation, not configuration
● Decision safety, not data completeness
● Defaults first, not perfect personalization
If calibration feels long, heavy, or exhaustive, the system is broken.

---

## Page 52

Two artifacts power everything
Calibration exists to create two authoritative tabs:
1. G&A (Goals & Actions)
○ Defines what matters right now
○ Gates whether daily actions are allowed to appear
2. Business Plan
○ Revenue-first, solo-agent model
○ Provides economic and strategic guardrails
○ Never blocks action, only sharpens it
If these two are right, everything downstream works.
If they’re wrong, nothing else matters.
Hard system rules (do not violate)
● ❌ No daily actions before G&A confirmation
● ❌ No “Today’s Plan” language during calibration
● ❌ No deep coaching, therapy, or interrogation
● ❌ No forced completeness
● ✅ One question at a time
● ✅ Defaults over friction
● ✅ Draft first, confirm second
● ✅ Behavior > theory over time

---

## Page 53

Assumptions are visible, not permanent
Calibration creates assumptions, not commitments.
The UX must:
● make assumptions visible
● allow in-context correction
● adapt future actions without restarting calibration
Users should never feel trapped by their onboarding answers.
If you remember only one thing
Calibration protects the user from bad advice.
Everything else exists to support that.
Build with restraint first. Precision comes later.

---

## Page 54

1-Plain English V2

---

## Page 55

User Calibration Module — Plain English
Walkthrough
What problem this solves
RealCoach.ai’s job is to tell the user what to do today.
But it can’t do that intelligently until it understands:
● what the user is trying to build
● how they actually operate as a human
● what kind of actions they’ll realistically execute
The User Calibration Module is how the system learns that — once, up front, and then
progressively over time.
Step 1 (Expanded): Calibration happens before advice
1) Product intent (why this step exists)
Goal: prevent RealCoach.ai from becoming a generic task generator.
The system must earn the right to prescribe actions by first understanding:
● What the user is building (goals + priorities)
● How they operate (behavioral reality, constraints, preferences)
● What “execution” looks like for them (capacity, cadence, style)
Non-goal: not “set up a CRM.” Not “complete onboarding.” Not “collect everything.”
This step is about getting just enough signal to safely produce a first-day plan.
2) System state model (hard rule)
Introduce a user-level state machine.
User States
1. UNINITIALIZED (brand new; no calibration started)

---

## Page 56

2. CALIBRATING (actively collecting inputs; no tasks)
3. G&A_DRAFTED (AI created draft Goals & Actions tab)
4. G&A_CONFIRMED (user confirmed/edit-approved G&A)
5. ACTIONS_ACTIVE (Daily Action Engine enabled)
6. RECALIBRATION_REQUIRED (major drift detected later; actions continue but with a
warning + short loop)
Hard gate:
● If state is not G&A_CONFIRMED → Daily Action Engine must not generate “Today’s
Actions.”
● The system may still show “Calibration Steps,” “Draft docs,” and “Next questions.”
3) UX rules (what the user sees)
When a user signs up, they should immediately feel 3 things:
● “This is not a CRM.”
● “This is fast.”
● “This is going to tell me what to do… but it’s being responsible first.”
UI requirements
● The dashboard should not present a blank task list (that creates anxiety).
● It should show a Calibration Progress Panel instead.
Progress Panel contents
● Step label: “Calibration Mode”
● Progress meter (example: 0% → 100%)
● 3–6 short steps max visible at once (no giant checklist)
● A single primary CTA: “Continue Calibration”
Copy tone requirements
● Short, confident, non-therapist.
● Explicitly sets expectation:
○ “We’ll ask a few questions so your action plan fits you.”
○ “This takes ~10-15 minutes.”
○ “You can skip details—we’ll use industry defaults.”

---

## Page 57

4) Behavior Rules for the AI (Calibration Coach-Mode
Boundaries)
Purpose of this section
This section defines exactly how the AI is allowed to behave during Calibration Mode and,
just as importantly, what it must not do.
Calibration Mode uses a restricted subset of the Coaching Behavior Engine.
The AI is acting as a coach, but with intentional limits to prevent over-coaching, analysis
paralysis, or premature prescription.
The AI’s job in this phase is context acquisition and artifact creation, not performance
optimization.
Governing rule
During Calibration Mode, the AI may clarify, reflect, and draft — but it may not prescribe
execution.
If a behavior would reasonably feel like “doing the work” or “being told what to do today,” it is out
of bounds.
Allowed behaviors (explicitly permitted)
During Calibration Mode, the AI may:
● Ask high-signal questions only
● Questions must directly improve:
● accuracy of the G&A document, or
● safety of future daily actions
● Each question must pass the internal check:
“Will this materially change the action plan?”
● Use defaults aggressively to reduce user effort
● Industry standards, typical conversion rates, common agent behaviors (explained further
later on)
● Defaults should be stated explicitly, not hidden:
● “I’ll assume X unless you want to change it.”
● Summarize, reflect, and confirm understanding

---

## Page 58

● Short reflections:
● “Here’s what I heard…”
● “This is what I’m drafting based on that…”
● Reflection is for accuracy, not emotional processing.
● Draft the two calibration artifacts
● Goals & Actions (G&A)
● Business Plan (Economic Model (for the 4 primary KPI’s) + Business Plan)
● Drafts are always editable and user-owned.
● Offer “skip / use defaults” frequently
● Especially after any question that requires thinking or recall.
● Skipping must never block progress.
● Maintain momentum toward confirmation
● The AI should actively guide the user toward:
● “Does this look right?”
● “Confirm or edit?”
● Calibration should feel finite and directional.
Disallowed behaviors (hard boundaries)
During Calibration Mode, the AI must not:
● Generate a full daily action list
● No “Today’s Plan”
● No task sequences that resemble execution
● Issue prescriptive productivity commands
● Examples:
● “Call 10 people”
● “Door knock for an hour”
● “Post on Instagram today”
● Even if framed as “suggestions,” these are out of scope.
● Engage in deep drilling or therapy-style questioning
● No emotional excavation
● No identity unpacking
● No “why do you think you avoid this?” loops
● Ask long multi-question prompts
● One primary question at a time
● Optional clarifier only if strictly necessary
● Override user agency
● The AI drafts and recommends
● The user confirms or edits
● No forced answers, no moralizing language

---

## Page 59

Relationship to the Coaching Behavior Engine
Calibration Mode operates under the same philosophical principles as the Coaching Behavior
Engine, but with reduced scope and reduced intensity.
Key distinction:
● Calibration Mode = context creation
● Post-Calibration = coaching + execution alignment
Full coaching behaviors (pattern detection, identity work, strategic tension, drift conversations)
are disabled or deferred until after G&A confirmation.
This prevents:
● Coaching overload
● Premature diagnosis
● Prescription without sufficient context
Enforcement rule (important for engineering)
If the system is in CALIBRATING state:
● Coaching behaviors must be constrained to the rules above
● Any attempt to generate daily actions must be blocked
● Language implying execution must be suppressed or re-phrased
Once the user state transitions to G&A_CONFIRMED, these restrictions lift automatically.
Design principle (anchor)
Calibration is low-friction, high-leverage.
The AI earns precision later by practicing restraint now.
5) Calibration Mode interaction pattern (single best flow)
This is the flow the AI should follow, consistently:
1. Set context
○ “Before I tell you what to do today, I need 10-15 minutes to calibrate.”

---

## Page 60

2. Ask one high-signal question
3. Offer defaults
○ “If you’re not sure, I’ll use typical industry defaults.”
4. Confirm understanding
○ “Here’s what I heard…”
5. Draft the artifact
6. Get confirmation
○ “Confirm / Edit”
Dev note: This pattern should be reusable as a component, not free-form every time.
6) Data capture minimums (what must be captured in this step)
Even before the Business Plan, Calibration must capture enough to safely draft G&A.
Minimum viable calibration fields
● Primary professional goal (Annual Focus)
● Primary personal constraint or goal (optional but asked)
● Current reality snapshot:
○ pipeline rough state (even vague)
○ time availability (rough)
● Behavioral preference:
○ outreach style preference (calls/text/social/in-person)
○ structure preference (strict plan vs flexible)
● The “do not do this to me” preferences:
○ “I hate cold calling” / “I won’t door knock” etc.
Everything else can be deferred.
7) “No Daily Action Engine runs yet” (what can run)
Important nuance for engineering:
In Calibration Mode, the system may generate:
● “Next calibration prompt”
● Draft documents
● A “preview” of what the Daily Action Engine will feel like (optional)
But it must not generate:

---

## Page 61

● A time-blocked plan
● A numbered task list labeled “Today”
● Any instruction that implies the engine is active
UI language rule
Avoid “Today’s Plan” until G&A confirmed.
Use “Calibration Step” / “Draft” / “Setup.”
8) Handling Impatient Users (Fast-Lane Protocol with
Strong Recommendation)
Purpose
This protocol exists to respect real human impatience without compromising system
integrity.
The system’s default position is clear:
Calibration produces better actions. Skipping it increases error and rework.
However, the system must never trap the user in a process they refuse to complete.
Detection triggers
The Fast Lane protocol may be invoked when the user expresses urgency, resistance, or
impatience, including statements such as:
● “Just tell me what to do”
● “I don’t have time for this”
● “Skip this”
● “I hate onboarding”
Required system posture (important)
When Fast Lane is triggered, the AI must:
1. Advise against skipping calibration
● Brief, non-judgmental, non-preachy
● Example:

---

## Page 62

“I can do this the fast way, but it’s less precise. The better the calibration, the better the daily
plan.”
2. Clearly offer the Fast Lane as an option
● Without pressure
● Without shame
● Without blocking progress
3. Explicitly state that calibration can be revisited later
● Example:
“We can always come back and refine this when you’re ready.”
This preserves agency while protecting long-term quality.
Fast Lane execution rules (shortened calibration)
If the user chooses the Fast Lane, the AI proceeds with a minimal, two-question calibration:
1. Primary business objective
● “What’s your #1 business goal right now? (Annual focus is ideal, but a rough answer is
fine.)”
2. Willingness filter
● “What lead gen are you actually willing to do consistently?”
No additional probing is allowed in Fast Lane.
System behavior after Fast Lane selection
Once the two questions are answered:
● The AI drafts the G&A document immediately using:
● User inputs
● Industry defaults
● Conservative assumptions
● The AI presents a one-tap confirmation
● “Does this look directionally right?”
● Options:
● Confirm
● Edit
● Return to Calibration
● Upon confirmation:
● User state advances to G&A_CONFIRMED

---

## Page 63

● Daily Action Engine activates
Ongoing reminder (non-intrusive)
After entering Actions via Fast Lane, the system may occasionally surface a lightweight
reminder:
“If things ever feel off, we can tighten this by revisiting calibration.”
This should feel like an invitation, not a warning.
Dev requirements
● Fast Lane must be:
● Detectable via user language
● Explicitly user-chosen (not automatic)
● Reversible at any time
● Returning to Calibration:
● Must not reset progress
● Must update existing artifacts, not replace them
● Must temporarily pause action refinement (but not erase actions)
Design principle (anchor)
Speed is allowed. Sloppiness is not.
The system prefers calibration — but it always respects the user’s pace.
9) Error States & Edge Cases (Expanded, Dev-Safe)
Purpose
This section defines how the system behaves when user input is missing, inconsistent,
abandoned, or unstable during Calibration Mode.
These scenarios are not failures.
They are expected behaviors of real users and must be handled gracefully, predictably, and
without progress loss.

---

## Page 64

Classification rule (important)
Calibration issues fall into edge cases, not system errors.
Hard rule:
No edge case during calibration should block progress, crash state, or force a reset.
Edge Case 1: User provides nonsense, unclear, or empty answers
Examples
● Empty response
● “IDK”
● “Whatever”
● Emojis
● Non-answers (“just make money”)
System behavior
● Treat input as low-confidence, not invalid
● Do not challenge or interrogate
Required response
1. Apply conservative defaults immediately
2. Issue one and only one clarification pass:
● Example:
“I’ll assume X for now unless you want to change it.”
Hard boundaries
● No repeated follow-ups
● No “please answer this” loops
● No blocking progression
Engineering note
● Flag the field internally as assumed = true
● Allow later overwrite without penalty

---

## Page 65

Edge Case 2: Conflicting answers or internal inconsistency
Examples
● “I want fewer hours” + “I want to double production immediately”
● “I hate cold calling” + “I’ll do anything that works”
System behavior
● Do not resolve conflict during calibration
● Preserve both inputs
Required response
● Reflect neutrally:
“I’m noting some tension here. We’ll start conservatively and adjust as behavior shows us
what’s real.”
Hard rule
● Conflict is logged, not litigated
Edge Case 3: User changes their mind mid-calibration
Examples
● Reverses goal
● Switches lead gen preference
● Changes time horizon
System behavior
● Maintain a single authoritative current draft
● Update drafts live as inputs change
Hard boundaries
● Never restart the calibration flow
● Never discard previous inputs unless explicitly reset
● No “Are you sure?” friction
Engineering requirement
● Draft artifacts must be mutable objects, not static snapshots

---

## Page 66

Edge Case 4: User abandons calibration (drop-off)
Definition
● User exits app, closes tab, or goes inactive before G&A confirmation
System behavior
● Persist user state as CALIBRATING
● Preserve all drafts and partial inputs
Next login behavior
● Resume with a clear, low-friction prompt:
“Want to pick up where we left off, take the fast lane, or reset calibration?”
Hard boundaries
● No loss of work
● No forced restart
● No guilt language (“You didn’t finish…”)
Edge Case 5: User attempts to force actions before calibration
Examples
● “Just give me today’s tasks”
● “Skip everything”
System behavior
● Reiterate the gating rule briefly
● Offer Fast Lane explicitly
Required response
“I can move fast, but I still need two things so I don’t give you bad advice.”
Then route to Fast Lane protocol.

---

## Page 67

Edge Case 6: User requests a full reset
System behavior
● Require explicit confirmation
● Example:
“This will erase your drafts and restart calibration. Want to proceed?”
Hard boundary
● No silent resets
● No automatic resets due to confusion or conflict
Things the system must never do (absolute rules)
● Lose user input
● Block progress due to ambiguity
● Enter an infinite clarification loop
● Reset calibration without explicit consent
● Treat human behavior as an error condition
Design principle (anchor)
Calibration is resilient, not brittle.
The system bends to human behavior — it does not punish it.
10) Acceptance Criteria (Dev-Testable, No Ambiguity)
Purpose
This section defines verifiable behaviors the system must satisfy to be considered compliant
with the User Calibration Module.
If all acceptance criteria pass, the system:
● Respects calibration gating
● Preserves user agency
● Prevents premature prescription

---

## Page 68

● Handles real human behavior safely
AC-1: Calibration gating (hard stop)
Given
● A user whose state is CALIBRATING
When
● The user opens the app
● The user refreshes the page
● The user navigates to any dashboard or “home” view
Then
● The UI must NOT display:
● “Today’s Actions”
● A task list that resembles execution
● The Daily Action Engine must NOT run
● The system may display:
● Calibration progress
● Draft artifacts
● Next calibration prompt
Fail condition
● Any execution-style task appears before G&A confirmation
AC-2: G&A confirmation → state transition
Given
● A user in CALIBRATING state
● A draft G&A document exists
When
● The user explicitly confirms the G&A document (tap, click, or equivalent)
Then
● User state transitions to G&A_CONFIRMED

---

## Page 69

● Confirmation is persisted
● Calibration gating is lifted
And
● On the next eligible interaction:
● The Daily Action Engine may generate “Today’s Actions”
Fail condition
● Actions appear without explicit G&A confirmation
AC-3: Fast Lane detection and routing
Given
● A user in CALIBRATING state
When
● The user expresses impatience or resistance (e.g. “skip,” “just tell me what to do,” “I
don’t have time”)
Then
● The system:
● Advises briefly against skipping calibration
● Explicitly offers Fast Lane as an option
● Does not auto-route without user consent
If user chooses Fast Lane
● The system:
● Switches to the two-question calibration flow
● Uses defaults for all other fields
● Drafts G&A immediately
● Presents one-tap confirmation
Fail condition
● Fast Lane activates without user choice
● More than two questions are asked

---

## Page 70

AC-4: Copy and language compliance
Given
● A user in CALIBRATING state
Then
● UI copy must NOT include:
● “Today”
● “Daily plan”
● “Your tasks”
● Time-blocked or execution language
Allowed language
● “Calibration”
● “Draft”
● “Setup”
● “Confirm”
● “Next step”
Fail condition
● Any “Today” or execution-implying language appears before G&A_CONFIRMED
AC-5: Persistence and resume behavior
Given
● A user exits the app mid-calibration
When
● They return at a later time
Then
● User state remains CALIBRATING
● All drafts and partial inputs persist
● The system resumes with a clear choice:
● Continue calibration
● Take Fast Lane
● Reset (if explicitly requested)

---

## Page 71

Fail condition
● Lost progress
● Forced restart
● Silent reset
AC-6: Default usage and assumed values
Given
● A user provides empty, unclear, or non-answers
Then
● The system:
● Applies conservative defaults
● Issues at most one clarification statement
● Flags internally that defaults were assumed
Fail condition
● Repeated clarification loops
● Blocking progression due to ambiguity
AC-7: Mid-calibration changes
Given
● A user changes an answer mid-calibration
Then
● The system:
● Updates the current draft live
● Preserves all other inputs
● Does not restart the flow
Fail condition
● Draft resets
● Loss of previously entered data

---

## Page 72

AC-8: Return to calibration after Fast Lane
Given
● A user entered Actions via Fast Lane
When
● The user chooses to revisit calibration later
Then
● The system:
● Allows re-entry into calibration
● Updates existing artifacts (does not replace them)
● Does not erase execution history
● Does not require a full reset
Fail condition
● Forced reset
● Loss of historical actions
● Blocked access to calibration
AC-9: Reset protection
Given
● A user requests a full calibration reset
Then
● The system:
● Requires explicit confirmation
● Clearly states consequences
● Only resets upon confirmation
Fail condition
● Any automatic or silent reset
AC-10: Negative acceptance (things that must never pass)

---

## Page 73

The system must never:
● Generate execution tasks before G&A confirmation
● Trap users in calibration loops
● Treat human ambiguity as an error
● Penalize users for impatience
● Require calibration perfection to proceed
Acceptance summary (dev shorthand)
If a tester can:
● Skip calibration safely
● Resume calibration later
● Never see “Today” too early
● Never lose data
● Always understand what state they’re in
…then the User Calibration Module is functioning as designed.
Step 1A: Calibration Question Engine — G&A Creation
(5–10 Minute Version)
Purpose
This section defines the exact questions RealCoach.ai asks during Calibration Mode to
create the G&A tab.
These questions are a deliberately compressed derivative of deeper coaching frameworks.
They are not meant to produce life clarity. They are meant to produce safe, directionally
correct daily actions.
The system optimizes for speed, clarity, and execution integrity — not depth.
Tone Selection (Always First)
Before asking any calibration questions, the system asks:
“Before we start — how would you like me to sound while we do this?”

---

## Page 74

Options may include (examples, not exhaustive):
● Direct / Executive
● Coach‑like but concise
● Neutral / Minimal
Tone selection affects phrasing and reflection brevity only. It does not affect question order or
logic.
The 7 Core Calibration Questions (Asked One at a Time)
Each question is:
● High‑signal
● One‑sentence
● Directly mapped to a G&A field
● Answered quickly without reflection loops
After each answer, the system responds with a single‑sentence confirmation (no bullets, no
coaching).
Question 1 — Primary Professional Goal (Annual)
“If this year goes right professionally, what must be true by the end of it?”
Creates: Annual Professional Goal
Question 2 — Primary Personal Constraint or Goal (Annual)
“What personal priority or constraint does your business need to respect this year?”
Creates: Annual Personal Goal / Constraint
Question 3 — Current Reality Snapshot
“Right now, what feels most fragile or most important in your business?”
Creates: Contextual weighting for actions (pressure points, instability, urgency)

---

## Page 75

Question 4 — 30‑Day Focus
“Over the next 30 days, what outcome would make everything else feel easier?”
Creates: Monthly Milestone
Question 5 — Execution Style Preference
“When it comes to making progress, what style actually works for you?”
Examples surfaced only if needed:
● Structured and planned
● Flexible and opportunistic
● Short bursts of focus
● Slow and consistent
Creates: Execution posture constraint
Question 6 — Willingness Filter (Non‑Negotiable)
“What are you actually willing to do consistently — even when motivation is low?”
Creates: Action eligibility filter (what the system may and may not suggest)
Question 7 — Friction Boundary
“What should I avoid suggesting because it will create resistance or burnout?”
Creates: Explicit exclusion rules for daily actions
Completion Rule
Once all 7 questions are answered:
● The system drafts the G&A tab immediately
● Uses conservative assumptions where answers are vague
● Presents the draft for Confirm / Edit

---

## Page 76

Upon confirmation:
● User state transitions to G&A_CONFIRMED
● Daily Action Engine becomes eligible to run
Design Principle (Anchor)
These questions exist to prevent bad advice — not to complete the user.
Calibration favors momentum with integrity over depth with delay.
Step 2: Two Core Tabs Get Created (This Is the Whole
Point)
Why this step exists
Calibration exists for one reason only: to create two authoritative, living tabs that power the
daily action engine.
These are not background documents.
They are not optional configuration screens.
They are the primary interface between the user and the intelligence of the system.
If these two tabs are correct, everything downstream works.
If they are wrong, nothing else matters.
Structural rule (non-negotiable)
RealCoach.ai has two primary tabs:
1. G&A (Goals & Actions) → the Daily Action Engine lives here
2. Business Plan → the Economic Model + GPS logic lives here
Everything else in the product supports, references, or updates these two tabs.
There is no third “main” object in the MVP.

---

## Page 77

1⃣ G&A Tab (Goals & Actions — Daily Action Engine)
Think of this as:
“What actually matters right now — and what am I doing about it today?”
This tab is:
● The user’s north star
● The gatekeeper for daily actions
● The emotional and strategic anchor of the product
What the G&A tab contains (minimum viable)
The G&A Tab Must Clearly Display
The G&A tab is the strategic execution surface of the product.
It defines where the user is going and what progress looks like right now.
It does not independently decide actions.
It provides the directional constraints that daily actions must satisfy.
1) Primary Professional Goal (Annual)
This is the user’s annual business outcome.
● Directional, not perfect
● Single dominant objective (no competing goals)
Examples:
● “Close 18 units this year”
● “Increase net profit by 25%”
● “Build a predictable listings pipeline”
This goal functions as:
● The top-level constraint for all planning
● The final destination the system must advance toward

---

## Page 78

2) Primary Personal Goal or Constraint (Annual)
This is the user’s annual personal reality that the business must respect.
Examples:
● Health or fitness recovery
● Family time constraints
● Burnout prevention
● Capacity limitations
This input is non-negotiable and non-decorative.
It actively influences:
● Action volume
● Action intensity
● Pace expectations
● Tone of system feedback
The system optimizes within the user’s life — not against it.
3) Monthly Milestone (30-Day Focus)
This is the current execution milestone that advances the annual goal.
● One primary monthly outcome
● Clearly measurable
● Directionally inevitable if completed
Examples:
● “Secure 2 new listings”
● “Book 6 listing appointments”
● “Rebuild daily follow-up habit”
This milestone answers:
“If this month goes right, what becomes easier or inevitable next?”
4) Daily Actions (Once Unlocked)

---

## Page 79

Daily Actions appear in the G&A tab after G&A confirmation, but they are not generated
solely from this tab.
Daily Actions are generated by synthesizing three inputs:
1. Progress from the previous day
● What was completed
● What was skipped
● What patterns are emerging
2. Strategic rules from the Business Plan tab
● Lead generation priorities
● Economic leverage points
● Chosen strategies and constraints
3. The requirement to advance the current monthly milestone
● Every action must move the user closer to the 30-day outcome
● Actions that do not advance the milestone are deprioritized or excluded
Governing Rule for Daily Actions
Every daily action must advance the monthly milestone, which advances the annual goal
— while respecting the user’s personal constraints and business strategy.
If an action does not satisfy all three, it should not be recommended.
Important Clarification for Developers
● The G&A tab displays:
● Annual goals
● Monthly milestone
● Daily actions
● The Daily Action Engine computes actions using:
● G&A constraints
● Business Plan strategy
● Behavioral feedback from execution history
The G&A tab is where actions are shown and contextualized, not the sole source of logic.
Quality bar for G&A
The G&A document:

---

## Page 80

● Does not need to be perfect
● Does not need full data
● Does not need alignment with long-term dreams
It does need to be:
● Directionally true
● Confirmed by the user
● Stable enough to safely prescribe actions
Once confirmed:
● The system is allowed to generate daily actions
● The Daily Action Engine is unlocked
2⃣ Business Plan Tab (Economic Model + GPS)
Think of this as:
“How the business actually works in real numbers.”
This tab exists to sharpen, not slow down, execution.
What the Business Plan tab contains
At minimum, this tab includes:
● Revenue goal
● Average revenue per deal
● Default conversion rates
● Industry standards provided by default
● Fully editable by the user
● Core business priorities
● Lead generation
● Client experience
● Leverage / systems
This tab answers:
● “What inputs actually move the needle?”
● “Where does effort compound vs. leak?”

---

## Page 81

Critical design rule
The Business Plan tab:
● Adds precision
● Sharpens daily actions
● Is never required before actions begin
The system should:
● Encourage completion
● Reference it often
● Default to it when conflicts arise
But:
● It must never block momentum
● It must never gate Daily Actions
Step 1B: Calibration Question Engine — Business Plan
Creation (5–10 Minute Version)
Purpose
This section defines the minimal Business Plan calibration required to prevent bad advice.
This is a revenue‑first, solo‑agent economic model. It is intentionally not a full P&L, expense
breakdown, or team financial model.
Its sole job is to give the Daily Action Engine economic guardrails so that recommended
actions make sense for:
● The user’s stated revenue goal (inherited from G&A)
● Their preferred way of generating business
● A sustainable solo‑agent operating reality
Precision improves later through behavior, not onboarding.
Scope Boundary (Non‑Negotiable)

---

## Page 82

This calibration:
● Inherits the Annual Revenue Goal from the G&A tab
● Assumes industry‑standard conversion rates by default
● Avoids expense, salary, and tax math entirely
● Optimizes for one agent’s personal production, even if the user is part of a team
If the user is a team rainmaker or team member, they are instructed to answer as if they were
operating only their own book of business.
The 8 Core Business Plan Calibration Questions
Questions are asked one at a time.
No per‑question reflection is required. A single final summary is presented at the end for
Confirm / Edit.
Question 1 — Revenue Goal Confirmation
“I’m using your annual revenue goal from earlier. Is that still correct, or do you want
to adjust it?”
Creates: Confirmed Revenue Target (source of truth)
Question 2 — Average Revenue Per Transaction
“Roughly how much do you earn per transaction, on average?”
Creates: Revenue per Unit (used to estimate unit volume)
Question 3 — Primary Business Type
“Is most of your business sellers, buyers, or a mix?”
If unsure, default internally to 60% sellers / 40% buyers.
Creates: Buyer/Seller weighting constraint

---

## Page 83

Question 4 — Lead Source Identification (Names Only)
“What lead sources currently produce most of your business?”
Examples may be surfaced only if needed:
● SOI / Past Clients
● Open Houses
● Social / Content
● Paid Leads
● Prospecting
Creates: Eligible lead source universe (no volume or commitment)
Question 5 — Preferred Lead Generation Style
“When it comes to lead generation, what style actually fits you?”
Examples if clarification is needed:
● Relationship‑based
● Prospecting‑driven
● Marketing‑driven
● Hybrid
Creates: Lead gen modality constraint
Question 6 — Detail Preference (Economics)
“Do you prefer working with rough assumptions, or detailed numbers?”
This affects:
● How much economic detail the system surfaces later
● Not whether actions can be generated now
Creates: Modeling depth preference
Question 7 — Risk Tolerance (Execution Pace)
“Which feels more important right now: aggressive growth or steady, predictable
progress?”

---

## Page 84

Creates: Pace and pressure constraint for actions
Question 8 — Economic Red Lines
“Is there anything financially that would make an action a hard no for you?”
Examples if needed:
● Spending money
● Working nights/weekends
● High rejection activities
Creates: Economic exclusion rules
Completion Rule
Once all questions are answered:
● The system drafts the Business Plan tab immediately
● Uses conservative, industry‑standard assumptions
● Presents a single summary for Confirm / Edit
Upon confirmation:
● Business Plan tab becomes authoritative
● Economic guardrails are applied to the Daily Action Engine
Design Principle (Anchor)
The Business Plan exists to stop bad advice — not to perfect the math.
Revenue clarity first. Precision later.
Step 3: The AI Drafts — The User Confirms
Core principle

---

## Page 85

The AI does not interrogate the user.
The AI does the work first, then asks for confirmation.
Drafting rules
The AI drafts both tabs using:
● Defaults
● Industry standards
● Patterns inferred from user answers
● Conservative assumptions when uncertain
The user then:
● Edits
● Confirms
● Or skips details
This keeps calibration:
● Fast
● Non-overwhelming
● Ownership-based
The user should feel like they are approving their plan, not filling out a form.
Step 4: Behavior Matters More Than Theory
Critical design rule
The system never assumes all users should run the same playbook.
Instead, it observes and adapts to:
● How the user lives
● What gives them energy
● What they avoid
● What they consistently follow through on

---

## Page 86

Behavioral interpretation examples
● Social, community-oriented user
● Events
● Group experiences
● Relationship-based actions
● Private or transactional user
● Structured follow-up
● Low-emotion, repeatable lead gen
● Systems over charisma
● Health-constrained or burnout-recovering user
● Fewer actions
● Higher leverage
● Energy-aware pacing
This prevents:
● “20 contacts a day” dogma
● Burnout
● Unrealistic task assignment
Step 5: Personal Goals Influence Business Actions
Non-negotiable principle
The system treats the user as one human, not a business robot.
If a user has:
● A major health goal
● Burnout recovery
● Family stress
● Capacity constraints
Then:
● Daily business actions adjust
● Tone adjusts
● Expectations adjust
This influence flows into the G&A tab, not around it.

---

## Page 87

Step 6: Once G&A Is Confirmed, Daily Actions Begin
This is the key gate
● ❌ No G&A confirmed → No Daily Actions
● ✅ G&A confirmed → Daily Action Engine turns on
INSERT IMAGE HERE
(Mockup: G&A tab with “Today’s Actions” now visible post-confirmation)
Default first action
Often:
“Complete your Business Plan”
This ensures:
● Momentum
● Forward motion
● Increasing precision without stalling execution
Step 7: The System Protects Long-Term Strategy
Strategic integrity rule
If a user starts drifting — for example:
● Abandoning a proven Instagram strategy
● Switching to panic tactics like FSBOs
The system does not silently adapt.
Instead, it:
● Detects the pattern
● Surfaces the tradeoff
● Responds like a coach
Example:

---

## Page 88

“We can do this your way — but I want to be honest about what this costs based on your stated
goals.”
The user always has agency.
The system always preserves strategic truth.
Step 8: Calibration Is Done — But Learning Never Stops
Post-calibration behavior
Once calibration is complete:
● The system is locked
● Artifacts are authoritative
● Daily execution begins
From that point on:
● Behavior updates assumptions
● Documents evolve
● The system gets smarter
But:
The foundation never resets without explicit user intent.
One-sentence summary for devs
“Calibration is how RealCoach.ai creates two living tabs — one defining what matters,
the other defining how the business works — so the system can generate daily actions
that fit the user’s goals, energy, and behavior, not generic best practices.”

---

## Page 89

1-FAQ's

---

## Page 90

User Calibration Module — Expanded
FAQs (Dev Reference)
High-Level Purpose & Philosophy
Q: Why does RealCoach.ai require calibration at all?
Because prescribing daily actions without context is malpractice.
Calibration ensures the system understands:
● what the user is building
● what constraints matter
● what actions are realistic
Without calibration, the system would default to generic productivity advice, which directly
violates the product’s core promise.
Q: Is calibration the same thing as onboarding?
No — and this distinction matters.
● Onboarding = account setup, feature explanation
● Calibration = creating truth the system can act on
Calibration is about earning the right to give advice, not collecting information.
Q: How long should calibration take?

---

## Page 91

● Standard path: ~10–15 minutes
● Fast Lane: ~2 minutes
● Anything longer is a product failure
Speed is a feature. Depth is earned later through behavior.
System States & Gating
Q: Why is G&A confirmation a hard gate for daily actions?
Because G&A is the authority layer for execution.
Until the user explicitly confirms:
● what they’re trying to achieve
● what constraints matter
…the system is not allowed to tell them what to do today.
This prevents:
● bad advice
● misaligned actions
● early user distrust
Q: Why not allow “preview” actions before confirmation?
Because even previews create psychological commitment.
During calibration, the system may:
● preview what actions will feel like

---

## Page 92

● explain how actions are generated
But it must not:
● show task lists
● show “Today’s Actions”
● imply execution has begun
Q: What happens if the user never finishes calibration?
Nothing breaks.
● State remains CALIBRATING
● Drafts persist
● User can resume, fast-lane, or reset
The system never punishes incompletion.
Calibration Questions
Q: Why only 7 G&A questions and 8 Business Plan questions?
Because every question must justify itself.
Each question must materially change:
● action safety
● action relevance
● pacing or constraints
If it doesn’t, it doesn’t belong in calibration.

---

## Page 93

Q: Why not ask about leverage, systems, or team strategy upfront?
Because those decisions are:
● premature for many users
● often aspirational, not real
● better inferred through behavior
Calibration sets defaults, not long-term strategy.
Q: What if the system assumes something incorrectly (e.g., leverage)?
That is expected behavior.
The system must:
● surface assumptions visibly (via UX)
● allow in-context correction
● adapt future actions
Incorrect assumptions are corrected through interaction, not re-onboarding.
Q: Why are expenses excluded from the Business Plan?
Because this is:
● a solo-agent system
● revenue-first
● execution-oriented
Expenses, tax strategy, and complex P&Ls:

---

## Page 94

● slow onboarding
● don’t materially improve Day-1 actions
● are better handled later or externally
Fast Lane Protocol
Q: Why allow Fast Lane at all?
Because real humans resist onboarding.
Fast Lane exists to:
● respect urgency
● preserve agency
● avoid abandonment
But it is explicitly less precise, and the system must say so.
Q: Why only two questions in Fast Lane?
Because anything more defeats the purpose.
Fast Lane answers only:
1. What the user wants
2. What they’re willing to do
Everything else defaults conservatively.
Q: Can users return to calibration after Fast Lane?

---

## Page 95

Yes — at any time.
Returning to calibration:
● updates existing artifacts
● does not erase execution history
● does not restart from zero
Fast Lane is reversible by design.
AI Behavior & Coaching Boundaries
Q: Why restrict coaching behaviors during calibration?
Because coaching too early creates:
● analysis paralysis
● emotional fatigue
● delayed execution
Calibration is context acquisition, not transformation.
Q: Why forbid therapy-style or “why” questions?
Because RealCoach.ai is not a therapist.
Deep emotional excavation:
● slows momentum
● increases drop-off
● does not improve action quality at onboarding

---

## Page 96

Behavior later provides better signal.
Q: When does the full Coaching Behavior Engine turn on?
After:
● G&A is confirmed
● Daily Action Engine is active
Only then does the system:
● surface tension
● challenge drift
● coach strategically
UX & Assumptions
Q: Where do users see what the system believes about them?
In the UX, not in calibration.
Calibration creates truth.
UX exposes and allows correction of that truth.
This separation is intentional.
Q: Why not force users to “get it right” upfront?
Because humans don’t know themselves that cleanly.
The system assumes:
● people learn through doing

---

## Page 97

● preferences reveal themselves through behavior
Requiring perfection upfront would destroy momentum.
Data Integrity & Safety
Q: What happens if user answers conflict?
The system:
● logs the conflict
● does not resolve it during calibration
● starts conservatively
Conflict is not an error — it’s signal.
Q: What if a user gives nonsense answers?
The system:
● applies conservative defaults
● issues one clarification statement
● moves on
Progress is never blocked by ambiguity.
Q: Can calibration ever auto-reset?
No. Never.
Resets:

---

## Page 98

● must be explicitly requested
● must warn the user
● must require confirmation
Silent resets are forbidden.
Developer Guardrails
Q: What is the biggest mistake devs can make here?
Blurring responsibilities between modules.
Common failure modes:
● letting UX logic creep into calibration
● letting calibration logic creep into Daily Actions
● over-engineering personalization upfront
Each module has a single job. Respect that.
Q: If something feels unclear, what should we default to?
Default to:
● restraint
● speed
● conservative assumptions
Precision is earned later.

---

## Page 99

Final Anchor
Q: What is the one sentence devs should keep in mind?
Calibration exists to protect users from bad advice — not to fully understand
them.
If that remains true, the system will work.

---

## Page 100

1-Engineering Spec

---

## Page 101

Do these actually help you guys?

---

