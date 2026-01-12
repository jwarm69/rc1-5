/**
 * RealCoach.ai - Screenshot Interpretation Types
 *
 * Types for the screenshot upload and interpretation feature.
 * Users upload screenshots (conversations, calendars, notes) and the AI
 * interprets them, generating signals only after explicit user confirmation.
 *
 * Key Non-Negotiables:
 * - NO silent database writes
 * - NO automatic contact/pipeline creation
 * - Interpretation alone does nothing - confirmation is MANDATORY
 * - Screenshots deleted after interpretation
 * - Signals go to Daily Action Engine, not directly to database
 */

// ============================================================================
// UPLOAD STATE MACHINE
// ============================================================================

/**
 * Upload lifecycle states.
 * The upload system is always in exactly one state.
 */
export type UploadState =
  | 'UPLOAD_IDLE'                    // No active upload
  | 'UPLOAD_RECEIVED'                // Screenshot(s) accepted, preparing for analysis
  | 'UPLOAD_INTERPRETING'            // Vision/OCR analysis in progress
  | 'UPLOAD_NEEDS_CLARIFICATION'     // Intent unclear, asking user
  | 'UPLOAD_AWAITING_CONFIRMATION'   // Interpretation complete, awaiting approval
  | 'UPLOAD_CONFIRMED'               // User confirmed, generating signals
  | 'UPLOAD_FAILED';                 // Error occurred

/**
 * Valid state transitions for the upload state machine
 */
export const UPLOAD_STATE_TRANSITIONS: Record<UploadState, UploadState[]> = {
  UPLOAD_IDLE: ['UPLOAD_RECEIVED'],
  UPLOAD_RECEIVED: ['UPLOAD_INTERPRETING', 'UPLOAD_NEEDS_CLARIFICATION', 'UPLOAD_IDLE'],
  UPLOAD_INTERPRETING: ['UPLOAD_AWAITING_CONFIRMATION', 'UPLOAD_NEEDS_CLARIFICATION', 'UPLOAD_FAILED'],
  UPLOAD_NEEDS_CLARIFICATION: ['UPLOAD_INTERPRETING', 'UPLOAD_IDLE'],
  UPLOAD_AWAITING_CONFIRMATION: ['UPLOAD_CONFIRMED', 'UPLOAD_NEEDS_CLARIFICATION', 'UPLOAD_IDLE'],
  UPLOAD_CONFIRMED: ['UPLOAD_IDLE'],
  UPLOAD_FAILED: ['UPLOAD_IDLE', 'UPLOAD_RECEIVED'],
};

// ============================================================================
// CONTENT CLASSIFICATION
// ============================================================================

/**
 * Content types for screenshot classification.
 * The AI categorizes uploaded screenshots into one of these types.
 */
export type ContentType =
  | 'text_conversation'     // SMS/iMessage text conversation
  | 'social_dm'             // WhatsApp, Instagram, Facebook DMs
  | 'email_thread'          // Email conversation screenshot
  | 'calendar_day'          // Single day calendar view
  | 'calendar_week'         // Week calendar view
  | 'notes'                 // Notes app content
  | 'crm_list'              // CRM or contact list screenshot
  | 'open_house_signin'     // Open house sign-in sheet photo
  | 'spreadsheet'           // Spreadsheet-style data
  | 'mixed'                 // Multiple content types in one image
  | 'unknown';              // Unclassifiable content

/**
 * Content type descriptions for UI display
 */
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  text_conversation: 'Text Conversation',
  social_dm: 'Social Media Message',
  email_thread: 'Email Thread',
  calendar_day: 'Calendar (Day)',
  calendar_week: 'Calendar (Week)',
  notes: 'Notes',
  crm_list: 'Contact List',
  open_house_signin: 'Open House Sign-In',
  spreadsheet: 'Spreadsheet',
  mixed: 'Mixed Content',
  unknown: 'Unknown',
};

// ============================================================================
// UPLOADED IMAGE
// ============================================================================

/**
 * Represents a single uploaded image in the upload queue
 */
export interface UploadedImage {
  /** Unique identifier for this image */
  id: string;
  /** Original file object */
  file: File;
  /** Local preview URL (blob URL) */
  previewUrl: string;
  /** Base64 encoded image data */
  base64?: string;
  /** MIME type of the image */
  mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
  /** Supabase storage URL (if uploaded) */
  storageUrl?: string;
}

// ============================================================================
// SCREENSHOT INTERPRETATION
// ============================================================================

/**
 * Pattern types detected in screenshots
 */
export type PatternType =
  | 'response_gap'          // Long gap since user's last reply
  | 'overdue_followup'      // Follow-up that's overdue
  | 'calendar_overload'     // Too many events scheduled
  | 'urgency_signal'        // Urgent language or time pressure
  | 'commitment_made'       // User made a commitment
  | 'question_unanswered'   // Question left unanswered
  | 'multiple_contacts';    // Multiple people mentioned

/**
 * A pattern detected in the screenshot content
 */
export interface DetectedPattern {
  type: PatternType;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Result of AI interpretation of uploaded screenshot(s)
 */
export interface ScreenshotInterpretation {
  /** Unique identifier for this interpretation */
  id: string;
  /** Classified content type */
  contentType: ContentType;
  /** Bullet point summary (max 5 items) */
  summary: string[];
  /** Names of people detected in the screenshot */
  peopleDetected: string[];
  /** Dates/times detected (ISO format) */
  datesDetected: string[];
  /** Notable patterns identified */
  patterns: DetectedPattern[];
  /** What the AI thinks the user wants to do */
  inferredIntent?: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Raw analysis text from LLM (for debugging) */
  rawAnalysis?: string;
}

// ============================================================================
// SCREENSHOT SIGNALS
// ============================================================================

/**
 * Signal types that can be generated from screenshot interpretation.
 * These go to the Daily Action Engine, NOT directly to the database.
 */
export type SignalType =
  | 'contact_note'    // Note to add to a contact
  | 'follow_up'       // Follow-up action needed
  | 'scheduling'      // Scheduling-related signal
  | 'pipeline'        // Pipeline stage update signal
  | 'coaching';       // Coaching observation signal

/**
 * A signal generated from screenshot interpretation.
 * Signals are drafts - they inform the Daily Action Engine but don't
 * directly modify the database.
 */
export interface ScreenshotSignal {
  /** Unique identifier */
  id: string;
  /** Type of signal */
  type: SignalType;
  /** Source is always 'screenshot' for these signals */
  source: 'screenshot';
  /** When the signal was generated */
  timestamp: Date;
  /** Human-readable content of the signal */
  content: string;
  /** Related contact ID if resolved */
  relatedContactId?: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Additional metadata */
  metadata: {
    /** Content type from interpretation */
    contentType: ContentType;
    /** Participants mentioned */
    participants?: string[];
    /** Relevant dates */
    dates?: string[];
    /** Original interpretation ID */
    interpretationId: string;
  };
}

// ============================================================================
// UPLOAD CONTEXT STATE
// ============================================================================

/**
 * Complete state for the upload context
 */
export interface UploadContextState {
  /** Current upload state */
  uploadState: UploadState;
  /** Queue of uploaded images (max 10) */
  images: UploadedImage[];
  /** User's stated intent (if provided) */
  userIntent?: string;
  /** AI interpretation result */
  interpretation?: ScreenshotInterpretation;
  /** Generated signals (after confirmation) */
  signals?: ScreenshotSignal[];
  /** Error message if failed */
  error?: string;
  /** Number of uploads today */
  dailyUploadCount: number;
  /** Last upload date for daily limit tracking */
  lastUploadDate?: string;
}

/**
 * Initial state for upload context
 */
export const INITIAL_UPLOAD_STATE: UploadContextState = {
  uploadState: 'UPLOAD_IDLE',
  images: [],
  dailyUploadCount: 0,
};

// ============================================================================
// LIMITS AND CONSTRAINTS
// ============================================================================

/** Maximum images per upload event */
export const MAX_IMAGES_PER_UPLOAD = 10;

/** Maximum upload events per day */
export const MAX_UPLOADS_PER_DAY = 10;

/** Maximum file size in bytes (10MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
] as const;

/** Interpretation timeout in milliseconds (30 seconds) */
export const INTERPRETATION_TIMEOUT_MS = 30000;

/** "Still working" indicator threshold in milliseconds (10 seconds) */
export const STILL_WORKING_THRESHOLD_MS = 10000;

// ============================================================================
// CONTACT MATCHING
// ============================================================================

/**
 * A potential contact match from fuzzy matching
 */
export interface ContactMatch {
  /** Contact ID from database */
  contactId: string;
  /** Contact name */
  name: string;
  /** Match confidence 0-1 */
  confidence: number;
  /** Whether this match was confirmed by user */
  confirmed: boolean;
}

// ============================================================================
// ACTION TYPES FOR REDUCER
// ============================================================================

/**
 * Actions for the upload context reducer
 */
export type UploadAction =
  | { type: 'ADD_IMAGES'; payload: UploadedImage[] }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'SET_USER_INTENT'; payload: string }
  | { type: 'START_INTERPRETATION' }
  | { type: 'SET_INTERPRETATION'; payload: ScreenshotInterpretation }
  | { type: 'NEEDS_CLARIFICATION' }
  | { type: 'CONFIRM_INTERPRETATION' }
  | { type: 'SET_SIGNALS'; payload: ScreenshotSignal[] }
  | { type: 'ADJUST_INTERPRETATION'; payload: string }
  | { type: 'REJECT_INTERPRETATION' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' }
  | { type: 'INCREMENT_DAILY_COUNT' };
