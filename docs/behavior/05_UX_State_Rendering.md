# UX State & Rendering Logic

**Description:** UI states, rendering rules, manual input rules, missed-day rendering, global UX invariants

**Pages:** 155-173

---

## Page 155

UX State & Rendering Logic

---

## Page 156

UX State & Rendering Logic — Read This
First
Why This Document Exists
RealCoach.ai is not a typical productivity product, CRM, or analytics tool.
Most software teaches users what to do by showing them more:
● more data
● more metrics
● more prompts
● more urgency
RealCoach.ai does the opposite.
Its job is to absorb complexity so the user doesn’t have to manage it.
This document exists to prevent a very common failure mode:
well-intentioned UI decisions that quietly reintroduce pressure, obligation, or
behavioral judgment.
If you are building RealCoach.ai, assume the following at all times:
● Less UI is almost always better than more UI
● Silence is often the correct rendering choice
● If something feels “helpful,” pause and ask why
This is not a style preference.
It is a trust contract.
The Core Job of the UI
The UI has one job only:
Make the next right thing obvious — without asking for attention.
The UI must never:

---

## Page 157

● motivate
● coach
● judge
● interpret behavior
● imply urgency
Those responsibilities belong exclusively to the coaching engine.
If the UI begins explaining, encouraging, nudging, or warning, the system has already failed.
Authority Model (Read Carefully)
● The coaching engine decides meaning
● The UI reflects state
The UI is not smart.
It is calm, honest, and restrained.
Manual UI actions are allowed, but they are inputs, not decisions.
Every meaningful interpretation flows through the coaching engine.
The Most Important Rule
When clarity for a first-time user conflicts with preserving long-term trust through
restraint, restraint wins every time.
If a feature would make the product easier to understand today but harder to trust over time — it
must not ship.
What Usually Goes Wrong (And Must Not Here)
Most systems fail by:
● adding “just one more” indicator
● visualizing behavior too early
● rewarding consistency
● penalizing silence
● turning neutral data into implied obligation

---

## Page 158

RealCoach.ai must resist all of these instincts.
If you are unsure whether something belongs in the UI, the default answer is no.

---

## Page 159

4-Plain English

---

## Page 160

UX State & Rendering Logic — V1
Purpose
This document defines how RealCoach.ai renders its interface based on system state,
and—just as importantly—what the UI must never do under any circumstances.
It exists to translate RealCoach.ai’s product philosophy into explicit, enforceable rendering
rules so that engineers, designers, and AI behavior authors can build consistently against a
shared contract.
It exists to ensure that engineering, design, and AI behavior remain aligned as the product
evolves, scales, and changes hands between teams.
This document is intentionally opinionated. Ambiguity here creates drift later.
This is not a visual design specification.
This is not a component library.
This is a behavioral and rendering contract that governs how the system shows up to the
user.
Core Principle (Non‑Negotiable)
When clarity for a first‑time user conflicts with preserving long‑term trust through
restraint, restraint wins every time.
In practical terms: the system prefers being temporarily unclear over being prematurely
directive.
RealCoach.ai is designed to absorb ambiguity rather than surface it.
The UI must never teach the system by:
● pressure
● implication
● exposure
● urgency
● behavioral surveillance

---

## Page 161

The UI teaches only by timing and conversation, mediated by the coaching engine.
If a concept requires the interface to become louder, more instructive, or more directive in order
to be understood, the interface must remain quiet and defer explanation to the coaching engine
instead.
System Architecture (Rendering Authority)
Single Source of Authority
● The Coaching Engine is authoritative.
● The UI is a rendering surface, not a decision engine.
The UI exists to reflect truth, not to decide it.
The UI may:
● display system state
● accept user input
● acknowledge completion or updates
The UI may never:
● interpret behavior
● infer motivation or intent
● imply next actions
● enforce cadence, consistency, or compliance
● surface pressure or judgment
All interpretation, prioritization, and meaning flows through the coaching engine. The UI remains
deliberately passive.
Global UX Invariants (Always True)
These invariants exist to prevent the silent reintroduction of pressure, obligation, or judgment
through well‑intentioned UI decisions.
These rules apply in all states, on all screens, and to all future features, regardless of
complexity or apparent usefulness.
1. No urgency is ever rendered.

---

## Page 162

○ No timers
○ No countdowns
○ No “overdue” indicators
○ No streaks
○ No gaps or deficits
2. No behavior tracking is visualized.
○ No completion counts
○ No consistency indicators
○ No compliance summaries
○ No performance metrics tied directly to daily behavior
3. Silence is a valid UI state.
○ If there is nothing useful to show, nothing is shown.
○ Empty space is preferable to premature structure.
4. The UI never asks the user to decide what matters.
○ If the user must choose what to look at, where to click, or what deserves
attention, the UI has failed.
These invariants supersede feature ideas, UX polish, and convenience.
UX State Model (Renderable States)
These states exist to prevent ad‑hoc rendering logic and ensure that UI behavior remains
predictable, calm, and consistent as the system responds to changing context.
They are an internal system model. Users should never feel that they are "entering" or "leaving"
a mode.
The UI renders differently based on system state, not user curiosity, clicks, or exploration.
Canonical User States
1. UNINITIALIZED
2. CALIBRATING
3. G&A_DRAFTED
4. G&A_CONFIRMED
5. ACTIONS_ACTIVE
6. RECALIBRATION_REQUIRED (non‑blocking)
State transitions are quiet, continuous, and non‑declarative.
No state transition is ever announced, celebrated, or explained visually.

---

## Page 163

State‑by‑State Rendering Rules
1. UNINITIALIZED
Purpose: Orientation without pressure or implied obligation.
UI Rules:
● No task lists
● No dashboards
● No “Today” language
● No future previews
Allowed Elements:
● Calibration progress panel
● Minimal framing text
● Single primary CTA: Continue Calibration
The goal is to orient without implying that anything is missing or behind.
2. CALIBRATING
Purpose: Context acquisition and preference discovery.
UI Rules:
● Daily Actions must not render
● Goals & Actions tab shows Draft state only
● Execution‑oriented language is prohibited
Allowed Language:
● “Calibration”
● “Draft”
● “Confirm / Edit”
Disallowed Language:
● “Today”
● “Tasks”
● “Plan”
● “Execution”

---

## Page 164

The system is thinking here. The user should not feel watched or measured.
3. G&A_DRAFTED
Purpose: Review and reflection without obligation.
UI Rules:
● Draft G&A visible
● No actions rendered
● No checklist affordances
● No inline editing
Interaction Model:
● User edits occur only through conversation with the coaching engine
● UI fields are read‑only
This preserves coherence and prevents checklist behavior.
4. G&A_CONFIRMED
Purpose: Transition into execution readiness.
Rendering Behavior:
● Quiet, rolling transition
● Actions appear naturally without announcement
● No confirmation banners
● No celebratory language
This transition should feel like:
The interface comes alive.
Not like a mode change.
5. ACTIONS_ACTIVE
Purpose: Focused execution with minimal cognitive friction.

---

## Page 165

UI Rules:
● Maximum of 3 visible actions at any time
● No backlog lists
● No future previews
● No carryover indicators
Action Completion:
● Completion acknowledged visually only
● Feedback style adapts to coaching calibration (e.g., neutral vs expressive)
● No motivational or performance language
Permitted Action States:
● Active
● Done
● Delegated
● Deleted
No additional states may exist.
6. RECALIBRATION_REQUIRED
Purpose: Signal strategic drift without interrupting execution.
UI Rules:
● Actions continue normally
● No blocking modals
● No warning banners
● No visual alerts
All recalibration messaging occurs only through the coaching engine.
DIRECT Mode (Critical Clarification)
DIRECT mode is purely behavioral.
There is no visual indicator of DIRECT mode.
When the system is in DIRECT:

---

## Page 166

● No questions render in the UI
● No reframing or explanatory language appears
● The interface remains unchanged
DIRECT exists to remove ambiguity, not to announce authority.
Manual Input Rules (Preserving System Integrity)
Governing Rule
Manual UI input is allowed only as input—not as interpretation or decision.
All manual changes must:
● emit an event
● be observable by the coaching engine
● never silently alter system behavior or prioritization
Goals & Actions Tab
● ❌ No manual editing
● ❌ No checklist interaction
● ❌ No inline action modification
All changes occur through coaching conversation only.
Pipeline & Database
● ✅ Manual edits allowed (stage changes, notes, light data updates)
● ⚠ All manual edits must notify the coaching engine immediately
Manual changes:
● update truth
● do not imply readiness
● do not create urgency
● do not generate actions

---

## Page 167

Missed‑Day Rendering Rules
Missed days are never a UI state.
UI Behavior:
● No banners
● No warnings
● No indicators
Chatbot Only:
● Optional one‑line acknowledgment
● Immediately disappears
Silence is the default success case.
Fast Lane Rendering
Fast Lane is:
● equal in dignity
● lower in precision
UI Rules:
● Presented as a parallel path
● Explicit tradeoff is stated
● No shame, warning, or scarcity framing
Post‑Fast‑Lane:
● G&A remains editable
● Subtle reminder that full calibration unlocks higher precision
Absolute No‑Fly Zone
These elements represent the most common failure modes found in CRMs, productivity tools,
and behavior‑tracking systems. Their presence introduces pressure even when unintended.
The following must never render under any circumstances:

---

## Page 168

● time‑since‑last‑action indicators
● unfinished action counts
● streaks or consistency markers
● progress bars tied to behavior
● overdue labels
● urgency cues of any kind
Any appearance of these elements constitutes a system failure.
Final Rendering Test
Before shipping any UI change, engineers must ask:
Does this make the user feel more watched—or more supported?
If the answer is more watched, the change must not ship.
One‑Sentence Summary for Developers
The UI stays calm, quiet, and restrained—while the coaching engine absorbs
complexity, timing, and meaning.

---

## Page 169

4-FAQ's

---

## Page 170

UX State & Rendering Logic — FAQ
Is this a CRM?
No.
CRMs optimize for record completeness, activity tracking, and follow-up enforcement.
RealCoach.ai optimizes for:
● clarity
● execution quality
● trust over time
Contacts, Pipeline, and Dashboards exist to inform decisions — not to manage behavior.
Why does the UI feel so quiet compared to other tools?
Because noise creates pressure.
Most tools externalize complexity and ask the user to manage it.
RealCoach.ai internalizes complexity and asks the user to act.
Relief is the success signal — not stimulation.
Why are there so few actions shown?
Because volume creates avoidance.
The system intentionally limits visible actions to preserve focus and executability.
More actions would feel productive while reducing follow-through.
Why aren’t missed days shown anywhere?

---

## Page 171

Because missed days are information, not failure.
Rendering missed days:
● introduces guilt
● implies obligation
● encourages compensation behavior
The system resets every day by design.
Why can’t users edit actions directly?
Because checklists change behavior.
Allowing manual action editing would:
● turn Goals & Actions into a task manager
● fragment strategic coherence
● bypass coaching logic
Actions are negotiated through conversation so intent stays intact.
Why allow any manual input at all?
Because agency matters.
Manual edits are allowed where they reflect external reality (e.g., pipeline stage changes,
contact notes).
However:
● manual input never implies priority
● manual input never creates urgency
● manual input never generates actions
All interpretation flows through the coaching engine.
What happens if a user clicks around randomly?

---

## Page 172

Nothing breaks.
Clicking does not:
● change priorities
● trigger actions
● create obligations
The coaching engine may observe the behavior, but the UI does not react.
Why does the Production Dashboard exist if it never
drives action?
Because reflection is different from execution.
The Production Dashboard is:
● read-only
● cumulative
● calm
It exists to answer:
“How am I doing relative to my goals?”
It must never answer:
“What should I do next?”
What if a developer thinks a small indicator would be
helpful?
That instinct is expected — and usually wrong.
Before adding anything, ask:
Does this make the user feel more watched or more supported?
If the answer is “more watched,” it must not ship.

---

## Page 173

What if this feels too restrictive?
That is a sign the system is working.
RealCoach.ai is designed to protect users from the cognitive and emotional tax imposed by
most productivity software.
Restraint is not a limitation.
It is the product.
Final Reminder
RealCoach.ai succeeds only if users:
● trust it
● return to it
● act on what it gives them
Anything that undermines trust — even if it looks useful — is out of scope.

---

