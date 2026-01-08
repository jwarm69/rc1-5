# Database, Pipeline & Production Truth Layer

**Description:** Contacts database, pipeline stages, production dashboard, CSV imports, data integrity rules

**Pages:** 124-154

---

## Page 124

DB,Pipeline,Production

---

## Page 125

In progress******
READ FIRST — Database & Pipeline Truth Layer (TL;DR
for Builders)
This module defines what is true, not what the user should do.
If you remember nothing else:
● This is not a CRM.
● Pipeline stages are semantic progress markers, not tasks or required steps.
● All production metrics are cumulative and derived from Pipeline state.
● Pipeline data never creates actions, reminders, or pressure.
● Only the Daily Action Engine is allowed to tell the user what to do.
If a change adds urgency, obligation, or behavioral pressure — it violates system intent.

---

## Page 126

3-Plain English

---

## Page 127

Plain English Logic (Expanded v2 — Database, Pipeline,
and Production Truth)
This module defines the single source of truth for how the system understands people,
progress, and production — without turning the user into a CRM operator.
What this module does
This module establishes a single, authoritative truth layer for how RealCoach.ai understands
contacts, pipeline, and production.
Its purpose is to give the coaching system something it can reliably read, reason about, and
update without turning the user into a CRM operator.
This logic exists so the system can:
● decide what matters today
● understand where momentum is building or stalling
● report production honestly
● and preserve trust over time
This module defines:
● what a Contact is (and is not)
● what qualifies someone to enter the Pipeline
● how Pipeline stages behave and progress
● how Pipeline data feeds the Production Dashboard
This module explicitly does not define:
● UI layout or screen design
● charts, cards, or visual components
● animations, progress bars, or visual trends
● time‑based slicing or presentation logic
Those belong to UX and rendering layers. This document defines what is true, not how it is
displayed.
What the user sees
Because the system’s truth layer is intentionally opinionated and constrained, it manifests for the
user as simplicity rather than complexity.

---

## Page 128

From the user’s perspective, the system remains intentionally simple.
There are two primary working surfaces:
● Contacts — everyone the user knows or has interacted with
● Pipeline — only Contacts with confirmed intent to transact
Users may click into records, review details, or make edits if they choose. However, the system
is designed so that manual data management is optional, not required.
The Production Dashboard exists as a read-only reflection of Pipeline state and is not a
working surface.
If the user never opens the Pipeline tab, the coaching system must still function correctly.
How records get updated (the real flow)
The system assumes that the natural coaching conversation is the primary input method.
The user speaks or types naturally:
“I talked to the Smiths — they’re selling in the spring.”
The system evaluates whether clarification is required.
● If clarity is sufficient, no question is asked.
● If ambiguity affects planning, the system asks one clarifying question only.
Example: “When you say spring, which month should I set as the target?”
Based on the answer, the system updates:
● the Contact record (identity, notes, and context)
● a Pipeline item (only if Lead criteria is met)
● the target month (for future intent)
At no point is the user required to:
● drag cards (no spatial manipulation or visual workflow management)
● manage stages
● maintain fields

---

## Page 129

● or behave like a CRM administrator
Manual interaction is always allowed, but never required for the system to work.
Contacts Database — Human Memory Layer
Purpose
The Contacts Database exists to store people, not opportunities.
It functions as the system’s long-term memory of human relationships — neutral,
non-judgmental, and free from implied obligation.
Most Contacts will never enter the Pipeline. This is expected behavior, not a failure state.
What the Contacts Database Does
The Contacts Database provides the system with:
● a persistent record of people the user knows or has interacted with
● relationship context that informs coaching conversations
● historical memory so the user does not need to repeat themselves
It allows the system to remember, not to manage.
What the Contacts Database Does Not Do
The Contacts Database does not:
● create tasks
● suggest follow-ups
● enforce cadence
● track performance

---

## Page 130

● imply neglect or obligation
A Contact can exist indefinitely without ever requiring action.
The absence of action is not a problem to be solved.
What Qualifies as a Contact
A Contact may be created whenever the user:
● meets someone
● speaks with someone
● is introduced to someone
● wants the system to remember someone
No transactional intent is required.
A Contact does not imply:
● interest in buying or selling
● readiness to transact
● eligibility for the Pipeline
Contact ≠ Lead
Contact ≠ Opportunity
Contact ≠ To-Do
What Data May Live on a Contact
Allowed data includes:
● basic identifying information sufficient to distinguish and recognize the person
● relationship context (how the user knows them)
● conversational notes and personal details
● historical context that may inform future coaching
Disallowed data includes:
● reminders or alerts

---

## Page 131

● follow-up cadence
● time-since-last-contact indicators
● engagement or priority scoring
● urgency flags
Any data that implies obligation violates the intent of the Contacts Database.
Contact data exists to support recognition and context, not tracking or enforcement.
Tagging (Classification, Not Behavior)
Tags exist to describe who someone is, not what should be done.
Tags are a lightweight classification tool used to group and filter Contacts based on stable or
descriptive attributes.
Tags may be used to represent:
● relationship type (e.g., SOI, Past Client, Vendor)
● role or category (e.g., Lender, Attorney, Neighbor)
● source or affiliation (e.g., Referral Source, Organization)
Tags must be:
● descriptive, not prescriptive
● non-urgent
● non-time-based
● non-behavioral
Tags must never:
● imply priority
● imply readiness to transact
● trigger actions or reminders
● influence cadence or follow-up timing
● decay, age, or change meaning over time
Tags live only on Contact records.

---

## Page 132

They have no independent meaning in the Pipeline and do not affect Pipeline stage, production
reporting, or action creation.
Any tag that answers the question “what should I do?” violates system intent and must not exist.
Amendment: CSV Import of Contacts (Integrity-Safe
Ingestion)
CSV Import Scope and Intent
CSV upload exists solely to seed the Contacts Database, not to create Pipeline items,
production data, or implied obligations.
A CSV import is treated as a memory initialization event, equivalent to the user saying:
“These are people I already know.”
CSV import must never be interpreted as evidence of:
● transactional intent
● readiness to transact
● follow-up expectations
● priority or urgency
Imported records enter the system as Contacts only.
Allowed Outcomes of a CSV Import
When a CSV is uploaded, the system may:
● create new Contact records
● update existing Contact records via safe identity matching
● attach tags that meet Contacts Database tagging rules
● store identifying and contextual information allowed on Contacts
The system must not:
● create Pipeline items
● infer Lead status
● assign stages
● populate target months
● generate actions or reminders

---

## Page 133

● influence Daily Action Engine outputs directly
A CSV import alone must have zero behavioral impact.
Contact Matching and De-Duplication (Truth Rules)
When importing a CSV, the system must attempt to match records against existing Contacts
using stable identifiers.
If a match is found:
● the Contact record may be enriched with additional context
● no Pipeline state may be altered
If no match is found:
● a new Contact record is created
Duplicate Contacts must never result in:
● duplicated Pipeline items
● inflated production metrics
● duplicated transactional intent
Tags from CSV Imports
Tags included in a CSV import are treated as classification only and must obey all Tagging
guardrails defined in the Contacts Database section.
CSV-imported tags must never:
● imply priority
● imply readiness to transact
● trigger actions
● influence cadence or urgency
If a tag violates system intent, it must be ignored or rejected.
Pipeline Separation Guarantee

---

## Page 134

A Contact created or updated via CSV import may only enter the Pipeline through
subsequent, explicit confirmation of transactional intent via natural conversation or direct user
instruction.
CSV import is never a qualifying signal for Lead creation.
Design Integrity Rule (CSV Imports)
CSV import functionality must preserve the same core system posture as manual Contact
creation:
● memory, not management
● context, not pressure
● recognition, not obligation
If a CSV import would cause the user to feel:
● watched
● behind
● obligated
● judged
the implementation violates system integrity and must not ship.
Relationship Between Contacts and Pipeline
Contacts and Pipeline are related but serve different purposes.
Hard rules:
● A Contact may enter the Pipeline only when confirmed transactional intent exists
(see “What a Lead Means” in the Pipeline section)
● Pipeline items may return context to the Contact record after resolution
● Contacts must never imply Pipeline obligation
The transition from Contact → Pipeline is intentional and explicit.
The absence of a Pipeline item carries no negative meaning.
Returned context refers to historical notes or outcome summaries, not behavioral signals or
follow-up expectations.

---

## Page 135

How the Contacts Database Supports Coaching
The Contacts Database exists so the coaching system can:
● recall who people are
● understand relationship nuance when relevant
● interpret conversations accurately
● avoid redundant clarification
It does not exist to:
● suggest outreach
● surface “people to check in with”
● rank relationships
● create pressure
All action decisions remain the responsibility of the Daily Action Engine.
Contacts Integrity Guardrail
If a proposed change causes the user to feel:
● watched
● behind
● negligent
● obligated
That change does not belong in the Contacts Database and must not ship.
The database must feel like memory, not surveillance.
Pipeline Stages (Canonical and Ordered)
These stages exist to model real transactional progress, not to enforce process compliance or
activity tracking.
The Pipeline represents a single active transaction path at a time.

---

## Page 136

A Pipeline item reflects the current state of a potential transaction. While stages are ordered,
they are not irreversible.
Pipeline items may move backward when real-world intent changes (e.g., an active buyer
pauses and returns to a longer-term nurture state).
However:
● a Contact may have only one Pipeline item at a time
● Pipeline items may not branch into parallel paths
● stage changes must reflect actual intent, not system automation
This preserves a clean, honest model of transactional reality without inflating progress or forcing
artificial closure.
The canonical stages are:
1. Lead
2. Nurture
3. Appointment Set
4. Appointment Held (Unsigned)
5. Signed and Active
6. Under Contract
7. Closed
Pipeline items are automatically ordered by stage from earliest to latest.
Closed items always appear at the bottom of the Pipeline and remain visible until the
production year resets.
This ordering reinforces the mental model that the Pipeline reflects progress, not tasks.
What “Lead” means (RealCoach.ai definition)
A Lead is confirmed intent, not a name, tag, or database entry.
To qualify as a Lead, all of the following must be true:
● a two‑way conversation has occurred
● intent to buy or sell has been explicitly stated
The following do not qualify as Leads:
● “Maybe someday” statements

---

## Page 137

● “Keep me posted” requests
● one‑way outreach or unanswered messages
● people the user has not actually spoken with
Those individuals remain Contacts, not Pipeline items.
This distinction prevents premature pipeline inflation and false confidence.
Future‑Dated Pipeline Items
When intent is real but timing is later:
● a Pipeline item is created immediately (new row)
● a target month is assigned
Future‑dated Pipeline items:
● remain visible for strategic context
● may influence prioritization logic (as interpreted by the Daily Action Engine)
● may affect coaching language
● do not create tasks, reminders, or alerts
Each Contact may have only one Pipeline item at a time, preserving clarity and preventing
duplicated intent.
How Pipeline Data Feeds the Production Dashboard
(Truth Layer)
At its core, the dashboard operates on a single principle: progress is cumulative, not
event-based.
The Production Dashboard does not track activity independently.
It is a read‑only reflection of Pipeline reality, derived entirely from Pipeline state.
No data point may appear on the dashboard unless it can be traced directly to a Pipeline item.
This section defines the semantic rules that govern production reporting so that visual rendering
cannot distort meaning.

---

## Page 138

Canonical Principle: Cumulative Stage Logic
Pipeline stages are ordered and cumulative.
Advancing to a later stage implies all prior stages have occurred.
Stages do not represent separate, independently countable events. They represent progress
along a single transactional path.
Examples:
● Any item at Appointment Held or later has also:
○ been a Lead
○ been Nurtured
○ had an Appointment Set
● Any item at Signed and Active or later has also:
○ had an Appointment Held
● Any item at Closed has passed through every prior stage
This cumulative model prevents double counting and preserves a clean mental model of
progress.
Production Dashboard KPIs (Derived Only from Pipeline)
The Production Dashboard displays four primary KPIs:
1. Appointments Held
2. Clients / Agreements Signed
3. Closed Units
4. GCI (Revenue)
The dashboard never stores separate activity records.
If a metric is not reflected in the Pipeline, it does not exist for reporting purposes.
KPI Derivation Rules (Non‑Negotiable)
Appointments Held
Definition:
Count of all Pipeline items whose stage is:

---

## Page 139

● Appointment Held (Unsigned) or later
Includes:
● Signed and Active
● Under Contract
● Closed
If a deal is signed or closed, it is implicitly true that an appointment was held.
Clients / Agreements Signed
Definition:
Count of all Pipeline items whose stage is:
● Signed and Active or later
Includes:
● Under Contract
● Closed
Unsigned appointments do not count toward this metric.
Closed Units
Definition:
Count of Pipeline items explicitly marked:
● Closed
Closed items:
● remain visible through the production year
● roll into lifetime and historical reporting later
GCI (Gross Commission Income)
Definition:
Sum of GCI values from Pipeline items whose stage is:
● Closed

---

## Page 140

Projected, estimated, or pending GCI does not affect dashboard totals.
Logic Boundary: Time Views
This module defines qualification rules, not time slicing.
Views such as:
● “this month”
● “last month”
● rolling averages
● trend deltas
are rendering concerns handled elsewhere.
This separation ensures that reporting logic remains stable even as UI evolves.
Relationship to the Daily Action Engine (Hard Boundary)
Pipeline data:
● may inform prioritization decisions
● may influence coaching language and emphasis
● may signal imbalance or opportunity
Pipeline data:
● must never create tasks
● must never issue reminders
● must never pressure follow‑up
Only the Daily Action Engine is allowed to prescribe actions.
Pipeline & Reporting Integrity Guardrail
This logic exists here to prevent:
● inconsistent KPI math

---

## Page 141

● double counting
● UI‑driven interpretations of success
● quiet drift into CRM behavior
If the dashboard feels calm, accurate, and trustworthy — this layer is doing its job.
Reinforcement Rules (Stress‑Test Hardening Addendum)
These rules matter most during scaling, feature expansion, and engineering handoffs — the
moments when well‑intentioned changes most often introduce hidden pressure or CRM creep.
This section exists to explicitly close the failure modes identified during stress testing. These
rules are not optional clarifications — they are system‑level guardrails designed to prevent
CRM creep, behavioral pressure, and semantic drift as the product scales.
Nurture Influence Guardrail (Critical)
Nurture is a meaningful Pipeline stage, but it is also the highest‑risk zone for hidden pressure.
Hard rule:
● Nurture may influence which type of action is selected
● Nurture may influence language emphasis during coaching
● Nurture must never imply cadence, urgency, or obligation
Specifically disallowed behaviors:
● “You haven’t contacted these recently”
● “These are overdue”
● “You should check in again”
● Any time‑since‑last‑contact logic
Pipeline imbalance is treated as a strategic signal, not a follow‑up debt.
Stage Inference Rule (Skipped Steps Are Allowed)
Real human conversations do not progress in clean, linear steps.
System rule:

---

## Page 142

● The system may infer skipped stages when natural progression is evident
● Users are never required to explicitly pass through each named stage
Examples:
● If a user reports a signed agreement without stating an appointment was held, the
system infers all prior stages
● If an appointment was held without explicitly being “set,” the system infers Appointment
Set
Stages represent logical progress, not calendar events.
Manual vs. System Updates (Authority Clarification)
Users may:
● manually move Pipeline items
● request changes via natural language
However:
● the system remains the authoritative interpreter of meaning
● manual movement does not create obligation, priority, or expectation
Manual edits are treated as context updates, not commitments.
Future‑Dated Pipeline Protection
Future‑dated Pipeline items are intentionally visible but behaviorally inert.
Hard rule:
● Future‑dated items must never inflate perceived monthly progress
● They may not influence urgency or pressure
● They may only influence long‑range prioritization logic (as interpreted by the Daily Action
Engine)
Pipeline volume is never treated as progress.
Only stage advancement within the current execution window is considered momentum.

---

## Page 143

Closed‑Deal Persistence Clarification
Closed items persist for reporting integrity, not emotional reinforcement.
System posture:
● Closed items contribute to KPIs
● Closed items do not imply completion of future goals
● Closed items do not reduce the need for new Lead creation
The system must not allow a “full pipeline” feeling to substitute for present‑day execution clarity.
Engineer‑Facing Non‑Expansion Rule
The following are explicitly out of scope for this module and must not be added here:
● conversion rates
● days‑in‑stage metrics
● follow‑up latency tracking
● contact frequency scoring
● reminder logic
● notification triggers
If a proposed feature answers:
“What should the user do?”
It belongs only in the Daily Action Engine.
Final Integrity Check (Design Test)
Any future change to this module must pass the following test:
Does this addition increase clarity without increasing pressure?
If it adds urgency, obligation, or perceived debt — it violates system integrity and must not ship.
Final Developer Handoff — What Must Not Be
Misunderstood

---

## Page 144

This section exists to prevent well‑intentioned implementation decisions from violating system
integrity. These are non‑obvious constraints that matter more than feature completeness.
1. This is a Truth Layer, Not a Feature Layer
Engineers must not treat this module as:
● a task generator
● a productivity system
● a reminder engine
● a CRM workflow manager
Its sole responsibility is to define what is true about contacts, pipeline state, and production
metrics. Any logic that answers “what should the user do next” is explicitly out of scope here.
2. Pipeline Stages Are Semantic, Not Procedural
Pipeline stages:
● do not represent required steps
● do not represent calendar events
● do not imply that an action must have occurred
They are semantic markers of progress inferred from real‑world conversations. Engineers must
allow:
● skipped stages
● inferred progression
● non‑linear human reporting
Blocking progression due to a missing prior stage is a system failure.
3. No Time‑Based Pressure May Be Introduced
This module must never introduce:
● “days since last contact”
● “stale” or “overdue” indicators
● countdowns, timers, or aging logic
Time awareness belongs only in:

---

## Page 145

● coaching language
● Daily Action Engine prioritization logic (as interpreted by the Daily Action Engine)
Never in pipeline truth or reporting math.
4. Cumulative Metrics Are Not Optional
Dashboard KPIs are cumulative by design.
Do not:
● subtract earlier‑stage items from later metrics
● treat stages as mutually exclusive buckets for reporting
If a deal is Closed, it must still count as:
● an appointment held
● an agreement signed
Any alternative implementation breaks reporting trust.
5. Manual Interaction Must Remain Consequence‑Free
Users may interact with pipeline data manually, but:
● manual edits must never create obligations
● manual edits must never escalate urgency
● manual edits must never imply commitment
Manual interaction is informational, not behavioral.
6. Future‑Dated Items Are Context, Not Commitments
Future‑dated pipeline items:
● may exist far in advance
● may influence long‑range reasoning
They must not:
● count toward short‑term momentum

---

## Page 146

● trigger alerts
● bias daily execution pressure
7. When in Doubt, Bias Toward Less Behavior
If an implementation choice could:
● add pressure
● imply judgment
● create obligation
The correct decision is to do less, not more.
Trust is preserved by restraint, not cleverness.
8. The Ultimate Test
Before shipping any change touching this module, engineers should ask:
“Would this make the user feel more watched, or more supported?”
If the answer is “more watched,” the change violates system intent and must not ship.

---

## Page 147

3-FAQ's

---

## Page 148

FAQ — Expanded Developer & Product Clarifications
Is this a CRM?
No.
CRMs optimize for record completeness, activity tracking, and follow-up enforcement. This
system optimizes for trust, clarity, and execution quality. Contacts and Pipeline exist to
inform decisions, not to manage behavior.
Why can a user have Contacts without Pipeline items?
Because knowing someone is not the same as confirmed intent.
Pipeline only represents people who have explicitly stated they intend to buy or sell. Everyone
else remains a Contact, regardless of how often the user interacts with them.
Can a Pipeline item exist without a Contact?
No.
A Pipeline item cannot exist unless a Contact exists first. The Pipeline references Contacts; it
does not store people. This ensures all transactional context is grounded in a real human
relationship.
Can a Pipeline item ever move backward?
Yes, when real-world intent changes.
Pipeline stages reflect current transactional intent, not permanent momentum. If intent shifts
(e.g., an active buyer pauses and returns to a longer-term horizon), the Pipeline stage may
move backward to reflect reality.
Does moving a Pipeline item backward erase prior progress?
No.
Stage movement reflects current state, not historical erasure. Production reporting is derived
from cumulative stage logic and always reflects what is true about the deal’s progress overall.

---

## Page 149

Is the Production Dashboard a working surface?
No.
The Production Dashboard is read-only. It reflects Pipeline truth but does not create, edit, or
manage data. All updates occur through conversation, Contacts, or Pipeline state — never from
the dashboard itself.
Why is there only one Pipeline item per Contact?
To preserve clarity and prevent duplicated intent.
Multiple future hypotheticals (“maybe buy,” “maybe sell,” “maybe refer”) create false confidence
and CRM sprawl. One Contact equals one active transactional truth at a time.
Why are Pipeline stages cumulative instead of exclusive?
Because real transactions do not reset earlier progress.
If a deal closes, it is still true that an appointment was held and an agreement was signed.
Treating stages as exclusive buckets breaks reporting trust and misrepresents reality.
Why are skipped stages allowed?
Because humans do not speak in system steps.
The system infers logical progress from conversation. Requiring explicit confirmation of every
stage would force users to manage process instead of living their business.
Why doesn’t the Pipeline create reminders or follow-ups?
Because reminders create pressure, and pressure destroys trust.
The Pipeline provides context. The Daily Action Engine decides actions. Mixing those
responsibilities recreates CRM behavior under a different name.

---

## Page 150

What is Nurture actually for?
Nurture signals that the user has moved beyond first contact and is intentionally building toward
an appointment.
It influences coaching language and action selection type, but never cadence, urgency, or
obligation.
Why do Closed deals stay visible?
For reporting integrity.
Closed deals feed KPIs and year-to-date performance. Removing them would undermine trust
in the Production Dashboard.
Why don’t future-dated Pipeline items count as progress?
Because intent without execution is context, not momentum.
Future items help with long-range reasoning, but only stage advancement in the current
execution window counts as progress.
Who is allowed to move Pipeline stages?
Both the user and the system.
However, the system remains the authoritative interpreter of meaning. Manual changes update
context but never create obligation or priority.
What happens if engineers want to add conversion rates, aging, or alerts?
They must not be added here.
Those features introduce pressure and judgment. If a feature answers “what should the user
do,” it belongs only in the Daily Action Engine.

---

## Page 151

What is the ultimate test for changes to this module?
Ask one question:
Does this increase clarity without increasing pressure?
If not, it should not ship.
Can a CSV upload create Leads or Pipeline items?
No.
A CSV upload can only create or update Contact records. It must never create Pipeline items,
infer intent, or qualify someone as a Lead. Transactional intent may only be established through
explicit conversation or direct user instruction.
Does importing a CSV trigger actions, reminders, or prioritization?
No.
CSV import has zero behavioral impact. It does not influence Daily Action Engine outputs,
action selection, urgency, or coaching language.
How does the system handle duplicate Contacts during CSV import?
The system attempts to safely match imported records to existing Contacts using stable
identifiers.
If a match is found, the Contact may be enriched. If not, a new Contact is created. Duplicate
Contacts must never result in duplicated Pipeline items or inflated production metrics.
Are tags from a CSV treated differently than manually added tags?
No.
CSV-imported tags follow the same rules as all other tags. They are classification only and
must never imply priority, readiness to transact, or follow-up obligation.
Can a Contact imported via CSV ever enter the Pipeline?

---

## Page 152

Yes, but only later and only intentionally.
A Contact imported via CSV may enter the Pipeline only after explicit confirmation of
transactional intent through conversation or direct user instruction. CSV import alone is never a
qualifying signal.
Why doesn’t CSV import affect performance or momentum?
Because recognition is not progress.
CSV import initializes memory; it does not represent execution, intent, or momentum. Treating
bulk import as progress would undermine trust in the system.

---

## Page 153

3-Engineering Spec

---

