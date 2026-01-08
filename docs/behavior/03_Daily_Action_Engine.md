# Daily Action Engine (411 → Daily)

**Description:** Daily action flow, primary/supporting actions, readiness gates, strategy integrity checks

**Pages:** 102-123

---

## Page 102

Daily Action Engine (411 → Daily)

---

## Page 103

Ready for review by Dev Team
READ FIRST — How to Use This Document
This document defines the decision logic, behavioral constraints, and system integrity
rules for the Daily Action Engine.
It is intentionally not:
● a UX or layout specification
● a visual or rendering guide
● an implementation spec tied to any framework
Instead, this document answers three questions for builders:
1. What is the Daily Action Engine allowed to decide?
2. When must it refuse to act or hand control to coaching?
3. What rules must never be violated, even under pressure or edge cases?
If you are:
● an engineer implementing logic → this is authoritative
● a PM debating scope → this document wins
● a designer deciding placement or layout → this document informs you, but does not
prescribe UI
Important boundary:
● What the system decides lives here
● Where things appear (Daily Actions, Milestones, G&A, Business Plan) belongs in the UX
State & Rendering document
When in doubt, protect the integrity of:
“Tell me what to do today — without asking me to manage software.”

---

## Page 104

2-Plain English V2

---

## Page 105

DAILY ACTION ENGINE — Plain English Logic (v2
Expanded for Development)
Purpose of the Daily Action Engine (Non‑Negotiable)
This section defines the engine’s job, not its mechanics. It explains what the system is
responsible for deciding — and, just as importantly, what it is not.
The Daily Action Engine exists for one reason only:
Select actions the user will actually do that advance the plan.
This engine is not designed to optimize for theoretical best practices, productivity porn, or what
works for other agents in other contexts.
It explicitly does not exist to:
● generate the most optimal actions on paper
● impress the user with volume or complexity
● mirror tactics suggested by colleagues, brokers, social media, or market noise
Instead, it exists to generate real, executable progress.
Only actions that:
● move the user toward their confirmed goals and current monthly milestone
● respect their calibrated business strategy, preferences, and exclusions
● match their current execution capacity as a human being, not a machine
are eligible to be selected.
If these conditions are not met, the engine must not generate actions. Silence or a coaching
handoff is always preferable to bad advice.
System Invariants (Hard Rules for Developers)
These invariants act as guardrails for every downstream decision. They supersede feature logic,
UX considerations, and edge‑case handling.
These rules are always true. They are structural guarantees of the system, not guidelines or
heuristics. Violating them constitutes a system failure.

---

## Page 106

1. No Calibration → No Daily Actions
If the user has not completed and confirmed calibration, the Daily Action Engine must
not run under any circumstances. Partial data, guesses, or impatience do not override
this rule.
2. Strategy Violations Trigger Coaching, Not Compliance
If a proposed, implied, or requested action conflicts with the confirmed Business Plan,
declared exclusions, or calibration constraints, the engine must pause. Control is
transferred to the Coaching Behavior Engine to resolve the misalignment before any
actions are generated.
3. Action Volume Is Strictly Limited
○ Maximum: 1 Primary Action + up to 2 Supporting Actions
○ Sometimes fewer (including just one single action for the day)
○ Never more, regardless of urgency, backlog, or missed days
4. No Backlogs, No Carryover
Each day stands alone. Yesterday’s outcomes inform today’s decisions but never create
obligation, guilt, or compensation behavior.
5. Prescription Without Diagnosis Is Malpractice
When readiness, alignment, or strategy integrity is in question, the system must coach
before it prescribes. Action without context is treated as unsafe.
6. Data Entry Is Action-Driven, Never Prerequisite
The Daily Action Engine is the only system component allowed to instruct the user to:
● upload contacts
● add or edit people in the database
● update or create pipeline items
These instructions must never appear during Calibration and must never feel like setup,
onboarding, or administrative housekeeping.
Core principle (non-negotiable):
Data entry is never a prerequisite. It is always a response to a meaningful
action.
Rules enforced by this principle:
● The system must never ask the user to upload contacts, clean the database, or fill in
pipeline as a generic setup step.
● Contact, database, or pipeline actions may only be introduced when they directly
improve the quality, accuracy, or effectiveness of today’s actions.

---

## Page 107

● These actions must always be framed as high-leverage execution moves, not
configuration tasks.
Decision boundaries (architectural clarity):
● The Daily Action Engine decides when contact or pipeline data is needed.
● The Database & Pipeline module defines how that data is structured and managed.
● UX & Rendering determines where and how these actions appear.
The Action Engine may justify data entry actions such as:
● “Add the 3 people you spoke with today so tomorrow’s follow-up is precise.”
● “Move this contact into pipeline so negotiation actions can be sequenced correctly.”
It must never justify them as:
● “Finish setting up your database”
● “Upload your contacts to get started”
● “Clean up your pipeline before proceeding”
If a data request cannot be justified by immediate action quality, it must not be shown.
Decision Authority Map (Critical for Architecture)
This separation exists to prevent conflicting decision logic, duplicated responsibility, and silent
strategy drift as the system grows.
Clear separation of responsibility is essential to prevent system drift and user confusion.
● Calibration Module decides:
○ long‑term and short‑term goals
○ strategic direction
○ constraints, exclusions, and preferences

---

## Page 108

● Coaching Behavior Engine resolves:
○ misalignment between intention and behavior
○ strategic drift or panic tactics
○ emotional, cognitive, or capacity‑based blockers
● Daily Action Engine:
○ selects and delivers actions only within confirmed bounds
○ never debates or re‑decides strategy
○ never overrides calibration decisions
The Daily Action Engine executes inside the plan. It does not reinterpret it.
Daily Action Flow (Expanded)
Step 1: Ask One Question (Daily Check‑In)
Every day begins with a single, consistent prompt:
“What did you get done yesterday?”
Input is free‑text by default and intentionally unconstrained.
The system parses this input for:
● completed outcomes
● partial progress
● skipped or avoided actions
● momentum or flow signals
● friction indicators
● stress, overload, or avoidance language
This input is treated strictly as signal, never as performance evaluation. The system does not
score, rank, or judge the user’s day.
Step 2: Readiness Gate — Decide Whether to Coach
Before selecting actions, the system evaluates readiness to execute.
Triggers that require a coaching offer include:
● the user explicitly reports that nothing was completed
● language indicating emotional interference (stress, frustration, resentment, avoidance)

---

## Page 109

● health disruption or meaningful life events
● signs of cognitive overload or loss of agency
If any trigger is present, the system offers (never forces):
“Want to take 2 minutes to unpack what got in the way before we decide today’s
actions?”
User choice is respected absolutely:
● Yes → run one short coaching loop (single coaching move only)
● Skip → proceed directly to action selection with no commentary
This step exists to protect execution quality and trust. It is not therapeutic and does not attempt
to diagnose the user.
Step 3: Strategy Integrity Check (Critical Gate)
Before any action is generated, the system validates alignment with:
● the confirmed Business Plan
● declared exclusions (e.g. “I hate door knocking”)
● calibrated strategic preferences and boundaries
If the user’s language, intent, or requested action violates these constraints:
● action generation halts immediately
● control is transferred to the Coaching Behavior Engine
● coaching questions are used to:
○ surface the tradeoff
○ clarify whether recalibration is required
The Daily Action Engine does not comply with misaligned tactics, even if they appear productive
in isolation.
Step 4: Select the Primary Action (AI Judgment Within Constraints)
This step represents the core intelligence of the Daily Action Engine. Everything prior prepares
for this decision; everything after depends on it.
The engine selects exactly ONE Primary Action using AI judgment constrained by:
● the annual goal

---

## Page 110

● the current 30‑day milestone
● confirmed business strategy
● personal constraints (energy, health, time)
● execution history and behavioral likelihood
Priority logic is contextual, not formulaic:
● Does this action advance the current monthly milestone?
● Is the user realistically capable of executing this today?
● Does this action preserve strategic integrity over time?
Primary Action requirements:
● outcome‑based rather than task‑based
● specific (who / what / how many / by when)
● almost always revenue‑progressing
Exception — Capacity Restoration
If a COMMIT‑derived action directly restores execution capacity (for example, an admin reset
after an intense appointment stretch), it may become the Primary Action for the day.
Step 5: Add Supporting Actions (Optional, Max 2)
Supporting Actions exist to support the day, not to create a second agenda or competing
priority.
They are explicitly secondary and are selected only after the Primary Action is locked.
Supporting Actions:
● exist first and foremost to reduce friction for the Primary Action, by making it easier to
start, easier to complete, or more likely to succeed
● may take the form of preparation, operations, leverage, delegation, documentation, or
light system cleanup
● may also advance or protect other priority columns in the Business Plan, provided
they remain supportive rather than substitutive
Business Plan columns that may legitimately influence Supporting Actions include:
● Client Experience
Examples: improving follow‑up quality, tightening handoffs, removing client‑facing friction
that directly supports revenue activities

---

## Page 111

● Leverage Plan
Examples: delegating repeat work, creating templates, documenting a process that
reduces future cognitive or time load
Critical constraints:
● Supporting Actions must never compete with or replace revenue‑progressing work
for the day
● If a Supporting Action would consume the time, energy, or focus required for the Primary
Action, it is disallowed
Rules:
● zero, one, or two only
● Supporting Actions must make the Primary Action easier, faster, or more sustainable
● never revenue‑substitutes, never standalone priorities
Step 6: Minimum Viable vs. Stretch Completion
For each action, the system defines:
● Minimum Viable Completion — the smallest version that still counts as a win
● Stretch Completion — optional upside if time, energy, or momentum allows
The system always optimizes for:
Consistency over intensity
Completion beats perfection. Momentum beats ambition.
Step 7: DIRECT Mode — Deliver Today’s Actions
Once actions are selected, the system enters DIRECT mode.
DIRECT mode rules:
● no questions
● no reframing
● no motivational or coaching language
Output includes:
● the actions themselves

---

## Page 112

● one sentence explaining how the Primary Action advances the monthly milestone
The purpose of this sentence is orientation, not justification.
Step 8: Execute → Learn → Reset
At the end of the day:
● there are no carryover lists
● there is no backlog compensation
● there is no retroactive pressure
The system explicitly logs:
● whether actions were completed
● why they succeeded or failed (time, energy, friction, avoidance)
Learning informs future action selection but never creates guilt or scorekeeping.
Tomorrow always starts fresh — informed, not burdened.
Design Anchor
When multiple valid implementations or interpretations exist, these principles act as
tie‑breakers. They are decision heuristics, not slogans.
Progress beats perfection.
Alignment beats volume.
Trust beats pressure.
If the user keeps moving — the system is working.
Common Developer Misinterpretations to Guard Against
This section exists to prevent well‑intentioned but incorrect implementations that quietly erode
the integrity of the Daily Action Engine over time.
These are not edge cases. They are predictable failure modes.
1. Treating the Engine Like a Task Generator

---

## Page 113

Misinterpretation:
The Daily Action Engine’s job is to generate a helpful list of things the user could do today.
Correction:
The engine’s job is to select the right actions — often fewer than expected — that the user will
actually execute and that advance the confirmed plan. Generating more tasks, optional ideas, or
“nice‑to‑haves” is a regression to CRM thinking.
2. Optimizing for Logic Instead of Executability
Misinterpretation:
The best action is the one that makes the most strategic sense on paper.
Correction:
An action that is theoretically optimal but unlikely to be executed is worse than a smaller action
that reliably happens. Executability always outranks theoretical efficiency.
3. Allowing Strategy Drift in the Name of Helpfulness
Misinterpretation:
If the user asks for a tactic, the system should comply as long as it might work.
Correction:
If a requested action violates the confirmed Business Plan or calibration constraints, the system
must pause and route to coaching. Compliance in these moments trains the user to ignore their
own strategy.
4. Using Supporting Actions as a Back Door for Extra Work
Misinterpretation:
Supporting Actions are a flexible space to add helpful extras.
Correction:
Supporting Actions exist only to support the Primary Action or strengthen compounding systems
(Client Experience, Leverage) without competing for attention. If a Supporting Action could
stand alone as “a productive day,” it does not belong here.
5. Treating Missed Days as a Consistency Problem

---

## Page 114

Misinterpretation:
Missed days indicate a discipline or motivation failure that should be corrected.
Correction:
Missed days are information. The system’s job is to restore motion safely, not to enforce
streaks, compensate volume, or apply pressure. Any implementation that adds guilt, catch‑up
behavior, or hidden penalties violates the design intent.
6. Letting Explanations Crowd Out Action
Misinterpretation:
More explanation increases user confidence and compliance.
Correction:
Once the system enters DIRECT mode, explanation is intentionally minimal. One sentence of
orientation is sufficient. Anything more risks re‑opening decisions that were already made
upstream.
Final Reminder for Builders
If you are unsure whether a change improves the system, ask this:
Does this make it more likely that the user takes the right action today — or does it
just make the system feel smarter?
If it’s the latter, don’t ship it.

---

## Page 115

2-FAQ's

---

## Page 116

FAQ — Daily Action Engine (Expanded)
1. What is the Daily Action Engine’s primary job?
To select actions the user will actually do that advance their confirmed plan.
Not the most optimal actions. Not the most impressive ones. Executable progress beats
theoretical perfection.
2. Is this a task manager or CRM?
No.
The engine does not manage backlogs, store task lists, or optimize productivity. It makes one
daily decision based on goals, strategy, and human reality.
3. Why does the engine sometimes refuse to give actions?
Because silence is safer than bad advice.
If calibration is incomplete, strategy is being violated, or execution readiness is compromised,
the engine must pause and hand off to coaching.
4. Why only one Primary Action?
Because focus creates momentum.
Multiple “important” actions dilute execution and recreate overwhelm. One Primary Action
collapses attention to what actually matters today.
5. Why are Supporting Actions capped at two?
To prevent scope creep and disguised procrastination.
Supporting Actions exist only to support the Primary Action or strengthen compounding systems
(Client Experience, Leverage). They are never standalone priorities.

---

## Page 117

6. Can Supporting Actions improve Client Experience or Leverage?
Yes — only if they do not compete with revenue execution that day.
If a Supporting Action could stand alone as a “productive day,” it does not belong.
7. What happens if a user suggests a tactic that violates their Business
Plan?
Action generation stops.
The system routes to coaching to surface the tradeoff and determine whether recalibration is
needed. The engine never complies with panic tactics.
8. Does the engine ever override the user’s strategy?
No.
Strategy is owned by Calibration and confirmed by the user. The engine executes inside those
bounds.
9. What is COMMIT and why does it matter?
COMMIT is the bridge between coaching and execution.
It establishes readiness and may temporarily override the day’s Primary Action only when it
restores execution capacity.
10. Can admin or non-revenue work ever be the Primary Action?
Yes — only when it directly restores execution capacity (e.g., reset after intense
appointments).
Admin for its own sake is never promoted.

---

## Page 118

11. How does the engine handle missed days?
Missed days are treated as information, not failure.
No backlogs. No catch-up. No streak pressure. The goal is safe re-entry into motion.
12. Does the system infer missed days automatically?
No.
A missed day exists only if the user explicitly reports it. Silence is not penalized.
13. Why include a coaching offer at all?
Because action without readiness erodes trust.
The coaching pause protects execution quality while preserving user agency.
14. How much explanation should Daily Actions include?
Exactly one sentence tying the Primary Action to the monthly milestone.
More explanation reopens decisions that were already made upstream.
15. How does the system learn over time?
By explicitly logging why actions succeed or fail (time, energy, friction, avoidance).
Behavior matters more than stated preference.
16. Is this system rigid?
No.
It is constrained, not brittle. Flexibility exists inside confirmed boundaries.

---

## Page 119

17. What should builders do when unsure?
Ask:
Does this make it more likely the user takes the right action today — or does it just
make the system feel smarter?
If it’s the latter, don’t ship it.
Can the system ever ask a user to upload contacts or clean their pipeline
proactively?
No.
The system may only ask for contact, database, or pipeline updates as part of a Daily Action,
and only when doing so directly improves the quality of execution for that day.
Generic prompts like “upload your contacts” or “clean your pipeline” are never allowed.
Why isn’t contact or pipeline setup part of onboarding or calibration?
Because setup is not leverage.
Calibration exists to establish goals, strategy, and constraints — not to populate software.
Data entry becomes meaningful only after the system knows what the user is trying to
accomplish today.
What’s the difference between ‘setup’ and an action-driven data request?
Setup is framed as preparation for the system.
Action-driven data entry is framed as preparation for today’s execution.
If the request improves today’s plan, it’s allowed.
If it only improves system completeness, it’s not.
Can data entry ever be the Primary Action for the day?
Yes — but only in rare cases where it directly restores or unlocks execution capacity.

---

## Page 120

Examples:
● Capturing contacts from recent conversations to enable follow-up
● Updating pipeline status to sequence negotiations correctly
Admin for cleanliness or completeness alone is never sufficient.
Who decides when contact or pipeline data is required?
Only the Daily Action Engine.
● The Action Engine decides when data is needed
● The Database & Pipeline module defines how it works
● UX determines where it appears
No other system component may initiate data entry requests.
What should builders do if they feel tempted to add a “helpful” data
prompt?
Ask:
Does this make today’s action more effective — or does it just make the system
more complete?
If it’s the latter, it does not belong in the product.
Why I would not add more than this
Anything beyond these:
● starts repeating the invariant

---

## Page 121

● risks drifting into UX or implementation detail
● weakens the elegance of the rule by over-explaining it
This amendment is strong because it’s clear, scarce, and enforceable.

---

## Page 122

2-Engineering Spec

---

## Page 123

● Do you guys actually want these or are they not helpful?

---

