# Tasks: Screenshots Interpretation v1

Generated from `prd-screenshots-interpretation.md`

## Relevant Files

- `src/components/layout/CoachPanel.tsx` - Main chat interface, add upload button here
- `src/types/screenshot.ts` - New file for upload states, signal types
- `src/lib/screenshot-interpreter.ts` - New file for interpretation pipeline
- `src/contexts/UploadContext.tsx` - New file for upload state management
- `src/components/chat/InterpretationCard.tsx` - New file for "Here's What I See" UI
- `api/llm/route.ts` - Extend to handle vision requests
- `src/lib/llm/client.ts` - Add vision API methods
- `src/lib/llm/prompts.ts` - Add screenshot interpretation prompts

### Notes

- This feature uses Claude Vision API via the existing LLM proxy
- Screenshots are stored temporarily in Supabase Storage, then deleted
- NO database writes happen without explicit user confirmation
- Signals go to Daily Action Engine, not directly to database

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

### Phase 0: Setup

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout: `git checkout -b feature/screenshots-interpretation`
  - [ ] 0.2 Verify branch: `git branch --show-current`

- [ ] 0.1 Create Supabase Storage bucket
  - [ ] 0.1.1 Go to Supabase Dashboard → Storage
  - [ ] 0.1.2 Create bucket named `screenshot-uploads`
  - [ ] 0.1.3 Set bucket to private (not public)
  - [ ] 0.1.4 Add RLS policy: authenticated users can upload/read own files
  - [ ] 0.1.5 Configure lifecycle rule: auto-delete files older than 1 hour (if supported)

---

### Phase 1: Type Definitions

- [ ] 1.0 Create screenshot types file
  - [ ] 1.1 Create `src/types/screenshot.ts`
  - [ ] 1.2 Define `UploadState` enum:
    ```typescript
    export type UploadState =
      | 'UPLOAD_IDLE'
      | 'UPLOAD_RECEIVED'
      | 'UPLOAD_INTERPRETING'
      | 'UPLOAD_NEEDS_CLARIFICATION'
      | 'UPLOAD_AWAITING_CONFIRMATION'
      | 'UPLOAD_CONFIRMED'
      | 'UPLOAD_FAILED';
    ```
  - [ ] 1.3 Define `ContentType` enum for classification:
    ```typescript
    export type ContentType =
      | 'text_conversation'
      | 'social_dm'
      | 'email_thread'
      | 'calendar_day'
      | 'calendar_week'
      | 'notes'
      | 'crm_list'
      | 'open_house_signin'
      | 'spreadsheet'
      | 'mixed'
      | 'unknown';
    ```
  - [ ] 1.4 Define `ScreenshotInterpretation` interface:
    ```typescript
    export interface ScreenshotInterpretation {
      id: string;
      contentType: ContentType;
      summary: string[];           // Bullet points
      peopleDetected: string[];
      datesDetected: string[];
      patterns: string[];          // Notable observations
      inferredIntent?: string;
      confidence: number;          // 0-1
    }
    ```
  - [ ] 1.5 Define `ScreenshotSignal` interface:
    ```typescript
    export interface ScreenshotSignal {
      id: string;
      type: 'contact_note' | 'follow_up' | 'scheduling' | 'pipeline' | 'coaching';
      source: 'screenshot';
      timestamp: Date;
      content: string;
      relatedContactId?: string;
      confidence: number;
      metadata: {
        contentType: ContentType;
        participants?: string[];
        dates?: string[];
      };
    }
    ```
  - [ ] 1.6 Define `UploadedImage` interface:
    ```typescript
    export interface UploadedImage {
      id: string;
      file: File;
      previewUrl: string;
      storageUrl?: string;
    }
    ```
  - [ ] 1.7 Run TypeScript check: `npx tsc --noEmit`

---

### Phase 2: Upload Context

- [ ] 2.0 Create upload state context
  - [ ] 2.1 Create `src/contexts/UploadContext.tsx`
  - [ ] 2.2 Define context state:
    ```typescript
    interface UploadContextState {
      uploadState: UploadState;
      images: UploadedImage[];
      userIntent?: string;
      interpretation?: ScreenshotInterpretation;
      error?: string;
    }
    ```
  - [ ] 2.3 Implement context actions:
    - `addImages(files: File[])`
    - `removeImage(id: string)`
    - `setUserIntent(intent: string)`
    - `startInterpretation()`
    - `confirmInterpretation()`
    - `adjustInterpretation(newIntent: string)`
    - `rejectInterpretation()`
    - `reset()`
  - [ ] 2.4 Implement state machine transitions with validation
  - [ ] 2.5 Add 10-image limit enforcement
  - [ ] 2.6 Add daily upload limit tracking (10 per day)
  - [ ] 2.7 Wire up to App.tsx provider tree
  - [ ] 2.8 Test context isolation with React DevTools

---

### Phase 3: LLM Vision Integration

- [ ] 3.0 Extend LLM proxy for vision
  - [ ] 3.1 Read current `api/llm/route.ts` implementation
  - [ ] 3.2 Add vision request type handling:
    ```typescript
    if (body.type === 'vision') {
      // Handle vision request with images
    }
    ```
  - [ ] 3.3 Format images for Claude Vision API (base64 with media type)
  - [ ] 3.4 Add vision-specific rate limiting (separate from text)
  - [ ] 3.5 Test with sample image upload

- [ ] 3.1 Add client-side vision methods
  - [ ] 3.1.1 Read current `src/lib/llm/client.ts`
  - [ ] 3.1.2 Add `interpretScreenshot()` method:
    ```typescript
    async interpretScreenshot(
      images: string[],  // base64
      userIntent?: string,
      context?: CoachingContext
    ): Promise<ScreenshotInterpretation>
    ```
  - [ ] 3.1.3 Handle streaming response for interpretation
  - [ ] 3.1.4 Add timeout handling (30 second max)

- [ ] 3.2 Create interpretation prompts
  - [ ] 3.2.1 Read current `src/lib/llm/prompts.ts`
  - [ ] 3.2.2 Add `buildScreenshotInterpretationPrompt()`:
    - Include content type classification instructions
    - Include person detection instructions
    - Include date/time extraction instructions
    - Include pattern recognition instructions
    - Enforce "synthesize, don't show raw OCR" rule
  - [ ] 3.2.3 Add `buildClarificationPrompt()` for unclear intent
  - [ ] 3.2.4 Add tests for prompt construction

---

### Phase 4: Interpretation Pipeline

- [ ] 4.0 Create screenshot interpreter
  - [ ] 4.1 Create `src/lib/screenshot-interpreter.ts`
  - [ ] 4.2 Implement `classifyContent()`:
    - Parse LLM response for content type
    - Return ContentType enum value
  - [ ] 4.3 Implement `extractPeople()`:
    - Parse names from interpretation
    - Return array of detected names
  - [ ] 4.4 Implement `extractDates()`:
    - Parse dates/times from interpretation
    - Normalize to ISO format
  - [ ] 4.5 Implement `detectPatterns()`:
    - Identify gaps in conversation
    - Identify overload signals
    - Identify urgency signals
  - [ ] 4.6 Implement `generateSummary()`:
    - Create concise bullet points
    - Max 5 bullets per interpretation
  - [ ] 4.7 Implement `matchContacts()`:
    - Fuzzy match detected names against user's contacts
    - Return potential matches with confidence scores
  - [ ] 4.8 Add unit tests for each function

---

### Phase 5: Signal Generation

- [ ] 5.0 Implement signal generation
  - [ ] 5.1 Add `generateSignals()` to screenshot-interpreter.ts:
    ```typescript
    function generateSignals(
      interpretation: ScreenshotInterpretation,
      confirmedIntent: string,
      resolvedContactId?: string
    ): ScreenshotSignal[]
    ```
  - [ ] 5.2 Implement signal type selection logic:
    - Conversation with follow-up gap → `follow_up` signal
    - Calendar overload → `scheduling` signal
    - Contact info detected → `contact_note` signal
    - Pipeline-relevant info → `pipeline` signal
    - Coaching-relevant insight → `coaching` signal
  - [ ] 5.3 Add signal metadata population
  - [ ] 5.4 Add signal handoff to Daily Action Engine:
    - Create `src/lib/signal-handler.ts` if needed
    - Integrate with existing action generation
  - [ ] 5.5 Add signal handoff to Coaching Behavior Engine
  - [ ] 5.6 Add unit tests for signal generation

---

### Phase 6: UI Components

- [ ] 6.0 Create InterpretationCard component
  - [ ] 6.1 Create `src/components/chat/InterpretationCard.tsx`
  - [ ] 6.2 Implement collapsible card structure:
    - Header: "📷 Here's what I see:" with collapse toggle
    - Body: Bullet list of summary items
    - People section (if detected)
    - Dates section (if detected)
    - Patterns section (if notable)
    - Inferred intent disclosure
  - [ ] 6.3 Add confirmation buttons: Yes / Adjust / No
  - [ ] 6.4 Style to match existing chat card components
  - [ ] 6.5 Add loading state variant
  - [ ] 6.6 Add error state variant
  - [ ] 6.7 Add accessibility (ARIA labels, keyboard nav)

- [ ] 6.1 Create upload preview component
  - [ ] 6.1.1 Create `src/components/chat/UploadPreview.tsx`
  - [ ] 6.1.2 Show thumbnail grid of uploaded images
  - [ ] 6.1.3 Add remove button for each image
  - [ ] 6.1.4 Show upload count (e.g., "3 of 10 max")

- [ ] 6.2 Create clarification prompt component
  - [ ] 6.2.1 Create `src/components/chat/ClarificationPrompt.tsx`
  - [ ] 6.2.2 Display "What would you like me to do with this?"
  - [ ] 6.2.3 Show suggested options based on content type
  - [ ] 6.2.4 Allow free-form text input

---

### Phase 7: CoachPanel Integration

- [ ] 7.0 Add upload button to CoachPanel
  - [ ] 7.0.1 Read current `src/components/layout/CoachPanel.tsx`
  - [ ] 7.0.2 Add paperclip/image icon button left of text input
  - [ ] 7.0.3 Wire button to hidden file input
  - [ ] 7.0.4 Filter file input to images: `accept="image/png,image/jpeg,image/gif,image/webp"`
  - [ ] 7.0.5 Handle file selection → add to UploadContext
  - [ ] 7.0.6 Style button to be passive (no promotional styling)

- [ ] 7.1 Add drag-and-drop support
  - [ ] 7.1.1 Add drop zone to CoachPanel
  - [ ] 7.1.2 Show visual indicator when dragging over
  - [ ] 7.1.3 Handle drop → add files to UploadContext
  - [ ] 7.1.4 Validate dropped files are images

- [ ] 7.2 Integrate upload flow into chat
  - [ ] 7.2.1 When images added, show UploadPreview in chat
  - [ ] 7.2.2 Allow text input alongside images (user intent)
  - [ ] 7.2.3 On send with images → start interpretation flow
  - [ ] 7.2.4 Show loading state during interpretation
  - [ ] 7.2.5 Show InterpretationCard when complete
  - [ ] 7.2.6 Handle confirmation buttons
  - [ ] 7.2.7 Show success message after signal generation
  - [ ] 7.2.8 Reset upload state after completion

- [ ] 7.3 Add timeout handling
  - [ ] 7.3.1 After 10 seconds, show "Still working..." message
  - [ ] 7.3.2 After 30 seconds, show timeout error with retry
  - [ ] 7.3.3 Add cancel button during interpretation

---

### Phase 8: Supabase Storage Integration

- [ ] 8.0 Implement image upload to storage
  - [ ] 8.0.1 Create `src/lib/screenshot-storage.ts`
  - [ ] 8.0.2 Implement `uploadScreenshot()`:
    - Generate unique filename with user_id prefix
    - Upload to `screenshot-uploads` bucket
    - Return storage URL
  - [ ] 8.0.3 Implement `deleteScreenshot()`:
    - Remove file from storage by URL
  - [ ] 8.0.4 Implement `cleanupScreenshots()`:
    - Delete all screenshots for current interpretation
    - Called after interpretation complete (success or failure)

- [ ] 8.1 Wire storage into upload flow
  - [ ] 8.1.1 Upload images to storage when interpretation starts
  - [ ] 8.1.2 Use storage URLs for LLM vision API
  - [ ] 8.1.3 Delete images after interpretation complete
  - [ ] 8.1.4 Handle storage errors gracefully

---

### Phase 9: Error Handling

- [ ] 9.0 Implement error states
  - [ ] 9.0.1 Upload failure → show retry button
  - [ ] 9.0.2 Interpretation failure → suggest re-upload
  - [ ] 9.0.3 Image quality issues → explain why (blurry, cut off)
  - [ ] 9.0.4 Rate limit exceeded → show daily limit message
  - [ ] 9.0.5 Network errors → show connectivity message

- [ ] 9.1 Add error tracking
  - [ ] 9.1.1 Log interpretation errors with metadata
  - [ ] 9.1.2 Track failure rates for monitoring
  - [ ] 9.1.3 Add error recovery suggestions

---

### Phase 10: Testing

- [ ] 10.0 Unit tests
  - [ ] 10.0.1 Test UploadContext state transitions
  - [ ] 10.0.2 Test screenshot-interpreter functions
  - [ ] 10.0.3 Test signal generation logic
  - [ ] 10.0.4 Test prompt construction
  - [ ] 10.0.5 Test storage functions

- [ ] 10.1 Integration tests
  - [ ] 10.1.1 Test full upload → interpret → confirm flow
  - [ ] 10.1.2 Test upload → interpret → reject flow
  - [ ] 10.1.3 Test upload → clarification → interpret flow
  - [ ] 10.1.4 Test error recovery flows

- [ ] 10.2 Manual testing
  - [ ] 10.2.1 Test with text conversation screenshot
  - [ ] 10.2.2 Test with calendar screenshot
  - [ ] 10.2.3 Test with notes screenshot
  - [ ] 10.2.4 Test with low-quality image
  - [ ] 10.2.5 Test with 10 images (max)
  - [ ] 10.2.6 Test daily limit enforcement
  - [ ] 10.2.7 Verify no database writes without confirmation

---

### Phase 11: Final Verification

- [ ] 11.0 Code quality
  - [ ] 11.0.1 TypeScript check: `npx tsc --noEmit`
  - [ ] 11.0.2 Lint check: `npm run lint`
  - [ ] 11.0.3 All tests pass: `npm test`
  - [ ] 11.0.4 Build succeeds: `npm run build`

- [ ] 11.1 Behavior verification
  - [ ] 11.1.1 Confirm: NO silent database writes
  - [ ] 11.1.2 Confirm: Interpretation requires confirmation
  - [ ] 11.1.3 Confirm: Screenshots deleted after interpretation
  - [ ] 11.1.4 Confirm: Signals go to action engine, not DB directly

- [ ] 11.2 Create PR
  - [ ] 11.2.1 Write PR description with test evidence
  - [ ] 11.2.2 Include screenshots of UI
  - [ ] 11.2.3 Request review

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Upload button appears in CoachPanel
- [ ] Can upload up to 10 images
- [ ] "Here's What I See" card renders with interpretation
- [ ] Yes/Adjust/No buttons work correctly
- [ ] Signals are generated only after "Yes"
- [ ] No database modifications without explicit confirmation
- [ ] Screenshots are deleted from storage after interpretation
- [ ] Daily upload limit (10) is enforced
- [ ] All tests pass
- [ ] Build succeeds
