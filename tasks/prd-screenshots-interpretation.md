# PRD: Screenshots Interpretation v1

## Introduction/Overview

Users often have context trapped in screenshots—text conversations, calendars, notes, CRM exports—that would help the coach understand their situation. This feature allows users to upload screenshots directly in the coach panel, have the AI interpret what it sees, and—after explicit confirmation—generate signals that inform coaching and daily actions.

**Core principle**: Interpretation alone does nothing. Only confirmed intent produces signals. The Daily Action Engine remains the sole executor.

**Behavior spec reference**: `docs/behavior/06_Screenshots_Interpretation.md` (Pages 174-191)

## Goals

1. Enable users to share visual context without manual data entry
2. Provide transparent, correctable AI interpretation ("Here's What I See")
3. Generate coaching-relevant signals only after explicit user confirmation
4. Maintain system integrity: no silent writes, no automatic database mutations

## User Stories

1. **As a user**, I want to upload a screenshot of a text conversation so the coach understands my client situation without me typing it all out.

2. **As a user**, I want to upload my calendar screenshot so the coach can see I'm overloaded and adjust today's action accordingly.

3. **As a user**, I want to see what the AI interpreted from my screenshot before anything happens, so I can correct mistakes.

4. **As a user**, I want to tell the AI what to do with my screenshot (e.g., "add this to the Jones' contact") rather than have it guess.

5. **As a user**, I want to reject an interpretation if it's wrong, without any side effects.

## Functional Requirements

### 1. Upload Entry Point

1.1. Add an upload button in the CoachPanel chat interface (paperclip/image icon)

1.2. Upload button is passive (no promotional copy, no suggestions to upload)

1.3. Clicking opens native file picker filtered to image types (png, jpg, jpeg, gif, webp)

1.4. Support drag-and-drop onto the coach panel

1.5. Accept up to 10 images per upload event (treated as one contextual bundle)

### 2. Upload State Machine

Implement the following internal states:

| State | Description |
|-------|-------------|
| `UPLOAD_IDLE` | No active upload |
| `UPLOAD_RECEIVED` | Screenshot(s) accepted, preparing for analysis |
| `UPLOAD_INTERPRETING` | Vision/OCR analysis in progress |
| `UPLOAD_NEEDS_CLARIFICATION` | Intent unclear, asking user |
| `UPLOAD_AWAITING_CONFIRMATION` | Interpretation complete, awaiting approval |
| `UPLOAD_CONFIRMED` | User confirmed, generating signals |
| `UPLOAD_FAILED` | Error occurred |

2.1. Display appropriate UI for each state (loading spinner, cards, error messages)

2.2. After ~10 seconds in `UPLOAD_INTERPRETING`, show "Still working..." indicator

2.3. Allow user to cancel at any point before confirmation

### 3. Intent Resolution

3.1. If user provides a prompt with the upload (e.g., "Here's my conversation with the Jones'"), use that as explicit intent

3.2. If no prompt provided, transition to `UPLOAD_NEEDS_CLARIFICATION` and ask: "What would you like me to do with this?"

3.3. Offer suggested options based on detected content type (conversation, calendar, notes, etc.)

3.4. Never proceed to interpretation without clarified intent

### 4. Vision/OCR Pipeline

4.1. Send image(s) to Claude Vision API via existing `/api/llm` proxy

4.2. Extract: text content, visual layout classification, participants, timestamps, structural hints

4.3. Classify content into one of these MVP types:
   - Text message conversation
   - WhatsApp/social DM conversation
   - Email thread screenshot
   - Calendar day/week view
   - Notes app content
   - CRM or contact list
   - Open house sign-in photo
   - Spreadsheet-style list
   - Mixed context

4.4. Raw OCR text is never shown to user—only synthesized interpretation

### 5. "Here's What I See" Card

5.1. Render a collapsible card in the chat with the interpretation:
   - Concise bullet summary of content
   - People detected or inferred
   - Relevant dates, times, commitments
   - Notable patterns (gaps in response, overload, urgency)

5.2. If intent was inferred, explicitly state: "I'm assuming you want help with X. Is that right?"

5.3. Card must be the ONLY interpretation surface—no other UI may summarize screenshot contents

### 6. Confirmation Loop

6.1. Present three response options: **Yes**, **Adjust**, **No**

6.2. **Yes** → transition to `UPLOAD_CONFIRMED`, generate signals

6.3. **Adjust** → allow user to modify the interpretation or intent

6.4. **No** → discard interpretation, return to `UPLOAD_IDLE`

6.5. Confirmation is MANDATORY—no signals without explicit "Yes"

### 7. Signal Generation

7.1. Upon confirmation, generate draft signals (NOT database writes):
   - Draft contact note
   - Draft follow-up suggestion
   - Draft scheduling constraint
   - Draft pipeline relevance indicator
   - Draft coaching observation

7.2. Signals include metadata: source="screenshot", timestamp, related_contact (if resolved)

7.3. Signals are handed to Daily Action Engine for potential action proposals

7.4. Signals are handed to Coaching Behavior Engine for context

### 8. Contact Resolution

8.1. When people are detected, attempt fuzzy match against existing contacts

8.2. If match found, ask: "Is this the same [Name] already in your contacts?"

8.3. Never auto-link or auto-create contacts

8.4. User confirmation required before any association

### 9. Corrections

9.1. User can correct interpretation at any time: "That's not what this is"

9.2. Corrections immediately update the interpretation

9.3. Store corrections internally for future accuracy improvement

9.4. Never retroactively change past actions based on corrections

### 10. Error Handling

10.1. Upload failure → inline error with retry button

10.2. Interpretation failure → request re-upload with explanation

10.3. Image quality issues → ask user to re-upload, explain why (blurry, cut off)

10.4. Timeout → visible "still working" state, auto-retry

### 11. Rate Limits & Storage

11.1. Max 10 screenshots per upload event

11.2. Max 10 upload events per day per user

11.3. Store images temporarily in Supabase Storage during interpretation

11.4. Delete images after interpretation complete (no permanent storage)

## Non-Goals (Out of Scope)

**Critical**: These are explicitly forbidden per behavior spec:

- ❌ Silent or automatic database writes
- ❌ Silent or automatic pipeline updates
- ❌ Automatic contact creation
- ❌ Guessing intent and taking action without confirmation
- ❌ CSV or structured file uploads (separate feature)
- ❌ Bulk contact imports via screenshots
- ❌ General-purpose image analysis unrelated to real estate coaching
- ❌ Permanent screenshot storage
- ❌ Interpreting sensitive content (SSN, financial accounts, medical info)

## Design Considerations

### Upload Button Placement
- Small icon button (paperclip or image) in CoachPanel input area
- Positioned left of the text input, similar to ChatGPT's attachment pattern

### "Here's What I See" Card
```
┌─────────────────────────────────────────────┐
│ 📷 Here's what I see:                    [▼]│
├─────────────────────────────────────────────┤
│ • Text conversation with Sarah Jones        │
│ • Last message: Yesterday at 3:42 PM        │
│ • Topic: Scheduling a showing               │
│ • Pattern: 2-day gap since your last reply  │
│                                             │
│ I'm assuming you want help with follow-up.  │
│ Is that right?                              │
│                                             │
│ [Yes]  [Adjust]  [No]                       │
└─────────────────────────────────────────────┘
```

### Loading States
- `UPLOAD_RECEIVED`: "Processing your screenshot..."
- `UPLOAD_INTERPRETING`: "Analyzing content..." (with spinner)
- After 10s: "Still working on this one..."

## Technical Considerations

### 1. LLM Integration

Extend existing `/api/llm/route.ts` proxy to handle vision requests:

```typescript
// New endpoint or parameter for vision
POST /api/llm
{
  type: 'vision',
  images: [base64_encoded_images],
  prompt: 'Analyze this screenshot...',
  context: { ... }
}
```

### 2. New Files

| File | Purpose |
|------|---------|
| `src/types/screenshot.ts` | Upload states, signal types, interpretation schema |
| `src/lib/screenshot-interpreter.ts` | Interpretation pipeline, classification logic |
| `src/contexts/UploadContext.tsx` | Upload state management (or integrate into CoachingEngineContext) |
| `src/components/chat/InterpretationCard.tsx` | "Here's What I See" UI component |

### 3. Supabase Storage

Create a temporary bucket for screenshot uploads:
- Bucket: `screenshot-uploads`
- Policy: Authenticated users can upload/read own files
- Auto-delete: Files older than 1 hour

### 4. Signal Schema

```typescript
interface ScreenshotSignal {
  id: string;
  type: 'contact_note' | 'follow_up' | 'scheduling' | 'pipeline' | 'coaching';
  source: 'screenshot';
  timestamp: Date;
  content: string;
  related_contact_id?: string;
  confidence: number;
  metadata: {
    content_type: string;
    participants?: string[];
    dates?: string[];
  };
}
```

### 5. Dependencies

- Claude Vision API (claude-3-sonnet or claude-3-opus for vision)
- Supabase Storage for temporary image hosting
- Existing LLM proxy infrastructure

## Success Metrics

1. **Adoption**: >30% of active users try screenshot upload within first month
2. **Completion Rate**: >70% of uploads result in confirmed interpretation
3. **Accuracy**: <20% of interpretations require "Adjust" corrections
4. **Performance**: Interpretation completes in <15 seconds for single image
5. **Trust**: 0 reports of silent/unexpected database modifications

## Open Questions

1. Should we support screenshot paste (Ctrl+V) in addition to file upload?
2. Should interpreted signals expire if not acted upon within X days?
3. Should we show a preview thumbnail of uploaded screenshots in the chat?
4. How should we handle screenshots with multiple distinct contexts (e.g., calendar AND text thread)?
5. Should there be a "history" of past interpretations viewable somewhere?
