# Screenshots → AI Interpretation Flow

**Description:** Screenshot upload lifecycle, interpretation pipeline, confirmation loop, downstream handoff

**Pages:** 174-191

---

## Page 174

Screenshots → AI Interpretation Flow

---

## Page 175

Read First (Purpose & Non‑Negotiables)
Job of this system:
Given a screenshot upload, define exactly how we convert pixels → structured context →
confirmed intent → downstream signals → actions without breaking system integrity.
Mental model: To the user, this should feel like handing context to a coach in real time — not
importing data, not configuring software, and not triggering automation.
This document exists to remove ambiguity for engineering, product, and QA. It describes not
just what the system does, but what it is explicitly forbidden from doing, and why those
constraints matter to the integrity of the overall RealCoach.ai architecture.
This system exists to:
● Reduce friction when users want to update situational context (notes, conversations,
schedules)
● Enable coaching, clarity, and decision support in the moment, not later
● Support the Daily Action Engine with richer context without turning uploads into setup,
data hygiene, or administrative work
● Preserve user trust by making interpretation visible, confirmable, and correctable
This system must never:
● Perform silent or automatic database writes
● Perform silent or automatic pipeline updates
● Guess intent and take action without user confirmation
● Become a backdoor CRM import mechanism
● Expand scope beyond real estate coaching, execution, and decision support
Screenshot interpretation is interactive by design. Interpretation alone does nothing.
Interpretation without confirmation does nothing. Only confirmed intent produces signals. Only
the Daily Action Engine turns signals into executable actions.
This separation is intentional and non‑negotiable.

---

## Page 176

5-Plain English

---

## Page 177

Scope (MVP)
Screenshots warrant their own dedicated flow because they are ambiguous, interpretive, and
coaching-adjacent — unlike structured uploads (e.g., CSVs), which are declarative and
operational. This document defines the complete MVP behavior for screenshot-based uploads
only.
This document defines the complete MVP behavior for screenshot-based uploads only.
Included
● Screenshot uploads (image files only)
● Uploads initiated directly inside the coaching side‑panel chat
● Maximum of 10 screenshots per upload event
● Single interpretation pass per upload event (simplicity over power)
● User‑provided prompt always takes precedence over system inference
● Interactive clarification, confirmation, and correction loop
● Downstream signaling to the Daily Action Engine and Coaching Behavior Engine
Explicitly Excluded
● CSV or structured file uploads (handled in separate Database & Pipeline logic)
● Bulk contact imports via screenshots
● Automatic creation of contacts, pipeline items, or production records
● Silent writes to Contacts, Pipeline, or Production
● General‑purpose image understanding or analysis
● Non–real estate coaching or lifestyle topics
These exclusions are deliberate and protect the system from scope creep.
Entry Point & UX Constraints
Where uploads happen
● The coaching chat side panel (fixed right‑side panel)
● Same affordance pattern as document upload in ChatGPT
● Always visible and available
● Never triggered, suggested, or prompted by calibration
Upload affordance rules

---

## Page 178

● Upload button is passive (no call‑to‑action copy)
● The system does not recommend or encourage uploading screenshots
● Uploads are strictly user‑initiated
● Uploading a screenshot is treated as a request for interpretation, not a command
Upload Lifecycle (Internal States)
The following states exist to guide rendering, async handling, retries, and downstream
behavior during the screenshot interpretation process. They are internal rendering and
behavior states, not user-selectable modes and not visible as system terminology.
They exist to guide UI rendering, messaging, and downstream behavior.
1. UPLOAD_IDLE – No active upload
2. UPLOAD_RECEIVED – Screenshot accepted by the system
3. UPLOAD_INTERPRETING – Vision/OCR analysis in progress
4. UPLOAD_NEEDS_CLARIFICATION – Intent unclear or missing
5. UPLOAD_AWAITING_CONFIRMATION – Interpretation complete, awaiting approval
6. UPLOAD_CONFIRMED – User has confirmed intent
7. UPLOAD_FAILED – Upload or interpretation error
The UI responds to these states while the user remains in the same coaching panel context at
all times.
Required User Context
Preferred behavior
Users explicitly tell the system why they are uploading the screenshot and what they want done.
Examples:
● “Here’s a recent conversation with the Jones’. Please update their contact card.”
● “This is my calendar this week. I’m overloaded — what should I do?”
● “Help me figure out how to follow up based on this text exchange.”
● “Does this look like a real appointment opportunity?”
Explicit context dramatically reduces friction and increases accuracy.

---

## Page 179

Missing or insufficient context behavior
If a screenshot is uploaded without a clear instruction, the coaching bot must pause
interpretation and ask:
“What would you like me to do with this?”
The system should offer suggested options based on inferred content, but must not proceed
until intent is clarified.
Interpretation Pipeline (High Level)
The screenshot interpretation pipeline proceeds in the following stages:
1. Image intake
2. OCR + vision analysis
3. Content classification
4. Plain‑English summary (“what I see”)
5. Intent resolution
6. Confirmation loop
7. Signal generation (draft only)
8. Handoff to downstream engines
At no point does interpretation itself mutate system state or create permanent records.
Step 1: Image Intake
● Accept up to 10 screenshots per upload
● Treat the full set as one contextual bundle, not independent interpretations
● Preserve upload order
● No cropping, no markup, no preprocessing
If image quality is insufficient or unreadable:
● Ask the user to re‑upload
● Explain why (blurry, cut off, unreadable text)
● Do not attempt automated enhancement or guessing

---

## Page 180

Step 2: OCR + Vision Analysis
Recommended approach
● Vision‑first understanding to detect layout and context
● OCR used to extract readable text where possible
Output of this step (internal only)
● Extracted text blocks
● Visual layout classification (conversation, calendar, list, table, mixed)
● Structural hints (participants, timestamps, columns)
● Confidence estimates
Raw OCR text is never shown directly to the user. Only synthesized interpretation is surfaced.
Step 3: Content Classification
The system attempts probabilistic classification into one or more of the following canonical MVP
types:
1. Text message conversation
2. WhatsApp / social DM conversation
3. Email thread screenshot
4. Calendar day view
5. Calendar week view
6. Notes app brain dump
7. CRM or contact list screenshot
8. Open house sign‑in photo
9. Spreadsheet‑style list (image‑based)
10. Mixed context (multiple categories present)
Classification is advisory only and always subordinate to user instruction.
Step 4: “Here’s What I See” (User‑Facing)
The system must always present a plain‑English interpretation for review. This card is the
only interpretation surface the user ever sees; no other UI surface may summarize,
reinterpret, or restate screenshot contents.

---

## Page 181

This is rendered as a collapsible card inside the coaching panel.
Here’s what I see:
● Concise bullet summary of the content
● People detected or inferred
● Relevant dates, times, or commitments
● Notable patterns (e.g., long gaps in response, overload, urgency)
If intent was inferred, the system must say so explicitly:
“I’m assuming you want help with follow‑up. Is that right?”
Transparency is mandatory.
Step 5: Intent Resolution
Priority order
1. User’s explicit prompt
2. Clarified intent via a single question
3. Inferred intent (requires confirmation)
If intent remains unclear
● Transition to UPLOAD_NEEDS_CLARIFICATION
● Ask one focused question
● Offer suggested actions
No multi‑question trees. No coaching until intent is resolved.
Step 6: Confirmation Loop (Mandatory)
Before any downstream effect, the system must explicitly confirm intent.
Examples:
● “Should I add this as a note to the Jones’ contact?”
● “Do you want help drafting a follow‑up text?”
● “Should I flag this as scheduling overload for today’s plan?”

---

## Page 182

Allowed responses:
● Yes
● Adjust
● No
Only Yes transitions the system to UPLOAD_CONFIRMED.
Step 7: Signal Generation (Draft Only)
Upon confirmation, the system generates draft signals, never actions.
Possible signal types include:
● Draft contact note
● Draft follow‑up suggestion
● Draft scheduling constraint
● Draft pipeline relevance indicator
● Draft coaching observation
Signals include metadata:
● Source: screenshot upload
● Timestamp
● Related contact (if resolved)
Signals remain invisible unless surfaced by downstream engines.
Step 8: Downstream Handoff
Daily Action Engine
● Receives signals as contextual inputs
● Determines whether to:
○ Propose contact updates
○ Suggest follow‑ups
○ Adjust today’s action plan
Coaching Behavior Engine

---

## Page 183

● May trigger coaching moves based on signal type
● Allowed to ask reflective or directive questions
Screenshot interpretation never prescribes actions directly.
Contact & Entity Resolution
When people are detected:
● Attempt fuzzy matching against existing contacts
● Never auto‑link or auto‑create
If a likely match exists:
“Is this the same Jones family already in your contacts?”
User confirmation is required before association.
Corrections & Learning
Users may correct interpretation at any time:
● “That’s not what this is.”
● “You missed something.”
● “This is actually about something else.”
Corrections:
● Immediately update the interpretation
● Are stored internally to improve future accuracy
● Never retroactively change past actions
Sensitive Content Rules
If sensitive content is detected:
● Mask sensitive fields
● Warn the user

---

## Page 184

● Do not store or propagate
Never interpret:
● Financial account numbers
● SSNs or government IDs
● Medical information
● Private data unrelated to real estate activity
Error Handling
● Upload failure → inline error with retry
● Interpretation failure → request re‑upload
● Timeout → visible “still working” state
● Duplicate upload → allowed, treated as new context
Rate Limits
● Max 10 screenshots per upload
● Max 10 uploads per day
Performance Expectations (UX Intent)
● Upload acknowledged immediately
● Interpretation feels “a few seconds”
● After ~10 seconds, show visible progress indicator
Guardrails Summary
● Daily Action Engine is the sole executor
● No silent writes, ever
● Interpretation ≠ action
● Confirmation is mandatory
● Screenshot uploads enhance clarity, not setup

---

## Page 185

Future Extension (Non‑MVP)
● Structured CSV contact uploads
● File‑based imports
● Bulk reconciliation workflows
These are intentionally excluded from this flow and governed by separate logic.

---

## Page 186

5-FAQ's

---

## Page 187

FAQ — Screenshots → AI Interpretation Flow (Developer)
Is this an upload or an action system?
It is neither.
This system is an interpretation and intent-confirmation layer. Uploading a screenshot does
not create data, trigger actions, or mutate state. It produces context and draft signals only, after
explicit user confirmation.
Why are screenshots handled differently than CSV uploads?
Screenshots are ambiguous and interpretive. They often require:
● Context
● Clarification
● Coaching judgment
● Human confirmation
CSV uploads are explicit and declarative. They represent a user’s intent to introduce
structured data.
For this reason:
● Screenshots flow through interpretation → confirmation → signals
● CSV uploads flow through validation → confirmation → persistence
These systems are intentionally separate to preserve integrity.
Can screenshot interpretation ever write directly to Contacts, Pipeline, or
Production?
No.

---

## Page 188

Screenshot interpretation never performs:
● Automatic contact creation
● Automatic contact updates
● Automatic pipeline creation or movement
● Automatic production updates
All writes must be explicitly requested and executed by the Daily Action Engine, never by the
screenshot interpreter.
What happens if a user uploads a screenshot without instructions?
The system must pause and ask a single clarifying question, such as:
“What would you like me to do with this?”
The system may offer suggested options based on inferred content, but it must not proceed
without clarified intent.
Can the AI infer intent on its own?
Yes — but inference is always subordinate to the user.
Rules:
● If the user provides instructions, follow them.
● If no instructions exist, infer intent and explicitly confirm before doing anything.
● Inferred intent without confirmation produces no signals.
What does “confirmation” actually unlock?
Confirmation allows the system to generate draft signals only, such as:

---

## Page 189

● Draft contact notes
● Draft follow-up suggestions
● Draft scheduling constraints
● Draft coaching observations
Confirmation does not:
● Execute actions
● Persist data
● Modify the database
Why is the “Here’s what I see” card mandatory?
Trust.
This card is the only interpretation surface the user ever sees. It ensures:
● Transparency
● Correctability
● User trust in the system’s reasoning
If the user cannot see what the AI saw, the system has failed.
Can users correct the interpretation?
Yes — and correction is a first-class behavior.
When a user says:
● “That’s wrong”

---

## Page 190

● “You missed something”
● “This isn’t about that”
The system must:
● Update the interpretation immediately
● Use the correction to improve future accuracy
● Never retroactively alter past actions
How does this system interact with the Coaching Behavior Engine?
Screenshot interpretation may trigger coaching only after intent is clear.
Examples:
● A chaotic calendar screenshot may trigger overload coaching
● A stalled text thread may trigger follow-up coaching
Coaching is allowed, but only after interpretation and confirmation.
How does this system interact with the Daily Action Engine?
The screenshot system feeds signals, not actions.
The Daily Action Engine decides:
● Whether an action is needed
● What the action should be
● Whether the user should be asked to update contacts or pipeline
The screenshot system never decides “what to do today.”

---

## Page 191

What happens if the screenshot contains multiple contexts?
The system must ask which part matters before interpreting further.
Example:
“This screenshot looks like a calendar and a text thread. Which should I focus on?”
No guessing. No splitting into multiple interpretations automatically.
Are screenshots stored permanently?
No.
Screenshots are deleted after interpretation. Only derived signals or learning data may persist.

---

