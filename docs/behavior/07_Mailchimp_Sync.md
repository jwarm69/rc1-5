# Mailchimp Sync Logic

**Description:** One-way sync rules, data model, tags, failure handling, deletion logic

**Pages:** 192-210

---

## Page 192

Mailchimp Sync Logic

---

## Page 193

READ FIRST — Mailchimp Sync Logic (V1)
This integration is intentionally boring.
Mailchimp exists inside RealCoach.ai for one reason only:
To mirror the RealCoach Contact database so users can communicate at
scale — without managing two systems.
This is not a CRM integration.
This is not a marketing engine.
This is not a feedback loop.
Non-Negotiable Truths
● RealCoach.ai is the source of truth. Always.
● All sync is one-way: RealCoach → Mailchimp
● Mailchimp data never influences:
○ coaching behavior
○ daily actions
○ prioritization
○ user pressure or obligation
● Tags sync to eliminate double entry — not to drive behavior
● Failure is treated as infrastructure noise, not a user problem
If you are about to:
● add configurability
● pull engagement data back in
● “optimize” the sync

---

## Page 194

● introduce smart logic or helpful suggestions
Stop.
Ask this instead:
Does this help the user take the right action today — or does it quietly turn
Mailchimp into a judge?
If it’s the latter, do not ship it.

---

## Page 195

6-Plain English

---

## Page 196

Mailchimp Sync Logic — Plain English
(V1, MVP)
Purpose (Why This Exists)
This document defines how and why RealCoach.ai synchronizes Contacts with Mailchimp
— and just as importantly, what this integration must never become.
Mailchimp exists inside RealCoach.ai for one job only:
Mailchimp is an address book mirror, nothing more.
This logic ensures that:
● Users live inside RealCoach.ai as their primary system
● No duplicate data entry is required
● No CRM-style behavior, pressure, or automation is introduced
● Email and bulk messaging tools remain downstream utilities — not decision engines
This document defines sync behavior, not UI, not campaign logic, and not analytics.
Core Principle (Non-Negotiable)
RealCoach.ai is the single source of truth.
● Mailchimp never decides what is correct
● Mailchimp never feeds behavior back into RealCoach
● Mailchimp never influences coaching, prioritization, or daily actions
All sync is push-based, RealCoach → Mailchimp, and unidirectional.
If there is ever a conflict:
RealCoach wins. Always.
Scope (MVP Only)

---

## Page 197

Included
● One-way contact sync from RealCoach.ai to Mailchimp
● Automatic sync on:
○ Contact creation
○ Contact edits
○ Tag changes
○ CSV contact imports
● User ability to connect or disconnect a Mailchimp account
● Coaching-side visibility if sync is paused or fails
Explicitly Excluded (Forever, Not Just MVP)
● Campaign creation
● Email or SMS sending
● Automation workflows
● Open / click / engagement metrics
● Behavioral data flowing back into RealCoach
● “Smart” segmentation logic
● Action triggers based on email activity
Mailchimp is never allowed to become a behavior signal.
Data Model (What Syncs)
Only the following Contact fields are eligible for sync:
● First Name
● Last Name
● Email
● Phone
● Tags
No other data is permitted to cross the boundary.
Explicitly Not Synced
● Notes
● Addresses
● Pipeline stage
● Deal data
● Production data

---

## Page 198

● Last contacted
● Any time-based or behavioral signals
This preserves the Database as memory, not a behavioral ledger.
Tags (Intentional Design Choice)
All Contact tags in RealCoach.ai do sync to Mailchimp.
This is a deliberate tradeoff.
Why This Is Allowed
● Prevents double entry
● Eliminates the need to manage lists in two systems
● Keeps RealCoach as the place where relationships are classified
● Reduces friction for real-world communication workflows
Guardrail (Critical)
Tags remain:
● Descriptive, not prescriptive
● Non-urgent
● Non-behavioral
● Non-time-based
Tags must never:
● Trigger actions
● Imply follow-up
● Influence cadence
● Affect Daily Action Engine logic
● Create pressure or obligation
If a tag answers the question “what should I do?” — it violates system integrity.
Sync Direction & Triggers
Direction

---

## Page 199

● RealCoach → Mailchimp only
● No pull, no reconciliation, no bidirectional merge
Sync Triggers (All Apply)
A sync event is emitted whenever:
● A Contact is created
● A Contact is edited
● Tags are added or removed
● Contacts are imported via CSV
CSV imports behave identically to native contact creation.
There is no “staging” or delayed approval layer.
User Control & Visibility
What the User Can Do
● Connect a Mailchimp account
● Disconnect a Mailchimp account
That’s it.
What the User Cannot Do
● Tune sync behavior
● Choose which fields sync
● Select which tags sync
● Pause individual sync events
● Create lists or segments inside RealCoach
This prevents configuration drift and CRM creep.
Failure Handling (Trust Preservation)
If Mailchimp is unavailable, rate-limited, or errors:
● Sync retries silently in the background

---

## Page 200

● No UI alerts, banners, or warnings appear
● The Database continues to function normally
If failures persist beyond retry thresholds:
● A single coaching-side note may surface:
“Heads up — email sync is paused right now.”
This message:
● Is informational only
● Carries no urgency
● Creates no required action
● Disappears automatically once sync resumes
Failure is treated as infrastructure noise, not user responsibility.
Deletion Logic (High-Intent Event)
Deleting a Contact is never treated as a casual operation.
Required Behavior
When a user attempts to delete a Contact:
● Control is handed to the Coaching Behavior Engine
● The system clarifies intent:
○ Do they want to forget the relationship?
○ Or simply remove behavioral pressure?
○ Or archive context instead?
This is a coaching moment, not a UI shortcut.
If Deletion Is Confirmed (Non-Negotiable)
● The Contact is removed from RealCoach.ai
● The corresponding contact is removed from Mailchimp
There is no partial delete and no orphaning logic.
Relationship to Other Systems

---

## Page 201

Database
● Mailchimp sync is an extension of the Database only
● The Database remains neutral, boring, and stable
● Sync behavior is invisible at the table level
Coaching Behavior Engine
● Handles deletion intent
● Surfaces sync failure context
● Protects meaning and restraint
Daily Action Engine
● Never reacts to Mailchimp state
● Never issues actions related to email campaigns
● Never depends on Mailchimp data
Mailchimp does not exist in the execution loop.
Non-Goals (Reinforced)
This logic must never evolve to include:
● Email performance feedback
● Lead scoring
● Contact “temperature”
● Re-engagement nudges
● “Who hasn’t opened emails lately”
● Any proxy for effort, consistency, or discipline
If a proposed feature introduces pressure, obligation, or behavioral inference — it does not
belong here.
Final Integrity Test (For Engineers)
Before shipping any change touching this integration, ask:
Does this make Mailchimp feel like a tool — or a judge?

---

## Page 202

If the answer is anything but “a quiet downstream tool”, the change must not ship.
One-sentence summary for devs:
Mailchimp mirrors RealCoach’s contact memory so users can communicate at scale — without
ever turning communication into behavior tracking or obligation.

---

## Page 203

6-FAQ's

---

## Page 204

Mailchimp Sync — Developer FAQ (V1)
1. Is this a CRM integration?
No.
CRMs optimize for:
● activity tracking
● follow-up enforcement
● behavioral pressure
This integration optimizes for:
● memory
● ease
● reduced friction
● single-system ownership
Mailchimp is downstream infrastructure, not a behavior system.
2. Why is RealCoach the source of truth?
Because the system’s core promise is:
“Tell me what to do today — without managing software.”
Allowing Mailchimp to override or influence data would:
● fracture trust
● introduce silent conflicts

---

## Page 205

● create dual authority
There must be exactly one place where relationships are defined.
3. Why is sync one-way only?
Two-way sync creates:
● reconciliation logic
● ambiguity
● hidden state drift
● CRM-style complexity
RealCoach pushes.
Mailchimp mirrors.
Nothing flows back.
4. Why do all tags sync? Isn’t that risky?
Yes — and it’s intentional.
The bigger risk is forcing users to:
● tag in RealCoach
● then recreate lists in Mailchimp
That creates:
● double entry
● extra work

---

## Page 206

● system resentment
Guardrails live in meaning, not restriction:
● Tags classify relationships
● Tags do not trigger actions
● Tags do not imply urgency
If a tag starts behaving like a task, the system has failed.
5. Why don’t we limit which tags can sync?
Because:
● it adds configuration overhead
● it reintroduces setup thinking
● it shifts cognitive load back to the user
RealCoach owns judgment.
The user owns relationships.
Mailchimp just reflects.
6. What data actually syncs?
Only:
● First name
● Last name
● Email

---

## Page 207

● Phone
● Tags
Nothing else.
If a field answers:
● “What happened?”
● “What should I do?”
● “How active is this person?”
…it does not belong in Mailchimp sync.
7. What happens on CSV import?
CSV imports behave exactly like native contact creation:
● Contacts are created in RealCoach
● Sync fires immediately
● No staging, no approval, no delay
Consistency > special cases.
8. What if Mailchimp is down?
The system:
● retries silently
● continues normal operation
● does not block the user

---

## Page 208

If outages persist:
● a calm coaching-side note may appear
● no alerts
● no required action
Failure is infrastructure noise, not a user emergency.
9. Why surface sync issues at all?
Because silence during prolonged failure erodes trust.
But:
● surfacing does not mean alarming
● informing does not mean burdening
The user should never feel responsible for integrations.
10. Why route deletion through coaching?
Because deletion is a meaningful human decision, not a housekeeping task.
Removing a contact:
● erases memory
● ends mind-share
● may contradict long-term strategy
The system pauses to ask:
“Is deletion actually what you want?”
If yes:

---

## Page 209

● the contact is removed from RealCoach
● the contact is removed from Mailchimp
No half-measures.
11. Why not archive instead of delete?
Archiving preserves:
● history
● context
● optional future relevance
Deletion is irreversible by design.
That’s why it’s protected.
12. Why doesn’t email engagement influence coaching or
actions?
Because:
● opens and clicks are weak proxies for intent
● they distort behavior
● they encourage pressure tactics
RealCoach prioritizes:
● strategic integrity
● human-centered execution

---

## Page 210

● long-term trust
Email metrics do not meet that bar.
13. Could engagement data ever be used later?
No.
Even post-MVP, this violates system integrity.
Communication tools do not get to judge behavior.
14. What’s the fastest way to know if a proposed change
is wrong?
Ask one question:
Does this make Mailchimp feel like a passive mirror — or an active
participant?
If it’s participating, influencing, suggesting, or reacting:
It does not belong in this system.

---

