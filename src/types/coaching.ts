/**
 * RealCoach.ai - Coaching Types
 *
 * Core TypeScript types derived from the AI Behavior Engine documentation.
 * These types define the coaching behavior, calibration flow, and daily action engine.
 *
 * Key Non-Negotiables:
 * - One question at a time (multi-question prompts are broken)
 * - Reflect → Confirm → Proceed (never skip understanding)
 * - No daily actions before G&A confirmation (hard gate)
 * - No urgency ever rendered (no timers, streaks, overdue labels)
 */

// ============================================================================
// COACHING MODES (State Machine)
// ============================================================================

/**
 * Coaching modes represent the conversation behavior state.
 * The coach is always in exactly one mode. Modes do not stack, overlap, or blur.
 */
export type CoachMode =
  | 'CLARIFY'   // Remove ambiguity - ask one question only, no advice
  | 'REFLECT'   // Demonstrate understanding - mirror facts + one confirmation question
  | 'REFRAME'   // Restore perspective - reframe behavior (not identity), no questions
  | 'COMMIT'    // Translate insight into action - one commitment, user must agree
  | 'DIRECT';   // Deliver clear actions - no questions, no coaching language

/**
 * Allowed mode transitions - defines valid state machine paths
 */
export const ALLOWED_MODE_TRANSITIONS: Record<CoachMode, CoachMode[]> = {
  CLARIFY: ['REFLECT'],
  REFLECT: ['REFRAME', 'COMMIT'],
  REFRAME: ['COMMIT'],
  COMMIT: ['DIRECT'],
  DIRECT: ['CLARIFY', 'REFLECT'], // depends on new user input
};

/**
 * Mode-specific rules and constraints
 */
export const MODE_RULES: Record<CoachMode, {
  maxQuestions: number;
  allowAdvice: boolean;
  allowReframe: boolean;
  allowDirection: boolean;
  mustMirror?: boolean;
  allowInterpretation?: boolean;
  reframeBehaviorNotIdentity?: boolean;
  reduceEmotionalNoise?: boolean;
  maxCommitments?: number;
  requireExplicitAgreement?: boolean;
  maySetPriorityContext?: boolean;
  allowCoachingLanguage?: boolean;
  allowReprioritization?: boolean;
  maxSecondaryActions?: number;
}> = {
  CLARIFY: {
    maxQuestions: 1,
    allowAdvice: false,
    allowReframe: false,
    allowDirection: false,
  },
  REFLECT: {
    maxQuestions: 1, // confirmation only
    allowAdvice: false,
    allowReframe: false,
    allowDirection: false,
    mustMirror: true,
    allowInterpretation: false,
  },
  REFRAME: {
    maxQuestions: 0,
    allowAdvice: false,
    allowReframe: true,
    allowDirection: false,
    reframeBehaviorNotIdentity: true,
    reduceEmotionalNoise: true,
  },
  COMMIT: {
    maxQuestions: 1,
    allowAdvice: false,
    allowReframe: false,
    allowDirection: false,
    maxCommitments: 1,
    requireExplicitAgreement: true,
    maySetPriorityContext: true,
  },
  DIRECT: {
    maxQuestions: 0,
    allowAdvice: false,
    allowReframe: false,
    allowDirection: true,
    allowCoachingLanguage: false,
    allowReprioritization: false,
    maxSecondaryActions: 2,
  },
};

// ============================================================================
// COACHING MOVES (Intervention Lens)
// ============================================================================

/**
 * Coaching moves describe how the coach intervenes once a pattern is detected.
 * Only one move is applied at a time - they are lenses, not scripts or steps.
 */
export type CoachingMove =
  | 'FOCUS'     // Collapse to what matters most (overwhelm pattern)
  | 'AGENCY'    // Restore choice and ownership (externalized control pattern)
  | 'IDENTITY'  // Align action with who they're becoming (self-story pattern)
  | 'EASE'      // Lower friction to enable action (resistance pattern)
  | 'NONE';     // No move being applied (e.g., DIRECT-only delivery)

/**
 * Signals detected from user's current language (not stated goals)
 */
export interface MoveSignals {
  overwhelm: boolean;           // Many competing priorities
  externalizedControl: boolean; // "Nothing I can do", circumstances decide
  selfStory: boolean;           // "This is just how I am", consistency identity
  resistance: boolean;          // Knows task, can't start
  emotionalLoadHigh: boolean;   // Optional support signal
  clarityLow: boolean;          // Optional support signal
}

/**
 * Deterministic move selection based on signals
 * Priority order: clarity → agency → identity → focus → ease
 */
export function chooseCoachingMove(signals: MoveSignals): CoachingMove {
  if (signals.clarityLow) return 'NONE';
  if (signals.externalizedControl) return 'AGENCY';
  if (signals.selfStory) return 'IDENTITY';
  if (signals.overwhelm) return 'FOCUS';
  if (signals.resistance) return 'EASE';
  return 'NONE';
}

// ============================================================================
// USER CALIBRATION STATES
// ============================================================================

/**
 * User calibration states - defines where the user is in the onboarding process.
 * CRITICAL: No daily actions allowed before G&A_CONFIRMED state.
 */
export type UserState =
  | 'UNINITIALIZED'           // Brand new, no calibration started
  | 'CALIBRATING'             // Actively collecting inputs, no tasks
  | 'G&A_DRAFTED'             // AI created draft Goals & Actions tab
  | 'G&A_CONFIRMED'           // User confirmed/edit-approved G&A
  | 'ACTIONS_ACTIVE'          // Daily Action Engine enabled
  | 'RECALIBRATION_REQUIRED'; // Major drift detected, actions continue with warning

/**
 * Calibration tone preference - affects phrasing, not logic
 */
export type CalibrationTone =
  | 'DIRECT_EXECUTIVE'     // Direct, executive style
  | 'COACH_CONCISE'        // Coach-like but concise
  | 'NEUTRAL_MINIMAL';     // Neutral, minimal

// ============================================================================
// GOALS & ACTIONS (G&A)
// ============================================================================

/**
 * Goals & Actions document - the strategic execution surface
 * Created during calibration, gates daily action generation
 */
export interface GoalsAndActions {
  // Annual Professional Goal - the north star
  annualProfessionalGoal: string;

  // Personal constraint or goal that business must respect
  annualPersonalGoal: string | null;

  // Current execution milestone (30-day focus)
  monthlyMilestone: string;

  // Execution style preference
  executionStyle: 'STRUCTURED' | 'FLEXIBLE' | 'SHORT_BURSTS' | 'SLOW_CONSISTENT';

  // What they're willing to do consistently
  willingnessFilter: string[];

  // What to avoid (friction boundaries)
  frictionBoundaries: string[];

  // Current reality snapshot - what feels fragile or important
  currentReality: string;

  // Draft vs confirmed status
  status: 'DRAFT' | 'CONFIRMED';

  // Timestamps
  createdAt: Date;
  confirmedAt: Date | null;
}

/**
 * The 7 Core G&A Calibration Questions
 */
export const GA_CALIBRATION_QUESTIONS = [
  {
    id: 'annual_professional_goal',
    question: "If this year goes right professionally, what must be true by the end of it?",
    creates: 'annualProfessionalGoal',
  },
  {
    id: 'annual_personal_goal',
    question: "What personal priority or constraint does your business need to respect this year?",
    creates: 'annualPersonalGoal',
  },
  {
    id: 'current_reality',
    question: "Right now, what feels most fragile or most important in your business?",
    creates: 'currentReality',
  },
  {
    id: 'monthly_milestone',
    question: "Over the next 30 days, what outcome would make everything else feel easier?",
    creates: 'monthlyMilestone',
  },
  {
    id: 'execution_style',
    question: "When it comes to making progress, what style actually works for you?",
    creates: 'executionStyle',
  },
  {
    id: 'willingness_filter',
    question: "What are you actually willing to do consistently — even when motivation is low?",
    creates: 'willingnessFilter',
  },
  {
    id: 'friction_boundary',
    question: "What should I avoid suggesting because it will create resistance or burnout?",
    creates: 'frictionBoundaries',
  },
] as const;

// ============================================================================
// BUSINESS PLAN
// ============================================================================

/**
 * Business Plan - economic model and strategic guardrails
 * Sharpens daily actions but never blocks them
 */
export interface BusinessPlan {
  // Revenue target (inherited from G&A or confirmed)
  revenueTarget: number;

  // Average revenue per transaction
  revenuePerUnit: number;

  // Buyer/Seller weighting (default 60/40)
  buyerSellerSplit: { buyer: number; seller: number };

  // Lead sources that produce business
  leadSources: string[];

  // Lead generation style
  leadGenStyle: 'RELATIONSHIP_BASED' | 'PROSPECTING_DRIVEN' | 'MARKETING_DRIVEN' | 'HYBRID';

  // Economic detail preference
  detailPreference: 'ROUGH' | 'DETAILED';

  // Risk tolerance / execution pace
  riskTolerance: 'AGGRESSIVE_GROWTH' | 'STEADY_PREDICTABLE';

  // Economic red lines (hard no's)
  economicRedLines: string[];

  // Status
  status: 'DRAFT' | 'CONFIRMED';
}

/**
 * The 8 Core Business Plan Calibration Questions
 */
export const BUSINESS_PLAN_QUESTIONS = [
  {
    id: 'revenue_confirmation',
    question: "I'm using your annual revenue goal from earlier. Is that still correct, or do you want to adjust it?",
    creates: 'revenueTarget',
  },
  {
    id: 'revenue_per_unit',
    question: "Roughly how much do you earn per transaction, on average?",
    creates: 'revenuePerUnit',
  },
  {
    id: 'buyer_seller_split',
    question: "Is most of your business sellers, buyers, or a mix?",
    creates: 'buyerSellerSplit',
  },
  {
    id: 'lead_sources',
    question: "What lead sources currently produce most of your business?",
    creates: 'leadSources',
  },
  {
    id: 'lead_gen_style',
    question: "When it comes to lead generation, what style actually fits you?",
    creates: 'leadGenStyle',
  },
  {
    id: 'detail_preference',
    question: "Do you prefer working with rough assumptions, or detailed numbers?",
    creates: 'detailPreference',
  },
  {
    id: 'risk_tolerance',
    question: "Which feels more important right now: aggressive growth or steady, predictable progress?",
    creates: 'riskTolerance',
  },
  {
    id: 'economic_red_lines',
    question: "Is there anything financially that would make an action a hard no for you?",
    creates: 'economicRedLines',
  },
] as const;

// ============================================================================
// MISSED-DAY PROTOCOL
// ============================================================================

export type MissedDayChoice = 'UNSET' | 'UNPACK' | 'SKIP';

/**
 * Patterns that trigger missed-day detection
 */
export const MISSED_DAY_PATTERNS = [
  'nothing got done',
  "didn't do anything",
  'blew the day',
  'fell off',
  'got nothing done',
];

/**
 * Detect if user is reporting a missed day
 */
export function detectMissedDay(userText: string): boolean {
  const t = userText.toLowerCase();
  return MISSED_DAY_PATTERNS.some(p => t.includes(p));
}

// ============================================================================
// PRIORITY CONTEXT
// ============================================================================

export type PriorityContextType = 'NONE' | 'BLOCKER' | 'ALIGNMENT';

export interface PriorityContext {
  type: PriorityContextType;
  description: string;
  mayOverridePrimary: boolean;
}

// ============================================================================
// DAILY ACTIONS
// ============================================================================

export type ActionCategory = 'contact' | 'non_contact' | 'admin' | 'planning';
export type ActionType = 'primary' | 'supporting';

export interface ActionItem {
  id: string;
  title: string;
  steps: string[];
  category?: ActionCategory;
  minutesEstimate?: number;
  type: ActionType;
  minimumViableCompletion?: string;
  stretchCompletion?: string;
  milestoneConnection?: string; // How this advances the monthly milestone
}

export interface DailyActionPlan {
  primary: ActionItem;
  secondary: ActionItem[]; // length 0..2
  date: Date;
  explanation?: string; // One sentence tying primary to monthly milestone
}

// ============================================================================
// COACH POLICY STATE
// ============================================================================

/**
 * Complete coaching policy state - tracks conversation behavior
 */
export interface CoachPolicyState {
  // Current conversation behavior state
  mode: CoachMode;

  // Exactly one coaching move at a time (or NONE)
  move: CoachingMove;

  // Hard invariant: must be <= 1
  questionsInLastTurn: number;

  // REFLECT must be confirmed before REFRAME or COMMIT
  reflectionConfirmed: boolean;

  // Missed-day protocol flags
  missedDayDetectedToday: boolean;
  coachingPauseOfferedToday: boolean;
  missedDayChoice: MissedDayChoice;

  // Commitment + delivery
  commitmentText?: string;
  commitmentAccepted: boolean;

  // Daily Action Engine integration
  priorityContext?: PriorityContext;
}

// ============================================================================
// POLICY VIOLATIONS
// ============================================================================

export type PolicyViolation =
  | 'MULTI_QUESTION_TURN'
  | 'MODE_STACKING'
  | 'MOVE_STACKING'
  | 'DIRECT_ASKED_QUESTION'
  | 'DIRECT_REFRAMED'
  | 'SKIP_NOT_RESPECTED'
  | 'REFLECT_NOT_CONFIRMED'
  | 'COMMIT_MULTIPLE'
  | 'PLAN_GENERATED_IN_COMMIT'
  | 'ACTIONS_BEFORE_GA_CONFIRMED';

// ============================================================================
// CALIBRATION STATE
// ============================================================================

export interface CalibrationState {
  userState: UserState;
  tone: CalibrationTone | null;
  currentQuestionIndex: number;
  answers: Record<string, string | string[] | null>;
  goalsAndActions: Partial<GoalsAndActions> | null;
  businessPlan: Partial<BusinessPlan> | null;
  fastLaneTriggered: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Initial calibration state for new users
 */
export const INITIAL_CALIBRATION_STATE: CalibrationState = {
  userState: 'UNINITIALIZED',
  tone: null,
  currentQuestionIndex: 0,
  answers: {},
  goalsAndActions: null,
  businessPlan: null,
  fastLaneTriggered: false,
  startedAt: null,
  completedAt: null,
};

// ============================================================================
// NON-NEGOTIABLE INVARIANTS
// ============================================================================

export const INVARIANTS = {
  ONE_MODE_ONLY: true,
  ONE_MOVE_ONLY: true,
  MAX_ONE_QUESTION_PER_TURN: 1,
  REFLECT_THEN_CONFIRM_THEN_PROCEED: true,
  USER_MAY_SKIP_COACHING: true,
  NO_SHAME_NO_THERAPY_NO_DIAGNOSIS: true,
  FORWARD_MOTION_PRIMARY_OBJECTIVE: true,
  NO_ACTIONS_BEFORE_GA_CONFIRMED: true,
  NO_URGENCY_EVER_RENDERED: true,
  MAX_PRIMARY_ACTIONS: 1,
  MAX_SUPPORTING_ACTIONS: 2,
} as const;

/**
 * Assert that policy state meets all invariants
 */
export function assertInvariants(state: CoachPolicyState): void {
  if (state.questionsInLastTurn > 1) {
    throw new Error('POLICY_VIOLATION: multi-question turn (questionsInLastTurn > 1)');
  }
  if (!state.mode) {
    throw new Error('POLICY_VIOLATION: missing mode');
  }
  if (state.move === undefined) {
    throw new Error('POLICY_VIOLATION: missing move');
  }
}

// ============================================================================
// LOGGING / OBSERVABILITY
// ============================================================================

export interface PolicyLogEvent {
  timestamp: string;
  mode: CoachMode;
  move: CoachingMove;
  questionsInLastTurn: number;
  reflectionConfirmed: boolean;
  missedDayDetectedToday: boolean;
  coachingPauseOfferedToday: boolean;
  missedDayChoice: MissedDayChoice;
  commitmentAccepted: boolean;
  priorityContextType: PriorityContextType;
}

export function createPolicyLogEvent(state: CoachPolicyState): PolicyLogEvent {
  return {
    timestamp: new Date().toISOString(),
    mode: state.mode,
    move: state.move,
    questionsInLastTurn: state.questionsInLastTurn,
    reflectionConfirmed: state.reflectionConfirmed,
    missedDayDetectedToday: state.missedDayDetectedToday,
    coachingPauseOfferedToday: state.coachingPauseOfferedToday,
    missedDayChoice: state.missedDayChoice,
    commitmentAccepted: state.commitmentAccepted,
    priorityContextType: state.priorityContext?.type ?? 'NONE',
  };
}
